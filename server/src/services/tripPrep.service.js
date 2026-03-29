const { getUnifiedIntelligence } = require('./intelligenceOrchestrator.service');
const { synthesizeDecision } = require('./decision.service');
const { getSavedSpotSummary } = require('./spotSummary.service');
const { getSpotInsights } = require('./spotInsight.service');
const { getSpotPlan } = require('./spotPlan.service');

function asLower(value) {
  return String(value || '').trim().toLowerCase();
}

function buildDepartureWindow(intelligence, decisionPayload, planPayload) {
  const currentWindow = intelligence?.components?.biteWindow?.currentWindow || null;
  const nextWindow = intelligence?.components?.biteWindow?.nextWindow || null;
  const decisionValue = asLower(decisionPayload?.decision?.goFishing);
  const planTime = planPayload?.plan?.recommendedTime || '';

  if (currentWindow?.type && decisionValue === 'yes') {
    return `Leave now to fish the active ${currentWindow.type}.`;
  }

  if (nextWindow?.type && (decisionValue === 'yes' || decisionValue === 'conditional')) {
    return `Plan to arrive before the next ${nextWindow.type}.`;
  }

  if (planTime && !planTime.startsWith('No strong time pattern')) {
    return planTime;
  }

  return 'No strong departure window identified - fish only if convenient.';
}

function buildStartingRig(intelligence, planPayload) {
  const currentRig = intelligence?.recommendedRig || 'No rig guidance available';
  const planRig = planPayload?.plan?.recommendedRig || '';

  if (planRig.startsWith('Start with ')) {
    const historicalRig = planRig.replace(/^Start with\s+/i, '').replace(/\.$/, '');
    if (currentRig.toLowerCase().includes(historicalRig.toLowerCase())) {
      return `${currentRig} (also reinforced by saved-spot history).`;
    }
  }

  return currentRig;
}

function buildConditionsSummary(intelligence, decisionPayload) {
  const decisionReason = decisionPayload?.summary?.primaryReason || 'Conditions are mixed.';
  const biteActivity = asLower(intelligence?.components?.biteWindow?.activityLevel) || 'unknown';
  const aligned = Array.isArray(intelligence?.explanation?.metadata?.signalsAligned)
    ? intelligence.explanation.metadata.signalsAligned
    : [];

  if (biteActivity === 'high' && aligned.length >= 3) {
    return `High activity with multiple aligned signals. ${decisionReason}`;
  }

  if (biteActivity === 'moderate' || aligned.length >= 2) {
    return `A usable window is developing with mixed support. ${decisionReason}`;
  }

  return `Conditions are weak or degraded. ${decisionReason}`;
}

function buildExpectation(confidence) {
  if (confidence === 'high') {
    return 'Good window - worth planning around.';
  }

  if (confidence === 'moderate') {
    return 'Fishable, but expectations should stay moderate.';
  }

  return 'Conditions are weak - treat this as exploratory rather than high-probability.';
}

function buildChecklist({ tripPrep, intelligence, decisionPayload, planPayload }) {
  const gear = [];
  const notes = [];
  const warnings = Array.isArray(decisionPayload?.summary?.warnings) ? decisionPayload.summary.warnings : [];
  const missing = Array.isArray(decisionPayload?.explanation?.signalsMissing) ? decisionPayload.explanation.signalsMissing : [];

  if (tripPrep.suggestedStartingRig) {
    gear.push(`Start with ${tripPrep.suggestedStartingRig.replace(/\.$/, '')}`);
  }

  if (asLower(tripPrep.suggestedFocusSpot).includes('wind')) {
    gear.push('Prepare for wind-exposed shoreline positioning');
  }

  if (asLower(tripPrep.suggestedFocusSpot).includes('current')) {
    gear.push('Bring terminal tackle suited for moving current');
  }

  if (tripPrep.recommendedDepartureWindow) {
    notes.push(tripPrep.recommendedDepartureWindow);
  }

  if (planPayload?.plan?.strategy) {
    notes.push(planPayload.plan.strategy);
  }

  if (warnings.length) {
    notes.push(warnings[0]);
  }

  if (missing.includes('tide_signal')) {
    notes.push('Expect mixed confidence because tide timing is degraded.');
  }

  return {
    gear: Array.from(new Set(gear)).slice(0, 4),
    notes: Array.from(new Set(notes)).slice(0, 4),
  };
}

function synthesizeTripPrep({ intelligence, decisionPayload, planPayload = null, insightPayload = null }) {
  const confidence = asLower(decisionPayload?.decision?.confidence) || 'low';
  const warnings = [
    ...(Array.isArray(decisionPayload?.summary?.warnings) ? decisionPayload.summary.warnings : []),
    ...(Array.isArray(planPayload?.explanation?.warnings) ? planPayload.explanation.warnings : []),
    ...(Array.isArray(insightPayload?.insights?.warnings) ? insightPayload.insights.warnings : []),
  ];
  const tripPrep = {
    recommendedDepartureWindow: buildDepartureWindow(intelligence, decisionPayload, planPayload),
    suggestedStartingRig: buildStartingRig(intelligence, planPayload),
    suggestedTargetSpecies: intelligence?.targetSpecies || 'n/a',
    suggestedFocusSpot: intelligence?.recommendedSpot || 'n/a',
    conditionsSummary: buildConditionsSummary(intelligence, decisionPayload),
    expectation: buildExpectation(confidence),
    confidence,
  };

  return {
    tripPrep,
    checklist: buildChecklist({
      tripPrep,
      intelligence,
      decisionPayload,
      planPayload,
    }),
    warnings: Array.from(new Set(warnings)),
    explanation: {
      baseReasons: [
        tripPrep.recommendedDepartureWindow,
        tripPrep.conditionsSummary,
        tripPrep.expectation,
      ],
      signalsUsed: Array.isArray(decisionPayload?.explanation?.signalsUsed) ? decisionPayload.explanation.signalsUsed : [],
      signalsMissing: Array.isArray(decisionPayload?.explanation?.signalsMissing) ? decisionPayload.explanation.signalsMissing : [],
      notes: [
        'Trip Prep is user-facing only and does not alter recommendation engines.',
        ...(planPayload ? ['Saved-spot planning context was used as additional preparation context.'] : []),
      ],
    },
  };
}

async function getTripPrep(input, options = {}) {
  const intelligence = await getUnifiedIntelligence(input, {
    userId: options.userId || null,
  });
  const decisionPayload = synthesizeDecision(intelligence);

  let planPayload = null;
  let insightPayload = null;
  const hasSavedSpotContext = Number.isInteger(input.savedSpotId);

  if (hasSavedSpotContext && options.userId) {
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

  const payload = synthesizeTripPrep({
    intelligence,
    decisionPayload,
    planPayload,
    insightPayload,
  });

  if (hasSavedSpotContext && !options.userId) {
    payload.warnings.push('Saved-spot prep context requires login; using general trip prep only.');
    payload.explanation.notes.push('Saved-spot-specific prep was skipped because no authenticated user was available.');
  }

  payload.warnings = Array.from(new Set(payload.warnings));
  payload.explanation.notes = Array.from(new Set(payload.explanation.notes));
  return payload;
}

module.exports = {
  synthesizeTripPrep,
  getTripPrep,
};
