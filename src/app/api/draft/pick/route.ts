import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';
import { prismaDraftConfigToDraftConfig } from '@/lib/model-mappers';
import { validatePick } from '@/lib/rule-engine';
import {
  getActiveDraftState,
  getDraftState,
  getCurrentParticipantId,
  calculatePickNumber,
  DraftOrderType
} from '@/lib/draft-state-manager';
import { Player } from '@/types';
import { broadcastEvent, EVENTS } from '@/lib/pusher-server';
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

    const player: Player = {
      id: prismaPlayer.id,
      name: prismaPlayer.name,
      team: prismaPlayer.team as any,
      role: prismaPlayer.role as any,
      isForeign: prismaPlayer.isForeign,
      metadata: prismaPlayer.metadata as Record<string, any> | undefined,
      createdAt: prismaPlayer.createdAt,
      updatedAt: prismaPlayer.updatedAt
    };

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

    const roster: Player[] = participantPicks.map(pick => ({
      id: pick.player.id,
      name: pick.player.name,
      team: pick.player.team as any,
      role: pick.player.role as any,
      isForeign: pick.player.isForeign,
      metadata: pick.player.metadata as Record<string, any> | undefined,
      createdAt: pick.player.createdAt,
      updatedAt: pick.player.updatedAt
    }));

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

    // Calculate pick number
    const pickNumber = calculatePickNumber(
      draftState.currentRound,
      draftState.currentPickIndex,
      draftState.participantOrder.length
    );

    // Run pick + advance in a transaction with row-level lock to prevent race conditions
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM "DraftState" WHERE id = ${draftState.id} FOR UPDATE`;
      const locked = await tx.draftState.findUnique({
        where: { id: draftState.id },
        include: {
          draftOrders: { orderBy: { position: 'asc' } },
          picks: true,
        },
      });
      if (!locked) throw new Error('Draft state not found');
      const orderType = locked.draftOrderType === 'linear' ? 'linear' : 'snake';
      const participantOrder = locked.draftOrders.map((o) => o.participantId);
      const currentForTurn =
        orderType === 'snake' && locked.currentRound % 2 === 0
          ? participantOrder[participantOrder.length - 1 - locked.currentPickIndex]
          : participantOrder[locked.currentPickIndex];
      if (currentForTurn !== participantId) {
        throw new Error('CONFLICT: It is not your turn (another pick may have been made)');
      }
      const alreadyPicked = locked.picks.some((p) => p.playerId === playerId);
      if (alreadyPicked) {
        throw new Error('CONFLICT: Player already drafted');
      }
      await tx.pick.create({
        data: {
          draftStateId: draftState.id,
          participantId,
          playerId,
          round: draftState.currentRound,
          pickNumber,
          timestamp: new Date(),
        },
      });
      let nextRound = locked.currentRound;
      let nextIndex = locked.currentPickIndex;
      const isSnakeRound = orderType === 'snake' && nextRound % 2 === 0;
      if (isSnakeRound) {
        nextIndex--;
        if (nextIndex < 0) {
          nextRound++;
          nextIndex = 0;
        }
      } else {
        nextIndex++;
        if (nextIndex >= participantOrder.length) {
          nextRound++;
          nextIndex =
            orderType === 'snake' && nextRound % 2 === 0 ? participantOrder.length - 1 : 0;
        }
      }
      const isComplete = nextRound > draftConfig.totalRounds;
      await tx.draftState.update({
        where: { id: draftState.id },
        data: {
          currentRound: isComplete ? draftConfig.totalRounds : nextRound,
          currentPickIndex: isComplete ? participantOrder.length - 1 : nextIndex,
          status: isComplete ? 'completed' : locked.status,
          completedAt: isComplete ? new Date() : null,
        },
      });
    });

    // Fetch updated state by ID (not getActiveDraftState, which only finds 'in_progress'/'paused')
    // This ensures we can return the draft state even if it just transitioned to 'completed'
    const updatedState = await getDraftState(draftState.id);
    if (!updatedState) {
      return NextResponse.json(
        { success: false, error: 'Failed to load draft state after pick' },
        { status: 500 }
      );
    }

    // Get participant name for response
    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    });

    const pickData = {
      participantId,
      participantName: participant?.name,
      playerId,
      playerName: player.name,
      playerTeam: player.team,
      playerRole: player.role,
      round: draftState.currentRound,
      pickNumber,
      timestamp: new Date()
    };

    // Broadcast pick_made event to all clients
    await broadcastEvent(EVENTS.PICK_MADE, {
      pick: pickData,
      draftState: updatedState
    });

    // Check if round is complete (all participants have picked in this round)
    const previousRound = draftState.currentRound;
    const isRoundComplete = updatedState.currentRound > previousRound;

    if (isRoundComplete) {
      await broadcastEvent(EVENTS.ROUND_COMPLETE, {
        completedRound: previousRound,
        draftState: updatedState
      });
    }

    // Check if draft is complete
    if (updatedState.status === 'completed') {
      await broadcastEvent(EVENTS.DRAFT_COMPLETE, {
        draftState: updatedState,
        completedAt: new Date()
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          draftState: updatedState,
          pick: pickData,
          message: `${participant?.name} selected ${player.name} (${player.team} - ${player.role})`
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
