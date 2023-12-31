import { test, expect } from '@playwright/test';
import { skipLandingPage } from '../common-steps';

test('Confirm Validator and AzureBlob cards @CICompatible', async ({ page }) => {
  await page.goto('/');
  skipLandingPage(page);

  await page.locator('[id="misc_tools_button"]').click();
  await page.locator('[id="Validator"]').click();
  await expect(page.getByText('"global"', { exact: true })).toBeVisible();
});
