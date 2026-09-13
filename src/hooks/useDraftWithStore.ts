/**
 * React hook that integrates real-time draft updates with Zustand stores
 * Combines useDraftRealtime with useDraftStore and useUIStore
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useDraftRealtime, PickMadeEvent, RoundCompleteEvent, DraftCompleteEvent, StateUpdateEvent } from './useDraftRealtime';
import { useDraftStore } from '@/stores/useDraftStore';
import { useUIStore } from '@/stores/useUIStore';
import { Player } from '@/types';

export interface UseDraftWithStoreOptions {
  participantId?: string;
  participantName?: string;
  enabled?: boolean;
  onPickMade?: (pick: any) => void;
  onRoundComplete?: (round: number) => void;
  onDraftComplete?: () => void;
}

/**
 * Hook for managing draft with Zustand stores and real-time synchronization
 * 
 * @param options - Configuration options
 * @returns Connection state and utility functions
 */
export function useDraftWithStore(options: UseDraftWithStoreOptions = {}) {
  const {
    participantId,
    participantName,
    enabled = true,
    onPickMade,
    onRoundComplete,
    onDraftComplete,
  } = options;

  // Zustand stores
  const {
    setDraftState,
    removePlayerFromAvailable,
    addPlayerToRoster,
    updateLastUpdate,
    availablePlayers,
  } = useDraftStore();

  const {
    setConnectionState,
    setError,
    clearAllErrors,
  } = useUIStore();

  // Handle pick made event
  const handlePickMade = useCallback((event: PickMadeEvent) => {
    try {
      // Update draft state
      setDraftState(event.draftState);

      // Remove player from available players
      removePlayerFromAvailable(event.pick.playerId);

      // Find the player object
      const player = availablePlayers.find(p => p.id === event.pick.playerId);
      
      if (player) {
        // Add player to participant's roster
        addPlayerToRoster(event.pick.participantId, player);
      }

      // Update last update timestamp
      updateLastUpdate();

      // Clear any errors
      clearAllErrors();

      // Call custom callback
      onPickMade?.(event.pick);
    } catch (error) {
      console.error('Error handling pick made event:', error);
      setError('Failed to process pick update');
    }
  }, [
    setDraftState,
    removePlayerFromAvailable,
    addPlayerToRoster,
    updateLastUpdate,
    clearAllErrors,
    availablePlayers,
    onPickMade,
    setError,
  ]);

  // Handle round complete event
  const handleRoundComplete = useCallback((event: RoundCompleteEvent) => {
    try {
      // Update draft state
      setDraftState(event.draftState);

      // Update last update timestamp
      updateLastUpdate();

      // Call custom callback
      onRoundComplete?.(event.completedRound);
    } catch (error) {
      console.error('Error handling round complete event:', error);
      setError('Failed to process round completion');
    }
  }, [setDraftState, updateLastUpdate, onRoundComplete, setError]);

  // Handle draft complete event
  const handleDraftComplete = useCallback((event: DraftCompleteEvent) => {
    try {
      // Update draft state
      setDraftState(event.draftState);

      // Update last update timestamp
      updateLastUpdate();

      // Call custom callback
      onDraftComplete?.();
    } catch (error) {
      console.error('Error handling draft complete event:', error);
      setError('Failed to process draft completion');
    }
  }, [setDraftState, updateLastUpdate, onDraftComplete, setError]);

  // Handle state update event
  const handleStateUpdate = useCallback((event: StateUpdateEvent) => {
    try {
      // Update draft state
      setDraftState(event.draftState);

      // Update last update timestamp
      updateLastUpdate();

      // Clear any errors
      clearAllErrors();
    } catch (error) {
      console.error('Error handling state update event:', error);
      setError('Failed to sync draft state');
    }
  }, [setDraftState, updateLastUpdate, clearAllErrors, setError]);

  // Handle connection state changes
  const handleConnectionStateChange = useCallback((state: 'connected' | 'disconnected' | 'connecting') => {
    setConnectionState(state);

    // Clear errors when connected
    if (state === 'connected') {
      clearAllErrors();
    }

    // Set error when disconnected
    if (state === 'disconnected') {
      setError('Connection lost. Attempting to reconnect...');
    }
  }, [setConnectionState, clearAllErrors, setError]);

  // Real-time callbacks
  const realtimeCallbacks = {
    onPickMade: handlePickMade,
    onRoundComplete: handleRoundComplete,
    onDraftComplete: handleDraftComplete,
    onStateUpdate: handleStateUpdate,
    onConnectionStateChange: handleConnectionStateChange,
  };

  // Subscribe to real-time updates
  const draftStateId = useDraftStore((s) => s.draftState?.id);
  const { subscribe, unsubscribe, getConnectionState, isSubscribed } = useDraftRealtime(
    realtimeCallbacks,
    enabled,
    draftStateId
  );

  // Update presence when participant connects/disconnects
  useEffect(() => {
    if (!enabled || !participantId || !participantName) return;

    const updatePresence = async (status: 'online' | 'offline') => {
      try {
        await fetch('/api/draft/presence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantId,
            participantName,
            status,
          }),
        });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    // Mark as online when connected
    if (isSubscribed) {
      updatePresence('online');
    }

    // Mark as offline when disconnecting
    return () => {
      if (isSubscribed) {
        updatePresence('offline');
      }
    };
  }, [enabled, participantId, participantName, isSubscribed]);

  return {
    subscribe,
    unsubscribe,
    getConnectionState,
    isSubscribed,
  };
}
