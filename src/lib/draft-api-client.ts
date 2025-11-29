/**
 * Client-side API utilities for draft operations
 * Provides type-safe wrappers around draft API endpoints
 */

'use client';

import { DraftState } from '@/types';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: string[];
}

export interface MakePickRequest {
  participantId: string;
  playerId: string;
}

export interface MakePickResponse {
  draftState: DraftState;
  pick: {
    participantId: string;
    participantName: string;
    playerId: string;
    playerName: string;
    playerTeam: string;
    playerRole: string;
    round: number;
    pickNumber: number;
    timestamp: Date;
  };
  message: string;
}

export interface StartDraftRequest {
  participantIds: string[];
  draftOrder?: 'linear' | 'snake';
}

export interface StartDraftResponse {
  draftState: DraftState;
  draftConfig: any;
  message: string;
}

/**
 * Make a player pick during the draft
 */
export async function makePick(
  request: MakePickRequest
): Promise<ApiResponse<MakePickResponse>> {
  try {
    const response = await fetch('/api/draft/pick', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error making pick:', error);
    return {
      success: false,
      error: 'Failed to make pick. Please try again.',
    };
  }
}

/**
 * Start a new draft
 */
export async function startDraft(
  request: StartDraftRequest
): Promise<ApiResponse<StartDraftResponse>> {
  try {
    const response = await fetch('/api/draft/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error starting draft:', error);
    return {
      success: false,
      error: 'Failed to start draft. Please try again.',
    };
  }
}

/**
 * Get current draft state
 */
export async function getDraftState(): Promise<ApiResponse<DraftState>> {
  try {
    const response = await fetch('/api/draft/state');
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching draft state:', error);
    return {
      success: false,
      error: 'Failed to fetch draft state. Please try again.',
    };
  }
}

/**
 * Reset the draft (admin only)
 */
export async function resetDraft(
  adminSecret?: string
): Promise<ApiResponse<{ draftState: DraftState; message: string }>> {
  try {
    const response = await fetch('/api/draft/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminSecret && { 'x-admin-secret': adminSecret }),
      },
      body: JSON.stringify({}),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error resetting draft:', error);
    return {
      success: false,
      error: 'Failed to reset draft. Please try again.',
    };
  }
}

/**
 * Pause or resume the draft (admin only)
 */
export async function pauseResumeDraft(
  action: 'pause' | 'resume',
  adminSecret?: string
): Promise<ApiResponse<{ draftState: DraftState; message: string }>> {
  try {
    const response = await fetch('/api/draft/pause', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminSecret && { 'x-admin-secret': adminSecret }),
      },
      body: JSON.stringify({ action }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error pausing/resuming draft:', error);
    return {
      success: false,
      error: 'Failed to pause/resume draft. Please try again.',
    };
  }
}

/**
 * Update participant presence
 */
export async function updatePresence(
  participantId: string,
  participantName: string,
  status: 'online' | 'offline'
): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/draft/presence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participantId,
        participantName,
        status,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating presence:', error);
    return {
      success: false,
      error: 'Failed to update presence.',
    };
  }
}
