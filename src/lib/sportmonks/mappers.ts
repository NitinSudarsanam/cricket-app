/**
 * Normalization: map Sportmonks API DTOs to internal domain entities for DB upsert.
 */

import type {
  SportmonksFixture,
  SportmonksLeague,
  SportmonksSeason,
  SportmonksTeam,
} from './types';

export interface NormalizedLeague {
  externalId: string;
  name: string;
  slug: string | null;
  imageUrl: string | null;
}

export interface NormalizedSeason {
  externalId: string;
  leagueId: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
}

export interface NormalizedTeam {
  externalId: string;
  leagueId: string | null;
  name: string;
  shortCode: string | null;
  imageUrl: string | null;
}

export interface NormalizedMatch {
  externalId: string;
  seasonId: string;
  leagueId: string | null;
  localTeamExternalId: string;
  visitorTeamExternalId: string;
  startAt: Date;
  status: string;
  winnerTeamExternalId: string | null;
  resultSummary: string | null;
  rawPayload: Record<string, unknown> | null;
}

export function mapApiLeagueToLeague(api: SportmonksLeague): NormalizedLeague {
  return {
    externalId: String(api.id),
    name: api.name ?? '',
    slug: api.name ? api.name.toLowerCase().replace(/\s+/g, '-') : null,
    imageUrl: api.image_path ?? null,
  };
}

export function mapApiSeasonToSeason(
  api: SportmonksSeason,
  leagueId: string
): NormalizedSeason {
  return {
    externalId: String(api.id),
    leagueId,
    name: api.name ?? '',
    startDate: api.starting_at ? new Date(api.starting_at) : null,
    endDate: api.ending_at ? new Date(api.ending_at) : null,
  };
}

export function mapApiTeamToTeam(
  api: SportmonksTeam,
  leagueId: string | null
): NormalizedTeam {
  return {
    externalId: String(api.id),
    leagueId,
    name: api.name ?? '',
    shortCode: api.short_code ?? (api as { code?: string }).code ?? null,
    imageUrl: api.image_path ?? null,
  };
}

export function mapApiFixtureToMatch(
  api: SportmonksFixture,
  seasonId: string,
  leagueId: string | null
): NormalizedMatch {
  const scores = api.scores;
  let resultSummary: string | null = null;
  if (typeof scores === 'string') resultSummary = scores;
  else if (scores && typeof scores === 'object')
    resultSummary = [scores.localteam_score, scores.visitorteam_score].filter(Boolean).join(' - ') || null;

  const startAtRaw = api.starting_at ? new Date(api.starting_at) : new Date(0);
  const startAt = Number.isNaN(startAtRaw.getTime()) ? new Date(0) : startAtRaw;

  return {
    externalId: String(api.id),
    seasonId,
    leagueId,
    localTeamExternalId: String(api.localteam_id ?? 0),
    visitorTeamExternalId: String(api.visitorteam_id ?? 0),
    startAt,
    status: api.status ?? 'NS',
    winnerTeamExternalId: api.winner_team_id != null ? String(api.winner_team_id) : null,
    resultSummary,
    rawPayload: api as unknown as Record<string, unknown>,
  };
}
