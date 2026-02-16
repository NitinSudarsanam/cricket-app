import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create connection pool and adapter for Prisma 7
// Uses @prisma/adapter-pg in ALL environments (including production/Vercel).
// The pg driver adapter is the recommended Prisma 7 approach for serverless —
// it avoids the native binary engine, reducing cold starts.
const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new Pool({
      connectionString,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      max: 1, // Limit connections for serverless
      // SSL configuration: Supabase requires SSL but doesn't provide CA cert
      // In production, if Supabase provides a CA certificate, use:
      // ssl: { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT }
      // For now, we accept any certificate (known Supabase limitation)
      ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_CA_CERT
        ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT }
        : { rejectUnauthorized: false },
    })
  : undefined;
const adapter = pool ? new PrismaPg(pool) : undefined;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Test database connection
 * @returns Promise<boolean> - true if connection successful, false otherwise
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

/**
 * Handle database errors with user-friendly messages
 */
export function handleDatabaseError(error: unknown): string {
  if (error instanceof Error) {
    // Prisma-specific errors
    if (error.message.includes('P2002')) {
      return 'A record with this unique value already exists.';
    }
    if (error.message.includes('P2025')) {
      return 'Record not found.';
    }
    if (error.message.includes('P2003')) {
      return 'Foreign key constraint failed.';
    }
    if (error.message.includes('P2014')) {
      return 'Invalid ID provided.';
    }
    if (error.message.includes('ECONNREFUSED')) {
      return 'Unable to connect to database. Please check your connection.';
    }
    if (error.message.includes('does not exist')) {
      return 'Database not found. Check DATABASE_URL and ensure the database name (after the last /) exists on your server.';
    }
    if (error.message.includes('timed out') || error.message.includes('P1008')) {
      return 'Database operation timed out. If using a remote DB (e.g. Supabase), check network, region, and that the database is not paused.';
    }

    // Don't leak internal error messages - return generic message
    // Log the actual error server-side for debugging
    console.error('Database error (sanitized):', error.message);
    return 'An unexpected database error occurred.';
  }
  
  return 'An unexpected database error occurred.';
}

/** Whether the error is a timeout (P1008) – use for 503 responses */
export function isDatabaseTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('timed out') || error.message.includes('P1008');
  }
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P1008';
}
