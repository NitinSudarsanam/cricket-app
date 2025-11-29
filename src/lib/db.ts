import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create connection pool and adapter for Prisma 7
const connectionString = process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString }) : undefined;
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
    
    return error.message;
  }
  
  return 'An unexpected database error occurred.';
}
