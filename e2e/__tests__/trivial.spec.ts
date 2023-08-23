import { test, expect } from '@playwright/test';

test('homepage has title @CICompatible', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500); // bypass landing page is on by default but takes a moment

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle('IQ Engine');
});
