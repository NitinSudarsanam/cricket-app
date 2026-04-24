/**
 * Unit Tests for Rule Engine
 * 
 * Tests all validation functions with valid and invalid inputs,
 * including edge cases and mathematical consistency checks.
 */

import { describe, it } from 'vitest';
import assert from 'node:assert';
import {
  validateRosterFeasibility,
  validateTeamConstraints,
  validateEarlyRoundRules,
  validatePlayerPool,
  validateDraftConfiguration,
  validatePlayerAvailable,
  validateTeamCap,
  validateEarlyRoundPick,
  validateMandatoryRolePick,
  getValidRolesForNextPick,
  getEligiblePlayers,
  validatePick,
} from '../rule-engine';
import type { DraftConfig, Player } from '../../types';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockConfig(overrides?: Partial<DraftConfig>): DraftConfig {
  const defaults: DraftConfig = {
    id: 'test-config',
    rosterSize: 8,
    totalRounds: 8,
    minPerTeam: 0,
    maxPerTeam: 1,
    mandatoryRoles: {
      Bat: 3,
      Bowl: 3,
      AR: 0,
      WK: 0,
    },
    freeSlots: 2,
    earlyRoundRule: {
      rounds: 4,
      minBat: 2,
      minBowl: 2,
    },
  };

  return { ...defaults, ...overrides };
}

function createMockPlayer(overrides?: Partial<Player>): Player {
  const defaults: Player = {
    id: 'player-1',
    name: 'Test Player',
    team: 'CSK',
    role: 'Bat',
    isForeign: false,
  };

  return { ...defaults, ...overrides };
}

function createMockPlayers(count: number): Player[] {
  const teams = ['CSK', 'MI', 'GT', 'RR', 'RCB', 'KKR', 'LSG', 'SRH', 'PBKS', 'DC'] as const;
  const roles = ['Bat', 'Bowl', 'AR', 'WK'] as const;
  
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    team: teams[i % teams.length],
    role: roles[i % roles.length],
    isForeign: i % 3 === 0,
  }));
}

// ============================================================================
// Configuration Validation Tests
// ============================================================================

describe('validateRosterFeasibility', () => {
  it('should pass with valid configuration', () => {
    const config = createMockConfig();
    const result = validateRosterFeasibility(config);
    assert.strictEqual(result.valid, true);
  });

  it('should fail when mandatory roles exceed roster size', () => {
    const config = createMockConfig({
      rosterSize: 5,
      mandatoryRoles: { Bat: 3, Bowl: 3, AR: 1, WK: 1 }, // Total: 8
      freeSlots: -3,
    });
    const result = validateRosterFeasibility(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('exceeds roster size'));
  });

  it('should fail when freeSlots calculation is incorrect', () => {
    const config = createMockConfig({
      rosterSize: 8,
      mandatoryRoles: { Bat: 3, Bowl: 3, AR: 0, WK: 0 },
      freeSlots: 5, // Should be 2
    });
    const result = validateRosterFeasibility(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('Free slots calculation mismatch'));
  });

  it('should handle edge case: roster size = 1', () => {
    const config = createMockConfig({
      rosterSize: 1,
      mandatoryRoles: { Bat: 1, Bowl: 0, AR: 0, WK: 0 },
      freeSlots: 0,
    });
    const result = validateRosterFeasibility(config);
    assert.strictEqual(result.valid, true);
  });
});

describe('validateTeamConstraints', () => {
  it('should pass with valid team constraints', () => {
    const config = createMockConfig();
    const result = validateTeamConstraints(config);
    assert.strictEqual(result.valid, true);
  });

  it('should fail when roster size exceeds max possible players', () => {
    const config = createMockConfig({
      rosterSize: 15,
      maxPerTeam: 1, // 10 teams × 1 = 10 max players
    });
    const result = validateTeamConstraints(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('exceeds maximum possible players'));
  });

  it('should fail when minPerTeam exceeds maxPerTeam', () => {
    const config = createMockConfig({
      minPerTeam: 2,
      maxPerTeam: 1,
    });
    const result = validateTeamConstraints(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('cannot exceed maximum per team'));
  });

  it('should handle edge case: maxPerTeam = 0', () => {
    const config = createMockConfig({
      rosterSize: 1,
      maxPerTeam: 0,
    });
    const result = validateTeamConstraints(config);
    assert.strictEqual(result.valid, false);
  });

  it('should fail when minPerTeam requires more players than roster size', () => {
    const config = createMockConfig({
      rosterSize: 5,
      minPerTeam: 1, // 10 teams × 1 = 10 min players needed
    });
    const result = validateTeamConstraints(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('requires at least'));
  });
});

describe('validateEarlyRoundRules', () => {
  it('should pass with valid early-round rules', () => {
    const config = createMockConfig();
    const result = validateEarlyRoundRules(config);
    assert.strictEqual(result.valid, true);
  });

  it('should fail when early round count exceeds total rounds', () => {
    const config = createMockConfig({
      rosterSize: 8,
      earlyRoundRule: { rounds: 10, minBat: 2, minBowl: 2 },
    });
    const result = validateEarlyRoundRules(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('cannot exceed total rounds'));
  });

  it('should fail when early-round requirements exceed available rounds', () => {
    const config = createMockConfig({
      earlyRoundRule: { rounds: 3, minBat: 2, minBowl: 2 }, // 4 needed, 3 available
    });
    const result = validateEarlyRoundRules(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('exceed available early rounds'));
  });

  it('should fail when early-round Bat exceeds mandatory Bat', () => {
    const config = createMockConfig({
      mandatoryRoles: { Bat: 2, Bowl: 3, AR: 0, WK: 0 },
      earlyRoundRule: { rounds: 4, minBat: 3, minBowl: 1 }, // Total 4, fits in rounds
      freeSlots: 3,
    });
    const result = validateEarlyRoundRules(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('exceeds mandatory Bat count'));
  });

  it('should fail when early-round Bowl exceeds mandatory Bowl', () => {
    const config = createMockConfig({
      mandatoryRoles: { Bat: 3, Bowl: 2, AR: 0, WK: 0 },
      earlyRoundRule: { rounds: 4, minBat: 1, minBowl: 3 }, // Total 4, fits in rounds
      freeSlots: 3,
    });
    const result = validateEarlyRoundRules(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('exceeds mandatory Bowl count'));
  });
});

describe('validatePlayerPool', () => {
  it('should pass with sufficient players', () => {
    const config = createMockConfig();
    const players = createMockPlayers(100);
    const result = validatePlayerPool(config, players, 4);
    assert.strictEqual(result.valid, true);
  });

  it('should fail when total player count is insufficient', () => {
    const config = createMockConfig({ rosterSize: 8 });
    const players = createMockPlayers(20); // Need 8 × 4 = 32
    const result = validatePlayerPool(config, players, 4);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('insufficient'));
  });

  it('should fail when specific role count is insufficient', () => {
    const config = createMockConfig({
      mandatoryRoles: { Bat: 5, Bowl: 0, AR: 0, WK: 0 },
      freeSlots: 3,
    });
    // Create players with only 8 Batsmen (need 5 × 4 = 20)
    const players = [
      ...Array.from({ length: 8 }, (_, i) => createMockPlayer({ id: `bat-${i}`, role: 'Bat' })),
      ...Array.from({ length: 50 }, (_, i) => createMockPlayer({ id: `bowl-${i}`, role: 'Bowl' })),
    ];
    const result = validatePlayerPool(config, players, 4);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors?.some(e => e.includes('Insufficient Bat players')));
  });
});

describe('validateDraftConfiguration', () => {
  it('should pass with fully valid configuration', () => {
    const config = createMockConfig();
    const players = createMockPlayers(100);
    const result = validateDraftConfiguration(config, players, 4);
    assert.strictEqual(result.valid, true);
  });

  it('should collect all validation errors', () => {
    const config = createMockConfig({
      rosterSize: 5,
      mandatoryRoles: { Bat: 3, Bowl: 3, AR: 1, WK: 1 }, // Exceeds roster
      freeSlots: -2,
      maxPerTeam: 0, // Invalid
      earlyRoundRule: { rounds: 10, minBat: 5, minBowl: 5 }, // Exceeds everything
    });
    const players = createMockPlayers(10); // Insufficient
    const result = validateDraftConfiguration(config, players, 4);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors && result.errors.length > 1);
  });
});

// ============================================================================
// Pick Validation Tests
// ============================================================================

describe('validatePlayerAvailable', () => {
  it('should pass when player is available', () => {
    const result = validatePlayerAvailable('player-1', ['player-2', 'player-3']);
    assert.strictEqual(result.valid, true);
  });

  it('should fail when player is already drafted', () => {
    const result = validatePlayerAvailable('player-1', ['player-1', 'player-2']);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('already been drafted'));
  });
});

describe('validateTeamCap', () => {
  it('should pass when under team cap', () => {
    const config = createMockConfig({ maxPerTeam: 2 });
    const player = createMockPlayer({ team: 'CSK' });
    const roster = [createMockPlayer({ id: 'p1', team: 'CSK' })];
    const result = validateTeamCap(player, roster, config);
    assert.strictEqual(result.valid, true);
  });

  it('should fail when at team cap', () => {
    const config = createMockConfig({ maxPerTeam: 1 });
    const player = createMockPlayer({ team: 'CSK' });
    const roster = [createMockPlayer({ id: 'p1', team: 'CSK' })];
    const result = validateTeamCap(player, roster, config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('Maximum players from CSK reached'));
  });

  it('should allow picking from different team', () => {
    const config = createMockConfig({ maxPerTeam: 1 });
    const player = createMockPlayer({ team: 'MI' });
    const roster = [createMockPlayer({ id: 'p1', team: 'CSK' })];
    const result = validateTeamCap(player, roster, config);
    assert.strictEqual(result.valid, true);
  });
});

describe('validateEarlyRoundPick', () => {
  it('should pass when not in early rounds', () => {
    const config = createMockConfig({ earlyRoundRule: { rounds: 4, minBat: 2, minBowl: 2 } });
    const player = createMockPlayer({ role: 'AR' });
    const roster: Player[] = [];
    const result = validateEarlyRoundPick(player, roster, 5, config);
    assert.strictEqual(result.valid, true);
  });

  it('should pass when picking required role with time remaining', () => {
    const config = createMockConfig({ earlyRoundRule: { rounds: 4, minBat: 2, minBowl: 2 } });
    const player = createMockPlayer({ role: 'Bat' });
    const roster: Player[] = [];
    const result = validateEarlyRoundPick(player, roster, 1, config);
    assert.strictEqual(result.valid, true);
  });

  it('should fail when must pick Batsman but picking other role', () => {
    const config = createMockConfig({ earlyRoundRule: { rounds: 4, minBat: 2, minBowl: 2 } });
    const player = createMockPlayer({ role: 'AR' });
    const roster = [
      createMockPlayer({ id: 'p1', role: 'Bowl' }),
      createMockPlayer({ id: 'p2', role: 'Bowl' }),
    ];
    const result = validateEarlyRoundPick(player, roster, 4, config); // Last early round, need 2 Bat
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('Must draft'));
  });

  it('should fail when must pick Bowler but picking other role', () => {
    const config = createMockConfig({ earlyRoundRule: { rounds: 4, minBat: 2, minBowl: 2 } });
    const player = createMockPlayer({ role: 'WK' });
    const roster = [
      createMockPlayer({ id: 'p1', role: 'Bat' }),
      createMockPlayer({ id: 'p2', role: 'Bat' }),
    ];
    const result = validateEarlyRoundPick(player, roster, 4, config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('Must draft'));
  });

  it('should allow flexibility when enough rounds remain', () => {
    const config = createMockConfig({ earlyRoundRule: { rounds: 4, minBat: 2, minBowl: 2 } });
    const player = createMockPlayer({ role: 'AR' });
    const roster: Player[] = [];
    const result = validateEarlyRoundPick(player, roster, 1, config); // Round 1 of 4
    assert.strictEqual(result.valid, true);
  });
});

describe('getValidRolesForNextPick', () => {
  it('when freeSlots === 0 returns only roles with open mandatory slots', () => {
    const config = createMockConfig({
      rosterSize: 6,
      mandatoryRoles: { Bat: 2, Bowl: 2, AR: 1, WK: 1 },
      freeSlots: 0,
    });
    const roster: Player[] = [
      createMockPlayer({ id: 'p1', role: 'Bat' }),
      createMockPlayer({ id: 'p2', role: 'Bat' }), // Bat filled
      createMockPlayer({ id: 'p3', role: 'Bowl' }),
      // Bowl: need 1 more; AR: need 1; WK: need 1
    ];
    const valid = getValidRolesForNextPick(roster, config);
    assert.strictEqual(valid.has('Bat'), false);
    assert.strictEqual(valid.has('Bowl'), true);
    assert.strictEqual(valid.has('AR'), true);
    assert.strictEqual(valid.has('WK'), true);
  });

  it('when freeSlots === 0 and roster empty returns all mandatory roles', () => {
    const config = createMockConfig({
      rosterSize: 4,
      mandatoryRoles: { Bat: 1, Bowl: 1, AR: 1, WK: 1 },
      freeSlots: 0,
    });
    const valid = getValidRolesForNextPick([], config);
    assert.strictEqual(valid.has('Bat'), true);
    assert.strictEqual(valid.has('Bowl'), true);
    assert.strictEqual(valid.has('AR'), true);
    assert.strictEqual(valid.has('WK'), true);
  });

  it('when freeSlots > 0 returns all roles', () => {
    const config = createMockConfig({ freeSlots: 2 });
    const roster = [createMockPlayer({ id: 'p1', role: 'Bat' })];
    const valid = getValidRolesForNextPick(roster, config);
    assert.strictEqual(valid.has('Bat'), true);
    assert.strictEqual(valid.has('Bowl'), true);
    assert.strictEqual(valid.has('AR'), true);
    assert.strictEqual(valid.has('WK'), true);
  });
});

describe('validateMandatoryRolePick', () => {
  it('when freeSlots === 0 allows pick that fills open mandatory slot', () => {
    const config = createMockConfig({
      rosterSize: 6,
      mandatoryRoles: { Bat: 2, Bowl: 2, AR: 1, WK: 1 },
      freeSlots: 0,
    });
    const roster: Player[] = [
      createMockPlayer({ id: 'p1', role: 'Bowl' }),
      createMockPlayer({ id: 'p2', role: 'AR' }),
    ];
    const player = createMockPlayer({ id: 'p3', role: 'Bowl' });
    const result = validateMandatoryRolePick(player, roster, config);
    assert.strictEqual(result.valid, true);
  });

  it('when freeSlots === 0 rejects pick for role that already has mandatory filled', () => {
    const config = createMockConfig({
      rosterSize: 6,
      mandatoryRoles: { Bat: 2, Bowl: 2, AR: 1, WK: 1 },
      freeSlots: 0,
    });
    const roster: Player[] = [
      createMockPlayer({ id: 'p1', role: 'Bat' }),
      createMockPlayer({ id: 'p2', role: 'Bat' }),
    ];
    const player = createMockPlayer({ id: 'p3', role: 'Bat' });
    const result = validateMandatoryRolePick(player, roster, config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('required role') || result.error?.includes('Still needed'));
  });

  it('when freeSlots > 0 allows any role', () => {
    const config = createMockConfig({ freeSlots: 2 });
    const roster = [createMockPlayer({ id: 'p1', role: 'Bat' })];
    const player = createMockPlayer({ id: 'p2', role: 'AR' });
    const result = validateMandatoryRolePick(player, roster, config);
    assert.strictEqual(result.valid, true);
  });
});

// ============================================================================
// getEligiblePlayers Tests
// ============================================================================

describe('getEligiblePlayers', () => {
  it('should exclude already-drafted players', () => {
    const config = createMockConfig({ maxPerTeam: 10 });
    const players = [
      createMockPlayer({ id: 'p1', team: 'CSK', role: 'Bat' }),
      createMockPlayer({ id: 'p2', team: 'MI', role: 'Bowl' }),
    ];
    const eligible = getEligiblePlayers(players, [], 1, config, ['p1']);
    assert.strictEqual(eligible.has('p1'), false);
    assert.strictEqual(eligible.has('p2'), true);
  });

  it('should exclude players whose team is at max cap', () => {
    const config = createMockConfig({ maxPerTeam: 1 });
    const roster = [createMockPlayer({ id: 'r1', team: 'CSK', role: 'Bat' })];
    const players = [
      createMockPlayer({ id: 'p1', team: 'CSK', role: 'Bowl' }),
      createMockPlayer({ id: 'p2', team: 'MI', role: 'Bowl' }),
    ];
    const eligible = getEligiblePlayers(players, roster, 1, config, []);
    assert.strictEqual(eligible.has('p1'), false);
    assert.strictEqual(eligible.has('p2'), true);
  });

  it('should enforce early-round constraints - disallow pick that makes it impossible to meet bat/bowl minimums', () => {
    // Config: first 4 rounds need 2 Bat, 2 Bowl
    const config = createMockConfig({
      maxPerTeam: 10,
      earlyRoundRule: { rounds: 4, minBat: 2, minBowl: 2 },
    });
    // Round 3 with roster already having 1 Bat + 1 Bowl. 2 early rounds remain.
    // Still need 1 Bat + 1 Bowl = 2 picks in 2 rounds — exactly fits.
    // Picking AR would leave 1 round for 1 Bat + 1 Bowl = 2 needed, impossible.
    // Picking Bat leaves 1 round for 0 Bat + 1 Bowl = 1 needed, OK.
    // Picking Bowl leaves 1 round for 1 Bat + 0 Bowl = 1 needed, OK.
    const roster = [
      createMockPlayer({ id: 'r1', team: 'CSK', role: 'Bat' }),
      createMockPlayer({ id: 'r2', team: 'MI', role: 'Bowl' }),
    ];
    const arPlayer = createMockPlayer({ id: 'ar1', team: 'GT', role: 'AR' });
    const batPlayer = createMockPlayer({ id: 'bat1', team: 'RR', role: 'Bat' });
    const bowlPlayer = createMockPlayer({ id: 'bowl1', team: 'RCB', role: 'Bowl' });

    const eligible = getEligiblePlayers([arPlayer, batPlayer, bowlPlayer], roster, 3, config, []);
    assert.strictEqual(eligible.has('ar1'), false);
    assert.strictEqual(eligible.has('bat1'), true);
    assert.strictEqual(eligible.has('bowl1'), true);
  });

  it('should allow non-bat/bowl picks in early rounds when enough rounds remain', () => {
    const config = createMockConfig({
      maxPerTeam: 10,
      earlyRoundRule: { rounds: 6, minBat: 2, minBowl: 2 },
      totalRounds: 8,
    });
    // Round 1 of 6 early rounds. 6 rounds remain (including this one).
    // After picking AR: 5 early picks left for 2 Bat + 2 Bowl = 4 needs → 4 <= 5 → OK
    const arPlayer = createMockPlayer({ id: 'ar1', team: 'CSK', role: 'AR' });
    const batPlayer = createMockPlayer({ id: 'bat1', team: 'MI', role: 'Bat' });
    const eligible = getEligiblePlayers([arPlayer, batPlayer], [], 1, config, []);
    assert.strictEqual(eligible.has('ar1'), true);
    assert.strictEqual(eligible.has('bat1'), true);
  });

  it('should enforce mandatory role look-ahead - cannot pick a role if it makes mandatory unfillable', () => {
    // rosterSize=4, mandatory: Bat=1, Bowl=1, AR=1, WK=1, freeSlots=0
    const config = createMockConfig({
      rosterSize: 4,
      mandatoryRoles: { Bat: 1, Bowl: 1, AR: 1, WK: 1 },
      freeSlots: 0,
      maxPerTeam: 10,
      earlyRoundRule: { rounds: 0, minBat: 0, minBowl: 0 },
    });
    // Roster has 2 picks already (Bat, Bowl). 2 picks left (including this one).
    // After this pick, 1 pick remains. Still need AR=1 and WK=1.
    // Picking another Bat would mean 1 pick left for 2 mandatory roles => impossible.
    const roster = [
      createMockPlayer({ id: 'r1', role: 'Bat', team: 'CSK' }),
      createMockPlayer({ id: 'r2', role: 'Bowl', team: 'MI' }),
    ];
    const players = [
      createMockPlayer({ id: 'bat2', role: 'Bat', team: 'GT' }),
      createMockPlayer({ id: 'ar1', role: 'AR', team: 'RR' }),
      createMockPlayer({ id: 'wk1', role: 'WK', team: 'RCB' }),
    ];
    const eligible = getEligiblePlayers(players, roster, 5, config, []);
    assert.strictEqual(eligible.has('bat2'), false); // picking bat makes it impossible
    assert.strictEqual(eligible.has('ar1'), true);
    assert.strictEqual(eligible.has('wk1'), true);
  });

  it('should enforce mandatory-only when freeSlots === 0', () => {
    const config = createMockConfig({
      rosterSize: 6,
      mandatoryRoles: { Bat: 2, Bowl: 2, AR: 1, WK: 1 },
      freeSlots: 0,
      maxPerTeam: 10,
      earlyRoundRule: { rounds: 0, minBat: 0, minBowl: 0 },
    });
    // Bat already filled (2/2), need Bowl=2, AR=1, WK=1
    const roster = [
      createMockPlayer({ id: 'r1', role: 'Bat', team: 'CSK' }),
      createMockPlayer({ id: 'r2', role: 'Bat', team: 'MI' }),
    ];
    const players = [
      createMockPlayer({ id: 'bat3', role: 'Bat', team: 'GT' }),
      createMockPlayer({ id: 'bowl1', role: 'Bowl', team: 'RR' }),
    ];
    const eligible = getEligiblePlayers(players, roster, 5, config, []);
    assert.strictEqual(eligible.has('bat3'), false); // Bat filled, freeSlots=0
    assert.strictEqual(eligible.has('bowl1'), true);
  });

  it('should return all undrafted players when no constraints are binding', () => {
    const config = createMockConfig({
      rosterSize: 8,
      maxPerTeam: 10,
      mandatoryRoles: { Bat: 0, Bowl: 0, AR: 0, WK: 0 },
      freeSlots: 8,
      earlyRoundRule: { rounds: 0, minBat: 0, minBowl: 0 },
    });
    const players = createMockPlayers(5);
    const eligible = getEligiblePlayers(players, [], 1, config, []);
    assert.strictEqual(eligible.size, 5);
  });
});

describe('validatePick', () => {
  it('should pass with valid pick', () => {
    const config = createMockConfig();
    const player = createMockPlayer({ id: 'player-1', team: 'CSK', role: 'Bat' });
    const roster: Player[] = [];
    const draftedPlayerIds: string[] = [];
    const result = validatePick(player, roster, 1, config, draftedPlayerIds);
    assert.strictEqual(result.valid, true);
  });

  it('should collect multiple validation errors', () => {
    const config = createMockConfig({ maxPerTeam: 1, earlyRoundRule: { rounds: 4, minBat: 2, minBowl: 2 } });
    const player = createMockPlayer({ id: 'player-1', team: 'CSK', role: 'AR' });
    const roster = [createMockPlayer({ id: 'p1', team: 'CSK', role: 'Bowl' })];
    const draftedPlayerIds = ['player-1']; // Already drafted
    const result = validatePick(player, roster, 4, config, draftedPlayerIds);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors && result.errors.length >= 2); // Already drafted + team cap
  });

  it('when freeSlots === 0 rejects pick that does not fill a required role', () => {
    const config = createMockConfig({
      rosterSize: 4,
      mandatoryRoles: { Bat: 2, Bowl: 1, AR: 0, WK: 1 },
      freeSlots: 0,
      maxPerTeam: 2,
      earlyRoundRule: { rounds: 1, minBat: 0, minBowl: 0 },
    });
    const roster: Player[] = [
      createMockPlayer({ id: 'p1', role: 'Bat', team: 'CSK' }),
      createMockPlayer({ id: 'p2', role: 'Bat', team: 'MI' }),
      createMockPlayer({ id: 'p3', role: 'WK', team: 'GT' }),
    ];
    const player = createMockPlayer({ id: 'p4', role: 'AR', team: 'RR' }); // AR not required
    const result = validatePick(player, roster, 1, config, []);
    assert.strictEqual(result.valid, false);
    assert.ok(
      result.errors?.some(e => e.includes('required role') || e.includes('Still needed'))
    );
  });

  it('when freeSlots === 0 allows pick that fills open mandatory slot', () => {
    const config = createMockConfig({
      rosterSize: 4,
      mandatoryRoles: { Bat: 2, Bowl: 1, AR: 0, WK: 1 },
      freeSlots: 0,
      maxPerTeam: 2,
      earlyRoundRule: { rounds: 1, minBat: 0, minBowl: 0 },
    });
    const roster: Player[] = [
      createMockPlayer({ id: 'p1', role: 'Bat', team: 'CSK' }),
      createMockPlayer({ id: 'p2', role: 'Bat', team: 'MI' }),
    ];
    const player = createMockPlayer({ id: 'p3', role: 'WK', team: 'GT' });
    const result = validatePick(player, roster, 1, config, []);
    assert.strictEqual(result.valid, true);
  });
});
