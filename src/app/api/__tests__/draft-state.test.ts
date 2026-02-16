/**
 * Unit Tests for GET /api/draft/state
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/draft/state/route';
import { createMockRequest } from '@/__tests__/helpers/mock-request';
import { createDraftState } from '@/__tests__/helpers/mock-factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    draftState: { 
      findUnique: vi.fn(), 
      findFirst: vi.fn(),
    },
  },
  handleDatabaseError: vi.fn((e) => 'Database error'),
}));

vi.mock('@/lib/draft-state-manager', () => ({
  getActiveDraftState: vi.fn(),
  getCurrentParticipantId: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { getActiveDraftState } from '@/lib/draft-state-manager';

describe('GET /api/draft/state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 when no draft state found', async () => {
    vi.mocked(getActiveDraftState).mockResolvedValue(null);
    vi.mocked(prisma.draftState.findFirst).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/draft/state');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('should return active draft state when no ID provided', async () => {
    const draftState = createDraftState();
    const mockDraftState = {
      id: draftState.id,
      status: draftState.status,
      currentRound: draftState.currentRound,
      currentPickIndex: draftState.currentPickIndex,
      draftOrderType: 'snake' as const,
      draftConfigId: draftState.draftConfigId,
      participantOrder: draftState.participantOrder,
      startedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      draftOrders: [],
      picks: [],
      draftConfig: {
        id: draftState.draftConfigId,
        totalRounds: 5,
        rosterSize: 11,
        minPerTeam: 1,
        maxPerTeam: 3,
        mandatoryBat: 3,
        mandatoryBowl: 3,
        mandatoryAR: 1,
        mandatoryWK: 1,
        earlyRounds: 3,
        earlyMinBat: 2,
        earlyMinBowl: 2,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    
    // Mock findFirst - route calls it twice: first for active, then for latest
    vi.mocked(prisma.draftState.findFirst)
      .mockResolvedValueOnce(null) // No active draft
      .mockResolvedValueOnce(mockDraftState as any); // Latest draft

    const request = createMockRequest('http://localhost:3000/api/draft/state');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Response may have draftState directly or nested in data
    expect(data.draftState || data.data?.draftState || data.data).toBeDefined();
  });

  it('should return specific draft state when ID provided', async () => {
    const draftState = createDraftState();
    vi.mocked(prisma.draftState.findUnique).mockResolvedValue({
      id: draftState.id,
      status: draftState.status,
      currentRound: draftState.currentRound,
      currentPickIndex: draftState.currentPickIndex,
      draftOrderType: 'snake',
      draftConfigId: draftState.draftConfigId,
      participantOrder: draftState.participantOrder,
      startedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      draftOrders: [],
      picks: [],
      draftConfig: {
        id: draftState.draftConfigId,
        totalRounds: 5,
        rosterSize: 11,
        minPerTeam: 1,
        maxPerTeam: 3,
        mandatoryBat: 3,
        mandatoryBowl: 3,
        mandatoryAR: 1,
        mandatoryWK: 1,
        earlyRounds: 3,
        earlyMinBat: 2,
        earlyMinBowl: 2,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as any);

    const request = createMockRequest('http://localhost:3000/api/draft/state?draftStateId=test-id');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.draftState || data.data?.draftState || data.data).toBeDefined();
  });
});
