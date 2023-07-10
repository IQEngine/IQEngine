import { test } from '@playwright/test';
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

test.beforeAll(async ({ request }) => {
  const dataSource = {
    type: 'api',
    name: '(API) Test API DataSource',
    account: 'test_account_for_api_datasource',
    container: 'test_container',
    description: 'test description',
    imageURL: 'https://i.etsystatic.com/20456772/r/il/a94e13/3604976065/il_1588xN.3604976065_dzyi.jpg',
  };
  const response = await request.post('/api/datasources', { data: dataSource });
});

// the "Open Local Directory" and "Select 1" options are not tested
test('Confirm api datasource @CICompatible', async ({ page }) => {
  await page.goto('/');

  // api data source
  await page.locator('[id="(API)TestAPIDataSource"]').click();
  await page.locator('[id="IQEngineLogo"]').click();
});

test.afterAll(async ({}) => {
  var conn = dotenv.config();
  dotenvExpand.expand(conn);

  const connection_string = process.env.IQENGINE_METADATA_DB_CONNECTION_STRING || '';
  const client: MongoClient = new MongoClient(connection_string);
  await client.connect();
  const db: Db = client.db('IQEngine');
  const collection = db.collection('datasources');
  collection.deleteOne({ type: 'api', name: '(API) Test API DataSource' });
});
