/**
 * Unit Tests for GET /api/participants
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/participants/route';
import { createMockRequest } from '@/__tests__/helpers/mock-request';
import { createParticipant } from '@/__tests__/helpers/mock-factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    participant: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
  handleDatabaseError: vi.fn((e) => 'Database error'),
}));

import { prisma } from '@/lib/db';

describe('GET /api/participants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of participants', async () => {
    const participants = [
      createParticipant({ id: 'p1', name: 'Participant 1' }),
      createParticipant({ id: 'p2', name: 'Participant 2' }),
    ];

    vi.mocked(prisma.participant.findMany).mockResolvedValue(
      participants.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as any
    );

    const request = createMockRequest('http://localhost:3000/api/participants');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should return empty array when no participants', async () => {
    vi.mocked(prisma.participant.findMany).mockResolvedValue([]);

    const request = createMockRequest('http://localhost:3000/api/participants');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
  });
});
