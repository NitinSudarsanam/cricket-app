/**
 * Global test setup file for Vitest
 * 
 * This file runs before all tests and sets up:
 * - Testing Library DOM matchers
 * - Global mocks
 * - Test environment configuration
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SESSION_SECRET = 'test-session-secret-min-32-chars-long';
process.env.ADMIN_SECRET = 'test-admin-secret-min-32-chars-long';

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
