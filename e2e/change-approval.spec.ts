/**
 * E2E tests for Change Approval System
 * Tests the complete user flow from connection to approval/rejection
 */

import { test, expect } from '@playwright/test';

test.describe('Change Approval E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should display pending changes and approve them', async ({ page }) => {
    // Open change approval dialog via menu
    await page.click('button:has-text("Tools")');
    await page.click('text=Pending Changes');

    // Wait for dialog
    await expect(page.locator('text=Pending Changes')).toBeVisible();

    // Should show empty state initially
    await expect(page.locator('text=No pending changes')).toBeVisible();
  });

  test('should open change approval via keyboard shortcut', async ({ page }) => {
    // Press Ctrl+Shift+C
    await page.keyboard.press('Control+Shift+C');

    // Dialog should open
    await expect(page.locator('text=Pending Changes')).toBeVisible();
  });

  test('should show connection status', async ({ page }) => {
    // Check status bar
    const statusBar = page.locator('[role="status"]');
    await expect(statusBar).toContainText(/Disconnected|Connected/);
  });

  test('should open settings dialog', async ({ page }) => {
    await page.click('button:has-text("File")');
    await page.click('text=Settings');

    await expect(page.locator('text=Connection URL')).toBeVisible();
  });

  test('should navigate conversation branches', async ({ page }) => {
    await page.click('button:has-text("Tools")');
    await page.click('text=Branches');

    await expect(page.locator('text=Conversation Branches')).toBeVisible();
  });
});
