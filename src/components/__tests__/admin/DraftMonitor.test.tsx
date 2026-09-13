import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DraftMonitor } from '@/components/admin/DraftMonitor';
import { createDraftState, createPlayer } from '@/__tests__/helpers/mock-factories';

const refreshDraftState = vi.fn();

vi.mock('@/hooks/useDraftSync', () => ({
  useDraftSync: ({ initialDraftState }: { initialDraftState: unknown }) => ({
    draftState: initialDraftState,
    refreshDraftState,
    error: null,
  }),
}));

describe('DraftMonitor', () => {
  const players = [createPlayer({ id: 'pl1', name: 'Kohli', team: 'RCB', role: 'Bat' })];
  const participants = [{ id: 'p1', name: 'Alice', email: 'a@example.com' }];

  it('renders the empty draft state from server props without polling rosters', () => {
    render(
      <DraftMonitor
        initialDraftState={null}
        initialPlayers={players}
        initialParticipants={participants}
      />
    );

    expect(screen.getByText('No Active Draft')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Players:')).toBeInTheDocument();
  });

  it('shows live roster counts derived from draft picks', () => {
    const draftState = createDraftState({
      status: 'in_progress',
      participantOrder: ['p1'],
      currentPickIndex: 0,
      picks: [{ round: 1, pickNumber: 1, participantId: 'p1', playerId: 'pl1', timestamp: new Date() }],
    });

    render(
      <DraftMonitor
        initialDraftState={draftState}
        initialPlayers={players}
        initialParticipants={participants}
      />
    );

    expect(screen.getByText('Draft Status')).toBeInTheDocument();
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getByText('Kohli (RCB - Bat)')).toBeInTheDocument();
  });
});
