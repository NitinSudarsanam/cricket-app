/**
 * React hook for managing real-time draft synchronization
 * Handles WebSocket connection, reconnection, and event listeners
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Channel } from 'pusher-js';
import { getPusherClient, DRAFT_CHANNEL, EVENTS } from '@/lib/pusher-client';
import { DraftState } from '@/types';

export interface PickMadeEvent {
  pick: {
    participantId: string;
    participantName: string;
    playerId: string;
    playerName: string;
    playerTeam: string;
    playerRole: string;
    round: number;
    pickNumber: number;
    timestamp: Date;
  };
  draftState: DraftState;
}

export interface RoundCompleteEvent {
  completedRound: number;
  draftState: DraftState;
}

export interface DraftCompleteEvent {
  draftState: DraftState;
  completedAt: Date;
}

export interface StateUpdateEvent {
  draftState: DraftState;
  draftConfig?: any;
  message: string;
}

export interface ParticipantPresenceEvent {
  participantId: string;
  participantName: string;
  timestamp: Date;
}

export interface DraftRealtimeCallbacks {
  onPickMade?: (event: PickMadeEvent) => void;
  onRoundComplete?: (event: RoundCompleteEvent) => void;
  onDraftComplete?: (event: DraftCompleteEvent) => void;
  onStateUpdate?: (event: StateUpdateEvent) => void;
  onParticipantOnline?: (event: ParticipantPresenceEvent) => void;
  onParticipantOffline?: (event: ParticipantPresenceEvent) => void;
  onConnectionStateChange?: (state: 'connected' | 'disconnected' | 'connecting') => void;
}

/**
 * Hook for subscribing to real-time draft events
 * 
 * @param callbacks - Event handlers for different draft events
 * @param enabled - Whether the connection should be active (default: true)
 * @returns Object with connection state and utility functions
 */
export function useDraftRealtime(
  callbacks: DraftRealtimeCallbacks,
  enabled: boolean = true
) {
  const channelRef = useRef<Channel | null>(null);
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null);
  const isSubscribedRef = useRef(false);

  // Stable callback references
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Subscribe to channel and events
  const subscribe = useCallback(() => {
    if (isSubscribedRef.current || !enabled) return;

    try {
      // Get Pusher client instance
      pusherRef.current = getPusherClient();

      // Subscribe to draft channel
      channelRef.current = pusherRef.current.subscribe(DRAFT_CHANNEL);

      // Bind event listeners
      channelRef.current.bind(EVENTS.PICK_MADE, (data: PickMadeEvent) => {
        callbacksRef.current.onPickMade?.(data);
      });

      channelRef.current.bind(EVENTS.ROUND_COMPLETE, (data: RoundCompleteEvent) => {
        callbacksRef.current.onRoundComplete?.(data);
      });

      channelRef.current.bind(EVENTS.DRAFT_COMPLETE, (data: DraftCompleteEvent) => {
        callbacksRef.current.onDraftComplete?.(data);
      });

      channelRef.current.bind(EVENTS.STATE_UPDATE, (data: StateUpdateEvent) => {
        callbacksRef.current.onStateUpdate?.(data);
      });

      channelRef.current.bind(EVENTS.PARTICIPANT_ONLINE, (data: ParticipantPresenceEvent) => {
        callbacksRef.current.onParticipantOnline?.(data);
      });

      channelRef.current.bind(EVENTS.PARTICIPANT_OFFLINE, (data: ParticipantPresenceEvent) => {
        callbacksRef.current.onParticipantOffline?.(data);
      });

      // Listen to connection state changes
      pusherRef.current.connection.bind('connected', () => {
        callbacksRef.current.onConnectionStateChange?.('connected');
      });

      pusherRef.current.connection.bind('disconnected', () => {
        callbacksRef.current.onConnectionStateChange?.('disconnected');
      });

      pusherRef.current.connection.bind('connecting', () => {
        callbacksRef.current.onConnectionStateChange?.('connecting');
      });

      isSubscribedRef.current = true;
    } catch (error) {
      console.error('Error subscribing to draft channel:', error);
    }
  }, [enabled]);

  // Unsubscribe from channel
  const unsubscribe = useCallback(() => {
    if (!isSubscribedRef.current) return;

    try {
      if (channelRef.current) {
        // Unbind all event listeners
        channelRef.current.unbind_all();
        
        // Unsubscribe from channel
        pusherRef.current?.unsubscribe(DRAFT_CHANNEL);
        
        channelRef.current = null;
      }

      isSubscribedRef.current = false;
    } catch (error) {
      console.error('Error unsubscribing from draft channel:', error);
    }
  }, []);

  // Subscribe on mount, unsubscribe on unmount
  useEffect(() => {
    if (enabled) {
      subscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [enabled, subscribe, unsubscribe]);

  // Get current connection state
  const getConnectionState = useCallback((): 'connected' | 'disconnected' | 'connecting' => {
    if (!pusherRef.current) return 'disconnected';
    
    const state = pusherRef.current.connection.state;
    
    if (state === 'connected') return 'connected';
    if (state === 'connecting' || state === 'unavailable') return 'connecting';
    return 'disconnected';
  }, []);

  return {
    subscribe,
    unsubscribe,
    getConnectionState,
    isSubscribed: isSubscribedRef.current,
  };
}
