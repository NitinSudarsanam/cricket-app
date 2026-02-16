import { NextRequest } from 'next/server';
import { getTeamLeaderboard } from '@/services/leaderboard/leaderboard-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const seasonId = searchParams.get('seasonId');
  if (!seasonId) {
    return Response.json(
      { success: false, error: 'seasonId is required' },
      { status: 400 }
    );
  }
  const leagueId = searchParams.get('leagueId') ?? undefined;
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  const sort = (searchParams.get('sort') as 'points' | '-points' | 'name') ?? 'points';

  try {
    const data = await getTeamLeaderboard({
      seasonId,
      leagueId: leagueId || null,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sort,
    });
    return Response.json({ success: true, data });
  } catch (e) {
    console.error('Leaderboard teams error:', e);
    return Response.json(
      { success: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
