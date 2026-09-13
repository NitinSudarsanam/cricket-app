'use client';

import { useEffect, useState } from 'react';
import type { DraftState } from '@/types';
import type { DraftResultsSnapshot } from '@/lib/draft-results-export';

export function useDraftCompletion(draftState: DraftState | null) {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [draftResults, setDraftResults] = useState<DraftResultsSnapshot | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (draftState?.status !== 'completed' || draftResults || loadingResults) {
      return;
    }

    setLoadingResults(true);
    fetch(`/api/draft/results?draftStateId=${draftState.id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setDraftResults(result.data);
          setShowCompletionModal(true);
        }
      })
      .catch((error) => {
        console.error('Error fetching draft results:', error);
      })
      .finally(() => {
        setLoadingResults(false);
      });
  }, [draftState?.status, draftState?.id, draftResults, loadingResults]);

  return {
    showCompletionModal,
    draftResults,
    closeCompletionModal: () => setShowCompletionModal(false),
  };
}
