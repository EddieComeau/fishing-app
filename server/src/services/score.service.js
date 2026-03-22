function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getTimeOfDayLabel(input) {
  const explicit = input?.timeOfDay ? String(input.timeOfDay).toLowerCase() : null;
  if (explicit) return explicit;

  const ts = input?.weather?.observedAt || input?.observedAt || null;
  if (!ts) return 'period';

  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 'period';

  const h = date.getHours();
  if (h < 6) return 'night';
  if (h < 11) return 'morning';
  if (h < 16) return 'midday';
  if (h < 20) return 'evening';
  return 'night';
}

function tempBand(tempF) {
  if (tempF === null) return 'unknown';
  if (tempF < 50) return 'cold';
  if (tempF <= 65) return 'cool';
  if (tempF <= 82) return 'warm';
  return 'hot';
}

function windBand(windMph) {
  if (windMph === null) return 'unknown';
  if (windMph <= 5) return 'calm';
  if (windMph <= 15) return 'moderate';
  if (windMph <= 25) return 'windy';
  return 'high-wind';
}

function scoreTemperature(tempF, waterType, reasons) {
  if (tempF === null) return 0;

  const wt = String(waterType || 'freshwater').toLowerCase();
  const band = tempBand(tempF);

  if (wt === 'freshwater') {
    if (band === 'cold') {
      reasons.push('Cold freshwater can slow fish metabolism and activity');
      return -18;
    }
    if (band === 'cool') {
      reasons.push('Cool freshwater is a neutral transition band');
      return 0;
    }
    if (band === 'warm') {
      reasons.push('Warm freshwater often supports active feeding windows');
      return 16;
    }
    reasons.push('Hot freshwater can reduce daytime bite consistency');
    return -10;
  }

  if (wt === 'saltwater') {
    if (band === 'cold') {
      reasons.push('Cold saltwater can suppress feeding intensity');
      return -10;
    }
    if (band === 'cool') {
      reasons.push('Cool saltwater can still support moderate activity');
      return 4;
    }
    if (band === 'warm') {
      reasons.push('Warm saltwater is favorable for many inshore feeding patterns');
      return 12;
    }
    reasons.push('Hot saltwater may push feeding toward narrower windows');
    return -6;
  }

  // brackish blend
  if (band === 'cold') {
    reasons.push('Cold brackish conditions can limit movement and feeding');
    return -12;
  }
  if (band === 'cool') {
    reasons.push('Cool brackish band is generally neutral');
    return 2;
  }
  if (band === 'warm') {
    reasons.push('Warm brackish conditions often improve activity near moving water');
    return 14;
  }
  reasons.push('Hot brackish conditions may reduce midday activity');
  return -8;
}

function scoreWind(windMph, accessMode, reasons) {
  if (windMph === null) return 0;

  const access = String(accessMode || '').toLowerCase();
  const band = windBand(windMph);
  const boatLike = access === 'boat' || access === 'kayak';
  const shoreLike = ['bank', 'dock', 'pier', 'bridge'].includes(access);
  const surf = access === 'surf';

  if (boatLike) {
    if (band === 'calm') return 2;
    if (band === 'moderate') {
      reasons.push('Moderate wind still allows manageable boat/kayak positioning');
      return 8;
    }
    if (band === 'windy') {
      reasons.push('Windy conditions reduce boat/kayak control efficiency');
      return -12;
    }
    reasons.push('High wind creates major boat/kayak positioning risk');
    return -22;
  }

  if (surf) {
    if (band === 'calm') return 0;
    if (band === 'moderate') {
      reasons.push('Moderate surf wind can still produce fishable lanes');
      return 4;
    }
    if (band === 'windy') {
      reasons.push('Windy surf can degrade presentation and consistency');
      return -8;
    }
    reasons.push('High wind in surf strongly reduces fishable control windows');
    return -16;
  }

  if (shoreLike) {
    if (band === 'calm') return 0;
    if (band === 'moderate') {
      reasons.push('Moderate wind remains workable from shore structures');
      return 6;
    }
    if (band === 'windy') {
      reasons.push('Windy shore conditions reduce casting precision');
      return -6;
    }
    reasons.push('High wind heavily impacts shoreline casting and control');
    return -14;
  }

  if (band === 'moderate') return 5;
  if (band === 'windy') return -7;
  if (band === 'high-wind') return -14;
  return 0;
}

function scorePrecipitation(precip, accessMode, reasons) {
  if (precip === null) return 0;

  const access = String(accessMode || '').toLowerCase();
  const shoreLike = ['bank', 'dock', 'pier', 'bridge', 'surf'].includes(access);

  if (precip <= 2) {
    reasons.push('Low precipitation supports more stable short-term conditions');
    return 6;
  }
  if (precip <= 6) {
    reasons.push('Moderate precipitation keeps conditions mixed but fishable');
    return shoreLike ? -1 : 0;
  }

  reasons.push('Heavy precipitation can reduce clarity and consistency');
  return shoreLike ? -14 : -10;
}

function scoreTide(stage, waterType, accessMode, reasons) {
  const wt = String(waterType || '').toLowerCase();
  const value = String(stage || 'n/a').toLowerCase();
  const access = String(accessMode || '').toLowerCase();

  if (wt === 'freshwater') {
    return 0;
  }

  if (value === 'incoming') {
    reasons.push('Incoming tide can improve bait movement and feeding windows');
    return 8;
  }

  if (value === 'outgoing') {
    const bonus = access === 'surf' ? 10 : 8;
    reasons.push('Outgoing tide can concentrate bait along moving current lanes');
    return bonus;
  }

  if (value === 'slack') {
    reasons.push('Slack tide is usually neutral for movement-driven feeding');
    return 0;
  }

  return 0;
}

function scoreWaterTypeAccess(waterType, accessMode, reasons) {
  const wt = String(waterType || '').toLowerCase();
  const access = String(accessMode || '').toLowerCase();

  if (wt === 'saltwater' && access === 'surf') {
    reasons.push('Surf access in saltwater can align with active moving-water lanes');
    return 3;
  }

  if (wt === 'brackish' && (access === 'dock' || access === 'pier')) {
    reasons.push('Dock/pier access in brackish zones can improve structure targeting');
    return 2;
  }

  return 0;
}

function minutesOld(isoTime) {
  if (!isoTime) return null;
  const parsed = new Date(isoTime);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.round((Date.now() - parsed.getTime()) / 60000);
}

function calculateConfidence({ hasWeather, hasTide, waterType, accessMode, weatherFetchedAt, tideFetchedAt }) {
  const wt = String(waterType || '').toLowerCase();
  const needsTide = wt === 'saltwater' || wt === 'brackish';
  const accessPresent = Boolean(accessMode);
  const weatherAge = minutesOld(weatherFetchedAt);
  const tideAge = minutesOld(tideFetchedAt);

  const weatherFresh = weatherAge !== null && weatherAge <= 120;
  const tideFresh = tideAge !== null && tideAge <= 180;

  if (hasWeather && accessPresent && wt && (!needsTide || (hasTide && tideFresh)) && weatherFresh) {
    return 'high';
  }

  if (hasWeather && (!needsTide || hasTide)) {
    return 'medium';
  }

  return 'low';
}

function collectWarnings(input, tempF, windMph, precipitation, tideStage) {
  const warnings = [];
  const hasWeatherObject = input && typeof input.weather === 'object' && input.weather !== null;

  if (!hasWeatherObject) {
    warnings.push('weather object is missing; score uses fallback defaults');
  }

  if (tempF === null) warnings.push('weather.tempF missing or invalid; temperature impact not applied');
  if (windMph === null) warnings.push('weather.windMph missing or invalid; wind impact not applied');
  if (precipitation === null) warnings.push('weather.precipitation missing or invalid; precipitation impact not applied');

  const wt = String(input?.waterType || '').toLowerCase();
  const needsTide = wt === 'saltwater' || wt === 'brackish';
  if (needsTide && tideStage === 'n/a') warnings.push('tide.stage missing for tidal water type; tide impact reduced');

  const access = String(input?.accessMode || '').toLowerCase();
  if ((access === 'boat' || access === 'kayak') && windMph !== null && windMph > 20) {
    warnings.push('High wind boating hazard');
  }

  if (precipitation !== null && precipitation > 8) {
    warnings.push('Storm risk detected from heavy precipitation');
  }

  if (tempF !== null && tempF > 92) {
    warnings.push('Extreme heat conditions');
  }

  const alerts = Array.isArray(input?.alerts) ? input.alerts : [];
  if (alerts.some((a) => /lightning/i.test(String(a.headline || '')))) {
    warnings.push('Lightning alert in active conditions');
  }
  if (alerts.some((a) => /severe|extreme/i.test(String(a.severity || '')))) {
    warnings.push('Severe weather alert present');
  }

  if (!input?.accessMode) warnings.push('accessMode missing; confidence may be reduced');
  if (!input?.waterType) warnings.push('waterType missing; confidence may be reduced');

  return warnings;
}

function clampScore(value) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function buildRegimeLabel({ tempF, windMph, waterType, tideStage, timeOfDay }) {
  const temp = tempBand(tempF);
  const wind = windBand(windMph);
  const wt = waterType ? String(waterType).toLowerCase() : 'mixed-water';

  const tempLabel = temp === 'unknown' ? 'Mixed' : temp.charAt(0).toUpperCase() + temp.slice(1);
  const windLabel = wind === 'unknown' ? 'mixed-wind' : wind;

  const tidePart = tideStage && tideStage !== 'n/a' ? `${tideStage} tide` : 'stable tide';
  const tod = timeOfDay || 'period';

  return `${tempLabel} ${windLabel} ${wt} ${tidePart} ${tod}`;
}

function scoreConditions(input) {
  const weather = input.weather || {};
  const tide = input.tide || {};

  const tempF = toNumber(weather.tempF);
  const windMph = toNumber(weather.windMph);
  const precipitation = toNumber(weather.precipitation);
  const tideStage = String(tide.stage || 'n/a').toLowerCase();
  const accessMode = input.accessMode ? String(input.accessMode).toLowerCase() : '';
  const waterType = input.waterType ? String(input.waterType).toLowerCase() : '';

  const reasons = [];
  const baseScore = 50;
  let score = baseScore;

  const tempPoints = scoreTemperature(tempF, waterType, reasons);
  const windPoints = scoreWind(windMph, accessMode, reasons);
  const precipPoints = scorePrecipitation(precipitation, accessMode, reasons);
  const tidePoints = scoreTide(tideStage, waterType, accessMode, reasons);
  const accessWaterPoints = scoreWaterTypeAccess(waterType, accessMode, reasons);

  score += tempPoints;
  score += windPoints;
  score += precipPoints;
  score += tidePoints;
  score += accessWaterPoints;

  const hasWeather = tempF !== null || windMph !== null || precipitation !== null;
  const hasTide = tideStage !== 'n/a';

  const weatherFetchedAt = input?.sources?.weather?.fetchedAt || input?.weather?.fetchedAt || null;
  const tideFetchedAt = input?.sources?.tides?.fetchedAt || input?.tide?.fetchedAt || null;

  const confidence = calculateConfidence({
    hasWeather,
    hasTide,
    waterType,
    accessMode,
    weatherFetchedAt,
    tideFetchedAt,
  });

  const timeOfDay = getTimeOfDayLabel(input);
  const regimeLabel = buildRegimeLabel({ tempF, windMph, waterType, tideStage, timeOfDay });
  const warnings = collectWarnings(input, tempF, windMph, precipitation, tideStage);

  const uniqueReasons = Array.from(new Set(reasons)).slice(0, 4);

  return {
    score: clampScore(score),
    confidence,
    regimeLabel,
    scoreVersion: 'v2',
    ruleSet: 'heuristic-environmental-phase6',
    generatedAt: new Date().toISOString(),
    reasons: uniqueReasons.length ? uniqueReasons : ['Limited data; score uses minimal fallback assumptions'],
    breakdown: {
      base: baseScore,
      temperature: tempPoints,
      wind: windPoints,
      precipitation: precipPoints,
      tide: tidePoints,
      accessWater: accessWaterPoints,
      totalRaw: Math.round(score),
      totalClamped: clampScore(score),
    },
    warnings,
  };
}

module.exports = {
  scoreConditions,
};
