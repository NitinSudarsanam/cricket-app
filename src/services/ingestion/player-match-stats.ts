/**
 * Map Sportmonks fixture batting/bowling/fielding lines to PlayerMatchStat rows
 * and refresh PlayerScore from those stats.
 */

import { prisma } from '@/lib/db';
import { getFixtureById } from '@/lib/sportmonks/client';
import type { SportmonksBattingLine, SportmonksBowlingLine, SportmonksFixture } from '@/lib/sportmonks/types';
import {
  aggregateFantasyPoints,
  computeFantasyPoints,
  mergeFantasyRules,
  type FantasyRuleMap,
} from '@/services/scoring/fantasy-scoring-engine';

const SCORECARD_INCLUDE = 'batting,bowling,lineup';

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function playerExternalId(line: { player_id?: number; player?: { id?: number } }): string | null {
  const id = line.player_id ?? line.player?.id;
  return id == null ? null : String(id);
}

function isDismissed(line: SportmonksBattingLine): boolean {
  if (line.is_notout === true) return false;
  if (line.dismissal) return true;
  return line.is_notout === false;
}

export interface ExtractedPlayerStat {
  externalPlayerId: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  wickets: number;
  oversBowled: number;
  maidens: number;
  bowlingRuns: number;
  catches: number;
  stumpings: number;
  runOuts: number;
  didBat: boolean;
  didBowl: boolean;
  dismissed: boolean;
}

export function extractPlayerStatsFromFixture(fixture: SportmonksFixture): ExtractedPlayerStat[] {
  const byPlayer = new Map<string, ExtractedPlayerStat>();

  const ensure = (externalPlayerId: string): ExtractedPlayerStat => {
    const existing = byPlayer.get(externalPlayerId);
    if (existing) return existing;
    const created: ExtractedPlayerStat = {
      externalPlayerId,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      oversBowled: 0,
      maidens: 0,
      bowlingRuns: 0,
      catches: 0,
      stumpings: 0,
      runOuts: 0,
      didBat: false,
      didBowl: false,
      dismissed: false,
    };
    byPlayer.set(externalPlayerId, created);
    return created;
  };

  for (const line of fixture.batting ?? []) {
    const id = playerExternalId(line);
    if (!id) continue;
    const row = ensure(id);
    row.didBat = true;
    row.runs += asNumber(line.score);
    row.ballsFaced += asNumber(line.ball);
    row.fours += asNumber(line.four_x);
    row.sixes += asNumber(line.six_x);
    row.dismissed = row.dismissed || isDismissed(line);

    const catcherId = line.catch_stump_player_id != null ? String(line.catch_stump_player_id) : null;
    const dismissal = (line.dismissal ?? '').toLowerCase();
    if (catcherId) {
      const fielder = ensure(catcherId);
      if (dismissal.includes('stump')) {
        fielder.stumpings += 1;
      } else if (dismissal.includes('caught') || dismissal.includes('catch')) {
        fielder.catches += 1;
      }
    }

    const runOutId = line.runout_by_id != null ? String(line.runout_by_id) : null;
    if (runOutId) {
      ensure(runOutId).runOuts += 1;
    }
  }

  for (const line of fixture.bowling ?? []) {
    const id = playerExternalId(line);
    if (!id) continue;
    const row = ensure(id);
    row.didBowl = true;
    row.wickets += asNumber(line.wickets);
    row.oversBowled += asNumber(line.overs);
    row.maidens += asNumber(line.medians);
    row.bowlingRuns += asNumber(line.runs);
  }

  return Array.from(byPlayer.values());
}

export async function loadFantasyRules(seasonId?: string | null): Promise<FantasyRuleMap> {
  const rows = await prisma.fantasyScoringRule.findMany({
    where: {
      OR: [{ seasonId: seasonId ?? undefined }, { seasonId: null }, { seasonId: '' }],
    },
    orderBy: { createdAt: 'asc' },
  });
  const overrides: Record<string, number> = {};
  const globals = rows.filter((row) => !row.seasonId);
  const seasonal = rows.filter((row) => seasonId && row.seasonId === seasonId);
  for (const row of [...globals, ...seasonal]) {
    overrides[row.statKey] = row.points;
  }
  return mergeFantasyRules(overrides);
}

export async function upsertPlayerMatchStatsForMatch(
  matchId: string,
  stats: ExtractedPlayerStat[]
): Promise<number> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, seasonId: true },
  });
  if (!match) return 0;

  const externalIds = stats.map((s) => s.externalPlayerId);
  const players = await prisma.player.findMany({
    where: { externalId: { in: externalIds } },
    select: { id: true, externalId: true },
  });
  const playerByExternal = new Map(players.map((p) => [p.externalId, p.id]));

  let upserted = 0;
  for (const stat of stats) {
    const playerId = playerByExternal.get(stat.externalPlayerId);
    if (!playerId) continue;
    await prisma.playerMatchStat.upsert({
      where: { playerId_matchId: { playerId, matchId: match.id } },
      create: {
        playerId,
        matchId: match.id,
        seasonId: match.seasonId,
        runs: stat.runs,
        ballsFaced: stat.ballsFaced,
        fours: stat.fours,
        sixes: stat.sixes,
        wickets: stat.wickets,
        oversBowled: stat.oversBowled,
        maidens: stat.maidens,
        bowlingRuns: stat.bowlingRuns,
        catches: stat.catches,
        stumpings: stat.stumpings,
        runOuts: stat.runOuts,
        didBat: stat.didBat,
        didBowl: stat.didBowl,
        dismissed: stat.dismissed,
      },
      update: {
        runs: stat.runs,
        ballsFaced: stat.ballsFaced,
        fours: stat.fours,
        sixes: stat.sixes,
        wickets: stat.wickets,
        oversBowled: stat.oversBowled,
        maidens: stat.maidens,
        bowlingRuns: stat.bowlingRuns,
        catches: stat.catches,
        stumpings: stat.stumpings,
        runOuts: stat.runOuts,
        didBat: stat.didBat,
        didBowl: stat.didBowl,
        dismissed: stat.dismissed,
      },
    });
    upserted++;
  }
  return upserted;
}

export async function updatePlayerScoresFromMatchStats(seasonId: string): Promise<number> {
  const rules = await loadFantasyRules(seasonId);
  const stats = await prisma.playerMatchStat.findMany({
    where: { seasonId },
    select: {
      playerId: true,
      runs: true,
      ballsFaced: true,
      fours: true,
      sixes: true,
      wickets: true,
      maidens: true,
      bowlingRuns: true,
      oversBowled: true,
      catches: true,
      stumpings: true,
      runOuts: true,
      didBat: true,
      didBowl: true,
      dismissed: true,
    },
  });

  const byPlayer = new Map<string, typeof stats>();
  for (const stat of stats) {
    const list = byPlayer.get(stat.playerId) ?? [];
    list.push(stat);
    byPlayer.set(stat.playerId, list);
  }

  let updated = 0;
  for (const [playerId, playerStats] of byPlayer) {
    const { points, breakdown } = aggregateFantasyPoints(playerStats, rules);
    await prisma.playerScore.upsert({
      where: {
        playerId_seasonId_source: { playerId, seasonId, source: 'fantasy' },
      },
      create: {
        playerId,
        seasonId,
        points,
        source: 'fantasy',
        breakdown,
      },
      update: { points, breakdown },
    });
    updated++;
  }
  return updated;
}

export async function syncScorecardForMatch(matchId: string): Promise<{
  statsUpserted: number;
  error?: string;
}> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, externalId: true },
  });
  if (!match) return { statsUpserted: 0, error: `Match not found: ${matchId}` };

  const fixtureId = Number(match.externalId);
  if (Number.isNaN(fixtureId)) {
    return { statsUpserted: 0, error: `Invalid fixture id: ${match.externalId}` };
  }

  try {
    const fixture = await getFixtureById(fixtureId, SCORECARD_INCLUDE);
    if (!fixture) return { statsUpserted: 0, error: `Fixture not found: ${fixtureId}` };
    const extracted = extractPlayerStatsFromFixture(fixture);
    const statsUpserted = await upsertPlayerMatchStatsForMatch(match.id, extracted);
    return { statsUpserted };
  } catch (error) {
    return {
      statsUpserted: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export { computeFantasyPoints };
