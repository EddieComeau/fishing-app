const { test, expect } = require('@playwright/test');

test('saved spots can persist context, reload it, and support session setup', async ({ page }) => {
  const email = `pw-saved-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.goto('/');

  await page.locator('#register-form input[name="email"]').fill(email);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();

  await expect(page.locator('#saved-spots-panel')).toBeVisible();

  await page.locator('input[name="spot"]').fill('North Jetty');
  await page.locator('select[name="waterType"]').selectOption('saltwater');
  await page.locator('select[name="accessMode"]').selectOption('bank');
  await page.locator('input[name="lat"]').fill('27.1234');
  await page.locator('input[name="lng"]').fill('-80.4567');
  await page.locator('input[name="tideStationId"]').fill('8722670');
  await page.locator('select[name="liveMode"]').selectOption('off');
  await page.locator('#saved-spot-name').fill('North Jetty Saved');
  await page.locator('#saved-spot-notes').fill('Incoming tide lane');
  await page.locator('#save-current-spot-btn').click();

  await expect(page.locator('#saved-spots-note')).toContainText('Saved current location context.');
  await expect(page.locator('#saved-spots-select')).toContainText('North Jetty Saved');

  await page.locator('input[name="spot"]').fill('Different Spot');
  await page.locator('input[name="lat"]').fill('30.0000');
  await page.locator('input[name="lng"]').fill('-81.0000');
  await page.locator('#saved-spots-select').selectOption({ label: 'North Jetty Saved (saltwater)' });
  await page.locator('#load-saved-spot-btn').click();

  await expect(page.locator('input[name="spot"]')).toHaveValue('North Jetty');
  await expect(page.locator('input[name="lat"]')).toHaveValue('27.123400');
  await expect(page.locator('input[name="lng"]')).toHaveValue('-80.456700');
  await expect(page.locator('input[name="tideStationId"]')).toHaveValue('8722670');

  await page.locator('#context-form button[type="submit"]').click();
  await expect(page.locator('#status-banner')).toContainText('Manual mode active.');
  await expect(page.locator('#snapshot')).toContainText('North Jetty');
  await expect(page.locator('#setup-output')).toContainText(/rig|setup/i);

  await page.locator('#session-start-form button[type="submit"]').click();
  await expect(page.locator('#active-session-card')).toBeVisible();
  await expect(page.locator('#active-session-meta')).toContainText('North Jetty');

  await page.locator('#saved-spots-select').selectOption({ label: 'North Jetty Saved (saltwater)' });
  await page.locator('#saved-spot-name').fill('North Jetty Updated');
  await page.locator('#saved-spot-notes').fill('Updated note');
  await page.locator('#update-saved-spot-btn').click();

  await expect(page.locator('#saved-spots-note')).toContainText('Saved spot updated.');
  await expect(page.locator('#saved-spots-select')).toContainText('North Jetty Updated');

  await page.locator('#end-session-btn').click();
  await expect(page.locator('#session-mode-note')).toContainText('No active fishing session.');

  await page.locator('#saved-spots-select').selectOption({ label: 'North Jetty Updated (saltwater)' });
  await page.locator('#delete-saved-spot-btn').click();

  await expect(page.locator('#saved-spots-note')).toContainText('Saved spot deleted.');
  await expect(page.locator('#saved-spots-select')).toContainText('No saved spots yet');
});
