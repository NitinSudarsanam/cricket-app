import { NextRequest, NextResponse } from 'next/server';
import { broadcastEvent, EVENTS } from '@/lib/pusher-server';

/**
 * POST /api/draft/presence
 * Update participant presence status
 * 
 * Request body:
 *   - participantId: string - The ID of the participant
 *   - participantName: string - The name of the participant
 *   - status: 'online' | 'offline' - The presence status
 * 
 * Requirements: 6.1, 6.2, 6.3
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.participantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'participantId is required'
        },
        { status: 400 }
      );
    }

    if (!body.participantName) {
      return NextResponse.json(
        {
          success: false,
          error: 'participantName is required'
        },
        { status: 400 }
      );
    }

    if (!body.status || (body.status !== 'online' && body.status !== 'offline')) {
      return NextResponse.json(
        {
          success: false,
          error: 'status must be "online" or "offline"'
        },
        { status: 400 }
      );
    }

    const { participantId, participantName, status } = body;

    // Broadcast presence event
    const event = status === 'online' ? EVENTS.PARTICIPANT_ONLINE : EVENTS.PARTICIPANT_OFFLINE;
    
    await broadcastEvent(event, {
      participantId,
      participantName,
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      data: {
        participantId,
        status,
        message: `Participant ${participantName} is now ${status}`
      }
    });
  } catch (error) {
    console.error('Error updating presence:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update presence'
      },
      { status: 500 }
    );
  }
}
