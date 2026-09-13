/**
 * React hook for managing real-time draft synchronization
 * Handles WebSocket connection, reconnection, and event listeners
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Channel } from 'pusher-js';
import { getDraftChannel, getPusherClient, EVENTS } from '@/lib/pusher-client';
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
    autoPick?: boolean;
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

export function useDraftRealtime(
  callbacks: DraftRealtimeCallbacks,
  enabled: boolean = true,
  draftStateId?: string | null
) {
  const channelRef = useRef<Channel | null>(null);
  const pusherRef = useRef<ReturnType<typeof getPusherClient>>(null);
  const isSubscribedRef = useRef(false);
  const channelName = getDraftChannel(draftStateId);

  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const subscribe = useCallback(() => {
    if (isSubscribedRef.current || !enabled) return;

    try {
      const client = getPusherClient();
      if (!client) {
        callbacksRef.current.onConnectionStateChange?.('disconnected');
        return;
      }

      pusherRef.current = client;
      channelRef.current = client.subscribe(channelName);

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

      client.connection.bind('connected', () => {
        callbacksRef.current.onConnectionStateChange?.('connected');
      });
      client.connection.bind('disconnected', () => {
        callbacksRef.current.onConnectionStateChange?.('disconnected');
      });
      client.connection.bind('connecting', () => {
        callbacksRef.current.onConnectionStateChange?.('connecting');
      });

      isSubscribedRef.current = true;

      const current = client.connection.state;
      if (current === 'connected') {
        callbacksRef.current.onConnectionStateChange?.('connected');
      } else if (current === 'connecting' || current === 'unavailable') {
        callbacksRef.current.onConnectionStateChange?.('connecting');
      }
    } catch (error) {
      console.error('Error subscribing to draft channel:', error);
      callbacksRef.current.onConnectionStateChange?.('disconnected');
    }
  }, [enabled, channelName]);

  const unsubscribe = useCallback(() => {
    if (!isSubscribedRef.current) return;

    try {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current?.unsubscribe(channelName);
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
    } catch (error) {
      console.error('Error unsubscribing from draft channel:', error);
    }
  }, [channelName]);

  useEffect(() => {
    if (enabled) {
      subscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [enabled, subscribe, unsubscribe]);

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
