import { test } from '@playwright/test';

test('Confirm a blob datasource', async ({ page }) => {
  await page.goto('/browser');
  const grRepo = page.locator('#GNURadioSigMFRepo');
  const grRepo2 = page.locator('#GNURadioHostedRecordings');
  await grRepo.or(grRepo2).last().click();
  await page.locator('[id="IQEngineLogo"]').click();
});
