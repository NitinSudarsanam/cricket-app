import { describe, it, expect } from 'vitest';
import { buildDraftResultsCsv, buildDraftResultsJson } from '../draft-results-export';
import { createDraftConfig, createPlayer } from '@/__tests__/helpers/mock-factories';

const results = {
  draftState: {
    id: 'draft-1',
    status: 'completed',
    startedAt: null,
    completedAt: null,
    totalRounds: 1,
  },
  draftConfig: createDraftConfig({ id: 'cfg-1' }),
  participantRosters: [
    {
      participantId: 'p1',
      participantName: 'Alice',
      position: 0,
      roster: [createPlayer({ id: 'pl1', name: 'Kohli', team: 'RCB', role: 'Bat', isForeign: false })],
      teamCount: { RCB: 1 },
      roleCount: { Bat: 1, Bowl: 0, AR: 0, WK: 0 },
      mandatoryRoles: { Bat: 1, Bowl: 0, AR: 0, WK: 0 },
      roleValidation: { Bat: true, Bowl: true, AR: true, WK: true },
      allRolesMet: true,
    },
  ],
  allParticipantsMeetRequirements: true,
  totalPicks: 1,
};

describe('draft results export', () => {
  it('builds JSON with a slim roster payload', () => {
    const parsed = JSON.parse(buildDraftResultsJson(results));

    expect(parsed.draftState.id).toBe('draft-1');
    expect(parsed.participantRosters[0].roster[0]).toEqual({
      id: 'pl1',
      name: 'Kohli',
      team: 'RCB',
      role: 'Bat',
      isForeign: false,
    });
  });

  it('builds CSV with one row per drafted player', () => {
    const csv = buildDraftResultsCsv(results);

    expect(csv.split('\n')[0]).toBe('Participant,Position,Player Name,Team,Role,Is Foreign');
    expect(csv).toContain('"Alice","1","Kohli","RCB","Bat","No"');
  });
});
