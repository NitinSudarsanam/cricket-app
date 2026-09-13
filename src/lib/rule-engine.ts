/**
 * Rule Engine for Fantasy Cricket Draft System
 * 
 * This module contains all validation logic for draft configuration and picks.
 * It ensures mathematical consistency and enforces all draft constraints.
 */

import {
  DraftConfig,
  Player,
  PlayerRole,
  ValidationResult,
  IPL_TEAMS,
  PLAYER_ROLES,
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
export function validateTeamConstraints(
  config: DraftConfig,
  teamCodes: readonly string[] = IPL_TEAMS
): ValidationResult {
  const teamCount = teamCodes.length > 0 ? teamCodes.length : IPL_TEAMS.length;

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

  const teamCodes = Array.from(new Set(players.map((player) => player.team).filter(Boolean)));
  const teamCheck = validateTeamConstraints(config, teamCodes.length > 0 ? teamCodes : IPL_TEAMS);
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
 * Returns the set of roles that are valid for the next pick given current roster and config.
 * When freeSlots === 0, only roles with open mandatory slots are valid.
 * When freeSlots > 0, all roles are valid for this rule (Option A: no mandatory-first).
 */
export function getValidRolesForNextPick(
  roster: Player[],
  config: DraftConfig
): Set<PlayerRole> {
  const roleCount: Record<PlayerRole, number> = {
    Bat: 0,
    Bowl: 0,
    AR: 0,
    WK: 0,
  };
  for (const p of roster) {
    roleCount[p.role] = (roleCount[p.role] ?? 0) + 1;
  }

  const valid = new Set<PlayerRole>();

  if (config.freeSlots === 0) {
    for (const role of PLAYER_ROLES) {
      const required = config.mandatoryRoles[role];
      const current = roleCount[role] ?? 0;
      if (required > current) valid.add(role);
    }
    return valid;
  }

  for (const role of PLAYER_ROLES) {
    valid.add(role);
  }
  return valid;
}

/**
 * Validates that a pick fills an allowed role slot.
 * When freeSlots === 0, the pick must fill an open mandatory slot for the player's role.
 * Requirements: mandatory-only when required players equal roster size
 */
export function validateMandatoryRolePick(
  player: Player,
  roster: Player[],
  config: DraftConfig
): ValidationResult {
  const validRoles = getValidRolesForNextPick(roster, config);
  if (validRoles.has(player.role)) {
    return { valid: true };
  }

  if (config.freeSlots === 0) {
    const roleCount: Record<string, number> = {};
    for (const r of PLAYER_ROLES) roleCount[r] = 0;
    for (const p of roster) {
      roleCount[p.role] = (roleCount[p.role] ?? 0) + 1;
    }
    const needed: string[] = [];
    for (const r of PLAYER_ROLES) {
      const open = config.mandatoryRoles[r] - (roleCount[r] ?? 0);
      if (open > 0) needed.push(`${r} (${open})`);
    }
    return {
      valid: false,
      error: needed.length > 0
        ? `You must pick a player that fills a required role. Still needed: ${needed.join(', ')}.`
        : 'All required role slots are filled for this pick.',
    };
  }

  return { valid: true };
}

/**
 * Returns the set of player IDs that are valid picks given the current draft state.
 *
 * This is the single source of truth for the UI to grey out ineligible players.
 * It checks ALL constraints simultaneously for each available player:
 *   1. Already drafted
 *   2. Team cap (maxPerTeam)
 *   3. Early-round rules (must pick Bat/Bowl when deadline approaches)
 *   4. Mandatory role look-ahead (can't pick a role if it would make it
 *      mathematically impossible to fill all mandatory slots with remaining picks)
 *   5. Mandatory-only (when freeSlots === 0, only roles with open mandatory slots)
 */
export function getEligiblePlayers(
  availablePlayers: Player[],
  roster: Player[],
  currentRound: number,
  config: DraftConfig,
  draftedPlayerIds: string[],
): Set<string> {
  const eligible = new Set<string>();
  const draftedSet = new Set(draftedPlayerIds);

  // Pre-compute roster counts
  const teamCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = { Bat: 0, Bowl: 0, AR: 0, WK: 0 };
  for (const p of roster) {
    teamCounts[p.team] = (teamCounts[p.team] ?? 0) + 1;
    roleCounts[p.role] = (roleCounts[p.role] ?? 0) + 1;
  }

  // How many picks remain AFTER this next pick
  const picksAfterThis = config.rosterSize - roster.length - 1;

  // Early-round calculations
  const inEarlyRounds = currentRound <= config.earlyRoundRule.rounds;
  const earlyRoundsRemaining = inEarlyRounds
    ? config.earlyRoundRule.rounds - currentRound + 1
    : 0;
  const batNeeded = Math.max(0, config.earlyRoundRule.minBat - roleCounts['Bat']);
  const bowlNeeded = Math.max(0, config.earlyRoundRule.minBowl - roleCounts['Bowl']);

  // Mandatory role needs
  const mandatoryNeeds: Record<string, number> = {};
  for (const role of PLAYER_ROLES) {
    mandatoryNeeds[role] = Math.max(0, config.mandatoryRoles[role] - roleCounts[role]);
  }
  const totalMandatoryNeeded =
    mandatoryNeeds['Bat'] + mandatoryNeeds['Bowl'] +
    mandatoryNeeds['AR'] + mandatoryNeeds['WK'];

  for (const player of availablePlayers) {
    // 1. Already drafted
    if (draftedSet.has(player.id)) continue;

    // 2. Team cap
    if ((teamCounts[player.team] ?? 0) >= config.maxPerTeam) continue;

    // 3. Early-round constraints
    if (inEarlyRounds) {
      // After hypothetically picking this player, would we still be able to meet
      // early-round minimums in the remaining early rounds?
      const batAfter = roleCounts['Bat'] + (player.role === 'Bat' ? 1 : 0);
      const bowlAfter = roleCounts['Bowl'] + (player.role === 'Bowl' ? 1 : 0);
      const batStillNeeded = Math.max(0, config.earlyRoundRule.minBat - batAfter);
      const bowlStillNeeded = Math.max(0, config.earlyRoundRule.minBowl - bowlAfter);
      const earlyPicksAfter = earlyRoundsRemaining - 1; // rounds left after this pick

      // If the combined bat+bowl still needed exceeds the early picks remaining, invalid
      if (batStillNeeded + bowlStillNeeded > earlyPicksAfter) continue;
    }

    // 4. Mandatory role look-ahead
    // After picking this player, compute how many mandatory slots remain unfilled.
    // If there aren't enough remaining picks to fill them all, this pick is invalid.
    const roleAfter = roleCounts[player.role] + 1;
    const mandatoryAfter =
      Math.max(0, config.mandatoryRoles['Bat'] - (player.role === 'Bat' ? roleAfter : roleCounts['Bat'])) +
      Math.max(0, config.mandatoryRoles['Bowl'] - (player.role === 'Bowl' ? roleAfter : roleCounts['Bowl'])) +
      Math.max(0, config.mandatoryRoles['AR'] - (player.role === 'AR' ? roleAfter : roleCounts['AR'])) +
      Math.max(0, config.mandatoryRoles['WK'] - (player.role === 'WK' ? roleAfter : roleCounts['WK']));

    if (mandatoryAfter > picksAfterThis) continue;

    // 5. Mandatory-only (when freeSlots === 0, only open mandatory roles)
    if (config.freeSlots === 0) {
      if (roleCounts[player.role] >= config.mandatoryRoles[player.role]) continue;
    }

    eligible.add(player.id);
  }

  return eligible;
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

  // Check mandatory-role pick (no free slots => must fill required role)
  const mandatoryRoleCheck = validateMandatoryRolePick(player, roster, config);
  if (!mandatoryRoleCheck.valid) {
    if (mandatoryRoleCheck.error) errors.push(mandatoryRoleCheck.error);
    if (mandatoryRoleCheck.errors) errors.push(...mandatoryRoleCheck.errors);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return { valid: true };
}
