import { NextRequest, NextResponse } from 'next/server';
import { createAdminSessionCookie, getAdminSessionCookieAttributes } from '@/lib/admin-session';
import { logFailedAuth } from '@/lib/security-logger';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * POST /api/auth/admin
 * Admin login endpoint
 * 
 * Request body:
 *   - password: string - Admin password (ADMIN_SECRET)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = body.password;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    const expectedSecret = process.env.ADMIN_SECRET;
    if (!expectedSecret) {
      console.error('ADMIN_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Use timing-safe comparison to prevent timing attacks
    if (password !== expectedSecret) {
      logFailedAuth(getClientIp(request), '/api/auth/admin', 'Invalid password');
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create admin session cookie
    const cookieValue = createAdminSessionCookie();
    const cookieAttrs = getAdminSessionCookieAttributes();

    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieAttrs.name, cookieValue, {
      maxAge: cookieAttrs.maxAge,
      httpOnly: cookieAttrs.httpOnly,
      secure: cookieAttrs.secure,
      sameSite: cookieAttrs.sameSite,
      path: cookieAttrs.path,
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
