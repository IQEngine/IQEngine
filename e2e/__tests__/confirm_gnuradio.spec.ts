import { test, expect } from '@playwright/test';

test('GNURadio repocard displays spectrogram page', async ({ page }) => {
  await page.goto('/');

  await page.locator('#GNURadioSigMFRepo').click();
  await page.getByRole('link', { name: 'analog_FM_France' }).click();
  await expect(page.getByText('Zoom Level')).toBeVisible();
  await expect(page.locator('span:has-text("1.0.0")')).toBeHidden();
});
