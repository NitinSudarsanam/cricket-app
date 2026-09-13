import { describe, expect, it } from 'vitest';
import { extractPlayerStatsFromFixture } from '../player-match-stats';
import type { SportmonksFixture } from '@/lib/sportmonks/types';

describe('extractPlayerStatsFromFixture', () => {
  it('maps batting, bowling, and fielding lines onto distinct players', () => {
    const fixture = {
      id: 1,
      starting_at: '2024-03-22T14:00:00.000Z',
      batting: [
        {
          player_id: 10,
          score: 56,
          ball: 32,
          four_x: 5,
          six_x: 2,
          is_notout: false,
          dismissal: 'caught',
          catch_stump_player_id: 30,
        },
        {
          player_id: 11,
          score: 0,
          ball: 2,
          four_x: 0,
          six_x: 0,
          is_notout: false,
          dismissal: 'bowled',
        },
      ],
      bowling: [
        {
          player_id: 20,
          wickets: 3,
          medians: 1,
          overs: 4,
          runs: 22,
        },
      ],
    } as SportmonksFixture;

    const stats = extractPlayerStatsFromFixture(fixture);
    const batter = stats.find((s) => s.externalPlayerId === '10');
    const duck = stats.find((s) => s.externalPlayerId === '11');
    const bowler = stats.find((s) => s.externalPlayerId === '20');
    const fielder = stats.find((s) => s.externalPlayerId === '30');

    expect(batter).toMatchObject({
      runs: 56,
      fours: 5,
      sixes: 2,
      didBat: true,
      dismissed: true,
    });
    expect(duck).toMatchObject({ runs: 0, didBat: true, dismissed: true });
    expect(bowler).toMatchObject({ wickets: 3, maidens: 1, didBowl: true });
    expect(fielder).toMatchObject({ catches: 1 });
  });

  it('does not treat a run-out as a catch', () => {
    const fixture = {
      id: 2,
      starting_at: '2024-03-23T14:00:00.000Z',
      batting: [
        {
          player_id: 40,
          score: 8,
          ball: 10,
          dismissal: 'run out',
          catch_stump_player_id: 50,
          runout_by_id: 60,
        },
      ],
    } as SportmonksFixture;

    const stats = extractPlayerStatsFromFixture(fixture);
    expect(stats.find((s) => s.externalPlayerId === '50')?.catches).toBe(0);
    expect(stats.find((s) => s.externalPlayerId === '60')?.runOuts).toBe(1);
  });
});
