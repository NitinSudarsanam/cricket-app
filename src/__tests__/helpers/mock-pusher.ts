/**
 * Pusher Mock Helper
 * 
 * Provides utilities for mocking Pusher broadcasts in tests.
 */

import { vi } from 'vitest';

/**
 * Create a mock Pusher broadcast function
 * 
 * Usage:
 * ```typescript
 * const mockBroadcast = createMockPusherBroadcast();
 * vi.mock('@/lib/pusher-server', () => ({
 *   broadcastEvent: mockBroadcast,
 * }));
 * ```
 */
export function createMockPusherBroadcast() {
  const broadcastFn = vi.fn();
  
  return {
    broadcast: broadcastFn,
    getCalls: () => broadcastFn.mock.calls,
    getLastCall: () => broadcastFn.mock.calls[broadcastFn.mock.calls.length - 1],
    clear: () => broadcastFn.mockClear(),
  };
}
