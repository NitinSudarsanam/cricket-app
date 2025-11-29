/**
 * Draft State Manager Service
 * 
 * This service manages the draft state including:
 * - Initializing draft state with participant order
 * - Tracking current round and pick index
 * - Managing pick history
 * - Advancing to next pick
 * - Determining draft completion
 * 
 * Requirements: 4.2, 4.5
 */

import { prisma } from './db';
import { DraftState, PickRecord } from '@/types';

export type DraftOrderType = 'linear' | 'snake';

/**
 * Initialize a new draft state with participant order
 * 
 * @param draftConfigId - The ID of the draft configuration
 * @param participantIds - Array of participant IDs in draft order
 * @param orderType - Type of draft order ('linear' or 'snake')
 * @returns The created draft state
 */
export async function initializeDraftState(
  draftConfigId: string,
  participantIds: string[],
  orderType: DraftOrderType = 'snake'
): Promise<DraftState> {
  // Create the draft state
  const draftState = await prisma.draftState.create({
    data: {
      currentRound: 1,
      currentPickIndex: 0,
      status: 'in_progress',
      startedAt: new Date(),
      draftConfigId,
      draftOrders: {
        create: participantIds.map((participantId, index) => ({
          participantId,
          position: index
        }))
      }
    },
    include: {
      draftOrders: {
        include: {
          participant: true
        },
        orderBy: {
          position: 'asc'
        }
      },
      picks: {
        include: {
          player: true,
          participant: true
        },
        orderBy: {
          pickNumber: 'asc'
        }
      }
    }
  });

  // Transform to DraftState interface
  return transformToDraftState(draftState);
}

/**
 * Get the current draft state
 * 
 * @param draftStateId - The ID of the draft state
 * @returns The current draft state or null if not found
 */
export async function getDraftState(draftStateId: string): Promise<DraftState | null> {
  const draftState = await prisma.draftState.findUnique({
    where: { id: draftStateId },
    include: {
      draftOrders: {
        include: {
          participant: true
        },
        orderBy: {
          position: 'asc'
        }
      },
      picks: {
        include: {
          player: true,
          participant: true
        },
        orderBy: {
          pickNumber: 'asc'
        }
      }
    }
  });

  if (!draftState) {
    return null;
  }

  return transformToDraftState(draftState);
}

/**
 * Get the active draft state (most recent in_progress or paused draft)
 * 
 * @returns The active draft state or null if none exists
 */
export async function getActiveDraftState(): Promise<DraftState | null> {
  const draftState = await prisma.draftState.findFirst({
    where: {
      status: {
        in: ['in_progress', 'paused']
      }
    },
    orderBy: {
      startedAt: 'desc'
    },
    include: {
      draftOrders: {
        include: {
          participant: true
        },
        orderBy: {
          position: 'asc'
        }
      },
      picks: {
        include: {
          player: true,
          participant: true
        },
        orderBy: {
          pickNumber: 'asc'
        }
      }
    }
  });

  if (!draftState) {
    return null;
  }

  return transformToDraftState(draftState);
}

/**
 * Add a pick to the draft state
 * 
 * @param draftStateId - The ID of the draft state
 * @param participantId - The ID of the participant making the pick
 * @param playerId - The ID of the player being picked
 * @param round - The current round number
 * @param pickNumber - The overall pick number
 * @returns The updated draft state
 */
export async function addPick(
  draftStateId: string,
  participantId: string,
  playerId: string,
  round: number,
  pickNumber: number
): Promise<DraftState> {
  // Create the pick
  await prisma.pick.create({
    data: {
      draftStateId,
      participantId,
      playerId,
      round,
      pickNumber,
      timestamp: new Date()
    }
  });

  // Get the updated draft state
  const updatedState = await getDraftState(draftStateId);
  
  if (!updatedState) {
    throw new Error('Draft state not found after adding pick');
  }

  return updatedState;
}

/**
 * Advance to the next pick in the draft
 * 
 * @param draftStateId - The ID of the draft state
 * @param totalRounds - The total number of rounds in the draft
 * @param participantCount - The number of participants
 * @param orderType - Type of draft order ('linear' or 'snake')
 * @returns The updated draft state
 */
export async function advanceToNextPick(
  draftStateId: string,
  totalRounds: number,
  participantCount: number,
  orderType: DraftOrderType = 'snake'
): Promise<DraftState> {
  const currentState = await getDraftState(draftStateId);
  
  if (!currentState) {
    throw new Error('Draft state not found');
  }

  let { currentRound, currentPickIndex } = currentState;

  // Determine if we're in a snake round (even rounds go in reverse)
  const isSnakeRound = orderType === 'snake' && currentRound % 2 === 0;

  // Advance the pick index
  if (isSnakeRound) {
    currentPickIndex--;
    
    // If we've reached the beginning, move to next round
    if (currentPickIndex < 0) {
      currentRound++;
      currentPickIndex = 0; // Next round starts at beginning (odd round)
    }
  } else {
    currentPickIndex++;
    
    // If we've reached the end, move to next round
    if (currentPickIndex >= participantCount) {
      currentRound++;
      
      // If next round is a snake round, start at the end
      if (orderType === 'snake' && currentRound % 2 === 0) {
        currentPickIndex = participantCount - 1;
      } else {
        currentPickIndex = 0;
      }
    }
  }

  // Check if draft is complete
  const isComplete = currentRound > totalRounds;
  const status = isComplete ? 'completed' : currentState.status;
  const completedAt = isComplete ? new Date() : null;

  // Update the draft state
  await prisma.draftState.update({
    where: { id: draftStateId },
    data: {
      currentRound: isComplete ? totalRounds : currentRound,
      currentPickIndex: isComplete ? participantCount - 1 : currentPickIndex,
      status,
      completedAt
    }
  });

  // Get the updated state
  const updatedState = await getDraftState(draftStateId);
  
  if (!updatedState) {
    throw new Error('Draft state not found after advancing pick');
  }

  return updatedState;
}

/**
 * Get the participant ID for the current pick
 * 
 * @param draftState - The current draft state
 * @param orderType - Type of draft order ('linear' or 'snake')
 * @returns The participant ID who should pick next
 */
export function getCurrentParticipantId(
  draftState: DraftState,
  orderType: DraftOrderType = 'snake'
): string {
  const { currentRound, currentPickIndex, participantOrder } = draftState;

  // Determine if we're in a snake round (even rounds go in reverse)
  const isSnakeRound = orderType === 'snake' && currentRound % 2 === 0;

  if (isSnakeRound) {
    // In snake rounds, reverse the order
    const reverseIndex = participantOrder.length - 1 - currentPickIndex;
    return participantOrder[reverseIndex];
  } else {
    // In linear rounds, use normal order
    return participantOrder[currentPickIndex];
  }
}

/**
 * Calculate the overall pick number
 * 
 * @param round - The current round number
 * @param pickIndex - The pick index within the round
 * @param participantCount - The number of participants
 * @returns The overall pick number
 */
export function calculatePickNumber(
  round: number,
  pickIndex: number,
  participantCount: number
): number {
  return (round - 1) * participantCount + pickIndex + 1;
}

/**
 * Reset the draft state
 * 
 * @param draftStateId - The ID of the draft state to reset
 * @returns The reset draft state
 */
export async function resetDraftState(draftStateId: string): Promise<DraftState> {
  // Delete all picks for this draft
  await prisma.pick.deleteMany({
    where: { draftStateId }
  });

  // Reset the draft state
  await prisma.draftState.update({
    where: { id: draftStateId },
    data: {
      currentRound: 1,
      currentPickIndex: 0,
      status: 'not_started',
      startedAt: null,
      completedAt: null
    }
  });

  // Get the reset state
  const resetState = await getDraftState(draftStateId);
  
  if (!resetState) {
    throw new Error('Draft state not found after reset');
  }

  return resetState;
}

/**
 * Pause the draft
 * 
 * @param draftStateId - The ID of the draft state to pause
 * @returns The paused draft state
 */
export async function pauseDraftState(draftStateId: string): Promise<DraftState> {
  await prisma.draftState.update({
    where: { id: draftStateId },
    data: {
      status: 'paused'
    }
  });

  const pausedState = await getDraftState(draftStateId);
  
  if (!pausedState) {
    throw new Error('Draft state not found after pause');
  }

  return pausedState;
}

/**
 * Resume the draft
 * 
 * @param draftStateId - The ID of the draft state to resume
 * @returns The resumed draft state
 */
export async function resumeDraftState(draftStateId: string): Promise<DraftState> {
  await prisma.draftState.update({
    where: { id: draftStateId },
    data: {
      status: 'in_progress'
    }
  });

  const resumedState = await getDraftState(draftStateId);
  
  if (!resumedState) {
    throw new Error('Draft state not found after resume');
  }

  return resumedState;
}

/**
 * Transform Prisma draft state to DraftState interface
 */
function transformToDraftState(prismaDraftState: any): DraftState {
  const participantOrder = prismaDraftState.draftOrders
    .sort((a: any, b: any) => a.position - b.position)
    .map((order: any) => order.participantId);

  const picks: PickRecord[] = prismaDraftState.picks.map((pick: any) => ({
    round: pick.round,
    pickNumber: pick.pickNumber,
    participantId: pick.participantId,
    playerId: pick.playerId,
    timestamp: pick.timestamp
  }));

  return {
    id: prismaDraftState.id,
    currentRound: prismaDraftState.currentRound,
    currentPickIndex: prismaDraftState.currentPickIndex,
    picks,
    participantOrder,
    status: prismaDraftState.status,
    startedAt: prismaDraftState.startedAt,
    completedAt: prismaDraftState.completedAt,
    draftConfigId: prismaDraftState.draftConfigId,
    createdAt: prismaDraftState.createdAt,
    updatedAt: prismaDraftState.updatedAt
  };
}
