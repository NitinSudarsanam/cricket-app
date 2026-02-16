/**
 * Sportmonks Cricket API client (v2.0)
 * REST JSON, API token auth, retry on 429.
 */

import type {
  SportmonksApiResponse,
  SportmonksFixture,
  SportmonksLeague,
  SportmonksSeason,
  SportmonksTeam,
  SportmonksTeamWithSquad,
} from './types';

const DEFAULT_BASE = 'https://cricket.sportmonks.com/api/v2.0';
const DEFAULT_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function getApiToken(): string {
  const token = process.env.SPORTMONKS_API_TOKEN;
  if (!token) {
    throw new Error('SPORTMONKS_API_TOKEN is not set');
  }
  return token;
}

function buildUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const base = process.env.SPORTMONKS_BASE_URL ?? DEFAULT_BASE;
  const url = new URL(path.startsWith('http') ? path : `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);
  url.searchParams.set('api_token', getApiToken());
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  });
  return url.toString();
}

/** Base URL used for requests (no token). Useful for 404 hints. */
function getBaseUrl(): string {
  const base = process.env.SPORTMONKS_BASE_URL ?? DEFAULT_BASE;
  return base.replace(/\/$/, '');
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { Accept: 'application/json', ...options.headers },
      });
      clearTimeout(timeout);

      if (res.status === 429) {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        throw new Error('Sportmonks API rate limit exceeded');
      }

      if (!res.ok) {
        const text = await res.text();
        const base = getBaseUrl();
        if (res.status === 404) {
          throw new Error(
            `Sportmonks API 404 at ${base}. This usually means: (1) your token does not include Cricket API access (check your plan at my.sportmonks.com), or (2) the base URL is wrong. Set SPORTMONKS_BASE_URL in .env if Sportmonks gave you a different URL. Raw: ${text.slice(0, 150)}`
          );
        }
        throw new Error(`Sportmonks API error ${res.status}: ${text.slice(0, 200)}`);
      }

      return (await res.json()) as T;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < MAX_RETRIES - 1 && (lastError.name === 'AbortError' || (e as { status?: number }).status === 429)) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error('Sportmonks API request failed');
}

export async function getLeagues(): Promise<SportmonksLeague[]> {
  const url = buildUrl('/leagues');
  const res = await fetchWithRetry<SportmonksApiResponse<SportmonksLeague[]>>(url);
  return Array.isArray(res.data) ? res.data : [res.data as unknown as SportmonksLeague];
}

export async function getLeagueById(id: number): Promise<SportmonksLeague | null> {
  const url = buildUrl(`/leagues/${id}`);
  try {
    const res = await fetchWithRetry<SportmonksApiResponse<SportmonksLeague>>(url);
    return res.data ?? null;
  } catch {
    return null;
  }
}

/** Fetch seasons. Cricket API uses GET /seasons (all); we filter by league_id when leagueId is provided. */
export async function getSeasons(leagueId?: number): Promise<SportmonksSeason[]> {
  const url = buildUrl('/seasons');
  const res = await fetchWithRetry<SportmonksApiResponse<SportmonksSeason[]>>(url);
  const data = res.data;
  const list = Array.isArray(data) ? data : [data as unknown as SportmonksSeason];
  if (leagueId != null) {
    return list.filter((s) => (s as { league_id?: number }).league_id === leagueId);
  }
  return list;
}

export async function getSeasonById(id: number): Promise<SportmonksSeason | null> {
  const url = buildUrl(`/seasons/${id}`);
  try {
    const res = await fetchWithRetry<SportmonksApiResponse<SportmonksSeason>>(url);
    return res.data ?? null;
  } catch {
    return null;
  }
}

/** Fetch teams. Cricket API allows filter[season_id] only (not league_id). Use getTeamsBySeason for a league's teams. */
export async function getTeams(leagueId?: number): Promise<SportmonksTeam[]> {
  const url = buildUrl('/teams');
  const res = await fetchWithRetry<SportmonksApiResponse<SportmonksTeam[]>>(url);
  const data = res.data;
  const list = Array.isArray(data) ? data : [data as unknown as SportmonksTeam];
  if (leagueId != null) {
    return list.filter((t) => (t as { league_id?: number }).league_id === leagueId);
  }
  return list;
}

/** Fetch teams for a season. Cricket API: GET /teams?filter[season_id]=X (league_id filter not allowed). */
export async function getTeamsBySeason(seasonId: number): Promise<SportmonksTeam[]> {
  const url = buildUrl('/teams', { 'filter[season_id]': seasonId });
  const res = await fetchWithRetry<SportmonksApiResponse<SportmonksTeam[]>>(url);
  const data = res.data;
  return Array.isArray(data) ? data : [data as unknown as SportmonksTeam];
}

/**
 * Fetch teams for a season with squad included. Requires filter[season_id] for squad to be scoped to that season.
 * Returns teams with squad array (player objects with id, fullname, position, country_id, etc.).
 */
export async function getTeamsWithSquad(seasonId: number): Promise<SportmonksTeamWithSquad[]> {
  const url = buildUrl('/teams', {
    include: 'squad',
    'filter[season_id]': seasonId,
  });
  const res = await fetchWithRetry<SportmonksApiResponse<SportmonksTeamWithSquad[]>>(url);
  const data = res.data;
  const list = Array.isArray(data) ? data : [data as unknown as SportmonksTeamWithSquad];
  return list;
}

export async function getTeamById(id: number): Promise<SportmonksTeam | null> {
  const url = buildUrl(`/teams/${id}`);
  try {
    const res = await fetchWithRetry<SportmonksApiResponse<SportmonksTeam>>(url);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export interface GetFixturesParams {
  leagueId?: number;
  seasonId?: number;
  from?: string;
  to?: string;
  status?: string;
  page?: number;
  perPage?: number;
  include?: string;
}

/** Fetch fixtures. Cricket API uses GET /fixtures with filter[season_id] or filter[league_id]. */
export async function getFixtures(params: GetFixturesParams = {}): Promise<SportmonksFixture[]> {
  const { leagueId, seasonId, from, to, status, page = 1, perPage = 100, include } = params;
  const url = buildUrl('/fixtures', {
    page,
    per_page: perPage,
    ...(seasonId != null && { 'filter[season_id]': seasonId }),
    ...(leagueId != null && !seasonId && { 'filter[league_id]': leagueId }),
    ...(from && { from }),
    ...(to && { to }),
    ...(status && { status }),
    ...(include && { include }),
  });
  const res = await fetchWithRetry<SportmonksApiResponse<SportmonksFixture[]>>(url);
  const data = res.data;
  return Array.isArray(data) ? data : [data as unknown as SportmonksFixture];
}

export async function getFixtureById(id: number, include?: string): Promise<SportmonksFixture | null> {
  const url = buildUrl(`/fixtures/${id}`, include ? { include } : {});
  try {
    const res = await fetchWithRetry<SportmonksApiResponse<SportmonksFixture>>(url);
    return res.data ?? null;
  } catch {
    return null;
  }
}
