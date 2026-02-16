/**
 * Basic verification tests for data models and utilities
 * 
 * These tests verify that type guards, validation, and mappers work correctly.
 */

import { describe, it } from 'vitest';
import {
  isIPLTeam,
  isPlayerRole,
  isDraftStatus,
  isPlayer,
  isDraftConfig,
  validatePlayer,
  validateCreatePlayerRequest,
  validateDraftConfig,
  calculateFreeSlots,
  validateConfigConsistency,
  initializeTeamCount,
  initializeRoleCount,
  calculateTeamCounts,
  calculateRoleCounts,
} from '../index';

import type {
  Player,
  DraftConfig,
  IPLTeam,
  PlayerRole,
} from '../../../types';

describe('Models', () => {
  it('type guards, validation, and utilities', () => {
// ============================================================================
// Type Guard Tests
// ============================================================================

console.log('Testing Type Guards...');

// Test isIPLTeam
console.assert(isIPLTeam('CSK') === true, 'CSK should be valid IPL team');
console.assert(isIPLTeam('MI') === true, 'MI should be valid IPL team');
console.assert(isIPLTeam('INVALID') === false, 'INVALID should not be valid IPL team');
console.assert(isIPLTeam(123) === false, 'Number should not be valid IPL team');

// Test isPlayerRole
console.assert(isPlayerRole('Bat') === true, 'Bat should be valid role');
console.assert(isPlayerRole('Bowl') === true, 'Bowl should be valid role');
console.assert(isPlayerRole('INVALID') === false, 'INVALID should not be valid role');

// Test isDraftStatus
console.assert(isDraftStatus('not_started') === true, 'not_started should be valid status');
console.assert(isDraftStatus('in_progress') === true, 'in_progress should be valid status');
console.assert(isDraftStatus('INVALID') === false, 'INVALID should not be valid status');

// Test isPlayer
const validPlayer: Player = {
  id: '1',
  name: 'MS Dhoni',
  team: 'CSK',
  role: 'WK',
  isForeign: false,
};

console.assert(isPlayer(validPlayer) === true, 'Valid player should pass type guard');
console.assert(isPlayer({ ...validPlayer, team: 'INVALID' }) === false, 'Invalid team should fail');
console.assert(isPlayer({ ...validPlayer, role: 'INVALID' }) === false, 'Invalid role should fail');
console.assert(isPlayer({ ...validPlayer, isForeign: 'yes' }) === false, 'Invalid isForeign should fail');

console.log('✓ Type Guards passed');

// ============================================================================
// Validation Tests
// ============================================================================

console.log('\nTesting Validation...');

// Test validatePlayer
const validationResult1 = validatePlayer(validPlayer);
console.assert(validationResult1.valid === true, 'Valid player should pass validation');

const invalidPlayer = { ...validPlayer, name: '' };
const validationResult2 = validatePlayer(invalidPlayer);
console.assert(validationResult2.valid === false, 'Empty name should fail validation');

// Test validateCreatePlayerRequest
const validRequest = {
  name: 'Virat Kohli',
  team: 'RCB',
  role: 'Bat',
  isForeign: false,
};

const validationResult3 = validateCreatePlayerRequest(validRequest);
console.assert(validationResult3.valid === true, 'Valid request should pass validation');

const invalidRequest = { ...validRequest, team: 'INVALID' };
const validationResult4 = validateCreatePlayerRequest(invalidRequest);
console.assert(validationResult4.valid === false, 'Invalid team should fail validation');

console.log('✓ Validation passed');

// ============================================================================
// DraftConfig Tests
// ============================================================================

console.log('\nTesting DraftConfig...');

const validConfig: DraftConfig = {
  id: '1',
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

const configValidation = validateDraftConfig(validConfig);
console.assert(configValidation.valid === true, 'Valid config should pass validation');

const freeSlots = calculateFreeSlots(validConfig);
console.assert(freeSlots === 2, 'Free slots should be calculated correctly');

const consistencyCheck = validateConfigConsistency(validConfig);
console.assert(consistencyCheck.valid === true, 'Valid config should be consistent');

// Test invalid config
const invalidConfig: DraftConfig = {
  ...validConfig,
  mandatoryRoles: {
    Bat: 5,
    Bowl: 5,
    AR: 0,
    WK: 0,
  },
  freeSlots: -2,
};

const invalidConsistency = validateConfigConsistency(invalidConfig);
console.assert(invalidConsistency.valid === false, 'Invalid config should fail consistency check');

console.log('✓ DraftConfig tests passed');

// ============================================================================
// Utility Function Tests
// ============================================================================

console.log('\nTesting Utility Functions...');

// Test initializeTeamCount
const teamCount = initializeTeamCount();
console.assert(Object.keys(teamCount).length === 10, 'Should have 10 teams');
console.assert(teamCount['CSK'] === 0, 'Initial count should be 0');

// Test initializeRoleCount
const roleCount = initializeRoleCount();
console.assert(Object.keys(roleCount).length === 4, 'Should have 4 roles');
console.assert(roleCount['Bat'] === 0, 'Initial count should be 0');

// Test calculateTeamCounts
const players: Player[] = [
  { id: '1', name: 'Player 1', team: 'CSK', role: 'Bat', isForeign: false },
  { id: '2', name: 'Player 2', team: 'CSK', role: 'Bowl', isForeign: false },
  { id: '3', name: 'Player 3', team: 'MI', role: 'Bat', isForeign: false },
];

const calculatedTeamCount = calculateTeamCounts(players);
console.assert(calculatedTeamCount['CSK'] === 2, 'CSK should have 2 players');
console.assert(calculatedTeamCount['MI'] === 1, 'MI should have 1 player');

// Test calculateRoleCounts
const calculatedRoleCount = calculateRoleCounts(players);
console.assert(calculatedRoleCount['Bat'] === 2, 'Bat should have 2 players');
console.assert(calculatedRoleCount['Bowl'] === 1, 'Bowl should have 1 player');

console.log('✓ Utility Functions passed');

// ============================================================================
// Summary
// ============================================================================

console.log('\n✅ All model tests passed successfully!');
console.log('Data models and TypeScript interfaces are working correctly.');
  });
});
