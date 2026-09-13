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
});
