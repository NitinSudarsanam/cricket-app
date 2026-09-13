import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FANTASY_RULES,
  aggregateFantasyPoints,
  computeFantasyPoints,
  mergeFantasyRules,
} from '../fantasy-scoring-engine';

describe('computeFantasyPoints', () => {
  it('scores a batter from runs, boundaries, and milestones', () => {
    const result = computeFantasyPoints({
      runs: 72,
      ballsFaced: 48,
      fours: 6,
      sixes: 3,
      didBat: true,
      dismissed: true,
    });

    expect(result.breakdown.run).toBe(72);
    expect(result.breakdown.four_bonus).toBe(6);
    expect(result.breakdown.six_bonus).toBe(6);
    expect(result.breakdown.thirty_bonus).toBe(4);
    expect(result.breakdown.fifty_bonus).toBe(8);
    expect(result.breakdown.century_bonus).toBeUndefined();
    expect(result.points).toBe(96);
  });

  it('applies a duck only when the batter was dismissed for 0', () => {
    const duck = computeFantasyPoints({
      runs: 0,
      ballsFaced: 3,
      didBat: true,
      dismissed: true,
    });
    expect(duck.breakdown.duck).toBe(-2);
    expect(duck.points).toBe(-2);

    const notOut = computeFantasyPoints({
      runs: 0,
      ballsFaced: 0,
      didBat: true,
      dismissed: false,
    });
    expect(notOut.breakdown.duck).toBeUndefined();

    const didNotBat = computeFantasyPoints({
      runs: 0,
      didBat: false,
      dismissed: false,
      wickets: 1,
    });
    expect(didNotBat.breakdown.duck).toBeUndefined();
    expect(didNotBat.points).toBe(25);
  });

  it('scores a bowler with wicket haul bonuses and maidens', () => {
    const result = computeFantasyPoints({
      wickets: 5,
      maidens: 1,
      bowlingRuns: 18,
      oversBowled: 4,
      didBowl: true,
    });

    expect(result.breakdown.wicket).toBe(125);
    expect(result.breakdown.three_wicket).toBe(4);
    expect(result.breakdown.four_wicket).toBe(8);
    expect(result.breakdown.five_wicket).toBe(16);
    expect(result.breakdown.maiden).toBe(12);
    expect(result.points).toBe(165);
  });

  it('scores fielding contributions', () => {
    const result = computeFantasyPoints({
      catches: 2,
      stumpings: 1,
      runOuts: 1,
    });
    expect(result.points).toBe(16 + 12 + 6);
  });

  it('gives a CSK batter and CSK bowler different totals from the same team win', () => {
    const batter = computeFantasyPoints({
      runs: 45,
      fours: 4,
      sixes: 1,
      didBat: true,
      dismissed: true,
    });
    const bowler = computeFantasyPoints({
      wickets: 3,
      maidens: 1,
      didBowl: true,
    });

    expect(batter.points).not.toBe(bowler.points);
    expect(batter.points).toBe(45 + 4 + 2 + 4);
    expect(bowler.points).toBe(75 + 4 + 12);
  });

  it('honors rule overrides', () => {
    const rules = mergeFantasyRules({ wicket: 30, duck: -4 });
    const result = computeFantasyPoints({ wickets: 2 }, rules);
    expect(result.points).toBe(60);
    expect(rules.duck).toBe(-4);
    expect(rules.run).toBe(DEFAULT_FANTASY_RULES.run);
  });
});

describe('aggregateFantasyPoints', () => {
  it('sums match-by-match breakdowns for a season', () => {
    const result = aggregateFantasyPoints([
      { runs: 30, didBat: true, dismissed: true },
      { wickets: 2, didBowl: true },
    ]);
    expect(result.breakdown.run).toBe(30);
    expect(result.breakdown.thirty_bonus).toBe(4);
    expect(result.breakdown.wicket).toBe(50);
    expect(result.points).toBe(84);
  });
});
