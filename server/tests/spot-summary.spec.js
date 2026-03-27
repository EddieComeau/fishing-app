const { test, expect } = require('@playwright/test');

test('saved spot summary shows deterministic performance data and low-sample warning', async ({ page }) => {
  const email = `pw-spotsummary-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.goto('/');

  await page.locator('#register-form input[name="email"]').fill(email);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();

  await page.locator('input[name="spot"]').fill('Summary Point');
  await page.locator('select[name="waterType"]').selectOption('freshwater');
  await page.locator('select[name="accessMode"]').selectOption('bank');
  await page.locator('input[name="lat"]').fill('30.3000');
  await page.locator('input[name="lng"]').fill('-81.3000');
  await page.locator('select[name="liveMode"]').selectOption('off');
  await page.locator('#saved-spot-name').fill('Summary Spot');
  await page.locator('#save-current-spot-btn').click();

  await expect(page.locator('#saved-spot-summary-wrap')).toBeVisible();
  await expect(page.locator('#saved-spot-summary')).toContainText('Sessions');
  await expect(page.locator('#saved-spot-summary')).toContainText('0');

  await page.locator('#session-start-form input[name="name"]').fill('Summary Trip');
  await page.locator('#session-start-form input[name="speciesFocus"]').fill('Bass');
  await page.locator('#session-start-form button[type="submit"]').click();
  await expect(page.locator('#active-session-card')).toBeVisible();

  await page.locator('#species-input').fill('Bluegill');
  await page.locator('input[name="bait"]').fill('Spinner');
  await page.locator('input[name="rigName"]').fill('Inline spinner');
  await page.locator('#catch-form button[type="submit"]').click();
  await page.locator('#end-session-btn').click();

  await page.locator('#saved-spots-select').selectOption({ label: 'Summary Spot (freshwater)' });

  await expect(page.locator('#saved-spot-summary-wrap')).toBeVisible();
  await expect(page.locator('#saved-spot-summary')).toContainText('Sessions');
  await expect(page.locator('#saved-spot-summary')).toContainText('1');
  await expect(page.locator('#saved-spot-summary')).toContainText('Bluegill');
  await expect(page.locator('#saved-spot-summary')).toContainText('Inline spinner');
  await expect(page.locator('#saved-spot-summary-insights')).toContainText('Limited data for this spot');
});
