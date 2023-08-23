import { test } from '@playwright/test';

test('Confirm Validator and AzureBlob cards @CICompatible', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(5000);

  // signal generator
  await page.locator('[id="Validator"]').click();

  // Go to landing page, but by default its bypassed so it will redirect to the browser page
  await page.locator('[id="IQEngineLogo"]').click();

  // Go back to browser page
  //await page.locator('[id="browse-button"]').click();

  // Azure blob
  await page.locator('[id="AzureBlob"]').click();
});
