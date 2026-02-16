import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import {
  createParticipantSessionCookie,
  getParticipantSessionCookieAttributes,
} from '@/lib/session';

/**
 * POST /api/auth/participant
 * Set session to the given participant (after validating they exist).
 * Body: { participantId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const participantId = body?.participantId;
    if (typeof participantId !== 'string' || !participantId) {
      return NextResponse.json(
        { success: false, error: 'participantId is required' },
        { status: 400 }
      );
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    const session = {
      participantId: participant.id,
      participantName: participant.name,
    };
    const cookieValue = createParticipantSessionCookie(session);
    const attrs = getParticipantSessionCookieAttributes();

    const cookieStore = await cookies();
    cookieStore.set({
      ...attrs,
      value: cookieValue,
    });

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error setting participant session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set session' },
      { status: 500 }
    );
  }
}
