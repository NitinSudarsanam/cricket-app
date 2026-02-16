/**
 * Environment Variable Validation and Type-Safe Access
 * 
 * This module validates that all required environment variables are set
 * and provides type-safe access to them throughout the application.
 */

// Server-side environment variables (never exposed to client)
const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  PUSHER_APP_ID: process.env.PUSHER_APP_ID,
  PUSHER_KEY: process.env.PUSHER_KEY,
  PUSHER_SECRET: process.env.PUSHER_SECRET,
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Client-side environment variables (exposed to browser)
const clientEnv = {
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variables are missing
 */
export function validateEnv() {
  const errors: string[] = [];

  // Required server-side variables
  const requiredServerVars = [
    'DATABASE_URL',
    'PUSHER_APP_ID',
    'PUSHER_KEY',
    'PUSHER_SECRET',
    'PUSHER_CLUSTER',
    'ADMIN_SECRET',
  ] as const;

  // In production, SESSION_SECRET is also required (separate from ADMIN_SECRET)
  if (serverEnv.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    errors.push('SESSION_SECRET is required in production and must be separate from ADMIN_SECRET');
  }

  for (const varName of requiredServerVars) {
    if (!serverEnv[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Required client-side variables
  const requiredClientVars = [
    'NEXT_PUBLIC_PUSHER_KEY',
    'NEXT_PUBLIC_PUSHER_CLUSTER',
  ] as const;

  for (const varName of requiredClientVars) {
    if (!clientEnv[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Production security checks (hard errors)
  if (serverEnv.NODE_ENV === 'production') {
    // Enforce strong ADMIN_SECRET
    if (!serverEnv.ADMIN_SECRET || 
        serverEnv.ADMIN_SECRET === 'dev-secret-change-in-production' ||
        serverEnv.ADMIN_SECRET.length < 32) {
      errors.push('ADMIN_SECRET must be at least 32 characters long in production and must not be the default value');
    }

    // Enforce separate SESSION_SECRET
    if (!process.env.SESSION_SECRET) {
      errors.push('SESSION_SECRET is required in production and must be separate from ADMIN_SECRET');
    } else if (process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters long in production');
    }

    // Ensure SESSION_SECRET is different from ADMIN_SECRET
    if (process.env.SESSION_SECRET === serverEnv.ADMIN_SECRET) {
      errors.push('SESSION_SECRET must be different from ADMIN_SECRET in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.\n` +
      `See .env.example for reference.`
    );
  }
}

/**
 * Server-side environment variables
 * Only use these in API routes, server components, or server-side code
 */
export const env = {
  ...serverEnv,
  ...clientEnv,
  
  // Helper flags
  isDevelopment: serverEnv.NODE_ENV === 'development',
  isProduction: serverEnv.NODE_ENV === 'production',
  isTest: serverEnv.NODE_ENV === 'test',
} as const;

/**
 * Client-side environment variables
 * Safe to use in client components and browser code
 */
export const publicEnv = {
  ...clientEnv,
} as const;

// Validate environment on module load (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnv();
    console.log('Environment variables validated successfully');
  } catch (error) {
    console.error('Environment validation failed:', error);
    // In development, we can continue with warnings
    // In production, this should fail the build
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}
