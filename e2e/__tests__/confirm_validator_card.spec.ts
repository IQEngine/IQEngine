import { test, expect } from '@playwright/test';

test('Confirm Validator and AzureBlob cards @CICompatible', async ({ page }) => {
  await page.goto('/browser');

  await page.locator('[id="misc_tools_button"]').click();
  await page.locator('[id="Validator"]').click();
  await expect(page.getByText('"global"', { exact: true })).toBeVisible();
});
