/**
 * Unit Tests for Auth Helpers
 * 
 * Tests requireAdmin function for admin authentication.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireAdmin } from '../auth-helpers';
import { getAdminSession } from '../admin-session';
import { logUnauthorizedAccess } from '../security-logger';
import type { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('../admin-session');
vi.mock('../security-logger');

describe('requireAdmin', () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = 'test-admin-secret-min-32-chars-long';
    vi.clearAllMocks();
  });

  it('should return success for valid x-admin-secret header', async () => {
    const request = {
      url: 'http://localhost:3000/api/players',
      headers: new Headers({
        'x-admin-secret': 'test-admin-secret-min-32-chars-long',
      }),
      method: 'POST',
    } as NextRequest;

    const result = await requireAdmin(request);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.session.adminId).toBe('admin');
    }
  });

  it('should return success for valid Authorization Bearer header', async () => {
    const request = {
      url: 'http://localhost:3000/api/players',
      headers: new Headers({
        'authorization': 'Bearer test-admin-secret-min-32-chars-long',
      }),
      method: 'POST',
    } as NextRequest;

    const result = await requireAdmin(request);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.session.adminId).toBe('admin');
    }
  });

  it('should return success for valid admin session cookie', async () => {
    const request = {
      url: 'http://localhost:3000/api/players',
      headers: new Headers({}),
      method: 'POST',
    } as NextRequest;

    vi.mocked(getAdminSession).mockResolvedValue({
      adminId: 'admin',
      authenticatedAt: Date.now(),
    });

    const result = await requireAdmin(request);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.session.adminId).toBe('admin');
    }
  });

  it('should return failure for invalid x-admin-secret header', async () => {
    const request = {
      url: 'http://localhost:3000/api/players',
      headers: new Headers({
        'x-admin-secret': 'wrong-secret',
      }),
      method: 'POST',
    } as NextRequest;

    vi.mocked(getAdminSession).mockResolvedValue(null);

    const result = await requireAdmin(request);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(401);
      expect(result.error).toContain('Unauthorized');
    }
    expect(logUnauthorizedAccess).toHaveBeenCalled();
  });

  it('should return failure when no auth provided', async () => {
    const request = {
      url: 'http://localhost:3000/api/players',
      headers: new Headers({}),
      method: 'POST',
    } as NextRequest;

    vi.mocked(getAdminSession).mockResolvedValue(null);

    const result = await requireAdmin(request);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(401);
      expect(result.error).toContain('Unauthorized');
    }
    expect(logUnauthorizedAccess).toHaveBeenCalled();
  });

  it('should log unauthorized access with correct IP and pathname', async () => {
    const request = {
      url: 'http://localhost:3000/api/players',
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
      }),
      method: 'POST',
    } as NextRequest;

    vi.mocked(getAdminSession).mockResolvedValue(null);

    await requireAdmin(request);
    
    expect(logUnauthorizedAccess).toHaveBeenCalledWith(
      '192.168.1.1',
      '/api/players',
      'POST'
    );
  });

  it('should prioritize header auth over cookie auth', async () => {
    const request = {
      url: 'http://localhost:3000/api/players',
      headers: new Headers({
        'x-admin-secret': 'test-admin-secret-min-32-chars-long',
      }),
      method: 'POST',
    } as NextRequest;

    const result = await requireAdmin(request);
    expect(result.success).toBe(true);
    // Should not call getAdminSession when header auth succeeds
    expect(getAdminSession).not.toHaveBeenCalled();
  });
});
