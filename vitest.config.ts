import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/integration-draft-flow.test.ts', // node:test file, convert to E2E
      '**/integration-realtime.test.ts', // node:test file, convert to E2E
    ],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/lib/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/components/ui/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        '**/*.config.{ts,js}',
        'prisma/',
        'e2e/',
        '.next/',
        // Runtime adapters and optional integrations are covered by E2E / deploy.
        'src/lib/db.ts',
        'src/lib/draft-api-client.ts',
        'src/lib/pusher-client.ts',
        'src/lib/pusher-server.ts',
        'src/lib/security-logger.ts',
        'src/lib/sportmonks/client.ts',
        'src/lib/sportmonks/index.ts',
        'src/lib/sportmonks/mappers.ts',
        'src/lib/sportmonks/types.ts',
        'src/hooks/useDraftRealtime.ts',
        'src/hooks/useDraftSync.ts',
        'src/hooks/useToast.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
    pool: 'forks',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
