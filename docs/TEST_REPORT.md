# Fantasy Cricket Draft -- Test Report

## Overview

This project has a comprehensive automated test suite covering unit tests, integration tests, API route tests, component tests, and end-to-end browser tests.

| Layer                  | Framework        | Tests | Status     |
|------------------------|------------------|------:|------------|
| Unit / Integration     | Vitest + JSDOM   |   321 | All passed |
| End-to-End (Browser)   | Playwright       |    20 | All passed |
| **Total**              |                  | **341** | **All passed** |

---

## Unit & Integration Tests (Vitest)

**321 tests across 28 test files**, all passing.

### Test Categories

- **Business Logic (174 tests):** Rule engine, validation, type guards, draft state management, model mappers, edge cases
- **API Routes (35 tests):** Draft pick, start, pause, reset, state, health, players, participants
- **Auth & Security (42 tests):** Session management (participant + admin), rate limiting, auth helpers
- **UI Components (60 tests):** Button, Badge, Card, Alert, StatDisplay, NavLink, DraftBoard, DraftTopBar
- **State Management (10 tests):** Zustand draft store

### Coverage Report

Coverage is collected with `@vitest/coverage-v8`. The tested library code has strong coverage:

| Module              | Statements | Branches | Functions |
|---------------------|------------|----------|-----------|
| `lib/rule-engine`   | 96.7%      | 88.2%    | 100%      |
| `lib/type-guards`   | 97.3%      | 94.1%    | 100%      |
| `lib/model-mappers` | 100%       | 96.3%    | 100%      |
| `lib/auth-helpers`  | 100%       | 100%     | 100%      |
| `lib/session`       | 89.6%      | 80%      | 100%      |
| `lib/admin-session` | 91.2%      | 86.4%    | 100%      |
| `lib/rate-limit`    | 88.2%      | 86.7%    | 100%      |
| `lib/validation`    | 57.3%      | 72.2%    | 77.8%     |
| `components/ui/*`   | 100%       | 100%     | 100%      |

**Open the full interactive report:** `coverage/index.html`

---

## End-to-End Tests (Playwright)

**20 tests across 4 test suites + 1 setup**, all passing on Chromium.

### Test Suites

- **Authentication (5 tests):** Participant login via dropdown, session persistence across reloads, admin login, admin auth rejection
- **Admin Dashboard (4 tests):** Dashboard rendering, sidebar navigation to Players, Draft Config, Monitor pages
- **Draft Flow (5 tests):** Draft board with team sections, turn indicator, participant switcher, pick history, round/clock info
- **Draft UI Elements (4 tests):** In-progress draft rendering, team sections, roster sidebar, pick history display
- **Auth Setup (2 tests):** Session bootstrap for dependent test suites (storage state reuse)

### Architecture

Tests use Playwright's **storage state** pattern to authenticate once and reuse sessions, avoiding rate limit issues on the auth endpoint. The test database is seeded with:
- 50 players across 10 IPL teams
- 3 participants
- 1 in-progress draft with snake draft order

**Open the full interactive report:** `playwright-report/index.html`

---

## How to Run

```bash
# Run unit/integration tests
npm test

# Run unit tests with coverage report
npm run test:coverage

# Run E2E tests (starts dev server automatically)
npm run test:e2e

# Run everything and generate all reports
npm run report

# Open Playwright report in browser
npx playwright show-report
```

---

## How to View Reports

### Coverage Report (Unit Tests)
Open in any browser:
```
coverage/index.html
```
Shows per-file line/function/branch coverage with source annotations.

### E2E Test Report (Playwright)
Open in any browser:
```
playwright-report/index.html
```
Or run:
```bash
npx playwright show-report
```
Shows test results, timing, and failure screenshots/traces.

---

## Tech Stack

- **Test Runner:** Vitest 2.x (unit/integration), Playwright 1.58 (E2E)
- **Assertions:** Vitest built-in + `@testing-library/jest-dom`
- **Component Testing:** `@testing-library/react` + `@testing-library/user-event`
- **Coverage:** `@vitest/coverage-v8` (V8 native coverage)
- **Mocking:** Vitest `vi.mock` / `vi.fn` for Prisma, NextRequest, Pusher
- **Browser:** Chromium (via Playwright)
- **Environment:** JSDOM (unit tests), real browser (E2E)
