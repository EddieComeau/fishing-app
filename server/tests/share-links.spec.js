const { test, expect } = require('@playwright/test');

test('share buttons create read-only public links for completed trips and saved spots', async ({ page }) => {
  const email = `pw-share-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.goto('/');

  await page.locator('#register-form input[name="email"]').fill(email);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();

  await page.locator('input[name="spot"]').fill('Share Jetty');
  await page.locator('select[name="waterType"]').selectOption('saltwater');
  await page.locator('select[name="accessMode"]').selectOption('bank');
  await page.locator('input[name="lat"]').fill('27.1234');
  await page.locator('input[name="lng"]').fill('-80.4567');
  await page.locator('input[name="tideStationId"]').fill('8722670');
  await page.locator('select[name="liveMode"]').selectOption('off');
  await page.locator('#saved-spot-name').fill('Share Spot');
  await page.locator('#save-current-spot-btn').click();

  await expect(page.locator('#saved-spot-summary-wrap')).toBeVisible();
  await page.locator('#share-saved-spot-btn').click();
  await expect(page.locator('#saved-spot-share-note')).toContainText('http://localhost:3002/share/');

  const spotShareUrl = await page.locator('#saved-spot-share-note').textContent();
  const normalizedSpotUrl = spotShareUrl.replace(/^Share link (copied|ready):\s*/, '');

  await page.locator('#session-start-form input[name="name"]').fill('Shareable Trip');
  await page.locator('#session-start-form input[name="speciesFocus"]').fill('Redfish');
  await page.locator('#session-start-form button[type="submit"]').click();

  await page.locator('#species-input').fill('Redfish');
  await page.locator('input[name="bait"]').fill('Paddletail');
  await page.locator('input[name="rigName"]').fill('Paddletail jig');
  await page.locator('#catch-form button[type="submit"]').click();
  await page.locator('#end-session-btn').click();

  await expect(page.locator('#session-history-list')).toContainText('Shareable Trip');
  await page.locator('#session-history-list button').first().click();
  await expect(page.locator('#session-history-detail')).toBeVisible();

  await page.locator('#share-session-btn').click();
  await expect(page.locator('#session-share-note')).toContainText('http://localhost:3002/share/');

  const sessionShareUrl = await page.locator('#session-share-note').textContent();
  const normalizedSessionUrl = sessionShareUrl.replace(/^Share link (copied|ready):\s*/, '');

  const sharePage = await page.context().newPage();
  await sharePage.goto(normalizedSessionUrl);
  await expect(sharePage.locator('body')).toContainText('FishDex Shared Session');
  await expect(sharePage.locator('body')).toContainText('Shareable Trip');
  await expect(sharePage.locator('body')).toContainText('Paddletail jig');
  await expect(sharePage.locator('body')).not.toContainText('27.1234');

  const spotPage = await page.context().newPage();
  await spotPage.goto(normalizedSpotUrl);
  await expect(spotPage.locator('body')).toContainText('FishDex Shared Spot');
  await expect(spotPage.locator('body')).toContainText('Share Spot');
  await expect(spotPage.locator('body')).not.toContainText('27.1234');
});
