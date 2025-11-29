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

  // Validation warnings (non-blocking)
  if (serverEnv.ADMIN_SECRET === 'dev-secret-change-in-production' && serverEnv.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: Using default ADMIN_SECRET in production! Please set a secure value.');
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
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    // In development, we can continue with warnings
    // In production, this should fail the build
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}
