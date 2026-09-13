/**
 * Validation Utilities for Fantasy Cricket Draft System
 * 
 * These functions validate data models and ensure business rules are enforced.
 */

import {
  Player,
  DraftConfig,
  FantasyTeam,
  DraftState,
  ValidationResult,
  ValidationError,
  IPLTeam,
  PlayerRole,
  CreatePlayerRequest,
  UpdatePlayerRequest,
  UpdateDraftConfigRequest,
  IPL_TEAMS,
  PLAYER_ROLES,
} from '@/types';

import {
  isIPLTeam,
  isPlayerRole,
  isPlayer,
  isDraftConfig,
  isDraftState,
  isFantasyTeam,
} from './type-guards';

// ============================================================================
// Player Validation
// ============================================================================

export function validatePlayer(player: unknown): ValidationResult {
  const errors: string[] = [];

  if (!player || typeof player !== 'object') {
    return { valid: false, error: 'Player must be an object' };
  }

  const p = player as Record<string, unknown>;

  if (!p.name || typeof p.name !== 'string' || p.name.trim().length === 0) {
    errors.push('Player name is required and must be a non-empty string');
  }

  if (!isIPLTeam(p.team)) {
    errors.push(`Player team must be one of: ${IPL_TEAMS.join(', ')}`);
  }

  if (!isPlayerRole(p.role)) {
    errors.push(`Player role must be one of: ${PLAYER_ROLES.join(', ')}`);
  }

  if (typeof p.isForeign !== 'boolean') {
    errors.push('Player isForeign must be a boolean');
  }

  if (p.metadata !== undefined && p.metadata !== null && typeof p.metadata !== 'object') {
    errors.push('Player metadata must be an object if provided');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

export function validateCreatePlayerRequest(request: unknown): ValidationResult {
  const errors: string[] = [];

  if (!request || typeof request !== 'object') {
    return { valid: false, error: 'Request must be an object' };
  }

  const req = request as Record<string, unknown>;

  if (!req.name || typeof req.name !== 'string' || req.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  } else if (req.name.trim().length > 100) {
    errors.push('Name must not exceed 100 characters');
  }

  if (!isIPLTeam(req.team)) {
    errors.push(`Team must be one of: ${IPL_TEAMS.join(', ')}`);
  }

  if (!isPlayerRole(req.role)) {
    errors.push(`Role must be one of: ${PLAYER_ROLES.join(', ')}`);
  }

  if (typeof req.isForeign !== 'boolean') {
    errors.push('isForeign must be a boolean');
  }

  if (req.metadata !== undefined && req.metadata !== null && typeof req.metadata !== 'object') {
    errors.push('metadata must be an object if provided');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

export function validateUpdatePlayerRequest(request: unknown): ValidationResult {
  const errors: string[] = [];

  if (!request || typeof request !== 'object') {
    return { valid: false, error: 'Request must be an object' };
  }

  const req = request as Record<string, unknown>;

  if (req.name !== undefined && (typeof req.name !== 'string' || req.name.trim().length === 0)) {
    errors.push('Name must be a non-empty string if provided');
  } else if (req.name !== undefined && typeof req.name === 'string' && req.name.trim().length > 100) {
    errors.push('Name must not exceed 100 characters');
  }

  if (req.team !== undefined && !isIPLTeam(req.team)) {
    errors.push(`Team must be one of: ${IPL_TEAMS.join(', ')}`);
  }

  if (req.role !== undefined && !isPlayerRole(req.role)) {
    errors.push(`Role must be one of: ${PLAYER_ROLES.join(', ')}`);
  }

  if (req.isForeign !== undefined && typeof req.isForeign !== 'boolean') {
    errors.push('isForeign must be a boolean if provided');
  }

  if (req.metadata !== undefined && req.metadata !== null && typeof req.metadata !== 'object') {
    errors.push('metadata must be an object if provided');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

// ============================================================================
// DraftConfig Validation
// ============================================================================

export function validateDraftConfig(config: unknown): ValidationResult {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'DraftConfig must be an object' };
  }

  const c = config as Record<string, unknown>;

  // Roster size validation
  if (typeof c.rosterSize !== 'number' || c.rosterSize < 1 || c.rosterSize > 20) {
    errors.push('Roster size must be a number between 1 and 20');
  }

  // Total rounds validation
  if (typeof c.totalRounds !== 'number' || c.totalRounds < 1) {
    errors.push('Total rounds must be a positive number');
  }

  // Team constraints validation
  if (typeof c.minPerTeam !== 'number' || c.minPerTeam < 0) {
    errors.push('Min per team must be a non-negative number');
  }

  if (typeof c.maxPerTeam !== 'number' || c.maxPerTeam < 0) {
    errors.push('Max per team must be a non-negative number');
  }

  if (
    typeof c.minPerTeam === 'number' &&
    typeof c.maxPerTeam === 'number' &&
    c.minPerTeam > c.maxPerTeam
  ) {
    errors.push('Min per team cannot exceed max per team');
  }

  // Mandatory roles validation
  if (!c.mandatoryRoles || typeof c.mandatoryRoles !== 'object') {
    errors.push('Mandatory roles must be an object');
  } else {
    const roles = c.mandatoryRoles as Record<string, unknown>;
    
    for (const role of PLAYER_ROLES) {
      if (typeof roles[role] !== 'number' || roles[role] < 0) {
        errors.push(`Mandatory ${role} must be a non-negative number`);
      }
    }
  }

  // Early round rule validation
  if (!c.earlyRoundRule || typeof c.earlyRoundRule !== 'object') {
    errors.push('Early round rule must be an object');
  } else {
    const rule = c.earlyRoundRule as Record<string, unknown>;
    
    if (typeof rule.rounds !== 'number' || rule.rounds < 0) {
      errors.push('Early round rounds must be a non-negative number');
    }
    
    if (typeof rule.minBat !== 'number' || rule.minBat < 0) {
      errors.push('Early round minBat must be a non-negative number');
    }
    
    if (typeof rule.minBowl !== 'number' || rule.minBowl < 0) {
      errors.push('Early round minBowl must be a non-negative number');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

export function validateUpdateDraftConfigRequest(request: unknown): ValidationResult {
  const errors: string[] = [];

  if (!request || typeof request !== 'object') {
    return { valid: false, error: 'Request must be an object' };
  }

  const req = request as Record<string, unknown>;

  if (req.rosterSize !== undefined) {
    if (typeof req.rosterSize !== 'number' || req.rosterSize < 1 || req.rosterSize > 20) {
      errors.push('Roster size must be a number between 1 and 20');
    }
  }

  if (req.totalRounds !== undefined) {
    if (typeof req.totalRounds !== 'number' || req.totalRounds < 1) {
      errors.push('Total rounds must be a positive number');
    }
  }

  if (req.minPerTeam !== undefined) {
    if (typeof req.minPerTeam !== 'number' || req.minPerTeam < 0) {
      errors.push('Min per team must be a non-negative number');
    }
  }

  if (req.maxPerTeam !== undefined) {
    if (typeof req.maxPerTeam !== 'number' || req.maxPerTeam < 0) {
      errors.push('Max per team must be a non-negative number');
    }
  }

  if (req.pickTimeoutSeconds !== undefined) {
    if (
      typeof req.pickTimeoutSeconds !== 'number' ||
      req.pickTimeoutSeconds < 10 ||
      req.pickTimeoutSeconds > 600
    ) {
      errors.push('Pick timeout must be a number between 10 and 600 seconds');
    }
  }

  if (
    req.minPerTeam !== undefined &&
    req.maxPerTeam !== undefined &&
    typeof req.minPerTeam === 'number' &&
    typeof req.maxPerTeam === 'number' &&
    req.minPerTeam > req.maxPerTeam
  ) {
    errors.push('Min per team cannot exceed max per team');
  }

  if (req.mandatoryRoles !== undefined) {
    if (typeof req.mandatoryRoles !== 'object' || req.mandatoryRoles === null) {
      errors.push('Mandatory roles must be an object if provided');
    } else {
      const roles = req.mandatoryRoles as Record<string, unknown>;
      
      for (const [key, value] of Object.entries(roles)) {
        if (!PLAYER_ROLES.includes(key as PlayerRole)) {
          errors.push(`Invalid role: ${key}`);
        }
        if (typeof value !== 'number' || value < 0) {
          errors.push(`Mandatory ${key} must be a non-negative number`);
        }
      }
    }
  }

  if (req.earlyRoundRule !== undefined) {
    if (typeof req.earlyRoundRule !== 'object' || req.earlyRoundRule === null) {
      errors.push('Early round rule must be an object if provided');
    } else {
      const rule = req.earlyRoundRule as Record<string, unknown>;
      
      if (rule.rounds !== undefined && (typeof rule.rounds !== 'number' || rule.rounds < 0)) {
        errors.push('Early round rounds must be a non-negative number');
      }
      
      if (rule.minBat !== undefined && (typeof rule.minBat !== 'number' || rule.minBat < 0)) {
        errors.push('Early round minBat must be a non-negative number');
      }
      
      if (rule.minBowl !== undefined && (typeof rule.minBowl !== 'number' || rule.minBowl < 0)) {
        errors.push('Early round minBowl must be a non-negative number');
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

// ============================================================================
// DraftState Validation
// ============================================================================

export function validateDraftState(state: unknown): ValidationResult {
  const errors: string[] = [];

  if (!state || typeof state !== 'object') {
    return { valid: false, error: 'DraftState must be an object' };
  }

  const s = state as Record<string, unknown>;

  if (!s.id || typeof s.id !== 'string') {
    errors.push('DraftState id is required and must be a string');
  }

  if (typeof s.currentRound !== 'number' || s.currentRound < 1) {
    errors.push('Current round must be a positive number');
  }

  if (typeof s.currentPickIndex !== 'number' || s.currentPickIndex < 0) {
    errors.push('Current pick index must be a non-negative number');
  }

  if (!Array.isArray(s.picks)) {
    errors.push('Picks must be an array');
  }

  if (!Array.isArray(s.participantOrder)) {
    errors.push('Participant order must be an array');
  } else if (!s.participantOrder.every((id) => typeof id === 'string')) {
    errors.push('Participant order must contain only strings');
  }

  if (typeof s.status !== 'string') {
    errors.push('Status must be a string');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

// ============================================================================
// FantasyTeam Validation
// ============================================================================

export function validateFantasyTeam(team: unknown): ValidationResult {
  const errors: string[] = [];

  if (!team || typeof team !== 'object') {
    return { valid: false, error: 'FantasyTeam must be an object' };
  }

  const t = team as Record<string, unknown>;

  if (!t.id || typeof t.id !== 'string') {
    errors.push('FantasyTeam id is required and must be a string');
  }

  if (!t.name || typeof t.name !== 'string' || t.name.trim().length === 0) {
    errors.push('FantasyTeam name is required and must be a non-empty string');
  }

  if (!Array.isArray(t.draftedPlayers)) {
    errors.push('Drafted players must be an array');
  }

  if (!t.teamCount || typeof t.teamCount !== 'object') {
    errors.push('Team count must be an object');
  }

  if (!t.roleCount || typeof t.roleCount !== 'object') {
    errors.push('Role count must be an object');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate free slots in a draft configuration
 */
export function calculateFreeSlots(config: DraftConfig): number {
  const mandatoryTotal =
    config.mandatoryRoles.Bat +
    config.mandatoryRoles.Bowl +
    config.mandatoryRoles.AR +
    config.mandatoryRoles.WK;

  return config.rosterSize - mandatoryTotal;
}

/**
 * Validate that a configuration has consistent values
 */
export function validateConfigConsistency(config: DraftConfig): ValidationResult {
  const errors: string[] = [];

  // Check that roster size equals total rounds
  if (config.rosterSize !== config.totalRounds) {
    errors.push('Roster size must equal total rounds');
  }

  // Check that mandatory roles don't exceed roster size
  const mandatoryTotal =
    config.mandatoryRoles.Bat +
    config.mandatoryRoles.Bowl +
    config.mandatoryRoles.AR +
    config.mandatoryRoles.WK;

  if (mandatoryTotal > config.rosterSize) {
    errors.push(
      `Mandatory roles total (${mandatoryTotal}) exceeds roster size (${config.rosterSize})`
    );
  }

  // Check that early round requirements are feasible
  const earlyTotal = config.earlyRoundRule.minBat + config.earlyRoundRule.minBowl;
  if (earlyTotal > config.earlyRoundRule.rounds) {
    errors.push(
      `Early round requirements (${earlyTotal}) exceed early rounds (${config.earlyRoundRule.rounds})`
    );
  }

  // Check that early round requirements don't exceed mandatory roles
  if (config.earlyRoundRule.minBat > config.mandatoryRoles.Bat) {
    errors.push(
      `Early round Bat requirement (${config.earlyRoundRule.minBat}) exceeds mandatory Bat (${config.mandatoryRoles.Bat})`
    );
  }

  if (config.earlyRoundRule.minBowl > config.mandatoryRoles.Bowl) {
    errors.push(
      `Early round Bowl requirement (${config.earlyRoundRule.minBowl}) exceeds mandatory Bowl (${config.mandatoryRoles.Bowl})`
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
