import { describe, expect, it } from 'vitest';
import { getPoolSslOption, isDisposableDatabaseUrl } from '@/lib/db-ssl';

describe('getPoolSslOption', () => {
  it('disables SSL for localhost and 127.0.0.1', () => {
    expect(
      getPoolSslOption({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/cricket_ci',
      }),
    ).toBe(false);
    expect(
      getPoolSslOption({
        connectionString: 'postgresql://postgres:postgres@localhost:5432/cricket_ci',
      }),
    ).toBe(false);
  });

  it('enables SSL for remote hosts such as Supabase', () => {
    expect(
      getPoolSslOption({
        connectionString: 'postgresql://user:pass@db.example.supabase.co:6543/postgres',
      }),
    ).toEqual({ rejectUnauthorized: false });
  });

  it('uses a CA cert when provided for a remote host', () => {
    expect(
      getPoolSslOption({
        connectionString: 'postgresql://user:pass@db.example.supabase.co:6543/postgres',
        caCert: '-----BEGIN CERTIFICATE-----',
      }),
    ).toEqual({ rejectUnauthorized: true, ca: '-----BEGIN CERTIFICATE-----' });
  });

  it('does not treat a credential that contains localhost as local', () => {
    expect(
      isDisposableDatabaseUrl(
        'postgresql://localhost_user:pass@db.example.supabase.co:6543/postgres',
      ),
    ).toBe(false);
  });

  it('honors DATABASE_SSL=false even on a remote host', () => {
    expect(
      getPoolSslOption({
        connectionString: 'postgresql://user:pass@db.example.supabase.co:6543/postgres',
        sslFlag: 'false',
      }),
    ).toBe(false);
  });
});
