import { describe, expect, it } from 'vitest';
import { resolveTeamCode, sportmonksTeamCodeToIPL } from '../sportmonks/team-code-map';

describe('resolveTeamCode', () => {
  it('maps known IPL names and codes', () => {
    expect(resolveTeamCode('CSK')).toBe('CSK');
    expect(resolveTeamCode(undefined, 'Mumbai Indians')).toBe('MI');
    expect(sportmonksTeamCodeToIPL('RCB')).toBe('RCB');
  });

  it('keeps non-IPL short codes so other seasons can draft', () => {
    expect(resolveTeamCode('AUS')).toBe('AUS');
    expect(resolveTeamCode(undefined, 'Birmingham Phoenix')).toBe('BP');
    expect(sportmonksTeamCodeToIPL('AUS')).toBeNull();
  });

  it('abbreviates a single-word team name to 2-8 characters', () => {
    expect(resolveTeamCode(undefined, 'India')).toBe('IND');
    expect(resolveTeamCode('X')).toBe('XX');
  });

  it('aliases INDIA to IND', () => {
    expect(resolveTeamCode('INDIA')).toBe('IND');
    expect(resolveTeamCode(undefined, 'INDIA')).toBe('IND');
  });
});
