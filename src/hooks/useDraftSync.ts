/**
 * React hook for synchronizing draft state with real-time updates
 * Combines useDraftRealtime with local state management
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDraftRealtime } from './useDraftRealtime';
import { DraftState, Player } from '@/types';

export interface DraftSyncState {
  draftState: DraftState | null;
  availablePlayers: Player[];
  connectionState: 'connected' | 'disconnected' | 'connecting';
  lastUpdate: Date | null;
  error: string | null;
}

export interface UseDraftSyncOptions {
  initialDraftState?: DraftState | null;
  initialPlayers?: Player[];
  participantId?: string;
  participantName?: string;
  enabled?: boolean;
  onPickMade?: (pick: any) => void;
  onRoundComplete?: (round: number) => void;
  onDraftComplete?: () => void;
}

/**
 * Hook for managing draft state with real-time synchronization
 * 
 * @param options - Configuration options
 * @returns Draft state and utility functions
 */
export function useDraftSync(options: UseDraftSyncOptions = {}) {
  const {
    initialDraftState = null,
    initialPlayers = [],
    participantId,
    participantName,
    enabled = true,
    onPickMade,
    onRoundComplete,
    onDraftComplete,
  } = options;

  // Local state
  const [state, setState] = useState<DraftSyncState>({
    draftState: initialDraftState,
    availablePlayers: initialPlayers,
    connectionState: 'disconnected',
    lastUpdate: null,
    error: null,
  });

  // Update draft state. Ignore stale snapshots that rewind pick count
  // (except a reset back to not_started).
  const updateDraftState = useCallback((newState: DraftState) => {
    setState(prev => {
      const previous = prev.draftState;
      if (
        previous &&
        newState.status !== 'not_started' &&
        newState.picks.length < previous.picks.length
      ) {
        return prev;
      }
      return {
        ...prev,
        draftState: newState,
        lastUpdate: new Date(),
        error: null,
      };
    });
  }, []);

  // Update available players (remove drafted players)
  const updateAvailablePlayers = useCallback((draftState: DraftState, allPlayers: Player[]) => {
    const draftedPlayerIds = new Set(draftState.picks.map(pick => pick.playerId));
    const available = allPlayers.filter(player => !draftedPlayerIds.has(player.id));
    
    setState(prev => ({
      ...prev,
      availablePlayers: available,
    }));
  }, []);

  // Set error
  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Real-time event handlers
  const realtimeCallbacks = {
    onPickMade: useCallback((event: any) => {
      updateDraftState(event.draftState);
      
      if (initialPlayers.length > 0) {
        updateAvailablePlayers(event.draftState, initialPlayers);
      }
      
      onPickMade?.(event.pick);
    }, [updateDraftState, updateAvailablePlayers, initialPlayers, onPickMade]),

    onRoundComplete: useCallback((event: any) => {
      updateDraftState(event.draftState);
      onRoundComplete?.(event.completedRound);
    }, [updateDraftState, onRoundComplete]),

    onDraftComplete: useCallback((event: any) => {
      updateDraftState(event.draftState);
      onDraftComplete?.();
    }, [updateDraftState, onDraftComplete]),

    onStateUpdate: useCallback((event: any) => {
      updateDraftState(event.draftState);
      
      if (initialPlayers.length > 0) {
        updateAvailablePlayers(event.draftState, initialPlayers);
      }
    }, [updateDraftState, updateAvailablePlayers, initialPlayers]),

    onConnectionStateChange: useCallback((connectionState: 'connected' | 'disconnected' | 'connecting') => {
      setState(prev => ({
        ...prev,
        connectionState,
      }));
    }, []),
  };

  // Subscribe to real-time updates
  const { subscribe, unsubscribe, getConnectionState, isSubscribed } = useDraftRealtime(
    realtimeCallbacks,
    enabled,
    state.draftState?.id ?? initialDraftState?.id
  );

  // Fetch latest draft state (defined before useEffects that call it)
  const refreshDraftState = useCallback(async () => {
    try {
      const response = await fetch('/api/draft/state');
      
      if (!response.ok) {
        throw new Error('Failed to fetch draft state');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        updateDraftState(result.data);
        
        if (initialPlayers.length > 0) {
          updateAvailablePlayers(result.data, initialPlayers);
        }
      }
    } catch (error) {
      console.error('Error refreshing draft state:', error);
      setError('Failed to refresh draft state');
    }
  }, [updateDraftState, updateAvailablePlayers, initialPlayers, setError]);

  const draftStatusRef = useRef(state.draftState?.status);
  draftStatusRef.current = state.draftState?.status;
  const connectionStateRef = useRef(state.connectionState);
  connectionStateRef.current = state.connectionState;

  // Refetch draft state on mount so clients that missed Pusher events get latest state
  useEffect(() => {
    if (!enabled) return;
    refreshDraftState();
  }, [enabled, refreshDraftState]);

  // Refetch when tab becomes visible only if Pusher is down (avoid stale GET overwrite)
  useEffect(() => {
    if (!enabled) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (connectionStateRef.current === 'connected') return;
      const inProgress = draftStatusRef.current === 'in_progress' || draftStatusRef.current === 'paused';
      if (inProgress) {
        refreshDraftState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, refreshDraftState]);

  // Drive the server clock and, when Pusher is down, poll GET /state.
  // A stale GET can overwrite a newer Pusher pick, so skip GET while connected.
  useEffect(() => {
    if (!enabled) return;
    const inProgress = draftStatusRef.current === 'in_progress' || draftStatusRef.current === 'paused';
    if (!inProgress && draftStatusRef.current) return;
    const interval = window.setInterval(async () => {
      const status = draftStatusRef.current;
      if (status === 'in_progress') {
        try {
          await fetch('/api/draft/auto-pick', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              draftStateId: state.draftState?.id ?? initialDraftState?.id,
            }),
          });
        } catch {
          // Keep polling even if auto-pick is a no-op or fails.
        }
      }
      const pusherConnected = connectionStateRef.current === 'connected';
      if (!pusherConnected && (status === 'in_progress' || status === 'paused' || !status)) {
        refreshDraftState();
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [enabled, refreshDraftState, state.draftState?.id, initialDraftState?.id]);

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
            draftStateId: state.draftState?.id ?? initialDraftState?.id,
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
  }, [enabled, participantId, participantName, isSubscribed, state.draftState?.id, initialDraftState?.id]);

  return {
    // State
    draftState: state.draftState,
    availablePlayers: state.availablePlayers,
    connectionState: state.connectionState,
    lastUpdate: state.lastUpdate,
    error: state.error,
    isConnected: state.connectionState === 'connected',
    isSubscribed,

    // Actions
    updateDraftState,
    updateAvailablePlayers,
    refreshDraftState,
    setError,
    clearError,
    subscribe,
    unsubscribe,
    getConnectionState,
  };
}
