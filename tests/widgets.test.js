/**
 * Widget System Tests
 * Tests for widget creation, customization, analytics, and management
 */

import { test, expect } from '@playwright/test';

test.describe('Widget Creation & Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await testHelpers.createTestSession('orgOwner');
    await page.goto('/dashboard');
  });

  test('Users can create new donation widgets', async ({ page }) => {
    // Navigate to widget creation
    await page.click('text=Create Widget');
    
    // Fill widget form
    await page.fill('input[name="name"]', testConfig.testWidget.name);
    await page.fill('input[name="slug"]', testConfig.testWidget.slug);
    await page.fill('textarea[name="description"]', testConfig.testWidget.config.description);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should see success message
    await expect(page.locator('text=Widget created successfully')).toBeVisible();
    
    // Should redirect to widget list or customizer
    await expect(page).toHaveURL(/widgets|customize/);
    
    testLogger.success('Widget creation works');
  });

  test('Widget slug generation is unique and URL-safe', async ({ page }) => {
    await page.goto('/widget/customize');
    
    // Test slug with special characters
    await page.fill('input[name="name"]', 'Test Widget @#$% Special!');
    await page.blur('input[name="name"]'); // Trigger slug generation
    
    const slugValue = await page.inputValue('input[name="slug"]');
    
    // Should be URL-safe
    expect(slugValue).toMatch(/^[a-z0-9-]+$/);
    expect(slugValue).toBe('test-widget-special');
    
    testLogger.success('Slug generation works correctly');
  });

  test('Widget status can be toggled (active/inactive)', async ({ page }) => {
    await page.goto('/dashboard/widgets');
    
    // Find a widget and toggle status
    const statusToggle = page.locator('[data-testid="widget-status-toggle"]').first();
    const initialState = await statusToggle.isChecked();
    
    await statusToggle.click();
    
    // Wait for API call to complete
    await page.waitForResponse('/api/widgets/**');
    
    // Status should have changed
    const newState = await statusToggle.isChecked();
    expect(newState).toBe(!initialState);
    
    testLogger.success('Widget status toggle works');
  });
});

test.describe('Widget Customization', () => {
  
  test.beforeEach(async ({ page }) => {
    await testHelpers.createTestSession('orgOwner');
    await page.goto('/widget/customize');
  });

  test('Theme customization updates preview in real-time', async ({ page }) => {
    // Change theme color
    await page.click('[data-testid="color-blue"]');
    
    // Preview should update immediately
    await expect(page.locator('[data-testid="widget-preview"]')).toHaveCSS('background-color', /blue/);
    
    // Change to different color
    await page.click('[data-testid="color-green"]');
    await expect(page.locator('[data-testid="widget-preview"]')).toHaveCSS('background-color', /green/);
    
    testLogger.success('Real-time preview works');
  });

  test('ISSUE: Reset to default functionality works', async ({ page }) => {
    // Make some customizations
    await page.fill('input[name="title"]', 'Custom Title');
    await page.click('[data-testid="color-red"]');
    await page.fill('textarea[name="description"]', 'Custom description');
    
    // Click reset button
    await page.click('button[data-testid="reset-to-default"]');
    
    // Should confirm reset
    await page.click('button:has-text("Yes, Reset")');
    
    // Values should return to defaults
    await expect(page.locator('input[name="title"]')).toHaveValue('Support Our Cause');
    await expect(page.locator('[data-testid="widget-preview"]')).toHaveCSS('background-color', /blue/); // Default theme
    
    testLogger.success('Reset to default works');
  });

  test('Changes persist after saving', async ({ page }) => {
    const customTitle = 'My Custom Widget Title';
    
    // Make customizations
    await page.fill('input[name="title"]', customTitle);
    await page.click('[data-testid="color-green"]');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Changes saved successfully')).toBeVisible();
    
    // Navigate away and back
    await page.goto('/dashboard');
    await page.goto('/widget/customize');
    
    // Changes should persist
    await expect(page.locator('input[name="title"]')).toHaveValue(customTitle);
    await expect(page.locator('[data-testid="widget-preview"]')).toHaveCSS('background-color', /green/);
    
    testLogger.success('Changes persist correctly');
  });

  test('Custom colors are applied correctly', async ({ page }) => {
    // Test custom color input
    await page.fill('input[name="customColor"]', '#ff5733');
    await page.blur('input[name="customColor"]');
    
    // Preview should reflect custom color
    await expect(page.locator('[data-testid="widget-preview"]')).toHaveCSS('background-color', 'rgb(255, 87, 51)');
    
    testLogger.success('Custom colors work');
  });
});

test.describe('Widget Analytics', () => {
  
  test.beforeEach(async ({ page }) => {
    await testHelpers.createTestSession('orgOwner');
    await testHelpers.seedTestData(); // Create test donation data
  });

  test('FIXED: Analytics page loads without errors', async ({ page }) => {
    await page.goto('/dashboard/widget/analytics');
    
    // Page should load successfully
    await expect(page.locator('h1')).toContainText('Widget Analytics');
    
    // Should not see error messages
    await expect(page.locator('text=error')).not.toBeVisible();
    await expect(page.locator('text=404')).not.toBeVisible();
    
    // Charts should be present
    await expect(page.locator('[data-testid="donation-chart"]')).toBeVisible();
    
    testLogger.success('Analytics page loads correctly');
  });

  test('Time range filters work correctly', async ({ page }) => {
    await page.goto('/dashboard/widget/analytics');
    
    // Test different time ranges
    const timeRanges = ['7d', '30d', '90d', '1y'];
    
    for (const range of timeRanges) {
      await page.click(`button:has-text("${range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}")`);
      
      // Wait for data to update
      await page.waitForResponse('/api/analytics/**');
      
      // Chart should update with new data
      await expect(page.locator('[data-testid="donation-chart"]')).toBeVisible();
    }
    
    testLogger.success('Time range filters work');
  });

  test('Stats calculations are accurate', async ({ page }) => {
    await page.goto('/dashboard/widget/analytics');
    
    // Get displayed stats
    const totalRaised = await page.locator('[data-testid="total-raised"]').textContent();
    const totalDonations = await page.locator('[data-testid="total-donations"]').textContent();
    const averageDonation = await page.locator('[data-testid="average-donation"]').textContent();
    
    // Verify calculations make sense
    const raised = parseFloat(totalRaised.replace(/[$,]/g, ''));
    const count = parseInt(totalDonations);
    const average = parseFloat(averageDonation.replace(/[$,]/g, ''));
    
    expect(Math.abs((raised / count) - average)).toBeLessThan(0.01); // Allow for rounding
    
    testLogger.success('Stats calculations are accurate');
  });

  test('Export functionality works', async ({ page }) => {
    await page.goto('/dashboard/widget/analytics');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/analytics.*\.(csv|xlsx|pdf)$/);
    
    testLogger.success('Export functionality works');
  });

  test('Refresh button updates data', async ({ page }) => {
    await page.goto('/dashboard/widget/analytics');
    
    // Get initial data
    const initialValue = await page.locator('[data-testid="total-raised"]').textContent();
    
    // Click refresh
    await page.click('button[data-testid="refresh-analytics"]');
    await page.waitForResponse('/api/analytics/**');
    
    // Data should be refreshed (may or may not change, but API should be called)
    await expect(page.locator('[data-testid="total-raised"]')).toBeVisible();
    
    testLogger.success('Refresh button works');
  });
});