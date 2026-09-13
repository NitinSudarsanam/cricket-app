/**
 * Player ranking:
 * - Phase 1 / fallback: copy TeamScore onto every player on that franchise (`team_only`)
 * - Fantasy: aggregate PlayerMatchStat via the fantasy scoring engine (`fantasy`)
 */

import { prisma } from '@/lib/db';
import { resolveTeamCode } from '@/lib/sportmonks/team-code-map';
import { updatePlayerScoresFromMatchStats } from '@/services/ingestion/player-match-stats';

/**
 * For a season, set PlayerScore for each Player to the points of the Team that matches their Player.team.
 * Idempotent: upsert by (playerId, seasonId, source='team_only').
 */
export async function updatePlayerScoresFromTeamScores(seasonId: string): Promise<number> {
  const teamScores = await prisma.teamScore.findMany({
    where: { seasonId },
    include: { team: true },
  });

  let updated = 0;
  for (const ts of teamScores) {
    const code = resolveTeamCode(ts.team.shortCode, ts.team.name);
    if (!code) continue;

    const players = await prisma.player.findMany({
      where: { team: code },
      select: { id: true },
    });

    for (const p of players) {
      const existing = await prisma.playerScore.findFirst({
        where: { playerId: p.id, seasonId, source: 'team_only' },
      });
      if (existing) {
        await prisma.playerScore.update({
          where: { id: existing.id },
          data: { points: ts.points },
        });
      } else {
        await prisma.playerScore.create({
          data: {
            playerId: p.id,
            seasonId,
            points: ts.points,
            source: 'team_only',
          },
        });
      }
      updated++;
    }
  }
  return updated;
}

/**
 * Refresh player scores after sync: keep team-table copy for standings context,
 * then overwrite the leaderboard-facing `fantasy` source from match stats when present.
 */
export async function refreshPlayerScores(seasonId: string): Promise<{
  teamOnly: number;
  fantasy: number;
}> {
  const teamOnly = await updatePlayerScoresFromTeamScores(seasonId);
  const fantasy = await updatePlayerScoresFromMatchStats(seasonId);
  return { teamOnly, fantasy };
}
