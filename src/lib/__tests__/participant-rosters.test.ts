import { describe, it, expect } from 'vitest';
import { buildParticipantRosters } from '@/lib/participant-rosters';
import { createDraftState, createPlayer } from '@/__tests__/helpers/mock-factories';

describe('buildParticipantRosters', () => {
  const alice = { id: 'p1', name: 'Alice', email: 'a@example.com' };
  const bob = { id: 'p2', name: 'Bob' };
  const kohli = createPlayer({ id: 'pl1', name: 'Kohli', team: 'RCB', role: 'Bat' });
  const bumrah = createPlayer({ id: 'pl2', name: 'Bumrah', team: 'MI', role: 'Bowl' });

  it('returns empty rosters when there is no draft', () => {
    const result = buildParticipantRosters([alice, bob], null, [kohli, bumrah]);
    expect(result).toEqual([
      { id: 'p1', name: 'Alice', email: 'a@example.com', roster: [], teamCount: {}, roleCount: {} },
      { id: 'p2', name: 'Bob', email: undefined, roster: [], teamCount: {}, roleCount: {} },
    ]);
  });

  it('assigns players from picks and counts teams and roles', () => {
    const draftState = createDraftState({
      picks: [
        { round: 1, pickNumber: 1, participantId: 'p1', playerId: 'pl1', timestamp: new Date() },
        { round: 1, pickNumber: 2, participantId: 'p2', playerId: 'pl2', timestamp: new Date() },
      ],
    });

    const result = buildParticipantRosters([alice, bob], draftState, [kohli, bumrah]);

    expect(result[0].roster).toEqual([kohli]);
    expect(result[0].teamCount).toEqual({ RCB: 1 });
    expect(result[0].roleCount).toEqual({ Bat: 1 });
    expect(result[1].roster).toEqual([bumrah]);
    expect(result[1].teamCount).toEqual({ MI: 1 });
    expect(result[1].roleCount).toEqual({ Bowl: 1 });
  });

  it('skips picks whose player is missing from the pool', () => {
    const draftState = createDraftState({
      picks: [{ round: 1, pickNumber: 1, participantId: 'p1', playerId: 'missing', timestamp: new Date() }],
    });

    const result = buildParticipantRosters([alice], draftState, [kohli]);
    expect(result[0].roster).toEqual([]);
  });
});
