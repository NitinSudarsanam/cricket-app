'use client';

import { useEffect, useState } from 'react';
import { DraftState } from '@/types';

export interface DraftTopBarProps {
  draftState: DraftState;
  participants: Array<{ id: string; name: string }>;
  showTimer?: boolean;
  timerSeconds?: number;
  onTimerExpire?: () => void;
}

export function DraftTopBar({
  draftState,
  participants,
  showTimer = false,
  timerSeconds = 60,
  onTimerExpire,
}: DraftTopBarProps) {
  const [timeRemaining, setTimeRemaining] = useState(timerSeconds);

  // Get current participant on the clock
  const currentParticipantId = draftState.participantOrder[draftState.currentPickIndex];
  const currentParticipant = participants.find(p => p.id === currentParticipantId);

  // Calculate draft progress
  const totalPicks = draftState.participantOrder.length * draftState.currentRound;
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
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          {/* Left: Round and participant info */}
          <div className="flex items-center gap-4 md:gap-6 overflow-x-auto">
            {/* Round number */}
            <div className="flex flex-col flex-shrink-0">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Round</span>
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                {draftState.currentRound}
              </span>
            </div>

            {/* Divider */}
            <div className="h-10 md:h-12 w-px bg-gray-300 flex-shrink-0" />

            {/* Current participant */}
            <div className="flex flex-col flex-shrink-0 min-w-0">
              <span className="text-xs text-gray-500 uppercase tracking-wide">On the Clock</span>
              <span className="text-base md:text-lg font-semibold text-blue-600 truncate">
                {currentParticipant?.name || 'Unknown'}
              </span>
            </div>

            {/* Timer */}
            {showTimer && draftState.status === 'in_progress' && (
              <>
                <div className="h-10 md:h-12 w-px bg-gray-300 flex-shrink-0" />
                <div className="flex flex-col flex-shrink-0">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Time Left</span>
                  <span
                    className={`text-xl md:text-2xl font-bold ${
                      timeRemaining <= 10 ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {timeRemaining}s
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Right: Draft progress */}
          <div className="flex flex-col gap-2 min-w-[180px] md:min-w-[200px]">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Draft Progress</span>
              <span className="font-medium">
                {completedPicks} / {totalPicks} picks
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status indicator */}
        {draftState.status === 'paused' && (
          <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800 font-medium">
              ⏸️ Draft is paused
            </p>
          </div>
        )}

        {draftState.status === 'completed' && (
          <div className="mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 font-medium">
              ✅ Draft completed!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
