import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await expect(page).toHaveTitle(/setlist/i);
});
