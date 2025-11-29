/**
 * Unit Tests for Rule Engine
 * 
 * Tests all validation functions with valid and invalid inputs,
 * including edge cases and mathematical consistency checks.
 */

import { describe, it } from 'node:test';
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
  validatePick,
} from '../rule-engine';
import type { DraftConfig, Player } from '@/types';

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
});
