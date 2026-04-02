const { test, expect } = require('@playwright/test');

async function dismissOnboardingIfVisible(page) {
  const skipButton = page.locator('#onboarding-skip-btn');
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }
}

async function createEndedSession(page, { name, speciesFocus, species, bait, rigName }) {
  return page.evaluate(async (payload) => {
    async function apiJson(url, options = {}) {
      const response = await fetch(`http://localhost:3002/api${url}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || `Request failed for ${url}`);
      }
      return body;
    }

    const sessionResponse = await apiJson('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        speciesFocus: payload.speciesFocus,
        locationLabel: 'Comparison Bank',
      }),
    });

    const sessionId = sessionResponse.session.id;

    await apiJson('/catches', {
      method: 'POST',
      body: JSON.stringify({
        species: payload.species,
        bait: payload.bait,
        rigName: payload.rigName,
        baitFamily: 'soft-plastic',
        landed: true,
        sessionId,
      }),
    });

    await apiJson(`/sessions/${sessionId}/end`, {
      method: 'POST',
    });

    return sessionId;
  }, { name, speciesFocus, species, bait, rigName });
}

test('completed session detail shows a read-only session comparison and restricts comparison access to the owner', async ({ page }) => {
  const emailOne = `pw-comparison-a-${Date.now()}@fishdex.local`;
  const emailTwo = `pw-comparison-b-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.goto('/');
  await dismissOnboardingIfVisible(page);

  await page.locator('#register-form input[name="email"]').fill(emailOne);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();
  await expect(page.locator('#session-user')).toContainText(emailOne);

  await page.locator('input[name="spot"]').fill('Comparison Bank');
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

  await createEndedSession(page, {
    name: 'Comparison Trip One',
    speciesFocus: 'Bass',
    species: 'Largemouth Bass',
    bait: 'Worm',
    rigName: 'Texas rig',
  });
  await createEndedSession(page, {
    name: 'Comparison Trip Two',
    speciesFocus: 'Bass',
    species: 'Largemouth Bass',
    bait: 'Worm',
    rigName: 'Texas rig',
  });
  await createEndedSession(page, {
    name: 'Comparison Trip Three',
    speciesFocus: 'Bass',
    species: 'Largemouth Bass',
    bait: 'Worm',
    rigName: 'Texas rig',
  });

  await page.reload();
  await dismissOnboardingIfVisible(page);
  await expect(page.locator('#session-user')).toContainText(emailOne);
  await expect(page.locator('#session-history-list')).toContainText('Comparison Trip Three');
  await page.locator('#session-history-list button').first().click();

  await expect(page.locator('#session-history-detail')).toBeVisible();
  await expect(page.locator('#session-history-comparison-wrap')).toBeVisible();
  await expect(page.locator('#session-history-comparison-output')).toContainText(/ABOVE AVERAGE|TYPICAL|BELOW AVERAGE/i);
  await expect(page.locator('#session-history-comparison-output')).toContainText('Trend:');
  await expect(page.locator('#session-history-comparison-output')).toContainText('Baseline window:');
  await expect(page.locator('#session-history-comparison-output')).toContainText('Summary:');
  await expect(page.locator('#session-history-comparison-output')).toContainText('Deltas:');
  await expect(page.locator('#session-history-comparison-output')).toContainText('Patterns:');

  const ownerSessionId = await page.evaluate(async () => {
    const response = await fetch('http://localhost:3002/api/sessions/history', {
      credentials: 'include',
    });
    const payload = await response.json();
    return payload.sessions[0].id;
  });

  const compareWindowPayload = await page.evaluate(async (sessionId) => {
    const response = await fetch(`http://localhost:3002/api/sessions/${sessionId}/comparison?compareWindow=3`, {
      credentials: 'include',
    });
    return response.json();
  }, ownerSessionId);

  expect(compareWindowPayload.comparison.baselineWindow).toBe(3);
  expect(['above_average', 'typical', 'below_average']).toContain(compareWindowPayload.comparison.relativeOutcome);
  expect(['improving', 'steady', 'declining', 'unclear']).toContain(compareWindowPayload.comparison.trend);
  expect(Array.isArray(compareWindowPayload.patterns)).toBeTruthy();

  await page.locator('#logout-btn').click();

  await page.locator('#register-form input[name="email"]').fill(emailTwo);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();
  await expect(page.locator('#session-user')).toContainText(emailTwo);

  const forbiddenStatus = await page.evaluate(async (sessionId) => {
    const response = await fetch(`http://localhost:3002/api/sessions/${sessionId}/comparison`, {
      credentials: 'include',
    });
    return response.status;
  }, ownerSessionId);

  expect([401, 404]).toContain(forbiddenStatus);
});
