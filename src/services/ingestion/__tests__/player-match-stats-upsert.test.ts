import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    match: { findUnique: vi.fn() },
    player: { findMany: vi.fn() },
    playerMatchStat: { upsert: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
    playerScore: { upsert: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    fantasyScoringRule: { findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/db';
import {
  updatePlayerScoresFromMatchStats,
  upsertPlayerMatchStatsForMatch,
} from '../player-match-stats';

describe('upsertPlayerMatchStatsForMatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes stats that disappeared from the scorecard', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue({
      id: 'match-1',
      seasonId: 'season-1',
    } as any);
    vi.mocked(prisma.player.findMany).mockResolvedValue([
      { id: 'player-keep', externalId: '10' },
    ] as any);
    vi.mocked(prisma.playerMatchStat.upsert).mockResolvedValue({} as any);
    vi.mocked(prisma.playerMatchStat.deleteMany).mockResolvedValue({ count: 1 } as any);

    await upsertPlayerMatchStatsForMatch('match-1', [
      {
        externalPlayerId: '10',
        runs: 12,
        ballsFaced: 8,
        fours: 1,
        sixes: 0,
        wickets: 0,
        oversBowled: 0,
        maidens: 0,
        bowlingRuns: 0,
        catches: 0,
        stumpings: 0,
        runOuts: 0,
        didBat: true,
        didBowl: false,
        dismissed: false,
      },
    ]);

    expect(prisma.playerMatchStat.deleteMany).toHaveBeenCalledWith({
      where: { matchId: 'match-1', playerId: { notIn: ['player-keep'] } },
    });
  });
});

describe('updatePlayerScoresFromMatchStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('zeros fantasy scores for players with no remaining stats', async () => {
    vi.mocked(prisma.fantasyScoringRule.findMany).mockResolvedValue([]);
    vi.mocked(prisma.playerMatchStat.findMany).mockResolvedValue([
      {
        playerId: 'player-keep',
        runs: 20,
        ballsFaced: 10,
        fours: 2,
        sixes: 1,
        wickets: 0,
        maidens: 0,
        bowlingRuns: 0,
        oversBowled: 0,
        catches: 0,
        stumpings: 0,
        runOuts: 0,
        didBat: true,
        didBowl: false,
        dismissed: false,
      },
    ] as any);
    vi.mocked(prisma.playerScore.upsert).mockResolvedValue({} as any);
    vi.mocked(prisma.playerScore.findMany).mockResolvedValue([
      { playerId: 'player-keep' },
      { playerId: 'player-gone' },
    ] as any);
    vi.mocked(prisma.playerScore.update).mockResolvedValue({} as any);

    await updatePlayerScoresFromMatchStats('season-1');

    expect(prisma.playerScore.update).toHaveBeenCalledWith({
      where: {
        playerId_seasonId_source: {
          playerId: 'player-gone',
          seasonId: 'season-1',
          source: 'fantasy',
        },
      },
      data: { points: 0, breakdown: {} },
    });
  });
});
