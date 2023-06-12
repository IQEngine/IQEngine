import { test, expect } from '@playwright/test';

// the "Open Local Directory" and "Select 1" options are not tested
test('Confirm all repos display', async ({ page }) => {
  await page.goto('/');

  await page.locator('#GNURadioSigMFRepo').click();
  await page.getByRole('link', { name: 'IQEngine', exact: true }).click();

  await page.locator('[id="DanielEstévez\\\'Recordings"]').click();
  await page.getByRole('link', { name: 'IQEngine', exact: true }).click();

  await page.locator('#NortheasternUniversity').click();
  await page.getByRole('link', { name: 'IQEngine', exact: true }).click();

  // signal generator
  await page.getByRole('button', { name: 'Siggen' }).click();
  await page.getByRole('link', { name: 'IQEngine', exact: true }).click();

  // sigmf validator page
  await page.getByRole('button', { name: 'Validator' }).click();
  await page.getByRole('link', { name: 'IQEngine', exact: true }).click();

  // Azure blob
  // await page.getByRole('button', { name: 'Browse' }).nth(3).click();
  // await page.getByRole('link', { name: 'IQEngine', exact: true }).click();
});
