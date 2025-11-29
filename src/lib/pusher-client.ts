/**
 * Client-side Pusher configuration
 * Used for subscribing to real-time events in React components
 */

'use client';

import PusherClient from 'pusher-js';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
  throw new Error('NEXT_PUBLIC_PUSHER_KEY is not defined in environment variables');
}

if (!process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
  throw new Error('NEXT_PUBLIC_PUSHER_CLUSTER is not defined in environment variables');
}

// Initialize Pusher client instance (singleton)
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      forceTLS: true,
    });
  }

  return pusherClientInstance;
}

// Channel names (must match server-side)
export const DRAFT_CHANNEL = 'draft-channel';

// Event names (must match server-side)
export const EVENTS = {
  PICK_MADE: 'draft:pick_made',
  ROUND_COMPLETE: 'draft:round_complete',
  DRAFT_COMPLETE: 'draft:draft_complete',
  STATE_UPDATE: 'draft:state_update',
  PARTICIPANT_ONLINE: 'draft:participant_online',
  PARTICIPANT_OFFLINE: 'draft:participant_offline',
} as const;
