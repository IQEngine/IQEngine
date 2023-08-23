import { test } from '@playwright/test';

test('Confirm Validator and AzureBlob cards @CICompatible', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500); // bypass landing page is on by default but takes a moment

  // signal generator
  await page.locator('[id="Validator"]').click();

  // Go to landing page, but by default its bypassed so it will redirect to the browser page
  await page.locator('[id="IQEngineLogo"]').click();
  await page.waitForTimeout(500); // bypass landing page is on by default but takes a moment

  // Azure blob
  await page.locator('[id="AzureBlob"]').click();
});
