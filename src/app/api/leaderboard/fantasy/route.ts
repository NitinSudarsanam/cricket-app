import { NextRequest, NextResponse } from 'next/server';
import { getFantasyLeaderboard } from '@/services/leaderboard/leaderboard-service';
import { handleDatabaseError } from '@/lib/db';

/**
 * GET /api/leaderboard/fantasy
 * Fetch fantasy leaderboard (participants ranked by drafted player points)
 * 
 * Query params:
 *   - draftStateId: string (required)
 *   - seasonId: string (required)
 *   - limit: number (optional, default 20, max 100)
 *   - offset: number (optional, default 0)
 *   - sort: 'points' | 'name' (optional, default 'points')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const draftStateId = searchParams.get('draftStateId');
    const seasonId = searchParams.get('seasonId');
    
    if (!draftStateId) {
      return NextResponse.json(
        { success: false, error: 'draftStateId is required' },
        { status: 400 }
      );
    }
    
    if (!seasonId) {
      return NextResponse.json(
        { success: false, error: 'seasonId is required' },
        { status: 400 }
      );
    }

    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const sort = (searchParams.get('sort') as 'points' | 'name') ?? 'points';

    const result = await getFantasyLeaderboard({
      draftStateId,
      seasonId,
      limit,
      offset,
      sort,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching fantasy leaderboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error),
      },
      { status: 500 }
    );
  }
}
