'use client';

import { useEffect, useState } from 'react';
import { DraftState } from '@/types';
import { Badge, Alert } from '@/components/ui';

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
    <div className="header-bar">
      <div className="container-page py-3 md:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div className="flex-center gap-4 md:gap-6 overflow-x-auto">
            <div className="stat-group">
              <span className="stat-label">Round</span>
              <span className="stat-value">
                {draftState.currentRound}
              </span>
            </div>
            <div className="divider-vertical h-10 md:h-12" />
            <div className="stat-group min-w-0">
              <span className="stat-label">On the Clock</span>
              <span className="stat-value-highlight">
                {currentParticipant?.name || 'Unknown'}
              </span>
            </div>
            {showTimer && draftState.status === 'in_progress' && (
              <>
                <div className="divider-vertical h-10 md:h-12" />
                <div className="stat-group">
                  <span className="stat-label">Time Left</span>
                  <span
                    className={`stat-value ${
                      timeRemaining <= 10 ? 'text-red-600' : ''
                    }`}
                  >
                    {timeRemaining}s
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex-center gap-3 min-w-0">
            {connectionState !== undefined && (
              <Badge
                variant={
                  connectionState === 'connected'
                    ? 'success'
                    : connectionState === 'connecting'
                    ? 'warning'
                    : 'danger'
                }
                aria-live="polite"
              >
                {connectionState === 'connected'
                  ? 'Connected'
                  : connectionState === 'connecting'
                  ? 'Reconnecting…'
                  : 'Disconnected'}
              </Badge>
            )}
            <div className="flex-stack gap-2 min-w-[140px] md:min-w-[180px] flex-1">
              <div className="flex-center-between text-xs text-slate-600">
                <span>Draft Progress</span>
                <span className="font-medium">
                  {completedPicks} / {totalPicks} picks
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        {draftState.status === 'paused' && (
          <Alert variant="warning" className="mt-3">
            Draft is paused
          </Alert>
        )}
        {draftState.status === 'completed' && (
          <Alert variant="success" className="mt-3">
            Draft completed
          </Alert>
        )}
      </div>
    </div>
  );
}
