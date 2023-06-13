import { test, expect } from '@playwright/test';

test('API Datasource Browsing', async ({ page }) => {
  await page.goto('/');
  await page.locator('[id="\\(API\\)GNURadioSigMFRepo"]').click();
  await expect(page.getByText('AUTHOR')).toBeVisible();
});
