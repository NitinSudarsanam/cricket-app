import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';
import { Player } from '@/types';

/**
 * GET /api/draft/results
 * Get final draft results with roster validation
 * 
 * Query params:
 *   - draftStateId: string (optional) - Specific draft state ID
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftStateId = searchParams.get('draftStateId');

    // Get the draft state
    let draftState;
    if (draftStateId) {
      draftState = await prisma.draftState.findUnique({
        where: { id: draftStateId },
        include: {
          draftConfig: true,
          picks: {
            include: {
              player: true,
              participant: true
            },
            orderBy: {
              pickNumber: 'asc'
            }
          },
          draftOrders: {
            include: {
              participant: true
            },
            orderBy: {
              position: 'asc'
            }
          }
        }
      });
    } else {
      // Get most recent completed draft
      draftState = await prisma.draftState.findFirst({
        where: {
          status: 'completed'
        },
        orderBy: {
          completedAt: 'desc'
        },
        include: {
          draftConfig: true,
          picks: {
            include: {
              player: true,
              participant: true
            },
            orderBy: {
              pickNumber: 'asc'
            }
          },
          draftOrders: {
            include: {
              participant: true
            },
            orderBy: {
              position: 'asc'
            }
          }
        }
      });
    }

    if (!draftState) {
      return NextResponse.json(
        {
          success: false,
          error: 'No completed draft found'
        },
        { status: 404 }
      );
    }

    // Build rosters for each participant
    const participantRosters = draftState.draftOrders.map(order => {
      const participantPicks = draftState.picks.filter(
        pick => pick.participantId === order.participantId
      );

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

      // Calculate team counts
      const teamCount: Record<string, number> = {};
      roster.forEach(player => {
        teamCount[player.team] = (teamCount[player.team] || 0) + 1;
      });

      // Calculate role counts
      const roleCount = {
        Bat: roster.filter(p => p.role === 'Bat').length,
        Bowl: roster.filter(p => p.role === 'Bowl').length,
        AR: roster.filter(p => p.role === 'AR').length,
        WK: roster.filter(p => p.role === 'WK').length
      };

      // Validate mandatory role requirements
      const mandatoryRoles = {
        Bat: draftState.draftConfig.mandatoryBat,
        Bowl: draftState.draftConfig.mandatoryBowl,
        AR: draftState.draftConfig.mandatoryAR,
        WK: draftState.draftConfig.mandatoryWK
      };

      const roleValidation = {
        Bat: roleCount.Bat >= mandatoryRoles.Bat,
        Bowl: roleCount.Bowl >= mandatoryRoles.Bowl,
        AR: roleCount.AR >= mandatoryRoles.AR,
        WK: roleCount.WK >= mandatoryRoles.WK
      };

      const allRolesMet = Object.values(roleValidation).every(v => v);

      return {
        participantId: order.participantId,
        participantName: order.participant.name,
        participantEmail: order.participant.email,
        position: order.position,
        roster,
        teamCount,
        roleCount,
        mandatoryRoles,
        roleValidation,
        allRolesMet
      };
    });

    // Overall validation
    const allParticipantsMeetRequirements = participantRosters.every(
      pr => pr.allRolesMet
    );

    return NextResponse.json({
      success: true,
      data: {
        draftState: {
          id: draftState.id,
          status: draftState.status,
          startedAt: draftState.startedAt,
          completedAt: draftState.completedAt,
          totalRounds: draftState.draftConfig.totalRounds
        },
        draftConfig: {
          rosterSize: draftState.draftConfig.rosterSize,
          totalRounds: draftState.draftConfig.totalRounds,
          minPerTeam: draftState.draftConfig.minPerTeam,
          maxPerTeam: draftState.draftConfig.maxPerTeam,
          mandatoryRoles: {
            Bat: draftState.draftConfig.mandatoryBat,
            Bowl: draftState.draftConfig.mandatoryBowl,
            AR: draftState.draftConfig.mandatoryAR,
            WK: draftState.draftConfig.mandatoryWK
          }
        },
        participantRosters,
        allParticipantsMeetRequirements,
        totalPicks: draftState.picks.length
      }
    });
  } catch (error) {
    console.error('Error fetching draft results:', error);
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}
