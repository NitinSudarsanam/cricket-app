/**
 * Rule Engine for Fantasy Cricket Draft System
 * 
 * This module contains all validation logic for draft configuration and picks.
 * It ensures mathematical consistency and enforces all draft constraints.
 */

import {
  DraftConfig,
  Player,
  ValidationResult,
  IPL_TEAMS,
} from '@/types';

// ============================================================================
// Configuration Validation Functions
// ============================================================================

/**
 * Validates that the roster size and mandatory roles are mathematically feasible
 * 
 * Requirements: 3.1
 */
export function validateRosterFeasibility(config: DraftConfig): ValidationResult {
  const mandatoryTotal =
    config.mandatoryRoles.Bat +
    config.mandatoryRoles.Bowl +
    config.mandatoryRoles.AR +
    config.mandatoryRoles.WK;

  const freeTotal = config.rosterSize - mandatoryTotal;

  if (freeTotal < 0) {
    return {
      valid: false,
      error: `Mandatory roles total (${mandatoryTotal}) exceeds roster size (${config.rosterSize}). Free slots: ${freeTotal}`,
    };
  }

  // Verify freeSlots calculation is correct
  if (config.freeSlots !== freeTotal) {
    return {
      valid: false,
      error: `Free slots calculation mismatch. Expected ${freeTotal}, got ${config.freeSlots}`,
    };
  }

  return { valid: true };
}

/**
 * Validates that team constraints are mathematically possible
 * 
 * Requirements: 3.2
 */
export function validateTeamConstraints(config: DraftConfig): ValidationResult {
  const teamCount = IPL_TEAMS.length; // 10 IPL teams

  // Check that min <= max first (most basic constraint)
  if (config.minPerTeam > config.maxPerTeam) {
    return {
      valid: false,
      error: `Minimum per team (${config.minPerTeam}) cannot exceed maximum per team (${config.maxPerTeam})`,
    };
  }

  // Check if roster size can be filled with maxPerTeam constraint
  const maxPossiblePlayers = teamCount * config.maxPerTeam;
  if (config.rosterSize > maxPossiblePlayers) {
    return {
      valid: false,
      error: `Roster size (${config.rosterSize}) exceeds maximum possible players (${maxPossiblePlayers}) with ${teamCount} teams and max ${config.maxPerTeam} per team`,
    };
  }

  // Check if minPerTeam constraint is achievable
  const minRequiredPlayers = teamCount * config.minPerTeam;
  if (minRequiredPlayers > config.rosterSize) {
    return {
      valid: false,
      error: `Minimum per team constraint (${config.minPerTeam}) requires at least ${minRequiredPlayers} players, but roster size is only ${config.rosterSize}`,
    };
  }

  return { valid: true };
}

/**
 * Validates that early-round rules are feasible and consistent
 * 
 * Requirements: 3.3, 3.4
 */
export function validateEarlyRoundRules(config: DraftConfig): ValidationResult {
  const { earlyRoundRule, mandatoryRoles, rosterSize } = config;

  // Check that early round count doesn't exceed total rounds
  if (earlyRoundRule.rounds > rosterSize) {
    return {
      valid: false,
      error: `Early round count (${earlyRoundRule.rounds}) cannot exceed total rounds (${rosterSize})`,
    };
  }

  // Check that early round requirements don't exceed available rounds
  const earlyRoundTotal = earlyRoundRule.minBat + earlyRoundRule.minBowl;
  if (earlyRoundTotal > earlyRoundRule.rounds) {
    return {
      valid: false,
      error: `Early-round requirements (${earlyRoundTotal}) exceed available early rounds (${earlyRoundRule.rounds})`,
    };
  }

  // Check that early round Bat requirement doesn't exceed mandatory Bat
  if (earlyRoundRule.minBat > mandatoryRoles.Bat) {
    return {
      valid: false,
      error: `Early-round Bat requirement (${earlyRoundRule.minBat}) exceeds mandatory Bat count (${mandatoryRoles.Bat})`,
    };
  }

  // Check that early round Bowl requirement doesn't exceed mandatory Bowl
  if (earlyRoundRule.minBowl > mandatoryRoles.Bowl) {
    return {
      valid: false,
      error: `Early-round Bowl requirement (${earlyRoundRule.minBowl}) exceeds mandatory Bowl count (${mandatoryRoles.Bowl})`,
    };
  }

  return { valid: true };
}

/**
 * Validates that the player pool has sufficient players to satisfy all requirements
 * 
 * Requirements: 3.3
 */
export function validatePlayerPool(
  config: DraftConfig,
  players: Player[],
  participantCount: number
): ValidationResult {
  const totalPlayersNeeded = config.rosterSize * participantCount;

  // Check total player count
  if (players.length < totalPlayersNeeded) {
    return {
      valid: false,
      error: `Player pool (${players.length}) insufficient for ${participantCount} participants with roster size ${config.rosterSize}. Need ${totalPlayersNeeded} players.`,
    };
  }

  // Count players by role
  const roleCount: Record<string, number> = {
    Bat: 0,
    Bowl: 0,
    AR: 0,
    WK: 0,
  };

  for (const player of players) {
    roleCount[player.role] = (roleCount[player.role] || 0) + 1;
  }

  // Check if each mandatory role has enough players
  const errors: string[] = [];
  
  for (const [role, required] of Object.entries(config.mandatoryRoles)) {
    const available = roleCount[role] || 0;
    const needed = required * participantCount;

    if (available < needed) {
      errors.push(
        `Insufficient ${role} players: need ${needed} (${required} per participant × ${participantCount}), have ${available}`
      );
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return { valid: true };
}

/**
 * Comprehensive validation orchestrator that runs all configuration checks
 * 
 * Requirements: 3.5, 3.6
 */
export function validateDraftConfiguration(
  config: DraftConfig,
  players: Player[],
  participantCount: number
): ValidationResult {
  const errors: string[] = [];

  // Run all validation checks
  const rosterCheck = validateRosterFeasibility(config);
  if (!rosterCheck.valid) {
    if (rosterCheck.error) errors.push(rosterCheck.error);
    if (rosterCheck.errors) errors.push(...rosterCheck.errors);
  }

  const teamCheck = validateTeamConstraints(config);
  if (!teamCheck.valid) {
    if (teamCheck.error) errors.push(teamCheck.error);
    if (teamCheck.errors) errors.push(...teamCheck.errors);
  }

  const earlyRoundCheck = validateEarlyRoundRules(config);
  if (!earlyRoundCheck.valid) {
    if (earlyRoundCheck.error) errors.push(earlyRoundCheck.error);
    if (earlyRoundCheck.errors) errors.push(...earlyRoundCheck.errors);
  }

  const playerPoolCheck = validatePlayerPool(config, players, participantCount);
  if (!playerPoolCheck.valid) {
    if (playerPoolCheck.error) errors.push(playerPoolCheck.error);
    if (playerPoolCheck.errors) errors.push(...playerPoolCheck.errors);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return { valid: true };
}

// ============================================================================
// Pick Validation Functions
// ============================================================================

/**
 * Validates that a player is available (not already drafted)
 * 
 * Requirements: 5.2
 */
export function validatePlayerAvailable(
  playerId: string,
  draftedPlayerIds: string[]
): ValidationResult {
  const alreadyDrafted = draftedPlayerIds.includes(playerId);

  if (alreadyDrafted) {
    return {
      valid: false,
      error: 'Player has already been drafted',
    };
  }

  return { valid: true };
}

/**
 * Validates that selecting a player doesn't violate team cap constraints
 * 
 * Requirements: 5.3
 */
export function validateTeamCap(
  player: Player,
  roster: Player[],
  config: DraftConfig
): ValidationResult {
  const currentTeamCount = roster.filter(p => p.team === player.team).length;

  if (currentTeamCount >= config.maxPerTeam) {
    return {
      valid: false,
      error: `Maximum players from ${player.team} reached (${config.maxPerTeam}/${config.maxPerTeam})`,
    };
  }

  return { valid: true };
}

/**
 * Validates that a pick satisfies early-round rule constraints
 * 
 * Requirements: 5.4, 5.5
 */
export function validateEarlyRoundPick(
  player: Player,
  roster: Player[],
  currentRound: number,
  config: DraftConfig
): ValidationResult {
  // Early-round rules only apply within the specified rounds
  if (currentRound > config.earlyRoundRule.rounds) {
    return { valid: true };
  }

  // Count current role distribution in roster
  const batCount = roster.filter(p => p.role === 'Bat').length;
  const bowlCount = roster.filter(p => p.role === 'Bowl').length;

  // Calculate how many rounds remain in the early-round window
  const roundsRemaining = config.earlyRoundRule.rounds - currentRound + 1;

  // Calculate how many more of each role are needed
  const batNeeded = config.earlyRoundRule.minBat - batCount;
  const bowlNeeded = config.earlyRoundRule.minBowl - bowlCount;

  // If we need more Batsmen than rounds remaining, we MUST pick a Batsman
  if (batNeeded > 0 && batNeeded >= roundsRemaining && player.role !== 'Bat') {
    return {
      valid: false,
      error: `Must draft ${batNeeded} more Batsmen in next ${roundsRemaining} round(s) to meet early-round requirements`,
    };
  }

  // If we need more Bowlers than rounds remaining, we MUST pick a Bowler
  if (bowlNeeded > 0 && bowlNeeded >= roundsRemaining && player.role !== 'Bowl') {
    return {
      valid: false,
      error: `Must draft ${bowlNeeded} more Bowlers in next ${roundsRemaining} round(s) to meet early-round requirements`,
    };
  }

  // Check if picking this player would make it impossible to meet requirements
  // For example, if we need 2 Bat and 2 Bowl with only 3 rounds left, we can't pick AR/WK
  const totalNeeded = batNeeded + bowlNeeded;
  if (totalNeeded > 0 && totalNeeded > roundsRemaining) {
    if (player.role !== 'Bat' && player.role !== 'Bowl') {
      return {
        valid: false,
        error: `Must draft Batsmen (${batNeeded} needed) or Bowlers (${bowlNeeded} needed) in next ${roundsRemaining} round(s)`,
      };
    }
  }

  return { valid: true };
}

/**
 * Comprehensive pick validation orchestrator that runs all pick checks
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */
export function validatePick(
  player: Player,
  roster: Player[],
  currentRound: number,
  config: DraftConfig,
  draftedPlayerIds: string[]
): ValidationResult {
  const errors: string[] = [];

  // Check if player is available
  const availabilityCheck = validatePlayerAvailable(player.id, draftedPlayerIds);
  if (!availabilityCheck.valid) {
    if (availabilityCheck.error) errors.push(availabilityCheck.error);
    if (availabilityCheck.errors) errors.push(...availabilityCheck.errors);
  }

  // Check team cap constraint
  const teamCapCheck = validateTeamCap(player, roster, config);
  if (!teamCapCheck.valid) {
    if (teamCapCheck.error) errors.push(teamCapCheck.error);
    if (teamCapCheck.errors) errors.push(...teamCapCheck.errors);
  }

  // Check early-round rules
  const earlyRoundCheck = validateEarlyRoundPick(player, roster, currentRound, config);
  if (!earlyRoundCheck.valid) {
    if (earlyRoundCheck.error) errors.push(earlyRoundCheck.error);
    if (earlyRoundCheck.errors) errors.push(...earlyRoundCheck.errors);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return { valid: true };
}
