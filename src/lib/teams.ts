import { IPL_TEAMS, type IPLTeam } from '@/types';
import { getTeamColors as getKnownTeamColors, type TeamColors } from '@/config/team-colors';

const FALLBACK_PALETTE: TeamColors[] = [
  { bg: '#E2E8F0', border: '#94A3B8', hover: '#CBD5E1' },
  { bg: '#FDE68A', border: '#F59E0B', hover: '#FCD34D' },
  { bg: '#BBF7D0', border: '#22C55E', hover: '#86EFAC' },
  { bg: '#FBCFE8', border: '#EC4899', hover: '#F9A8D4' },
  { bg: '#C7D2FE', border: '#6366F1', hover: '#A5B4FC' },
];

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function normalizeTeamCode(code: string | null | undefined): string {
  return (code ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

export function uniqueTeamCodes(
  players: Array<{ team?: string | null }>,
  extras: readonly string[] = []
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const code of [...extras, ...players.map((p) => p.team ?? '')]) {
    const normalized = normalizeTeamCode(code);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    ordered.push(normalized);
  }
  return ordered;
}

export function teamsForBoard(players: Array<{ team?: string | null }>): string[] {
  const fromPlayers = uniqueTeamCodes(players);
  if (fromPlayers.length === 0) return [...IPL_TEAMS];
  const allIpl = fromPlayers.every((code) => IPL_TEAMS.includes(code as IPLTeam));
  if (allIpl) {
    return uniqueTeamCodes(players, IPL_TEAMS);
  }
  return fromPlayers;
}

export function resolveTeamColors(team: string): TeamColors {
  const known = getKnownTeamColors(team as IPLTeam);
  if (known) return known;
  return FALLBACK_PALETTE[hashCode(normalizeTeamCode(team)) % FALLBACK_PALETTE.length];
}
