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
export interface SportmonksBattingLine {
  player_id?: number;
  player?: { id?: number; fullname?: string };
  score?: number | string;
  ball?: number | string;
  four_x?: number | string;
  six_x?: number | string;
  rate?: number | string;
  is_notout?: boolean;
  dismissal?: string;
  catch_stump_player_id?: number | null;
  runout_by_id?: number | null;
  bowling_player_id?: number | null;
}

export interface SportmonksBowlingLine {
  player_id?: number;
  player?: { id?: number; fullname?: string };
  overs?: number | string;
  medians?: number | string;
  runs?: number | string;
  wickets?: number | string;
  wide?: number | string;
  noball?: number | string;
  rate?: number | string;
}

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
  batting?: SportmonksBattingLine[];
  bowling?: SportmonksBowlingLine[];
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
