import { NextRequest, NextResponse } from 'next/server';
import { prisma, handleDatabaseError, isDatabaseTimeoutError } from '@/lib/db';
import { CreatePlayerRequest, Player, IPL_TEAMS, PLAYER_ROLES } from '@/types';
import { isIPLTeam, isPlayerRole } from '@/lib/type-guards';

/**
 * GET /api/players
 * Fetch all players from database
 */
export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: [
        { team: 'asc' },
        { role: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ 
      success: true,
      data: players,
      count: players.length
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    const message = handleDatabaseError(error);
    const status = isDatabaseTimeoutError(error) ? 503 : 500;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

/**
 * POST /api/players
 * Create a new player
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreatePlayerRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.team || !body.role) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: name, team, and role are required'
        },
        { status: 400 }
      );
    }

    // Validate team
    if (!isIPLTeam(body.team)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid team. Must be one of: ${IPL_TEAMS.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate role
    if (!isPlayerRole(body.role)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid role. Must be one of: ${PLAYER_ROLES.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Create player
    const player = await prisma.player.create({
      data: {
        name: body.name.trim(),
        team: body.team,
        role: body.role,
        isForeign: body.isForeign ?? false,
        metadata: body.metadata ?? undefined
      }
    });

    return NextResponse.json(
      { 
        success: true,
        data: player
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating player:', error);
    const message = handleDatabaseError(error);
    const status = isDatabaseTimeoutError(error) ? 503 : 500;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
