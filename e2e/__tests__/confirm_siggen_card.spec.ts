import { test } from '@playwright/test';

test('Confirm siggen card @CICompatible', async ({ page }) => {
  await page.goto('/');

  // signal generator
  await page.locator('[id="Siggen"]').click();
  await page.locator('[id="IQEngineLogo"]').click();
});
