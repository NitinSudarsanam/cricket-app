/**
 * Canonical mapping: Sportmonks team identifier (short_code or name) → our IPLTeam.
 * Used by sync (squad → Player.team) and player-ranking (Team → PlayerScore).
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
 * Resolve Sportmonks team short_code (and optionally name) to our IPLTeam.
 * Returns null if the team does not map to an IPL code (e.g. non-IPL league).
 */
export function sportmonksTeamCodeToIPL(
  shortCode: string | null | undefined,
  name?: string | null
): IPLTeam | null {
  const code = (shortCode ?? '').trim().toUpperCase();
  if (code && SHORT_CODE_TO_IPL[code]) return SHORT_CODE_TO_IPL[code];
  if (code && IPL_SET.has(code)) return code as IPLTeam;
  const nameNorm = (name ?? '').trim().toUpperCase().replace(/\s+/g, ' ');
  if (nameNorm && SHORT_CODE_TO_IPL[nameNorm]) return SHORT_CODE_TO_IPL[nameNorm];
  return null;
}
