/**
 * E2E Tests for Draft Flow
 */

import { test, expect } from '@playwright/test';

test.describe('Draft Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as admin and start draft
    await page.goto('/admin');
    const adminSecret = process.env.ADMIN_SECRET || 'test-admin-secret-min-32-chars-long';
    await page.fill('input[type="password"]', adminSecret);
    await page.click('button:has-text("Login")');
    
    // Ensure draft is started (may need to check state first)
    const startButton = page.locator('button:has-text("Start")');
    if (await startButton.isVisible()) {
      // Fill participant IDs if needed
      await startButton.click();
      // Wait for draft to start
      await page.waitForTimeout(1000);
    }
  });

  test('should display draft board', async ({ page }) => {
    // Join as participant
    await page.goto('/join');
    await page.fill('input[name="name"]', 'Draft Participant');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/draft/);
    
    // Should see draft board
    await expect(
      page.locator('[data-testid="draft-board"], .draft-board, .player-grid')
    ).toBeVisible();
  });

  test('should show current participant turn', async ({ page }) => {
    await page.goto('/join');
    await page.fill('input[name="name"]', 'Turn Participant');
    await page.click('button[type="submit"]');
    
    // Should see turn indicator
    await expect(
      page.locator('text=/your turn|current turn|round/i')
    ).toBeVisible();
  });

  test('should allow selecting a player', async ({ page }) => {
    await page.goto('/join');
    await page.fill('input[name="name"]', 'Selecting Participant');
    await page.click('button[type="submit"]');
    
    // Wait for draft board to load
    await page.waitForTimeout(1000);
    
    // Click on first available player
    const firstPlayer = page.locator('.player-chip, [data-testid*="player"]').first();
    if (await firstPlayer.isVisible()) {
      await firstPlayer.click();
      
      // Should see confirmation or pick recorded
      await expect(
        page.locator('text=/selected|picked|success/i')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display pick history', async ({ page }) => {
    await page.goto('/join');
    await page.fill('input[name="name"]', 'History Viewer');
    await page.click('button[type="submit"]');
    
    // Should see pick history section
    await expect(
      page.locator('[data-testid="pick-history"], .pick-history, text=/pick history/i')
    ).toBeVisible();
  });

  test('should update in real-time when picks are made', async ({ page, context }) => {
    // Open two browser contexts to simulate multiple participants
    const page1 = page;
    const page2 = await context.newPage();
    
    // Participant 1
    await page1.goto('/join');
    await page1.fill('input[name="name"]', 'Participant 1');
    await page1.click('button[type="submit"]');
    
    // Participant 2
    await page2.goto('/join');
    await page2.fill('input[name="name"]', 'Participant 2');
    await page2.click('button[type="submit"]');
    
    // Make a pick on page1
    await page1.waitForTimeout(1000);
    const playerChip = page1.locator('.player-chip, [data-testid*="player"]').first();
    if (await playerChip.isVisible()) {
      await playerChip.click();
      await page1.waitForTimeout(1000);
      
      // Page2 should update to show the pick
      await expect(
        page2.locator('text=/picked|selected/i')
      ).toBeVisible({ timeout: 5000 });
    }
    
    await page2.close();
  });
});
