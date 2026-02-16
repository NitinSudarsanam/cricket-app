import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/seasons?leagueId=
 * List seasons, optionally filtered by league.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const leagueId = searchParams.get('leagueId');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const where = leagueId ? { leagueId } : {};
  const [items, total] = await Promise.all([
    prisma.season.findMany({
      where,
      include: { league: { select: { id: true, name: true, slug: true } } },
      orderBy: { startDate: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.season.count({ where }),
  ]);

  return Response.json({
    success: true,
    data: {
      items: items.map((s) => ({
        id: s.id,
        externalId: s.externalId,
        name: s.name,
        startDate: s.startDate,
        endDate: s.endDate,
        leagueId: s.leagueId,
        league: s.league,
      })),
      total,
    },
  });
}
