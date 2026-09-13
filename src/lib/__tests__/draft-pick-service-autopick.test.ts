import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDraftConfig, createDraftState, createPlayer } from '@/__tests__/helpers/mock-factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    draftConfig: { findUnique: vi.fn() },
    playerMatchStat: { findFirst: vi.fn() },
    player: { findMany: vi.fn() },
    pick: { findMany: vi.fn() },
    playerScore: { findMany: vi.fn() },
    participant: { findUnique: vi.fn() },
    $transaction: vi.fn(),
    draftState: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/pusher-server', () => ({
  broadcastEvent: vi.fn(),
  EVENTS: { PICK_MADE: 'pick', ROUND_COMPLETE: 'round', DRAFT_COMPLETE: 'done' },
}));

import { prisma } from '@/lib/db';
import {
  chooseAutoPickPlayer,
  listAutoPickCandidates,
  resolveLatestFantasySeasonId,
} from '../draft-pick-service';

describe('auto-pick candidate selection', () => {
  const first = createPlayer({ id: 'p-first', name: 'Already Taken', role: 'Bat' });
  const second = createPlayer({ id: 'p-second', name: 'Next Best', role: 'Bowl' });
  const draftConfig = createDraftConfig({
    maxPerTeam: 8,
    minPerTeam: 0,
    mandatoryRoles: { Bat: 0, Bowl: 0, AR: 0, WK: 0 },
    earlyRoundRule: { rounds: 0, minBat: 0, minBowl: 0 },
    freeSlots: 8,
  });
  const draftState = createDraftState({
    currentRound: 5,
    picks: [],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.playerMatchStat.findFirst).mockResolvedValue({
      seasonId: 'season-latest',
    } as any);
    vi.mocked(prisma.player.findMany).mockResolvedValue([first, second] as any);
    vi.mocked(prisma.pick.findMany).mockResolvedValue([]);
    vi.mocked(prisma.playerScore.findMany).mockResolvedValue([
      { playerId: 'p-first', points: 90 },
      { playerId: 'p-second', points: 80 },
    ] as any);
  });

  it('uses the season with the latest match-stat update', async () => {
    await expect(resolveLatestFantasySeasonId()).resolves.toBe('season-latest');
    expect(prisma.playerMatchStat.findFirst).toHaveBeenCalledWith({
      where: { seasonId: { not: '' } },
      orderBy: { updatedAt: 'desc' },
      select: { seasonId: true },
    });
  });

  it('skips already drafted players and keeps the leftover fallback ordered', async () => {
    const candidates = await listAutoPickCandidates(draftState, draftConfig, 'alice', {
      draftedPlayerIds: ['p-first'],
    });
    expect(candidates.map((player) => player.id)).toEqual(['p-second']);

    const chosen = await chooseAutoPickPlayer(draftState, draftConfig, 'alice', {
      draftedPlayerIds: ['p-first'],
    });
    expect(chosen?.id).toBe('p-second');
  });

  it('falls back to leftover players when constraints leave nobody eligible', async () => {
    const tightConfig = createDraftConfig({
      maxPerTeam: 0,
      minPerTeam: 0,
      mandatoryRoles: { Bat: 0, Bowl: 0, AR: 0, WK: 0 },
      earlyRoundRule: { rounds: 0, minBat: 0, minBowl: 0 },
      freeSlots: 8,
    });
    const leftovers = await listAutoPickCandidates(draftState, tightConfig, 'alice');
    expect(leftovers[0]?.id).toBe('p-first');
  });
});
