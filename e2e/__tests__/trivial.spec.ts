import { test, expect } from '@playwright/test';
import { skipLandingPage } from '../common-steps';

test('homepage has title @CICompatible', async ({ page }) => {
  await page.goto('/');
  skipLandingPage(page);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle('IQ Engine');
});
