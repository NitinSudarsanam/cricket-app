/**
 * Resolve active scoring rules for a league/season (by date).
 */

import { prisma } from '@/lib/db';

export type Outcome = 'win' | 'loss' | 'tie' | 'no_result';

export interface ActiveRule {
  outcome: Outcome;
  points: number;
}

/**
 * Get active scoring rules for a season (and optionally league).
 * Rules with null leagueId/seasonId are global. effectiveFrom/effectiveTo filter by season start when set.
 */
export async function getActiveRulesForSeason(
  seasonId: string,
  leagueId?: string | null
): Promise<ActiveRule[]> {
  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  const at = season?.startDate ?? new Date();

  const rules = await prisma.scoringRule.findMany({
    where: {
      AND: [
        { OR: [{ seasonId: null }, { seasonId }] },
        { OR: [{ leagueId: null }, ...(leagueId ? [{ leagueId }] : [])] },
        { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: at } }] },
        { OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }] },
      ],
    },
  });

  const byOutcome = new Map<string, { rule: ActiveRule; spec: number }>();
  for (const r of rules) {
    const key = r.outcome;
    const spec = (r.seasonId ? 2 : 0) + (r.leagueId ? 1 : 0);
    const entry = byOutcome.get(key);
    if (!entry || spec > entry.spec) {
      byOutcome.set(key, { rule: { outcome: r.outcome as Outcome, points: r.points }, spec });
    }
  }

  return Array.from(byOutcome.values()).map((e) => e.rule);
}
