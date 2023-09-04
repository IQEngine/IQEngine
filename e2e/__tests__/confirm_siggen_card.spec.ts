import { test } from '@playwright/test';
import { skipLandingPage } from '../common-steps';

test('Confirm siggen card @CICompatible', async ({ page }) => {
  await page.goto('/');
  skipLandingPage(page);

  // signal generator
  await page.locator('[id="Siggen"]').click();
  await page.locator('[id="IQEngineLogo"]').click();
});
