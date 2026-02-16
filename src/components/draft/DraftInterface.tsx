'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Player, DraftConfig, DraftState } from '@/types';
import { getValidRolesForNextPick } from '@/lib/rule-engine';
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

const LAYOUT_STORAGE_KEY = 'draft-layout';
const DEFAULT_SIDEBAR_WIDTH = 320;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 600;
const DEFAULT_HISTORY_HEIGHT = 256;
const MIN_HISTORY_HEIGHT = 120;
const MAX_HISTORY_HEIGHT = 480;

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

  // Resizable layout (IDE-style): sidebar width and pick history height
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [historyHeight, setHistoryHeight] = useState(DEFAULT_HISTORY_HEIGHT);
  const resizeSidebarStart = useRef<{ x: number; w: number } | null>(null);
  const resizeHistoryStart = useRef<{ y: number; h: number } | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LAYOUT_STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as { sidebarWidth?: number; historyHeight?: number };
        if (typeof parsed.sidebarWidth === 'number' && parsed.sidebarWidth >= MIN_SIDEBAR_WIDTH && parsed.sidebarWidth <= MAX_SIDEBAR_WIDTH) {
          setSidebarWidth(parsed.sidebarWidth);
        }
        if (typeof parsed.historyHeight === 'number' && parsed.historyHeight >= MIN_HISTORY_HEIGHT && parsed.historyHeight <= MAX_HISTORY_HEIGHT) {
          setHistoryHeight(parsed.historyHeight);
        }
      }
    } catch {}
  }, []);

  const handleSidebarResizeMove = useCallback(
    (e: PointerEvent) => {
      const start = resizeSidebarStart.current;
      if (!start) return;
      const delta = start.x - e.clientX; // drag left = sidebar wider
      const next = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, start.w + delta));
      setSidebarWidth(next);
      try {
        const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
        const prev = raw ? JSON.parse(raw) : {};
        window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({ ...prev, sidebarWidth: next }));
      } catch {}
    },
    []
  );

  const handleSidebarResizeEnd = useCallback(() => {
    resizeSidebarStart.current = null;
    document.removeEventListener('pointermove', handleSidebarResizeMove);
    document.removeEventListener('pointerup', handleSidebarResizeEnd);
    document.body.releasePointerCapture?.(-1);
  }, [handleSidebarResizeMove]);

  const handleSidebarResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      resizeSidebarStart.current = { x: e.clientX, w: sidebarWidth };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', handleSidebarResizeMove);
      document.addEventListener('pointerup', handleSidebarResizeEnd);
    },
    [sidebarWidth, handleSidebarResizeMove, handleSidebarResizeEnd]
  );

  const handleHistoryResizeMove = useCallback((e: PointerEvent) => {
    const start = resizeHistoryStart.current;
    if (!start) return;
    // Drag divider up => increase history height; drag down => decrease (IDE-style)
    const delta = start.y - e.clientY;
    const next = Math.min(MAX_HISTORY_HEIGHT, Math.max(MIN_HISTORY_HEIGHT, start.h + delta));
    setHistoryHeight(next);
    try {
      const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({ ...prev, historyHeight: next }));
    } catch {}
  }, []);

  const handleHistoryResizeEnd = useCallback(() => {
    resizeHistoryStart.current = null;
    document.removeEventListener('pointermove', handleHistoryResizeMove);
    document.removeEventListener('pointerup', handleHistoryResizeEnd);
    document.body.releasePointerCapture?.(-1);
  }, [handleHistoryResizeMove]);

  const handleHistoryResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      resizeHistoryStart.current = { y: e.clientY, h: historyHeight };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', handleHistoryResizeMove);
      document.addEventListener('pointerup', handleHistoryResizeEnd);
    },
    [historyHeight, handleHistoryResizeMove, handleHistoryResizeEnd]
  );

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
    onPickMade: () => {
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

  // Current participant on the clock (respects snake vs linear draft order)
  const currentParticipantIdOnClock = draftState
    ? (() => {
        const { currentRound, currentPickIndex, participantOrder, draftOrderType } = draftState;
        const orderType = draftOrderType ?? 'snake';
        const isSnakeRound = orderType === 'snake' && currentRound % 2 === 0;
        return isSnakeRound
          ? participantOrder[participantOrder.length - 1 - currentPickIndex]
          : participantOrder[currentPickIndex];
      })()
    : null;

  // Check if it's current participant's turn
  const isMyTurn = draftState ? currentParticipantIdOnClock === currentParticipantId : false;

  // Check if draft is active
  const isDraftActive = draftState?.status === 'in_progress';

  // When it's my turn, which roles are valid for the next pick (mandatory-only when freeSlots === 0)
  const validRolesForPick =
    isMyTurn && isDraftActive && draftConfig && currentRoster.length < (draftConfig.rosterSize ?? 0)
      ? getValidRolesForNextPick(currentRoster, draftConfig)
      : null;

  // Handle player selection
  const handlePlayerSelect = useCallback(
    async (player: Player) => {
      if (!draftState || !isMyTurn || !isDraftActive || isPickingPlayer) {
        return;
      }

      setIsPickingPlayer(true);
      setPickError(null);

      try {
        const result = await makePick({
          participantId: currentParticipantId,
          playerId: player.id,
        });

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
          // Update local state with new draft state; real-time sync updates other clients
          if (result.data?.draftState) {
            updateDraftState(result.data.draftState);
            updateAvailablePlayers(result.data.draftState, allPlayers);
            toast.success(`Successfully drafted ${player.name}!`, { duration: 2000 });
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

  // Handle drop from drag-to-roster: find player and trigger same pick flow as click
  const handlePlayerDrop = useCallback(
    (playerId: string) => {
      const player = allPlayers.find((p) => p.id === playerId);
      if (player) handlePlayerSelect(player);
    },
    [allPlayers, handlePlayerSelect]
  );

  // Handle timer expiration
  const handleTimerExpire = useCallback(() => {
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
          totalRounds={draftConfig?.totalRounds}
          showTimer={showTimer}
          timerSeconds={timerSeconds}
          onTimerExpire={handleTimerExpire}
          connectionState={connectionState}
        />

      {/* Participant switcher and logout */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-semibold text-slate-700">View as:</span>
          {participants.map((p) => {
            const isCurrentParticipant = p.id === currentParticipantId;
            const isOnClock = currentParticipantIdOnClock === p.id;
            return (
              <button
                key={p.id}
                onClick={async () => {
                  const res = await fetch('/api/auth/participant', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participantId: p.id }),
                  });
                  if (res.ok) window.location.href = '/draft';
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  isCurrentParticipant 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-white text-slate-700 hover:bg-gray-100'
                } ${isOnClock ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
                title={isOnClock ? `${p.name} - On the clock!` : p.name}
              >
                {p.name}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
          }}
          className="text-xs text-slate-600 hover:text-slate-800 underline"
        >
          Log out
        </button>
      </div>

      {/* Your turn banner - above board when it's the user's turn */}
      {isDraftActive && isMyTurn && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-center text-sm font-semibold animate-pulse-subtle">
          Your turn to pick – select a player below
        </div>
      )}

      {/* Main content area: resizable board | sidebar (desktop) and resizable history height */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Draft Board - takes remaining space */}
          <div className="flex-1 min-w-0 overflow-auto pb-16 lg:pb-0">
            <DraftBoard
              availablePlayers={availablePlayers}
              onPlayerSelect={handlePlayerSelect}
              disabled={!isMyTurn || !isDraftActive || isPickingPlayer}
              currentParticipantId={currentParticipantId}
              validRolesForPick={validRolesForPick}
              allowDrag={isMyTurn && isDraftActive && !isPickingPlayer}
            />
          </div>

          {/* Vertical resizer - desktop only */}
          <div
            className="hidden lg:block w-1 flex-shrink-0 bg-slate-200 hover:bg-emerald-400 cursor-col-resize transition-colors"
            role="separator"
            aria-label="Resize sidebar"
            onPointerDown={handleSidebarResizeStart}
          />

          {/* Roster Sidebar - Desktop only, resizable width */}
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

          {/* Mobile Roster Button - Fixed at bottom */}
          <button
            onClick={() => setShowMobileRoster(!showMobileRoster)}
            className="lg:hidden fixed bottom-20 right-4 z-30 bg-emerald-600 text-white px-4 py-3 rounded-full shadow-sm flex items-center gap-2 touch-manipulation active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-medium">My Roster ({currentRoster.length})</span>
          </button>
        </div>

        {/* Horizontal resizer for Pick History */}
        <div
          className="h-1.5 flex-shrink-0 bg-slate-200 hover:bg-emerald-400 cursor-row-resize transition-colors"
          role="separator"
          aria-label="Resize pick history"
          onPointerDown={handleHistoryResizeStart}
        />

        {/* Pick History - resizable height */}
        <div className="flex-shrink-0 overflow-hidden bg-white border-t border-slate-200" style={{ height: historyHeight }}>
          <PickHistory
            picks={draftState.picks}
            participants={participants}
            players={allPlayers}
            autoScroll={true}
          />
        </div>
      </div>

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
                Your turn — select a player
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-300 rounded-full px-6 py-3 shadow-lg">
              <p className="text-sm font-medium text-slate-600">
                Waiting for{' '}
                {participants.find(p => p.id === currentParticipantIdOnClock)?.name || 'other participant'}
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
            <p className="text-sm text-slate-700 mt-2">Making pick...</p>
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
              <h3 className="text-lg font-semibold text-slate-900">My Roster</h3>
              <button
                onClick={() => setShowMobileRoster(false)}
                className="p-2 rounded-full hover:bg-gray-100 touch-manipulation"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <RosterSidebar
                roster={currentRoster}
                draftConfig={draftConfig}
                participantName={currentParticipantName}
                onPlayerDrop={isMyTurn && isDraftActive ? handlePlayerDrop : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
