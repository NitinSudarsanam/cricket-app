import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraftMonitor } from '@/components/admin/DraftMonitor';
import { createDraftState, createPlayer } from '@/__tests__/helpers/mock-factories';
import { useDraftSync } from '@/hooks/useDraftSync';

const refreshDraftState = vi.fn();

vi.mock('@/hooks/useDraftSync', () => ({
  useDraftSync: vi.fn(({ initialDraftState }: { initialDraftState: unknown }) => ({
    draftState: initialDraftState,
    refreshDraftState,
    error: null,
  })),
}));

describe('DraftMonitor', () => {
  const players = [createPlayer({ id: 'pl1', name: 'Kohli', team: 'RCB', role: 'Bat' })];
  const participants = [{ id: 'p1', name: 'Alice', email: 'a@example.com' }];

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
    expect(useDraftSync).toHaveBeenCalledWith(
      expect.objectContaining({ enableAutoPick: false, enabled: true })
    );
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

  it('pauses the live draft then refreshes sync state', async () => {
    const draftState = createDraftState({
      id: 'draft-1',
      status: 'in_progress',
      participantOrder: ['p1'],
    });

    render(
      <DraftMonitor
        initialDraftState={draftState}
        initialPlayers={players}
        initialParticipants={participants}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Pause Draft' }));

    expect(fetch).toHaveBeenCalledWith('/api/draft/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause', draftStateId: 'draft-1' }),
    });
    expect(refreshDraftState).toHaveBeenCalled();
  });
});
