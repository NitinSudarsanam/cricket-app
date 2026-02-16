import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/teams?leagueId=&seasonId=
 * List teams, optionally filtered by league or season (teams that have played in that season).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const leagueId = searchParams.get('leagueId');
  const seasonId = searchParams.get('seasonId');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const where: { leagueId?: string | null; id?: { in: string[] } } = {};
  if (leagueId) where.leagueId = leagueId;
  if (seasonId) {
    const teamScores = await prisma.teamScore.findMany({
      where: { seasonId },
      select: { teamId: true },
    });
    const teamIds = [...new Set(teamScores.map((r) => r.teamId))];
    where.id = teamIds.length ? { in: teamIds } : { in: [] };
  }

  const [items, total] = await Promise.all([
    prisma.team.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
    }),
    prisma.team.count({ where }),
  ]);
  return Response.json({ success: true, data: { items, total } });
}
