const { test, expect } = require('@playwright/test');

test('trip prep renders a pre-session guidance card without replacing decision or recommendation output', async ({ page }) => {
  await page.goto('/');

  await page.locator('input[name="spot"]').fill('Trip Prep Point');
  await page.locator('select[name="waterType"]').selectOption('saltwater');
  await page.locator('select[name="accessMode"]').selectOption('bank');
  await page.locator('input[name="lat"]').fill('27.1234');
  await page.locator('input[name="lng"]').fill('-80.4567');
  await page.locator('input[name="tideStationId"]').fill('8722670');
  await page.locator('select[name="liveMode"]').selectOption('on');
  await page.locator('form#context-form button[type="submit"]').click();

  await expect(page.locator('#trip-prep-output')).toBeVisible();
  await expect(page.locator('#trip-prep-output')).toContainText('Departure window:');
  await expect(page.locator('#trip-prep-output')).toContainText('Starting rig:');
  await expect(page.locator('#trip-prep-output')).toContainText('Target species:');
  await expect(page.locator('#trip-prep-output')).toContainText('Focus spot:');
  await expect(page.locator('#trip-prep-output')).toContainText('Conditions:');
  await expect(page.locator('#trip-prep-output')).toContainText('Checklist:');
  await expect(page.locator('#trip-prep-output')).toContainText(/LOW|MODERATE|HIGH/i);

  await expect(page.locator('#decision-output')).toBeVisible();
  await expect(page.locator('#intelligence-output')).toBeVisible();
  await expect(page.locator('#decision-output')).toContainText('Primary reason:');
  await expect(page.locator('#intelligence-output')).toContainText('Spot:');
});
