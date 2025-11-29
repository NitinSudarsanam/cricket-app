import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';
import { UpdatePlayerRequest, IPL_TEAMS, PLAYER_ROLES } from '@/types';
import { isIPLTeam, isPlayerRole } from '@/lib/type-guards';

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
