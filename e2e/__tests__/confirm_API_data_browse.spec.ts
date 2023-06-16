import { test, expect } from '@playwright/test';

test('API Datasource Browsing', async ({ page, request }) => {
  const dataSource = {
    type: 'api',
    name: 'Test API DataSource',
    account: 'test_account',
    container: 'test_container',
    description: 'test description',
    imageURL: 'https://i.etsystatic.com/20456772/r/il/a94e13/3604976065/il_1588xN.3604976065_dzyi.jpg',
  };

  const response = await request.post('/api/datasources', { data: dataSource }); // Returns between 200 and 201 depending on local or staging environment

  await page.goto('/');
  const elements = await page.locator('[id="TestAPIDataSource"]'); // After first run there will be more than one element by this name
  await elements.nth(0).click(); // Only look for the first element
  await expect(page.getByText('AUTHOR')).toBeVisible();
});
