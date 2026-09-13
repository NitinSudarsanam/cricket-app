'use client';

import { useState } from 'react';
import { Player, DraftConfig, DraftState } from '@/types';
import { getEligiblePlayers } from '@/lib/rule-engine';
import { getCurrentParticipantId } from '@/lib/draft-order';
import { DraftBoard } from './DraftBoard';
import { DraftTopBar } from './DraftTopBar';
import { RosterSidebar } from './RosterSidebar';
import { PickHistory } from './PickHistory';
import { DraftCompletion } from './DraftCompletion';
import { DraftSessionBar } from './DraftSessionBar';
import { DraftMobileRoster } from './DraftMobileRoster';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ValidationError } from '@/components/ValidationError';
import { useDraftSync } from '@/hooks/useDraftSync';
import { useDraftPick } from '@/hooks/useDraftPick';
import { useDraftCompletion } from '@/hooks/useDraftCompletion';
import { useResizableDraftLayout } from '@/hooks/useResizableDraftLayout';
import { Alert } from '@/components/ui';

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
  const allPlayers = initialPlayers;
  const [showMobileRoster, setShowMobileRoster] = useState(false);
  const { sidebarWidth, historyHeight, handleSidebarResizeStart, handleHistoryResizeStart } =
    useResizableDraftLayout();

  const {
    draftState,
    availablePlayers,
    connectionState,
    error: syncError,
    updateDraftState,
    updateAvailablePlayers,
    refreshDraftState,
    clearError,
  } = useDraftSync({
    initialDraftState,
    initialPlayers,
    participantId: currentParticipantId,
    participantName: currentParticipantName,
    enabled: true,
  });

  const currentParticipantIdOnClock = draftState ? getCurrentParticipantId(draftState) : null;
  const isMyTurn = draftState ? currentParticipantIdOnClock === currentParticipantId : false;
  const isDraftActive = draftState?.status === 'in_progress';
  const currentRoster = draftState
    ? allPlayers.filter((player) =>
        draftState.picks
          .filter((pick) => pick.participantId === currentParticipantId)
          .map((pick) => pick.playerId)
          .includes(player.id)
      )
    : [];

  const {
    isPickingPlayer,
    pickError,
    clearPickError,
    handlePlayerSelect,
    handlePlayerDrop,
    handleTimerExpire,
  } = useDraftPick({
    draftState,
    isMyTurn,
    isDraftActive,
    currentParticipantId,
    allPlayers,
    updateDraftState,
    updateAvailablePlayers,
    refreshDraftState,
  });

  const { showCompletionModal, draftResults, fetchFailed, retryResults, closeCompletionModal } =
    useDraftCompletion(draftState);

  const allDraftedPlayerIds = draftState ? draftState.picks.map((p) => p.playerId) : [];
  const eligiblePlayerIds =
    isMyTurn && isDraftActive && draftConfig && draftState && currentRoster.length < (draftConfig.rosterSize ?? 0)
      ? getEligiblePlayers(availablePlayers, currentRoster, draftState.currentRound, draftConfig, allDraftedPlayerIds)
      : null;

  if (!draftState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner variant="full-page" />
      </div>
    );
  }

  const waitingName =
    participants.find((p) => p.id === currentParticipantIdOnClock)?.name || 'other participant';

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-50">
        <DraftTopBar
          draftState={draftState}
          participants={participants}
          totalRounds={draftConfig?.totalRounds}
          showTimer={showTimer}
          timerSeconds={timerSeconds}
          onTimerExpire={handleTimerExpire}
          connectionState={connectionState}
        />

        <DraftSessionBar
          participants={participants}
          currentParticipantId={currentParticipantId}
          currentParticipantIdOnClock={currentParticipantIdOnClock}
        />

        {isDraftActive && isMyTurn && (
          <Alert variant="success" className="text-center font-semibold animate-pulse-subtle">
            Your turn to pick – select a player below
          </Alert>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex min-h-0 overflow-hidden">
            <div className="flex-1 min-w-0 overflow-auto pb-16 lg:pb-0">
              <DraftBoard
                availablePlayers={availablePlayers}
                onPlayerSelect={handlePlayerSelect}
                disabled={!isMyTurn || !isDraftActive || isPickingPlayer}
                eligiblePlayerIds={eligiblePlayerIds}
                allowDrag={isMyTurn && isDraftActive && !isPickingPlayer}
              />
            </div>

            <div
              className="hidden lg:block w-1 flex-shrink-0 bg-slate-200 hover:bg-emerald-400 cursor-col-resize transition-colors"
              role="separator"
              aria-label="Resize sidebar"
              onPointerDown={handleSidebarResizeStart}
            />

            <div
              className="hidden lg:block flex-shrink-0 overflow-hidden bg-white border-l border-slate-200"
              style={{ width: sidebarWidth }}
            >
              <div className="h-full overflow-hidden">
                <RosterSidebar
                  roster={currentRoster}
                  draftConfig={draftConfig}
                  participantName={currentParticipantName}
                  onPlayerDrop={isMyTurn && isDraftActive ? handlePlayerDrop : undefined}
                />
              </div>
            </div>

            <DraftMobileRoster
              open={showMobileRoster}
              roster={currentRoster}
              draftConfig={draftConfig}
              participantName={currentParticipantName}
              onToggle={() => setShowMobileRoster(!showMobileRoster)}
              onClose={() => setShowMobileRoster(false)}
              onPlayerDrop={isMyTurn && isDraftActive ? handlePlayerDrop : undefined}
            />
          </div>

          <div
            className="h-1.5 flex-shrink-0 bg-slate-200 hover:bg-emerald-400 cursor-row-resize transition-colors"
            role="separator"
            aria-label="Resize pick history"
            onPointerDown={handleHistoryResizeStart}
          />

          <div className="flex-shrink-0 overflow-hidden bg-white border-t border-slate-200" style={{ height: historyHeight }}>
            <PickHistory
              picks={draftState.picks}
              participants={participants}
              players={allPlayers}
              autoScroll={true}
            />
          </div>
        </div>

        {fetchFailed && (
          <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
            <Alert variant="warning" className="flex items-center justify-between gap-3 shadow-lg">
              <span>Could not load draft results.</span>
              <button type="button" onClick={retryResults} className="underline font-semibold">
                Retry
              </button>
            </Alert>
          </div>
        )}

        {(pickError || syncError) && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
            <div className="relative">
              <ValidationError error={pickError || syncError} className="shadow-lg" />
              <button
                type="button"
                onClick={() => {
                  clearPickError();
                  clearError();
                }}
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

        {isDraftActive && !isMyTurn && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-gray-50 border border-gray-300 rounded-full px-6 py-3 shadow-lg">
              <p className="text-sm font-medium text-slate-600">Waiting for {waitingName}...</p>
            </div>
          </div>
        )}

        {isPickingPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg px-6 py-4 shadow-xl">
              <LoadingSpinner variant="inline" />
              <p className="text-sm text-slate-700 mt-2">Making pick...</p>
            </div>
          </div>
        )}
      </div>

      {showCompletionModal && draftResults && (
        <DraftCompletion
          draftState={draftResults.draftState}
          draftConfig={draftResults.draftConfig}
          participantRosters={draftResults.participantRosters}
          allParticipantsMeetRequirements={draftResults.allParticipantsMeetRequirements}
          totalPicks={draftResults.totalPicks}
          onClose={closeCompletionModal}
        />
      )}
    </>
  );
}
