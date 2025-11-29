# Integration Tests

This directory contains comprehensive integration tests for the Fantasy Cricket Draft system.

## Test Files

### 1. `rule-engine.test.ts`
Unit tests for the rule engine validation functions.

**Coverage:**
- Configuration validation (roster feasibility, team constraints, early round rules)
- Pick validation (player availability, team cap, early round picks)
- Edge cases and boundary conditions

**Run:**
```bash
node --test src/lib/__tests__/rule-engine.test.ts
```

### 2. `integration-draft-flow.test.ts`
End-to-end integration test for the complete draft flow.

**Coverage:**
- Create draft configuration
- Import players
- Create participants
- Start draft
- Complete full draft with multiple participants
- Verify all constraints enforced
- Export results

**Requirements:** 17.1 - All requirements

**Prerequisites:**
- Next.js development server must be running (`npm run dev`)
- Database must be accessible
- Pusher credentials must be configured

**Run:**
```bash
# Start the dev server first
npm run dev

# In another terminal
node --test src/lib/__tests__/integration-draft-flow.test.ts
```

### 3. `integration-realtime.test.ts`
Integration tests for real-time synchronization features.

**Coverage:**
- Multiple client connections
- Event broadcasting to all clients
- Latency verification (< 2 seconds)
- Player pool updates
- Client disconnection/reconnection
- State synchronization
- Round and draft completion events
- Presence indicators
- Rapid event handling

**Requirements:** 17.2 - Requirements 6.1, 6.2, 6.3, 6.4, 6.5

**Run:**
```bash
node --test src/lib/__tests__/integration-realtime.test.ts
```

### 4. `integration-edge-cases.test.ts`
Tests for edge cases and error scenarios.

**Coverage:**
- Invalid configurations
- Concurrent pick attempts
- Browser refresh during draft
- Network failure scenarios
- Boundary conditions (min/max values)
- Data validation
- Performance edge cases

**Requirements:** 17.3 - All requirements

**Run:**
```bash
node --test src/lib/__tests__/integration-edge-cases.test.ts
```

## Running All Tests

### Run all tests at once:
```bash
node --test src/lib/__tests__/*.test.ts
```

### Run specific test file:
```bash
node --test src/lib/__tests__/rule-engine.test.ts
```

### Run with verbose output:
```bash
node --test --test-reporter=spec src/lib/__tests__/*.test.ts
```

## Test Environment Setup

### 1. Database Setup
Ensure your database is running and accessible:
```bash
# Push schema to database
npm run db:push

# Seed with test data (optional)
npm run db:seed
```

### 2. Environment Variables
Create a `.env` file with test credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/fantasy_cricket_draft_test"
PUSHER_APP_ID="test_app_id"
PUSHER_KEY="test_key"
PUSHER_SECRET="test_secret"
PUSHER_CLUSTER="test_cluster"
NEXT_PUBLIC_PUSHER_KEY="test_key"
NEXT_PUBLIC_PUSHER_CLUSTER="test_cluster"
```

### 3. Start Development Server
For integration tests that require API endpoints:
```bash
npm run dev
```

## Test Data

### Mock Players
Tests use generated mock players with the following distribution:
- 10 IPL teams (CSK, MI, GT, RR, RCB, KKR, LSG, SRH, PBKS, DC)
- 4 roles (Bat, Bowl, AR, WK)
- 20% foreign players

### Mock Configuration
Default test configuration:
- Roster size: 8
- Max per team: 2
- Mandatory roles: 3 Bat, 3 Bowl, 1 AR, 1 WK
- Early round rule: 4 rounds, 2 Bat, 2 Bowl minimum

## Continuous Integration

### GitHub Actions
Add to `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: fantasy_cricket_draft_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run db:push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fantasy_cricket_draft_test
      
      - name: Run tests
        run: node --test src/lib/__tests__/*.test.ts
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fantasy_cricket_draft_test
```

## Troubleshooting

### Tests fail with "Connection refused"
- Ensure the Next.js dev server is running for integration tests
- Check that the database is accessible
- Verify environment variables are set correctly

### Tests timeout
- Increase timeout in test configuration
- Check network connectivity
- Verify Pusher credentials are valid

### Database errors
- Reset the database: `npm run db:push --force-reset`
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running

### Real-time tests fail
- Verify Pusher credentials
- Check network connectivity
- Ensure WebSocket connections are not blocked

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after tests complete
3. **Mocking**: Use mocks for external services when possible
4. **Assertions**: Use descriptive assertion messages
5. **Performance**: Keep tests fast (< 5 seconds per test file)

## Coverage Goals

- Unit tests: > 80% code coverage
- Integration tests: All critical user flows
- Edge cases: All known error scenarios
- Performance: All tests complete in < 30 seconds total

## Future Enhancements

- Add visual regression tests for UI components
- Add load testing for concurrent users
- Add security testing for API endpoints
- Add accessibility testing for UI
- Add mobile-specific tests
