const { getUnifiedIntelligence } = require('./intelligenceOrchestrator.service');
const { synthesizeDecision } = require('./decision.service');
const { synthesizeTripPrep } = require('./tripPrep.service');
const { getSavedSpotSummary } = require('./spotSummary.service');
const { getSpotInsights } = require('./spotInsight.service');
const { getSpotPlan } = require('./spotPlan.service');
const { getSavedSpotById } = require('./savedSpots.service');

function asLower(value) {
  return String(value || '').trim().toLowerCase();
}

function isMeaningful(value) {
  const text = String(value || '').trim();
  return Boolean(text) && text.toLowerCase() !== 'n/a';
}

function buildSuggestedSessionName({ savedSpot, tripPrepPayload, intelligence, input }) {
  const species = intelligence?.targetSpecies || tripPrepPayload?.tripPrep?.suggestedTargetSpecies || '';
  const savedSpotLabel = savedSpot?.name || savedSpot?.locationLabel || '';
  const focusSpot = tripPrepPayload?.tripPrep?.suggestedFocusSpot || intelligence?.recommendedSpot || '';
  const spotName = input?.spotName || '';

  if (isMeaningful(savedSpotLabel) && isMeaningful(species)) {
    return `${savedSpotLabel} ${species} Session`;
  }

  if (isMeaningful(savedSpotLabel)) {
    return `${savedSpotLabel} Session`;
  }

  if (isMeaningful(focusSpot) && isMeaningful(species)) {
    return `${focusSpot} ${species} Session`;
  }

  if (isMeaningful(spotName) && isMeaningful(species)) {
    return `${spotName} ${species} Session`;
  }

  return 'Fishing Session';
}

function buildSuggestedLocationLabel({ savedSpot, tripPrepPayload, input }) {
  const savedSpotLabel = savedSpot?.name || savedSpot?.locationLabel || '';
  if (isMeaningful(savedSpotLabel)) return savedSpotLabel;

  const focusSpot = tripPrepPayload?.tripPrep?.suggestedFocusSpot || '';
  if (isMeaningful(focusSpot)) return focusSpot;

  return isMeaningful(input?.spotName) ? input.spotName : 'General fishing location';
}

function buildReadiness({ decisionPayload, tripPrepPayload }) {
  const prepConfidence = asLower(tripPrepPayload?.tripPrep?.confidence);
  const decisionConfidence = asLower(decisionPayload?.decision?.confidence);
  const decisionValue = asLower(decisionPayload?.decision?.goFishing);
  const warnings = [
    ...(Array.isArray(decisionPayload?.summary?.warnings) ? decisionPayload.summary.warnings : []),
    ...(Array.isArray(tripPrepPayload?.warnings) ? tripPrepPayload.warnings : []),
  ];

  if (
    prepConfidence === 'high' &&
    (decisionValue === 'yes' || (decisionValue === 'conditional' && decisionConfidence === 'high')) &&
    warnings.length <= 1
  ) {
    return 'high';
  }

  if (
    prepConfidence === 'low' ||
    decisionConfidence === 'low' ||
    decisionValue === 'no' ||
    warnings.some((warning) => String(warning).toLowerCase().includes('low'))
  ) {
    return 'low';
  }

  return 'moderate';
}

function synthesizeSessionStart({ intelligence, decisionPayload, tripPrepPayload, savedSpot = null, input = {} }) {
  const readiness = buildReadiness({ decisionPayload, tripPrepPayload });
  const warnings = [
    ...(Array.isArray(tripPrepPayload?.warnings) ? tripPrepPayload.warnings : []),
  ];

  if (asLower(decisionPayload?.decision?.goFishing) === 'conditional') {
    warnings.push('Trip decision is conditional, so start expectations should stay flexible.');
  }

  if (asLower(decisionPayload?.decision?.goFishing) === 'no') {
    warnings.push('Trip decision is currently negative, so session-start confidence is limited.');
  }

  if (!isMeaningful(intelligence?.targetSpecies)) {
    warnings.push('No strong species focus is available for session start.');
  }

  if (!isMeaningful(tripPrepPayload?.tripPrep?.suggestedStartingRig) && !isMeaningful(intelligence?.recommendedRig)) {
    warnings.push('No strong starting rig pattern is available for session start.');
  }

  const sessionStart = {
    suggestedSessionName: buildSuggestedSessionName({
      savedSpot,
      tripPrepPayload,
      intelligence,
      input,
    }),
    suggestedSpeciesFocus: intelligence?.targetSpecies || tripPrepPayload?.tripPrep?.suggestedTargetSpecies || 'n/a',
    suggestedStartingRig: tripPrepPayload?.tripPrep?.suggestedStartingRig || intelligence?.recommendedRig || 'n/a',
    suggestedFocusSpot: tripPrepPayload?.tripPrep?.suggestedFocusSpot || intelligence?.recommendedSpot || 'n/a',
    suggestedLocationLabel: buildSuggestedLocationLabel({
      savedSpot,
      tripPrepPayload,
      input,
    }),
    readiness,
  };

  return {
    sessionStart,
    startingContext: {
      tripDecision: decisionPayload?.summary?.primaryReason || 'Trip decision unavailable.',
      departureWindow: tripPrepPayload?.tripPrep?.recommendedDepartureWindow || 'No strong departure window identified.',
      conditionsSummary: tripPrepPayload?.tripPrep?.conditionsSummary || 'Conditions summary unavailable.',
      expectation: tripPrepPayload?.tripPrep?.expectation || 'No expectation guidance returned.',
    },
    warnings: Array.from(new Set(warnings)),
    explanation: {
      baseReasons: [
        sessionStart.suggestedSessionName,
        sessionStart.suggestedStartingRig,
        sessionStart.suggestedFocusSpot,
      ],
      signalsUsed: Array.from(
        new Set([
          ...(Array.isArray(decisionPayload?.explanation?.signalsUsed) ? decisionPayload.explanation.signalsUsed : []),
          ...(Array.isArray(tripPrepPayload?.explanation?.signalsUsed) ? tripPrepPayload.explanation.signalsUsed : []),
        ])
      ),
      signalsMissing: Array.from(
        new Set([
          ...(Array.isArray(decisionPayload?.explanation?.signalsMissing) ? decisionPayload.explanation.signalsMissing : []),
          ...(Array.isArray(tripPrepPayload?.explanation?.signalsMissing) ? tripPrepPayload.explanation.signalsMissing : []),
        ])
      ),
      notes: [
        'Session Start Intelligence is user-facing only and does not create sessions automatically.',
        ...(savedSpot ? ['Saved-spot context improved naming and location suggestions.'] : []),
      ],
    },
  };
}

async function getSessionStart(input, options = {}) {
  const intelligence = await getUnifiedIntelligence(input, {
    userId: options.userId || null,
  });
  const decisionPayload = synthesizeDecision(intelligence);

  let savedSpot = null;
  let planPayload = null;
  let insightPayload = null;
  const hasSavedSpotContext = Number.isInteger(input.savedSpotId);

  if (hasSavedSpotContext && options.userId) {
    savedSpot = await getSavedSpotById(options.userId, input.savedSpotId);
    const summaryPayload = await getSavedSpotSummary(options.userId, input.savedSpotId);
    insightPayload = await getSpotInsights({
      userId: options.userId,
      savedSpotId: input.savedSpotId,
      summaryPayload,
    });
    planPayload = getSpotPlan({
      summaryPayload,
      insightPayload,
    });
  }

  const tripPrepPayload = synthesizeTripPrep({
    intelligence,
    decisionPayload,
    planPayload,
    insightPayload,
  });

  const payload = synthesizeSessionStart({
    intelligence,
    decisionPayload,
    tripPrepPayload,
    savedSpot,
    input,
  });

  if (hasSavedSpotContext && !options.userId) {
    payload.warnings.push('Saved-spot session-start context requires login; using general session-start guidance only.');
    payload.explanation.notes.push('Saved-spot-specific session-start guidance was skipped because no authenticated user was available.');
  }

  payload.warnings = Array.from(new Set(payload.warnings));
  payload.explanation.notes = Array.from(new Set(payload.explanation.notes));
  return payload;
}

module.exports = {
  synthesizeSessionStart,
  getSessionStart,
};
