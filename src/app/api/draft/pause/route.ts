import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';
import { pauseDraftState, resumeDraftState, getActiveDraftState } from '@/lib/draft-state-manager';
import { broadcastEvent, EVENTS } from '@/lib/pusher-server';
import { requireAdmin } from '@/lib/auth-helpers';

/**
 * POST /api/draft/pause
 * Pause or resume the draft (admin only)
 * 
 * Request body:
 *   - action: 'pause' | 'resume' - Action to perform
 *   - draftStateId: string (optional) - Specific draft state ID
 *   - adminSecret: string (optional) - Admin authentication secret
 * 
 * Requirements: 10.5
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body safely - it might be empty
    let body: any = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (parseError) {
      // Body is empty or invalid JSON, use empty object
      body = {};
    }

    // Admin authentication (defense-in-depth - middleware also checks)
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { success: false, error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    // Validate action - default to 'pause' if not specified
    const action = body.action || 'pause';
    if (!action || (action !== 'pause' && action !== 'resume')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be "pause" or "resume".'
        },
        { status: 400 }
      );
    }

    let draftStateId = body.draftStateId;

    // If no specific draft state ID provided, find the active one
    if (!draftStateId) {
      const activeDraft = await getActiveDraftState();

      if (!activeDraft) {
        return NextResponse.json(
          {
            success: false,
            error: 'No active draft found'
          },
          { status: 404 }
        );
      }

      draftStateId = activeDraft.id;
    }

    // Verify draft state exists
    const draftState = await prisma.draftState.findUnique({
      where: { id: draftStateId }
    });

    if (!draftState) {
      return NextResponse.json(
        {
          success: false,
          error: 'Draft state not found'
        },
        { status: 404 }
      );
    }

    // Validate state transitions
    if (action === 'pause') {
      if (draftState.status === 'paused') {
        return NextResponse.json(
          {
            success: false,
            error: 'Draft is already paused'
          },
          { status: 400 }
        );
      }

      if (draftState.status !== 'in_progress') {
        return NextResponse.json(
          {
            success: false,
            error: 'Can only pause a draft that is in progress'
          },
          { status: 400 }
        );
      }

      // Pause the draft
      const pausedState = await pauseDraftState(draftStateId);

      // Broadcast state update to all clients
      await broadcastEvent(EVENTS.STATE_UPDATE, {
        draftState: pausedState,
        message: 'Draft paused'
      });

      return NextResponse.json({
        success: true,
        data: {
          draftState: pausedState,
          message: 'Draft paused successfully'
        }
      });
    } else {
      // Resume action
      if (draftState.status !== 'paused') {
        return NextResponse.json(
          {
            success: false,
            error: 'Can only resume a paused draft'
          },
          { status: 400 }
        );
      }

      // Resume the draft
      const resumedState = await resumeDraftState(draftStateId);

      // Broadcast state update to all clients
      await broadcastEvent(EVENTS.STATE_UPDATE, {
        draftState: resumedState,
        message: 'Draft resumed'
      });

      return NextResponse.json({
        success: true,
        data: {
          draftState: resumedState,
          message: 'Draft resumed successfully'
        }
      });
    }
  } catch (error) {
    console.error('Error pausing/resuming draft:', error);
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}
