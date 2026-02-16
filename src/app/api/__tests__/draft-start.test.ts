/**
 * Unit Tests for POST /api/draft/start
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/draft/start/route';
import { createMockJsonRequest } from '@/__tests__/helpers/mock-request';
import { createDraftConfig, createParticipant, createPlayers } from '@/__tests__/helpers/mock-factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    draftState: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    draftConfig: { findFirst: vi.fn(), update: vi.fn() },
    participant: { findMany: vi.fn() },
    player: { findMany: vi.fn() },
    league: { count: vi.fn() },
    season: { count: vi.fn() },
  },
  handleDatabaseError: vi.fn((e) => 'Database error'),
}));

vi.mock('@/lib/auth-helpers', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/draft-state-manager', () => ({
  initializeDraftState: vi.fn(),
}));

vi.mock('@/lib/model-mappers', () => ({
  prismaDraftConfigToDraftConfig: vi.fn(),
}));

vi.mock('@/lib/rule-engine', () => ({
  validateDraftConfiguration: vi.fn(),
}));

vi.mock('@/lib/pusher-server', () => ({
  broadcastEvent: vi.fn(),
  EVENTS: { DRAFT_STARTED: 'draft_started' },
}));

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';
import { initializeDraftState } from '@/lib/draft-state-manager';
import { validateDraftConfiguration } from '@/lib/rule-engine';
import { broadcastEvent } from '@/lib/pusher-server';
import { prismaDraftConfigToDraftConfig } from '@/lib/model-mappers';

describe('POST /api/draft/start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated as admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: false,
      status: 401,
      error: 'Unauthorized',
    });

    const request = createMockJsonRequest('http://localhost:3000/api/draft/start', {
      participantIds: ['participant-1'],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 400 when participantIds is missing', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });

    const request = createMockJsonRequest('http://localhost:3000/api/draft/start', {});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('participantIds');
  });

  it('should return 400 when participantIds is empty', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });

    const request = createMockJsonRequest('http://localhost:3000/api/draft/start', {
      participantIds: [],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('At least one participant');
  });

  it('should return 400 when participantIds exceeds limit', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });

    const request = createMockJsonRequest('http://localhost:3000/api/draft/start', {
      participantIds: Array.from({ length: 21 }, (_, i) => `participant-${i}`),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('20 participants');
  });

  it('should return 409 when draft already in progress', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    vi.mocked(prisma.draftState.findFirst).mockResolvedValue({
      id: 'existing-draft',
      status: 'in_progress',
    } as any);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/start', {
      participantIds: ['participant-1'],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('already in progress');
  });

  it('should return 404 when no draft config exists', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    vi.mocked(prisma.draftState.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.draftConfig.findFirst).mockResolvedValue(null);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/start', {
      participantIds: ['participant-1'],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('No draft configuration');
  });

  it('should return 200 and start draft on valid request', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    vi.mocked(prisma.draftState.findFirst).mockResolvedValue(null);
    
    const draftConfig = createDraftConfig();
    vi.mocked(prisma.draftConfig.findFirst).mockResolvedValue({
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
    } as any);
    
    vi.mocked(prismaDraftConfigToDraftConfig).mockReturnValue(draftConfig);
    
    const participants = [createParticipant({ id: 'participant-1' })];
    vi.mocked(prisma.participant.findMany).mockResolvedValue(participants.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as any);
    
    // Mock league and season counts for sync check
    vi.mocked(prisma.league.count).mockResolvedValue(1);
    vi.mocked(prisma.season.count).mockResolvedValue(1);
    
    // Mock players for validation
    const players = createPlayers(100);
    vi.mocked(prisma.player.findMany).mockResolvedValue(players.map(p => ({
      id: p.id,
      name: p.name,
      team: p.team,
      role: p.role,
      isForeign: p.isForeign,
      metadata: null,
      externalId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as any);
    
    vi.mocked(validateDraftConfiguration).mockReturnValue({ valid: true });
    
    const draftState = {
      id: 'draft-state-1',
      currentRound: 1,
      currentPickIndex: 0,
      status: 'in_progress',
      participantOrder: ['participant-1'],
      picks: [],
    };
    vi.mocked(initializeDraftState).mockResolvedValue(draftState as any);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/start', {
      participantIds: ['participant-1'],
      draftOrder: 'snake',
    });

    const response = await POST(request);
    const data = await response.json();

    // POST /api/draft/start returns 201 Created on success
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(broadcastEvent).toHaveBeenCalled();
  });
});
