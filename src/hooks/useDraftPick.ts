'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DraftState, Player } from '@/types';
import { makePick } from '@/lib/draft-api-client';
import { useToast } from '@/hooks/useToast';

interface UseDraftPickOptions {
  draftState: DraftState | null;
  isMyTurn: boolean;
  isDraftActive: boolean;
  currentParticipantId: string;
  allPlayers: Player[];
  updateDraftState: (state: DraftState) => void;
  updateAvailablePlayers: (state: DraftState, players: Player[]) => void;
  refreshDraftState: () => Promise<void>;
}

export function useDraftPick({
  draftState,
  isMyTurn,
  isDraftActive,
  currentParticipantId,
  allPlayers,
  updateDraftState,
  updateAvailablePlayers,
  refreshDraftState,
}: UseDraftPickOptions) {
  const [isPickingPlayer, setIsPickingPlayer] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const toast = useToast();

  const handlePlayerSelect = useCallback(
    async (player: Player) => {
      if (!draftState || !isMyTurn || !isDraftActive || isPickingPlayer) {
        return;
      }

      setIsPickingPlayer(true);
      setPickError(null);

      try {
        const result = await makePick({
          participantId: currentParticipantId,
          playerId: player.id,
        });

        if (!result.success) {
          const errorMessage =
            result.validationErrors && result.validationErrors.length > 0
              ? result.validationErrors.join(', ')
              : result.error || 'Failed to make pick';

          setPickError(errorMessage);
          toast.error(errorMessage, {
            duration: 5000,
            onRetry: () => handlePlayerSelect(player),
          });
        } else if (result.data?.draftState) {
          updateDraftState(result.data.draftState);
          updateAvailablePlayers(result.data.draftState, allPlayers);
          toast.success(`Successfully drafted ${player.name}!`, { duration: 2000 });
        }
      } catch (error) {
        console.error('Error making pick:', error);
        const errorMessage = 'Network error. Please check your connection and try again.';
        setPickError(errorMessage);
        toast.error(errorMessage, {
          duration: 7000,
          onRetry: () => handlePlayerSelect(player),
        });
      } finally {
        setIsPickingPlayer(false);
      }
    },
    [
      draftState,
      isMyTurn,
      isDraftActive,
      isPickingPlayer,
      currentParticipantId,
      updateDraftState,
      updateAvailablePlayers,
      allPlayers,
      toast,
    ]
  );

  const handlePlayerDrop = useCallback(
    (playerId: string) => {
      const player = allPlayers.find((p) => p.id === playerId);
      if (player) handlePlayerSelect(player);
    },
    [allPlayers, handlePlayerSelect]
  );

  const handleTimerExpire = useCallback(async () => {
    if (!draftState || draftState.status !== 'in_progress') return;
    try {
      const response = await fetch('/api/draft/auto-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftStateId: draftState.id }),
      });
      const result = await response.json();
      if (result.success && result.data?.applied && result.data.draftState) {
        updateDraftState(result.data.draftState);
        updateAvailablePlayers(result.data.draftState, allPlayers);
        toast.info(`Auto-picked ${result.data.pick?.playerName ?? 'a player'}`, { duration: 3000 });
      } else {
        await refreshDraftState();
      }
    } catch (error) {
      console.error('Auto-pick failed:', error);
      await refreshDraftState();
    }
  }, [draftState, updateDraftState, updateAvailablePlayers, allPlayers, refreshDraftState, toast]);

  useEffect(() => {
    if (!pickError) return;
    const timeout = setTimeout(() => setPickError(null), 5000);
    return () => clearTimeout(timeout);
  }, [pickError]);

  return {
    isPickingPlayer,
    pickError,
    clearPickError: () => setPickError(null),
    handlePlayerSelect,
    handlePlayerDrop,
    handleTimerExpire,
  };
}
