import { test, expect } from '@playwright/test';

test('test siggen page', async ({ page }) => {
  await page.goto('/');
  await page.locator('[id="Siggen"]').click();
  await expect(page.getByText('Python-Based Signal Generator')).toBeVisible();
  await page.getByText('Run').click();
  // need to add some more content to the site itself to check that everything worked
});
