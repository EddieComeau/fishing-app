const { getUnifiedIntelligence } = require('./intelligenceOrchestrator.service');
const { getActiveSession } = require('./sessions.service');

function asLower(value) {
  return String(value || '').trim().toLowerCase();
}

function getUsedSignals(intelligence) {
  const used = [];
  const aligned = Array.isArray(intelligence?.explanation?.metadata?.signalsAligned)
    ? intelligence.explanation.metadata.signalsAligned
    : [];

  if (intelligence?.components?.biteWindow?.activityLevel) used.push('bite_window');
  if (intelligence?.components?.score?.confidence) used.push('environmental_score');
  if (intelligence?.recommendedSpot) used.push('spot_focus');
  if (intelligence?.recommendedRig) used.push('rig_focus');
  aligned.forEach((signal) => used.push(signal));

  return Array.from(new Set(used));
}

function getMissingSignals(intelligence) {
  const missing = [];
  const tideStage = asLower(intelligence?.components?.biteWindow?.currentWindow?.type)
    || asLower(intelligence?.components?.biteWindow?.nextWindow?.type)
    || asLower(intelligence?.components?.biteWindow?.currentWindow?.label)
    || '';
  const warnings = Array.isArray(intelligence?.explanation?.warnings) ? intelligence.explanation.warnings : [];
  const aligned = Array.isArray(intelligence?.explanation?.metadata?.signalsAligned)
    ? intelligence.explanation.metadata.signalsAligned
    : [];

  if (
    warnings.some((warning) => {
      const text = String(warning).toLowerCase();
      return text.includes('tide') && (text.includes('unavailable') || text.includes('not applied'));
    }) ||
    (!aligned.includes('tide') && tideStage.includes('tide') === false && warnings.some((warning) => String(warning).toLowerCase().includes('current-seam')))
  ) {
    missing.push('tide_signal');
  }

  if (!intelligence?.components?.score?.confidence) {
    missing.push('environmental_score');
  }

  return missing;
}

function buildSupportingSignals(intelligence) {
  const signals = [];
  const biteActivity = intelligence?.components?.biteWindow?.activityLevel;
  const scoreConfidence = intelligence?.components?.score?.confidence;
  const spotConfidence = intelligence?.confidence;
  const aligned = Array.isArray(intelligence?.explanation?.metadata?.signalsAligned)
    ? intelligence.explanation.metadata.signalsAligned
    : [];
  const scoreReasons = Array.isArray(intelligence?.explanation?.baseReasons) ? intelligence.explanation.baseReasons : [];

  if (biteActivity) {
    signals.push(`Bite window activity is ${biteActivity}.`);
  }

  if (scoreConfidence) {
    signals.push(`Environmental score confidence is ${scoreConfidence}.`);
  }

  if (spotConfidence) {
    signals.push(`Trip-level confidence is ${spotConfidence}.`);
  }

  if (aligned.length) {
    signals.push(`Aligned signals: ${aligned.join(', ')}.`);
  }

  if (scoreReasons[0]) {
    signals.push(scoreReasons[0]);
  }

  return signals.slice(0, 4);
}

function synthesizeDecision(intelligence, options = {}) {
  const biteActivity = asLower(intelligence?.components?.biteWindow?.activityLevel);
  const scoreConfidence = asLower(intelligence?.components?.score?.confidence);
  const tripConfidence = asLower(intelligence?.confidence);
  const alignedSignals = Array.isArray(intelligence?.explanation?.metadata?.signalsAligned)
    ? intelligence.explanation.metadata.signalsAligned
    : [];
  const warnings = Array.isArray(intelligence?.explanation?.warnings) ? intelligence.explanation.warnings : [];
  const activeSession = options.activeSession || null;

  let goFishing = 'conditional';
  let confidence = 'moderate';
  let primaryReason = 'Some activity is present, but the signals are mixed.';

  if (biteActivity === 'high' && alignedSignals.length >= 3 && (tripConfidence === 'high' || scoreConfidence === 'high')) {
    goFishing = 'yes';
    confidence = 'high';
    primaryReason = 'Strong bite window with aligned environmental and spot signals.';
  } else if (biteActivity === 'low' && alignedSignals.length <= 1 && tripConfidence === 'low') {
    goFishing = 'no';
    confidence = 'low';
    primaryReason = 'Low activity and weak environmental signals.';
  } else if (biteActivity === 'moderate' || alignedSignals.length >= 2 || tripConfidence === 'medium') {
    goFishing = 'conditional';
    confidence = tripConfidence === 'high' ? 'moderate' : (tripConfidence || 'moderate').replace('medium', 'moderate');
    primaryReason = 'Some activity is present, but signals are mixed.';
  } else {
    goFishing = 'conditional';
    confidence = 'low';
    primaryReason = 'Signals are incomplete, so the trip outlook is uncertain.';
  }

  if (warnings.length && confidence === 'high') {
    confidence = 'moderate';
  }

  if (warnings.length && goFishing === 'yes' && warnings.some((warning) => String(warning).toLowerCase().includes('tide'))) {
    goFishing = 'conditional';
    primaryReason = 'The conditions are promising, but some key signals are degraded.';
  }

  const summaryWarnings = [...warnings];
  if (confidence === 'low') {
    summaryWarnings.push('Decision confidence is low.');
  }
  if (activeSession) {
    summaryWarnings.push('An active session is already running.');
  }

  return {
    decision: {
      goFishing,
      confidence,
    },
    summary: {
      primaryReason,
      supportingSignals: buildSupportingSignals(intelligence),
      warnings: Array.from(new Set(summaryWarnings)),
    },
    recommendedFocus: {
      spot: intelligence?.recommendedSpot || 'n/a',
      species: intelligence?.targetSpecies || 'n/a',
      rig: intelligence?.recommendedRig || 'n/a',
    },
    explanation: {
      signalsUsed: getUsedSignals(intelligence),
      signalsMissing: getMissingSignals(intelligence),
      notes: activeSession
        ? ['Decision layer is user-facing only and does not alter the active session state.']
        : ['Decision layer is user-facing only and does not alter recommendation engines.'],
    },
  };
}

async function getTripDecision(input, options = {}) {
  const intelligence = await getUnifiedIntelligence(input, {
    userId: options.userId || null,
  });
  const activeSession = options.userId ? await getActiveSession(options.userId) : null;
  return synthesizeDecision(intelligence, { activeSession });
}

module.exports = {
  synthesizeDecision,
  getTripDecision,
};
