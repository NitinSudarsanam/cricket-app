/**
 * Server-side Pusher configuration
 * Used for broadcasting events from API routes
 */

import Pusher from 'pusher';

// Validate environment variables
if (!process.env.PUSHER_APP_ID) {
  throw new Error('PUSHER_APP_ID is not defined in environment variables');
}

if (!process.env.PUSHER_KEY) {
  throw new Error('PUSHER_KEY is not defined in environment variables');
}

if (!process.env.PUSHER_SECRET) {
  throw new Error('PUSHER_SECRET is not defined in environment variables');
}

if (!process.env.PUSHER_CLUSTER) {
  throw new Error('PUSHER_CLUSTER is not defined in environment variables');
}

// Initialize Pusher server instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Channel names
export const DRAFT_CHANNEL = 'draft-channel';

// Event names
export const EVENTS = {
  PICK_MADE: 'draft:pick_made',
  ROUND_COMPLETE: 'draft:round_complete',
  DRAFT_COMPLETE: 'draft:draft_complete',
  STATE_UPDATE: 'draft:state_update',
  PARTICIPANT_ONLINE: 'draft:participant_online',
  PARTICIPANT_OFFLINE: 'draft:participant_offline',
} as const;

/**
 * Broadcast an event to all connected clients
 */
export async function broadcastEvent(
  event: string,
  data: any
): Promise<void> {
  try {
    await pusherServer.trigger(DRAFT_CHANNEL, event, data);
  } catch (error) {
    console.error(`Failed to broadcast event ${event}:`, error);
    throw error;
  }
}
