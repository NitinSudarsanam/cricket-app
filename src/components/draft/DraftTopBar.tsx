'use client';

import { useEffect, useState } from 'react';
import { DraftState } from '@/types';

export interface DraftTopBarProps {
  draftState: DraftState;
  participants: Array<{ id: string; name: string }>;
  /** Total rounds in the draft; used for progress. If omitted, progress uses current round. */
  totalRounds?: number;
  showTimer?: boolean;
  timerSeconds?: number;
  onTimerExpire?: () => void;
  /** Connection state for real-time sync; when provided, shows a compact pill in the bar */
  connectionState?: 'connected' | 'disconnected' | 'connecting';
}

export function DraftTopBar({
  draftState,
  participants,
  totalRounds,
  showTimer = false,
  timerSeconds = 60,
  onTimerExpire,
  connectionState,
}: DraftTopBarProps) {
  const [timeRemaining, setTimeRemaining] = useState(timerSeconds);

  // Get current participant on the clock (respects snake vs linear draft order)
  const orderType = draftState.draftOrderType ?? 'snake';
  const isSnakeRound = orderType === 'snake' && draftState.currentRound % 2 === 0;
  const currentParticipantId = isSnakeRound
    ? draftState.participantOrder[draftState.participantOrder.length - 1 - draftState.currentPickIndex]
    : draftState.participantOrder[draftState.currentPickIndex];
  const currentParticipant = participants.find(p => p.id === currentParticipantId);

  // Calculate draft progress (total picks for the whole draft)
  const totalPicks =
    typeof totalRounds === 'number' && totalRounds > 0
      ? draftState.participantOrder.length * totalRounds
      : draftState.participantOrder.length * draftState.currentRound;
  const completedPicks = draftState.picks.length;
  const progressPercentage = totalPicks > 0 ? (completedPicks / totalPicks) * 100 : 0;

  // Timer logic
  useEffect(() => {
    if (!showTimer || draftState.status !== 'in_progress') {
      return;
    }

    setTimeRemaining(timerSeconds);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          onTimerExpire?.();
          return timerSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showTimer, timerSeconds, draftState.picks.length, draftState.status, onTimerExpire]);

  // Reset timer when a new pick is made
  useEffect(() => {
    if (showTimer) {
      setTimeRemaining(timerSeconds);
    }
  }, [draftState.picks.length, showTimer, timerSeconds]);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-4 md:gap-6 overflow-x-auto">
            <div className="flex flex-col flex-shrink-0">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Round</span>
              <span className="text-xl md:text-2xl font-bold text-slate-900">
                {draftState.currentRound}
              </span>
            </div>
            <div className="h-10 md:h-12 w-px bg-slate-300 flex-shrink-0" />
            <div className="flex flex-col flex-shrink-0 min-w-0">
              <span className="text-xs text-slate-500 uppercase tracking-wide">On the Clock</span>
              <span className="text-base md:text-lg font-semibold text-emerald-600 truncate">
                {currentParticipant?.name || 'Unknown'}
              </span>
            </div>
            {showTimer && draftState.status === 'in_progress' && (
              <>
                <div className="h-10 md:h-12 w-px bg-slate-300 flex-shrink-0" />
                <div className="flex flex-col flex-shrink-0">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Time Left</span>
                  <span
                    className={`text-xl md:text-2xl font-bold ${
                      timeRemaining <= 10 ? 'text-red-600' : 'text-slate-900'
                    }`}
                  >
                    {timeRemaining}s
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 min-w-0">
            {connectionState !== undefined && (
              <span
                className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                  connectionState === 'connected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : connectionState === 'connecting'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                }`}
                aria-live="polite"
              >
                {connectionState === 'connected'
                  ? 'Connected'
                  : connectionState === 'connecting'
                    ? 'Reconnecting…'
                    : 'Disconnected'}
              </span>
            )}
            <div className="flex flex-col gap-2 min-w-[140px] md:min-w-[180px] flex-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Draft Progress</span>
                <span className="font-medium">
                  {completedPicks} / {totalPicks} picks
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        {draftState.status === 'paused' && (
          <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800 font-medium">Draft is paused</p>
          </div>
        )}
        {draftState.status === 'completed' && (
          <div className="mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md">
            <p className="text-sm text-emerald-800 font-medium">Draft completed</p>
          </div>
        )}
      </div>
    </div>
  );
}
