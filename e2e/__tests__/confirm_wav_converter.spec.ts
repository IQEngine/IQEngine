import { test, expect } from '@playwright/test';
import { skipLandingPage } from '../common-steps';

test('Confirm Validator and AzureBlob cards @CICompatible', async ({ page }) => {
  await page.goto('/');
  skipLandingPage(page);

  await page.locator('[id="convert"]').click();
  await expect(page.getByText('to SigMF', { exact: true })).toBeVisible();

  await page.selectOption('select', { label: '.wav' });
  await expect(page.getByText('Select .wav file', { exact: true })).toBeVisible();

  // Start waiting for file chooser before clicking. Note no await.  from https://playwright.dev/docs/api/class-filechooser
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('[id="file-chooser-button"]').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('test.wav');

  await page.locator('[id="convert-button"]').click();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[id="download-button"]').click();
  const download = await downloadPromise;

  await download.saveAs(download.suggestedFilename());
  console.log('file downloaded to', await download.path());
  expect(download.suggestedFilename()).toBe('test.zip');

  // TODO: unzip the file or at least make sure it contains the sigmf data and meta files
});
