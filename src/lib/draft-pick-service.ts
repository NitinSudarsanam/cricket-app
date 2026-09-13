/**
 * Shared pick commit + server-side auto-pick when the turn clock expires.
 */

import { prisma } from '@/lib/db';
import { prismaDraftConfigToDraftConfig, prismaPlayerToPlayer } from '@/lib/model-mappers';
import { getEligiblePlayers } from '@/lib/rule-engine';
import {
  calculatePickNumber,
  getActiveDraftState,
  getCurrentParticipantId,
  getDraftState,
  type DraftOrderType,
} from '@/lib/draft-state-manager';
import { broadcastEvent, EVENTS } from '@/lib/pusher-server';
import type { DraftConfig, DraftState, Player } from '@/types';
import {
  DEFAULT_PICK_TIMEOUT_SECONDS,
  isTurnExpired,
  isUniqueConstraintError,
} from '@/lib/draft-clock';

export {
  DEFAULT_PICK_TIMEOUT_SECONDS,
  isTurnExpired,
  secondsRemainingOnClock,
} from '@/lib/draft-clock';

export interface CommitPickResult {
  draftState: DraftState;
  pick: {
    participantId: string;
    participantName: string | undefined;
    playerId: string;
    playerName: string;
    playerTeam: string;
    playerRole: string;
    round: number;
    pickNumber: number;
    timestamp: Date;
    autoPick: boolean;
  };
  previousRound: number;
}

export async function commitPick(options: {
  draftState: DraftState;
  draftConfig: DraftConfig;
  participantId: string;
  player: Player;
  autoPick?: boolean;
  skipClockCheck?: boolean;
}): Promise<CommitPickResult> {
  const { draftState, draftConfig, participantId, player } = options;
  const autoPick = Boolean(options.autoPick);
  let committedRound = draftState.currentRound;
  let committedPickNumber = calculatePickNumber(
    draftState.currentRound,
    draftState.currentPickIndex,
    draftState.participantOrder.length
  );

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT 1 FROM "DraftState" WHERE id = ${draftState.id} FOR UPDATE`;
    const locked = await tx.draftState.findUnique({
      where: { id: draftState.id },
      include: {
        draftOrders: { orderBy: { position: 'asc' } },
        picks: true,
      },
    });
    if (!locked) throw new Error('Draft state not found');
    if (locked.status !== 'in_progress') {
      throw new Error('CONFLICT: Draft is not in progress');
    }
    if (autoPick && !options.skipClockCheck) {
      const timeout = draftConfig.pickTimeoutSeconds ?? DEFAULT_PICK_TIMEOUT_SECONDS;
      if (!isTurnExpired(locked.turnStartedAt, timeout, new Date(), locked.startedAt)) {
        throw new Error('CONFLICT: Pick clock has not expired');
      }
    }
    const orderType = locked.draftOrderType === 'linear' ? 'linear' : 'snake';
    const participantOrder = locked.draftOrders.map((o) => o.participantId);
    const currentForTurn = getCurrentParticipantId(
      {
        currentRound: locked.currentRound,
        currentPickIndex: locked.currentPickIndex,
        participantOrder,
      },
      orderType
    );
    if (currentForTurn !== participantId) {
      throw new Error('CONFLICT: It is not your turn (another pick may have been made)');
    }
    const alreadyPicked = locked.picks.some((p) => p.playerId === player.id);
    if (alreadyPicked) {
      throw new Error('CONFLICT: Player already drafted');
    }
    committedRound = locked.currentRound;
    committedPickNumber = calculatePickNumber(
      locked.currentRound,
      locked.currentPickIndex,
      participantOrder.length
    );
    try {
      await tx.pick.create({
        data: {
          draftStateId: draftState.id,
          participantId,
          playerId: player.id,
          round: committedRound,
          pickNumber: committedPickNumber,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error('CONFLICT: Pick already recorded');
      }
      throw error;
    }
    let nextRound = locked.currentRound;
    let nextIndex = locked.currentPickIndex + 1;
    if (nextIndex >= participantOrder.length) {
      nextRound++;
      nextIndex = 0;
    }
    const isComplete = nextRound > draftConfig.totalRounds;
    await tx.draftState.update({
      where: { id: draftState.id },
      data: {
        currentRound: isComplete ? draftConfig.totalRounds : nextRound,
        currentPickIndex: isComplete ? participantOrder.length - 1 : nextIndex,
        status: isComplete ? 'completed' : 'in_progress',
        completedAt: isComplete ? new Date() : null,
        turnStartedAt: isComplete ? null : new Date(),
      },
    });
  });

  const updatedState = await getDraftState(draftState.id);
  if (!updatedState) {
    throw new Error('Failed to load draft state after pick');
  }

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });

  const pickData = {
    participantId,
    participantName: participant?.name,
    playerId: player.id,
    playerName: player.name,
    playerTeam: player.team,
    playerRole: player.role,
    round: committedRound,
    pickNumber: committedPickNumber,
    timestamp: new Date(),
    autoPick,
  };

  await broadcastEvent(
    EVENTS.PICK_MADE,
    {
      pick: pickData,
      draftState: updatedState,
    },
    draftState.id
  );

  if (updatedState.currentRound > draftState.currentRound) {
    await broadcastEvent(
      EVENTS.ROUND_COMPLETE,
      {
        completedRound: draftState.currentRound,
        draftState: updatedState,
      },
      draftState.id
    );
  }

  if (updatedState.status === 'completed') {
    await broadcastEvent(
      EVENTS.DRAFT_COMPLETE,
      {
        draftState: updatedState,
        completedAt: new Date(),
      },
      draftState.id
    );
  }

  return {
    draftState: updatedState,
    pick: pickData,
    previousRound: draftState.currentRound,
  };
}

async function loadDraftConfig(draftConfigId: string): Promise<DraftConfig | null> {
  const row = await prisma.draftConfig.findUnique({ where: { id: draftConfigId } });
  return row ? prismaDraftConfigToDraftConfig(row) : null;
}

export async function resolveLatestFantasySeasonId(): Promise<string | undefined> {
  const latestStat = await prisma.playerMatchStat.findFirst({
    where: { seasonId: { not: '' } },
    orderBy: { updatedAt: 'desc' },
    select: { seasonId: true },
  });
  return latestStat?.seasonId ?? undefined;
}

export function rankAutoPickCandidates(
  available: Player[],
  eligibleIds: Set<string>,
  scoreByPlayer: Map<string, number>
): Player[] {
  const byScoreThenName = (a: Player, b: Player) => {
    const scoreDiff = (scoreByPlayer.get(b.id) ?? 0) - (scoreByPlayer.get(a.id) ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return a.name.localeCompare(b.name);
  };

  const eligible = available.filter((player) => eligibleIds.has(player.id)).sort(byScoreThenName);
  if (eligible.length > 0) return eligible;

  // If constraints leave nobody eligible, still advance the clock with leftovers.
  return [...available].sort(byScoreThenName);
}

export async function chooseAutoPickPlayer(
  draftState: DraftState,
  draftConfig: DraftConfig,
  participantId: string,
  options?: { draftedPlayerIds?: string[] }
): Promise<Player | null> {
  const candidates = await listAutoPickCandidates(draftState, draftConfig, participantId, options);
  return candidates[0] ?? null;
}

export async function listAutoPickCandidates(
  draftState: DraftState,
  draftConfig: DraftConfig,
  participantId: string,
  options?: { draftedPlayerIds?: string[] }
): Promise<Player[]> {
  const seasonId = await resolveLatestFantasySeasonId();
  const [allPlayers, participantPicks, scores] = await Promise.all([
    prisma.player.findMany(),
    prisma.pick.findMany({
      where: { draftStateId: draftState.id, participantId },
      include: { player: true },
    }),
    seasonId
      ? prisma.playerScore.findMany({
          where: { source: 'fantasy', seasonId },
          select: { playerId: true, points: true },
        })
      : Promise.resolve([]),
  ]);

  const draftedPlayerIds = options?.draftedPlayerIds ?? draftState.picks.map((pick) => pick.playerId);
  const roster = participantPicks.map((pick) => prismaPlayerToPlayer(pick.player));
  const available = allPlayers
    .filter((player) => !draftedPlayerIds.includes(player.id))
    .map(prismaPlayerToPlayer);
  const eligibleIds = getEligiblePlayers(
    available,
    roster,
    draftState.currentRound,
    draftConfig,
    draftedPlayerIds
  );

  const scoreByPlayer = new Map<string, number>();
  for (const score of scores) {
    scoreByPlayer.set(score.playerId, Math.max(scoreByPlayer.get(score.playerId) ?? 0, score.points));
  }

  return rankAutoPickCandidates(available, eligibleIds, scoreByPlayer);
}

export async function applyExpiredAutoPick(options?: {
  draftStateId?: string;
  force?: boolean;
}): Promise<CommitPickResult | null> {
  let draftState = options?.draftStateId
    ? await getDraftState(options.draftStateId)
    : await getActiveDraftState();

  if (!draftState || draftState.status !== 'in_progress' || !draftState.draftConfigId) {
    return null;
  }

  const draftConfig = await loadDraftConfig(draftState.draftConfigId);
  if (!draftConfig) return null;

  const timeout = draftConfig.pickTimeoutSeconds ?? DEFAULT_PICK_TIMEOUT_SECONDS;
  if (
    !options?.force &&
    !isTurnExpired(draftState.turnStartedAt, timeout, new Date(), draftState.startedAt)
  ) {
    return null;
  }

  const orderType: DraftOrderType = draftState.draftOrderType === 'linear' ? 'linear' : 'snake';
  const excludePlayerIds = new Set<string>();

  for (let attempt = 0; attempt < 8; attempt++) {
    const freshState = await getDraftState(draftState.id);
    if (!freshState || freshState.status !== 'in_progress') return null;
    draftState = freshState;

    if (
      !options?.force &&
      !isTurnExpired(draftState.turnStartedAt, timeout, new Date(), draftState.startedAt)
    ) {
      return null;
    }

    const participantId = getCurrentParticipantId(draftState, orderType);
    if (!participantId) return null;

    const draftedPlayerIds = [
      ...draftState.picks.map((pick) => pick.playerId),
      ...excludePlayerIds,
    ];
    const player = await chooseAutoPickPlayer(draftState, draftConfig, participantId, {
      draftedPlayerIds,
    });
    if (!player) return null;

    try {
      return await commitPick({
        draftState,
        draftConfig,
        participantId,
        player,
        autoPick: true,
        skipClockCheck: Boolean(options?.force),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'CONFLICT: Player already drafted' || message === 'CONFLICT: Pick already recorded') {
        excludePlayerIds.add(player.id);
        continue;
      }
      if (
        message.startsWith('CONFLICT: It is not your turn') ||
        message === 'CONFLICT: Pick clock has not expired'
      ) {
        continue;
      }
      throw error;
    }
  }

  return null;
}
