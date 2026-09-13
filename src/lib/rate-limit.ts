/**
 * Simple in-memory rate limiter for serverless environments
 * 
 * Note: This is per-instance only. For production with multiple instances,
 * consider using Upstash Redis or Vercel's built-in rate limiting.
 */

import type { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (cleared on serverless function restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupOldEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }
  lastCleanup = now;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate limit tiers by route pattern
 */
const RATE_LIMIT_CONFIGS: Array<{ pattern: RegExp; config: RateLimitConfig }> = [
  // Auth endpoints - strict limit
  { pattern: /^\/api\/auth\//, config: { maxRequests: 10, windowMs: 60 * 1000 } },
  // Import endpoint - very strict
  { pattern: /^\/api\/players\/import$/, config: { maxRequests: 5, windowMs: 60 * 1000 } },
  // Draft pick - moderate limit
  { pattern: /^\/api\/draft\/pick$/, config: { maxRequests: 30, windowMs: 60 * 1000 } },
  // Auto-pick is polled by every client; tighter than generic reads
  { pattern: /^\/api\/draft\/auto-pick$/, config: { maxRequests: 120, windowMs: 60 * 1000 } },
  // Admin mutation endpoints
  { pattern: /^\/api\/(players|participants|draft\/(start|pause|reset)|draft-config|sync)/, config: { maxRequests: 20, windowMs: 60 * 1000 } },
  // Read-only endpoints - generous limit
  { pattern: /^\/api\//, config: { maxRequests: 100, windowMs: 60 * 1000 } },
];

/**
 * Get rate limit config for a pathname
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  for (const { pattern, config } of RATE_LIMIT_CONFIGS) {
    if (pattern.test(pathname)) {
      return config;
    }
  }
  // Default: 100 requests per minute
  return { maxRequests: 100, windowMs: 60 * 1000 };
}

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (IP address or user ID)
 * @param pathname - Request pathname
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  pathname: string
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupOldEntries();

  const config = getRateLimitConfig(pathname);
  const key = `${identifier}:${pathname}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Entry exists and is within window
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier (shouldn't happen in production)
  return 'unknown';
}
