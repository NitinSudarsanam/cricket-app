/**
 * Mock Factory Functions for Test Data
 * 
 * Centralized factories that produce valid default objects with override capability.
 * Use these factories to create test data consistently across all tests.
 */

import { randomUUID } from 'crypto';
import type {
  Player,
  DraftConfig,
  DraftState,
  PickRecord,
  MandatoryRoles,
  EarlyRoundRule,
  IPLTeam,
  PlayerRole,
  DraftStatus,
} from '@/types';

const IPL_TEAMS: IPLTeam[] = ['CSK', 'MI', 'GT', 'RR', 'RCB', 'KKR', 'LSG', 'SRH', 'PBKS', 'DC'];
const PLAYER_ROLES: PlayerRole[] = ['Bat', 'Bowl', 'AR', 'WK'];

/**
 * Create a mock Player with sensible defaults
 */
export function createPlayer(overrides?: Partial<Player>): Player {
  return {
    id: randomUUID(),
    name: 'Test Player',
    team: 'CSK',
    role: 'Bat',
    isForeign: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create multiple mock players
 */
export function createPlayers(count: number, overrides?: Partial<Player>): Player[] {
  return Array.from({ length: count }, (_, i) =>
    createPlayer({
      name: `Player ${i + 1}`,
      team: IPL_TEAMS[i % IPL_TEAMS.length],
      role: PLAYER_ROLES[i % PLAYER_ROLES.length],
      isForeign: i % 3 === 0,
      ...overrides,
    })
  );
}

/**
 * Create a mock DraftConfig with sensible defaults
 */
export function createDraftConfig(overrides?: Partial<DraftConfig>): DraftConfig {
  const mandatoryRoles: MandatoryRoles = {
    Bat: 3,
    Bowl: 3,
    AR: 0,
    WK: 0,
  };

  const earlyRoundRule: EarlyRoundRule = {
    rounds: 4,
    minBat: 2,
    minBowl: 2,
  };

  return {
    id: randomUUID(),
    rosterSize: 8,
    totalRounds: 8,
    minPerTeam: 0,
    maxPerTeam: 1,
    mandatoryRoles,
    freeSlots: 2,
    earlyRoundRule,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock DraftState with sensible defaults
 */
export function createDraftState(overrides?: Partial<DraftState>): DraftState {
  const participantIds = overrides?.participantOrder || [
    randomUUID(),
    randomUUID(),
    randomUUID(),
  ];

  return {
    id: randomUUID(),
    currentRound: 1,
    currentPickIndex: 0,
    picks: [],
    participantOrder: participantIds,
    draftOrderType: 'snake',
    status: 'in_progress',
    draftConfigId: randomUUID(),
    startedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock PickRecord
 */
export function createPickRecord(overrides?: Partial<PickRecord>): PickRecord {
  return {
    round: 1,
    pickNumber: 1,
    participantId: randomUUID(),
    playerId: randomUUID(),
    timestamp: new Date(),
    ...overrides,
  };
}

/**
 * Create multiple mock PickRecords
 */
export function createPickRecords(
  count: number,
  participantIds: string[],
  playerIds: string[],
  startRound: number = 1
): PickRecord[] {
  const picks: PickRecord[] = [];
  let pickNumber = 1;

  for (let round = startRound; round <= startRound + Math.floor((count - 1) / participantIds.length); round++) {
    const isSnakeRound = round % 2 === 0;
    const order = isSnakeRound ? [...participantIds].reverse() : participantIds;

    for (const participantId of order) {
      if (picks.length >= count) break;
      picks.push(
        createPickRecord({
          round,
          pickNumber: pickNumber++,
          participantId,
          playerId: playerIds[picks.length % playerIds.length],
        })
      );
    }
  }

  return picks;
}

/**
 * Create a mock participant (for use in Prisma mocks)
 */
export function createParticipant(overrides?: Partial<{ id: string; name: string; email?: string }>) {
  return {
    id: randomUUID(),
    name: 'Test Participant',
    email: 'test@example.com',
    ...overrides,
  };
}
