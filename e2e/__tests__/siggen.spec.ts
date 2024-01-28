import { test, expect } from '@playwright/test';

test('confirm siggen operation @CICompatible', async ({ page }) => {
  await page.goto('/browser');

  await page.locator('[id="misc_tools_button"]').click();
  await page.locator('#Siggen').click();

  const locator = page.getByText('Run');
  await expect(locator).toBeVisible({ timeout: 20000 });

  await locator.click();
  await expect(page.getByAltText('Frequency tab image')).toBeVisible({
    timeout: 20000,
  });
});
