/**
 * Unit Tests for Admin Session Management
 * 
 * Tests admin session creation, verification, expiration, and cookie handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAdminSession,
  createAdminSessionCookie,
  getAdminSessionCookieAttributes,
  type AdminSession,
} from '../admin-session';
import { cookies } from 'next/headers';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('createAdminSessionCookie', () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = 'test-admin-secret-min-32-chars-long';
  });

  it('should create a valid admin session cookie', () => {
    const cookie = createAdminSessionCookie();
    expect(cookie).toBeDefined();
    expect(cookie).toContain('.');
    
    const [payload, signature] = cookie.split('.');
    expect(payload).toBeDefined();
    expect(signature).toBeDefined();
  });

  it('should create different cookies on each call (due to timestamp)', async () => {
    const cookie1 = createAdminSessionCookie();
    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));
    const cookie2 = createAdminSessionCookie();
    
    // Cookies should be different due to different authenticatedAt timestamps
    expect(cookie1).not.toBe(cookie2);
  });
});

describe('getAdminSession', () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = 'test-admin-secret-min-32-chars-long';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null when no cookie is present', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as any);

    const result = await getAdminSession();
    expect(result).toBeNull();
  });

  it('should return null for invalid cookie format', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: 'invalid-cookie' }),
    } as any);

    const result = await getAdminSession();
    expect(result).toBeNull();
  });

  it('should return null for tampered cookie', async () => {
    const validCookie = createAdminSessionCookie();
    const [payload] = validCookie.split('.');
    const tamperedCookie = `${payload}.tampered-signature`;

    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: tamperedCookie }),
    } as any);

    const result = await getAdminSession();
    expect(result).toBeNull();
  });

  it('should return session for valid cookie', async () => {
    const cookie = createAdminSessionCookie();

    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: cookie }),
    } as any);

    const result = await getAdminSession();
    expect(result).toBeDefined();
    expect(result?.adminId).toBe('admin');
    expect(result?.authenticatedAt).toBeTypeOf('number');
  });

  it('should return null for expired session', async () => {
    // Create a cookie with old timestamp (9 hours ago, exceeds 8 hour limit)
    const oldTimestamp = Date.now() - (9 * 60 * 60 * 1000);
    const payload = Buffer.from(
      JSON.stringify({
        adminId: 'admin',
        authenticatedAt: oldTimestamp,
      }),
      'utf8'
    ).toString('base64url');
    
    const { createHmac } = await import('crypto');
    const hmac = createHmac('sha256', process.env.ADMIN_SECRET!);
    hmac.update(payload);
    const signature = hmac.digest('base64url');
    const expiredCookie = `${payload}.${signature}`;

    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: expiredCookie }),
    } as any);

    const result = await getAdminSession();
    expect(result).toBeNull();
  });

  it('should return session for non-expired session', async () => {
    // Create a cookie with recent timestamp (1 hour ago, within 8 hour limit)
    const recentTimestamp = Date.now() - (1 * 60 * 60 * 1000);
    const payload = Buffer.from(
      JSON.stringify({
        adminId: 'admin',
        authenticatedAt: recentTimestamp,
      }),
      'utf8'
    ).toString('base64url');
    
    const { createHmac } = await import('crypto');
    const hmac = createHmac('sha256', process.env.ADMIN_SECRET!);
    hmac.update(payload);
    const signature = hmac.digest('base64url');
    const validCookie = `${payload}.${signature}`;

    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: validCookie }),
    } as any);

    const result = await getAdminSession();
    expect(result).toBeDefined();
    expect(result?.adminId).toBe('admin');
  });

  it('should return null for invalid JSON payload', async () => {
    const invalidPayload = Buffer.from('invalid-json').toString('base64url');
    const { createHmac } = await import('crypto');
    const hmac = createHmac('sha256', process.env.ADMIN_SECRET!);
    hmac.update(invalidPayload);
    const signature = hmac.digest('base64url');
    const invalidCookie = `${invalidPayload}.${signature}`;

    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: invalidCookie }),
    } as any);

    const result = await getAdminSession();
    expect(result).toBeNull();
  });
});

describe('getAdminSessionCookieAttributes', () => {
  it('should return correct cookie attributes', () => {
    const attrs = getAdminSessionCookieAttributes();
    
    expect(attrs.name).toBe('admin_session');
    expect(attrs.maxAge).toBe(60 * 60 * 8); // 8 hours
    expect(attrs.httpOnly).toBe(true);
    expect(attrs.sameSite).toBe('lax');
    expect(attrs.path).toBe('/');
  });

  it('should set secure flag in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const attrs = getAdminSessionCookieAttributes();
    expect(attrs.secure).toBe(true);
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should not set secure flag in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const attrs = getAdminSessionCookieAttributes();
    expect(attrs.secure).toBe(false);
    
    process.env.NODE_ENV = originalEnv;
  });
});
