const { test, expect } = require('@playwright/test');

test('session history shows ended trips, preserves saved-spot linkage, and opens detailed summaries', async ({ page }) => {
  const email = `pw-history-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.goto('/');

  await page.locator('#register-form input[name="email"]').fill(email);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();

  await expect(page.locator('#session-history-note')).toContainText('No completed trips yet.');

  await page.locator('input[name="spot"]').fill('History Bank');
  await page.locator('select[name="waterType"]').selectOption('freshwater');
  await page.locator('select[name="accessMode"]').selectOption('bank');
  await page.locator('input[name="lat"]').fill('28.5383');
  await page.locator('input[name="lng"]').fill('-81.3792');
  await page.locator('select[name="liveMode"]').selectOption('off');
  await page.locator('input[name="tempF"]').fill('74');
  await page.locator('input[name="windMph"]').fill('8');
  await page.locator('select[name="pressureTrend"]').selectOption('steady');
  await page.locator('select[name="tideStage"]').selectOption('n/a');
  await page.locator('#context-form button[type="submit"]').click();

  await page.locator('#session-start-form input[name="name"]').fill('First History Trip');
  await page.locator('#session-start-form input[name="speciesFocus"]').fill('Bass');
  await page.locator('#session-start-form button[type="submit"]').click();
  await expect(page.locator('#active-session-card')).toBeVisible();

  await page.locator('#species-input').fill('Largemouth Bass');
  await page.locator('input[name="bait"]').fill('Worm');
  await page.locator('input[name="rigName"]').fill('Texas rig');
  await page.locator('#catch-form button[type="submit"]').click();
  await page.locator('#end-session-btn').click();

  await expect(page.locator('#session-history-list')).toContainText('First History Trip');

  await page.locator('input[name="spot"]').fill('Jetty History');
  await page.locator('select[name="waterType"]').selectOption('saltwater');
  await page.locator('input[name="lat"]').fill('27.1234');
  await page.locator('input[name="lng"]').fill('-80.4567');
  await page.locator('input[name="tideStationId"]').fill('8722670');
  await page.locator('#saved-spot-name').fill('Jetty Saved');
  await page.locator('#saved-spot-notes').fill('History-linked spot');
  await page.locator('#save-current-spot-btn').click();
  await expect(page.locator('#saved-spots-note')).toContainText('Saved current location context.');

  await page.locator('#saved-spots-select').selectOption({ label: 'Jetty Saved (saltwater)' });
  await page.locator('#load-saved-spot-btn').click();
  await expect(page.locator('input[name="spot"]')).toHaveValue('Jetty History');

  await page.locator('#session-start-form input[name="name"]').fill('Second History Trip');
  await page.locator('#session-start-form input[name="speciesFocus"]').fill('Redfish');
  await page.locator('#session-start-form button[type="submit"]').click();
  await expect(page.locator('#active-session-card')).toBeVisible();

  await page.locator('#species-input').fill('Redfish');
  await page.locator('input[name="bait"]').fill('Paddletail');
  await page.locator('input[name="rigName"]').fill('Paddletail jig');
  await page.locator('#catch-form button[type="submit"]').click();
  await page.locator('#end-session-btn').click();

  const historyButtons = page.locator('#session-history-list button');
  await expect(historyButtons).toHaveCount(2);
  await expect(page.locator('#session-history-list li').first()).toContainText('Second History Trip');
  await expect(page.locator('#session-history-list li').first()).toContainText('Saved Spot: Jetty Saved');

  await historyButtons.first().click();
  await expect(page.locator('#session-history-detail')).toBeVisible();
  await expect(page.locator('#session-history-detail-name')).toContainText('Second History Trip');
  await expect(page.locator('#session-history-detail-summary')).toContainText('Redfish');
  await expect(page.locator('#session-history-detail-summary')).toContainText('Paddletail jig');
});
