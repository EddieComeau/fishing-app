function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatLocalTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatWindow(dateStart, dateEnd, type, reason, scoreBoost) {
  return {
    start: formatLocalTime(dateStart),
    end: formatLocalTime(dateEnd),
    type,
    reason,
    scoreBoost,
  };
}

function normalizePressureTrend(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'dropping' || normalized === 'rising' || normalized === 'steady') {
    return normalized;
  }
  return null;
}

// Approximate sunrise/sunset calculation based on the NOAA solar algorithm.
function calculateSunTimes(date, lat, lng) {
  const base = new Date(date);
  if (Number.isNaN(base.getTime()) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { sunrise: null, sunset: null };
  }

  const dayOfYear = Math.floor((Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()) - Date.UTC(base.getUTCFullYear(), 0, 0)) / 86400000);
  const lngHour = lng / 15;
  const zenith = 90.833;

  function compute(isSunrise) {
    const t = dayOfYear + ((isSunrise ? 6 : 18) - lngHour) / 24;
    const M = (0.9856 * t) - 3.289;
    let L = M + (1.916 * Math.sin((Math.PI / 180) * M)) + (0.02 * Math.sin(2 * (Math.PI / 180) * M)) + 282.634;
    L = ((L % 360) + 360) % 360;

    let RA = (180 / Math.PI) * Math.atan(0.91764 * Math.tan((Math.PI / 180) * L));
    RA = ((RA % 360) + 360) % 360;

    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = (RA + (Lquadrant - RAquadrant)) / 15;

    const sinDec = 0.39782 * Math.sin((Math.PI / 180) * L);
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (Math.cos((Math.PI / 180) * zenith) - (sinDec * Math.sin((Math.PI / 180) * lat))) /
      (cosDec * Math.cos((Math.PI / 180) * lat));

    if (cosH > 1 || cosH < -1) return null;

    let H = isSunrise
      ? 360 - (180 / Math.PI) * Math.acos(cosH)
      : (180 / Math.PI) * Math.acos(cosH);
    H /= 15;

    const T = H + RA - (0.06571 * t) - 6.622;
    let UT = T - lngHour;
    UT = ((UT % 24) + 24) % 24;

    const hours = Math.floor(UT);
    const minutes = Math.floor((UT - hours) * 60);
    const seconds = Math.round((((UT - hours) * 60) - minutes) * 60);

    return new Date(Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth(),
      base.getUTCDate(),
      hours,
      minutes,
      seconds
    ));
  }

  return {
    sunrise: compute(true),
    sunset: compute(false),
  };
}

function buildSunWindows(observedAt, lat, lng) {
  const { sunrise, sunset } = calculateSunTimes(observedAt, lat, lng);
  const windows = [];

  if (sunrise) {
    windows.push({
      start: new Date(sunrise.getTime() - (60 * 60000)),
      end: new Date(sunrise.getTime() + (60 * 60000)),
      type: 'sunrise transition',
      reason: 'Sunrise commonly activates short feeding windows.',
      scoreBoost: 25,
    });
  }

  if (sunset) {
    windows.push({
      start: new Date(sunset.getTime() - (90 * 60000)),
      end: new Date(sunset.getTime() + (90 * 60000)),
      type: 'sunset transition',
      reason: 'Sunset often concentrates visible feeding activity.',
      scoreBoost: 30,
    });
  }

  return windows;
}

function buildTideWindows(observedAt, tide, waterType) {
  const wt = String(waterType || '').toLowerCase();
  if (wt !== 'saltwater' && wt !== 'brackish') return [];

  const windows = [];
  const nextHighAt = toDate(tide?.nextHighAt);
  const nextLowAt = toDate(tide?.nextLowAt);

  if (nextHighAt) {
    windows.push({
      start: new Date(nextHighAt.getTime() - (120 * 60000)),
      end: new Date(nextHighAt.getTime() + (60 * 60000)),
      type: 'high-tide transition',
      reason: 'Approaching high tide can improve bait movement and positioning windows.',
      scoreBoost: 20,
    });
  }

  if (nextLowAt) {
    windows.push({
      start: new Date(nextLowAt.getTime() - (120 * 60000)),
      end: new Date(nextLowAt.getTime() + (60 * 60000)),
      type: 'low-tide transition',
      reason: 'Approaching low tide can concentrate bait along draining current lanes.',
      scoreBoost: 20,
    });
  }

  return windows.filter((window) => window.end >= observedAt);
}

function mergeActiveWindows(activeWindows) {
  if (!activeWindows.length) return null;

  const start = new Date(Math.min(...activeWindows.map((item) => item.start.getTime())));
  const end = new Date(Math.max(...activeWindows.map((item) => item.end.getTime())));
  const type = activeWindows.map((item) => item.type).join(' + ');
  const reason = activeWindows.map((item) => item.reason).join(' ');
  const scoreBoost = activeWindows.reduce((sum, item) => sum + item.scoreBoost, 0);

  return formatWindow(start, end, type, reason, scoreBoost);
}

function pickNextWindow(observedAt, windows) {
  const upcoming = windows
    .filter((item) => item.start > observedAt)
    .sort((a, b) => a.start - b.start);

  if (!upcoming.length) return null;

  const first = upcoming[0];
  const overlap = upcoming.filter((item) =>
    item.start.getTime() <= first.end.getTime() &&
    item.end.getTime() >= first.start.getTime()
  );

  const start = new Date(Math.min(...overlap.map((item) => item.start.getTime())));
  const end = new Date(Math.max(...overlap.map((item) => item.end.getTime())));
  const type = overlap.map((item) => item.type).join(' + ');
  const reason = overlap.map((item) => item.reason).join(' ');
  const scoreBoost = overlap.reduce((sum, item) => sum + item.scoreBoost, 0);

  return formatWindow(start, end, type, reason, scoreBoost);
}

function calculateBiteWindow(conditions) {
  const observedAt = toDate(conditions?.observedAt) || new Date();
  const lat = Number(conditions?.spot?.lat);
  const lng = Number(conditions?.spot?.lng);
  const waterType = conditions?.spot?.waterType;
  const tidalWater = waterType === 'saltwater' || waterType === 'brackish';
  const pressureTrend = normalizePressureTrend(conditions?.weather?.pressureTrend);
  const warnings = [];
  const reasons = [];
  const nextHighAt = toDate(conditions?.tide?.nextHighAt);
  const nextLowAt = toDate(conditions?.tide?.nextLowAt);
  const hasTideTiming = Boolean(nextHighAt || nextLowAt);

  const windows = [
    ...buildSunWindows(observedAt, lat, lng),
    ...buildTideWindows(observedAt, conditions?.tide, waterType),
  ];

  const activeWindows = windows.filter((window) => window.start <= observedAt && window.end >= observedAt);
  const currentWindow = mergeActiveWindows(activeWindows);
  const nextWindow = pickNextWindow(observedAt, windows);

  let activityScore = activeWindows.reduce((sum, item) => sum + item.scoreBoost, 0);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    warnings.push('spot latitude/longitude missing; sunrise and sunset windows unavailable');
  }

  if (tidalWater && !hasTideTiming) {
    warnings.push('tide transition timing unavailable; tide-window signal not applied');
  }

  if (pressureTrend === 'dropping') {
    activityScore += 10;
    reasons.push('Dropping pressure can improve short-term feeding urgency.');
  } else if (pressureTrend === 'rising') {
    activityScore += 4;
    reasons.push('Rising pressure can stabilize movement after unsettled weather.');
  } else if (!pressureTrend) {
    warnings.push('pressure trend unavailable; pressure signal not applied');
  }

  if (currentWindow) {
    reasons.unshift(`Current activity is boosted by ${currentWindow.type}.`);
  } else if (nextWindow) {
    reasons.push(`The next window is driven by ${nextWindow.type}.`);
  } else {
    warnings.push('no major bite window detected from currently available signals');
  }

  const clampedScore = clamp(activityScore, 0, 100);
  let activityLevel = 'low';
  if (clampedScore >= 55) activityLevel = 'high';
  else if (clampedScore >= 30) activityLevel = 'moderate';

  return {
    activityScore: clampedScore,
    activityLevel,
    currentWindow,
    nextWindow,
    explanation: {
      baseReasons: reasons,
      warnings,
      modifiers: [],
      metadata: {
        pressureTrend,
        signalsEvaluated: {
          sunriseSunset: Number.isFinite(lat) && Number.isFinite(lng),
          tideTransitions: tidalWater && hasTideTiming,
          pressureTrend: Boolean(pressureTrend),
        },
      },
    },
  };
}

module.exports = {
  calculateBiteWindow,
};
