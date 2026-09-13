/**
 * Canonical mapping: Sportmonks team identifier (short_code or name) → team code.
 * IPL franchises keep their familiar codes; other seasons keep their own short code.
 */

import type { IPLTeam } from '@/types';
import { IPL_TEAMS } from '@/types';

const IPL_SET = new Set<string>(IPL_TEAMS);

/** Known Sportmonks short_code or name variants → IPL code. Extend as needed for your league. */
const SHORT_CODE_TO_IPL: Record<string, IPLTeam> = {
  CSK: 'CSK',
  MI: 'MI',
  GT: 'GT',
  RR: 'RR',
  RCB: 'RCB',
  KKR: 'KKR',
  LSG: 'LSG',
  SRH: 'SRH',
  PBKS: 'PBKS',
  DC: 'DC',
  CHENNAI: 'CSK',
  MUMBAI: 'MI',
  GUJARAT: 'GT',
  RAJASTHAN: 'RR',
  BANGALORE: 'RCB',
  KOLKATA: 'KKR',
  LUCKNOW: 'LSG',
  HYDERABAD: 'SRH',
  PUNJAB: 'PBKS',
  DELHI: 'DC',
};

/**
 * Resolve Sportmonks team short_code (and optionally name) to an IPLTeam when known.
 * Returns null only when no identifier can be mapped to the IPL set.
 */
export function sportmonksTeamCodeToIPL(
  shortCode: string | null | undefined,
  name?: string | null
): IPLTeam | null {
  const resolved = resolveTeamCode(shortCode, name);
  if (resolved && IPL_SET.has(resolved)) return resolved as IPLTeam;
  return null;
}

/**
 * Resolve any Sportmonks team to a draftable code.
 * Prefers the IPL mapping, then the API short code, then an abbreviation of the name.
 */
export function resolveTeamCode(
  shortCode: string | null | undefined,
  name?: string | null
): string | null {
  const code = (shortCode ?? '').trim().toUpperCase();
  if (code && SHORT_CODE_TO_IPL[code]) return SHORT_CODE_TO_IPL[code];
  if (code && IPL_SET.has(code)) return code;
  const nameNorm = (name ?? '').trim().toUpperCase().replace(/\s+/g, ' ');
  if (nameNorm && SHORT_CODE_TO_IPL[nameNorm]) return SHORT_CODE_TO_IPL[nameNorm];
  if (code) return normalizeDraftTeamCode(code);
  if (nameNorm) {
    const words = nameNorm.split(' ').filter(Boolean);
    if (words.length === 1) {
      return normalizeDraftTeamCode(words[0].slice(0, 3));
    }
    const initials = words.map((part) => part[0]).join('');
    return normalizeDraftTeamCode(initials);
  }
  return null;
}

/** Shared 2-8 character draft team code used by sync and validation. */
export function normalizeDraftTeamCode(value: string): string {
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.length >= 2) return normalized.slice(0, 8);
  if (normalized.length === 1) return `${normalized}${normalized}`;
  return 'UNK';
}
