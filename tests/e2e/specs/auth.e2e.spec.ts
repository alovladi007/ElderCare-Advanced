import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Welcome Back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login with demo account', async ({ page }) => {
    await page.goto('/login');

    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@eldercare.com');
    await page.fill('input[type="password"]', 'admin123');

    // Click sign in button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');

    // Verify we're on the dashboard
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  test('should use quick login button', async ({ page }) => {
    await page.goto('/login');

    // Click first quick login button (Admin)
    await page.click('button:has-text("Admin Account")');

    // Wait for navigation
    await page.waitForURL('**/dashboard');

    // Verify login success
    await expect(page.locator('text=Admin')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Click sign in
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('text=/login failed/i')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    // Click create account link
    await page.click('text=Create account');

    // Verify on register page
    await expect(page.locator('h1')).toContainText('Create Your Account');
  });

  test('should register new user', async ({ page }) => {
    await page.goto('/register');

    const uniqueEmail = `test${Date.now()}@example.com`;

    // Fill in registration form
    await page.fill('input[placeholder="John"]', 'Test');
    await page.fill('input[placeholder="Doe"]', 'User');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[placeholder="Min. 6 characters"]', 'password123');
    await page.fill('input[placeholder="Repeat password"]', 'password123');

    // Select role (Family Member is default)
    await page.click('button:has-text("Family Member")');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify successful registration
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/register');

    // Fill form with mismatched passwords
    await page.fill('input[placeholder="John"]', 'Test');
    await page.fill('input[placeholder="Doe"]', 'User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[placeholder="Min. 6 characters"]', 'password123');
    await page.fill('input[placeholder="Repeat password"]', 'differentpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=/passwords do not match/i')).toBeVisible();
  });

  test('should logout from dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@eldercare.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Click logout button
    await page.click('button:has-text("Logout")');

    // Verify redirected to login
    await page.waitForURL('**/login');
  });
});
