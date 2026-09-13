/**
 * Unit Tests for Validation Functions
 * 
 * Tests all validation functions with valid and invalid inputs.
 */

import { describe, it, expect } from 'vitest';
import {
  validatePlayer,
  validateCreatePlayerRequest,
  validateUpdatePlayerRequest,
  validateDraftConfig,
  validateUpdateDraftConfigRequest,
} from '../validation';
import { createPlayer, createDraftConfig } from '@/__tests__/helpers/mock-factories';

describe('validatePlayer', () => {
  it('should validate a valid player', () => {
    const player = createPlayer();
    const result = validatePlayer(player);
    expect(result.valid).toBe(true);
  });

  it('should reject non-object input', () => {
    const result = validatePlayer(null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('object');
  });

  it('should reject player with missing name', () => {
    const player = createPlayer({ name: '' });
    const result = validatePlayer(player);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('name'))).toBe(true);
  });

  it('should reject player with invalid team', () => {
    const player = createPlayer({ team: 'TOOLONGCODE' as any });
    const result = validatePlayer(player);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('team'))).toBe(true);
  });

  it('should reject player with invalid role', () => {
    const player = createPlayer({ role: 'INVALID' as any });
    const result = validatePlayer(player);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('role'))).toBe(true);
  });

  it('should reject player with non-boolean isForeign', () => {
    const player = createPlayer({ isForeign: 'yes' as any });
    const result = validatePlayer(player);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('isForeign'))).toBe(true);
  });

  it('should accept player with valid metadata', () => {
    const player = createPlayer({ metadata: { key: 'value' } });
    const result = validatePlayer(player);
    expect(result.valid).toBe(true);
  });

  it('should reject player with invalid metadata type', () => {
    const player = createPlayer({ metadata: 'invalid' as any });
    const result = validatePlayer(player);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('metadata'))).toBe(true);
  });
});

describe('validateCreatePlayerRequest', () => {
  it('should validate a valid create request', () => {
    const request = {
      name: 'Test Player',
      team: 'CSK',
      role: 'Bat',
      isForeign: false,
    };
    const result = validateCreatePlayerRequest(request);
    expect(result.valid).toBe(true);
  });

  it('should reject request with name exceeding 100 characters', () => {
    const request = {
      name: 'a'.repeat(101),
      team: 'CSK',
      role: 'Bat',
      isForeign: false,
    };
    const result = validateCreatePlayerRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('100'))).toBe(true);
  });

  it('should reject request with empty name', () => {
    const request = {
      name: '',
      team: 'CSK',
      role: 'Bat',
      isForeign: false,
    };
    const result = validateCreatePlayerRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('Name') || e.includes('name') || e.includes('required'))).toBe(true);
  });

  it('should reject request with invalid team', () => {
    const request = {
      name: 'Test Player',
      team: 'TOOLONGCODE',
      role: 'Bat',
      isForeign: false,
    };
    const result = validateCreatePlayerRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('Team'))).toBe(true);
  });
});

describe('validateUpdatePlayerRequest', () => {
  it('should validate a valid update request with all fields', () => {
    const request = {
      name: 'Updated Player',
      team: 'MI',
      role: 'Bowl',
      isForeign: true,
    };
    const result = validateUpdatePlayerRequest(request);
    expect(result.valid).toBe(true);
  });

  it('should validate a partial update request', () => {
    const request = {
      name: 'Updated Player',
    };
    const result = validateUpdatePlayerRequest(request);
    expect(result.valid).toBe(true);
  });

  it('should validate an empty update request', () => {
    const request = {};
    const result = validateUpdatePlayerRequest(request);
    expect(result.valid).toBe(true);
  });

  it('should reject update with name exceeding 100 characters', () => {
    const request = {
      name: 'a'.repeat(101),
    };
    const result = validateUpdatePlayerRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('100'))).toBe(true);
  });

  it('should reject update with empty name', () => {
    const request = {
      name: '',
    };
    const result = validateUpdatePlayerRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('Name') || e.includes('non-empty'))).toBe(true);
  });

  it('should reject update with invalid team', () => {
    const request = {
      team: 'TOOLONGCODE',
    };
    const result = validateUpdatePlayerRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('Team'))).toBe(true);
  });
});

describe('validateDraftConfig', () => {
  it('should validate a valid draft config', () => {
    const config = createDraftConfig();
    const result = validateDraftConfig(config);
    expect(result.valid).toBe(true);
  });

  it('should reject config with invalid roster size', () => {
    const config = createDraftConfig({ rosterSize: 0 });
    const result = validateDraftConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('rosterSize') || e.includes('Roster size') || e.includes('between 1 and 20'))).toBe(true);
  });

  it('should reject config with roster size exceeding 20', () => {
    const config = createDraftConfig({ rosterSize: 21 });
    const result = validateDraftConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('rosterSize') || e.includes('20'))).toBe(true);
  });

  it('should reject config with invalid total rounds', () => {
    const config = createDraftConfig({ totalRounds: 0 });
    const result = validateDraftConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('Total rounds') || e.includes('positive number'))).toBe(true);
  });

  it('should reject config with negative minPerTeam', () => {
    const config = createDraftConfig({ minPerTeam: -1 });
    const result = validateDraftConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('minPerTeam') || e.includes('Min per team') || e.includes('non-negative'))).toBe(true);
  });

  it('should reject config with negative maxPerTeam', () => {
    const config = createDraftConfig({ maxPerTeam: -1 });
    const result = validateDraftConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('maxPerTeam') || e.includes('Max per team') || e.includes('non-negative'))).toBe(true);
  });

  it('should reject config with maxPerTeam less than minPerTeam', () => {
    const config = createDraftConfig({ minPerTeam: 2, maxPerTeam: 1 });
    const result = validateDraftConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('cannot exceed') || e.includes('exceed'))).toBe(true);
  });

  it('should reject config with invalid mandatory roles', () => {
    const config = createDraftConfig({
      mandatoryRoles: { Bat: -1, Bowl: 0, AR: 0, WK: 0 },
    });
    const result = validateDraftConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('mandatoryRoles') || e.includes('Mandatory') || e.includes('Bat') || e.includes('non-negative'))).toBe(true);
  });

  it('should reject config with invalid early round rule', () => {
    const config = createDraftConfig({
      earlyRoundRule: { rounds: -1, minBat: 0, minBowl: 0 },
    });
    const result = validateDraftConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('earlyRoundRule') || e.includes('Early round') || e.includes('rounds') || e.includes('non-negative'))).toBe(true);
  });
});

describe('validateUpdateDraftConfigRequest', () => {
  it('should validate a valid partial update', () => {
    const request = {
      rosterSize: 10,
    };
    const result = validateUpdateDraftConfigRequest(request);
    expect(result.valid).toBe(true);
  });

  it('should validate an empty update request', () => {
    const request = {};
    const result = validateUpdateDraftConfigRequest(request);
    expect(result.valid).toBe(true);
  });

  it('should reject update with invalid roster size', () => {
    const request = {
      rosterSize: 0,
    };
    const result = validateUpdateDraftConfigRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should reject update with maxPerTeam less than minPerTeam', () => {
    const request = {
      minPerTeam: 2,
      maxPerTeam: 1,
    };
    const result = validateUpdateDraftConfigRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('cannot exceed') || e.includes('exceed') || e.includes('maxPerTeam') || e.includes('minPerTeam'))).toBe(true);
  });
});
