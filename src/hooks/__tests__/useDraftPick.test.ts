import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDraftPick } from '@/hooks/useDraftPick';
import { makePick } from '@/lib/draft-api-client';
import { createDraftState, createPlayer } from '@/__tests__/helpers/mock-factories';

const { toast } = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(() => 'toast-error-1'),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('@/lib/draft-api-client', () => ({
  makePick: vi.fn(),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => toast,
}));

describe('useDraftPick', () => {
  const player = createPlayer({ id: 'player-1', name: 'Kohli' });
  const draftState = createDraftState({ id: 'draft-1', picks: [] });
  const updateDraftState = vi.fn();
  const updateAvailablePlayers = vi.fn();
  const refreshDraftState = vi.fn().mockResolvedValue(undefined);

  const renderPick = (overrides: Partial<Parameters<typeof useDraftPick>[0]> = {}) =>
    renderHook(() =>
      useDraftPick({
        draftState,
        isMyTurn: true,
        isDraftActive: true,
        currentParticipantId: 'p1',
        allPlayers: [player],
        updateDraftState,
        updateAvailablePlayers,
        refreshDraftState,
        ...overrides,
      })
    );

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('does not pick when it is not the participant turn', async () => {
    const { result } = renderPick({ isMyTurn: false });

    await act(async () => {
      await result.current.handlePlayerSelect(player);
    });

    expect(makePick).not.toHaveBeenCalled();
  });

  it('updates draft state and toasts on a successful pick', async () => {
    const nextState = createDraftState({
      picks: [{ round: 1, pickNumber: 1, participantId: 'p1', playerId: player.id, timestamp: new Date() }],
    });
    vi.mocked(makePick).mockResolvedValue({
      success: true,
      data: { draftState: nextState },
    } as never);

    const { result } = renderPick();

    await act(async () => {
      await result.current.handlePlayerSelect(player);
    });

    expect(makePick).toHaveBeenCalledWith({
      participantId: 'p1',
      playerId: 'player-1',
    });
    expect(updateDraftState).toHaveBeenCalledWith(nextState);
    expect(updateAvailablePlayers).toHaveBeenCalledWith(nextState, [player]);
    expect(toast.success).toHaveBeenCalledWith('Successfully drafted Kohli!', { duration: 2000 });
    expect(result.current.pickError).toBeNull();
  });

  it('sets a pick error and retry toast when the API rejects the pick', async () => {
    vi.mocked(makePick).mockResolvedValue({
      success: false,
      validationErrors: ['Already drafted'],
    } as never);

    const { result } = renderPick();

    await act(async () => {
      await result.current.handlePlayerSelect(player);
    });

    expect(result.current.pickError).toBe('Already drafted');
    expect(toast.error).toHaveBeenCalledWith(
      'Already drafted',
      expect.objectContaining({ duration: 5000, onRetry: expect.any(Function) })
    );
  });

  it('clears a stale pick error when an admin reset rewinds picks', async () => {
    vi.mocked(makePick).mockResolvedValue({
      success: false,
      error: 'Network timeout',
    } as never);

    const pickedState = createDraftState({
      id: draftState.id,
      picks: [{ round: 1, pickNumber: 1, participantId: 'p1', playerId: player.id, timestamp: new Date() }],
    });

    const { result, rerender } = renderHook(
      ({ state }) =>
        useDraftPick({
          draftState: state,
          isMyTurn: true,
          isDraftActive: true,
          currentParticipantId: 'p1',
          allPlayers: [player],
          updateDraftState,
          updateAvailablePlayers,
          refreshDraftState,
        }),
      { initialProps: { state: pickedState } }
    );

    await act(async () => {
      await result.current.handlePlayerSelect(player);
    });
    expect(result.current.pickError).toBe('Network timeout');

    rerender({
      state: createDraftState({ id: draftState.id, picks: [], status: 'not_started' }),
    });

    expect(result.current.pickError).toBeNull();
  });

  it('ignores a late pick success after a zero-pick admin reset', async () => {
    let resolvePick: (value: unknown) => void = () => undefined;
    vi.mocked(makePick).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePick = resolve;
        }) as never
    );

    const emptyLive = createDraftState({ id: 'draft-1', status: 'in_progress', picks: [] });
    const nextState = createDraftState({
      id: 'draft-1',
      status: 'in_progress',
      picks: [{ round: 1, pickNumber: 1, participantId: 'p1', playerId: player.id, timestamp: new Date() }],
    });

    const { result, rerender } = renderHook(
      ({ state }) =>
        useDraftPick({
          draftState: state,
          isMyTurn: true,
          isDraftActive: true,
          currentParticipantId: 'p1',
          allPlayers: [player],
          updateDraftState,
          updateAvailablePlayers,
          refreshDraftState,
        }),
      { initialProps: { state: emptyLive } }
    );

    let pickPromise: Promise<void> = Promise.resolve();
    act(() => {
      pickPromise = result.current.handlePlayerSelect(player);
    });

    rerender({
      state: createDraftState({ id: 'draft-1', status: 'not_started', picks: [] }),
    });

    await act(async () => {
      resolvePick({ success: true, data: { draftState: nextState } });
      await pickPromise;
    });

    expect(updateDraftState).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('refreshes instead of applying a late auto-pick after reset', async () => {
    let resolveAuto: (value: unknown) => void = () => undefined;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAuto = resolve;
        }) as never
    );

    const live = createDraftState({ id: 'draft-1', status: 'in_progress', picks: [] });
    const { result, rerender } = renderHook(
      ({ state }) =>
        useDraftPick({
          draftState: state,
          isMyTurn: true,
          isDraftActive: true,
          currentParticipantId: 'p1',
          allPlayers: [player],
          updateDraftState,
          updateAvailablePlayers,
          refreshDraftState,
        }),
      { initialProps: { state: live } }
    );

    let expirePromise: Promise<void> = Promise.resolve();
    act(() => {
      expirePromise = result.current.handleTimerExpire();
    });

    rerender({
      state: createDraftState({ id: 'draft-1', status: 'not_started', picks: [] }),
    });

    await act(async () => {
      resolveAuto({
        json: async () => ({
          success: true,
          data: {
            applied: true,
            draftState: createDraftState({
              id: 'draft-1',
              picks: [{ round: 1, pickNumber: 1, participantId: 'p2', playerId: player.id, timestamp: new Date() }],
            }),
            pick: { playerName: 'Kohli' },
          },
        }),
      });
      await expirePromise;
    });

    expect(updateDraftState).not.toHaveBeenCalled();
    expect(refreshDraftState).toHaveBeenCalled();
  });

  it('ignores a late pick failure after the board has already advanced', async () => {
    let resolvePick: (value: unknown) => void = () => undefined;
    vi.mocked(makePick).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePick = resolve;
        }) as never
    );

    const { result, rerender } = renderHook(
      ({ state }) =>
        useDraftPick({
          draftState: state,
          isMyTurn: true,
          isDraftActive: true,
          currentParticipantId: 'p1',
          allPlayers: [player],
          updateDraftState,
          updateAvailablePlayers,
          refreshDraftState,
        }),
      { initialProps: { state: draftState } }
    );

    let pickPromise: Promise<void> = Promise.resolve();
    act(() => {
      pickPromise = result.current.handlePlayerSelect(player);
    });

    rerender({
      state: createDraftState({
        id: draftState.id,
        picks: [{ round: 1, pickNumber: 1, participantId: 'p1', playerId: player.id, timestamp: new Date() }],
      }),
    });

    await act(async () => {
      resolvePick({ success: false, error: 'too late' });
      await pickPromise;
    });

    expect(result.current.pickError).toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('clears a stale pick error when pick count advances from sync', async () => {
    vi.mocked(makePick).mockResolvedValue({
      success: false,
      error: 'Network timeout',
    } as never);

    const { result, rerender } = renderHook(
      ({ state }) =>
        useDraftPick({
          draftState: state,
          isMyTurn: true,
          isDraftActive: true,
          currentParticipantId: 'p1',
          allPlayers: [player],
          updateDraftState,
          updateAvailablePlayers,
          refreshDraftState,
        }),
      { initialProps: { state: draftState } }
    );

    await act(async () => {
      await result.current.handlePlayerSelect(player);
    });
    expect(result.current.pickError).toBe('Network timeout');

    rerender({
      state: createDraftState({
        id: draftState.id,
        picks: [{ round: 1, pickNumber: 1, participantId: 'p1', playerId: player.id, timestamp: new Date() }],
      }),
    });

    expect(result.current.pickError).toBeNull();
  });

  it('clears pick errors after five seconds', async () => {
    vi.mocked(makePick).mockResolvedValue({
      success: false,
      error: 'Failed to make pick',
    } as never);

    const { result } = renderPick();

    await act(async () => {
      await result.current.handlePlayerSelect(player);
    });
    expect(result.current.pickError).toBe('Failed to make pick');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.pickError).toBeNull();
  });

  it('applies an auto-pick and clears the local pick error', async () => {
    vi.mocked(makePick).mockResolvedValue({
      success: false,
      error: 'Clock expired',
    } as never);
    const nextState = createDraftState({
      picks: [{ round: 1, pickNumber: 1, participantId: 'p2', playerId: player.id, timestamp: new Date() }],
    });
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({
        success: true,
        data: { applied: true, draftState: nextState, pick: { playerName: 'Kohli' } },
      }),
    } as Response);

    const { result } = renderPick();

    await act(async () => {
      await result.current.handlePlayerSelect(player);
    });
    expect(result.current.pickError).toBe('Clock expired');

    await act(async () => {
      await result.current.handleTimerExpire();
    });

    expect(fetch).toHaveBeenCalledWith('/api/draft/auto-pick', expect.objectContaining({ method: 'POST' }));
    expect(updateDraftState).toHaveBeenCalledWith(nextState);
    expect(toast.info).toHaveBeenCalledWith('Auto-picked Kohli', { duration: 3000 });
    expect(result.current.pickError).toBeNull();
  });

  it('refreshes draft state when auto-pick is not applied', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: true, data: { applied: false } }),
    } as Response);

    const { result } = renderPick();

    await act(async () => {
      await result.current.handleTimerExpire();
    });

    expect(refreshDraftState).toHaveBeenCalled();
  });

  it('drops a player by id through the same pick path', async () => {
    vi.mocked(makePick).mockResolvedValue({ success: false, error: 'nope' } as never);
    const { result } = renderPick();

    await act(async () => {
      result.current.handlePlayerDrop('player-1');
    });

    expect(makePick).toHaveBeenCalledWith({ participantId: 'p1', playerId: 'player-1' });
  });
});
