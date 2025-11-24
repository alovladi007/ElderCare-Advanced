import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Unified Dashboard
 */

test.describe('Unified Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@eldercare.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display dashboard with stats', async ({ page }) => {
    // Verify dashboard title
    await expect(page.locator('h1')).toContainText('Welcome back');

    // Verify stat cards are visible
    await expect(page.locator('text=Active Alerts')).toBeVisible();
    await expect(page.locator('text=Today\'s Tasks')).toBeVisible();
    await expect(page.locator('text=Medications')).toBeVisible();
    await expect(page.locator('text=Upcoming Appointments')).toBeVisible();
  });

  test('should display sidebar navigation', async ({ page }) => {
    // Verify sidebar is visible
    await expect(page.locator('text=ElderCare')).toBeVisible();
    await expect(page.locator('text=Advanced Platform')).toBeVisible();

    // Verify navigation items
    await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('button:has-text("Health Monitor")')).toBeVisible();
    await expect(page.locator('button:has-text("Smart Home")')).toBeVisible();
  });

  test('should toggle sidebar', async ({ page }) => {
    // Find toggle button
    const toggleButton = page.locator('button').filter({ hasText: /menu|x/i }).first();

    // Click to collapse
    await toggleButton.click();

    // Wait for animation
    await page.waitForTimeout(500);

    // Sidebar should be collapsed (only icons visible)
    // Full text should be hidden

    // Click to expand
    await toggleButton.click();
    await page.waitForTimeout(500);

    // Verify text is back
    await expect(page.locator('text=Advanced Platform')).toBeVisible();
  });

  test('should display recent alerts section', async ({ page }) => {
    const alertsSection = page.locator('h2:has-text("Recent Alerts")').locator('..');

    await expect(alertsSection).toBeVisible();
  });

  test('should display medications section', async ({ page }) => {
    const medsSection = page.locator('h2:has-text("Today\'s Medications")').locator('..');

    await expect(medsSection).toBeVisible();
  });

  test('should display appointments section', async ({ page }) => {
    const appointmentsSection = page.locator('h2:has-text("Upcoming Appointments")').locator('..');

    await expect(appointmentsSection).toBeVisible();
  });

  test('should display care tasks section', async ({ page }) => {
    const tasksSection = page.locator('h2:has-text("Today\'s Care Tasks")').locator('..');

    await expect(tasksSection).toBeVisible();
  });

  test('should display quick access menu', async ({ page }) => {
    const quickAccess = page.locator('h2:has-text("Quick Access")').locator('..');

    await expect(quickAccess).toBeVisible();

    // Verify quick access buttons
    await expect(page.locator('text=Health Monitor')).toBeVisible();
    await expect(page.locator('text=Smart Home')).toBeVisible();
    await expect(page.locator('text=Book Service')).toBeVisible();
    await expect(page.locator('text=Care Guide')).toBeVisible();
  });

  test('should navigate to health monitor', async ({ page }) => {
    // Click Health Monitor in quick access
    await page.click('button:has-text("Health Monitor")');

    // Verify navigation
    await page.waitForURL('**/monitoring/dashboard');
  });

  test('should navigate to smart home', async ({ page }) => {
    // Click Smart Home in sidebar
    await page.click('button:has-text("Smart Home")');

    // Verify navigation (might redirect or show content)
    await page.waitForTimeout(1000);
  });

  test('should display user info', async ({ page }) => {
    // Verify user name is displayed
    await expect(page.locator('text=Admin')).toBeVisible();

    // Verify role badge
    await expect(page.locator('text=ADMIN')).toBeVisible();
  });

  test('should show admin link for admin users', async ({ page }) => {
    // Admin should see Admin link in sidebar
    await expect(page.locator('button:has-text("Admin")')).toBeVisible();
  });

  test('should not show admin link for non-admin users', async ({ page }) => {
    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');

    // Login as family member
    await page.fill('input[type="email"]', 'family@example.com');
    await page.fill('input[type="password"]', 'family123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Admin link should not be visible
    const adminButton = page.locator('button:has-text("Admin")');
    await expect(adminButton).not.toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // Click logout
    await page.click('button:has-text("Logout")');

    // Verify redirected to login
    await page.waitForURL('**/login');

    // Verify can't access dashboard without login
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
  });
});
