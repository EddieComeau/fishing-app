const { test, expect } = require('@playwright/test');

async function dismissOnboardingIfVisible(page) {
  const skipButton = page.locator('#onboarding-skip-btn');
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }
}

async function apiJson(page, url, options = {}) {
  return page.evaluate(async ({ url: targetUrl, options: requestOptions }) => {
    const response = await fetch(`http://localhost:3002/api${targetUrl}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(requestOptions.headers || {}),
      },
      ...requestOptions,
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || `Request failed for ${targetUrl}`);
    }
    return body;
  }, { url, options });
}

async function createEndedSession(page, { name, speciesFocus, species, bait, rigName, catches = 1 }) {
  const sessionResponse = await apiJson(page, '/sessions', {
    method: 'POST',
    body: JSON.stringify({
      name,
      speciesFocus,
      locationLabel: 'Profile Bank',
      activityLevelAtStart: 'moderate',
      biteWindowStrength: 1,
    }),
  });

  const sessionId = sessionResponse.session.id;

  for (let index = 0; index < catches; index += 1) {
    await apiJson(page, '/catches', {
      method: 'POST',
      body: JSON.stringify({
        species,
        bait,
        rigName,
        baitFamily: 'soft-plastic',
        landed: true,
        sessionId,
      }),
    });
  }

  await apiJson(page, `/sessions/${sessionId}/end`, {
    method: 'POST',
  });
}

test('fishing profile renders a read-only user-level profile for authenticated users', async ({ page }) => {
  const email = `pw-profile-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.goto('/');
  await dismissOnboardingIfVisible(page);

  await page.locator('#register-form input[name="email"]').fill(email);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();
  await expect(page.locator('#session-user')).toContainText(email);

  await page.locator('input[name="spot"]').fill('Profile Bank');
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
    name: 'Profile Trip One',
    speciesFocus: 'Bass',
    species: 'Largemouth Bass',
    bait: 'Worm',
    rigName: 'Texas rig',
    catches: 2,
  });
  await createEndedSession(page, {
    name: 'Profile Trip Two',
    speciesFocus: 'Bass',
    species: 'Largemouth Bass',
    bait: 'Worm',
    rigName: 'Texas rig',
    catches: 1,
  });
  await createEndedSession(page, {
    name: 'Profile Trip Three',
    speciesFocus: 'Bass',
    species: 'Largemouth Bass',
    bait: 'Worm',
    rigName: 'Texas rig',
    catches: 2,
  });

  await page.reload();
  await dismissOnboardingIfVisible(page);
  await expect(page.locator('#session-user')).toContainText(email);
  await expect(page.locator('#profile-note')).toContainText('Pro insight coming soon.');
  await expect(page.locator('#profile-wrap')).toBeVisible();
  await expect(page.locator('#profile-output')).toContainText('Style:');
  await expect(page.locator('#profile-output')).toContainText('Consistency:');
  await expect(page.locator('#profile-output')).toContainText('Summary:');
  await expect(page.locator('#profile-output')).toContainText('Strengths:');
  await expect(page.locator('#profile-output')).toContainText('Tendencies:');
  await expect(page.locator('#profile-output')).toContainText('Patterns:');

  const payload = await apiJson(page, '/profile', { method: 'GET' });
  expect(payload.profile.style).toMatch(/angler/i);
  expect(['low', 'moderate', 'high']).toContain(payload.profile.consistency);
  expect(['low', 'moderate', 'high']).toContain(payload.profile.confidence);
  expect(Array.isArray(payload.strengths)).toBeTruthy();
  expect(Array.isArray(payload.patterns)).toBeTruthy();
});
