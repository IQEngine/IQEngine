import { test, expect } from '@playwright/test';
import { ApiClient } from '../../client/src/api/datasource/ApiClient';
import { DataSourceClient } from '../../client/src/api/datasource/DataSourceClient';
import { CLIENT_TYPE_API, DataSource } from '../../client/src/api/Models';

test('API Datasource Browsing', async ({ page }) => {
  let apiClient:DataSourceClient = new ApiClient();
  let dataSource: DataSource = {
    type: "api",
    name: "Test API DataSource",
    account: "test_account",
    container: "test_container",
    description: "test description",
    imageURL: "https://i.etsystatic.com/20456772/r/il/a94e13/3604976065/il_1588xN.3604976065_dzyi.jpg"
  };

  // TODO: Either clean the DB each time, check for pre-existing or
  // tolerate a 409 (since each browser tested will run this against the
  // same DB instance at present)
  await apiClient.create(dataSource);
  
  await page.goto('/');
  await page.locator('[id="TestAPIDataSource"]').click();
  await expect(page.getByText('AUTHOR')).toBeVisible();
});
