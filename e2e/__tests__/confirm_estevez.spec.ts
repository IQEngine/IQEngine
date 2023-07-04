import { test, expect } from '@playwright/test';

test('Estevez repocard displays with sas token', async ({ page }) => {
  await page.goto('/');
  const locateText = page.locator('div.repocardbody').filter({ hasText: 'Daniel' }).filter({ hasText: 'SAS Token' });
  await expect(locateText).toHaveCount(1);
});

test('Estevez repocard displays spectrogram page', async ({ page }) => {
  await page.goto('/');

  await page.locator('[id="DanielEstévez\\\'Recordings"]').click();
  await page.getByRole('link', { name: 'W3OH_1665MHz_2022-06-21T19_36_55_pol_x' }).click();
  await expect(page.getByText('Zoom Level')).toBeVisible();
  await expect(page.locator('span:has-text("1.0.0")')).toBeHidden();
});
