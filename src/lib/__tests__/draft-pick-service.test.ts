import { describe, expect, it } from 'vitest';
import { isTurnExpired, secondsRemainingOnClock } from '../draft-clock';

describe('draft pick clock', () => {
  it('counts remaining seconds from the server turn start', () => {
    const started = new Date('2026-09-13T20:00:00.000Z');
    const now = new Date('2026-09-13T20:00:40.000Z');
    expect(secondsRemainingOnClock(started, 60, now)).toBe(20);
  });

  it('treats a missing start as not expired', () => {
    expect(isTurnExpired(null, 60)).toBe(false);
    expect(secondsRemainingOnClock(undefined, 60)).toBe(60);
  });

  it('expires once the timeout has elapsed', () => {
    const started = new Date('2026-09-13T20:00:00.000Z');
    const now = new Date('2026-09-13T20:01:01.000Z');
    expect(isTurnExpired(started, 60, now)).toBe(true);
    expect(secondsRemainingOnClock(started, 60, now)).toBe(0);
  });
});
