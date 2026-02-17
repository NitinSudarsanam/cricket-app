/**
 * Shared E2E test helpers
 *
 * Provides reusable login flows that match the actual application
 * routes and form elements.
 */

import { type Page, expect } from '@playwright/test';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dev-secret-change-in-production';

/**
 * Log in as a participant by selecting from the dropdown on /draft/login.
 * The app uses a <select> of pre-existing participants, not a text input.
 * Option labels include email: "Name (email)" — so we match by partial text.
 */
export async function loginAsParticipant(
  page: Page,
  participantName: string,
): Promise<void> {
  await page.goto('/draft/login');
  await page.waitForLoadState('networkidle');

  // The DraftLoginForm renders a <select id="participant"> with labels like
  // "E2E Participant 1 (e2e1@test.com)" — find the option containing the name
  const select = page.locator('select#participant');
  await expect(select).toBeVisible({ timeout: 10_000 });

  // Get the value of the option whose text contains the participant name
  const optionValue = await select
    .locator('option', { hasText: participantName })
    .first()
    .getAttribute('value');

  if (!optionValue) {
    throw new Error(`Could not find participant option containing "${participantName}"`);
  }

  await select.selectOption(optionValue);

  // Submit the form
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to /draft (NOT /draft/login — must exclude login path)
  await page.waitForURL((url) => {
    const path = new URL(url).pathname;
    return path === '/draft' || (path.startsWith('/draft') && !path.includes('login'));
  }, { timeout: 30_000 });

  // Wait for the draft page to hydrate (client components take time)
  await page.waitForLoadState('networkidle');
}

/**
 * Log in as admin via the /admin/login page.
 * The app has a password-only form at /admin/login.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  const passwordInput = page.locator('input[type="password"]');
  await expect(passwordInput).toBeVisible({ timeout: 10_000 });

  await passwordInput.fill(ADMIN_SECRET);
  await page.locator('button[type="submit"]').click();

  // Middleware redirects authenticated admin to /admin (dashboard)
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 10_000 });
}

/**
 * Set admin cookie directly via API for faster test setup.
 */
export async function loginAsAdminViaAPI(page: Page): Promise<void> {
  const response = await page.request.post('/api/auth/admin', {
    data: { password: ADMIN_SECRET },
  });
  expect(response.ok()).toBeTruthy();
}
