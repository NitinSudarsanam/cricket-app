import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadEnv() {
  vi.resetModules();
  return import('@/lib/env');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('validateEnv', () => {
  it('accepts required vars without Pusher', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/app');
    vi.stubEnv('ADMIN_SECRET', 'dev-secret-change-in-production');
    vi.stubEnv('PUSHER_APP_ID', '');
    vi.stubEnv('PUSHER_KEY', '');
    vi.stubEnv('PUSHER_SECRET', '');
    vi.stubEnv('PUSHER_CLUSTER', '');
    vi.stubEnv('NEXT_PUBLIC_PUSHER_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_PUSHER_CLUSTER', '');
    vi.stubEnv('NODE_ENV', 'test');

    const { validateEnv } = await loadEnv();
    expect(() => validateEnv()).not.toThrow();
  });

  it('rejects a partial Pusher config', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/app');
    vi.stubEnv('ADMIN_SECRET', 'dev-secret-change-in-production');
    vi.stubEnv('PUSHER_APP_ID', 'app-id');
    vi.stubEnv('PUSHER_KEY', '');
    vi.stubEnv('PUSHER_SECRET', '');
    vi.stubEnv('PUSHER_CLUSTER', '');
    vi.stubEnv('NEXT_PUBLIC_PUSHER_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_PUSHER_CLUSTER', '');
    vi.stubEnv('NODE_ENV', 'test');

    const { validateEnv } = await loadEnv();
    expect(() => validateEnv()).toThrow(/Incomplete Pusher configuration/);
  });

  it('skips validation during next production build', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('ADMIN_SECRET', '');
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    vi.stubEnv('NODE_ENV', 'production');

    const { validateEnv } = await loadEnv();
    expect(() => validateEnv()).not.toThrow();
  });

  it('requires a distinct SESSION_SECRET in production', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/app');
    vi.stubEnv('ADMIN_SECRET', 'production-admin-secret-32-chars-min');
    vi.stubEnv('SESSION_SECRET', 'production-admin-secret-32-chars-min');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PHASE', '');

    const { validateEnv } = await loadEnv();
    expect(() => validateEnv()).toThrow(/SESSION_SECRET must be different/);
  });
});
