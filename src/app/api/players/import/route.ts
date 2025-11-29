import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';
import { CreatePlayerRequest, IPL_TEAMS, PLAYER_ROLES } from '@/types';
import { isIPLTeam, isPlayerRole } from '@/lib/type-guards';

interface ImportError {
  row: number;
  player: Partial<CreatePlayerRequest>;
  errors: string[];
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
  players?: any[];
}

/**
 * Validate a single player record
 */
function validatePlayerRecord(player: any, rowIndex: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!player.name || typeof player.name !== 'string' || player.name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }

  if (!player.team) {
    errors.push('Team is required');
  } else if (!isIPLTeam(player.team)) {
    errors.push(`Invalid team "${player.team}". Must be one of: ${IPL_TEAMS.join(', ')}`);
  }

  if (!player.role) {
    errors.push('Role is required');
  } else if (!isPlayerRole(player.role)) {
    errors.push(`Invalid role "${player.role}". Must be one of: ${PLAYER_ROLES.join(', ')}`);
  }

  // Validate isForeign if provided
  if (player.isForeign !== undefined && typeof player.isForeign !== 'boolean') {
    errors.push('isForeign must be a boolean value');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * POST /api/players/import
 * Bulk import players from JSON array
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate that body is an array
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Request body must be an array of player objects'
        },
        { status: 400 }
      );
    }

    if (body.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot import empty array'
        },
        { status: 400 }
      );
    }

    const validPlayers: CreatePlayerRequest[] = [];
    const importErrors: ImportError[] = [];

    // Validate each player record
    body.forEach((player, index) => {
      const validation = validatePlayerRecord(player, index);
      
      if (validation.valid) {
        validPlayers.push({
          name: player.name.trim(),
          team: player.team,
          role: player.role,
          isForeign: player.isForeign ?? false,
          metadata: player.metadata ?? null
        });
      } else {
        importErrors.push({
          row: index + 1,
          player,
          errors: validation.errors
        });
      }
    });

    // If no valid players, return error
    if (validPlayers.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid players to import',
          imported: 0,
          failed: importErrors.length,
          errors: importErrors
        },
        { status: 400 }
      );
    }

    // Bulk insert valid players
    const result = await prisma.player.createMany({
      data: validPlayers,
      skipDuplicates: false // Will fail if duplicate IDs exist
    });

    const importResult: ImportResult = {
      success: true,
      imported: result.count,
      failed: importErrors.length,
      errors: importErrors
    };

    // Fetch the newly created players to return them
    if (result.count > 0) {
      const importedPlayers = await prisma.player.findMany({
        orderBy: { createdAt: 'desc' },
        take: result.count
      });
      importResult.players = importedPlayers;
    }

    return NextResponse.json(importResult, { 
      status: importErrors.length > 0 ? 207 : 201 // 207 Multi-Status if partial success
    });
  } catch (error) {
    console.error('Error importing players:', error);
    return NextResponse.json(
      { 
        success: false,
        error: handleDatabaseError(error),
        imported: 0,
        failed: 0,
        errors: []
      },
      { status: 500 }
    );
  }
}
