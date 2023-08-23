import { test } from '@playwright/test';

test('Confirm siggen card @CICompatible', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(5000);

  // signal generator
  await page.locator('[id="Siggen"]').click();
  await page.locator('[id="IQEngineLogo"]').click();
});
