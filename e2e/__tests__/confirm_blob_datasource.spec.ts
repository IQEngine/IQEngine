import { test } from '@playwright/test';
import { skipLandingPage } from '../common-steps';

test('Confirm a blob datasource @CICompatible', async ({ page }) => {
  await page.goto('/');
  skipLandingPage(page);

  await page.locator('[id="GNURadioSigMFRepo"]').last().click();
  await page.locator('[id="IQEngineLogo"]').click();
});
