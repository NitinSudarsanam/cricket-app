/**
 * Phase 1 player ranking: set PlayerScore from TeamScore by mapping Player.team (IPL code) to Team.
 * Uses canonical team-code mapping (Sportmonks short_code/name → IPL) so leaderboard and draft stay aligned.
 */

import { prisma } from '@/lib/db';
import { sportmonksTeamCodeToIPL } from '@/lib/sportmonks/team-code-map';

/**
 * For a season, set PlayerScore for each Player to the points of the Team that matches their Player.team (IPL code).
 * Idempotent: upsert by (playerId, seasonId).
 */
export async function updatePlayerScoresFromTeamScores(seasonId: string): Promise<number> {
  const teamScores = await prisma.teamScore.findMany({
    where: { seasonId },
    include: { team: true },
  });

  let updated = 0;
  for (const ts of teamScores) {
    const code = sportmonksTeamCodeToIPL(ts.team.shortCode, ts.team.name);
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
