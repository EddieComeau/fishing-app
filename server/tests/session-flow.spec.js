const { test, expect } = require('@playwright/test');

test('session flow keeps outing context coherent through start, catch, refresh, and end', async ({ page }) => {
  const email = `pw-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.goto('/');

  await page.locator('#register-form input[name="email"]').fill(email);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();

  await expect(page.locator('#session-panel')).toBeVisible();
  await expect(page.locator('#session-user')).toContainText(email);

  await page.locator('input[name="spot"]').fill('Playwright Test Lake');
  await page.locator('select[name="waterType"]').selectOption('freshwater');
  await page.locator('select[name="accessMode"]').selectOption('bank');
  await page.locator('input[name="lat"]').fill('28.5383');
  await page.locator('input[name="lng"]').fill('-81.3792');
  await page.locator('select[name="liveMode"]').selectOption('off');
  await page.locator('input[name="tempF"]').fill('74');
  await page.locator('input[name="windMph"]').fill('9');
  await page.locator('select[name="pressureTrend"]').selectOption('steady');
  await page.locator('select[name="tideStage"]').selectOption('n/a');
  await page.locator('#context-form button[type="submit"]').click();

  await expect(page.locator('#status-banner')).toContainText('Manual mode active.');
  await expect(page.locator('#setup-output')).toContainText(/rig|setup/i);

  const suggestedSessionName = page.locator('#session-start-form input[name="name"]');
  await expect(suggestedSessionName).not.toHaveValue('');
  await page.locator('#session-start-form button[type="submit"]').click();

  await expect(page.locator('#active-session-card')).toBeVisible();
  await expect(page.locator('#active-session-name')).not.toHaveText('');

  await page.locator('#species-input').fill('Largemouth Bass');
  await page.locator('input[name="bait"]').fill('Worm');
  await page.locator('input[name="rigName"]').fill('Texas rig');
  await page.locator('select[name="baitFamily"]').selectOption('soft-plastic');
  await page.locator('#catch-form button[type="submit"]').click();

  await expect(page.locator('#catch-list')).toContainText('Largemouth Bass');
  await expect(page.locator('#catch-list')).toContainText(/Session:\s+\d+/);
  await expect(page.locator('#active-session-summary')).toContainText('Catches');

  await page.locator('#refresh-session-btn').click();
  await expect(page.locator('#active-session-card')).toBeVisible();
  await expect(page.locator('#active-session-summary')).toContainText('Current Activity');

  await page.locator('#end-session-btn').click();
  await expect(page.locator('#session-mode-note')).toContainText('No active fishing session.');
});
