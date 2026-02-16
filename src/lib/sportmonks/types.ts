/**
 * Sportmonks Cricket API response DTOs (v2.0)
 * Types aligned with API JSON responses. See: https://docs.sportmonks.com/v2/cricket-api/
 * All fields not guaranteed by the API are optional so mappers do not break when the API omits them.
 */

export interface SportmonksPagination {
  current_page: number;
  per_page: number;
  total: number;
}

/** Standard envelope: { data, meta?: { pagination } }. Arrays may be returned as a single object; client normalizes to array. */
export interface SportmonksApiResponse<T> {
  data: T;
  meta?: { pagination?: SportmonksPagination };
}

/** Leagues endpoint. image_path, type, country_id optional per API. */
export interface SportmonksLeague {
  id: number;
  name: string;
  image_path?: string;
  type?: string;
  country_id?: number;
}

/** Seasons endpoint. starting_at, ending_at optional (ISO date strings). */
export interface SportmonksSeason {
  id: number;
  name: string;
  league_id: number;
  starting_at?: string;
  ending_at?: string;
}

/** Teams endpoint. Cricket may use `code`; Football uses short_code. image_path optional. */
export interface SportmonksTeam {
  id: number;
  name: string;
  short_code?: string;
  code?: string;
  image_path?: string;
  country_id?: number;
}

/** Fixtures endpoint. starting_at required for fixture date; other fields optional. */
export interface SportmonksFixture {
  id: number;
  name?: string;
  league_id?: number;
  season_id?: number;
  stage_id?: number;
  localteam_id?: number;
  visitorteam_id?: number;
  starting_at: string;
  status?: string;
  winner_team_id?: number | null;
  round?: string;
  scores?: string | { localteam_score?: string; visitorteam_score?: string };
  localteam?: SportmonksTeam;
  visitorteam?: SportmonksTeam;
  league?: SportmonksLeague;
  season?: SportmonksSeason;
}

export type FixtureStatus = 'NS' | 'LIVE' | 'FT' | 'AOT' | 'AWD' | 'ABD' | 'CANCL' | 'PST' | 'TBD' | string;

/** Squad include: player object nested under team. position.name: Batsman, Bowler, Wicketkeeper, Allrounder, etc. */
export interface SportmonksPosition {
  resource?: string;
  id?: number;
  name?: string;
}

export interface SportmonksSquadPlayer {
  resource?: string;
  id: number;
  fullname?: string;
  firstname?: string;
  lastname?: string;
  position?: SportmonksPosition;
  country_id?: number;
  image_path?: string;
  dateofbirth?: string;
  updated_at?: string;
}

/** Team with squad include. squad array may be present when include=squad and filter[season_id] set. */
export interface SportmonksTeamWithSquad extends SportmonksTeam {
  squad?: SportmonksSquadPlayer[];
}
