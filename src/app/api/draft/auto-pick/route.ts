import { NextRequest, NextResponse } from 'next/server';
import { handleDatabaseError } from '@/lib/db';
import { applyExpiredAutoPick } from '@/lib/draft-pick-service';
import { getActiveDraftState, getDraftState } from '@/lib/draft-state-manager';
import { getParticipantSession } from '@/lib/session';
import { getAdminSession } from '@/lib/admin-session';

/**
 * POST /api/draft/auto-pick
 * Apply a server-side pick when the current turn clock has expired.
 * Requires a participant or admin session; the server only acts if the clock expired.
 */
export async function POST(request: NextRequest) {
  try {
    const participant = await getParticipantSession();
    let admin = null;
    try {
      admin = await getAdminSession();
    } catch {
      admin = null;
    }
    if (!participant && !admin) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let draftStateId: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body.draftStateId === 'string') {
        draftStateId = body.draftStateId;
      }
    } catch {
      draftStateId = undefined;
    }

    if (participant && !admin) {
      const draft = draftStateId
        ? await getDraftState(draftStateId)
        : await getActiveDraftState();
      if (draft && !draft.participantOrder.includes(participant.participantId)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    const result = await applyExpiredAutoPick({ draftStateId });
    if (!result) {
      return NextResponse.json({
        success: true,
        data: { applied: false, message: 'No expired turn to auto-pick' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        applied: true,
        draftState: result.draftState,
        pick: result.pick,
        message: `Auto-picked ${result.pick.playerName} for ${result.pick.participantName}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('CONFLICT:') || message.includes('P2002')) {
      return NextResponse.json(
        {
          success: false,
          error: message.startsWith('CONFLICT:')
            ? message.replace('CONFLICT: ', '')
            : 'Pick already recorded',
        },
        { status: 409 }
      );
    }
    console.error('Error applying auto-pick:', error);
    return NextResponse.json(
      { success: false, error: handleDatabaseError(error) },
      { status: 500 }
    );
  }
}
