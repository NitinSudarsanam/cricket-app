import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/teams/:id
 * Team detail and current season points if available.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      league: true,
      teamScores: {
        include: { season: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      },
    },
  });
  if (!team) {
    return Response.json({ success: false, error: 'Team not found' }, { status: 404 });
  }
  return Response.json({
    success: true,
    data: {
      id: team.id,
      externalId: team.externalId,
      name: team.name,
      shortCode: team.shortCode,
      imageUrl: team.imageUrl,
      leagueId: team.leagueId,
      league: team.league
        ? { id: team.league.id, name: team.league.name, slug: team.league.slug }
        : null,
      teamScores: team.teamScores.map((ts) => ({
        seasonId: ts.seasonId,
        seasonName: ts.season.name,
        points: ts.points,
        matchesPlayed: ts.matchesPlayed,
        wins: ts.wins,
        ties: ts.ties,
        noResults: ts.noResults,
        losses: ts.losses,
        lastMatchAt: ts.lastMatchAt,
      })),
    },
  });
}
