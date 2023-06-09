import { test, expect } from '@playwright/test';

test('API Datasource Browsing', async ({ page }) => {
  await page.goto('/');
  await page.locator('[id="\\(API\\)GNURadioSigMFRepo"]').click();
  await page.getByRole('link', { name: 'bluetooth' }).click();
  await expect(page.getByText('Zoom Level')).toBeVisible();
});
