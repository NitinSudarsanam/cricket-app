import { describe, it, expect } from 'vitest';
import { getCurrentParticipantId } from '../draft-order';
import { createDraftState } from '@/__tests__/helpers/mock-factories';

describe('getCurrentParticipantId', () => {
  it('uses draftOrderType from state when the order argument is omitted', () => {
    const linearEvenRound = createDraftState({
      currentRound: 2,
      currentPickIndex: 0,
      participantOrder: ['p1', 'p2'],
      draftOrderType: 'linear',
    });

    expect(getCurrentParticipantId(linearEvenRound)).toBe('p1');
  });

  it('defaults to snake when no order type is provided', () => {
    const evenRound = createDraftState({
      currentRound: 2,
      currentPickIndex: 0,
      participantOrder: ['p1', 'p2'],
    });

    expect(getCurrentParticipantId(evenRound)).toBe('p2');
  });
});
