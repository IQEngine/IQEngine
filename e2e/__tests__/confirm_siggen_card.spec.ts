import { test } from '@playwright/test';

test('Confirm siggen card @CICompatible', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500); // bypass landing page is on by default but takes a moment

  // signal generator
  await page.locator('[id="Siggen"]').click();
  await page.locator('[id="IQEngineLogo"]').click();
});
