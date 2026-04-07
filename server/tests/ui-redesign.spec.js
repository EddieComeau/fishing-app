const { test, expect } = require('@playwright/test');

async function dismissOnboardingIfVisible(page) {
  const skipButton = page.locator('#onboarding-skip-btn');
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }
}

test('home flow emphasizes one primary path and rig guidance includes why-not reasoning', async ({ page }) => {
  const email = `pw-ui-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  if (await page.locator('#onboarding-overlay').isVisible().catch(() => false)) {
    await expect(page.locator('#onboarding-output')).toContainText('FishDex helps you decide what to do before you cast.');
    await page.locator('#onboarding-skip-btn').click();
    await expect(page.locator('#onboarding-overlay')).toBeHidden();
  }
  await expect(page.locator('h1')).toContainText('FishDex');
  await expect(page).toHaveTitle('FishDex');
  await expect(page.locator('#primary-start-fishing-btn')).toBeVisible();
  await expect(page.locator('#primary-start-fishing-btn')).toHaveCSS('min-height', '52px');
  await expect(page.locator('.hero-copy')).toContainText('See the conditions, choose the species, fish the right rig');
  await expect(page.locator('#smart-insight-output')).toContainText('Start Fishing to get a real-time plan based on your conditions.');
  await expect(page.locator('.bottom-nav')).toContainText('Logs');
  await expect(page.locator('.bottom-nav')).toContainText('Map');
  await expect(page.locator('.bottom-nav')).toContainText('Stats');
  await expect(page.locator('.bottom-nav')).toContainText('Gear');

  await page.locator('#register-form input[name="email"]').fill(email);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();
  await dismissOnboardingIfVisible(page);

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

  await expect(page.locator('#status-banner')).toContainText('Manual plan ready.');
  await expect(page.locator('#conditions-anchor')).toContainText('Read the water first');
  await expect(page.locator('#score-reasons li')).toHaveCount(3);
  await expect(page.locator('#species-anchor')).toContainText('Focus the likely bite');
  await expect(page.locator('#targets')).toContainText('Primary:');
  await expect(page.locator('#targets')).toContainText('Why:');
  await expect(page.locator('#gear-anchor')).toContainText('Fish one clear setup');
  await expect(page.locator('#setup-output')).toContainText('Why this works right now:');
  await expect(page.locator('#setup-output')).toContainText('Why not these:');
  await expect(page.locator('#setup-output')).toContainText('Confidence:');
  await expect(page.locator('#setup-output')).toContainText('What to watch:');
  await expect(page.locator('#setup-output')).toContainText('Explained, not guessed. Built from real fishing conditions.');
  await expect(page.locator('#setup-guide-transition-note')).toContainText('Set it up, then check it');
  await page.locator('[data-setup-guide-open="texas_rig"]').click();
  await page.locator('#setup-guide-next-btn').click();
  await page.locator('#setup-guide-next-btn').click();
  await page.locator('#setup-guide-next-btn').click();
  await page.locator('#setup-guide-next-btn').click();
  await expect(page.locator('#setup-guide-transition-note')).toContainText('Ready to check your setup?');
  await page.locator('#rig-check-rig').selectOption('Texas rig');
  await page.locator('#rig-check-hook').selectOption('offset worm hook');
  await page.locator('#rig-check-weight').selectOption('bullet weight');
  await page.locator('#rig-check-bait').selectOption('soft plastic worm');
  await page.locator('#rig-check-submit-btn').click();
  await expect(page.locator('#rig-check-output')).toContainText('VALID');
  await expect(page.locator('#rig-check-output')).toContainText('Dialed in and ready.');
  await expect(page.locator('#rig-check-output')).toContainText('Your setup matches the plan.');
  await expect(page.locator('#rig-check-output')).toContainText('Hook matches');
  await expect(page.locator('#rig-check-next-actions')).toContainText('Ready to start fishing?');
  await expect(page.locator('#strategy-anchor')).toContainText('Make the first move obvious');
  await expect(page.locator('#stats-anchor')).toContainText('Improve Your Catch Rate');
  await expect(page.locator('#stats-anchor')).toContainText('Pro insight coming soon.');

  await page.locator('#session-start-form input[name="name"]').fill('UI Flow Trip');
  await page.locator('#session-start-form input[name="speciesFocus"]').fill('Bass');
  await page.locator('#session-start-form button[type="submit"]').click();

  await expect(page.locator('#active-trip-anchor')).toContainText('Trip live');
  await expect(page.locator('#active-session-card')).toBeVisible();
  await expect(page.locator('#catch-form')).toBeVisible();
  await expect(page.locator('#catch-auth-note')).toContainText('Trip live. Log the catch, then get back to fishing.');
  await expect(page.locator('#active-session-rig-tools')).toContainText('Keep The Rig Ready');
  await page.locator('#active-trip-check-rig-btn').click();
  await expect(page.locator('#rig-check-wrap')).toBeInViewport();

  await expect(page.locator('#catch-form button[type="submit"]')).toHaveCSS('min-height', '52px');
  await page.locator('#species-input').fill('Largemouth Bass');
  await page.locator('input[name="bait"]').fill('Worm');
  await page.locator('input[name="rigName"]').fill('Texas rig');
  await page.locator('select[name="baitFamily"]').selectOption('soft-plastic');
  await page.locator('#catch-form button[type="submit"]').click();

  await expect(page.locator('#auth-status')).toContainText('Catch logged.');
  await expect(page.locator('#catch-list')).toContainText('Largemouth Bass');
});
