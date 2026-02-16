/**
 * Sync service: orchestrate fetch from Sportmonks + upsert (leagues, seasons, teams, fixtures)
 * and process finished matches (MatchResult + ranking engine).
 */

import { prisma } from '@/lib/db';
import * as client from '@/lib/sportmonks/client';
import {
  mapApiFixtureToMatch,
  mapApiLeagueToLeague,
  mapApiSeasonToSeason,
  mapApiTeamToTeam,
} from '@/lib/sportmonks/mappers';
import { processMatchResult } from '@/services/ranking/ranking-engine';
import { updatePlayerScoresFromTeamScores } from '@/services/ranking/player-ranking-service';
import { syncSquadToPlayers } from '@/services/ingestion/squad-to-player';

const FINISHED_STATUSES = ['FT', 'finished', 'AOT', 'AWD', 'ABD'];

export interface SyncResult {
  leaguesUpserted: number;
  seasonsUpserted: number;
  teamsUpserted: number;
  playersUpserted: number;
  matchesUpserted: number;
  matchResultsProcessed: number;
  errors: string[];
}

/** Upsert leagues and their seasons from API. */
export async function syncLeaguesAndSeasons(): Promise<{ leagues: number; seasons: number; errors: string[] }> {
  const errors: string[] = [];
  let leagues = 0;
  let seasons = 0;

  try {
    const apiLeagues = await client.getLeagues();
    for (const apiLeague of apiLeagues) {
      try {
        const norm = mapApiLeagueToLeague(apiLeague);
        await prisma.league.upsert({
          where: { externalId: norm.externalId },
          create: {
            externalId: norm.externalId,
            name: norm.name,
            slug: norm.slug,
            imageUrl: norm.imageUrl,
          },
          update: {
            name: norm.name,
            slug: norm.slug,
            imageUrl: norm.imageUrl,
          },
        });
        leagues++;

        const apiSeasons = await client.getSeasons(apiLeague.id);
        const league = await prisma.league.findUnique({ where: { externalId: norm.externalId } });
        if (!league) continue;

        for (const apiSeason of apiSeasons) {
          try {
            const seasonNorm = mapApiSeasonToSeason(apiSeason, league.id);
            await prisma.season.upsert({
              where: { externalId: seasonNorm.externalId },
              create: {
                externalId: seasonNorm.externalId,
                leagueId: seasonNorm.leagueId,
                name: seasonNorm.name,
                startDate: seasonNorm.startDate,
                endDate: seasonNorm.endDate,
              },
              update: {
                name: seasonNorm.name,
                startDate: seasonNorm.startDate,
                endDate: seasonNorm.endDate,
              },
            });
            seasons++;
          } catch (e) {
            errors.push(`Season ${apiSeason.id}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      } catch (e) {
        errors.push(`League ${apiLeague.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  return { leagues, seasons, errors };
}

/** Sync teams for a league. Cricket API only allows filter[season_id] on teams, so we fetch teams per season. */
export async function syncTeamsForLeague(leagueId: string): Promise<{ teams: number; errors: string[] }> {
  const errors: string[] = [];
  let teams = 0;

  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (!league) {
    errors.push(`League not found: ${leagueId}`);
    return { teams: 0, errors };
  }

  const seasons = await prisma.season.findMany({ where: { leagueId }, select: { id: true, externalId: true } });
  for (const season of seasons) {
    const apiSeasonId = Number(season.externalId);
    if (Number.isNaN(apiSeasonId)) continue;
    try {
      const apiTeams = await client.getTeamsBySeason(apiSeasonId);
      for (const apiTeam of apiTeams) {
        try {
          const norm = mapApiTeamToTeam(apiTeam, leagueId);
          await prisma.team.upsert({
            where: { externalId: norm.externalId },
            create: {
              externalId: norm.externalId,
              leagueId: norm.leagueId,
              name: norm.name,
              shortCode: norm.shortCode,
              imageUrl: norm.imageUrl,
            },
            update: {
              leagueId: norm.leagueId,
              name: norm.name,
              shortCode: norm.shortCode,
              imageUrl: norm.imageUrl,
            },
          });
          teams++;
        } catch (e) {
          errors.push(`Team ${apiTeam.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch (e) {
      errors.push(`Season ${season.id} teams: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { teams, errors };
}

/** Sync teams for a season: resolve league from season and sync that league's teams. */
export async function syncTeamsForSeason(seasonId: string): Promise<{ teams: number; errors: string[] }> {
  const season = await prisma.season.findUnique({ where: { id: seasonId }, include: { league: true } });
  if (!season) {
    return { teams: 0, errors: [`Season not found: ${seasonId}`] };
  }
  return syncTeamsForLeague(season.leagueId);
}

/** Resolve team internal id by external id. If missing, fetch from API and upsert (so fixtures can populate teams when GET /teams fails). */
async function resolveTeamId(externalId: string, leagueId: string | null): Promise<string | null> {
  let team = await prisma.team.findUnique({ where: { externalId } });
  if (team) return team.id;
  const apiId = Number(externalId);
  if (Number.isNaN(apiId) || !leagueId) return null;
  try {
    const apiTeam = await client.getTeamById(apiId);
    if (!apiTeam) return null;
    const norm = mapApiTeamToTeam(apiTeam, leagueId);
    team = await prisma.team.upsert({
      where: { externalId: norm.externalId },
      create: {
        externalId: norm.externalId,
        leagueId: norm.leagueId,
        name: norm.name,
        shortCode: norm.shortCode,
        imageUrl: norm.imageUrl,
      },
      update: {
        name: norm.name,
        shortCode: norm.shortCode,
        imageUrl: norm.imageUrl,
      },
    });
    return team.id;
  } catch {
    return null;
  }
}

/** Sync fixtures for a season (internal seasonId). Upsert Match by externalId. */
export async function syncFixturesForSeason(
  seasonId: string,
  from?: string,
  to?: string
): Promise<{ matches: number; errors: string[] }> {
  const errors: string[] = [];
  let matches = 0;

  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season) {
    errors.push(`Season not found: ${seasonId}`);
    return { matches: 0, errors };
  }

  const apiSeasonId = Number(season.externalId);
  if (Number.isNaN(apiSeasonId)) {
    errors.push(`Invalid season externalId: ${season.externalId}`);
    return { matches: 0, errors };
  }

  try {
    const apiFixtures = await client.getFixtures({ seasonId: apiSeasonId, from, to });
    for (const apiFixture of apiFixtures) {
      try {
        const norm = mapApiFixtureToMatch(apiFixture, seasonId, season.leagueId ?? null);
        const localTeamId = await resolveTeamId(norm.localTeamExternalId, season.leagueId);
        const visitorTeamId = await resolveTeamId(norm.visitorTeamExternalId, season.leagueId);
        if (!localTeamId || !visitorTeamId) {
          errors.push(
            `Fixture ${apiFixture.id}: missing team(s) (local=${norm.localTeamExternalId}, visitor=${norm.visitorTeamExternalId}). Sync teams first.`
          );
          continue;
        }
        let winnerTeamId: string | null = null;
        if (norm.winnerTeamExternalId) {
          winnerTeamId = await resolveTeamId(norm.winnerTeamExternalId, season.leagueId);
        }

        await prisma.match.upsert({
          where: { externalId: norm.externalId },
          create: {
            externalId: norm.externalId,
            seasonId: norm.seasonId,
            leagueId: norm.leagueId,
            localTeamId,
            visitorTeamId,
            startAt: norm.startAt,
            status: norm.status,
            winnerTeamId,
            resultSummary: norm.resultSummary,
            rawPayload: (norm.rawPayload ?? undefined) as object | undefined,
          },
          update: {
            status: norm.status,
            winnerTeamId,
            resultSummary: norm.resultSummary,
            rawPayload: (norm.rawPayload ?? undefined) as object | undefined,
          },
        });
        matches++;
      } catch (e) {
        errors.push(`Fixture ${apiFixture.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  return { matches, errors };
}

/** Determine outcome for a finished match. */
function getOutcome(
  localTeamId: string,
  visitorTeamId: string,
  winnerTeamId: string | null
): 'win_local' | 'win_visitor' | 'tie' | 'no_result' {
  if (!winnerTeamId) return 'tie'; // or no_result; treat null winner as tie for simplicity
  if (winnerTeamId === localTeamId) return 'win_local';
  if (winnerTeamId === visitorTeamId) return 'win_visitor';
  return 'tie';
}

/** Find finished matches without MatchResult, create MatchResult, run ranking engine. */
export async function processFinishedMatches(seasonId?: string): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  const where: { status: { in: string[] }; matchResult: null; seasonId?: string } = {
    status: { in: FINISHED_STATUSES },
    matchResult: null,
  };
  if (seasonId) where.seasonId = seasonId;

  const matches = await prisma.match.findMany({
    where,
    include: { matchResult: true },
  });

  for (const match of matches) {
    try {
      const outcome = getOutcome(match.localTeamId, match.visitorTeamId, match.winnerTeamId);
      const resultSummary = match.resultSummary ?? null;
      const [localScore, visitorScore] = resultSummary
        ? resultSummary.split(/\s*-\s*/).map((s) => s.trim())
        : [null, null];

      const matchResult = await prisma.matchResult.create({
        data: {
          matchId: match.id,
          localTeamId: match.localTeamId,
          visitorTeamId: match.visitorTeamId,
          winnerTeamId: match.winnerTeamId,
          localScore: localScore ?? undefined,
          visitorScore: visitorScore ?? undefined,
          outcome,
        },
      });

      await processMatchResult(matchResult.id);
      processed++;
    } catch (e) {
      errors.push(`Match ${match.externalId}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { processed, errors };
}

/** Sync draft player pool from Sportmonks squads for a season (internal seasonId). */
export async function syncSquadsForSeason(seasonId: string): Promise<{ playersUpserted: number; errors: string[] }> {
  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season) {
    return { playersUpserted: 0, errors: [`Season not found: ${seasonId}`] };
  }
  const apiSeasonId = Number(season.externalId);
  if (Number.isNaN(apiSeasonId)) {
    return { playersUpserted: 0, errors: [`Invalid season externalId: ${season.externalId}`] };
  }
  try {
    const teamsWithSquad = await client.getTeamsWithSquad(apiSeasonId);
    const squadResult = await syncSquadToPlayers(teamsWithSquad);
    return {
      playersUpserted: squadResult.playersUpserted,
      errors: squadResult.errors,
    };
  } catch (e) {
    return {
      playersUpserted: 0,
      errors: [e instanceof Error ? e.message : String(e)],
    };
  }
}

/** Full sync: leagues/seasons, teams, squads (draft pool) per season, fixtures, process finished, refresh player scores. */
export async function runFullSync(options?: {
  leagueId?: string;
  seasonId?: string;
  from?: string;
  to?: string;
}): Promise<SyncResult> {
  const result: SyncResult = {
    leaguesUpserted: 0,
    seasonsUpserted: 0,
    teamsUpserted: 0,
    playersUpserted: 0,
    matchesUpserted: 0,
    matchResultsProcessed: 0,
    errors: [],
  };

  const { leagueId, seasonId, from, to } = options ?? {};

  const { leagues, seasons, errors: e1 } = await syncLeaguesAndSeasons();
  result.leaguesUpserted = leagues;
  result.seasonsUpserted = seasons;
  result.errors.push(...e1);

  const leaguesToSync = leagueId
    ? await prisma.league.findMany({ where: { id: leagueId } })
    : await prisma.league.findMany();
  for (const league of leaguesToSync) {
    const { teams, errors: e2 } = await syncTeamsForLeague(league.id);
    result.teamsUpserted += teams;
    result.errors.push(...e2);
  }

  const seasonsToSync =
    seasonId
      ? await prisma.season.findMany({ where: { id: seasonId } })
      : leagueId
        ? await prisma.season.findMany({ where: { leagueId } })
        : await prisma.season.findMany();

  for (const s of seasonsToSync) {
    const { playersUpserted, errors: eSquad } = await syncSquadsForSeason(s.id);
    result.playersUpserted += playersUpserted;
    result.errors.push(...eSquad);
  }

  for (const s of seasonsToSync) {
    const { matches, errors: e3 } = await syncFixturesForSeason(s.id, from, to);
    result.matchesUpserted += matches;
    result.errors.push(...e3);
  }

  const { processed, errors: e4 } = await processFinishedMatches(seasonId);
  result.matchResultsProcessed = processed;
  result.errors.push(...e4);

  for (const s of seasonsToSync) {
    try {
      await updatePlayerScoresFromTeamScores(s.id);
    } catch (e) {
      result.errors.push(`Player scores (season ${s.id}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return result;
}
