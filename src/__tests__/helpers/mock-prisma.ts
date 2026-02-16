/**
 * Prisma Mock Helper
 * 
 * Provides a reusable Prisma client mock for testing API routes and services.
 * Use vi.mock('@/lib/db') in your test files and configure the mock behavior.
 */

import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

/**
 * Create a mock Prisma client with all common methods
 * 
 * Usage:
 * ```typescript
 * vi.mock('@/lib/db', () => ({
 *   prisma: createMockPrisma(),
 *   handleDatabaseError: vi.fn((e) => 'Database error'),
 *   isDatabaseTimeoutError: vi.fn(() => false),
 * }));
 * ```
 */
export function createMockPrisma(): Partial<PrismaClient> {
  return {
    player: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    draftConfig: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    draftState: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    pick: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    participant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    draftOrder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}
