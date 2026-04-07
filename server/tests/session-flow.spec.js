const { test, expect } = require('@playwright/test');

async function dismissOnboardingIfVisible(page) {
  const skipButton = page.locator('#onboarding-skip-btn');
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }
}

test('session flow keeps outing context coherent through start, catch, refresh, and end', async ({ page }) => {
  const email = `pw-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.goto('/');
  await dismissOnboardingIfVisible(page);

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

  await expect(page.locator('#status-banner')).toContainText('Manual plan ready.');
  await expect(page.locator('#setup-output')).toContainText(/rig|setup/i);

  const suggestedSessionName = page.locator('#session-start-form input[name="name"]');
  await expect(suggestedSessionName).not.toHaveValue('');
  await page.locator('#session-start-form button[type="submit"]').click();

  await expect(page.locator('#active-session-card')).toBeVisible();
  await expect(page.locator('#active-session-meta')).toContainText('active');
  await expect(page.locator('#catch-auth-note')).toContainText('Trip live. Log the catch, then get back to fishing.');

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
  await expect(page.locator('#session-mode-note')).toContainText('Start the trip when the plan looks right.');
});

test('blank coordinates stay invalid instead of degrading into 0,0 requests', async ({ page }) => {
  await page.goto('/');
  await dismissOnboardingIfVisible(page);

  await page.locator('input[name="spot"]').fill('Needs Coordinates');
  await page.locator('select[name="liveMode"]').selectOption('off');
  await page.locator('input[name="lat"]').fill('');
  await page.locator('input[name="lng"]').fill('');
  await page.locator('#context-form button[type="submit"]').click();

  await expect(page.locator('#status-banner')).toContainText(
    'Enter latitude and longitude to analyze local conditions.'
  );
  await expect(page.locator('#score-regime')).toContainText('Location required');
  await expect(page.locator('#bite-window-output')).toContainText(
    'Enter coordinates to generate a bite window outlook.'
  );
  await expect(page.locator('#targets')).toContainText(
    'Add a location to surface likely species.'
  );
});

test('out-of-range coordinates are rejected before provider calls', async ({ page }) => {
  await page.goto('/');
  await dismissOnboardingIfVisible(page);

  await page.locator('input[name="spot"]').fill('Out Of Range');
  await page.locator('select[name="liveMode"]').selectOption('off');
  await page.locator('input[name="lat"]').fill('91');
  await page.locator('input[name="lng"]').fill('-181');
  await page.locator('#context-form button[type="submit"]').click();

  await expect(page.locator('#status-banner')).toContainText(
    'Latitude must be between -90 and 90, and longitude must be between -180 and 180.'
  );
  await expect(page.locator('#score-regime')).toContainText('Location required');
  await expect(page.locator('#targets')).toContainText(
    'Add a location to surface likely species.'
  );
});
