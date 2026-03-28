const { test, expect } = require('@playwright/test');

test('trip decision renders a user-facing yes/no summary without replacing the recommendation card', async ({ page }) => {
  await page.goto('/');

  await page.locator('input[name="spot"]').fill('Decision Point');
  await page.locator('select[name="waterType"]').selectOption('saltwater');
  await page.locator('select[name="accessMode"]').selectOption('bank');
  await page.locator('input[name="lat"]').fill('27.1234');
  await page.locator('input[name="lng"]').fill('-80.4567');
  await page.locator('input[name="tideStationId"]').fill('8722670');
  await page.locator('select[name="liveMode"]').selectOption('on');
  await page.locator('form#context-form button[type="submit"]').click();

  await expect(page.locator('#intelligence-output')).toBeVisible();
  await expect(page.locator('#decision-output')).toBeVisible();
  await expect(page.locator('#decision-output')).toContainText(/YES|NO|CONDITIONAL/i);
  await expect(page.locator('#decision-output')).toContainText('Primary reason:');
  await expect(page.locator('#decision-output')).toContainText('Focus:');
  await expect(page.locator('#intelligence-output')).toContainText('Spot:');
});
