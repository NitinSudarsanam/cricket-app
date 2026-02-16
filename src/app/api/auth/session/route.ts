import { NextResponse } from 'next/server';
import { getParticipantSession } from '@/lib/session';

/**
 * GET /api/auth/session
 * Returns current participant session or null.
 */
export async function GET() {
  const session = await getParticipantSession();
  return NextResponse.json({
    success: true,
    data: session,
  });
}
