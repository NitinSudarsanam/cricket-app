/**
 * Unit Tests for POST /api/draft/pause
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/draft/pause/route';
import { createMockJsonRequest } from '@/__tests__/helpers/mock-request';
import { createDraftState } from '@/__tests__/helpers/mock-factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    draftState: { findUnique: vi.fn(), update: vi.fn() },
  },
  handleDatabaseError: vi.fn((e) => 'Database error'),
}));

vi.mock('@/lib/auth-helpers', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/draft-state-manager', () => ({
  pauseDraftState: vi.fn(),
  resumeDraftState: vi.fn(),
  getActiveDraftState: vi.fn(),
}));

vi.mock('@/lib/pusher-server', () => ({
  broadcastEvent: vi.fn(),
  EVENTS: { STATE_UPDATE: 'state_update', DRAFT_PAUSED: 'draft_paused', DRAFT_RESUMED: 'draft_resumed' },
}));

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';
import { pauseDraftState, resumeDraftState, getActiveDraftState } from '@/lib/draft-state-manager';
import { broadcastEvent, EVENTS } from '@/lib/pusher-server';

describe('POST /api/draft/pause', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated as admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: false,
      status: 401,
      error: 'Unauthorized',
    });

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pause', {
      action: 'pause',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 400 for invalid action', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pause', {
      action: 'invalid',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid action');
  });

  it('should return 404 when no active draft', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    vi.mocked(getActiveDraftState).mockResolvedValue(null);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pause', {
      action: 'pause',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('No active draft');
  });

  it('should pause draft successfully', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    
    const draftState = createDraftState({ status: 'in_progress' });
    vi.mocked(getActiveDraftState).mockResolvedValue(draftState);
    vi.mocked(prisma.draftState.findUnique).mockResolvedValue({
      id: draftState.id,
      status: 'in_progress',
      currentRound: draftState.currentRound,
      currentPickIndex: draftState.currentPickIndex,
      draftOrderType: 'snake',
      draftConfigId: draftState.draftConfigId,
      startedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    
    const pausedState = { ...draftState, status: 'paused' };
    vi.mocked(pauseDraftState).mockResolvedValue(pausedState as any);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pause', {
      action: 'pause',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Check that broadcastEvent was called (may be called with different event name)
    expect(broadcastEvent).toHaveBeenCalled();
  });

  it('should resume draft successfully', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    
    const draftState = createDraftState({ status: 'paused' });
    vi.mocked(getActiveDraftState).mockResolvedValue(draftState);
    vi.mocked(prisma.draftState.findUnique).mockResolvedValue({
      id: draftState.id,
      status: 'paused',
      currentRound: draftState.currentRound,
      currentPickIndex: draftState.currentPickIndex,
      draftOrderType: 'snake',
      draftConfigId: draftState.draftConfigId,
      startedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    
    const resumedState = { ...draftState, status: 'in_progress' };
    vi.mocked(resumeDraftState).mockResolvedValue(resumedState as any);

    const request = createMockJsonRequest('http://localhost:3000/api/draft/pause', {
      action: 'resume',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Check that broadcastEvent was called
    expect(broadcastEvent).toHaveBeenCalled();
  });
});
