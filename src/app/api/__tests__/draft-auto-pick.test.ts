import { describe, expect, it, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/draft/auto-pick/route';
import { createMockJsonRequest } from '@/__tests__/helpers/mock-request';

vi.mock('@/lib/db', () => ({
  handleDatabaseError: vi.fn(() => 'Database error'),
}));

vi.mock('@/lib/draft-pick-service', () => ({
  applyExpiredAutoPick: vi.fn(),
}));

import { applyExpiredAutoPick } from '@/lib/draft-pick-service';

describe('POST /api/draft/auto-pick', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns applied false when the clock has not expired', async () => {
    vi.mocked(applyExpiredAutoPick).mockResolvedValue(null);
    const response = await POST(
      createMockJsonRequest('http://localhost:3000/api/draft/auto-pick', {
        draftStateId: 'draft-1',
      })
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data.applied).toBe(false);
  });

  it('returns the auto-pick when the clock expired', async () => {
    vi.mocked(applyExpiredAutoPick).mockResolvedValue({
      draftState: { id: 'draft-1', status: 'in_progress' } as any,
      pick: { playerName: 'Virat Kohli', participantName: 'Alice', autoPick: true } as any,
      previousRound: 1,
    });
    const response = await POST(
      createMockJsonRequest('http://localhost:3000/api/draft/auto-pick', {
        draftStateId: 'draft-1',
      })
    );
    const data = await response.json();
    expect(data.data.applied).toBe(true);
    expect(data.data.pick.playerName).toBe('Virat Kohli');
  });
});
