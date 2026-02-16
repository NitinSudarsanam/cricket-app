// Re-export Prisma types
export type {
  Player as PrismaPlayer,
  DraftConfig as PrismaDraftConfig,
  Participant as PrismaParticipant,
  DraftState as PrismaDraftState,
  DraftOrder,
  Pick as PrismaPick,
} from '@prisma/client';

// ============================================================================
// Core Type Definitions
// ============================================================================

// IPL Teams
export type IPLTeam = 'CSK' | 'MI' | 'GT' | 'RR' | 'RCB' | 'KKR' | 'LSG' | 'SRH' | 'PBKS' | 'DC';

// Player Roles
export type PlayerRole = 'Bat' | 'Bowl' | 'AR' | 'WK';

// Draft Status
export type DraftStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

// ============================================================================
// Player Interface
// ============================================================================

export interface Player {
  id: string;
  name: string;
  team: IPLTeam;
  role: PlayerRole;
  isForeign: boolean;
  metadata?: Record<string, any>;
  externalId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// DraftConfig Interface
// ============================================================================

export interface MandatoryRoles {
  Bat: number;
  Bowl: number;
  AR: number;
  WK: number;
}

export interface EarlyRoundRule {
  rounds: number;
  minBat: number;
  minBowl: number;
}

export interface DraftConfig {
  id: string;
  rosterSize: number;
  totalRounds: number;
  minPerTeam: number;
  maxPerTeam: number;
  mandatoryRoles: MandatoryRoles;
  freeSlots: number; // Calculated field
  earlyRoundRule: EarlyRoundRule;
  isLocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// FantasyTeam (Participant) Interface
// ============================================================================

export interface FantasyTeam {
  id: string;
  name: string;
  email?: string;
  draftedPlayers: Player[];
  teamCount: Record<IPLTeam, number>;
  roleCount: Record<PlayerRole, number>;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// DraftState Interface
// ============================================================================

export interface PickRecord {
  round: number;
  pickNumber: number;
  participantId: string;
  playerId: string;
  timestamp: Date;
}

export interface DraftState {
  id: string;
  currentRound: number;
  currentPickIndex: number;
  picks: PickRecord[];
  participantOrder: string[]; // Array of participant IDs
  draftOrderType?: 'snake' | 'linear';
  status: DraftStatus;
  startedAt?: Date;
  completedAt?: Date;
  draftConfigId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// Pick Interface (for relations)
// ============================================================================

export interface Pick {
  id: string;
  round: number;
  pickNumber: number;
  timestamp: Date;
  draftStateId: string;
  participantId: string;
  playerId: string;
}

// ============================================================================
// Extended Types with Relations
// ============================================================================

export interface PlayerWithPicks extends Player {
  picks: Pick[];
}

export interface ParticipantWithPicks {
  id: string;
  name: string;
  email?: string;
  picks: Pick[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DraftStateWithRelations extends DraftState {
  draftConfig: DraftConfig;
}

export interface DraftConfigWithState extends DraftConfig {
  draftStates: DraftState[];
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errors?: string[];
}

export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

// ============================================================================
// Roster and Summary Types
// ============================================================================

export interface RosterSummary {
  participantId: string;
  participantName: string;
  players: Player[];
  teamCount: Record<IPLTeam, number>;
  roleCount: Record<PlayerRole, number>;
  totalPlayers: number;
}

export interface TeamConstraintStatus {
  team: IPLTeam;
  current: number;
  max: number;
  isAtLimit: boolean;
}

export interface RoleConstraintStatus {
  role: PlayerRole;
  current: number;
  required: number;
  isSatisfied: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreatePlayerRequest {
  name: string;
  team: IPLTeam;
  role: PlayerRole;
  isForeign: boolean;
  metadata?: Record<string, any>;
}

export interface UpdatePlayerRequest {
  name?: string;
  team?: IPLTeam;
  role?: PlayerRole;
  isForeign?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateDraftConfigRequest {
  rosterSize?: number;
  totalRounds?: number;
  minPerTeam?: number;
  maxPerTeam?: number;
  mandatoryRoles?: Partial<MandatoryRoles>;
  earlyRoundRule?: Partial<EarlyRoundRule>;
}

export interface MakePickRequest {
  participantId: string;
  playerId: string;
}

export interface StartDraftRequest {
  participantIds: string[];
  draftOrder?: 'linear' | 'snake';
}

// ============================================================================
// Constants
// ============================================================================

export const IPL_TEAMS: readonly IPLTeam[] = [
  'CSK', 'MI', 'GT', 'RR', 'RCB', 'KKR', 'LSG', 'SRH', 'PBKS', 'DC'
] as const;

export const PLAYER_ROLES: readonly PlayerRole[] = [
  'Bat', 'Bowl', 'AR', 'WK'
] as const;

export const DRAFT_STATUSES: readonly DraftStatus[] = [
  'not_started', 'in_progress', 'paused', 'completed'
] as const;
