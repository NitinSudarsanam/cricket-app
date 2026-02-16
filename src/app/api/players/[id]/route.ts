import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';
import { UpdatePlayerRequest, IPL_TEAMS, PLAYER_ROLES } from '@/types';
import { isIPLTeam, isPlayerRole } from '@/lib/type-guards';

/**
 * GET /api/players/:id?includeScores=true&seasonId=
 * Get player by id; optionally include PlayerScore for the given seasonId.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeScores = searchParams.get('includeScores') === 'true';
    const seasonId = searchParams.get('seasonId');

    const player = await prisma.player.findUnique({
      where: { id },
      include:
        includeScores && seasonId
          ? {
              playerScores: {
                where: { seasonId },
                take: 1,
                orderBy: { updatedAt: 'desc' },
              },
            }
          : undefined,
    });

    if (!player) {
      return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {
      id: player.id,
      name: player.name,
      team: player.team,
      role: player.role,
      isForeign: player.isForeign,
      metadata: player.metadata,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    };
    const scores = 'playerScores' in player && Array.isArray(player.playerScores) ? player.playerScores : [];
    if (includeScores && scores.length) {
      data.scores = scores.map((ps: { seasonId: string | null; points: number; source: string; updatedAt: Date }) => ({
        seasonId: ps.seasonId,
        points: ps.points,
        source: ps.source,
        updatedAt: ps.updatedAt,
      }));
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { success: false, error: handleDatabaseError(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/players/:id
 * Update an existing player
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdatePlayerRequest = await request.json();

    // Validate team if provided
    if (body.team && !isIPLTeam(body.team)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid team. Must be one of: ${IPL_TEAMS.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (body.role && !isPlayerRole(body.role)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid role. Must be one of: ${PLAYER_ROLES.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Check if player exists
    const existingPlayer = await prisma.player.findUnique({
      where: { id }
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Player not found'
        },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.team !== undefined) updateData.team = body.team;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.isForeign !== undefined) updateData.isForeign = body.isForeign;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    // Update player
    const player = await prisma.player.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ 
      success: true,
      data: player
    });
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { 
        success: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/players/:id
 * Delete a player from database
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if player exists
    const existingPlayer = await prisma.player.findUnique({
      where: { id }
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Player not found'
        },
        { status: 404 }
      );
    }

    // Check if player is in an active draft
    const activePick = await prisma.pick.findFirst({
      where: {
        playerId: id,
        draftState: {
          status: {
            in: ['in_progress', 'paused']
          }
        }
      }
    });

    if (activePick) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete player who is in an active draft'
        },
        { status: 400 }
      );
    }

    // Delete player
    await prisma.player.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { 
        success: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}
