export type PoolSslOption =
  | false
  | { rejectUnauthorized: boolean; ca?: string };

/**
 * Decide whether the pg Pool should request TLS.
 *
 * Local / CI Postgres (localhost, 127.0.0.1) does not speak SSL. Sending any
 * truthy `ssl` object makes node-postgres require TLS and the connection fails.
 * Remote hosts such as Supabase expect SSL.
 */
export function getPoolSslOption(options: {
  connectionString: string;
  caCert?: string;
  sslFlag?: string;
}): PoolSslOption {
  const explicit = (options.sslFlag ?? '').trim().toLowerCase();
  if (explicit === 'false' || explicit === '0') {
    return false;
  }

  if (explicit === 'true' || explicit === '1') {
    return options.caCert
      ? { rejectUnauthorized: true, ca: options.caCert }
      : { rejectUnauthorized: false };
  }

  let host = '';
  try {
    host = new URL(options.connectionString).hostname;
  } catch {
    host = '';
  }

  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (isLocal) {
    return false;
  }

  if (options.caCert) {
    return { rejectUnauthorized: true, ca: options.caCert };
  }

  return { rejectUnauthorized: false };
}
