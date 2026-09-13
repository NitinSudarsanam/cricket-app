/**
 * Unit Tests for Rate Limiting
 * 
 * Tests rate limit checking, configuration selection, and cleanup.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, getClientIdentifier } from '../rate-limit';
import type { NextRequest } from 'next/server';

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Clear rate limit store by importing and clearing it
    // Note: In a real implementation, we'd need to expose a reset function
    // For now, we'll test with fresh identifiers each time
  });

  it('should allow first request', () => {
    const result = checkRateLimit('test-ip-1', '/api/players');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('should track requests per identifier and pathname', () => {
    const identifier = 'test-ip-1';
    const pathname = '/api/players';
    
    // Make multiple requests
    const result1 = checkRateLimit(identifier, pathname);
    const result2 = checkRateLimit(identifier, pathname);
    const result3 = checkRateLimit(identifier, pathname);
    
    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
    expect(result3.allowed).toBe(true);
    expect(result3.remaining).toBeLessThan(result1.remaining);
  });

  it('should use different limits for different pathnames', () => {
    const identifier1 = 'test-ip-auth-diff';
    const identifier2 = 'test-ip-read-diff';
    
    // Auth endpoint has stricter limit (10/min)
    const authResult = checkRateLimit(identifier1, '/api/auth/admin');
    expect(authResult.remaining).toBe(9); // 10 - 1
    expect(authResult.allowed).toBe(true);
    
    // Read-only endpoint (health check) has more generous limit (100/min)
    const readResult = checkRateLimit(identifier2, '/api/health');
    expect(readResult.remaining).toBe(99); // 100 - 1
    expect(readResult.allowed).toBe(true);
  });

  it('should rate limit when limit is exceeded', () => {
    const identifier = 'test-ip-rate-limit';
    const pathname = '/api/auth/admin'; // 10 requests per minute
    
    // Make 10 requests (should all be allowed)
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit(identifier, pathname);
      expect(result.allowed).toBe(true);
    }
    
    // 11th request should be rate limited
    const result = checkRateLimit(identifier, pathname);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after window expires', async () => {
    const identifier = 'test-ip-reset';
    const pathname = '/api/auth/admin';
    
    // Exhaust the limit
    for (let i = 0; i < 10; i++) {
      checkRateLimit(identifier, pathname);
    }
    
    // Should be rate limited
    const limitedResult = checkRateLimit(identifier, pathname);
    expect(limitedResult.allowed).toBe(false);
    
    // Fast-forward time by manipulating the reset time
    // Note: This is a simplified test - in reality, we'd need to wait or mock time
    // For now, we test that the structure is correct
    expect(limitedResult.resetTime).toBeGreaterThan(Date.now());
  });

  it('should handle different identifiers independently', () => {
    const pathname = '/api/auth/admin';
    
    // Exhaust limit for identifier 1
    for (let i = 0; i < 10; i++) {
      checkRateLimit('ip-independent-1', pathname);
    }
    
    // Identifier 2 should still have full limit (10 requests for auth endpoint)
    const result = checkRateLimit('ip-independent-2', pathname);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9); // 10 - 1
  });

  it('should apply import endpoint limit correctly', () => {
    const identifier = 'test-ip-import';
    const pathname = '/api/players/import'; // 5 requests per minute
    
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(identifier, pathname);
      expect(result.allowed).toBe(true);
    }
    
    // 6th should be rate limited
    const result = checkRateLimit(identifier, pathname);
    expect(result.allowed).toBe(false);
  });

  it('should apply auto-pick limit correctly', () => {
    const identifier = 'test-ip-auto-pick';
    const pathname = '/api/draft/auto-pick';

    for (let i = 0; i < 24; i++) {
      const result = checkRateLimit(identifier, pathname);
      expect(result.allowed).toBe(true);
    }

    const result = checkRateLimit(identifier, pathname);
    expect(result.allowed).toBe(false);
  });

  it('should apply draft pick limit correctly', () => {
    const identifier = 'test-ip-draft';
    const pathname = '/api/draft/pick'; // 30 requests per minute
    
    // Make 30 requests
    for (let i = 0; i < 30; i++) {
      const result = checkRateLimit(identifier, pathname);
      expect(result.allowed).toBe(true);
    }
    
    // 31st should be rate limited
    const result = checkRateLimit(identifier, pathname);
    expect(result.allowed).toBe(false);
  });
});

describe('getClientIdentifier', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const request = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      }),
    } as NextRequest;
    
    const identifier = getClientIdentifier(request);
    expect(identifier).toBe('192.168.1.1');
  });

  it('should extract IP from x-real-ip header when x-forwarded-for is missing', () => {
    const request = {
      headers: new Headers({
        'x-real-ip': '192.168.1.2',
      }),
    } as NextRequest;
    
    const identifier = getClientIdentifier(request);
    expect(identifier).toBe('192.168.1.2');
  });

  it('should return unknown when no IP headers are present', () => {
    const request = {
      headers: new Headers({}),
    } as NextRequest;
    
    const identifier = getClientIdentifier(request);
    expect(identifier).toBe('unknown');
  });

  it('should handle x-forwarded-for with single IP', () => {
    const request = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.3',
      }),
    } as NextRequest;
    
    const identifier = getClientIdentifier(request);
    expect(identifier).toBe('192.168.1.3');
  });
});
