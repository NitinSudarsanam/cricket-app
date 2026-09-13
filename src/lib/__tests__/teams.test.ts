import { describe, expect, it } from 'vitest';
import { teamsForBoard, uniqueTeamCodes } from '../teams';

describe('teamsForBoard', () => {
  it('keeps the IPL columns when the pool is IPL-only', () => {
    const teams = teamsForBoard([{ team: 'CSK' }, { team: 'MI' }]);
    expect(teams).toContain('CSK');
    expect(teams).toContain('GT');
    expect(teams).toHaveLength(10);
  });

  it('does not inject empty IPL columns for a non-IPL pool', () => {
    expect(teamsForBoard([{ team: 'AUS' }, { team: 'ENG' }])).toEqual(['AUS', 'ENG']);
  });
});

describe('uniqueTeamCodes', () => {
  it('does not prepend IPL codes unless asked', () => {
    expect(uniqueTeamCodes([{ team: 'BP' }])).toEqual(['BP']);
  });
});
