import { describe, expect, it } from 'vitest';
import { pickScorePoints } from '../leaderboard-service';

describe('pickScorePoints', () => {
  it('uses fantasy points and ignores team table copy', () => {
    expect(
      pickScorePoints([
        { points: 14, source: 'team_only' },
        { points: 3, source: 'fantasy' },
      ])
    ).toBe(3);
  });

  it('does not fall back to team points when fantasy stats are missing', () => {
    expect(pickScorePoints([{ points: 14, source: 'team_only' }])).toBe(0);
    expect(pickScorePoints([])).toBe(0);
  });
});
