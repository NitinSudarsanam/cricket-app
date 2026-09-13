import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    draftState: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';
import { getLatestDraftState } from '@/lib/draft-state-manager';

function prismaDraft(overrides: Record<string, unknown> = {}) {
  return {
    id: 'draft-live',
    currentRound: 1,
    currentPickIndex: 0,
    draftOrderType: 'snake',
    status: 'in_progress',
    startedAt: new Date('2026-01-02'),
    completedAt: null,
    turnStartedAt: null,
    draftConfigId: 'cfg-1',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
    draftConfig: { pickTimeoutSeconds: 60 },
    draftOrders: [{ position: 0, participantId: 'p1' }],
    picks: [],
    ...overrides,
  };
}

describe('getLatestDraftState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefers an in-progress draft over a newer reset row with null startedAt', async () => {
    vi.mocked(prisma.draftState.findFirst).mockResolvedValueOnce(prismaDraft());

    const result = await getLatestDraftState();

    expect(result?.id).toBe('draft-live');
    expect(result?.status).toBe('in_progress');
    expect(prisma.draftState.findFirst).toHaveBeenCalledTimes(1);
    expect(vi.mocked(prisma.draftState.findFirst).mock.calls[0][0]).toMatchObject({
      where: { status: { in: ['in_progress', 'paused'] } },
    });
  });

  it('falls back to the newest created draft when none are live', async () => {
    vi.mocked(prisma.draftState.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        prismaDraft({
          id: 'draft-completed',
          status: 'completed',
          startedAt: null,
          createdAt: new Date('2026-01-03'),
        })
      );

    const result = await getLatestDraftState();

    expect(result?.id).toBe('draft-completed');
    expect(prisma.draftState.findFirst).toHaveBeenCalledTimes(2);
    expect(vi.mocked(prisma.draftState.findFirst).mock.calls[1][0]).toMatchObject({
      orderBy: { createdAt: 'desc' },
    });
  });
});
