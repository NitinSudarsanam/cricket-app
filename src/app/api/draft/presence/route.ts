import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { broadcastEvent, EVENTS } from '@/lib/pusher-server';
import { getParticipantSession } from '@/lib/session';

/**
 * POST /api/draft/presence
 * Update the signed-in participant's presence. The body cannot impersonate another participant.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getParticipantSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.status || (body.status !== 'online' && body.status !== 'offline')) {
      return NextResponse.json(
        {
          success: false,
          error: 'status must be "online" or "offline"'
        },
        { status: 400 }
      );
    }

    if (body.participantId && body.participantId !== session.participantId) {
      return NextResponse.json(
        { success: false, error: 'Cannot update presence for another participant' },
        { status: 403 }
      );
    }

    const participant = await prisma.participant.findUnique({
      where: { id: session.participantId },
      select: { id: true, name: true },
    });
    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    const draftStateId =
      typeof body.draftStateId === 'string' ? body.draftStateId : undefined;

    const event = body.status === 'online' ? EVENTS.PARTICIPANT_ONLINE : EVENTS.PARTICIPANT_OFFLINE;

    await broadcastEvent(
      event,
      {
        participantId: participant.id,
        participantName: participant.name,
        timestamp: new Date(),
      },
      draftStateId
    );

    return NextResponse.json({
      success: true,
      data: {
        participantId: participant.id,
        status: body.status,
        message: `Participant ${participant.name} is now ${body.status}`,
      },
    });
  } catch (error) {
    console.error('Error updating presence:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update presence',
      },
      { status: 500 }
    );
  }
}
