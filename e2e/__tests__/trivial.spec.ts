import { test, expect } from '@playwright/test';

test('homepage has title @CICompatible', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(5000);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle('IQ Engine');
});
