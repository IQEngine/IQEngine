import { test, expect } from '@playwright/test';
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

test.beforeAll(async ({ request }) => {
  const dataSource = {
    type: 'api',
    name: 'Test API DataSource',
    account: 'test_account_for_api_data_browse',
    container: 'test_container',
    description: 'test description',
    imageURL: 'https://i.etsystatic.com/20456772/r/il/a94e13/3604976065/il_1588xN.3604976065_dzyi.jpg',
  };
  const response = await request.post('/api/datasources', { data: dataSource });
});

test('API Datasource Browsing @CICompatible', async ({ page }) => {
  await page.goto('/');
  const elements = await page.locator('[id="TestAPIDataSource"]'); // After first run there will be more than one element by this name
  await elements.nth(0).click(); // Only look for the first element
  await expect(page.getByText('Author')).toBeVisible();
});

test.afterAll(async ({}) => {
  var conn = dotenv.config();
  dotenvExpand.expand(conn);

  const connection_string =
    process.env.IQENGINE_METADATA_DB_CONNECTION_STRING || 'mongodb://mongoadmin:secret@localhost:27017/admin';
  const client: MongoClient = new MongoClient(connection_string);
  await client.connect();
  const db: Db = client.db('IQEngine');
  const collection = db.collection('datasources');
  collection.deleteOne({ type: 'api', name: 'Test API DataSource' });
});
