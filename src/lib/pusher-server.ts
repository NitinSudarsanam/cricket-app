/**
 * Server-side Pusher configuration
 * Used for broadcasting events from API routes.
 * Degrades gracefully when env vars are missing (e.g. local dev without real-time).
 */

import Pusher from 'pusher';

const hasPusherEnv =
  !!process.env.PUSHER_APP_ID &&
  !!process.env.PUSHER_KEY &&
  !!process.env.PUSHER_SECRET &&
  !!process.env.PUSHER_CLUSTER;

export const pusherServer: Pusher | null = hasPusherEnv
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

export const isPusherConfigured = (): boolean => !!pusherServer;

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

/**
 * Broadcast an event to clients on the draft-specific channel when an id is known.
 */
export async function broadcastEvent(
  event: string,
  data: unknown,
  draftStateId?: string | null
): Promise<void> {
  if (!pusherServer) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Pusher] Not configured; skipping broadcast:', event);
    }
    return;
  }
  try {
    await pusherServer.trigger(getDraftChannel(draftStateId), event, data);
  } catch (error) {
    console.error(`Failed to broadcast event ${event}:`, error);
  }
}
