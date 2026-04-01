const { test, expect } = require('@playwright/test');

test('home flow emphasizes one primary path and rig guidance includes why-not reasoning', async ({ page }) => {
  const email = `pw-ui-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.goto('/');

  await expect(page.locator('h1')).toContainText('ReelLog');
  await expect(page.locator('#primary-start-fishing-btn')).toBeVisible();
  await expect(page.locator('.bottom-nav')).toContainText('Logs');
  await expect(page.locator('.bottom-nav')).toContainText('Map');
  await expect(page.locator('.bottom-nav')).toContainText('Stats');
  await expect(page.locator('.bottom-nav')).toContainText('Gear');

  await page.locator('#register-form input[name="email"]').fill(email);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();

  await page.locator('input[name="spot"]').fill('Redesign Bank');
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

  await expect(page.locator('#status-banner')).toContainText('Manual conditions ready.');
  await expect(page.locator('#conditions-anchor')).toContainText('Read the water first');
  await expect(page.locator('#score-reasons li')).toHaveCount(3);
  await expect(page.locator('#species-anchor')).toContainText('Focus the likely bite');
  await expect(page.locator('#targets')).toContainText('Primary:');
  await expect(page.locator('#targets')).toContainText('Why:');
  await expect(page.locator('#gear-anchor')).toContainText('Fish one clear setup');
  await expect(page.locator('#setup-output')).toContainText('Why Not:');
  await expect(page.locator('#strategy-anchor')).toContainText('Make the first move obvious');

  await page.locator('#session-start-form input[name="name"]').fill('UI Flow Trip');
  await page.locator('#session-start-form input[name="speciesFocus"]').fill('Bass');
  await page.locator('#session-start-form button[type="submit"]').click();

  await expect(page.locator('#active-trip-anchor')).toContainText('Trip live');
  await expect(page.locator('#active-session-card')).toBeVisible();
  await expect(page.locator('#catch-form')).toBeVisible();
  await expect(page.locator('#catch-auth-note')).toContainText('Trip live.');
});
