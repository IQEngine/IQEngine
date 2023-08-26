export async function skipLandingPage(page) {
  // If landing page is enabled, click the browse button
  await page.waitForTimeout(1000); // bypass landing page is on by default but takes a moment. 500ms was too short for consistency on github actions
  if (await page.isVisible('[id="browse-button"]')) {
    await page.locator('[id="browse-button"]').click();
    await page.waitForTimeout(500);
  }
}
