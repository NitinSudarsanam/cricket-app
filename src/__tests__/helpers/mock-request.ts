/**
 * NextRequest Mock Helper
 * 
 * Provides utilities for creating mock NextRequest objects for API route testing.
 */

import { NextRequest } from 'next/server';
import type { RequestInit } from 'next/dist/server/web/spec-extension/request';

/**
 * Create a mock NextRequest for testing API routes
 * 
 * @param url - The request URL
 * @param init - Request initialization options (method, headers, body, etc.)
 */
export function createMockRequest(
  url: string,
  init?: RequestInit & { cookies?: Record<string, string> }
): NextRequest {
  const headers = new Headers(init?.headers);
  
  // Add cookies to headers if provided
  if (init?.cookies) {
    const cookieString = Object.entries(init.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    headers.set('Cookie', cookieString);
  }

  const requestInit: RequestInit = {
    method: init?.method || 'GET',
    headers,
    body: init?.body,
  };

  return new NextRequest(url, requestInit);
}

/**
 * Create a mock NextRequest with JSON body
 */
export function createMockJsonRequest(
  url: string,
  body: unknown,
  init?: Omit<RequestInit, 'body'> & { cookies?: Record<string, string> }
): NextRequest {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');

  return createMockRequest(url, {
    ...init,
    method: init?.method || 'POST',
    headers,
    body: JSON.stringify(body),
  });
}
