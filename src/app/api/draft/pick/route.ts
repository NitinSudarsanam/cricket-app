import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';
import { prismaDraftConfigToDraftConfig, prismaPlayerToPlayer } from '@/lib/model-mappers';
import { validatePick } from '@/lib/rule-engine';
import {
  getActiveDraftState,
  getCurrentParticipantId,
  DraftOrderType
} from '@/lib/draft-state-manager';
import { commitPick } from '@/lib/draft-pick-service';
import { getParticipantSession } from '@/lib/session';

/**
 * POST /api/draft/pick
 * Make a player selection during the draft
 * 
 * Request body:
 *   - participantId: string - The ID of the participant making the pick
 *   - playerId: string - The ID of the player being picked
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.participantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'participantId is required'
        },
        { status: 400 }
      );
    }

    if (!body.playerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'playerId is required'
        },
        { status: 400 }
      );
    }

    const { participantId, playerId } = body;

    // Verify participant session (defense-in-depth - middleware also checks)
    const session = await getParticipantSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (session.participantId !== participantId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get the active draft state - force fresh read
    // Force Prisma to bypass any caching
    const draftState = await getActiveDraftState();

    if (!draftState) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active draft found. Please start a draft first.'
        },
        { status: 404 }
      );
    }

    // Check if draft is paused
    if (draftState.status === 'paused') {
      return NextResponse.json(
        {
          success: false,
          error: 'Draft is currently paused. Please resume the draft to continue.'
        },
        { status: 409 }
      );
    }

    // Get draft configuration
    const prismaDraftConfig = await prisma.draftConfig.findUnique({
      where: { id: draftState.draftConfigId! }
    });

    if (!prismaDraftConfig) {
      return NextResponse.json(
        {
          success: false,
          error: 'Draft configuration not found'
        },
        { status: 404 }
      );
    }

    const draftConfig = prismaDraftConfigToDraftConfig(prismaDraftConfig);

    // Use persisted draft order type from when draft was started
    const draftOrder: DraftOrderType = (draftState.draftOrderType === 'linear' ? 'linear' : 'snake');

    // Verify it's the correct participant's turn
    const currentParticipantId = getCurrentParticipantId(draftState, draftOrder);

    if (currentParticipantId !== participantId) {
      // Log debug info server-side only (security: don't expose internal state)
      console.log('Pick attempted out of turn:', {
        currentRound: draftState.currentRound,
        currentPickIndex: draftState.currentPickIndex,
        expectedParticipant: currentParticipantId,
        attemptedParticipant: participantId,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'It is not your turn.'
        },
        { status: 403 }
      );
    }

    // Get the player being picked
    const prismaPlayer = await prisma.player.findUnique({
      where: { id: playerId }
    });

    if (!prismaPlayer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Player not found'
        },
        { status: 404 }
      );
    }

    const player = prismaPlayerToPlayer(prismaPlayer);

    // Get participant's current roster
    const participantPicks = await prisma.pick.findMany({
      where: {
        draftStateId: draftState.id,
        participantId
      },
      include: {
        player: true
      }
    });

    const roster = participantPicks.map((pick) => prismaPlayerToPlayer(pick.player));

    // Get all drafted player IDs
    const draftedPlayerIds = draftState.picks.map(pick => pick.playerId);

    // Validate the pick
    const validation = validatePick(
      player,
      roster,
      draftState.currentRound,
      draftConfig,
      draftedPlayerIds
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pick',
          validationErrors: validation.errors || [validation.error]
        },
        { status: 400 }
      );
    }

    const committed = await commitPick({
      draftState,
      draftConfig,
      participantId,
      player,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          draftState: committed.draftState,
          pick: committed.pick,
          message: `${committed.pick.participantName} selected ${player.name} (${player.team} - ${player.role})`
        }
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('CONFLICT:')) {
      return NextResponse.json(
        { success: false, error: message.replace('CONFLICT: ', '') },
        { status: 409 }
      );
    }
    console.error('Error making pick:', error);
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}
