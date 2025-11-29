/**
 * Example component demonstrating real-time draft synchronization
 * This can be used as a wrapper for draft-related pages
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useDraftSync, UseDraftSyncOptions } from '@/hooks/useDraftSync';
import { DraftState, Player } from '@/types';

interface DraftRealtimeContextValue {
  draftState: DraftState | null;
  availablePlayers: Player[];
  connectionState: 'connected' | 'disconnected' | 'connecting';
  lastUpdate: Date | null;
  error: string | null;
  isConnected: boolean;
  isSubscribed: boolean;
  updateDraftState: (state: DraftState) => void;
  updateAvailablePlayers: (draftState: DraftState, allPlayers: Player[]) => void;
  refreshDraftState: () => Promise<void>;
  setError: (error: string) => void;
  clearError: () => void;
}

const DraftRealtimeContext = createContext<DraftRealtimeContextValue | null>(null);

interface DraftRealtimeProviderProps extends UseDraftSyncOptions {
  children: ReactNode;
}

/**
 * Provider component for draft real-time synchronization
 * Wraps children with draft state and real-time connection
 */
export function DraftRealtimeProvider({
  children,
  ...options
}: DraftRealtimeProviderProps) {
  const draftSync = useDraftSync(options);

  return (
    <DraftRealtimeContext.Provider value={draftSync}>
      {children}
    </DraftRealtimeContext.Provider>
  );
}

/**
 * Hook to access draft real-time context
 * Must be used within DraftRealtimeProvider
 */
export function useDraftRealtimeContext() {
  const context = useContext(DraftRealtimeContext);
  
  if (!context) {
    throw new Error('useDraftRealtimeContext must be used within DraftRealtimeProvider');
  }
  
  return context;
}

/**
 * Example usage:
 * 
 * ```tsx
 * // In a page or layout
 * <DraftRealtimeProvider
 *   initialDraftState={draftState}
 *   initialPlayers={players}
 *   participantId="participant-123"
 *   participantName="John Doe"
 *   enabled={true}
 *   onPickMade={(pick) => console.log('Pick made:', pick)}
 *   onRoundComplete={(round) => console.log('Round complete:', round)}
 *   onDraftComplete={() => console.log('Draft complete!')}
 * >
 *   <DraftBoard />
 *   <RosterSidebar />
 * </DraftRealtimeProvider>
 * 
 * // In a child component
 * function DraftBoard() {
 *   const { draftState, availablePlayers, isConnected } = useDraftRealtimeContext();
 *   
 *   return (
 *     <div>
 *       {!isConnected && <div>Connecting...</div>}
 *       {draftState && <div>Round: {draftState.currentRound}</div>}
 *       {availablePlayers.map(player => (
 *         <PlayerChip key={player.id} player={player} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
