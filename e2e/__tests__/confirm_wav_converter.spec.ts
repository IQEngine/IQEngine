import { test, expect } from '@playwright/test';
import { skipLandingPage } from '../common-steps';
import AdmZip from 'adm-zip';

test('Confirm Wav to SigMF converter and Converter Card @CICompatible', async ({ page }) => {
  await page.goto('/');
  skipLandingPage(page);

  await page.locator('[id="misc_tools_button"]').click();
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

  const path = await download.path();
  const zip = new AdmZip(path!);
  expect(zip.getEntries()).toHaveLength(2);
  expect(zip.getEntries().map((entry) => entry.name)).toStrictEqual(['test.sigmf-data', 'test.sigmf-meta']);
});
