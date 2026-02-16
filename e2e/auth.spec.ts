/**
 * E2E Tests for Authentication Flow
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow participant to join draft', async ({ page }) => {
    // Navigate to join page
    await page.goto('/join');
    
    // Fill in participant name
    await page.fill('input[name="name"]', 'Test Participant');
    await page.click('button[type="submit"]');
    
    // Should redirect to draft page with session cookie
    await expect(page).toHaveURL(/\/draft/);
    
    // Check that session cookie is set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'participant_session');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBeTruthy();
  });

  test('should persist session across page reloads', async ({ page }) => {
    // Join as participant
    await page.goto('/join');
    await page.fill('input[name="name"]', 'Persistent Participant');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/draft/);
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).toHaveURL(/\/draft/);
    
    // Session cookie should still exist
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'participant_session');
    expect(sessionCookie).toBeDefined();
  });

  test('should show admin login form', async ({ page }) => {
    await page.goto('/admin');
    
    // Should see admin login form
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should authenticate admin with correct secret', async ({ page }) => {
    await page.goto('/admin');
    
    // Fill admin secret (using test secret from env)
    const adminSecret = process.env.ADMIN_SECRET || 'test-admin-secret-min-32-chars-long';
    await page.fill('input[type="password"]', adminSecret);
    await page.click('button:has-text("Login")');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/);
    
    // Check admin session cookie
    const cookies = await page.context().cookies();
    const adminCookie = cookies.find(c => c.name === 'admin_session');
    expect(adminCookie).toBeDefined();
  });

  test('should reject admin login with incorrect secret', async ({ page }) => {
    await page.goto('/admin');
    
    await page.fill('input[type="password"]', 'wrong-secret');
    await page.click('button:has-text("Login")');
    
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible();
    
    // Should not set admin cookie
    const cookies = await page.context().cookies();
    const adminCookie = cookies.find(c => c.name === 'admin_session');
    expect(adminCookie).toBeUndefined();
  });
});
