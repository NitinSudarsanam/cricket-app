/**
 * E2E Tests for Admin Functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin');
    const adminSecret = process.env.ADMIN_SECRET || 'test-admin-secret-min-32-chars-long';
    await page.fill('input[type="password"]', adminSecret);
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/admin|dashboard/i);
  });

  test('should navigate to player management', async ({ page }) => {
    await page.click('a:has-text("Players"), button:has-text("Players")');
    await expect(page).toHaveURL(/\/admin\/players/);
  });

  test('should navigate to draft configuration', async ({ page }) => {
    await page.click('a:has-text("Draft Config"), button:has-text("Draft Config")');
    await expect(page).toHaveURL(/\/admin\/draft-config/);
  });

  test('should display draft state management', async ({ page }) => {
    // Should see draft state controls
    await expect(
      page.locator('button:has-text("Start"), button:has-text("Pause"), button:has-text("Reset")')
    ).toHaveCount({ min: 1 });
  });
});
