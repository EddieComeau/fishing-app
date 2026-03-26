function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function minutesBetween(start, end) {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return 0;
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function activityRank(level) {
  const value = String(level || '').toLowerCase();
  if (value === 'high') return 3;
  if (value === 'moderate') return 2;
  if (value === 'low') return 1;
  return 0;
}

function normalizeRigName(value) {
  const rig = String(value || '').trim();
  return rig || null;
}

function buildSuggestion(type, code, message, confidence, reason, evidence, priority = 'medium', warnings = []) {
  return {
    type,
    code,
    message,
    priority,
    confidence,
    reason,
    evidence,
    warnings,
  };
}

function lowerConfidence(confidence) {
  const value = String(confidence || '').toLowerCase();
  if (value === 'high') return 'medium';
  if (value === 'medium') return 'low';
  return 'low';
}

function suggestionPriority(type) {
  if (type === 'reposition') return 'high';
  if (type === 'rig_adjustment') return 'medium';
  if (type === 'presentation_change') return 'medium';
  if (type === 'stay_with_pattern') return 'low';
  return 'low';
}

function priorityRank(priority) {
  const value = String(priority || '').toLowerCase();
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  return 1;
}

function confidenceRank(confidence) {
  const value = String(confidence || '').toLowerCase();
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  return 1;
}

function dedupeWarnings(items) {
  return [...new Set((Array.isArray(items) ? items : []).map((item) => String(item || '').trim()).filter(Boolean))];
}

function buildRigUsage(catches) {
  const counts = new Map();

  (Array.isArray(catches) ? catches : []).forEach((item) => {
    const rig = normalizeRigName(item?.rig_name);
    if (!rig) return;
    counts.set(rig, (counts.get(rig) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([rigName, count]) => ({ rigName, count }))
    .sort((a, b) => b.count - a.count || a.rigName.localeCompare(b.rigName));
}

function buildNoCatchHighActivitySuggestion(summary, sessionDurationMinutes, currentActivityLevel) {
  if ((summary?.catches || 0) !== 0) return null;
  if (sessionDurationMinutes < 30) return null;
  if (String(currentActivityLevel || '').toLowerCase() !== 'high') return null;

  return buildSuggestion(
    'rig_adjustment',
    'no_catch_high_activity_window',
    'No catches during a strong activity window. Try switching to a faster-moving presentation.',
    sessionDurationMinutes >= 45 ? 'high' : 'medium',
    'High bite-window conditions persisted without any catches logged during this outing.',
    {
      sessionDurationMinutes,
      sessionCatchCount: summary?.catches || 0,
      biteWindowLevel: currentActivityLevel,
    },
    suggestionPriority('rig_adjustment')
  );
}

function buildStayWithPatternSuggestion(summary, catches) {
  const rigUsage = buildRigUsage(catches);
  const topRig = rigUsage[0] || null;

  if (!topRig || topRig.count < 2) return null;
  if (rigUsage.length > 1) return null;

  return buildSuggestion(
    'stay_with_pattern',
    'same_rig_session_pattern',
    `${topRig.count} catches this session came on ${topRig.rigName}. Stay with the current setup unless conditions shift.`,
    topRig.count >= 3 ? 'high' : 'medium',
    'Multiple catches in this outing came on the same rig and there is no conflicting session pattern yet.',
    {
      sessionDurationMinutes: null,
      sessionCatchCount: summary?.catches || 0,
      topRig: topRig.rigName,
      topRigCatchCount: topRig.count,
      distinctRigCount: rigUsage.length,
    },
    suggestionPriority('stay_with_pattern')
  );
}

function buildRepositionSuggestion(summary, sessionDurationMinutes, currentContext) {
  const topSpotType = String(currentContext?.components?.topSpot?.type || '');
  const waterType = String(currentContext?.waterType || currentContext?.components?.waterType || '').toLowerCase();
  const tidalWater = waterType === 'saltwater' || waterType === 'brackish';

  if (!tidalWater) return null;
  if (sessionDurationMinutes < 90) return null;
  if (topSpotType !== 'current_seam_structure') return null;

  return buildSuggestion(
    'reposition',
    'tide_phase_reposition',
    'Tide phase has shifted during this outing. Reposition toward a new current seam or transition edge.',
    sessionDurationMinutes >= 120 ? 'high' : 'medium',
    'This outing has been active long enough for tide-driven position changes, and the current recommendation still depends on moving-water structure.',
    {
      sessionDurationMinutes,
      sessionCatchCount: summary?.catches || 0,
      currentSpotType: topSpotType,
      tideSignalAvailable: true,
      waterType,
    },
    suggestionPriority('reposition')
  );
}

function buildWeakeningWindowSuggestion(summary, sessionDurationMinutes, currentActivityLevel) {
  const startLevel = String(summary?.activityLevelAtStart || '').toLowerCase();
  const currentLevel = String(currentActivityLevel || '').toLowerCase();
  const startRank = activityRank(startLevel);
  const currentRank = activityRank(currentLevel);
  const lastCatchAt = toDate(summary?.lastCatchAt);
  const now = new Date();
  const minutesSinceLastCatch = lastCatchAt ? minutesBetween(lastCatchAt, now) : null;
  const noRecentCatch = minutesSinceLastCatch === null || minutesSinceLastCatch >= 30;

  if (sessionDurationMinutes < 30) return null;
  if (startRank < 2) return null;
  if (currentRank !== 1) return null;
  if (!noRecentCatch) return null;

  return buildSuggestion(
    'presentation_change',
    'bite_window_weakened',
    'Activity window is weakening. Try slowing the presentation or working deeper structure.',
    startRank === 3 ? 'high' : 'medium',
    'The outing started in a stronger activity state, but the current bite window has dropped without a recent catch offsetting that decline.',
    {
      sessionDurationMinutes,
      sessionCatchCount: summary?.catches || 0,
      biteWindowLevelAtStart: startLevel || null,
      currentBiteWindowLevel: currentLevel || null,
      minutesSinceLastCatch,
    },
    suggestionPriority('presentation_change')
  );
}

function mergeSimilarSuggestions(suggestions) {
  const list = Array.isArray(suggestions) ? suggestions.filter(Boolean) : [];
  const reposition = list.find((item) => item.type === 'reposition') || null;
  const noCatch = list.find((item) => item.code === 'no_catch_high_activity_window') || null;
  const weakening = list.find((item) => item.code === 'bite_window_weakened') || null;

  if (noCatch && weakening) {
    const merged = buildSuggestion(
      'presentation_change',
      'adjust_presentation_under_declining_results',
      'No catches are lining up with the current session trend. Change presentation speed or work a different depth band.',
      confidenceRank(noCatch.confidence) >= confidenceRank(weakening.confidence) ? noCatch.confidence : weakening.confidence,
      'Catch results are weak and session activity context is no longer improving, so one bounded adjustment suggestion is clearer than multiple overlapping ones.',
      {
        sessionDurationMinutes: Math.max(
          Number(noCatch.evidence?.sessionDurationMinutes || 0),
          Number(weakening.evidence?.sessionDurationMinutes || 0)
        ),
        sessionCatchCount: Math.max(
          Number(noCatch.evidence?.sessionCatchCount || 0),
          Number(weakening.evidence?.sessionCatchCount || 0)
        ),
        biteWindowLevel: noCatch.evidence?.biteWindowLevel || weakening.evidence?.currentBiteWindowLevel || null,
        biteWindowLevelAtStart: weakening.evidence?.biteWindowLevelAtStart || null,
      },
      'medium',
      dedupeWarnings([...(noCatch.warnings || []), ...(weakening.warnings || [])])
    );

    return [
      ...list.filter((item) => item !== noCatch && item !== weakening),
      merged,
    ];
  }

  if (reposition && noCatch) {
    return [
      ...list.filter((item) => item !== noCatch && item !== reposition),
      {
        ...reposition,
        warnings: dedupeWarnings([
          ...(reposition.warnings || []),
          'Rig-change suggestion was deprioritized because the environmental shift should be addressed first.',
        ]),
      },
    ];
  }

  return list;
}

function resolveConflicts(suggestions) {
  return mergeSimilarSuggestions(suggestions)
    .sort((a, b) => {
      const priorityGap = priorityRank(b.priority) - priorityRank(a.priority);
      if (priorityGap !== 0) return priorityGap;

      const confidenceGap = confidenceRank(b.confidence) - confidenceRank(a.confidence);
      if (confidenceGap !== 0) return confidenceGap;

      return String(a.code || '').localeCompare(String(b.code || ''));
    });
}

function applyPartialDataHandling(suggestions, providerContextWarning, currentContext) {
  const warningList = [];
  if (providerContextWarning) warningList.push(providerContextWarning);

  const tideSignalAvailable = currentContext?.components?.biteWindow?.explanation?.metadata?.signalsEvaluated?.tideTransitions;
  const tidalWater = ['saltwater', 'brackish'].includes(String(currentContext?.waterType || '').toLowerCase());

  if (tidalWater && tideSignalAvailable === false) {
    warningList.push('Tide data unavailable or incomplete for adaptive positioning logic.');
  }

  const dedupedWarnings = dedupeWarnings(warningList);
  if (!dedupedWarnings.length) {
    return {
      suggestions,
      warnings: [],
    };
  }

  return {
    suggestions: (Array.isArray(suggestions) ? suggestions : []).map((item) => ({
      ...item,
      confidence: lowerConfidence(item.confidence),
      warnings: dedupeWarnings([...(item.warnings || []), ...dedupedWarnings]),
    })),
    warnings: dedupedWarnings,
  };
}

function getAdaptiveSuggestions({ summary, catches, currentContext, providerContextWarning }) {
  const startedAt = toDate(summary?.startedAt);
  const endedAt = toDate(summary?.endedAt) || new Date();
  const sessionDurationMinutes = minutesBetween(startedAt, endedAt);
  const currentActivityLevel = currentContext?.components?.biteWindow?.activityLevel || null;
  const suggestions = [];

  const stayWithPattern = buildStayWithPatternSuggestion(summary, catches);
  if (stayWithPattern) {
    stayWithPattern.evidence.sessionDurationMinutes = sessionDurationMinutes;
    suggestions.push(stayWithPattern);
  }

  const noCatchHighActivity = buildNoCatchHighActivitySuggestion(summary, sessionDurationMinutes, currentActivityLevel);
  if (noCatchHighActivity) suggestions.push(noCatchHighActivity);

  const reposition = buildRepositionSuggestion(summary, sessionDurationMinutes, currentContext);
  if (reposition) suggestions.push(reposition);

  const weakening = buildWeakeningWindowSuggestion(summary, sessionDurationMinutes, currentActivityLevel);
  if (weakening) suggestions.push(weakening);

  const resolved = resolveConflicts(suggestions);
  const partialDataHandled = applyPartialDataHandling(resolved, providerContextWarning, currentContext);

  return {
    suggestions: partialDataHandled.suggestions.slice(0, 3),
    warnings: partialDataHandled.warnings,
  };
}

module.exports = {
  getAdaptiveSuggestions,
  suggestionPriority,
  resolveConflicts,
  mergeSimilarSuggestions,
};
