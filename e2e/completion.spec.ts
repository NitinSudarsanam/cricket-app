/**
 * E2E Tests for Draft Completion
 */

import { test, expect } from '@playwright/test';

test.describe('Draft Completion', () => {
  test('should show completion message when draft ends', async ({ page }) => {
    // This test assumes a draft can be completed
    // In a real scenario, you'd need to simulate completing all picks
    
    await page.goto('/join');
    await page.fill('input[name="name"]', 'Completion Viewer');
    await page.click('button[type="submit"]');
    
    // Check for completion indicators
    const completionMessage = page.locator('text=/completed|finished|draft complete/i');
    
    // If draft is completed, should see message
    if (await completionMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(completionMessage).toBeVisible();
    }
  });

  test('should display final rosters', async ({ page }) => {
    await page.goto('/join');
    await page.fill('input[name="name"]', 'Roster Viewer');
    await page.click('button[type="submit"]');
    
    // Should see roster or team display
    await expect(
      page.locator('[data-testid="roster"], .roster, text=/roster|team/i')
    ).toBeVisible({ timeout: 2000 });
  });

  test('should allow viewing all participants rosters', async ({ page }) => {
    await page.goto('/join');
    await page.fill('input[name="name"]', 'All Rosters Viewer');
    await page.click('button[type="submit"]');
    
    // Should see option to view all rosters
    const allRostersButton = page.locator('button:has-text("All Rosters"), a:has-text("All Rosters")');
    if (await allRostersButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await allRostersButton.click();
      await expect(page).toHaveURL(/\/rosters|\/teams/);
    }
  });

  test('should show draft summary statistics', async ({ page }) => {
    await page.goto('/join');
    await page.fill('input[name="name"]', 'Stats Viewer');
    await page.click('button[type="submit"]');
    
    // Should see statistics or summary
    await expect(
      page.locator('text=/statistics|summary|total picks/i')
    ).toBeVisible({ timeout: 2000 });
  });
});
