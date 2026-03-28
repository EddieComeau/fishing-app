const { test, expect } = require('@playwright/test');

async function register(page, email, password) {
  await page.goto('/');
  await page.locator('#register-form input[name="email"]').fill(email);
  await page.locator('#register-form input[name="password"]').fill(password);
  await page.locator('#register-form button[type="submit"]').click();
  await expect(page.locator('#saved-spots-panel')).toBeVisible();
}

async function saveSpot(page, { spot, name, lat, lng, tideStationId }) {
  await page.locator('input[name="spot"]').fill(spot);
  await page.locator('select[name="waterType"]').selectOption('saltwater');
  await page.locator('select[name="accessMode"]').selectOption('bank');
  await page.locator('input[name="lat"]').fill(lat);
  await page.locator('input[name="lng"]').fill(lng);
  await page.locator('input[name="tideStationId"]').fill(tideStationId);
  await page.locator('#saved-spot-name').fill(name);
  await page.locator('#save-current-spot-btn').click();
  await expect(page.locator('#saved-spots-note')).toContainText(/Saved current location context|Saved spot/i);
}

async function seedEndedSessions(page, spotName, sessionCount, catchesPerSession) {
  await page.evaluate(async ({ spotName, sessionCount, catchesPerSession }) => {
    const api = async (path, options = {}) => {
      const response = await fetch(`http://localhost:3002/api${path}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `Request failed for ${path}`);
      }

      return payload;
    };

    const savedSpots = await api('/spots/saved', { method: 'GET' });
    const targetSpot = (savedSpots.spots || []).find((spot) => spot.name === spotName);
    if (!targetSpot) {
      throw new Error(`Saved spot ${spotName} not found`);
    }

    for (let index = 0; index < sessionCount; index += 1) {
      const session = await api('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: `${spotName} Session ${index + 1}`,
          locationLabel: targetSpot.locationLabel || targetSpot.name,
          speciesFocus: 'Redfish',
          savedSpotId: targetSpot.id,
          activityLevelAtStart: catchesPerSession > 0 ? 'moderate' : 'low',
        }),
      });

      for (let catchIndex = 0; catchIndex < catchesPerSession; catchIndex += 1) {
        await api('/catches', {
          method: 'POST',
          body: JSON.stringify({
            species: 'Redfish',
            bait: 'Swimbait',
            rigName: 'Paddletail jig',
            baitFamily: 'soft plastic',
            landed: true,
            sessionId: session.session.id,
          }),
        });
      }

      await api(`/sessions/${session.session.id}/end`, {
        method: 'POST',
      });
    }
  }, { spotName, sessionCount, catchesPerSession });
}

test('spot filtering UI supports proven-only mode and low-sample warnings', async ({ page }) => {
  const email = `pw-spotfilter-${Date.now()}@fishdex.local`;
  const password = 'TestPass123!';

  await register(page, email, password);

  await saveSpot(page, {
    spot: 'Phase23 Browser Strong',
    name: 'Browser Strong Spot',
    lat: '29.2001',
    lng: '-89.2001',
    tideStationId: '8761927',
  });

  await seedEndedSessions(page, 'Browser Strong Spot', 3, 1);

  await page.locator('#saved-spots-select').selectOption({ label: 'Browser Strong Spot (saltwater)' });
  await page.locator('#spot-filter-proven-only').check();
  await page.locator('select[name="liveMode"]').selectOption('on');
  await page.locator('#context-form button[type="submit"]').click();

  await expect(page.locator('#spot-filter-note')).toContainText(/saved-spot-aligned recommendation|proven-history threshold/i);
  await expect(page.locator('#spots-output li')).toHaveCount(1);
  await expect(page.locator('#spots-output')).toContainText(/Historical confidence|Filter mode/i);
  await expect(page.locator('#spots-output')).toContainText('Filter mode');

  await saveSpot(page, {
    spot: 'Phase23 Browser Low',
    name: 'Browser Low Spot',
    lat: '29.2002',
    lng: '-89.2002',
    tideStationId: '8761927',
  });

  await seedEndedSessions(page, 'Browser Low Spot', 1, 1);

  await page.locator('#saved-spots-select').selectOption({ label: 'Browser Low Spot (saltwater)' });
  await page.locator('#load-saved-spot-btn').click();
  await page.locator('#spot-filter-proven-only').check();
  await page.locator('select[name="liveMode"]').selectOption('on');
  await page.locator('#context-form button[type="submit"]').click();

  await expect(page.locator('#spots-output')).toContainText('No spot recommendations available for this context.');
  await expect(page.locator('#spot-filter-note')).toContainText(/below the minimum threshold|History filter active/i);
  await expect(page.locator('#spots-output')).toContainText('Not enough saved-spot history to apply proven-only filtering.');
});
