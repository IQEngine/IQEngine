import { test, expect } from '@playwright/test';

test('API Datasource Browsing', async ({ page, request }) => {
  const dataSource = {
    type: 'api',
    name: 'Test API DataSource',
    account: 'test_account' + Math.random(),
    container: 'test_container',
    description: 'test description',
    imageURL: 'https://i.etsystatic.com/20456772/r/il/a94e13/3604976065/il_1588xN.3604976065_dzyi.jpg',
  };

  const response = await request.post('/api/datasources', { data: dataSource });
  expect(response.status()).toBe(201); // Returns between 200 and 201 depending on local or staging environment

  await page.goto('/');
  await page.locator('[id="TestAPIDataSource"]').click(); // Fails due to multiple elements with the same id after first run
  await expect(page.getByText('AUTHOR')).toBeVisible();
});
