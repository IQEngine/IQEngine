import { test } from '@playwright/test';
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

test.beforeAll(async ({ request }) => {
  console.log('inserting record for api datasource');
  const dataSource = {
    type: 'api',
    name: '(API) Test API DataSource',
    account: 'test_account',
    container: 'test_container',
    description: 'test description',
    imageURL: 'https://i.etsystatic.com/20456772/r/il/a94e13/3604976065/il_1588xN.3604976065_dzyi.jpg',
  };
  const response = await request.post('/api/datasources', { data: dataSource });
  console.log('output from inserting record:\n', response);
});

// the "Open Local Directory" and "Select 1" options are not tested
test('Confirm all repos display', async ({ page }) => {
  await page.goto('/');

  await page.locator('[id="GNURadioSigMFRepo"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  await page.locator('[id="DanielEstévez\\\'Recordings"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  await page.locator('[id="NortheasternUniversity"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  // api data source
  await page.locator('[id="(API)TestAPIDataSource"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  // signal generator
  await page.locator('[id="Siggen"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  // sigmf validator page
  await page.locator('[id="Validator"]').click();
  await page.locator('[id="IQEngineLogo"]').click();

  // Azure blob
  await page.locator('[id="AzureBlob"]').click();
  // doesn't currently change page as blob parameters required
  //await page.locator('[id="IQEngineLogo"]').click();
});

test.afterAll(async ({}) => {
  console.log('cleaning up the database');
  var conn = dotenv.config();
  dotenvExpand.expand(conn);

  const connection_string = process.env.IQENGINE_METADATA_DB_CONNECTION_STRING || '';
  const client: MongoClient = new MongoClient(connection_string);
  await client.connect();
  const db: Db = client.db('IQEngine');
  const collection = db.collection('datasources');
  collection.deleteOne({ type: 'api', name: '(API) Test API DataSource' });
  console.log('done cleaning up the database');
});
