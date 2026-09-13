/**
 * Client-side Pusher configuration
 * Used for subscribing to real-time events in React components.
 * Degrades gracefully when public Pusher env vars are missing so the UI can poll.
 */

'use client';

import PusherClient from 'pusher-js';

let pusherClientInstance: PusherClient | null = null;

export function isPusherClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER);
}

export function getPusherClient(): PusherClient | null {
  if (!isPusherClientConfigured()) {
    return null;
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      forceTLS: true,
    });
  }

  return pusherClientInstance;
}

export const DRAFT_CHANNEL = 'draft-channel';

export function getDraftChannel(draftStateId?: string | null): string {
  return draftStateId ? `${DRAFT_CHANNEL}-${draftStateId}` : DRAFT_CHANNEL;
}

export const EVENTS = {
  PICK_MADE: 'draft:pick_made',
  ROUND_COMPLETE: 'draft:round_complete',
  DRAFT_COMPLETE: 'draft:draft_complete',
  STATE_UPDATE: 'draft:state_update',
  PARTICIPANT_ONLINE: 'draft:participant_online',
  PARTICIPANT_OFFLINE: 'draft:participant_offline',
} as const;
