/**
 * IPL Team Color Palette
 * Soft pastel colors for team-based UI elements
 */

export type IPLTeam = 'CSK' | 'MI' | 'GT' | 'RR' | 'RCB' | 'KKR' | 'LSG' | 'SRH' | 'PBKS' | 'DC';

export interface TeamColors {
  bg: string;
  border: string;
  hover: string;
}

export const TEAM_COLORS: Record<IPLTeam, TeamColors> = {
  CSK: { 
    bg: '#FEF3C7', 
    border: '#FCD34D', 
    hover: '#FDE68A' 
  },
  MI: { 
    bg: '#DBEAFE', 
    border: '#60A5FA', 
    hover: '#BFDBFE' 
  },
  GT: { 
    bg: '#E0E7FF', 
    border: '#818CF8', 
    hover: '#C7D2FE' 
  },
  RR: { 
    bg: '#F3E8FF', 
    border: '#C084FC', 
    hover: '#E9D5FF' 
  },
  RCB: { 
    bg: '#FEE2E2', 
    border: '#F87171', 
    hover: '#FECACA' 
  },
  KKR: { 
    bg: '#E5E7EB', 
    border: '#9CA3AF', 
    hover: '#D1D5DB' 
  },
  LSG: { 
    bg: '#CFFAFE', 
    border: '#22D3EE', 
    hover: '#A5F3FC' 
  },
  SRH: { 
    bg: '#FED7AA', 
    border: '#FB923C', 
    hover: '#FDE68A' 
  },
  PBKS: { 
    bg: '#FECDD3', 
    border: '#FB7185', 
    hover: '#FBCFE8' 
  },
  DC: { 
    bg: '#D1FAE5', 
    border: '#34D399', 
    hover: '#A7F3D0' 
  }
};

/**
 * Get team colors for a specific IPL team
 */
const FALLBACK_COLORS: TeamColors = {
  bg: '#E2E8F0',
  border: '#94A3B8',
  hover: '#CBD5E1',
};

export function getTeamColors(team: IPLTeam | string): TeamColors {
  return TEAM_COLORS[team as IPLTeam] ?? FALLBACK_COLORS;
}

/**
 * Get background color for a team
 */
export function getTeamBgColor(team: IPLTeam): string {
  return TEAM_COLORS[team].bg;
}

/**
 * Get border color for a team
 */
export function getTeamBorderColor(team: IPLTeam): string {
  return TEAM_COLORS[team].border;
}

/**
 * Get hover color for a team
 */
export function getTeamHoverColor(team: IPLTeam): string {
  return TEAM_COLORS[team].hover;
}

/**
 * Check if a string is a valid IPL team
 */
export function isIPLTeam(team: string): team is IPLTeam {
  return team in TEAM_COLORS;
}
