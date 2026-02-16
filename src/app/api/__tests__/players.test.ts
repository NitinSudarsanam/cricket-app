/**
 * Unit Tests for POST /api/players
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/players/route';
import { createMockJsonRequest } from '@/__tests__/helpers/mock-request';
import { createPlayer } from '@/__tests__/helpers/mock-factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    player: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
  handleDatabaseError: vi.fn((e) => 'Database error'),
  isDatabaseTimeoutError: vi.fn(() => false),
}));

vi.mock('@/lib/auth-helpers', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/type-guards', () => ({
  isIPLTeam: vi.fn(),
  isPlayerRole: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';
import { isIPLTeam, isPlayerRole } from '@/lib/type-guards';

describe('POST /api/players', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated as admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: false,
      status: 401,
      error: 'Unauthorized',
    });

    const request = createMockJsonRequest('http://localhost:3000/api/players', {
      name: 'Test Player',
      team: 'CSK',
      role: 'Bat',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 400 when name is missing', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });

    const request = createMockJsonRequest('http://localhost:3000/api/players', {
      team: 'CSK',
      role: 'Bat',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('name');
  });

  it('should return 400 when team is invalid', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    vi.mocked(isIPLTeam).mockReturnValue(false);

    const request = createMockJsonRequest('http://localhost:3000/api/players', {
      name: 'Test Player',
      team: 'INVALID',
      role: 'Bat',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid team');
  });

  it('should return 400 when role is invalid', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    vi.mocked(isIPLTeam).mockReturnValue(true);
    vi.mocked(isPlayerRole).mockReturnValue(false);

    const request = createMockJsonRequest('http://localhost:3000/api/players', {
      name: 'Test Player',
      team: 'CSK',
      role: 'INVALID',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid role');
  });

  it('should return 200 and create player on valid request', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      session: { adminId: 'admin' },
    });
    vi.mocked(isIPLTeam).mockReturnValue(true);
    vi.mocked(isPlayerRole).mockReturnValue(true);
    
    const player = createPlayer();
    vi.mocked(prisma.player.create).mockResolvedValue({
      id: player.id,
      name: player.name.trim(),
      team: player.team,
      role: player.role,
      isForeign: player.isForeign,
      metadata: null,
      externalId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = createMockJsonRequest('http://localhost:3000/api/players', {
      name: player.name,
      team: player.team,
      role: player.role,
      isForeign: player.isForeign,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(prisma.player.create).toHaveBeenCalled();
  });
});
