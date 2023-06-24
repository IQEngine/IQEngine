import { test, expect } from '@playwright/test';

// the "Open Local Directory" and "Select 1" options are not tested
test('Confirm all repos display', async ({ page }) => {
  await page.goto('/');

  await page.locator('[id="GNURadioSigMFRepo"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  await page.locator('[id="DanielEstévez\\\'Recordings"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  await page.locator('[id="NortheasternUniversity"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  // signal generator
  await page.locator('[id="Siggen"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  // sigmf validator page
  await page.locator('[id="Validator"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  // Azure blob
  await page.locator('[id="AzureBlob"]').click();
  // doesn't currently change page as blob parameters required
  //await page.locator('[id="IQEngineLogo"]').click();
});
