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

// ============================================================================
// Fantasy Leaderboard (Draft Participants)
// ============================================================================

export interface FantasyPlayerItem {
  playerId: string;
  playerName: string;
  team: string;
  points: number;
}

export interface FantasyLeaderboardItem {
  participantId: string;
  participantName: string;
  totalPoints: number;
  playerCount: number;
  players: FantasyPlayerItem[];
}

export interface FantasyLeaderboardOptions {
  draftStateId: string;
  seasonId: string;
  limit?: number;
  offset?: number;
  sort?: 'points' | 'name';
}

export async function getFantasyLeaderboard(
  options: FantasyLeaderboardOptions
): Promise<{ items: FantasyLeaderboardItem[]; total: number }> {
  const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset ?? 0;
  const sort = options.sort ?? 'points';

  // Fetch all picks for this draft with participant and player details
  const picks = await prisma.pick.findMany({
    where: {
      draftStateId: options.draftStateId,
    },
    include: {
      participant: true,
      player: {
        include: {
          playerScores: {
            where: {
              seasonId: options.seasonId,
            },
          },
        },
      },
    },
  });

  // Group by participant and calculate totals
  const participantMap = new Map<string, FantasyLeaderboardItem>();

  for (const pick of picks) {
    const participantId = pick.participantId;
    const playerPoints =
      pick.player.playerScores.reduce((sum, score) => sum + score.points, 0) || 0;

    if (!participantMap.has(participantId)) {
      participantMap.set(participantId, {
        participantId,
        participantName: pick.participant.name,
        totalPoints: 0,
        playerCount: 0,
        players: [],
      });
    }

    const item = participantMap.get(participantId)!;
    item.totalPoints += playerPoints;
    item.playerCount += 1;
    item.players.push({
      playerId: pick.player.id,
      playerName: pick.player.name,
      team: pick.player.team,
      points: playerPoints,
    });
  }

  // Convert to array and sort
  let items = Array.from(participantMap.values());

  if (sort === 'name') {
    items.sort((a, b) => a.participantName.localeCompare(b.participantName));
  } else {
    // Sort by totalPoints descending (highest first)
    items.sort((a, b) => b.totalPoints - a.totalPoints);
  }

  const total = items.length;
  
  // Apply pagination
  items = items.slice(offset, offset + limit);

  return {
    items,
    total,
  };
}
