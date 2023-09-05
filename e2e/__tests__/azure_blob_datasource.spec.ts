import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { DefaultAzureCredential } from '@azure/identity';
import {
  BlobServiceClient,
  ContainerCreateOptions,
  ContainerClient,
  ContainerCreateResponse,
} from '@azure/storage-blob';
import { skipLandingPage } from '../common-steps';

/*
test.beforeAll(async ({}) => {
  var conn = dotenv.config();
  dotenvExpand.expand(conn);

  const accountName = process.env.STORAGE_ACCOUNT_NAME || '';
  const containerName = 'test-container';

  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential()
  );

  const options: ContainerCreateOptions = {
    access: 'container',
  };

  const {
    containerClient,
    containerCreateResponse,
  }: {
    containerClient: ContainerClient;
    containerCreateResponse: ContainerCreateResponse;
  } = await blobServiceClient.createContainer(containerName, options);
});
*/

test('Azure Blob Datasource', async ({ page }) => {
  await page.goto('/');
  skipLandingPage(page);
  await page.getByPlaceholder('Storage Account Name').fill('gnuradio');
  await page.getByPlaceholder('Container Name').fill('e2e-test-container');
  // Note that this container was set to public so that SAS token isnt needed
  await page.locator('#AzureBlob').click();
  await expect(page.getByText('cellular3', { exact: true })).toBeVisible();
});

/*
test.afterAll(async ({}) => {
  var conn = dotenv.config();
  dotenvExpand.expand(conn);

  const accountName = process.env.STORAGE_ACCOUNT_NAME || '';
  const containerName = 'test-container';

  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential()
  );

  await blobServiceClient.deleteContainer(containerName);
});
*/
