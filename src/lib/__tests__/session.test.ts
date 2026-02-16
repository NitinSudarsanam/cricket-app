/**
 * Unit Tests for Participant Session Management
 * 
 * Tests session creation, verification, and cookie handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getParticipantSession,
  createParticipantSessionCookie,
  getParticipantSessionCookieAttributes,
  type ParticipantSession,
} from '../session';
import { cookies } from 'next/headers';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('createParticipantSessionCookie', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-session-secret-min-32-chars-long';
  });

  it('should create a valid session cookie', () => {
    const session: ParticipantSession = {
      participantId: 'participant-1',
      participantName: 'Test Participant',
    };

    const cookie = createParticipantSessionCookie(session);
    expect(cookie).toBeDefined();
    expect(cookie).toContain('.');
    
    const [payload, signature] = cookie.split('.');
    expect(payload).toBeDefined();
    expect(signature).toBeDefined();
  });

  it('should create different cookies for different sessions', () => {
    const session1: ParticipantSession = {
      participantId: 'participant-1',
      participantName: 'Test 1',
    };
    const session2: ParticipantSession = {
      participantId: 'participant-2',
      participantName: 'Test 2',
    };

    const cookie1 = createParticipantSessionCookie(session1);
    const cookie2 = createParticipantSessionCookie(session2);
    
    expect(cookie1).not.toBe(cookie2);
  });

  it('should create consistent cookies for same session', () => {
    const session: ParticipantSession = {
      participantId: 'participant-1',
      participantName: 'Test Participant',
    };

    const cookie1 = createParticipantSessionCookie(session);
    const cookie2 = createParticipantSessionCookie(session);
    
    // Cookies should be identical (same payload + signature)
    expect(cookie1).toBe(cookie2);
  });
});

describe('getParticipantSession', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-session-secret-min-32-chars-long';
  });

  it('should return null when no cookie is present', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as any);

    const result = await getParticipantSession();
    expect(result).toBeNull();
  });

  it('should return null for invalid cookie format', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: 'invalid-cookie' }),
    } as any);

    const result = await getParticipantSession();
    expect(result).toBeNull();
  });

  it('should return null for tampered cookie', async () => {
    const session: ParticipantSession = {
      participantId: 'participant-1',
      participantName: 'Test Participant',
    };
    const validCookie = createParticipantSessionCookie(session);
    const [payload] = validCookie.split('.');
    const tamperedCookie = `${payload}.tampered-signature`;

    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: tamperedCookie }),
    } as any);

    const result = await getParticipantSession();
    expect(result).toBeNull();
  });

  it('should return session for valid cookie', async () => {
    const session: ParticipantSession = {
      participantId: 'participant-1',
      participantName: 'Test Participant',
    };
    const cookie = createParticipantSessionCookie(session);

    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: cookie }),
    } as any);

    const result = await getParticipantSession();
    expect(result).toEqual(session);
  });

  it('should return null for invalid JSON payload', async () => {
    // Create a cookie with invalid JSON
    const invalidPayload = Buffer.from('invalid-json').toString('base64url');
    const { createHmac } = await import('crypto');
    const hmac = createHmac('sha256', process.env.SESSION_SECRET!);
    hmac.update(invalidPayload);
    const signature = hmac.digest('base64url');
    const invalidCookie = `${invalidPayload}.${signature}`;

    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: invalidCookie }),
    } as any);

    const result = await getParticipantSession();
    expect(result).toBeNull();
  });
});

describe('getParticipantSessionCookieAttributes', () => {
  it('should return correct cookie attributes', () => {
    const attrs = getParticipantSessionCookieAttributes();
    
    expect(attrs.name).toBe('participant_session');
    expect(attrs.maxAge).toBe(60 * 60 * 24); // 24 hours
    expect(attrs.httpOnly).toBe(true);
    expect(attrs.sameSite).toBe('lax');
    expect(attrs.path).toBe('/');
  });

  it('should set secure flag in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const attrs = getParticipantSessionCookieAttributes();
    expect(attrs.secure).toBe(true);
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should not set secure flag in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const attrs = getParticipantSessionCookieAttributes();
    expect(attrs.secure).toBe(false);
    
    process.env.NODE_ENV = originalEnv;
  });
});
