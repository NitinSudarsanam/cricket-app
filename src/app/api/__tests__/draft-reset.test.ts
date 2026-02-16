/**
 * Unit Tests for POST /api/draft/reset
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/draft/reset/route';
import { createMockJsonRequest } from '@/__tests__/helpers/mock-request';
import { createDraftState, createDraftConfig } from '@/__tests__/helpers/mock-factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    draftState: { findFirst: vi.fn(), findUnique: vi.fn() },
    draftConfig: { update: vi.fn() },
    pick: { deleteMany: vi.fn() },
  },
  handleDatabaseError: vi.fn((e) => 'Database error'),
}));

vi.mock('@/lib/auth-helpers', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/draft-state-manager', () => ({
  resetDraftState: vi.fn(),
}));

vi.mock('@/lib/pusher-server', () => ({
  broadcastEvent: vi.fn(),
  EVENTS: { STATE_UPDATE: 'state_update', DRAFT_RESET: 'draft_reset' },
}));

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';
import { resetDraftState } from '@/lib/draft-state-manager';
import { broadcastEvent, EVENTS } from '@/lib/pusher-server';

describe('POST /api/draft/reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated as admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: false,
      status: 401,
      error: 'Unauthorized',
    });

    const request = createMockJsonRequest('http://localhost:3000/api/draft/reset', {});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 404 when no draft state found', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    vi.mocked(prisma.draftState.findFirst).mockResolvedValue(null);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/reset', {});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('No draft state found');
  });

  it('should return 404 when specified draft state does not exist', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    vi.mocked(prisma.draftState.findUnique).mockResolvedValue(null);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/reset', {
      draftStateId: 'non-existent',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Draft state not found');
  });

  it('should reset draft successfully', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    
    const draftState = createDraftState({ status: 'in_progress' });
    const draftConfig = createDraftConfig();
    
    vi.mocked(prisma.draftState.findFirst).mockResolvedValue({
      id: draftState.id,
      status: 'in_progress',
      draftConfigId: draftConfig.id,
    } as any);
    
    vi.mocked(prisma.draftState.findUnique).mockResolvedValue({
      id: draftState.id,
      status: 'in_progress',
      draftConfigId: draftConfig.id,
      draftConfig: {
        id: draftConfig.id,
        rosterSize: draftConfig.rosterSize,
        totalRounds: draftConfig.totalRounds,
        minPerTeam: draftConfig.minPerTeam,
        maxPerTeam: draftConfig.maxPerTeam,
        mandatoryBat: draftConfig.mandatoryRoles.Bat,
        mandatoryBowl: draftConfig.mandatoryRoles.Bowl,
        mandatoryAR: draftConfig.mandatoryRoles.AR,
        mandatoryWK: draftConfig.mandatoryRoles.WK,
        earlyRounds: draftConfig.earlyRoundRule.rounds,
        earlyMinBat: draftConfig.earlyRoundRule.minBat,
        earlyMinBowl: draftConfig.earlyRoundRule.minBowl,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as any);
    
    const resetState = { ...draftState, status: 'not_started', picks: [] };
    vi.mocked(resetDraftState).mockResolvedValue(resetState as any);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/reset', {});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(broadcastEvent).toHaveBeenCalled();
  });
});
