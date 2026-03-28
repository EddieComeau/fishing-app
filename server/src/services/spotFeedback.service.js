const { getSavedSpotSummary } = require('./spotSummary.service');

function confidenceLevelForAdjustment(adjustment) {
  if (adjustment === 'moderate_up' || adjustment === 'slight_down') return 'high';
  if (adjustment === 'slight_up') return 'medium';
  return 'low';
}

function evaluateSpotFeedback(summaryPayload) {
  const totalSessions = Number(summaryPayload?.summary?.totalSessions || 0);
  const avgCatchesPerSession = Number(summaryPayload?.summary?.avgCatchesPerSession || 0);
  const warnings = [];
  const signals = [];
  let confidenceAdjustment = 'none';

  if (totalSessions < 3) {
    warnings.push('Historical spot feedback is limited because fewer than 3 linked sessions exist.');
  } else if (totalSessions >= 5 && avgCatchesPerSession >= 2) {
    confidenceAdjustment = 'moderate_up';
    signals.push('This spot has consistently produced catches across multiple sessions.');
  } else if (totalSessions >= 5 && avgCatchesPerSession < 1) {
    confidenceAdjustment = 'slight_down';
    signals.push('Historical sessions at this spot have produced below-average catch volume.');
  } else if (totalSessions >= 3 && avgCatchesPerSession >= 1) {
    confidenceAdjustment = 'slight_up';
    signals.push('This spot has produced catches across multiple saved sessions.');
  }

  return {
    confidenceAdjustment,
    signals,
    warnings,
    metadata: {
      sampleSize: totalSessions,
      confidenceLevel: confidenceLevelForAdjustment(confidenceAdjustment),
    },
  };
}

async function getSpotFeedback({ userId, savedSpotId }) {
  if (!userId || !Number.isInteger(savedSpotId)) {
    return {
      confidenceAdjustment: 'none',
      signals: [],
      warnings: [],
      metadata: {
        sampleSize: 0,
        confidenceLevel: 'low',
      },
    };
  }

  const summaryPayload = await getSavedSpotSummary(userId, savedSpotId);
  return evaluateSpotFeedback(summaryPayload);
}

module.exports = {
  evaluateSpotFeedback,
  getSpotFeedback,
};
