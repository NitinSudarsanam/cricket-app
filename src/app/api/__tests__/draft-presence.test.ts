import { describe, expect, it, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/draft/presence/route';
import { createMockJsonRequest } from '@/__tests__/helpers/mock-request';

vi.mock('@/lib/session', () => ({
  getParticipantSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    participant: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/pusher-server', () => ({
  broadcastEvent: vi.fn(),
  EVENTS: {
    PARTICIPANT_ONLINE: 'draft:participant_online',
    PARTICIPANT_OFFLINE: 'draft:participant_offline',
  },
}));

import { getParticipantSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { broadcastEvent } from '@/lib/pusher-server';

describe('POST /api/draft/presence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without a session', async () => {
    vi.mocked(getParticipantSession).mockResolvedValue(null);
    const response = await POST(
      createMockJsonRequest('http://localhost:3000/api/draft/presence', {
        status: 'online',
      })
    );
    expect(response.status).toBe(401);
  });

  it('returns 403 when the body tries to spoof another participant', async () => {
    vi.mocked(getParticipantSession).mockResolvedValue({
      participantId: 'p1',
      participantName: 'Alice',
    });
    const response = await POST(
      createMockJsonRequest('http://localhost:3000/api/draft/presence', {
        participantId: 'p2',
        participantName: 'Bob',
        status: 'online',
      })
    );
    expect(response.status).toBe(403);
    expect(broadcastEvent).not.toHaveBeenCalled();
  });

  it('broadcasts the session participant, not the body name', async () => {
    vi.mocked(getParticipantSession).mockResolvedValue({
      participantId: 'p1',
      participantName: 'Alice',
    });
    vi.mocked(prisma.participant.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Alice',
    } as any);

    const response = await POST(
      createMockJsonRequest('http://localhost:3000/api/draft/presence', {
        participantId: 'p1',
        participantName: 'Not Alice',
        status: 'online',
        draftStateId: 'draft-1',
      })
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data.participantId).toBe('p1');
    expect(broadcastEvent).toHaveBeenCalledWith(
      'draft:participant_online',
      expect.objectContaining({ participantId: 'p1', participantName: 'Alice' }),
      'draft-1'
    );
  });
});
