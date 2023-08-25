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

test('Azure Blob Datasource', async ({ page }) => {
  var conn = dotenv.config();
  dotenvExpand.expand(conn);

  const accountName = process.env.STORAGE_ACCOUNT_NAME || '';

  await page.goto('/');
  await page.waitForTimeout(500); // bypass landing page is on by default but takes a moment
  await page.getByPlaceholder('Storage Account Name').fill(accountName);
  await page.getByPlaceholder('Container Name').fill('test-container');
  await page.locator('#AzureBlob').click();
  await expect(page.getByRole('cell', { name: 'Spectrogram Thumbnail' })).toBeVisible({
    timeout: 15000,
  });
});

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
