/**
 * Playwright Auth Setup
 *
 * Logs in as participant and admin once, saving storage state
 * so subsequent tests don't need to repeat the login flow
 * (avoiding rate limit issues).
 */

import { test as setup, expect } from '@playwright/test';
import { loginAsParticipant, loginAsAdmin } from './helpers';

setup('authenticate as participant', async ({ page }) => {
  await loginAsParticipant(page, 'E2E Participant 1');
  expect(page.url()).toContain('/draft');
  expect(page.url()).not.toContain('/draft/login');
  await page.context().storageState({ path: 'e2e/.auth/participant.json' });
});

setup('authenticate as admin', async ({ page }) => {
  await loginAsAdmin(page);
  expect(page.url()).toContain('/admin');
  expect(page.url()).not.toContain('/admin/login');
  await page.context().storageState({ path: 'e2e/.auth/admin.json' });
});
