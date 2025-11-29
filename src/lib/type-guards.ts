/**
 * Type Guards for Fantasy Cricket Draft System
 * 
 * These functions provide runtime type checking to ensure data integrity
 * and type safety throughout the application.
 */

import {
  IPLTeam,
  PlayerRole,
  DraftStatus,
  Player,
  DraftConfig,
  FantasyTeam,
  DraftState,
  MandatoryRoles,
  EarlyRoundRule,
  PickRecord,
  IPL_TEAMS,
  PLAYER_ROLES,
  DRAFT_STATUSES,
} from '@/types';

// ============================================================================
// Primitive Type Guards
// ============================================================================

export function isIPLTeam(value: unknown): value is IPLTeam {
  return typeof value === 'string' && IPL_TEAMS.includes(value as IPLTeam);
}

export function isPlayerRole(value: unknown): value is PlayerRole {
  return typeof value === 'string' && PLAYER_ROLES.includes(value as PlayerRole);
}

export function isDraftStatus(value: unknown): value is DraftStatus {
  return typeof value === 'string' && DRAFT_STATUSES.includes(value as DraftStatus);
}

// ============================================================================
// Complex Type Guards
// ============================================================================

export function isPlayer(value: unknown): value is Player {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    isIPLTeam(obj.team) &&
    isPlayerRole(obj.role) &&
    typeof obj.isForeign === 'boolean' &&
    (obj.metadata === undefined || 
     obj.metadata === null || 
     typeof obj.metadata === 'object')
  );
}

export function isMandatoryRoles(value: unknown): value is MandatoryRoles {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.Bat === 'number' &&
    typeof obj.Bowl === 'number' &&
    typeof obj.AR === 'number' &&
    typeof obj.WK === 'number' &&
    obj.Bat >= 0 &&
    obj.Bowl >= 0 &&
    obj.AR >= 0 &&
    obj.WK >= 0
  );
}

export function isEarlyRoundRule(value: unknown): value is EarlyRoundRule {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.rounds === 'number' &&
    typeof obj.minBat === 'number' &&
    typeof obj.minBowl === 'number' &&
    obj.rounds >= 0 &&
    obj.minBat >= 0 &&
    obj.minBowl >= 0
  );
}

export function isDraftConfig(value: unknown): value is DraftConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.rosterSize === 'number' &&
    typeof obj.totalRounds === 'number' &&
    typeof obj.minPerTeam === 'number' &&
    typeof obj.maxPerTeam === 'number' &&
    typeof obj.freeSlots === 'number' &&
    isMandatoryRoles(obj.mandatoryRoles) &&
    isEarlyRoundRule(obj.earlyRoundRule) &&
    obj.rosterSize >= 1 &&
    obj.rosterSize <= 20 &&
    obj.totalRounds >= 1 &&
    obj.minPerTeam >= 0 &&
    obj.maxPerTeam >= 0
  );
}

export function isPickRecord(value: unknown): value is PickRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.round === 'number' &&
    typeof obj.pickNumber === 'number' &&
    typeof obj.participantId === 'string' &&
    typeof obj.playerId === 'string' &&
    (obj.timestamp instanceof Date || typeof obj.timestamp === 'string') &&
    obj.round >= 1 &&
    obj.pickNumber >= 1
  );
}

export function isDraftState(value: unknown): value is DraftState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.currentRound === 'number' &&
    typeof obj.currentPickIndex === 'number' &&
    Array.isArray(obj.picks) &&
    obj.picks.every(isPickRecord) &&
    Array.isArray(obj.participantOrder) &&
    obj.participantOrder.every((id) => typeof id === 'string') &&
    isDraftStatus(obj.status) &&
    obj.currentRound >= 1 &&
    obj.currentPickIndex >= 0
  );
}

export function isFantasyTeam(value: unknown): value is FantasyTeam {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.draftedPlayers) &&
    obj.draftedPlayers.every(isPlayer) &&
    typeof obj.teamCount === 'object' &&
    obj.teamCount !== null &&
    typeof obj.roleCount === 'object' &&
    obj.roleCount !== null
  );
}

// ============================================================================
// Array Type Guards
// ============================================================================

export function isPlayerArray(value: unknown): value is Player[] {
  return Array.isArray(value) && value.every(isPlayer);
}

export function isPickRecordArray(value: unknown): value is PickRecord[] {
  return Array.isArray(value) && value.every(isPickRecord);
}

// ============================================================================
// Partial Type Guards (for updates)
// ============================================================================

export function isPartialMandatoryRoles(value: unknown): value is Partial<MandatoryRoles> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    (obj.Bat === undefined || (typeof obj.Bat === 'number' && obj.Bat >= 0)) &&
    (obj.Bowl === undefined || (typeof obj.Bowl === 'number' && obj.Bowl >= 0)) &&
    (obj.AR === undefined || (typeof obj.AR === 'number' && obj.AR >= 0)) &&
    (obj.WK === undefined || (typeof obj.WK === 'number' && obj.WK >= 0))
  );
}

export function isPartialEarlyRoundRule(value: unknown): value is Partial<EarlyRoundRule> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    (obj.rounds === undefined || (typeof obj.rounds === 'number' && obj.rounds >= 0)) &&
    (obj.minBat === undefined || (typeof obj.minBat === 'number' && obj.minBat >= 0)) &&
    (obj.minBowl === undefined || (typeof obj.minBowl === 'number' && obj.minBowl >= 0))
  );
}
