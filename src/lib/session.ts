/**
 * Participant session: signed cookie so clients cannot forge participant identity.
 * Uses HMAC-SHA256 with SESSION_SECRET (or ADMIN_SECRET fallback).
 */

import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'participant_session';
const MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET or ADMIN_SECRET must be set for participant session');
  }
  return secret;
}

function sign(value: string): string {
  const secret = getSecret();
  const hmac = createHmac('sha256', secret);
  hmac.update(value);
  return hmac.digest('base64url');
}

function verify(value: string, signature: string): boolean {
  try {
    const expected = sign(value);
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export interface ParticipantSession {
  participantId: string;
  participantName: string;
}

/**
 * Get current participant from signed cookie (server-side only).
 */
export async function getParticipantSession(): Promise<ParticipantSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [payload, signature] = raw.split('.');
  if (!payload || !signature || !verify(payload, signature)) return null;

  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const data = JSON.parse(decoded) as { participantId: string; participantName: string };
    if (typeof data.participantId === 'string' && typeof data.participantName === 'string') {
      return data;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Build cookie value for a participant (server-side only).
 */
export function createParticipantSessionCookie(session: ParticipantSession): string {
  const payload = Buffer.from(
    JSON.stringify({
      participantId: session.participantId,
      participantName: session.participantName,
    }),
    'utf8'
  ).toString('base64url');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function getParticipantSessionCookieAttributes(): {
  name: string;
  value: string;
  maxAge: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
} {
  return {
    name: COOKIE_NAME,
    value: '', // caller sets value
    maxAge: MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export { COOKIE_NAME, MAX_AGE };
