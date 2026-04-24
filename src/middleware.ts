import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIdentifier } from './lib/rate-limit';
import { logRateLimitHit, logUnauthorizedAccess } from './lib/security-logger';

/**
 * Next.js Middleware for centralized route protection
 * 
 * This middleware runs before every request and enforces authentication
 * and authorization rules based on the route pattern.
 */

// Maximum request body size (1MB for most routes, 500KB for import)
const MAX_BODY_SIZE = 1024 * 1024; // 1MB
const MAX_IMPORT_BODY_SIZE = 512 * 1024; // 500KB

/**
 * Check if a route requires admin authentication
 */
function requiresAdminAuth(pathname: string): boolean {
  // Admin pages are protected by the route group layout (server-side redirect).
  // Middleware only protects admin API routes.

  // Admin API routes
  const adminApiRoutes = [
    '/api/players', // POST, PUT, DELETE
    '/api/players/import',
    '/api/participants', // POST only
    '/api/draft/start',
    '/api/draft/pause',
    '/api/draft/reset',
    '/api/draft-config', // PUT only
    '/api/sync',
  ];

  for (const route of adminApiRoutes) {
    if (pathname.startsWith(route)) {
      // For routes like /api/players, only protect mutations (not GET)
      if (pathname === '/api/players' || pathname === '/api/participants') {
        // Will check method in the handler
        return true;
      }
      return true;
    }
  }

  return false;
}

/**
 * Check if a route requires participant authentication
 */
function requiresParticipantAuth(pathname: string, method: string): boolean {
  if (pathname === '/draft' && method === 'GET') {
    return true;
  }

  if (pathname === '/api/draft/pick' && method === 'POST') {
    return true;
  }

  if (pathname === '/api/draft/presence' && method === 'POST') {
    return true;
  }

  return false;
}

/**
 * Check if a route is public (no auth required)
 */
function isPublicRoute(pathname: string, method: string): boolean {
  // Auth endpoints
  if (pathname.startsWith('/api/auth/')) {
    return true;
  }

  // Health check
  if (pathname === '/api/health') {
    return true;
  }

  // Login pages
  if (pathname === '/admin/login' || pathname === '/draft/login') {
    return true;
  }

  // Read-only API endpoints
  const readOnlyRoutes = [
    '/api/players', // GET only
    '/api/participants', // GET only
    '/api/draft/state',
    '/api/draft/results',
    '/api/leaderboard',
    '/api/leagues',
    '/api/matches',
    '/api/teams',
    '/api/seasons',
    '/api/sportmonks',
  ];

  for (const route of readOnlyRoutes) {
    if (pathname.startsWith(route) && method === 'GET') {
      return true;
    }
  }

  return false;
}

/**
 * Check request body size
 */
function checkBodySize(request: NextRequest, pathname: string): { valid: boolean; error?: string } {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) {
    return { valid: true }; // No body or chunked encoding
  }

  const size = parseInt(contentLength, 10);
  if (isNaN(size)) {
    return { valid: true }; // Invalid header, let route handler deal with it
  }

  // Import endpoint has stricter limit
  if (pathname === '/api/players/import') {
    if (size > MAX_IMPORT_BODY_SIZE) {
      return {
        valid: false,
        error: `Request body too large. Maximum size is ${MAX_IMPORT_BODY_SIZE / 1024}KB for import endpoint.`,
      };
    }
  } else if (size > MAX_BODY_SIZE) {
    return {
      valid: false,
      error: `Request body too large. Maximum size is ${MAX_BODY_SIZE / 1024}KB.`,
    };
  }

  return { valid: true };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Rate limiting (skip for static assets and health check)
  if (!pathname.startsWith('/_next') && pathname !== '/api/health') {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, pathname);
    
    if (!rateLimit.allowed) {
      logRateLimitHit(clientId, pathname, 100);
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
          },
        }
      );
    }
  }

  // Check body size for POST/PUT requests
  if (method === 'POST' || method === 'PUT') {
    const bodyCheck = checkBodySize(request, pathname);
    if (!bodyCheck.valid) {
      return NextResponse.json(
        { success: false, error: bodyCheck.error },
        { status: 413 }
      );
    }
  }

  // Public routes don't need authentication
  if (isPublicRoute(pathname, method)) {
    return NextResponse.next();
  }

  // Check admin authentication
  if (requiresAdminAuth(pathname)) {
    // For mutation routes, check method
    if ((pathname === '/api/players' || pathname === '/api/participants') && method === 'GET') {
      return NextResponse.next(); // GET is public
    }

    // Check cookie-based admin session (simple check - full validation in route handlers)
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get('admin_session');
    const hasAdminCookie = !!adminCookie?.value;

    // Check header-based auth for API routes
    const headerSecret = request.headers.get('x-admin-secret') ||
                        request.headers.get('authorization')?.replace('Bearer ', '');
    const expectedSecret = process.env.ADMIN_SECRET;

    if (!hasAdminCookie && (!headerSecret || !expectedSecret || headerSecret !== expectedSecret)) {
      logUnauthorizedAccess(getClientIdentifier(request), pathname, method);
      if (pathname.startsWith('/admin')) {
        // Redirect to admin login for browser requests
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
      // Return 401 for API requests
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }
  }

  // Check participant authentication
  if (requiresParticipantAuth(pathname, method)) {
    const cookieStore = await cookies();
    const participantCookie = cookieStore.get('participant_session');
    const hasParticipantCookie = !!participantCookie?.value;

    if (!hasParticipantCookie) {
      if (pathname.startsWith('/draft')) {
        // Redirect to draft login for browser requests
        return NextResponse.redirect(new URL('/draft/login', request.url));
      }
      // Return 401 for API requests
      logUnauthorizedAccess(getClientIdentifier(request), pathname, method);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
