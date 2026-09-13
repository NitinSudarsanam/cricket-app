import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useDraftCompletion } from '@/hooks/useDraftCompletion';
import { createDraftConfig, createDraftState } from '@/__tests__/helpers/mock-factories';

describe('useDraftCompletion', () => {
  const snapshot = {
    draftState: {
      id: 'draft-1',
      status: 'completed',
      startedAt: null,
      completedAt: null,
      totalRounds: 8,
    },
    draftConfig: createDraftConfig(),
    participantRosters: [],
    allParticipantsMeetRequirements: true,
    totalPicks: 8,
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not fetch results while the draft is still in progress', () => {
    renderHook(() => useDraftCompletion(createDraftState({ status: 'in_progress' })));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('loads results and opens the completion modal when the draft completes', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: true, data: snapshot }),
    } as Response);

    const { result } = renderHook(() =>
      useDraftCompletion(createDraftState({ id: 'draft-1', status: 'completed' }))
    );

    await waitFor(() => {
      expect(result.current.showCompletionModal).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/draft/results?draftStateId=draft-1',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(result.current.draftResults).toEqual(snapshot);
  });

  it('does not retry when the results request fails until retry or draft id changes', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: false, error: 'boom' }),
    } as Response);

    const { result, rerender } = renderHook(
      ({ state }) => useDraftCompletion(state),
      { initialProps: { state: createDraftState({ id: 'draft-1', status: 'completed' }) } }
    );

    await waitFor(() => {
      expect(result.current.fetchFailed).toBe(true);
    });

    rerender({ state: createDraftState({ id: 'draft-1', status: 'completed' }) });
    await act(async () => {
      await Promise.resolve();
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.retryResults();
    });
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    rerender({ state: createDraftState({ id: 'draft-2', status: 'completed' }) });
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3);
    });
    expect(result.current.showCompletionModal).toBe(false);
    expect(result.current.draftResults).toBeNull();
  });

  it('clears a successful completion modal when the draft id changes', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({ success: true, data: snapshot }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'missing' }),
      } as Response);

    const { result, rerender } = renderHook(
      ({ state }) => useDraftCompletion(state),
      { initialProps: { state: createDraftState({ id: 'draft-1', status: 'completed' }) } }
    );

    await waitFor(() => {
      expect(result.current.showCompletionModal).toBe(true);
    });

    rerender({ state: createDraftState({ id: 'draft-2', status: 'completed' }) });

    expect(result.current.showCompletionModal).toBe(false);
    expect(result.current.draftResults).toBeNull();

    await waitFor(() => {
      expect(result.current.fetchFailed).toBe(true);
    });
    expect(result.current.showCompletionModal).toBe(false);
  });

  it('keeps the retry banner visible while a retry is in flight', async () => {
    let resolveRetry: (value: unknown) => void = () => undefined;
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'boom' }),
      } as Response)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRetry = resolve;
          }) as never
      );

    const { result } = renderHook(() =>
      useDraftCompletion(createDraftState({ id: 'draft-1', status: 'completed' }))
    );

    await waitFor(() => {
      expect(result.current.fetchFailed).toBe(true);
    });

    act(() => {
      result.current.retryResults();
    });

    await waitFor(() => {
      expect(result.current.loadingResults).toBe(true);
    });
    expect(result.current.fetchFailed).toBe(true);

    await act(async () => {
      resolveRetry({ json: async () => ({ success: true, data: snapshot }) });
    });

    await waitFor(() => {
      expect(result.current.showCompletionModal).toBe(true);
    });
    expect(result.current.fetchFailed).toBe(false);
  });

  it('clears the completion modal when the draft is reset', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: true, data: snapshot }),
    } as Response);

    const { result, rerender } = renderHook(
      ({ state }) => useDraftCompletion(state),
      { initialProps: { state: createDraftState({ id: 'draft-1', status: 'completed' }) } }
    );

    await waitFor(() => {
      expect(result.current.showCompletionModal).toBe(true);
    });

    rerender({ state: createDraftState({ id: 'draft-1', status: 'not_started', picks: [] }) });

    expect(result.current.showCompletionModal).toBe(false);
    expect(result.current.draftResults).toBeNull();
    expect(result.current.fetchFailed).toBe(false);
  });

  it('does not retry after a thrown results fetch', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() =>
      useDraftCompletion(createDraftState({ id: 'draft-1', status: 'completed' }))
    );

    await waitFor(() => {
      expect(result.current.fetchFailed).toBe(true);
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('aborts an in-flight results request on unmount', async () => {
    let abortSignal: AbortSignal | undefined;
    vi.mocked(fetch).mockImplementation((_url, init) => {
      abortSignal = init?.signal;
      return new Promise(() => undefined);
    });

    const { unmount } = renderHook(() =>
      useDraftCompletion(createDraftState({ id: 'draft-1', status: 'completed' }))
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    unmount();
    expect(abortSignal?.aborted).toBe(true);
  });
});
