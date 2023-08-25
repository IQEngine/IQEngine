import { test, expect } from '@playwright/test';

test('confirm siggen operation  @CICompatible', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500); // bypass landing page is on by default but takes a moment
  await page.locator('#Siggen').click();

  const locator = page.getByText('Run');
  await expect(locator).toBeVisible({ timeout: 100000 });

  await locator.click();
  await expect(page.getByAltText('Frequency tab image')).toBeVisible({
    timeout: 60000,
  });
});
