/**
 * E2E Tests for Draft Flow
 *
 * Tests the participant-facing draft interface.
 * Requires an in-progress draft state seeded by e2e/seed.ts.
 * Participant session is provided via storageState from auth.setup.ts.
 *
 * Note: The draft page is a Server Component that renders DraftInterface
 * (a client component). Hydration can take 10-15s, so we use generous timeouts.
 */

import { test, expect } from '@playwright/test';

const HYDRATION_TIMEOUT = 30_000;

test.describe('Draft Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to /draft — session cookie is already set via storageState
    await page.goto('/draft');
    await page.waitForLoadState('networkidle');
  });

  test('should display draft board with team sections', async ({ page }) => {
    // The DraftBoard shows team sections (CSK, MI, RCB, etc.) with player chips
    await expect(
      page.locator('text=/CSK|MI|RCB|KKR|RR/').first(),
    ).toBeVisible({ timeout: HYDRATION_TIMEOUT });
  });

  test('should show turn indicator', async ({ page }) => {
    // DraftInterface renders "Your turn" when it's the participant's turn
    // or "Waiting for ..." when it's another participant's turn
    await expect(
      page.locator('text=/Your turn|Waiting for/i').first(),
    ).toBeVisible({ timeout: HYDRATION_TIMEOUT });
  });

  test('should display participant switcher', async ({ page }) => {
    // DraftInterface renders "View as:" with buttons for each participant
    await expect(
      page.locator('text=View as:'),
    ).toBeVisible({ timeout: HYDRATION_TIMEOUT });

    // Should see all 3 participant names as buttons
    await expect(page.locator('button', { hasText: 'E2E Participant 1' }).first()).toBeVisible();
    await expect(page.locator('button', { hasText: 'E2E Participant 2' }).first()).toBeVisible();
    await expect(page.locator('button', { hasText: 'E2E Participant 3' }).first()).toBeVisible();
  });

  test('should display pick history section', async ({ page }) => {
    // PickHistory component renders "Pick History" heading
    await expect(
      page.locator('text=Pick History'),
    ).toBeVisible({ timeout: HYDRATION_TIMEOUT });

    // When no picks have been made, should show "No picks yet"
    await expect(
      page.locator('text=No picks yet'),
    ).toBeVisible();
  });

  test('should show round and on-the-clock info', async ({ page }) => {
    // DraftTopBar shows the current round and who is on the clock
    await expect(
      page.locator('text=Round').first(),
    ).toBeVisible({ timeout: HYDRATION_TIMEOUT });

    await expect(
      page.locator('text=On the Clock').first(),
    ).toBeVisible();
  });
});
