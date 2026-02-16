import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';
import { prismaDraftConfigToDraftConfig } from '@/lib/model-mappers';
import { validateDraftConfiguration } from '@/lib/rule-engine';
import { initializeDraftState, DraftOrderType } from '@/lib/draft-state-manager';
import { broadcastEvent, EVENTS } from '@/lib/pusher-server';

/**
 * POST /api/draft/start
 * Initialize and start the draft
 * 
 * Request body:
 *   - participantIds: string[] - Array of participant IDs in draft order
 *   - draftOrder: 'linear' | 'snake' (optional, defaults to 'snake')
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.participantIds || !Array.isArray(body.participantIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'participantIds is required and must be an array'
        },
        { status: 400 }
      );
    }

    if (body.participantIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one participant is required'
        },
        { status: 400 }
      );
    }

    const participantIds: string[] = body.participantIds;
    const draftOrder: DraftOrderType = body.draftOrder === 'linear' ? 'linear' : 'snake';

    // Check if there's already an active draft
    const activeDraft = await prisma.draftState.findFirst({
      where: {
        status: {
          in: ['in_progress', 'paused']
        }
      }
    });

    if (activeDraft) {
      return NextResponse.json(
        {
          success: false,
          error: 'A draft is already in progress. Please complete or reset it before starting a new one.'
        },
        { status: 409 }
      );
    }

    // Get the draft configuration
    const prismaDraftConfig = await prisma.draftConfig.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!prismaDraftConfig) {
      return NextResponse.json(
        {
          success: false,
          error: 'No draft configuration found. Please create a configuration first.'
        },
        { status: 404 }
      );
    }

    // Check if configuration is already locked
    if (prismaDraftConfig.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Draft configuration is already locked. Reset the previous draft to unlock.'
        },
        { status: 409 }
      );
    }

    // Optional: require that sync has been run before draft (set REQUIRE_SYNC_BEFORE_DRAFT=true to enable)
    const requireSync = process.env.REQUIRE_SYNC_BEFORE_DRAFT === 'true' || process.env.REQUIRE_SYNC_BEFORE_DRAFT === '1';
    if (requireSync) {
      const [leagueCount, seasonCount] = await Promise.all([
        prisma.league.count(),
        prisma.season.count(),
      ]);
      if (leagueCount === 0 || seasonCount === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sync team data from Sportmonks first via Admin → Sync, then try starting the draft again.'
          },
          { status: 400 }
        );
      }
    }

    // Map Prisma config to DraftConfig interface
    const draftConfig = prismaDraftConfigToDraftConfig(prismaDraftConfig);

    // Verify all participants exist
    const participants = await prisma.participant.findMany({
      where: {
        id: {
          in: participantIds
        }
      }
    });

    if (participants.length !== participantIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'One or more participant IDs are invalid'
        },
        { status: 400 }
      );
    }

    // Get all players for validation
    const players = await prisma.player.findMany();

    // Map Prisma players to Player interface
    const mappedPlayers = players.map(p => ({
      id: p.id,
      name: p.name,
      team: p.team as any,
      role: p.role as any,
      isForeign: p.isForeign,
      metadata: p.metadata as Record<string, any> | undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    // Validate draft configuration
    const validation = validateDraftConfiguration(
      draftConfig,
      mappedPlayers,
      participantIds.length
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Draft configuration is invalid',
          validationErrors: validation.errors || [validation.error]
        },
        { status: 400 }
      );
    }

    // Initialize draft state
    const draftState = await initializeDraftState(
      prismaDraftConfig.id,
      participantIds,
      draftOrder
    );

    // Lock the configuration
    await prisma.draftConfig.update({
      where: { id: prismaDraftConfig.id },
      data: { isLocked: true }
    });

    // Broadcast state update to all clients
    await broadcastEvent(EVENTS.STATE_UPDATE, {
      draftState,
      draftConfig,
      message: 'Draft started successfully'
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          draftState,
          draftConfig,
          message: 'Draft started successfully'
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error starting draft:', error);
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}
