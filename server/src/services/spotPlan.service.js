function hasUsableTimeSignal(bestTime) {
  return Boolean(bestTime) && !String(bestTime).startsWith('Not enough data');
}

function buildRecommendedTime(insights) {
  if (hasUsableTimeSignal(insights?.bestTime)) {
    return insights.bestTime;
  }

  return 'No strong time pattern - fish during active bite windows.';
}

function buildRecommendedRig(summary, insightMetadata) {
  const topRig = summary?.topRig || null;
  const dominantRigDetected = Boolean(insightMetadata?.dominantRigDetected);

  if (dominantRigDetected && topRig && topRig !== 'Unknown') {
    return `Start with ${topRig}.`;
  }

  return 'No dominant rig - use base recommendation.';
}

function determineConfidence(summary, insightMetadata) {
  const totalSessions = Number(summary?.totalSessions || 0);
  const avgCatchesPerSession = Number(summary?.avgCatchesPerSession || 0);
  const dominantRigDetected = Boolean(insightMetadata?.dominantRigDetected);

  if (totalSessions >= 5 && dominantRigDetected && avgCatchesPerSession >= 2) {
    return 'high';
  }

  if (totalSessions >= 3) {
    return 'moderate';
  }

  return 'low';
}

function buildStrategy({ summary, insights, confidence, dominantRigDetected }) {
  if (confidence === 'high') {
    const timeText = hasUsableTimeSignal(insights?.bestTime)
      ? insights.bestTime.replace('This spot performs best during ', '').replace(/\.$/, '')
      : 'active bite windows';
    const rigText = dominantRigDetected && summary?.topRig && summary.topRig !== 'Unknown'
      ? `using ${summary.topRig}`
      : 'using the most reliable setup available';
    return `Fish ${timeText} ${rigText} and stay with the established pattern at this spot.`;
  }

  if (confidence === 'moderate') {
    if (hasUsableTimeSignal(insights?.bestTime) && dominantRigDetected && summary?.topRig && summary.topRig !== 'Unknown') {
      return `Focus on ${insights.bestTime.replace('This spot performs best during ', '').replace(/\.$/, '')} and start with ${summary.topRig}.`;
    }

    if (hasUsableTimeSignal(insights?.bestTime)) {
      return 'Focus on the stronger bite windows at this spot and lean on proven techniques first.';
    }

    return 'Use the strongest patterns available here, but stay flexible because the signal is only partial.';
  }

  return 'Use standard techniques - limited data is available for this spot.';
}

function buildWarnings({ summary, insights, confidence, dominantRigDetected }) {
  const warnings = [];
  const totalSessions = Number(summary?.totalSessions || 0);
  const avgCatchesPerSession = Number(summary?.avgCatchesPerSession || 0);

  if (totalSessions < 3) {
    warnings.push('Limited data - plan confidence is low.');
  }

  if (!dominantRigDetected) {
    warnings.push('No dominant rig pattern is established for this spot.');
  }

  if (totalSessions > 0 && avgCatchesPerSession < 1) {
    warnings.push('Low catch consistency means this plan should be treated as a light suggestion.');
  }

  if (confidence === 'low' && !hasUsableTimeSignal(insights?.bestTime)) {
    warnings.push('No strong time pattern is available yet.');
  }

  return Array.from(new Set(warnings));
}

function getSpotPlan({ summaryPayload, insightPayload }) {
  const summary = summaryPayload?.summary || {};
  const insights = insightPayload?.insights || {};
  const insightMetadata = insightPayload?.explanation?.metadata || {};
  const dominantRigDetected = Boolean(insightMetadata.dominantRigDetected);
  const confidence = determineConfidence(summary, insightMetadata);

  const recommendedTime = buildRecommendedTime(insights);
  const recommendedRig = buildRecommendedRig(summary, insightMetadata);
  const strategy = buildStrategy({
    summary,
    insights,
    confidence,
    dominantRigDetected,
  });
  const warnings = buildWarnings({
    summary,
    insights,
    confidence,
    dominantRigDetected,
  });

  return {
    plan: {
      recommendedTime,
      recommendedRig,
      strategy,
      confidence,
    },
    explanation: {
      baseReasons: [
        recommendedTime,
        recommendedRig,
        strategy,
      ],
      warnings,
      modifiers: [],
      metadata: {
        sampleSize: Number(summary.totalSessions || 0),
        avgCatchesPerSession: Number(summary.avgCatchesPerSession || 0),
        dominantRigDetected,
        confidence,
      },
    },
  };
}

module.exports = {
  getSpotPlan,
};
