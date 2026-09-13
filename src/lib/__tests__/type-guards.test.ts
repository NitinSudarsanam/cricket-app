/**
 * Unit Tests for Type Guards
 * 
 * Tests all type guard functions with valid and invalid inputs.
 */

import { describe, it, expect } from 'vitest';
import {
  isIPLTeam,
  isPlayerRole,
  isDraftStatus,
  isPlayer,
  isMandatoryRoles,
  isEarlyRoundRule,
  isDraftConfig,
  isPickRecord,
  isDraftState,
  isFantasyTeam,
  isPlayerArray,
  isPickRecordArray,
  isPartialMandatoryRoles,
  isPartialEarlyRoundRule,
} from '../type-guards';
import { createPlayer, createDraftConfig, createDraftState, createPickRecord } from '@/__tests__/helpers/mock-factories';

describe('isIPLTeam', () => {
  it('should return true for valid IPL teams', () => {
    expect(isIPLTeam('CSK')).toBe(true);
    expect(isIPLTeam('MI')).toBe(true);
    expect(isIPLTeam('GT')).toBe(true);
    expect(isIPLTeam('RR')).toBe(true);
    expect(isIPLTeam('RCB')).toBe(true);
    expect(isIPLTeam('KKR')).toBe(true);
    expect(isIPLTeam('LSG')).toBe(true);
    expect(isIPLTeam('SRH')).toBe(true);
    expect(isIPLTeam('PBKS')).toBe(true);
    expect(isIPLTeam('DC')).toBe(true);
  });

  it('should return false for invalid teams', () => {
    expect(isIPLTeam('INVALID')).toBe(false);
    expect(isIPLTeam('')).toBe(false);
    expect(isIPLTeam(null)).toBe(false);
    expect(isIPLTeam(undefined)).toBe(false);
    expect(isIPLTeam(123)).toBe(false);
  });
});

describe('isPlayerRole', () => {
  it('should return true for valid roles', () => {
    expect(isPlayerRole('Bat')).toBe(true);
    expect(isPlayerRole('Bowl')).toBe(true);
    expect(isPlayerRole('AR')).toBe(true);
    expect(isPlayerRole('WK')).toBe(true);
  });

  it('should return false for invalid roles', () => {
    expect(isPlayerRole('INVALID')).toBe(false);
    expect(isPlayerRole('')).toBe(false);
    expect(isPlayerRole(null)).toBe(false);
    expect(isPlayerRole(undefined)).toBe(false);
    expect(isPlayerRole(123)).toBe(false);
  });
});

describe('isDraftStatus', () => {
  it('should return true for valid statuses', () => {
    expect(isDraftStatus('not_started')).toBe(true);
    expect(isDraftStatus('in_progress')).toBe(true);
    expect(isDraftStatus('paused')).toBe(true);
    expect(isDraftStatus('completed')).toBe(true);
  });

  it('should return false for invalid statuses', () => {
    expect(isDraftStatus('INVALID')).toBe(false);
    expect(isDraftStatus('')).toBe(false);
    expect(isDraftStatus(null)).toBe(false);
    expect(isDraftStatus(undefined)).toBe(false);
  });
});

describe('isPlayer', () => {
  it('should return true for valid player', () => {
    const player = createPlayer();
    expect(isPlayer(player)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isPlayer(null)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isPlayer('string')).toBe(false);
    expect(isPlayer(123)).toBe(false);
    expect(isPlayer([])).toBe(false);
  });

  it('should return false for player with missing id', () => {
    const player = createPlayer();
    delete (player as any).id;
    expect(isPlayer(player)).toBe(false);
  });

  it('should return false for player with invalid team', () => {
    const player = createPlayer({ team: 'TOOLONGCODE' as any });
    expect(isPlayer(player)).toBe(false);
  });

  it('should return false for player with invalid role', () => {
    const player = createPlayer({ role: 'INVALID' as any });
    expect(isPlayer(player)).toBe(false);
  });

  it('should return false for player with non-boolean isForeign', () => {
    const player = createPlayer({ isForeign: 'yes' as any });
    expect(isPlayer(player)).toBe(false);
  });

  it('should accept player with valid metadata', () => {
    const player = createPlayer({ metadata: { key: 'value' } });
    expect(isPlayer(player)).toBe(true);
  });

  it('should accept player with null metadata', () => {
    const player = createPlayer({ metadata: null });
    expect(isPlayer(player)).toBe(true);
  });

  it('should reject player with invalid metadata type', () => {
    const player = createPlayer({ metadata: 'invalid' as any });
    expect(isPlayer(player)).toBe(false);
  });
});

describe('isMandatoryRoles', () => {
  it('should return true for valid mandatory roles', () => {
    expect(isMandatoryRoles({ Bat: 3, Bowl: 3, AR: 0, WK: 0 })).toBe(true);
    expect(isMandatoryRoles({ Bat: 0, Bowl: 0, AR: 0, WK: 0 })).toBe(true);
  });

  it('should return false for null', () => {
    expect(isMandatoryRoles(null)).toBe(false);
  });

  it('should return false for missing fields', () => {
    expect(isMandatoryRoles({ Bat: 3 } as any)).toBe(false);
    expect(isMandatoryRoles({ Bat: 3, Bowl: 3 } as any)).toBe(false);
  });

  it('should return false for negative values', () => {
    expect(isMandatoryRoles({ Bat: -1, Bowl: 0, AR: 0, WK: 0 })).toBe(false);
  });

  it('should return false for non-number values', () => {
    expect(isMandatoryRoles({ Bat: '3', Bowl: 0, AR: 0, WK: 0 } as any)).toBe(false);
  });
});

describe('isEarlyRoundRule', () => {
  it('should return true for valid early round rule', () => {
    expect(isEarlyRoundRule({ rounds: 4, minBat: 2, minBowl: 2 })).toBe(true);
    expect(isEarlyRoundRule({ rounds: 0, minBat: 0, minBowl: 0 })).toBe(true);
  });

  it('should return false for null', () => {
    expect(isEarlyRoundRule(null)).toBe(false);
  });

  it('should return false for missing fields', () => {
    expect(isEarlyRoundRule({ rounds: 4 } as any)).toBe(false);
  });

  it('should return false for negative values', () => {
    expect(isEarlyRoundRule({ rounds: -1, minBat: 0, minBowl: 0 })).toBe(false);
  });
});

describe('isDraftConfig', () => {
  it('should return true for valid draft config', () => {
    const config = createDraftConfig();
    expect(isDraftConfig(config)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isDraftConfig(null)).toBe(false);
  });

  it('should return false for missing id', () => {
    const config = createDraftConfig();
    delete (config as any).id;
    expect(isDraftConfig(config)).toBe(false);
  });

  it('should return false for invalid roster size', () => {
    const config = createDraftConfig({ rosterSize: 0 });
    expect(isDraftConfig(config)).toBe(false);
  });

  it('should return false for invalid mandatory roles', () => {
    const config = createDraftConfig({
      mandatoryRoles: { Bat: -1, Bowl: 0, AR: 0, WK: 0 },
    });
    expect(isDraftConfig(config)).toBe(false);
  });
});

describe('isPickRecord', () => {
  it('should return true for valid pick record', () => {
    const pick = createPickRecord();
    expect(isPickRecord(pick)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isPickRecord(null)).toBe(false);
  });

  it('should return false for missing fields', () => {
    const pick = createPickRecord();
    delete (pick as any).round;
    expect(isPickRecord(pick)).toBe(false);
  });

  it('should return false for invalid round', () => {
    const pick = createPickRecord({ round: 0 });
    expect(isPickRecord(pick)).toBe(false);
  });

  it('should accept Date or string timestamp', () => {
    const pick1 = createPickRecord({ timestamp: new Date() });
    const pick2 = createPickRecord({ timestamp: new Date().toISOString() });
    expect(isPickRecord(pick1)).toBe(true);
    expect(isPickRecord(pick2)).toBe(true);
  });
});

describe('isDraftState', () => {
  it('should return true for valid draft state', () => {
    const state = createDraftState();
    expect(isDraftState(state)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isDraftState(null)).toBe(false);
  });

  it('should return false for missing fields', () => {
    const state = createDraftState();
    delete (state as any).id;
    expect(isDraftState(state)).toBe(false);
  });

  it('should return false for invalid picks array', () => {
    const state = createDraftState({ picks: [{ invalid: 'pick' }] as any });
    expect(isDraftState(state)).toBe(false);
  });

  it('should return false for invalid status', () => {
    const state = createDraftState({ status: 'INVALID' as any });
    expect(isDraftState(state)).toBe(false);
  });
});

describe('isFantasyTeam', () => {
  it('should return true for valid fantasy team', () => {
    const player = createPlayer();
    const team = {
      id: 'team-1',
      name: 'Test Team',
      draftedPlayers: [player],
      teamCount: { CSK: 1, MI: 0, GT: 0, RR: 0, RCB: 0, KKR: 0, LSG: 0, SRH: 0, PBKS: 0, DC: 0 },
      roleCount: { Bat: 1, Bowl: 0, AR: 0, WK: 0 },
    };
    expect(isFantasyTeam(team)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isFantasyTeam(null)).toBe(false);
  });

  it('should return false for missing fields', () => {
    const team = {
      id: 'team-1',
      name: 'Test Team',
    };
    expect(isFantasyTeam(team as any)).toBe(false);
  });
});

describe('isPlayerArray', () => {
  it('should return true for array of valid players', () => {
    const players = [createPlayer(), createPlayer()];
    expect(isPlayerArray(players)).toBe(true);
  });

  it('should return false for empty array', () => {
    expect(isPlayerArray([])).toBe(true); // Empty array is valid
  });

  it('should return false for array with invalid player', () => {
    const players = [createPlayer(), { invalid: 'player' }];
    expect(isPlayerArray(players)).toBe(false);
  });

  it('should return false for non-array', () => {
    expect(isPlayerArray(null)).toBe(false);
    expect(isPlayerArray({})).toBe(false);
  });
});

describe('isPickRecordArray', () => {
  it('should return true for array of valid pick records', () => {
    const picks = [createPickRecord(), createPickRecord()];
    expect(isPickRecordArray(picks)).toBe(true);
  });

  it('should return false for array with invalid pick', () => {
    const picks = [createPickRecord(), { invalid: 'pick' }];
    expect(isPickRecordArray(picks)).toBe(false);
  });
});

describe('isPartialMandatoryRoles', () => {
  it('should return true for valid partial mandatory roles', () => {
    expect(isPartialMandatoryRoles({ Bat: 3 })).toBe(true);
    expect(isPartialMandatoryRoles({ Bat: 3, Bowl: 2 })).toBe(true);
    expect(isPartialMandatoryRoles({})).toBe(true);
  });

  it('should return false for negative values', () => {
    expect(isPartialMandatoryRoles({ Bat: -1 })).toBe(false);
  });

  it('should return false for non-number values', () => {
    expect(isPartialMandatoryRoles({ Bat: '3' } as any)).toBe(false);
  });
});

describe('isPartialEarlyRoundRule', () => {
  it('should return true for valid partial early round rule', () => {
    expect(isPartialEarlyRoundRule({ rounds: 4 })).toBe(true);
    expect(isPartialEarlyRoundRule({})).toBe(true);
  });

  it('should return false for negative values', () => {
    expect(isPartialEarlyRoundRule({ rounds: -1 })).toBe(false);
  });
});
