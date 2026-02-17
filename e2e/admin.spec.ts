/**
 * E2E Tests for Admin Dashboard
 *
 * Tests admin navigation through the sidebar and dashboard content.
 * Admin session is provided via storageState from auth.setup.ts.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to /admin — session cookie is already set via storageState
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should display admin dashboard', async ({ page }) => {
    // The AdminLayout header has "Fantasy Cricket Draft · Admin"
    // The dashboard page has <h2>Admin Dashboard</h2>
    await expect(
      page.locator('h1, h2').filter({ hasText: /admin/i }).first(),
    ).toBeVisible();
  });

  test('should navigate to player management', async ({ page }) => {
    // Sidebar NavLink with label "Players" links to /admin/players
    await page.locator('nav a', { hasText: 'Players' }).first().click();
    await expect(page).toHaveURL(/\/admin\/players/);
  });

  test('should navigate to draft configuration', async ({ page }) => {
    // Sidebar NavLink with label "Draft Config" links to /admin/config
    await page.locator('nav a', { hasText: 'Draft Config' }).first().click();
    await expect(page).toHaveURL(/\/admin\/config/);
  });

  test('should navigate to monitor page', async ({ page }) => {
    // Sidebar NavLink with label "Monitor Draft" links to /admin/monitor
    await page.locator('nav a', { hasText: 'Monitor Draft' }).first().click();
    await expect(page).toHaveURL(/\/admin\/monitor/);
  });
});
