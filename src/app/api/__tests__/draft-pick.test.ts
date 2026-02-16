/**
 * Unit Tests for POST /api/draft/pick
 * 
 * Tests the draft pick endpoint with mocked dependencies.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/draft/pick/route';
import { createMockJsonRequest } from '@/__tests__/helpers/mock-request';
import { createDraftState, createPlayer, createDraftConfig } from '@/__tests__/helpers/mock-factories';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    player: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    draftConfig: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    draftState: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    pick: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), deleteMany: vi.fn() },
    participant: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    draftOrder: { findMany: vi.fn(), create: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
  handleDatabaseError: vi.fn((e) => 'Database error'),
}));

vi.mock('@/lib/session', () => ({
  getParticipantSession: vi.fn(),
}));

vi.mock('@/lib/draft-state-manager', () => ({
  getActiveDraftState: vi.fn(),
  getDraftState: vi.fn(),
  getCurrentParticipantId: vi.fn(),
  calculatePickNumber: vi.fn(),
  addPick: vi.fn(),
  advanceToNextPick: vi.fn(),
  DraftOrderType: { SNAKE: 'snake', LINEAR: 'linear' },
}));

import { getDraftState } from '@/lib/draft-state-manager';

vi.mock('@/lib/pusher-server', () => ({
  broadcastEvent: vi.fn(),
  EVENTS: {
    PICK_MADE: 'pick_made',
    DRAFT_COMPLETED: 'draft_completed',
  },
}));

vi.mock('@/lib/rule-engine', () => ({
  validatePick: vi.fn(),
}));

vi.mock('@/lib/model-mappers', () => ({
  prismaDraftConfigToDraftConfig: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { getParticipantSession } from '@/lib/session';
import { getActiveDraftState, getCurrentParticipantId, calculatePickNumber, addPick, advanceToNextPick } from '@/lib/draft-state-manager';
import { validatePick } from '@/lib/rule-engine';
import { broadcastEvent, EVENTS } from '@/lib/pusher-server';
import { prismaDraftConfigToDraftConfig } from '@/lib/model-mappers';

describe('POST /api/draft/pick', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when participantId is missing', async () => {
    const request = createMockJsonRequest('http://localhost:3000/api/draft/pick', {
      playerId: 'player-1',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('participantId');
  });

  it('should return 400 when playerId is missing', async () => {
    const request = createMockJsonRequest('http://localhost:3000/api/draft/pick', {
      participantId: 'participant-1',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('playerId');
  });

  it('should return 401 when no session cookie', async () => {
    vi.mocked(getParticipantSession).mockResolvedValue(null);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pick', {
      participantId: 'participant-1',
      playerId: 'player-1',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication');
  });

  it('should return 403 when participantId does not match session', async () => {
    vi.mocked(getParticipantSession).mockResolvedValue({
      participantId: 'participant-2',
      participantName: 'Other Participant',
    });

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pick', {
      participantId: 'participant-1',
      playerId: 'player-1',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Forbidden');
  });

  it('should return 404 when no active draft', async () => {
    vi.mocked(getParticipantSession).mockResolvedValue({
      participantId: 'participant-1',
      participantName: 'Test Participant',
    });
    vi.mocked(getActiveDraftState).mockResolvedValue(null);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pick', {
      participantId: 'participant-1',
      playerId: 'player-1',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('No active draft');
  });

  it('should return 409 when draft is paused', async () => {
    vi.mocked(getParticipantSession).mockResolvedValue({
      participantId: 'participant-1',
      participantName: 'Test Participant',
    });
    
    const draftState = createDraftState({
      status: 'paused',
      participantOrder: ['participant-1'],
    });
    vi.mocked(getActiveDraftState).mockResolvedValue(draftState);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pick', {
      participantId: 'participant-1',
      playerId: 'player-1',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toContain('paused');
  });

  it('should return 403 when not participant turn', async () => {
    vi.mocked(getParticipantSession).mockResolvedValue({
      participantId: 'participant-1',
      participantName: 'Test Participant',
    });
    
    const draftState = createDraftState({
      status: 'in_progress',
      participantOrder: ['participant-1', 'participant-2'],
      currentPickIndex: 1, // participant-2's turn
      picks: [],
    });
    vi.mocked(getActiveDraftState).mockResolvedValue(draftState);
    vi.mocked(getCurrentParticipantId).mockReturnValue('participant-2');
    
    const draftConfig = createDraftConfig();
    vi.mocked(prismaDraftConfigToDraftConfig).mockReturnValue(draftConfig);
    vi.mocked(prisma.draftConfig.findUnique).mockResolvedValue({
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
    
    // Mock participant picks query
    vi.mocked(prisma.pick.findMany).mockResolvedValue([]);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pick', {
      participantId: 'participant-1',
      playerId: 'player-1',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('turn');
  });

  it('should return 400 when pick validation fails', async () => {
    vi.mocked(getParticipantSession).mockResolvedValue({
      participantId: 'participant-1',
      participantName: 'Test Participant',
    });
    
    const draftState = createDraftState({
      status: 'in_progress',
      participantOrder: ['participant-1'],
      currentPickIndex: 0,
    });
    vi.mocked(getActiveDraftState).mockResolvedValue(draftState);
    vi.mocked(getCurrentParticipantId).mockReturnValue('participant-1');
    
    const draftConfig = createDraftConfig();
    vi.mocked(prismaDraftConfigToDraftConfig).mockReturnValue(draftConfig);
    vi.mocked(prisma.draftConfig.findUnique).mockResolvedValue({
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

    const player = createPlayer({ id: 'player-1' });
    vi.mocked(prisma.player.findUnique).mockResolvedValue({
      id: player.id,
      name: player.name,
      team: player.team,
      role: player.role,
      isForeign: player.isForeign,
      metadata: null,
      externalId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.mocked(validatePick).mockReturnValue({
      valid: false,
      errors: ['Player already drafted'],
    });

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pick', {
      participantId: 'participant-1',
      playerId: 'player-1',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.validationErrors).toBeDefined();
    expect(Array.isArray(data.validationErrors)).toBe(true);
  });

  it('should return 200 and record pick on valid request', async () => {
    vi.mocked(getParticipantSession).mockResolvedValue({
      participantId: 'participant-1',
      participantName: 'Test Participant',
    });
    
    const draftState = createDraftState({
      status: 'in_progress',
      participantOrder: ['participant-1'],
      currentPickIndex: 0,
    });
    vi.mocked(getActiveDraftState).mockResolvedValue(draftState);
    vi.mocked(getCurrentParticipantId).mockReturnValue('participant-1');
    
    const draftConfig = createDraftConfig();
    vi.mocked(prismaDraftConfigToDraftConfig).mockReturnValue(draftConfig);
    vi.mocked(prisma.draftConfig.findUnique).mockResolvedValue({
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

    const player = createPlayer({ id: 'player-1' });
    vi.mocked(prisma.player.findUnique).mockResolvedValue({
      id: player.id,
      name: player.name,
      team: player.team,
      role: player.role,
      isForeign: player.isForeign,
      metadata: null,
      externalId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Mock participant picks query
    vi.mocked(prisma.pick.findMany).mockResolvedValue([]);
    
    vi.mocked(validatePick).mockReturnValue({ valid: true });
    vi.mocked(calculatePickNumber).mockReturnValue(1);
    vi.mocked(addPick).mockResolvedValue(draftState);
    vi.mocked(advanceToNextPick).mockResolvedValue(draftState);
    vi.mocked(getDraftState).mockResolvedValue(draftState);
    
    // Mock pick creation
    vi.mocked(prisma.pick.create).mockResolvedValue({
      id: 'pick-1',
      draftStateId: draftState.id,
      participantId: 'participant-1',
      playerId: 'player-1',
      round: 1,
      pickNumber: 1,
      timestamp: new Date(),
    } as any);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pick', {
      participantId: 'participant-1',
      playerId: 'player-1',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(broadcastEvent).toHaveBeenCalledWith(EVENTS.PICK_MADE, expect.any(Object));
  });
});
