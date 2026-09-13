'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

function draftGeneration(state: DraftState | null) {
  return `${state?.id ?? ''}:${state?.status ?? ''}:${state?.picks.length ?? 0}`;
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
  const isPickingPlayerRef = useRef(false);
  const lastGenerationRef = useRef(draftGeneration(draftState));
  const committedGenerationRef = useRef(draftGeneration(draftState));
  const requestIdRef = useRef(0);
  const pickErrorToastIdRef = useRef<string | null>(null);
  const handlePlayerSelectRef = useRef<(player: Player) => Promise<void>>(async () => {});
  const toast = useToast();
  const generation = draftGeneration(draftState);

  if (generation !== lastGenerationRef.current) {
    lastGenerationRef.current = generation;
    requestIdRef.current += 1;
    isPickingPlayerRef.current = false;
  }

  const dismissPickErrorToast = useCallback(() => {
    if (pickErrorToastIdRef.current) {
      toast.dismiss(pickErrorToastIdRef.current);
      pickErrorToastIdRef.current = null;
    }
  }, [toast.dismiss]);

  const clearPickError = useCallback(() => {
    setPickError(null);
    dismissPickErrorToast();
  }, [dismissPickErrorToast]);

  useEffect(() => {
    if (committedGenerationRef.current === generation) {
      return;
    }
    committedGenerationRef.current = generation;
    setPickError(null);
    setIsPickingPlayer(false);
    dismissPickErrorToast();
  }, [generation, dismissPickErrorToast]);

  const handlePlayerSelect = useCallback(
    async (player: Player) => {
      if (!draftState || !isMyTurn || !isDraftActive || isPickingPlayerRef.current) {
        return;
      }

      isPickingPlayerRef.current = true;
      setIsPickingPlayer(true);
      setPickError(null);
      dismissPickErrorToast();
      const requestId = ++requestIdRef.current;

      try {
        const result = await makePick({
          participantId: currentParticipantId,
          playerId: player.id,
        });

        if (requestId !== requestIdRef.current) {
          await refreshDraftState();
          return;
        }

        if (!result.success) {
          const errorMessage =
            result.validationErrors && result.validationErrors.length > 0
              ? result.validationErrors.join(', ')
              : result.error || 'Failed to make pick';

          setPickError(errorMessage);
          pickErrorToastIdRef.current = toast.error(errorMessage, {
            duration: 5000,
            onRetry: () => handlePlayerSelectRef.current(player),
          });
        } else if (result.data?.draftState) {
          updateDraftState(result.data.draftState);
          updateAvailablePlayers(result.data.draftState, allPlayers);
          toast.success(`Successfully drafted ${player.name}!`, { duration: 2000 });
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        console.error('Error making pick:', error);
        const errorMessage = 'Network error. Please check your connection and try again.';
        setPickError(errorMessage);
        pickErrorToastIdRef.current = toast.error(errorMessage, {
          duration: 7000,
          onRetry: () => handlePlayerSelectRef.current(player),
        });
      } finally {
        isPickingPlayerRef.current = false;
        setIsPickingPlayer(false);
      }
    },
    [
      draftState,
      isMyTurn,
      isDraftActive,
      currentParticipantId,
      updateDraftState,
      updateAvailablePlayers,
      refreshDraftState,
      allPlayers,
      toast.error,
      toast.success,
      dismissPickErrorToast,
    ]
  );

  handlePlayerSelectRef.current = handlePlayerSelect;

  const handlePlayerDrop = useCallback(
    (playerId: string) => {
      const player = allPlayers.find((p) => p.id === playerId);
      if (player) handlePlayerSelect(player);
    },
    [allPlayers, handlePlayerSelect]
  );

  const handleTimerExpire = useCallback(async () => {
    if (!draftState || draftState.status !== 'in_progress') return;
    const requestId = requestIdRef.current;
    try {
      const response = await fetch('/api/draft/auto-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftStateId: draftState.id }),
      });
      const result = await response.json();
      if (requestId !== requestIdRef.current) {
        await refreshDraftState();
        return;
      }
      if (result.success && result.data?.applied && result.data.draftState) {
        setPickError(null);
        dismissPickErrorToast();
        updateDraftState(result.data.draftState);
        updateAvailablePlayers(result.data.draftState, allPlayers);
        toast.info(`Auto-picked ${result.data.pick?.playerName ?? 'a player'}`, { duration: 3000 });
      } else {
        await refreshDraftState();
      }
    } catch (error) {
      console.error('Auto-pick failed:', error);
      if (requestId === requestIdRef.current) {
        await refreshDraftState();
      }
    }
  }, [
    draftState,
    updateDraftState,
    updateAvailablePlayers,
    allPlayers,
    refreshDraftState,
    toast.info,
    dismissPickErrorToast,
  ]);

  useEffect(() => {
    if (!pickError) return;
    const timeout = setTimeout(() => setPickError(null), 5000);
    return () => clearTimeout(timeout);
  }, [pickError]);

  return {
    isPickingPlayer,
    pickError,
    clearPickError,
    handlePlayerSelect,
    handlePlayerDrop,
    handleTimerExpire,
  };
}
