import type { DraftState } from '@/types';

export type DraftOrderType = 'linear' | 'snake';

export type DraftTurnState = Pick<
  DraftState,
  'currentRound' | 'currentPickIndex' | 'participantOrder'
> & {
  draftOrderType?: DraftOrderType;
};

/**
 * Resolve whose turn it is from pick index and draft order type.
 * Snake reversal happens at read time; the stored pick index always advances forward.
 */
export function getCurrentParticipantId(
  draftState: DraftTurnState,
  orderType: DraftOrderType = draftState.draftOrderType ?? 'snake'
): string {
  const { currentRound, currentPickIndex, participantOrder } = draftState;
  const isSnakeRound = orderType === 'snake' && currentRound % 2 === 0;

  if (isSnakeRound) {
    return participantOrder[participantOrder.length - 1 - currentPickIndex];
  }

  return participantOrder[currentPickIndex];
}
