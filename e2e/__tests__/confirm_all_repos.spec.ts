import { test, expect } from '@playwright/test';

// the "Open Local Directory" and "Select 1" options are not tested
test('Confirm all repos display', async ({ page }) => {
  await page.goto('/');

  await page.locator('[id="GNURadioSigMFRepo"]').click();
  await page.getByRole('img', { name: 'IQEngine', exact: true }).click();

  await page.locator('[id="DanielEstévez\\\'Recordings"]').click();
  await page.getByRole('img', { name: 'IQEngine', exact: true }).click();

  await page.locator('[id="NortheasternUniversity"]').click();
  await page.getByRole('img', { name: 'IQEngine', exact: true }).click();

  // signal generator
  await page.locator('[id="Siggen"]').click();
  await page.getByRole('img', { name: 'IQEngine', exact: true }).click();

  // sigmf validator page
  await page.locator('[id="Validator"]').click();
  await page.getByRole('img', { name: 'IQEngine', exact: true }).click();

  // Azure blob
  await page.locator('[id="AzureBlob"]').click();
  // doesn't currently change page as blob parameters required
  //await page.getByRole('img', { name: 'IQEngine', exact: true }).click();
});
