/**
 * Admin session: signed cookie for admin authentication.
 * Uses HMAC-SHA256 with ADMIN_SECRET.
 * Separate from participant session to prevent privilege escalation.
 */

import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'admin_session';
const MAX_AGE = 60 * 60 * 8; // 8 hours (longer than participant session for convenience)

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SECRET must be set for admin session');
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

export interface AdminSession {
  adminId: string; // Always 'admin' for now, but extensible
  authenticatedAt: number;
}

/**
 * Get current admin session from signed cookie (server-side only).
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [payload, signature] = raw.split('.');
  if (!payload || !signature || !verify(payload, signature)) return null;

  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const data = JSON.parse(decoded) as { adminId: string; authenticatedAt: number };
    if (typeof data.adminId === 'string' && typeof data.authenticatedAt === 'number') {
      // Check expiration (8 hours)
      const age = Date.now() - data.authenticatedAt;
      if (age > MAX_AGE * 1000) return null;
      return data;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Build cookie value for admin session (server-side only).
 */
export function createAdminSessionCookie(): string {
  const payload = Buffer.from(
    JSON.stringify({
      adminId: 'admin',
      authenticatedAt: Date.now(),
    }),
    'utf8'
  ).toString('base64url');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function getAdminSessionCookieAttributes(): {
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
