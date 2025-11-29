'use client';

import { useState, useCallback, useEffect } from 'react';
import { Player, DraftConfig, DraftState } from '@/types';
import { DraftBoard } from './DraftBoard';
import { DraftTopBar } from './DraftTopBar';
import { RosterSidebar } from './RosterSidebar';
import { PickHistory } from './PickHistory';
import { DraftCompletion } from './DraftCompletion';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ValidationError } from '@/components/ValidationError';
import { useDraftSync } from '@/hooks/useDraftSync';
import { makePick } from '@/lib/draft-api-client';
import { useToast } from '@/hooks/useToast';

export interface DraftInterfaceProps {
  initialDraftState: DraftState;
  initialPlayers: Player[];
  draftConfig: DraftConfig;
  participants: Array<{ id: string; name: string; email?: string }>;
  currentParticipantId: string;
  currentParticipantName: string;
  showTimer?: boolean;
  timerSeconds?: number;
}

export function DraftInterface({
  initialDraftState,
  initialPlayers,
  draftConfig,
  participants,
  currentParticipantId,
  currentParticipantName,
  showTimer = false,
  timerSeconds = 60,
}: DraftInterfaceProps) {
  const [isPickingPlayer, setIsPickingPlayer] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [allPlayers] = useState(initialPlayers);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [draftResults, setDraftResults] = useState<any>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showMobileRoster, setShowMobileRoster] = useState(false);
  const toast = useToast();

  // Use draft sync hook for real-time updates
  const {
    draftState,
    availablePlayers,
    connectionState,
    error: syncError,
    updateDraftState,
    updateAvailablePlayers,
  } = useDraftSync({
    initialDraftState,
    initialPlayers,
    participantId: currentParticipantId,
    participantName: currentParticipantName,
    enabled: true,
    onPickMade: (pick) => {
      console.log('Pick made:', pick);
      setPickError(null);
    },
  });

  // Get current participant's roster
  const currentRoster = draftState
    ? allPlayers.filter(player =>
        draftState.picks
          .filter(pick => pick.participantId === currentParticipantId)
          .map(pick => pick.playerId)
          .includes(player.id)
      )
    : [];

  // Check if it's current participant's turn (accounting for snake draft)
  const isMyTurn = draftState
    ? (() => {
        const { currentRound, currentPickIndex, participantOrder } = draftState;
        // Snake draft: even rounds go in reverse
        const isSnakeRound = currentRound % 2 === 0;
        const currentParticipant = isSnakeRound
          ? participantOrder[participantOrder.length - 1 - currentPickIndex]
          : participantOrder[currentPickIndex];
        return currentParticipant === currentParticipantId;
      })()
    : false;

  // Check if draft is active
  const isDraftActive = draftState?.status === 'in_progress';

  // Handle player selection
  const handlePlayerSelect = useCallback(
    async (player: Player) => {
      if (!draftState || !isMyTurn || !isDraftActive || isPickingPlayer) {
        return;
      }

      setIsPickingPlayer(true);
      setPickError(null);

      try {
        console.log('=== PICK ATTEMPT ===');
        console.log('Player:', player.name, player.id);
        console.log('Participant:', currentParticipantId);
        console.log('Is my turn:', isMyTurn);
        console.log('Draft active:', isDraftActive);
        
        const result = await makePick({
          participantId: currentParticipantId,
          playerId: player.id,
        });

        console.log('=== PICK RESULT ===', result);

        if (!result.success) {
          const errorMessage = result.validationErrors && result.validationErrors.length > 0
            ? result.validationErrors.join(', ')
            : result.error || 'Failed to make pick';
          
          setPickError(errorMessage);
          toast.error(errorMessage, {
            duration: 5000,
            onRetry: () => handlePlayerSelect(player),
          });
        } else {
          // Update local state with new draft state
          if (result.data?.draftState) {
            console.log('Pick successful! Updating state...');
            updateDraftState(result.data.draftState);
            updateAvailablePlayers(result.data.draftState, allPlayers);
            toast.success(`Successfully drafted ${player.name}!`, { duration: 2000 });
            
            // Force page reload to ensure fresh state
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error making pick:', error);
        const errorMessage = 'Network error. Please check your connection and try again.';
        setPickError(errorMessage);
        toast.error(errorMessage, {
          duration: 7000,
          onRetry: () => handlePlayerSelect(player),
        });
      } finally {
        setIsPickingPlayer(false);
      }
    },
    [
      draftState,
      isMyTurn,
      isDraftActive,
      isPickingPlayer,
      currentParticipantId,
      updateDraftState,
      updateAvailablePlayers,
      allPlayers,
    ]
  );

  // Handle timer expiration
  const handleTimerExpire = useCallback(() => {
    console.log('Timer expired for pick');
    // Could implement auto-pick logic here
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (pickError) {
      const timeout = setTimeout(() => {
        setPickError(null);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [pickError]);

  // Fetch draft results when draft is completed
  useEffect(() => {
    if (draftState?.status === 'completed' && !draftResults && !loadingResults) {
      setLoadingResults(true);
      fetch(`/api/draft/results?draftStateId=${draftState.id}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setDraftResults(result.data);
            setShowCompletionModal(true);
          }
        })
        .catch(error => {
          console.error('Error fetching draft results:', error);
        })
        .finally(() => {
          setLoadingResults(false);
        });
    }
  }, [draftState?.status, draftState?.id, draftResults, loadingResults]);

  if (!draftState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner variant="full-page" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Top Bar */}
        <DraftTopBar
          draftState={draftState}
          participants={participants}
          showTimer={showTimer}
          timerSeconds={timerSeconds}
          onTimerExpire={handleTimerExpire}
        />

      {/* Participant Switcher for Testing */}
      <div className="bg-blue-50 border-b border-blue-200 p-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Switch Participant:</span>
          {participants.map((p) => {
            const isCurrentParticipant = p.id === currentParticipantId;
            const isOnClock = draftState?.participantOrder?.[draftState?.currentPickIndex] === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  window.location.href = `/draft?participant=${p.id}`;
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  isCurrentParticipant 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } ${isOnClock ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                title={isOnClock ? `${p.name} - On the clock!` : p.name}
              >
                {p.name} {isOnClock && '🎯'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Draft Board */}
        <div className="flex-1 overflow-auto pb-16 lg:pb-0">
          <DraftBoard
            availablePlayers={availablePlayers}
            onPlayerSelect={handlePlayerSelect}
            disabled={!isMyTurn || !isDraftActive || isPickingPlayer}
            currentParticipantId={currentParticipantId}
          />
        </div>

        {/* Roster Sidebar - Desktop only, sticky positioned */}
        <div className="hidden lg:block lg:w-80 flex-shrink-0">
          <div className="sticky top-0 h-[calc(100vh-57px)] overflow-hidden">
            <RosterSidebar
              roster={currentRoster}
              draftConfig={draftConfig}
              participantName={currentParticipantName}
            />
          </div>
        </div>

        {/* Mobile Roster Button - Fixed at bottom */}
        <button
          onClick={() => setShowMobileRoster(!showMobileRoster)}
          className="lg:hidden fixed bottom-20 right-4 z-30 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 touch-manipulation active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="font-medium">My Roster ({currentRoster.length})</span>
        </button>
      </div>

      {/* Pick History - Bottom panel */}
      <PickHistory
        picks={draftState.picks}
        participants={participants}
        players={allPlayers}
        autoScroll={true}
      />

      {/* Error notifications */}
      {(pickError || syncError) && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
          <div className="relative">
            <ValidationError error={pickError || syncError} className="shadow-lg" />
            <button
              onClick={() => setPickError(null)}
              className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      {connectionState !== 'connected' && (
        <div className="fixed top-20 right-4 z-50">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-yellow-800">
                {connectionState === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Turn indicator */}
      {isDraftActive && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          {isMyTurn ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-full px-6 py-3 shadow-lg">
              <p className="text-sm font-bold text-green-800">
                🎯 Your turn! Select a player
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-300 rounded-full px-6 py-3 shadow-lg">
              <p className="text-sm font-medium text-gray-600">
                Waiting for{' '}
                {participants.find(
                  p => p.id === draftState.participantOrder[draftState.currentPickIndex]
                )?.name || 'other participant'}
                ...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading overlay when making a pick */}
      {isPickingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg px-6 py-4 shadow-xl">
            <LoadingSpinner variant="inline" />
            <p className="text-sm text-gray-700 mt-2">Making pick...</p>
          </div>
        </div>
      )}
      </div>

      {/* Draft Completion Modal */}
      {showCompletionModal && draftResults && (
        <DraftCompletion
          draftState={draftResults.draftState}
          draftConfig={draftResults.draftConfig}
          participantRosters={draftResults.participantRosters}
          allParticipantsMeetRequirements={draftResults.allParticipantsMeetRequirements}
          totalPicks={draftResults.totalPicks}
          onClose={() => setShowCompletionModal(false)}
        />
      )}

      {/* Mobile Roster Modal */}
      {showMobileRoster && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileRoster(false)}
          />
          <div className="relative w-full bg-white rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">My Roster</h3>
              <button
                onClick={() => setShowMobileRoster(false)}
                className="p-2 rounded-full hover:bg-gray-100 touch-manipulation"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <RosterSidebar
                roster={currentRoster}
                draftConfig={draftConfig}
                participantName={currentParticipantName}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
