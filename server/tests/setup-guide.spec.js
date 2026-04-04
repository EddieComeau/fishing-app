const { test, expect } = require('@playwright/test');

async function dismissOnboardingIfVisible(page) {
  const skipButton = page.locator('#onboarding-skip-btn');
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }
}

test('setup guide walks one step at a time without changing rig recommendation output', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await dismissOnboardingIfVisible(page);

  await page.locator('input[name="spot"]').fill('Guide Test Bank');
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

  await expect(page.locator('#setup-output')).toContainText('Texas rig');
  await expect(page.locator('#setup-guide-entry-output')).toContainText('Texas Rig Setup');
  await expect(page.locator('#setup-guide-transition-note')).toContainText('Set it up, then check it');

  await page.locator('[data-setup-guide-open="texas_rig"]').click();
  await expect(page.locator('#setup-guide-overlay')).toBeVisible();
  await expect(page.locator('#setup-guide-title')).toContainText('Texas Rig Setup');
  await expect(page.locator('#setup-guide-step-title')).toContainText('Insert Hook');
  await expect(page.locator('#setup-guide-progress-bar')).toHaveAttribute('style', /25%/);

  await page.locator('#setup-guide-next-btn').click();
  await expect(page.locator('#setup-guide-step-label')).toContainText('Step 2 of 4');
  await expect(page.locator('#setup-guide-step-title')).toContainText('Slide Up and Rotate Hook');
  await expect(page.locator('#setup-guide-progress-bar')).toHaveAttribute('style', /50%/);

  await page.locator('#setup-guide-next-btn').click();
  await expect(page.locator('#setup-guide-step-title')).toContainText('Reinsert Hook');
  await expect(page.locator('#setup-guide-progress-bar')).toHaveAttribute('style', /75%/);

  await page.locator('#setup-guide-next-btn').click();
  await expect(page.locator('#setup-guide-step-title')).toContainText('Add Weight');
  await expect(page.locator('#setup-guide-next-btn')).toContainText('Done');
  await expect(page.locator('#setup-guide-progress-bar')).toHaveAttribute('style', /100%/);

  await page.locator('#setup-guide-next-btn').click();
  await expect(page.locator('#setup-guide-overlay')).toBeHidden();
  await expect(page.locator('#setup-output')).toContainText('Texas rig');
  await expect(page.locator('#setup-guide-transition-note')).toContainText('Ready to check your setup?');

  await page.locator('#rig-check-rig').selectOption('Texas rig');
  await page.locator('#rig-check-hook').selectOption('offset worm hook');
  await page.locator('#rig-check-weight').selectOption('bullet weight');
  await page.locator('#rig-check-bait').selectOption('soft plastic worm');
  await page.locator('#rig-check-submit-btn').click();
  await expect(page.locator('#rig-check-next-actions')).toContainText('Ready to start fishing?');

  await page.locator('[data-setup-guide-open="palomar_knot"]').click();
  await expect(page.locator('#setup-guide-title')).toContainText('Palomar Knot');
  await expect(page.locator('#setup-guide-subtitle')).toContainText('Strong and simple');
  await page.locator('#setup-guide-close-btn').click();
  await expect(page.locator('#setup-guide-overlay')).toBeHidden();
});
