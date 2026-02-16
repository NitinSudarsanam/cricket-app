/**
 * Authentication helper utilities for API routes
 */

import { NextRequest } from 'next/server';
import { getAdminSession } from './admin-session';
import { logFailedAuth, logUnauthorizedAccess } from './security-logger';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Verify admin authentication from request.
 * Checks both admin session cookie and x-admin-secret header (for API clients).
 * Returns admin session if authenticated, null otherwise.
 */
export async function requireAdmin(request: NextRequest): Promise<{ success: true; session: { adminId: string } } | { success: false; status: number; error: string }> {
  // Check header-based auth first (for API clients like cron jobs)
  const headerSecret = request.headers.get('x-admin-secret') || 
                       request.headers.get('authorization')?.replace('Bearer ', '');
  const expectedSecret = process.env.ADMIN_SECRET;
  
  if (headerSecret && expectedSecret && headerSecret === expectedSecret) {
    return { success: true, session: { adminId: 'admin' } };
  }

  // Check cookie-based admin session (for browser-based admin pages)
  const session = await getAdminSession();
  if (session) {
    return { success: true, session };
  }

  const ip = getClientIp(request);
  const pathname = new URL(request.url).pathname;
  logUnauthorizedAccess(ip, pathname, request.method);
  
  return {
    success: false,
    status: 401,
    error: 'Unauthorized. Admin access required.',
  };
}
