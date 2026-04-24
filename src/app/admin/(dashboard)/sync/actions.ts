'use server';

import * as sportmonks from '@/lib/sportmonks/client';
import { runFullSync } from '@/services/ingestion/sync-service';

export type SyncResult = Awaited<ReturnType<typeof runFullSync>>;

export type SportmonksCheckResult = {
  success: boolean;
  tokenSet: boolean;
  leaguesCount?: number;
  sampleLeague?: { id: number; name: string };
  seasonsCount?: number;
  sampleSeason?: { id: number; name: string; leagueId: number };
  teamsWithSquadCount?: number;
  squadPlayersCount?: number;
  error?: string;
};

/**
 * Probe Sportmonks API and return a summary of available data (no secret sent from client).
 */
export async function checkSportmonksApi(): Promise<SportmonksCheckResult> {
  const out: SportmonksCheckResult = {
    success: false,
    tokenSet: Boolean(process.env.SPORTMONKS_API_TOKEN),
  };
  if (!out.tokenSet) {
    out.error = 'SPORTMONKS_API_TOKEN is not set';
    return out;
  }
  try {
    const leagues = await sportmonks.getLeagues();
    out.leaguesCount = leagues.length;
    if (leagues.length > 0) {
      const first = leagues[0];
      out.sampleLeague = { id: first.id, name: first.name ?? String(first.id) };
      const seasons = await sportmonks.getSeasons(first.id);
      out.seasonsCount = seasons.length;
      if (seasons.length > 0) {
        const firstSeason = seasons[0];
        out.sampleSeason = {
          id: firstSeason.id,
          name: firstSeason.name ?? String(firstSeason.id),
          leagueId: first.id,
        };
        const teamsWithSquad = await sportmonks.getTeamsWithSquad(firstSeason.id);
        out.teamsWithSquadCount = teamsWithSquad.length;
        out.squadPlayersCount = teamsWithSquad.flatMap((t) => t.squad ?? []).length;
      }
    }
    out.success = true;
    return out;
  } catch (e) {
    out.error = e instanceof Error ? e.message : String(e);
    return out;
  }
}

/**
 * Run full sync from Sportmonks (leagues, seasons, teams, squads, fixtures).
 * Callable only from server; no secret passed from client.
 */
export async function runSyncFromSportmonks(options?: {
  leagueId?: string;
  seasonId?: string;
  from?: string;
  to?: string;
}): Promise<SyncResult> {
  return runFullSync(options);
}
