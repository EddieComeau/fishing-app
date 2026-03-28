const { getSpotFeedback } = require('./spotFeedback.service');

function normalizePressureTrend(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'dropping' || normalized === 'rising' || normalized === 'steady') {
    return normalized;
  }
  return null;
}

function isTidalWater(waterType) {
  const wt = String(waterType || '').toLowerCase();
  return wt === 'saltwater' || wt === 'brackish';
}

function hasLightWindow(biteWindow) {
  const type = String(biteWindow?.currentWindow?.type || '').toLowerCase();
  return type.includes('sunrise') || type.includes('sunset');
}

function buildSpot(type, label, confidence, reason) {
  return {
    type,
    label,
    confidence,
    reason,
  };
}

function primarySpot(spots) {
  const list = Array.isArray(spots) ? spots : [];
  return list.find((spot) => spot.type !== 'structure_intersection') || list[0] || null;
}

function confidenceToRank(confidence) {
  const normalized = String(confidence || '').toLowerCase();
  if (normalized === 'high') return 3;
  if (normalized === 'medium') return 2;
  return 1;
}

function rankToConfidence(rank) {
  if (rank >= 3) return 'high';
  if (rank >= 2) return 'medium';
  return 'low';
}

function applyConfidenceAdjustment(baseConfidence, adjustment) {
  const baseRank = confidenceToRank(baseConfidence);
  let delta = 0;

  if (adjustment === 'slight_up') delta = 1;
  if (adjustment === 'moderate_up') delta = 2;
  if (adjustment === 'slight_down') delta = -1;

  return rankToConfidence(Math.max(1, Math.min(3, baseRank + delta)));
}

async function recommendSpots(conditions, options = {}) {
  const spots = [];
  const baseReasons = [];
  const warnings = [];
  const modifiers = [];
  const waterType = String(conditions?.spot?.waterType || '').toLowerCase();
  const tideStage = String(conditions?.tide?.stage || 'n/a').toLowerCase();
  const windMph = Number(conditions?.weather?.windMph);
  const pressureTrend = normalizePressureTrend(conditions?.weather?.pressureTrend);
  const biteWindow = conditions?.biteWindow || null;
  const tidalWater = isTidalWater(waterType);
  const tideTimingAvailable = Boolean(conditions?.tide?.nextHighAt || conditions?.tide?.nextLowAt);
  const lightWindowActive = hasLightWindow(biteWindow);
  const windAvailable = Number.isFinite(windMph);

  if (tidalWater && (tideStage === 'incoming' || tideStage === 'outgoing')) {
    const label = tideStage === 'incoming'
      ? 'Up-current structure seam'
      : 'Down-current structure edge';
    const reason = tideStage === 'incoming'
      ? 'Incoming tide is creating moving-water seams along structure edges.'
      : 'Outgoing tide is pulling bait through current seams near structure.';

    spots.push(buildSpot('current_seam_structure', label, 'high', reason));
    baseReasons.push('Tide movement detected around structure.');
  } else if (tidalWater && !tideTimingAvailable) {
    warnings.push('Tide timing unavailable; current-seam recommendation was not applied.');
  }

  if (windAvailable && windMph >= 8) {
    spots.push(buildSpot(
      'wind_blown_shoreline',
      'Wind-blown shoreline',
      windMph >= 15 ? 'high' : 'medium',
      'Wind is strong enough to push bait toward wind-facing shoreline edges.'
    ));
    baseReasons.push('Wind is contributing to likely bait concentration.');
  } else if (!windAvailable) {
    warnings.push('Wind speed unavailable; wind-driven shoreline recommendation not applied.');
  }

  if (lightWindowActive) {
    spots.push(buildSpot(
      'shallow_flats_low_light',
      'Shallow flats in low light',
      'medium',
      'An active sunrise/sunset window can pull predators shallow along flats and adjacent edges.'
    ));
    baseReasons.push('Low-light bite window is active.');
  }

  if (pressureTrend === 'rising') {
    spots.push(buildSpot(
      'deeper_structure',
      'Deeper structure',
      'medium',
      'Rising pressure can stabilize fish on deeper structure and cleaner transition edges.'
    ));
    baseReasons.push('Rising pressure favors a deeper structure bias.');
  } else if (!pressureTrend) {
    warnings.push('Pressure trend unavailable; depth-bias recommendation not applied.');
  }

  spots.push(buildSpot(
    'structure_intersection',
    'Structure intersections and transition edges',
    spots.length ? 'high' : 'medium',
    'Fish commonly hold along edges, transitions, and intersecting structure even when other signals are mixed.'
  ));
  baseReasons.push('Structure remains the baseline fish-positioning factor.');

  const topSpot = primarySpot(spots);
  const savedSpotId = Number.isInteger(options.savedSpotId) ? options.savedSpotId : null;

  if (topSpot && savedSpotId !== null) {
    try {
      const feedback = await getSpotFeedback({
        userId: options.userId || null,
        savedSpotId,
      });

      topSpot.baseConfidence = topSpot.confidence;
      topSpot.historicalFeedback = {
        adjustment: feedback.confidenceAdjustment,
        sampleSize: feedback.metadata.sampleSize,
        confidenceLevel: feedback.metadata.confidenceLevel,
        signals: feedback.signals,
        warnings: feedback.warnings,
      };
      topSpot.confidence = applyConfidenceAdjustment(topSpot.confidence, feedback.confidenceAdjustment);

      modifiers.push({
        type: 'historical_feedback',
        impact: 'confidence_adjustment',
        adjustment: feedback.confidenceAdjustment,
        confidenceLevel: feedback.metadata.confidenceLevel,
        sampleSize: feedback.metadata.sampleSize,
      });

      feedback.signals.forEach((signal) => baseReasons.push(signal));
      feedback.warnings.forEach((warning) => warnings.push(warning));
    } catch (error) {
      warnings.push('Historical spot feedback was unavailable; base spot confidence was kept unchanged.');
    }
  }

  return {
    spots,
    explanation: {
      baseReasons: Array.from(new Set(baseReasons)),
      warnings,
      modifiers,
      metadata: {
        historicalFeedback: topSpot?.historicalFeedback || null,
        signalsEvaluated: {
          tide: tidalWater && tideTimingAvailable,
          wind: windAvailable,
          light: lightWindowActive,
          pressure: Boolean(pressureTrend),
          structure: true,
        },
      },
    },
  };
}

module.exports = {
  recommendSpots,
};
