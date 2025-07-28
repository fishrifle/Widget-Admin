/**
 * Authentication System Tests
 * Tests for sign-in, sign-up, session management, and redirects
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication System', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing sessions
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('Sign-in page loads correctly', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Check page loads without errors
    await expect(page).toHaveTitle(/PassItOn/);
    
    // Check sign-in form is present
    await expect(page.locator('[data-testid="sign-in-form"]')).toBeVisible();
    
    testLogger.success('Sign-in page loads correctly');
  });

  test('FIXED: Sign-in auto-redirects to dashboard', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Fill in test credentials
    await page.fill('input[type="email"]', testConfig.testUsers.orgOwner.email);
    await page.fill('input[type="password"]', testConfig.testUsers.orgOwner.password);
    
    // Click sign in
    await page.click('button[type="submit"]');
    
    // Should auto-redirect to dashboard (no manual button needed)
    await expect(page).toHaveURL('/dashboard');
    
    // Should NOT see "Go to Dashboard" button
    await expect(page.locator('text=Go to Dashboard')).not.toBeVisible();
    
    testLogger.success('Sign-in auto-redirects correctly');
  });

  test('Protected routes redirect when unauthenticated', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/dashboard');
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
    
    testLogger.success('Protected routes redirect correctly');
  });

  test('Session persists across page refreshes', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', testConfig.testUsers.orgOwner.email);
    await page.fill('input[type="password"]', testConfig.testUsers.orgOwner.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Refresh page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    testLogger.success('Session persists across refreshes');
  });

  test('Sign-out functionality works', async ({ page }) => {
    // Sign in first
    await testHelpers.createTestSession('orgOwner');
    await page.goto('/dashboard');
    
    // Click sign out
    await page.click('[data-testid="sign-out-button"]');
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
    
    // Try to access protected route - should redirect
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/);
    
    testLogger.success('Sign-out works correctly');
  });

  test('Role-based access controls work', async ({ page }) => {
    // Test super admin access
    await testHelpers.createTestSession('superAdmin');
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText('All Users');
    
    // Test regular user access (should be restricted)
    await testHelpers.createTestSession('editor');
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/dashboard'); // Should redirect
    
    testLogger.success('Role-based access works');
  });

  test('User registration flow works', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Fill registration form
    await page.fill('input[name="email"]', 'newuser@test.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or onboarding
    await expect(page).toHaveURL(/dashboard|onboarding/);
    
    testLogger.success('User registration works');
  });

  test('Password reset flow works', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Click forgot password
    await page.click('text=Forgot password?');
    
    // Fill email
    await page.fill('input[type="email"]', testConfig.testUsers.orgOwner.email);
    await page.click('button[type="submit"]');
    
    // Should show confirmation message
    await expect(page.locator('text=Check your email')).toBeVisible();
    
    testLogger.success('Password reset flow works');
  });
});

test.describe('User Role Management', () => {
  
  test('Sidebar navigation reflects user role', async ({ page }) => {
    // Test super admin sees admin links
    await testHelpers.createTestSession('superAdmin');
    await page.goto('/dashboard');
    
    await expect(page.locator('nav')).toContainText('All Users');
    await expect(page.locator('nav')).toContainText('All Widgets');
    
    // Test regular user doesn't see admin links
    await testHelpers.createTestSession('editor');
    await page.goto('/dashboard');
    
    await expect(page.locator('nav')).not.toContainText('All Users');
    
    testLogger.success('Sidebar navigation reflects roles correctly');
  });

  test('API endpoints respect user permissions', async ({ page }) => {
    // Test admin API access
    await testHelpers.createTestSession('superAdmin');
    
    const adminResponse = await page.request.get('/api/admin/users');
    expect(adminResponse.status()).toBe(200);
    
    // Test regular user API access (should be forbidden)
    await testHelpers.createTestSession('editor');
    
    const userResponse = await page.request.get('/api/admin/users');
    expect(userResponse.status()).toBe(403);
    
    testLogger.success('API endpoints respect permissions');
  });
});