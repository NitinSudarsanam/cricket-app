import { NextRequest, NextResponse } from 'next/server';
import { handleDatabaseError } from '@/lib/db';
import { applyExpiredAutoPick } from '@/lib/draft-pick-service';

/**
 * POST /api/draft/auto-pick
 * Apply a server-side pick when the current turn clock has expired.
 * Anyone may trigger it; the server only acts if the clock is actually expired.
 */
export async function POST(request: NextRequest) {
  try {
    let draftStateId: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body.draftStateId === 'string') {
        draftStateId = body.draftStateId;
      }
    } catch {
      draftStateId = undefined;
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
    if (message.startsWith('CONFLICT:')) {
      return NextResponse.json(
        { success: false, error: message.replace('CONFLICT: ', '') },
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
