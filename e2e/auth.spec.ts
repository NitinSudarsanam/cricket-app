/**
 * E2E Tests for Authentication Flow
 *
 * Tests participant login via /draft/login (select dropdown)
 * and admin login via /admin/login (password form).
 */

import { test, expect } from '@playwright/test';
import { loginAsParticipant, loginAsAdmin } from './helpers';

test.describe('Authentication', () => {
  test('should allow participant to join draft', async ({ page }) => {
    await loginAsParticipant(page, 'E2E Participant 1');

    // Should be on the draft page (not /draft/login)
    expect(page.url()).toContain('/draft');
    expect(page.url()).not.toContain('/draft/login');
  });

  test('should persist session across page reloads', async ({ page }) => {
    await loginAsParticipant(page, 'E2E Participant 1');

    // Should be on the draft page
    expect(page.url()).toContain('/draft');
    expect(page.url()).not.toContain('/draft/login');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on the draft page (not redirected to login)
    expect(page.url()).toContain('/draft');
    expect(page.url()).not.toContain('/draft/login');
  });

  test('should show admin login form', async ({ page }) => {
    await page.goto('/admin/login');

    // Should see the password input and submit button
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should authenticate admin with correct secret', async ({ page }) => {
    await loginAsAdmin(page);

    // Should be on the admin dashboard (not the login page)
    expect(page.url()).toContain('/admin');
    expect(page.url()).not.toContain('/admin/login');

    // Admin session cookie should be set
    const cookies = await page.context().cookies();
    const adminCookie = cookies.find((c) => c.name === 'admin_session');
    expect(adminCookie).toBeDefined();
  });

  test('should reject admin login with incorrect secret', async ({ page }) => {
    await page.goto('/admin/login');

    await page.locator('input[type="password"]').fill('wrong-secret');
    await page.locator('button[type="submit"]').click();

    // Should show an error message
    await expect(
      page.locator('text=/invalid|incorrect|failed|error/i'),
    ).toBeVisible({ timeout: 5000 });

    // Should NOT set admin cookie
    const cookies = await page.context().cookies();
    const adminCookie = cookies.find((c) => c.name === 'admin_session');
    expect(adminCookie).toBeUndefined();
  });
});
