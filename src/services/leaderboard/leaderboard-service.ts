/**
 * Leaderboard query service: read rankings by season/league with pagination and sort.
 */

import { prisma } from '@/lib/db';

export interface TeamLeaderboardItem {
  teamId: string;
  name: string;
  shortCode: string | null;
  imageUrl: string | null;
  points: number;
  matchesPlayed: number;
  wins: number;
  ties: number;
  noResults: number;
  losses: number;
  lastMatchAt: Date | null;
}

export interface PlayerLeaderboardItem {
  playerId: string;
  name: string;
  team: string;
  points: number;
  source: string;
}

export interface LeaderboardOptions {
  seasonId: string;
  leagueId?: string | null;
  limit?: number;
  offset?: number;
  sort?: 'points' | '-points' | 'name';
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function getTeamLeaderboard(
  options: LeaderboardOptions
): Promise<{ items: TeamLeaderboardItem[]; total: number }> {
  const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset ?? 0;
  const sort = options.sort ?? 'points';
  const orderByPoints = sort === '-points' ? 'asc' : 'desc';

  const where: { seasonId: string; team?: { leagueId?: string | null } } = {
    seasonId: options.seasonId,
  };
  if (options.leagueId) {
    where.team = { leagueId: options.leagueId };
  }

  const orderBy =
    sort === 'name'
      ? { team: { name: 'asc' as const } }
      : { points: orderByPoints as 'asc' | 'desc' };

  const [items, total] = await Promise.all([
    prisma.teamScore.findMany({
      where,
      include: { team: true },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.teamScore.count({ where }),
  ]);

  return {
    items: items.map((row) => ({
      teamId: row.teamId,
      name: row.team.name,
      shortCode: row.team.shortCode,
      imageUrl: row.team.imageUrl,
      points: row.points,
      matchesPlayed: row.matchesPlayed,
      wins: row.wins,
      ties: row.ties,
      noResults: row.noResults,
      losses: row.losses,
      lastMatchAt: row.lastMatchAt,
    })),
    total,
  };
}

export async function getPlayerLeaderboard(
  options: LeaderboardOptions
): Promise<{ items: PlayerLeaderboardItem[]; total: number }> {
  const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset ?? 0;
  const sort = options.sort ?? 'points';
  const orderByPoints = sort === '-points' ? 'asc' : 'desc';

  const where: { seasonId: string | null } = {
    seasonId: options.seasonId,
  };

  const orderBy =
    sort === 'name'
      ? { player: { name: 'asc' as const } }
      : { points: orderByPoints as 'asc' | 'desc' };

  const [items, total] = await Promise.all([
    prisma.playerScore.findMany({
      where,
      include: { player: true },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.playerScore.count({ where }),
  ]);

  return {
    items: items.map((row) => ({
      playerId: row.playerId,
      name: row.player.name,
      team: row.player.team,
      points: row.points,
      source: row.source,
    })),
    total,
  };
}
