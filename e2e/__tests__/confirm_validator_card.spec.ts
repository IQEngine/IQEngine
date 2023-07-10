import { test } from '@playwright/test';

test('Confirm Validator and AzureBlob cards @CICompatible', async ({ page }) => {
  await page.goto('/');

  // signal generator
  await page.locator('[id="Validator"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  // Azure blob
  await page.locator('[id="AzureBlob"]').click();
});
