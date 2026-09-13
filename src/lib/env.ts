/**
 * Environment Variable Validation and Type-Safe Access
 *
 * Validates required variables and provides type-safe access.
 * Pusher and Sportmonks are optional — the app falls back to polling
 * and existing database data when they are unset.
 */

const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  PUSHER_APP_ID: process.env.PUSHER_APP_ID,
  PUSHER_KEY: process.env.PUSHER_KEY,
  PUSHER_SECRET: process.env.PUSHER_SECRET,
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

const clientEnv = {
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

const PUSHER_SERVER_VARS = [
  'PUSHER_APP_ID',
  'PUSHER_KEY',
  'PUSHER_SECRET',
  'PUSHER_CLUSTER',
] as const;

const PUSHER_CLIENT_VARS = [
  'NEXT_PUBLIC_PUSHER_KEY',
  'NEXT_PUBLIC_PUSHER_CLUSTER',
] as const;

function isNextBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

/**
 * Validates that required environment variables are set.
 * Throws if any required variables are missing.
 *
 * During `next build`, validation is skipped so Vercel can compile
 * pages without treating optional runtime services as hard failures.
 */
export function validateEnv() {
  if (isNextBuildPhase()) {
    return;
  }

  const errors: string[] = [];

  if (!serverEnv.DATABASE_URL) {
    errors.push('Missing required environment variable: DATABASE_URL');
  }

  if (!serverEnv.ADMIN_SECRET) {
    errors.push('Missing required environment variable: ADMIN_SECRET');
  }

  if (serverEnv.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    errors.push('SESSION_SECRET is required in production and must be separate from ADMIN_SECRET');
  }

  const pusherServerSet = PUSHER_SERVER_VARS.filter((name) => Boolean(serverEnv[name]));
  const pusherClientSet = PUSHER_CLIENT_VARS.filter((name) => Boolean(clientEnv[name]));
  const anyPusher = pusherServerSet.length + pusherClientSet.length > 0;
  if (anyPusher) {
    for (const name of PUSHER_SERVER_VARS) {
      if (!serverEnv[name]) {
        errors.push(`Incomplete Pusher configuration: missing ${name}`);
      }
    }
    for (const name of PUSHER_CLIENT_VARS) {
      if (!clientEnv[name]) {
        errors.push(`Incomplete Pusher configuration: missing ${name}`);
      }
    }
  }

  if (serverEnv.NODE_ENV === 'production') {
    if (
      !serverEnv.ADMIN_SECRET ||
      serverEnv.ADMIN_SECRET === 'dev-secret-change-in-production' ||
      serverEnv.ADMIN_SECRET.length < 32
    ) {
      errors.push(
        'ADMIN_SECRET must be at least 32 characters long in production and must not be the default value',
      );
    }

    if (!process.env.SESSION_SECRET) {
      errors.push('SESSION_SECRET is required in production and must be separate from ADMIN_SECRET');
    } else if (process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters long in production');
    }

    if (process.env.SESSION_SECRET === serverEnv.ADMIN_SECRET) {
      errors.push('SESSION_SECRET must be different from ADMIN_SECRET in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}\n\n` +
        `Please check your .env file and ensure all required variables are set.\n` +
        `See .env.example for reference.`,
    );
  }
}

export const env = {
  ...serverEnv,
  ...clientEnv,
  isDevelopment: serverEnv.NODE_ENV === 'development',
  isProduction: serverEnv.NODE_ENV === 'production',
  isTest: serverEnv.NODE_ENV === 'test',
} as const;

export const publicEnv = {
  ...clientEnv,
} as const;
