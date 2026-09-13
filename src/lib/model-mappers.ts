/**
 * Model Mappers for Fantasy Cricket Draft System
 * 
 * These functions convert between Prisma models and TypeScript interfaces,
 * handling data transformation and computed fields.
 */

import {
  Player as PrismaPlayer,
  DraftConfig as PrismaDraftConfig,
  Participant as PrismaParticipant,
  DraftState as PrismaDraftState,
  Pick as PrismaPick,
  DraftOrder,
} from '@prisma/client';

import {
  Player,
  DraftConfig,
  FantasyTeam,
  DraftState,
  PickRecord,
  MandatoryRoles,
  EarlyRoundRule,
  IPLTeam,
  PlayerRole,
  DraftStatus,
  IPL_TEAMS,
  PLAYER_ROLES,
} from '@/types';

// ============================================================================
// Player Mappers
// ============================================================================

export function prismaPlayerToPlayer(prismaPlayer: PrismaPlayer): Player {
  return {
    id: prismaPlayer.id,
    name: prismaPlayer.name,
    team: prismaPlayer.team as IPLTeam,
    role: prismaPlayer.role as PlayerRole,
    isForeign: prismaPlayer.isForeign,
    metadata: prismaPlayer.metadata ? (prismaPlayer.metadata as Record<string, any>) : undefined,
    externalId: prismaPlayer.externalId ?? undefined,
    createdAt: prismaPlayer.createdAt,
    updatedAt: prismaPlayer.updatedAt,
  };
}

export function playerToPrismaPlayer(player: Player): Omit<PrismaPlayer, 'createdAt' | 'updatedAt'> {
  return {
    id: player.id,
    name: player.name,
    team: player.team,
    role: player.role,
    isForeign: player.isForeign,
    metadata: player.metadata || null,
    externalId: player.externalId ?? null,
  };
}

// ============================================================================
// DraftConfig Mappers
// ============================================================================

export function prismaDraftConfigToDraftConfig(prismaConfig: PrismaDraftConfig): DraftConfig {
  const mandatoryRoles: MandatoryRoles = {
    Bat: prismaConfig.mandatoryBat,
    Bowl: prismaConfig.mandatoryBowl,
    AR: prismaConfig.mandatoryAR,
    WK: prismaConfig.mandatoryWK,
  };

  const earlyRoundRule: EarlyRoundRule = {
    rounds: prismaConfig.earlyRounds,
    minBat: prismaConfig.earlyMinBat,
    minBowl: prismaConfig.earlyMinBowl,
  };

  const mandatoryTotal = mandatoryRoles.Bat + mandatoryRoles.Bowl + mandatoryRoles.AR + mandatoryRoles.WK;
  const freeSlots = prismaConfig.rosterSize - mandatoryTotal;

  return {
    id: prismaConfig.id,
    rosterSize: prismaConfig.rosterSize,
    totalRounds: prismaConfig.totalRounds,
    minPerTeam: prismaConfig.minPerTeam,
    maxPerTeam: prismaConfig.maxPerTeam,
    mandatoryRoles,
    freeSlots,
    earlyRoundRule,
    isLocked: prismaConfig.isLocked,
    pickTimeoutSeconds: prismaConfig.pickTimeoutSeconds ?? 60,
    createdAt: prismaConfig.createdAt,
    updatedAt: prismaConfig.updatedAt,
  };
}

export function draftConfigToPrismaDraftConfig(
  config: DraftConfig
): Omit<PrismaDraftConfig, 'createdAt' | 'updatedAt'> {
  return {
    id: config.id,
    rosterSize: config.rosterSize,
    totalRounds: config.totalRounds,
    minPerTeam: config.minPerTeam,
    maxPerTeam: config.maxPerTeam,
    mandatoryBat: config.mandatoryRoles.Bat,
    mandatoryBowl: config.mandatoryRoles.Bowl,
    mandatoryAR: config.mandatoryRoles.AR,
    mandatoryWK: config.mandatoryRoles.WK,
    earlyRounds: config.earlyRoundRule.rounds,
    earlyMinBat: config.earlyRoundRule.minBat,
    earlyMinBowl: config.earlyRoundRule.minBowl,
    isLocked: config.isLocked || false,
    pickTimeoutSeconds: config.pickTimeoutSeconds ?? 60,
  };
}

// ============================================================================
// Pick Mappers
// ============================================================================

export function prismaPickToPickRecord(prismaPick: PrismaPick): PickRecord {
  return {
    round: prismaPick.round,
    pickNumber: prismaPick.pickNumber,
    participantId: prismaPick.participantId,
    playerId: prismaPick.playerId,
    timestamp: prismaPick.timestamp,
  };
}

// ============================================================================
// DraftState Mappers
// ============================================================================

export function prismaDraftStateToDraftState(
  prismaState: PrismaDraftState,
  picks: PrismaPick[],
  draftOrders: DraftOrder[]
): DraftState {
  const pickRecords = picks.map(prismaPickToPickRecord);
  
  // Sort draft orders by position to get participant order
  const participantOrder = draftOrders
    .sort((a, b) => a.position - b.position)
    .map((order) => order.participantId);

  return {
    id: prismaState.id,
    currentRound: prismaState.currentRound,
    currentPickIndex: prismaState.currentPickIndex,
    picks: pickRecords,
    participantOrder,
    draftOrderType: prismaState.draftOrderType === 'linear' ? 'linear' : 'snake',
    status: prismaState.status as DraftStatus,
    startedAt: prismaState.startedAt || undefined,
    completedAt: prismaState.completedAt || undefined,
    turnStartedAt: prismaState.turnStartedAt ?? null,
    draftConfigId: prismaState.draftConfigId,
    createdAt: prismaState.createdAt,
    updatedAt: prismaState.updatedAt,
  };
}

// ============================================================================
// FantasyTeam Mappers
// ============================================================================

export function participantToFantasyTeam(
  participant: PrismaParticipant,
  draftedPlayers: Player[]
): FantasyTeam {
  // Calculate team counts
  const teamCount: Record<IPLTeam, number> = {} as Record<IPLTeam, number>;
  IPL_TEAMS.forEach((team) => {
    teamCount[team] = 0;
  });
  draftedPlayers.forEach((player) => {
    teamCount[player.team]++;
  });

  // Calculate role counts
  const roleCount: Record<PlayerRole, number> = {} as Record<PlayerRole, number>;
  PLAYER_ROLES.forEach((role) => {
    roleCount[role] = 0;
  });
  draftedPlayers.forEach((player) => {
    roleCount[player.role]++;
  });

  return {
    id: participant.id,
    name: participant.name,
    email: participant.email || undefined,
    draftedPlayers,
    teamCount,
    roleCount,
    createdAt: participant.createdAt,
    updatedAt: participant.updatedAt,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Initialize empty team count object
 */
export function initializeTeamCount(): Record<IPLTeam, number> {
  const teamCount: Record<IPLTeam, number> = {} as Record<IPLTeam, number>;
  IPL_TEAMS.forEach((team) => {
    teamCount[team] = 0;
  });
  return teamCount;
}

/**
 * Initialize empty role count object
 */
export function initializeRoleCount(): Record<PlayerRole, number> {
  const roleCount: Record<PlayerRole, number> = {} as Record<PlayerRole, number>;
  PLAYER_ROLES.forEach((role) => {
    roleCount[role] = 0;
  });
  return roleCount;
}

/**
 * Calculate team counts from a list of players
 */
export function calculateTeamCounts(players: Player[]): Record<IPLTeam, number> {
  const teamCount = initializeTeamCount();
  players.forEach((player) => {
    teamCount[player.team]++;
  });
  return teamCount;
}

/**
 * Calculate role counts from a list of players
 */
export function calculateRoleCounts(players: Player[]): Record<PlayerRole, number> {
  const roleCount = initializeRoleCount();
  players.forEach((player) => {
    roleCount[player.role]++;
  });
  return roleCount;
}
