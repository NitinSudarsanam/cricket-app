import { NextRequest } from 'next/server';
import * as client from '@/lib/sportmonks/client';

/**
 * GET /api/sportmonks/check
 * Probes the Sportmonks API and returns a summary of available data (leagues, seasons, teams, squad).
 * Optional: Authorization: Bearer <ADMIN_SECRET> or x-admin-secret header.
 */
export async function GET(request: NextRequest) {
  const secret =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.headers.get('x-admin-secret') ||
    '';
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && secret !== adminSecret) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const out: {
    success: boolean;
    tokenSet: boolean;
    leaguesCount?: number;
    sampleLeague?: { id: number; name: string };
    seasonsCount?: number;
    sampleSeason?: { id: number; name: string; leagueId: number };
    teamsCount?: number;
    teamsWithSquadCount?: number;
    squadPlayersCount?: number;
    error?: string;
  } = {
    success: false,
    tokenSet: Boolean(process.env.SPORTMONKS_API_TOKEN),
  };

  if (!out.tokenSet) {
    return Response.json({
      ...out,
      error: 'SPORTMONKS_API_TOKEN is not set',
    });
  }

  try {
    const leagues = await client.getLeagues();
    out.leaguesCount = leagues.length;
    if (leagues.length > 0) {
      const first = leagues[0];
      out.sampleLeague = { id: first.id, name: first.name ?? String(first.id) };

      const seasons = await client.getSeasons(first.id);
      out.seasonsCount = seasons.length;
      if (seasons.length > 0) {
        const firstSeason = seasons[0];
        out.sampleSeason = {
          id: firstSeason.id,
          name: firstSeason.name ?? String(firstSeason.id),
          leagueId: first.id,
        };

        const teamsWithSquad = await client.getTeamsWithSquad(firstSeason.id);
        out.teamsWithSquadCount = teamsWithSquad.length;
        const squadPlayers = teamsWithSquad.flatMap((t) => t.squad ?? []);
        out.squadPlayersCount = squadPlayers.length;
      }
    }

    out.success = true;
    return Response.json(out);
  } catch (e) {
    out.error = e instanceof Error ? e.message : String(e);
    return Response.json(out, { status: 500 });
  }
}
