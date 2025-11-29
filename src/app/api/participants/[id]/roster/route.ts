import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';
import { IPL_TEAMS, PLAYER_ROLES, IPLTeam, PlayerRole } from '@/types';

/**
 * GET /api/participants/:id/roster
 * Fetch participant's complete roster with team and role counts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch participant with their picks and player data
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: {
        picks: {
          include: {
            player: true
          },
          orderBy: {
            pickNumber: 'asc'
          }
        }
      }
    });

    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Participant not found'
        },
        { status: 404 }
      );
    }

    // Extract players from picks
    const players = participant.picks.map(pick => pick.player);

    // Initialize team counts with all IPL teams set to 0
    const teamCount: Record<IPLTeam, number> = {} as Record<IPLTeam, number>;
    IPL_TEAMS.forEach(team => {
      teamCount[team] = 0;
    });

    // Calculate actual team counts
    players.forEach(player => {
      teamCount[player.team as IPLTeam] = (teamCount[player.team as IPLTeam] || 0) + 1;
    });

    // Initialize role counts with all roles set to 0
    const roleCount: Record<PlayerRole, number> = {} as Record<PlayerRole, number>;
    PLAYER_ROLES.forEach(role => {
      roleCount[role] = 0;
    });

    // Calculate actual role counts
    players.forEach(player => {
      roleCount[player.role as PlayerRole] = (roleCount[player.role as PlayerRole] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        participantId: participant.id,
        participantName: participant.name,
        email: participant.email,
        players,
        teamCount,
        roleCount,
        totalPlayers: players.length,
        createdAt: participant.createdAt,
        updatedAt: participant.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching participant roster:', error);
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}
