import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('instrumentation register', () => {
  it('skips env validation on the edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    const validateEnv = vi.fn();
    vi.doMock('@/lib/env', () => ({ validateEnv }));

    const { register } = await import('@/instrumentation');
    await register();
    expect(validateEnv).not.toHaveBeenCalled();
  });

  it('validates env on the Node.js runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/app');
    vi.stubEnv('ADMIN_SECRET', 'dev-secret-change-in-production');
    vi.stubEnv('NODE_ENV', 'test');

    const { register } = await import('../../instrumentation');
    await expect(register()).resolves.toBeUndefined();
  });
});
