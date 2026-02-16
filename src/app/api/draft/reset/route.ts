import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleDatabaseError } from '@/lib/db';
import { resetDraftState } from '@/lib/draft-state-manager';
import { broadcastEvent, EVENTS } from '@/lib/pusher-server';
import { requireAdmin } from '@/lib/auth-helpers';

/**
 * POST /api/draft/reset
 * Reset the draft (admin only)
 * 
 * Request body:
 *   - draftStateId: string (optional) - Specific draft state ID to reset
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

    let draftStateId = body.draftStateId;

    // If no specific draft state ID provided, find the most recent one
    if (!draftStateId) {
      const latestDraftState = await prisma.draftState.findFirst({
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!latestDraftState) {
        return NextResponse.json(
          {
            success: false,
            error: 'No draft state found to reset'
          },
          { status: 404 }
        );
      }

      draftStateId = latestDraftState.id;
    }

    // Verify draft state exists
    const draftState = await prisma.draftState.findUnique({
      where: { id: draftStateId },
      include: {
        draftConfig: true
      }
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

    // Reset the draft state
    const resetState = await resetDraftState(draftStateId);

    // Unlock the configuration
    await prisma.draftConfig.update({
      where: { id: draftState.draftConfigId },
      data: { isLocked: false }
    });

    // Broadcast state update to all clients
    await broadcastEvent(EVENTS.STATE_UPDATE, {
      draftState: resetState,
      message: 'Draft reset successfully'
    });

    return NextResponse.json({
      success: true,
      data: {
        draftState: resetState,
        message: 'Draft reset successfully. Configuration unlocked.'
      }
    });
  } catch (error) {
    console.error('Error resetting draft:', error);
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}
