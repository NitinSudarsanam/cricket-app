import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/matches?seasonId=&from=&to=&status=
 * List matches with optional filters.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const seasonId = searchParams.get('seasonId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const where: { seasonId?: string; startAt?: { gte?: Date; lte?: Date }; status?: string } = {};
  if (seasonId) where.seasonId = seasonId;
  if (from || to) {
    where.startAt = {};
    if (from) where.startAt.gte = new Date(from);
    if (to) where.startAt.lte = new Date(to);
  }
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.match.findMany({
      where,
      include: {
        localTeam: { select: { id: true, name: true, shortCode: true } },
        visitorTeam: { select: { id: true, name: true, shortCode: true } },
        winnerTeam: { select: { id: true, name: true, shortCode: true } },
      },
      orderBy: { startAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.match.count({ where }),
  ]);

  return Response.json({
    success: true,
    data: {
      items: items.map((m) => ({
        id: m.id,
        externalId: m.externalId,
        seasonId: m.seasonId,
        leagueId: m.leagueId,
        localTeamId: m.localTeamId,
        visitorTeamId: m.visitorTeamId,
        localTeam: m.localTeam,
        visitorTeam: m.visitorTeam,
        winnerTeamId: m.winnerTeamId,
        winnerTeam: m.winnerTeam,
        startAt: m.startAt,
        status: m.status,
        resultSummary: m.resultSummary,
      })),
      total,
    },
  });
}
