/**
 * E2E Tests for Draft UI Elements
 *
 * Tests the various UI sections of the draft interface.
 * Requires an in-progress draft state seeded by e2e/seed.ts.
 * Participant session is provided via storageState from auth.setup.ts.
 *
 * Note: The draft page hydration can be slow, so generous timeouts are used.
 */

import { test, expect } from '@playwright/test';

const HYDRATION_TIMEOUT = 30_000;

test.describe('Draft UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to /draft — session cookie is already set via storageState
    await page.goto('/draft');
    await page.waitForLoadState('networkidle');
  });

  test('should show draft interface when draft is in progress', async ({ page }) => {
    // Should see at least one team section in the draft board
    await expect(
      page.locator('text=/CSK|MI|RCB/').first(),
    ).toBeVisible({ timeout: HYDRATION_TIMEOUT });
  });

  test('should display team sections in draft board', async ({ page }) => {
    // DraftBoard renders sections for each IPL team
    await expect(
      page.locator('text=CSK').first(),
    ).toBeVisible({ timeout: HYDRATION_TIMEOUT });

    // Check multiple teams are visible
    await expect(page.locator('text=MI').first()).toBeVisible();
    await expect(page.locator('text=RCB').first()).toBeVisible();
    await expect(page.locator('text=KKR').first()).toBeVisible();
  });

  test('should show roster sidebar on desktop', async ({ page }) => {
    // RosterSidebar renders "My Roster" heading and team/role distributions
    // Visible on desktop (hidden lg:block, viewport is 1280px)
    await expect(
      page.locator('text=My Roster').first(),
    ).toBeVisible({ timeout: HYDRATION_TIMEOUT });
  });

  test('should show pick count or history', async ({ page }) => {
    // Pick History section shows "Pick History" heading and "No picks yet"
    await expect(
      page.locator('text=Pick History'),
    ).toBeVisible({ timeout: HYDRATION_TIMEOUT });

    await expect(
      page.locator('text=No picks yet'),
    ).toBeVisible();
  });
});
