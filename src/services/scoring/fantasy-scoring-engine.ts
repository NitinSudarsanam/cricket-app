/**
 * Player-level fantasy scoring from match batting / bowling / fielding stats.
 * Team standings remain separate (ScoringRule + TeamScore).
 */

export const FANTASY_STAT_KEYS = [
  'run',
  'four_bonus',
  'six_bonus',
  'thirty_bonus',
  'fifty_bonus',
  'century_bonus',
  'duck',
  'wicket',
  'three_wicket',
  'four_wicket',
  'five_wicket',
  'maiden',
  'catch',
  'stumping',
  'run_out',
] as const;

export type FantasyStatKey = (typeof FANTASY_STAT_KEYS)[number];

export type FantasyRuleMap = Record<FantasyStatKey, number>;

/** Dream11-style T20 defaults. */
export const DEFAULT_FANTASY_RULES: FantasyRuleMap = {
  run: 1,
  four_bonus: 1,
  six_bonus: 2,
  thirty_bonus: 4,
  fifty_bonus: 8,
  century_bonus: 16,
  duck: -2,
  wicket: 25,
  three_wicket: 4,
  four_wicket: 8,
  five_wicket: 16,
  maiden: 12,
  catch: 8,
  stumping: 12,
  run_out: 6,
};

export interface PlayerMatchStatInput {
  runs?: number | null;
  ballsFaced?: number | null;
  fours?: number | null;
  sixes?: number | null;
  wickets?: number | null;
  maidens?: number | null;
  bowlingRuns?: number | null;
  oversBowled?: number | null;
  catches?: number | null;
  stumpings?: number | null;
  runOuts?: number | null;
  didBat?: boolean | null;
  didBowl?: boolean | null;
  dismissed?: boolean | null;
}

export interface FantasyPointBreakdown {
  points: number;
  breakdown: Record<string, number>;
}

function n(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function mergeFantasyRules(
  overrides?: Partial<Record<string, number>> | null
): FantasyRuleMap {
  const merged: FantasyRuleMap = { ...DEFAULT_FANTASY_RULES };
  if (!overrides) return merged;
  for (const key of FANTASY_STAT_KEYS) {
    const next = overrides[key];
    if (typeof next === 'number' && Number.isFinite(next)) {
      merged[key] = next;
    }
  }
  return merged;
}

/**
 * Compute fantasy points for a single match performance.
 * Duck applies only when the player actually batted and was dismissed for 0.
 */
export function computeFantasyPoints(
  stat: PlayerMatchStatInput,
  rules: FantasyRuleMap = DEFAULT_FANTASY_RULES
): FantasyPointBreakdown {
  const breakdown: Record<string, number> = {};
  const runs = n(stat.runs);
  const fours = n(stat.fours);
  const sixes = n(stat.sixes);
  const wickets = n(stat.wickets);
  const maidens = n(stat.maidens);
  const catches = n(stat.catches);
  const stumpings = n(stat.stumpings);
  const runOuts = n(stat.runOuts);
  const didBat = Boolean(stat.didBat) || runs > 0 || n(stat.ballsFaced) > 0;
  const dismissed = Boolean(stat.dismissed);

  const add = (key: FantasyStatKey, units: number) => {
    if (units === 0 || rules[key] === 0) return;
    breakdown[key] = (breakdown[key] ?? 0) + rules[key] * units;
  };

  add('run', runs);
  add('four_bonus', fours);
  add('six_bonus', sixes);
  if (runs >= 30) add('thirty_bonus', 1);
  if (runs >= 50) add('fifty_bonus', 1);
  if (runs >= 100) add('century_bonus', 1);
  if (didBat && dismissed && runs === 0) add('duck', 1);

  add('wicket', wickets);
  if (wickets >= 3) add('three_wicket', 1);
  if (wickets >= 4) add('four_wicket', 1);
  if (wickets >= 5) add('five_wicket', 1);
  add('maiden', maidens);
  add('catch', catches);
  add('stumping', stumpings);
  add('run_out', runOuts);

  const points = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return { points, breakdown };
}

export function aggregateFantasyPoints(
  stats: PlayerMatchStatInput[],
  rules: FantasyRuleMap = DEFAULT_FANTASY_RULES
): FantasyPointBreakdown {
  const breakdown: Record<string, number> = {};
  let points = 0;
  for (const stat of stats) {
    const result = computeFantasyPoints(stat, rules);
    points += result.points;
    for (const [key, value] of Object.entries(result.breakdown)) {
      breakdown[key] = (breakdown[key] ?? 0) + value;
    }
  }
  return { points, breakdown };
}
