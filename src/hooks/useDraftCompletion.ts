'use client';

import { useEffect, useState } from 'react';
import type { DraftState } from '@/types';
import type { DraftResultsSnapshot } from '@/lib/draft-results-export';

export function useDraftCompletion(draftState: DraftState | null) {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [draftResults, setDraftResults] = useState<DraftResultsSnapshot | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    if (draftState?.status !== 'completed') {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setLoadingResults(true);
    setFetchFailed(false);

    fetch(`/api/draft/results?draftStateId=${draftState.id}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setDraftResults(result.data);
          setShowCompletionModal(true);
        } else {
          setFetchFailed(true);
        }
      })
      .catch((error) => {
        if (cancelled || error?.name === 'AbortError') return;
        console.error('Error fetching draft results:', error);
        setFetchFailed(true);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingResults(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [draftState?.status, draftState?.id]);

  return {
    showCompletionModal,
    draftResults,
    loadingResults,
    fetchFailed,
    closeCompletionModal: () => setShowCompletionModal(false),
  };
}
