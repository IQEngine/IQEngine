import { test, expect } from '@playwright/test';

test('Confirm Validator and AzureBlob cards @CICompatible', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500); // bypass landing page is on by default but takes a moment
  await page.locator('[id="Validator"]').click();
  await expect(page.getByText('"global"', { exact: true })).toBeVisible();
});
