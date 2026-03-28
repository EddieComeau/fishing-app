const { getConditions } = require('./conditions.service');
const { scoreConditions } = require('./score.service');
const { recommendSpots } = require('./spot.service');
const { searchSpecies } = require('./species.service');
const { recommendRig } = require('./rig.service');
const { fightStrategy } = require('./fight.service');

function normalizeAccessMode(value) {
  return String(value || 'bank').trim().toLowerCase();
}

function primarySpot(spots) {
  const list = Array.isArray(spots) ? spots : [];
  return list.find((spot) => spot.type !== 'structure_intersection') || list[0] || null;
}

function inferSpeciesQuery(conditions, spotPayload) {
  const waterType = String(conditions?.spot?.waterType || '').toLowerCase();
  const topSpotType = String(primarySpot(spotPayload?.spots)?.type || '');
  const activityLevel = String(conditions?.biteWindow?.activityLevel || '').toLowerCase();

  if (waterType === 'freshwater') return 'bass';
  if (waterType === 'brackish') return topSpotType === 'shallow_flats_low_light' ? 'trout' : 'redfish';

  if (topSpotType === 'current_seam_structure') return 'snapper';
  if (activityLevel === 'high') return 'trout';
  return 'snapper';
}

function chooseTargetSpecies(speciesResults, speciesQuery) {
  const list = Array.isArray(speciesResults) ? speciesResults : [];
  const normalizedQuery = String(speciesQuery || '').toLowerCase();
  const aliasTokens = normalizedQuery === 'redfish'
    ? ['redfish', 'red drum', 'drum']
    : [normalizedQuery];

  return list.find((item) => {
    const haystack = `${item?.commonName || ''} ${item?.scientificName || ''}`.toLowerCase();
    return aliasTokens.some((token) => haystack.includes(token));
  }) || list[0] || null;
}

function buildSignalsAligned(conditions, scorePayload, spotPayload) {
  const signals = [];
  const tideStage = String(conditions?.tide?.stage || 'n/a').toLowerCase();
  const windMph = Number(conditions?.weather?.windMph);
  const pressureTrend = String(conditions?.weather?.pressureTrend || '').toLowerCase();
  const activityLevel = String(conditions?.biteWindow?.activityLevel || '').toLowerCase();
  const topSpotType = String(primarySpot(spotPayload?.spots)?.type || '');

  if ((tideStage === 'incoming' || tideStage === 'outgoing') && topSpotType === 'current_seam_structure') {
    signals.push('tide');
  }

  if (Number.isFinite(windMph) && windMph >= 8 && topSpotType === 'wind_blown_shoreline') {
    signals.push('wind');
  }

  if (activityLevel === 'high' || activityLevel === 'moderate') {
    signals.push('bite_window');
  }

  if (pressureTrend === 'rising' && topSpotType === 'deeper_structure') {
    signals.push('pressure');
  }

  if (String(scorePayload?.confidence || '').toLowerCase() === 'high') {
    signals.push('environment');
  }

  return signals;
}

function deriveConfidence(signalsAligned) {
  const count = Array.isArray(signalsAligned) ? signalsAligned.length : 0;
  if (count >= 4) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
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

function deriveApproach(topSpot, fightPayload) {
  const spotType = String(topSpot?.type || '');
  const pressurePlan = String(fightPayload?.pressurePlan || 'moderate').toLowerCase();
  const pressureSuffix = pressurePlan === 'heavy'
    ? ' with strong post-hook steering'
    : pressurePlan === 'moderate'
      ? ' with steady pressure'
      : ' with smooth pressure';

  if (spotType === 'current_seam_structure') {
    return `moderate retrieve along the current edge${pressureSuffix}`;
  }

  if (spotType === 'wind_blown_shoreline') {
    return `steady retrieve parallel to the wind-facing shoreline${pressureSuffix}`;
  }

  if (spotType === 'shallow_flats_low_light') {
    return `moderate retrieve across the shallow flat edge${pressureSuffix}`;
  }

  if (spotType === 'deeper_structure') {
    return `slower presentation around deeper structure${pressureSuffix}`;
  }

  return `controlled presentation along structure intersections${pressureSuffix}`;
}

function dedupe(items) {
  return Array.from(new Set((Array.isArray(items) ? items : []).filter(Boolean)));
}

async function getUnifiedIntelligence(input, options = {}) {
  const conditionsResult = await getConditions({
    lat: input.lat,
    lng: input.lng,
    waterType: input.waterType,
    tideStationId: input.tideStationId || null,
    spotName: input.spotName || null,
    pressureTrend: input.pressureTrend || null,
  });
  const conditions = conditionsResult.data;
  const scorePayload = scoreConditions({
    weather: {
      tempF: conditions.weather?.tempF ?? null,
      windMph: conditions.weather?.windMph ?? null,
      precipitation: conditions.weather?.precipitation ?? null,
      observedAt: conditions.weather?.observedAt || conditions.observedAt || null,
    },
    tide: {
      stage: conditions.tide?.stage || 'n/a',
      fetchedAt: conditions.sources?.tides?.fetchedAt || null,
    },
    alerts: conditions.alerts || [],
    sources: conditions.sources || {},
    accessMode: normalizeAccessMode(input.accessMode),
    waterType: input.waterType,
    observedAt: conditions.observedAt || null,
  });
  const spotPayload = await recommendSpots(conditions, {
    userId: options.userId || null,
    savedSpotId: Number.isInteger(input.savedSpotId) ? input.savedSpotId : null,
    filterMode: input.filterMode || 'default',
    rankMode: input.rankMode || 'default',
  });
  const speciesQuery = inferSpeciesQuery(conditions, spotPayload);
  const speciesResults = await searchSpecies(speciesQuery);
  const targetSpecies = chooseTargetSpecies(speciesResults, speciesQuery);
  const rigPayload = await recommendRig({
    waterType: input.waterType,
    accessMode: normalizeAccessMode(input.accessMode),
    targetSpecies: targetSpecies?.commonName || targetSpecies?.scientificName || null,
    conditions: {
      weather: {
        tempF: conditions.weather?.tempF ?? null,
        windMph: conditions.weather?.windMph ?? null,
      },
      tide: {
        stage: conditions.tide?.stage || 'n/a',
      },
    },
  }, {
    userId: options.userId || null,
  });
  const fightPayload = fightStrategy({
    waterType: input.waterType,
    accessMode: normalizeAccessMode(input.accessMode),
    targetSpecies: targetSpecies?.commonName || targetSpecies?.scientificName || null,
    rig: {
      lineStrengthLb: rigPayload?.line?.strengthLb ?? null,
      leaderStrengthLb: rigPayload?.leader?.strengthLb ?? null,
    },
    conditions: {
      weather: {
        windMph: conditions.weather?.windMph ?? null,
      },
      tide: {
        stage: conditions.tide?.stage || 'n/a',
      },
    },
  });

  const topSpot = primarySpot(spotPayload.spots);
  const alignedSignals = buildSignalsAligned(conditions, scorePayload, spotPayload);
  const warnings = dedupe([
    ...(scorePayload.warnings || []),
    ...(conditions.biteWindow?.explanation?.warnings || []),
    ...(spotPayload.explanation?.warnings || []),
  ]).slice(0, 5);
  const baseReasons = dedupe([
    ...(topSpot?.reason ? [topSpot.reason] : []),
    ...((conditions.biteWindow?.explanation?.baseReasons || []).slice(0, 2)),
    ...((scorePayload.reasons || []).slice(0, 2)),
    ...(rigPayload?.reasons || []).slice(0, 1),
  ]).slice(0, 5);

  const spotFeedbackModifier = (spotPayload.explanation?.modifiers || []).find(
    (modifier) => modifier?.type === 'historical_feedback'
  ) || null;
  const spotFilteringModifier = (spotPayload.explanation?.modifiers || []).find(
    (modifier) => modifier?.type === 'spot_filtering'
  ) || null;
  const baseConfidence = deriveConfidence(alignedSignals);

  return {
    targetSpecies: targetSpecies?.commonName || targetSpecies?.scientificName || 'No target selected',
    recommendedSpot: topSpot?.label || 'Structure intersections and transition edges',
    recommendedRig: rigPayload?.rigName || 'No rig selected',
    recommendedApproach: deriveApproach(topSpot, fightPayload),
    confidence: applyConfidenceAdjustment(baseConfidence, spotFeedbackModifier?.adjustment || 'none'),
    explanation: {
      baseReasons,
      warnings,
      modifiers: [spotFeedbackModifier, spotFilteringModifier].filter(Boolean),
      metadata: {
        spotFeedbackAdjustment: spotFeedbackModifier?.adjustment || 'none',
        spotFiltering: spotPayload.filtering || {
          filterMode: input.filterMode || 'default',
          rankMode: input.rankMode || 'default',
          applied: false,
          warnings: [],
        },
        signalsAligned: alignedSignals,
        speciesQueryUsed: speciesQuery,
        selectedSpotType: topSpot?.type || 'structure_intersection',
        scoreConfidence: scorePayload.confidence,
        biteWindowActivity: conditions.biteWindow?.activityLevel || 'low',
      },
    },
    components: {
      score: {
        score: scorePayload.score,
        confidence: scorePayload.confidence,
        regimeLabel: scorePayload.regimeLabel,
      },
      biteWindow: conditions.biteWindow,
      topSpot,
      targetSpecies: targetSpecies || null,
      rig: {
        rigName: rigPayload?.rigName || null,
        snagRisk: rigPayload?.snagRisk || null,
      },
      fight: {
        pressurePlan: fightPayload?.pressurePlan || null,
        dragGuidance: fightPayload?.dragGuidance || null,
      },
    },
  };
}

module.exports = {
  getUnifiedIntelligence,
};
