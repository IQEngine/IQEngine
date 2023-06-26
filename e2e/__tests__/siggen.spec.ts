import { test, expect } from '@playwright/test';

test('test siggen page', async ({ page }) => {
  await page.goto('/');
  await page.locator('[id="Siggen"]').click();
  await page.getByText('Python-Based Signal Generator');
  await expect(page.getByText('Run')).toBeVisible({ timeout: 60000 });
  // need to add some more content to the site itself to check that everything worked
});
