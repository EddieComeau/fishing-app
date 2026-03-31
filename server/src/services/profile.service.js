const { getCatchSummary } = require('./analytics.service');
const { listSessionHistory } = require('./sessions.service');
const { getSessionReview } = require('./sessionReview.service');
const { getSessionComparison } = require('./sessionComparison.service');

function asLower(value) {
  return String(value || '').trim().toLowerCase();
}

function average(values) {
  const usable = (Array.isArray(values) ? values : []).filter((value) => Number.isFinite(value));
  if (!usable.length) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function countModes(values) {
  const counts = new Map();

  (Array.isArray(values) ? values : []).forEach((value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  });

  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return {
    label: entries[0]?.[0] || null,
    count: entries[0]?.[1] || 0,
  };
}

function unique(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function deriveStyle({
  sessionCount,
  topRig,
  topSpecies,
  highOutcomeRate,
  topRigRate,
  topSpeciesRate,
}) {
  if (sessionCount < 3) {
    return 'low-data exploratory angler';
  }

  if (topRig.label && topSpecies.label && topRigRate >= 0.5 && topSpeciesRate >= 0.5 && highOutcomeRate >= 0.5) {
    return 'consistent structure-focused angler';
  }

  if (topRig.label && topRigRate >= 0.4) {
    return 'rig-pattern angler with a repeatable approach';
  }

  if (topSpecies.label && topSpeciesRate >= 0.4) {
    return 'species-focused angler with emerging repeatable targets';
  }

  return 'opportunistic mixed-approach angler';
}

function deriveConsistency({
  sessionCount,
  catchSpread,
  topRigRate,
  topSpeciesRate,
  goodOrMixedRate,
}) {
  if (sessionCount < 3) {
    return 'low';
  }

  if (catchSpread <= 1.5 && topRigRate >= 0.5 && topSpeciesRate >= 0.5 && goodOrMixedRate >= 0.75) {
    return 'high';
  }

  if (catchSpread <= 3 && (topRigRate >= 0.34 || topSpeciesRate >= 0.34 || goodOrMixedRate >= 0.5)) {
    return 'moderate';
  }

  return 'low';
}

function deriveConfidence({ sessionCount, patternCount, warningCount, signalsMissingCount }) {
  if (sessionCount >= 6 && patternCount >= 3 && warningCount <= 1 && signalsMissingCount <= 1) {
    return 'high';
  }

  if (sessionCount >= 3 && patternCount >= 1) {
    return 'moderate';
  }

  return 'low';
}

function buildSummary({ style, consistency, topRig, topSpecies, confidence }) {
  const parts = [`This profile reflects a ${style}`];

  if (consistency === 'high') {
    parts.push('with high consistency');
  } else if (consistency === 'moderate') {
    parts.push('with moderate consistency');
  } else {
    parts.push('with uneven consistency');
  }

  if (topRig.label) {
    parts.push(`and repeated success around ${topRig.label}`);
  } else if (topSpecies.label) {
    parts.push(`and an emerging focus on ${topSpecies.label}`);
  }

  if (confidence === 'low') {
    parts.push('though limited history reduces confidence');
  }

  return `${parts.join(' ')}.`;
}

function buildProfilePayload({ sessions, reviews, comparisons, analytics }) {
  const endedSessions = Array.isArray(sessions) ? sessions : [];
  const reviewList = Array.isArray(reviews) ? reviews : [];
  const comparisonList = Array.isArray(comparisons) ? comparisons : [];
  const warnings = [];
  const strengths = [];
  const tendencies = [];
  const improvementAreas = [];
  const patterns = [];
  const signalsMissing = [];
  const notes = [
    'Fishing Profile is a read-only user-level synthesis layer.',
    'This profile does not change recommendations, analytics, or stored session data.',
  ];

  const sessionCount = endedSessions.length;
  if (sessionCount === 0) {
    warnings.push('No completed sessions yet, so profile signals are very limited.');
    signalsMissing.push('ended_session_history');
  }
  if (sessionCount < 3) {
    warnings.push('Limited completed-session history reduces profile confidence.');
  }

  const catches = endedSessions.map((session) => Number(session?.catches || 0));
  const averageCatches = average(catches);
  const catchSpread = catches.length ? Math.max(...catches) - Math.min(...catches) : 0;
  const topRig = countModes(endedSessions.map((session) => session?.topRig));
  const topSpecies = countModes(endedSessions.map((session) => session?.topSpecies));
  const topRigRate = sessionCount ? topRig.count / sessionCount : 0;
  const topSpeciesRate = sessionCount ? topSpecies.count / sessionCount : 0;

  const goodReviews = reviewList.filter((review) => asLower(review?.review?.overallOutcome) === 'good').length;
  const mixedReviews = reviewList.filter((review) => asLower(review?.review?.overallOutcome) === 'mixed').length;
  const poorReviews = reviewList.filter((review) => asLower(review?.review?.overallOutcome) === 'poor').length;
  const goodOrMixedRate = sessionCount ? (goodReviews + mixedReviews) / sessionCount : 0;
  const highOutcomeRate = sessionCount ? goodReviews / sessionCount : 0;

  const improvingCount = comparisonList.filter((item) => asLower(item?.comparison?.trend) === 'improving').length;
  const decliningCount = comparisonList.filter((item) => asLower(item?.comparison?.trend) === 'declining').length;
  const steadyCount = comparisonList.filter((item) => asLower(item?.comparison?.trend) === 'steady').length;

  const style = deriveStyle({
    sessionCount,
    topRig,
    topSpecies,
    highOutcomeRate,
    topRigRate,
    topSpeciesRate,
  });

  const consistency = deriveConsistency({
    sessionCount,
    catchSpread,
    topRigRate,
    topSpeciesRate,
    goodOrMixedRate,
  });

  if (topRig.label && topRig.count >= 2) {
    strengths.push(`${topRig.label} repeatedly shows up as your most productive rig.`);
    tendencies.push(`You prefer ${topRig.label} setups across multiple sessions.`);
    patterns.push(`Top rig stayed anchored around ${topRig.label} across recent outings.`);
  }

  if (topSpecies.label && topSpecies.count >= 2) {
    strengths.push(`${topSpecies.label} is your most repeatable caught species.`);
    tendencies.push(`Your completed trips often stay focused on ${topSpecies.label}.`);
  }

  const strongOpeningSessions = endedSessions.filter((session) => {
    const activity = asLower(session?.activityLevelAtStart);
    return activity === 'high' || activity === 'moderate';
  }).length;
  if (strongOpeningSessions >= 2 && goodReviews >= 2) {
    strengths.push('You convert stronger starting activity windows into productive trips more often than not.');
  }

  const softPlasticCount = Number(analytics?.topBaitFamilies?.find((item) => item?.baitFamily === 'soft-plastic')?.count || 0);
  if (softPlasticCount >= 2) {
    tendencies.push('You lean heavily on soft plastic presentations.');
  }

  if (averageCatches > 0 && catchSpread <= 2 && sessionCount >= 3) {
    patterns.push('Session output stays within a fairly repeatable catch range.');
  }

  if (improvingCount >= 2) {
    patterns.push('Recent comparisons show an improving session-level trend.');
  } else if (decliningCount >= 2) {
    improvementAreas.push('Recent session comparisons suggest results are softening across outings.');
  } else if (steadyCount >= 2) {
    patterns.push('Recent comparisons show a mostly steady baseline.');
  }

  if (poorReviews >= 2) {
    improvementAreas.push('Repeated poor session reviews suggest some outings are not adapting cleanly when results weaken.');
  }

  if (consistency === 'low' && sessionCount >= 3) {
    improvementAreas.push('Results vary heavily from trip to trip, so repeatable patterns are still weak.');
  }

  if (!topRig.label) {
    signalsMissing.push('rig_pattern');
  }

  if (!topSpecies.label) {
    signalsMissing.push('species_pattern');
  }

  reviewList.forEach((review) => {
    const missing = Array.isArray(review?.explanation?.signalsMissing) ? review.explanation.signalsMissing : [];
    missing.forEach((signal) => signalsMissing.push(signal));
  });

  comparisonList.forEach((comparison) => {
    const missing = Array.isArray(comparison?.explanation?.signalsMissing) ? comparison.explanation.signalsMissing : [];
    missing.forEach((signal) => signalsMissing.push(signal));
  });

  if (poorReviews === 0 && goodReviews === 0 && sessionCount > 0) {
    warnings.push('Review-derived outcome signals are limited, so the profile leans more heavily on raw session totals.');
  }

  const confidence = deriveConfidence({
    sessionCount,
    patternCount: unique(patterns).length + unique(strengths).length,
    warningCount: warnings.length,
    signalsMissingCount: unique(signalsMissing).length,
  });

  if (confidence === 'low') {
    warnings.push('Profile confidence is low because pattern strength or sample size is limited.');
  }

  return {
    profile: {
      style,
      consistency,
      confidence,
      summary: buildSummary({
        style,
        consistency,
        topRig,
        topSpecies,
        confidence,
      }),
    },
    strengths: unique(strengths),
    tendencies: unique(tendencies),
    improvementAreas: unique(improvementAreas),
    patterns: unique(patterns),
    warnings: unique(warnings),
    explanation: {
      baseReasons: [
        'Fishing Profile summarizes completed-session history into user-level patterns.',
        'This layer is user-facing only and does not influence recommendation or personalization engines.',
      ],
      signalsUsed: [
        'session_history',
        'session_reviews',
        'session_comparisons',
        'catch_analytics',
        'top_rig_patterns',
        'top_species_patterns',
      ],
      signalsMissing: unique(signalsMissing),
      notes,
    },
  };
}

async function getFishingProfile(userId) {
  const sessions = await listSessionHistory(userId, { status: 'ended', limit: 10 });
  const analytics = await getCatchSummary(userId);

  const reviews = [];
  const comparisons = [];

  for (const session of sessions) {
    try {
      reviews.push(await getSessionReview(userId, session.id));
    } catch (error) {
      if (error?.status !== 404) throw error;
    }

    try {
      comparisons.push(await getSessionComparison(userId, session.id, 5));
    } catch (error) {
      if (error?.status !== 404 && error?.status !== 400) throw error;
    }
  }

  return buildProfilePayload({
    sessions,
    reviews,
    comparisons,
    analytics,
  });
}

module.exports = {
  buildProfilePayload,
  getFishingProfile,
};
