import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';
import { getCurrentParticipantId, DraftOrderType } from '@/lib/draft-state-manager';
import { DEFAULT_PICK_TIMEOUT_SECONDS, secondsRemainingOnClock } from '@/lib/draft-clock';

/**
 * GET /api/draft/state
 * Fetch current draft state
 * 
 * Query params:
 *   - draftStateId: string (optional) - Specific draft state ID to fetch
 *   - includeDetails: boolean (optional) - Include participant and player details
 * 
 * Requirements: 4.5, 6.3
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftStateId = searchParams.get('draftStateId');
    const includeDetails = searchParams.get('includeDetails') === 'true';

    let draftState;

    if (draftStateId) {
      // Fetch specific draft state
      const specificDraftState = await prisma.draftState.findUnique({
        where: { id: draftStateId },
        include: {
          draftOrders: {
            include: {
              participant: true
            },
            orderBy: {
              position: 'asc'
            }
          },
          picks: {
            include: {
              player: true,
              participant: true
            },
            orderBy: {
              pickNumber: 'asc'
            }
          },
          draftConfig: true
        }
      });

      if (!specificDraftState) {
        return NextResponse.json(
          {
            success: false,
            error: 'Draft state not found'
          },
          { status: 404 }
        );
      }

      draftState = specificDraftState;
    } else {
      // Fetch active draft state
      const activeDraftState = await prisma.draftState.findFirst({
        where: {
          status: {
            in: ['in_progress', 'paused']
          }
        },
        orderBy: {
          startedAt: 'desc'
        },
        include: {
          draftOrders: {
            include: {
              participant: true
            },
            orderBy: {
              position: 'asc'
            }
          },
          picks: {
            include: {
              player: true,
              participant: true
            },
            orderBy: {
              pickNumber: 'asc'
            }
          },
          draftConfig: true
        }
      });

      if (!activeDraftState) {
        // Fall back to most recent draft (any status) so admin can see completed/not_started and reset
        const latestDraftState = await prisma.draftState.findFirst({
          orderBy: { createdAt: 'desc' },
          include: {
            draftOrders: {
              include: { participant: true },
              orderBy: { position: 'asc' }
            },
            picks: {
              include: { player: true, participant: true },
              orderBy: { pickNumber: 'asc' }
            },
            draftConfig: true
          }
        });
        if (!latestDraftState) {
          return NextResponse.json(
            { success: false, error: 'No draft found' },
            { status: 404 }
          );
        }
        draftState = latestDraftState;
      } else {
        draftState = activeDraftState;
      }
    }

    // Transform to response format
    const participantOrder = draftState.draftOrders
      .sort((a, b) => a.position - b.position)
      .map(order => order.participantId);

    const picks = draftState.picks.map(pick => ({
      round: pick.round,
      pickNumber: pick.pickNumber,
      participantId: pick.participantId,
      participantName: pick.participant.name,
      playerId: pick.playerId,
      playerName: pick.player.name,
      playerTeam: pick.player.team,
      playerRole: pick.player.role,
      timestamp: pick.timestamp
    }));

    // Use persisted draft order type from draft state
    const draftOrder: DraftOrderType = (draftState.draftOrderType === 'linear' ? 'linear' : 'snake');

    // Get current participant
    const currentParticipantId = getCurrentParticipantId(
      {
        currentRound: draftState.currentRound,
        currentPickIndex: draftState.currentPickIndex,
        participantOrder,
        draftOrderType: draftOrder,
      },
      draftOrder
    );

    const currentParticipant = draftState.draftOrders.find(
      order => order.participantId === currentParticipantId
    )?.participant;

    // Build response
    const response: any = {
      id: draftState.id,
      currentRound: draftState.currentRound,
      currentPickIndex: draftState.currentPickIndex,
      draftOrderType: draftOrder,
      status: draftState.status,
      participantOrder,
      picks,
      currentParticipant: currentParticipant ? {
        id: currentParticipant.id,
        name: currentParticipant.name
      } : null,
      startedAt: draftState.startedAt,
      completedAt: draftState.completedAt,
      turnStartedAt: draftState.turnStartedAt,
      pickTimeoutSeconds: draftState.draftConfig.pickTimeoutSeconds ?? DEFAULT_PICK_TIMEOUT_SECONDS,
      secondsRemaining: secondsRemainingOnClock(
        draftState.turnStartedAt,
        draftState.draftConfig.pickTimeoutSeconds ?? DEFAULT_PICK_TIMEOUT_SECONDS,
        new Date(),
        draftState.startedAt
      ),
      totalRounds: draftState.draftConfig.totalRounds,
      totalParticipants: participantOrder.length
    };

    // Include detailed information if requested
    if (includeDetails) {
      response.participants = draftState.draftOrders.map(order => ({
        id: order.participant.id,
        name: order.participant.name,
        email: order.participant.email,
        position: order.position
      }));

      response.draftConfig = {
        id: draftState.draftConfig.id,
        rosterSize: draftState.draftConfig.rosterSize,
        totalRounds: draftState.draftConfig.totalRounds,
        minPerTeam: draftState.draftConfig.minPerTeam,
        maxPerTeam: draftState.draftConfig.maxPerTeam,
        mandatoryRoles: {
          Bat: draftState.draftConfig.mandatoryBat,
          Bowl: draftState.draftConfig.mandatoryBowl,
          AR: draftState.draftConfig.mandatoryAR,
          WK: draftState.draftConfig.mandatoryWK
        },
        earlyRoundRule: {
          rounds: draftState.draftConfig.earlyRounds,
          minBat: draftState.draftConfig.earlyMinBat,
          minBowl: draftState.draftConfig.earlyMinBowl
        },
        isLocked: draftState.draftConfig.isLocked
      };
    }

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching draft state:', error);
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}
