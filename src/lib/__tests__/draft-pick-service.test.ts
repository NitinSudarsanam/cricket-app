import { describe, expect, it } from 'vitest';
import { isTurnExpired, isUniqueConstraintError, secondsRemainingOnClock } from '../draft-clock';
import { rankAutoPickCandidates } from '../draft-pick-service';
import { createPlayer } from '@/__tests__/helpers/mock-factories';

describe('draft pick clock', () => {
  it('counts remaining seconds from the server turn start', () => {
    const started = new Date('2026-09-13T20:00:00.000Z');
    const now = new Date('2026-09-13T20:00:40.000Z');
    expect(secondsRemainingOnClock(started, 60, now)).toBe(20);
  });

  it('falls back to draft start when the turn timestamp is missing', () => {
    const startedAt = new Date('2026-09-13T19:00:00.000Z');
    const now = new Date('2026-09-13T20:00:00.000Z');
    expect(isTurnExpired(null, 60, now, startedAt)).toBe(true);
    expect(secondsRemainingOnClock(undefined, 60, now, startedAt)).toBe(0);
  });

  it('uses now when both turn and draft start are missing', () => {
    const now = new Date('2026-09-13T20:00:00.000Z');
    expect(isTurnExpired(null, 60, now)).toBe(false);
    expect(secondsRemainingOnClock(undefined, 60, now)).toBe(60);
  });

  it('expires once the timeout has elapsed', () => {
    const started = new Date('2026-09-13T20:00:00.000Z');
    const now = new Date('2026-09-13T20:01:01.000Z');
    expect(isTurnExpired(started, 60, now)).toBe(true);
    expect(secondsRemainingOnClock(started, 60, now)).toBe(0);
  });

  it('treats Prisma unique violations as pick conflicts', () => {
    expect(isUniqueConstraintError({ code: 'P2002' })).toBe(true);
    expect(isUniqueConstraintError(new Error('Unique constraint failed on P2002'))).toBe(true);
    expect(isUniqueConstraintError(new Error('other'))).toBe(false);
  });
});

describe('rankAutoPickCandidates', () => {
  it('prefers eligible players by score, then leftover players', () => {
    const highIneligible = createPlayer({ id: 'p-high', name: 'High', role: 'WK' });
    const lowEligible = createPlayer({ id: 'p-low', name: 'Low', role: 'Bat' });
    const scores = new Map([
      ['p-high', 100],
      ['p-low', 10],
    ]);

    const leftover = rankAutoPickCandidates(
      [highIneligible, lowEligible],
      new Set(),
      scores
    );
    expect(leftover[0]?.id).toBe('p-high');

    const eligible = rankAutoPickCandidates(
      [highIneligible, lowEligible],
      new Set(['p-low']),
      scores
    );
    expect(eligible[0]?.id).toBe('p-low');
  });
});
