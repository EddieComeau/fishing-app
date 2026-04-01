const { test, expect } = require('@playwright/test');

test('completed session detail shows a read-only session review and restricts review access to the owner', async ({ page }) => {
  const emailOne = `pw-review-a-${Date.now()}@fishdex.local`;
  const emailTwo = `pw-review-b-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.goto('/');

  await page.locator('#register-form input[name="email"]').fill(emailOne);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();

  await page.locator('input[name="spot"]').fill('Review Bank');
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

  await page.locator('#session-start-form input[name="name"]').fill('Review Trip');
  await page.locator('#session-start-form input[name="speciesFocus"]').fill('Bass');
  await page.locator('#session-start-form button[type="submit"]').click();

  await page.locator('#species-input').fill('Largemouth Bass');
  await page.locator('input[name="bait"]').fill('Worm');
  await page.locator('input[name="rigName"]').fill('Texas rig');
  await page.locator('#catch-form button[type="submit"]').click();
  await page.locator('#end-session-btn').click();

  await expect(page.locator('#session-history-list')).toContainText('Review Trip');
  await page.locator('#session-history-list button').first().click();

  await expect(page.locator('#session-history-detail')).toBeVisible();
  await expect(page.locator('#session-history-review-wrap')).toBeVisible();
  await expect(page.locator('#session-history-review-output')).toContainText(/GOOD|MIXED|POOR/i);
  await expect(page.locator('#session-history-review-output')).toContainText('Expectation:');
  await expect(page.locator('#session-history-review-output')).toContainText('Summary:');
  await expect(page.locator('#session-history-review-output')).toContainText('What worked:');

  const ownerSessionId = await page.evaluate(async () => {
    const response = await fetch('http://localhost:3002/api/sessions/history', {
      credentials: 'include',
    });
    const payload = await response.json();
    return payload.sessions[0].id;
  });

  await page.locator('#logout-btn').click();

  await page.locator('#register-form input[name="email"]').fill(emailTwo);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();

  const forbiddenStatus = await page.evaluate(async (sessionId) => {
    const response = await fetch(`http://localhost:3002/api/sessions/${sessionId}/review`, {
      credentials: 'include',
    });
    return response.status;
  }, ownerSessionId);

  expect([401, 404]).toContain(forbiddenStatus);
});
