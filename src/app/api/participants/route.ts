import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';

/**
 * GET /api/participants
 * Fetch all participants
 * Query params:
 *   - includeRoster: boolean (optional) - Include roster data if true
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeRoster = searchParams.get('includeRoster') === 'true';

    const participants = await prisma.participant.findMany({
      orderBy: { name: 'asc' },
      include: includeRoster ? {
        picks: {
          include: {
            player: true
          }
        }
      } : undefined
    });

    // If roster data is requested, transform the response to include roster summary
    const data = includeRoster 
      ? participants.map(participant => {
          const players = (participant as any).picks.map((pick: any) => pick.player);
          
          // Calculate team counts
          const teamCount: Record<string, number> = {};
          players.forEach((player: any) => {
            teamCount[player.team] = (teamCount[player.team] || 0) + 1;
          });

          // Calculate role counts
          const roleCount: Record<string, number> = {};
          players.forEach((player: any) => {
            roleCount[player.role] = (roleCount[player.role] || 0) + 1;
          });

          return {
            id: participant.id,
            name: participant.name,
            email: participant.email,
            createdAt: participant.createdAt,
            updatedAt: participant.updatedAt,
            roster: {
              players,
              teamCount,
              roleCount,
              totalPlayers: players.length
            }
          };
        })
      : participants;

    return NextResponse.json({
      success: true,
      data,
      count: participants.length
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
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
 * POST /api/participants
 * Create a new participant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: name is required'
        },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid email format'
          },
          { status: 400 }
        );
      }
    }

    // Create participant with empty roster and counts
    const participant = await prisma.participant.create({
      data: {
        name: body.name.trim(),
        email: body.email?.trim() || null
      }
    });

    // Return participant with initialized empty roster
    return NextResponse.json(
      {
        success: true,
        data: {
          ...participant,
          roster: {
            players: [],
            teamCount: {},
            roleCount: {},
            totalPlayers: 0
          }
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating participant:', error);
    
    // Handle unique constraint violation for email
    const errorMessage = handleDatabaseError(error);
    const statusCode = errorMessage.includes('already exists') ? 409 : 500;
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: statusCode }
    );
  }
}
