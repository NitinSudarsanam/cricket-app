/**
 * Ranking engine: compute points from MatchResult using ScoringRule, update TeamScore, set processedAt.
 */

import { prisma } from '@/lib/db';
import { getActiveRulesForSeason } from '@/services/scoring/scoring-rule-service';

type Outcome = 'win_local' | 'win_visitor' | 'tie' | 'no_result';

const OUTCOME_TO_RULE: Record<Outcome, 'win' | 'loss' | 'tie' | 'no_result'> = {
  win_local: 'win',
  win_visitor: 'loss',
  tie: 'tie',
  no_result: 'no_result',
};

/** Map match outcome (per team) to rule outcome: local wins -> local gets 'win', visitor gets 'loss'. */
function ruleOutcomeForLocal(outcome: Outcome): 'win' | 'loss' | 'tie' | 'no_result' {
  return OUTCOME_TO_RULE[outcome];
}
function ruleOutcomeForVisitor(outcome: Outcome): 'win' | 'loss' | 'tie' | 'no_result' {
  if (outcome === 'win_local') return 'loss';
  if (outcome === 'win_visitor') return 'win';
  return outcome === 'tie' ? 'tie' : 'no_result';
}

/**
 * Process a single MatchResult: update TeamScore for both teams, set MatchResult.processedAt.
 * Idempotent: if processedAt already set, skip.
 */
export async function processMatchResult(matchResultId: string): Promise<void> {
  const matchResult = await prisma.matchResult.findUnique({
    where: { id: matchResultId },
    include: { match: true },
  });
  if (!matchResult) {
    throw new Error(`MatchResult not found: ${matchResultId}`);
  }
  if (matchResult.processedAt) {
    return; // already processed
  }

  const outcome = matchResult.outcome as Outcome;
  const seasonId = matchResult.match.seasonId;
  const leagueId = matchResult.match.leagueId ?? undefined;
  const rules = await getActiveRulesForSeason(seasonId, leagueId);
  const pointsByOutcome = new Map(rules.map((r) => [r.outcome, r.points]));
  const pointsFor = (o: 'win' | 'loss' | 'tie' | 'no_result') => pointsByOutcome.get(o) ?? 0;

  const localRuleOutcome = ruleOutcomeForLocal(outcome);
  const visitorRuleOutcome = ruleOutcomeForVisitor(outcome);
  const localPoints = pointsFor(localRuleOutcome);
  const visitorPoints = pointsFor(visitorRuleOutcome);

  const startAt = matchResult.match.startAt;

  await prisma.$transaction(async (tx) => {
    // Upsert TeamScore for local team
    const localExisting = await tx.teamScore.findUnique({
      where: { teamId_seasonId: { teamId: matchResult.localTeamId, seasonId } },
    });
    if (localExisting) {
      await tx.teamScore.update({
        where: { id: localExisting.id },
        data: {
          points: localExisting.points + localPoints,
          matchesPlayed: localExisting.matchesPlayed + 1,
          wins: localExisting.wins + (localRuleOutcome === 'win' ? 1 : 0),
          ties: localExisting.ties + (localRuleOutcome === 'tie' ? 1 : 0),
          noResults: localExisting.noResults + (localRuleOutcome === 'no_result' ? 1 : 0),
          losses: localExisting.losses + (localRuleOutcome === 'loss' ? 1 : 0),
          lastMatchAt: startAt,
        },
      });
    } else {
      await tx.teamScore.create({
        data: {
          teamId: matchResult.localTeamId,
          seasonId,
          points: localPoints,
          matchesPlayed: 1,
          wins: localRuleOutcome === 'win' ? 1 : 0,
          ties: localRuleOutcome === 'tie' ? 1 : 0,
          noResults: localRuleOutcome === 'no_result' ? 1 : 0,
          losses: localRuleOutcome === 'loss' ? 1 : 0,
          lastMatchAt: startAt,
        },
      });
    }

    // Upsert TeamScore for visitor team
    const visitorExisting = await tx.teamScore.findUnique({
      where: { teamId_seasonId: { teamId: matchResult.visitorTeamId, seasonId } },
    });
    if (visitorExisting) {
      await tx.teamScore.update({
        where: { id: visitorExisting.id },
        data: {
          points: visitorExisting.points + visitorPoints,
          matchesPlayed: visitorExisting.matchesPlayed + 1,
          wins: visitorExisting.wins + (visitorRuleOutcome === 'win' ? 1 : 0),
          ties: visitorExisting.ties + (visitorRuleOutcome === 'tie' ? 1 : 0),
          noResults: visitorExisting.noResults + (visitorRuleOutcome === 'no_result' ? 1 : 0),
          losses: visitorExisting.losses + (visitorRuleOutcome === 'loss' ? 1 : 0),
          lastMatchAt: startAt,
        },
      });
    } else {
      await tx.teamScore.create({
        data: {
          teamId: matchResult.visitorTeamId,
          seasonId,
          points: visitorPoints,
          matchesPlayed: 1,
          wins: visitorRuleOutcome === 'win' ? 1 : 0,
          ties: visitorRuleOutcome === 'tie' ? 1 : 0,
          noResults: visitorRuleOutcome === 'no_result' ? 1 : 0,
          losses: visitorRuleOutcome === 'loss' ? 1 : 0,
          lastMatchAt: startAt,
        },
      });
    }

    await tx.matchResult.update({
      where: { id: matchResultId },
      data: { processedAt: new Date() },
    });
  });
}
