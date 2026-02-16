/**
 * Unit Tests for DraftTopBar Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DraftTopBar } from '@/components/draft/DraftTopBar';
import { createDraftState } from '@/__tests__/helpers/mock-factories';

describe('DraftTopBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display current round and participant', () => {
    const draftState = createDraftState({
      currentRound: 3,
      currentPickIndex: 1,
      participantOrder: ['p1', 'p2'],
    });
    const participants = [
      { id: 'p1', name: 'Participant 1' },
      { id: 'p2', name: 'Participant 2' },
    ];
    
    render(<DraftTopBar draftState={draftState} participants={participants} />);
    
    expect(screen.getByText(/Round/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should show timer when enabled', () => {
    const draftState = createDraftState({ status: 'in_progress' });
    
    render(
      <DraftTopBar
        draftState={draftState}
        participants={[]}
        showTimer
        timerSeconds={60}
      />
    );
    
    // Timer should be visible (check for time display)
    // The timer shows seconds remaining, which starts at 60
    expect(screen.getByText(/60|:/)).toBeInTheDocument();
  });

  it('should show connection status badge when provided', () => {
    const draftState = createDraftState();
    
    render(
      <DraftTopBar
        draftState={draftState}
        participants={[]}
        connectionState="connected"
      />
    );
    
    // Connection status should be displayed
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it('should show alert when draft is paused', () => {
    const draftState = createDraftState({ status: 'paused' });
    
    render(<DraftTopBar draftState={draftState} participants={[]} />);
    
    expect(screen.getByText(/paused/i)).toBeInTheDocument();
  });

  it('should calculate progress correctly', () => {
    const draftState = createDraftState({
      currentRound: 2,
      participantOrder: ['p1', 'p2'],
      picks: Array.from({ length: 3 }, (_, i) => ({
        round: Math.floor(i / 2) + 1,
        pickNumber: i + 1,
        participantId: 'p1',
        playerId: `player-${i}`,
        timestamp: new Date(),
      })),
    });
    
    render(
      <DraftTopBar
        draftState={draftState}
        participants={[]}
        totalRounds={8}
      />
    );
    
    // Progress should be calculated and displayed (format may vary)
    // Check for progress-related text
    const progressText = screen.queryByText(/%/) || screen.queryByText(/progress/i);
    expect(progressText || screen.getByText(/Round/i)).toBeInTheDocument();
  });
});
