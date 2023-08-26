import { test, expect } from '@playwright/test';
import { skipLandingPage } from '../common-steps';

test('GNURadio repocard displays spectrogram page', async ({ page }) => {
  await page.goto('/');
  skipLandingPage(page);

  await page.locator('#GNURadioSigMFRepo').last().click();
  await page.getByRole('link', { name: 'analog_FM_France' }).click();
  await expect(page.getByText('Zoom Level')).toBeVisible();
  await expect(page.locator('span:has-text("1.0.0")')).toBeHidden();
});
