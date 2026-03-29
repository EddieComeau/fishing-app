const { test, expect } = require('@playwright/test');

test('session-start guidance renders and can prefill the existing session form without auto-starting a session', async ({ page }) => {
  const email = `pw-sessionstart-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.goto('/');

  await page.locator('#register-form input[name="email"]').fill(email);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();

  await page.locator('input[name="spot"]').fill('Session Start Point');
  await page.locator('select[name="waterType"]').selectOption('saltwater');
  await page.locator('select[name="accessMode"]').selectOption('bank');
  await page.locator('input[name="lat"]').fill('27.1234');
  await page.locator('input[name="lng"]').fill('-80.4567');
  await page.locator('input[name="tideStationId"]').fill('8722670');
  await page.locator('select[name="liveMode"]').selectOption('on');
  await page.locator('form#context-form button[type="submit"]').click();

  await expect(page.locator('#session-start-intelligence-output')).toBeVisible();
  await expect(page.locator('#session-start-intelligence-output')).toContainText('Species focus:');
  await expect(page.locator('#session-start-intelligence-output')).toContainText('Starting rig:');
  await expect(page.locator('#session-start-intelligence-output')).toContainText('Focus spot:');
  await expect(page.locator('#session-start-intelligence-output')).toContainText('Departure window:');
  await expect(page.locator('#session-start-intelligence-output')).toContainText(/LOW|MODERATE|HIGH/i);

  await page.locator('#apply-session-start-suggestions-btn').click();

  await expect(page.locator('#session-start-form input[name="name"]')).not.toHaveValue('');
  await expect(page.locator('#session-start-form input[name="speciesFocus"]')).not.toHaveValue('');
  await expect(page.locator('#session-start-form')).toBeVisible();
  await expect(page.locator('#session-start-form button[type="submit"]')).toHaveText('Start Session');
});
