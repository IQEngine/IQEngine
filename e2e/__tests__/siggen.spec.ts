import { test, expect } from '@playwright/test';
import { skipLandingPage } from '../common-steps';

test('confirm siggen operation  @CICompatible', async ({ page }) => {
  await page.goto('/');
  skipLandingPage(page);

  await page.locator('#Siggen').click();

  const locator = page.getByText('Run');
  await expect(locator).toBeVisible({ timeout: 20000 });

  await locator.click();
  await expect(page.getByAltText('Frequency tab image')).toBeVisible({
    timeout: 20000,
  });
});
