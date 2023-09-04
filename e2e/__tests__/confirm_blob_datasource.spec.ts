import { test } from '@playwright/test';
import { skipLandingPage } from '../common-steps';

test('Confirm a blob datasource @CICompatible', async ({ page }) => {
  await page.goto('/');
  skipLandingPage(page);

  const grRepo = page.locator('#GNURadioSigMFRepo');
  const grRepo2 = page.locator('#GNURadioHostedRecordings');
  await grRepo.or(grRepo2).last().click();
  await page.locator('[id="IQEngineLogo"]').click();
});
