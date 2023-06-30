import { test } from '@playwright/test';
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

test.beforeAll(async ({ request }) => {
  console.log('confirm api datasource: inserting record for api datasource');
  const dataSource = {
    type: 'api',
    name: '(API) Test API DataSource',
    account: 'test_account_for_api_datasource',
    container: 'test_container',
    description: 'test description',
    imageURL: 'https://i.etsystatic.com/20456772/r/il/a94e13/3604976065/il_1588xN.3604976065_dzyi.jpg',
  };
  const response = await request.post('/api/datasources', { data: dataSource });
  console.log('confirm api datasource: output from inserting record:\n', response);
});

// the "Open Local Directory" and "Select 1" options are not tested
test('Confirm api datasource', async ({ page }) => {
  await page.goto('/');

  // api data source
  await page.locator('[id="(API)TestAPIDataSource"]').click();
  await page.locator('[id="IQEngineLogo"]').click();
});

test.afterAll(async ({}) => {
  console.log('confirm api datasource: cleaning up the database');
  var conn = dotenv.config();
  dotenvExpand.expand(conn);

  const connection_string = process.env.IQENGINE_METADATA_DB_CONNECTION_STRING || '';
  const client: MongoClient = new MongoClient(connection_string);
  await client.connect();
  const db: Db = client.db('IQEngine');
  const collection = db.collection('datasources');
  collection.deleteOne({ type: 'api', name: '(API) Test API DataSource' });
  console.log('confirm api datasource: done cleaning up the database');
});
