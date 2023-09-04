import { test, expect } from '@playwright/test';
import { skipLandingPage } from '../common-steps';

test('GNURadio repocard displays spectrogram page', async ({ page }) => {
  await page.goto('/');
  skipLandingPage(page);

  const grRepo = page.locator('#GNURadioSigMFRepo');
  const grRepo2 = page.locator('#GNURadioHostedRecordings');
  await grRepo.or(grRepo2).last().click();
  await page.getByRole('link', { name: 'analog_FM_France' }).click();
  await expect(page.getByText('Zoom Level')).toBeVisible();
  await expect(page.locator('span:has-text("1.0.0")')).toBeHidden();
});
