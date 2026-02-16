/**
 * Unit Tests for Model Mappers
 * 
 * Tests all mapper functions that convert between Prisma models and TypeScript interfaces.
 */

import { describe, it, expect } from 'vitest';
import {
  prismaPlayerToPlayer,
  playerToPrismaPlayer,
  prismaDraftConfigToDraftConfig,
  draftConfigToPrismaDraftConfig,
  prismaPickToPickRecord,
  prismaDraftStateToDraftState,
  participantToFantasyTeam,
  initializeTeamCount,
  initializeRoleCount,
  calculateTeamCounts,
  calculateRoleCounts,
} from '../model-mappers';
import type { PrismaPlayer, PrismaDraftConfig, PrismaParticipant, PrismaDraftState, PrismaPick, DraftOrder } from '@prisma/client';
import { createPlayer, createDraftConfig, createPickRecord, createPlayers } from '@/__tests__/helpers/mock-factories';
import { IPL_TEAMS, PLAYER_ROLES } from '@/types';

describe('prismaPlayerToPlayer', () => {
  it('should convert Prisma player to Player interface', () => {
    const prismaPlayer: PrismaPlayer = {
      id: 'player-1',
      name: 'Test Player',
      team: 'CSK',
      role: 'Bat',
      isForeign: false,
      metadata: null,
      externalId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = prismaPlayerToPlayer(prismaPlayer);
    expect(result.id).toBe('player-1');
    expect(result.name).toBe('Test Player');
    expect(result.team).toBe('CSK');
    expect(result.role).toBe('Bat');
    expect(result.isForeign).toBe(false);
    expect(result.metadata).toBeUndefined();
    expect(result.externalId).toBeUndefined();
  });

  it('should handle metadata correctly', () => {
    const prismaPlayer: PrismaPlayer = {
      id: 'player-1',
      name: 'Test Player',
      team: 'CSK',
      role: 'Bat',
      isForeign: false,
      metadata: { key: 'value' },
      externalId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = prismaPlayerToPlayer(prismaPlayer);
    expect(result.metadata).toEqual({ key: 'value' });
  });

  it('should handle externalId correctly', () => {
    const prismaPlayer: PrismaPlayer = {
      id: 'player-1',
      name: 'Test Player',
      team: 'CSK',
      role: 'Bat',
      isForeign: false,
      metadata: null,
      externalId: 'ext-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = prismaPlayerToPlayer(prismaPlayer);
    expect(result.externalId).toBe('ext-123');
  });
});

describe('playerToPrismaPlayer', () => {
  it('should convert Player interface to Prisma player', () => {
    const player = createPlayer({
      id: 'player-1',
      name: 'Test Player',
      team: 'CSK',
      role: 'Bat',
      isForeign: false,
    });

    const result = playerToPrismaPlayer(player);
    expect(result.id).toBe('player-1');
    expect(result.name).toBe('Test Player');
    expect(result.team).toBe('CSK');
    expect(result.role).toBe('Bat');
    expect(result.isForeign).toBe(false);
    expect(result.metadata).toBeNull();
    expect(result.externalId).toBeNull();
  });

  it('should convert metadata to null if undefined', () => {
    const player = createPlayer({ metadata: undefined });
    const result = playerToPrismaPlayer(player);
    expect(result.metadata).toBeNull();
  });

  it('should preserve metadata if provided', () => {
    const player = createPlayer({ metadata: { key: 'value' } });
    const result = playerToPrismaPlayer(player);
    expect(result.metadata).toEqual({ key: 'value' });
  });
});

describe('prismaDraftConfigToDraftConfig', () => {
  it('should convert Prisma draft config to DraftConfig interface', () => {
    const prismaConfig: PrismaDraftConfig = {
      id: 'config-1',
      rosterSize: 8,
      totalRounds: 8,
      minPerTeam: 0,
      maxPerTeam: 1,
      mandatoryBat: 3,
      mandatoryBowl: 3,
      mandatoryAR: 0,
      mandatoryWK: 0,
      earlyRounds: 4,
      earlyMinBat: 2,
      earlyMinBowl: 2,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = prismaDraftConfigToDraftConfig(prismaConfig);
    expect(result.id).toBe('config-1');
    expect(result.rosterSize).toBe(8);
    expect(result.totalRounds).toBe(8);
    expect(result.mandatoryRoles).toEqual({ Bat: 3, Bowl: 3, AR: 0, WK: 0 });
    expect(result.freeSlots).toBe(2); // 8 - (3+3+0+0) = 2
    expect(result.earlyRoundRule).toEqual({ rounds: 4, minBat: 2, minBowl: 2 });
  });

  it('should calculate freeSlots correctly', () => {
    const prismaConfig: PrismaDraftConfig = {
      id: 'config-1',
      rosterSize: 10,
      totalRounds: 8,
      minPerTeam: 0,
      maxPerTeam: 1,
      mandatoryBat: 2,
      mandatoryBowl: 2,
      mandatoryAR: 1,
      mandatoryWK: 1,
      earlyRounds: 4,
      earlyMinBat: 2,
      earlyMinBowl: 2,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = prismaDraftConfigToDraftConfig(prismaConfig);
    expect(result.freeSlots).toBe(4); // 10 - (2+2+1+1) = 4
  });
});

describe('draftConfigToPrismaDraftConfig', () => {
  it('should convert DraftConfig interface to Prisma draft config', () => {
    const config = createDraftConfig({
      id: 'config-1',
      rosterSize: 8,
      totalRounds: 8,
      mandatoryRoles: { Bat: 3, Bowl: 3, AR: 0, WK: 0 },
      earlyRoundRule: { rounds: 4, minBat: 2, minBowl: 2 },
    });

    const result = draftConfigToPrismaDraftConfig(config);
    expect(result.id).toBe('config-1');
    expect(result.rosterSize).toBe(8);
    expect(result.mandatoryBat).toBe(3);
    expect(result.mandatoryBowl).toBe(3);
    expect(result.mandatoryAR).toBe(0);
    expect(result.mandatoryWK).toBe(0);
    expect(result.earlyRounds).toBe(4);
    expect(result.earlyMinBat).toBe(2);
    expect(result.earlyMinBowl).toBe(2);
    expect(result.isLocked).toBe(false);
  });

  it('should default isLocked to false if undefined', () => {
    const config = createDraftConfig({ isLocked: undefined });
    const result = draftConfigToPrismaDraftConfig(config);
    expect(result.isLocked).toBe(false);
  });
});

describe('prismaPickToPickRecord', () => {
  it('should convert Prisma pick to PickRecord interface', () => {
    const prismaPick: PrismaPick = {
      id: 'pick-1',
      draftStateId: 'state-1',
      participantId: 'participant-1',
      playerId: 'player-1',
      round: 1,
      pickNumber: 1,
      timestamp: new Date(),
    };

    const result = prismaPickToPickRecord(prismaPick);
    expect(result.round).toBe(1);
    expect(result.pickNumber).toBe(1);
    expect(result.participantId).toBe('participant-1');
    expect(result.playerId).toBe('player-1');
    expect(result.timestamp).toBeInstanceOf(Date);
  });
});

describe('prismaDraftStateToDraftState', () => {
  it('should convert Prisma draft state to DraftState interface', () => {
    const prismaState: PrismaDraftState = {
      id: 'state-1',
      currentRound: 1,
      currentPickIndex: 0,
      draftOrderType: 'snake',
      status: 'in_progress',
      startedAt: new Date(),
      completedAt: null,
      draftConfigId: 'config-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const picks: PrismaPick[] = [];
    const draftOrders: DraftOrder[] = [
      { id: 'order-1', draftStateId: 'state-1', participantId: 'p1', position: 0 },
      { id: 'order-2', draftStateId: 'state-1', participantId: 'p2', position: 1 },
    ];

    const result = prismaDraftStateToDraftState(prismaState, picks, draftOrders);
    expect(result.id).toBe('state-1');
    expect(result.currentRound).toBe(1);
    expect(result.currentPickIndex).toBe(0);
    expect(result.participantOrder).toEqual(['p1', 'p2']);
    expect(result.status).toBe('in_progress');
    expect(result.picks).toEqual([]);
  });

  it('should sort draft orders by position', () => {
    const prismaState: PrismaDraftState = {
      id: 'state-1',
      currentRound: 1,
      currentPickIndex: 0,
      draftOrderType: 'snake',
      status: 'in_progress',
      startedAt: new Date(),
      completedAt: null,
      draftConfigId: 'config-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const picks: PrismaPick[] = [];
    const draftOrders: DraftOrder[] = [
      { id: 'order-2', draftStateId: 'state-1', participantId: 'p2', position: 1 },
      { id: 'order-1', draftStateId: 'state-1', participantId: 'p1', position: 0 },
    ];

    const result = prismaDraftStateToDraftState(prismaState, picks, draftOrders);
    expect(result.participantOrder).toEqual(['p1', 'p2']);
  });
});

describe('participantToFantasyTeam', () => {
  it('should convert participant to FantasyTeam interface', () => {
    const participant: PrismaParticipant = {
      id: 'participant-1',
      name: 'Test Team',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const players = createPlayers(3, { team: 'CSK', role: 'Bat' });
    const result = participantToFantasyTeam(participant, players);

    expect(result.id).toBe('participant-1');
    expect(result.name).toBe('Test Team');
    expect(result.email).toBe('test@example.com');
    expect(result.draftedPlayers).toEqual(players);
    expect(result.teamCount.CSK).toBe(3);
    expect(result.roleCount.Bat).toBe(3);
  });

  it('should calculate team counts correctly', () => {
    const participant: PrismaParticipant = {
      id: 'participant-1',
      name: 'Test Team',
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const players = [
      createPlayer({ team: 'CSK' }),
      createPlayer({ team: 'CSK' }),
      createPlayer({ team: 'MI' }),
    ];

    const result = participantToFantasyTeam(participant, players);
    expect(result.teamCount.CSK).toBe(2);
    expect(result.teamCount.MI).toBe(1);
    expect(result.teamCount.GT).toBe(0);
  });

  it('should calculate role counts correctly', () => {
    const participant: PrismaParticipant = {
      id: 'participant-1',
      name: 'Test Team',
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const players = [
      createPlayer({ role: 'Bat' }),
      createPlayer({ role: 'Bat' }),
      createPlayer({ role: 'Bowl' }),
    ];

    const result = participantToFantasyTeam(participant, players);
    expect(result.roleCount.Bat).toBe(2);
    expect(result.roleCount.Bowl).toBe(1);
    expect(result.roleCount.AR).toBe(0);
    expect(result.roleCount.WK).toBe(0);
  });

  it('should handle null email', () => {
    const participant: PrismaParticipant = {
      id: 'participant-1',
      name: 'Test Team',
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = participantToFantasyTeam(participant, []);
    expect(result.email).toBeUndefined();
  });
});

describe('initializeTeamCount', () => {
  it('should initialize all teams to zero', () => {
    const result = initializeTeamCount();
    IPL_TEAMS.forEach((team) => {
      expect(result[team]).toBe(0);
    });
  });
});

describe('initializeRoleCount', () => {
  it('should initialize all roles to zero', () => {
    const result = initializeRoleCount();
    PLAYER_ROLES.forEach((role) => {
      expect(result[role]).toBe(0);
    });
  });
});

describe('calculateTeamCounts', () => {
  it('should calculate team counts from players', () => {
    const players = [
      createPlayer({ team: 'CSK' }),
      createPlayer({ team: 'CSK' }),
      createPlayer({ team: 'MI' }),
    ];

    const result = calculateTeamCounts(players);
    expect(result.CSK).toBe(2);
    expect(result.MI).toBe(1);
    expect(result.GT).toBe(0);
  });
});

describe('calculateRoleCounts', () => {
  it('should calculate role counts from players', () => {
    const players = [
      createPlayer({ role: 'Bat' }),
      createPlayer({ role: 'Bat' }),
      createPlayer({ role: 'Bowl' }),
    ];

    const result = calculateRoleCounts(players);
    expect(result.Bat).toBe(2);
    expect(result.Bowl).toBe(1);
    expect(result.AR).toBe(0);
    expect(result.WK).toBe(0);
  });
});
