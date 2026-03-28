const { getSavedSpotSummary } = require('./spotSummary.service');

const VALID_FILTER_MODES = new Set(['default', 'proven_only', 'saved_spot_only']);
const VALID_RANK_MODES = new Set(['default', 'history_first', 'environment_first']);

function normalizeFilterMode(value) {
  const normalized = String(value || 'default').trim().toLowerCase();
  return VALID_FILTER_MODES.has(normalized) ? normalized : 'default';
}

function normalizeRankMode(value) {
  const normalized = String(value || 'default').trim().toLowerCase();
  return VALID_RANK_MODES.has(normalized) ? normalized : 'default';
}

function classifyHistoricalStrength(summaryPayload) {
  const totalSessions = Number(summaryPayload?.summary?.totalSessions || 0);
  const avgCatchesPerSession = Number(summaryPayload?.summary?.avgCatchesPerSession || 0);

  if (totalSessions >= 5 && avgCatchesPerSession >= 2) {
    return {
      historicalStrength: 'strong',
      sampleSize: totalSessions,
      avgCatchesPerSession,
    };
  }

  if (totalSessions >= 5 && avgCatchesPerSession < 1) {
    return {
      historicalStrength: 'weak',
      sampleSize: totalSessions,
      avgCatchesPerSession,
    };
  }

  if (totalSessions >= 3 && avgCatchesPerSession >= 1) {
    return {
      historicalStrength: 'moderate',
      sampleSize: totalSessions,
      avgCatchesPerSession,
    };
  }

  return {
    historicalStrength: 'insufficient',
    sampleSize: totalSessions,
    avgCatchesPerSession,
  };
}

function primarySpotIndex(spots) {
  const list = Array.isArray(spots) ? spots : [];
  const index = list.findIndex((spot) => spot?.type !== 'structure_intersection');
  return index >= 0 ? index : (list.length ? 0 : -1);
}

function appendModifier(payload, modifier) {
  payload.explanation.modifiers.push(modifier);
}

function appendWarning(payload, warning) {
  payload.explanation.warnings.push(warning);
  payload.filtering.warnings.push(warning);
}

function dedupeList(items) {
  return Array.from(new Set((Array.isArray(items) ? items : []).filter(Boolean)));
}

function clonePayload(spotPayload, filterMode, rankMode) {
  return {
    spots: Array.isArray(spotPayload?.spots)
      ? spotPayload.spots.map((spot) => ({
          ...spot,
          historicalFeedback: spot?.historicalFeedback
            ? {
                ...spot.historicalFeedback,
                signals: [...(spot.historicalFeedback.signals || [])],
                warnings: [...(spot.historicalFeedback.warnings || [])],
              }
            : undefined,
        }))
      : [],
    filtering: {
      filterMode,
      rankMode,
      applied: false,
      warnings: [],
    },
    explanation: {
      baseReasons: [...(spotPayload?.explanation?.baseReasons || [])],
      warnings: [...(spotPayload?.explanation?.warnings || [])],
      modifiers: [...(spotPayload?.explanation?.modifiers || [])],
      metadata: {
        ...(spotPayload?.explanation?.metadata || {}),
      },
    },
  };
}

async function applySpotFiltering(spotPayload, options = {}) {
  const filterMode = normalizeFilterMode(options.filterMode);
  const rankMode = normalizeRankMode(options.rankMode);
  const payload = clonePayload(spotPayload, filterMode, rankMode);
  const requestedHistoryBehavior = filterMode !== 'default' || rankMode !== 'default';
  const savedSpotId = Number.isInteger(options.savedSpotId) ? options.savedSpotId : null;

  payload.explanation.metadata.filtering = {
    filterMode,
    rankMode,
    applied: false,
    historicalStrength: null,
    sampleSize: 0,
  };

  if (!requestedHistoryBehavior) {
    return payload;
  }

  if (savedSpotId === null) {
    appendWarning(payload, 'No saved-spot context was provided; history-based spot filtering was not applied.');
    return payload;
  }

  if (!options.userId) {
    const err = new Error('Login is required to apply saved-spot filtering.');
    err.status = 401;
    throw err;
  }

  const summaryPayload = await getSavedSpotSummary(options.userId, savedSpotId);
  const historical = classifyHistoricalStrength(summaryPayload);
  const topIndex = primarySpotIndex(payload.spots);
  const topSpot = topIndex >= 0 ? payload.spots[topIndex] : null;

  payload.explanation.metadata.filtering.historicalStrength = historical.historicalStrength;
  payload.explanation.metadata.filtering.sampleSize = historical.sampleSize;

  if (filterMode === 'proven_only') {
    if (historical.sampleSize < 3) {
      payload.spots = [];
      payload.filtering.applied = true;
      payload.explanation.metadata.filtering.applied = true;
      appendWarning(payload, 'Not enough saved-spot history to apply proven-only filtering.');
      appendModifier(payload, {
        type: 'spot_filtering',
        impact: 'bounded_filter',
        filterMode,
        rankMode,
        reason: 'Proven-only filtering returned no spots because saved-spot history is below the minimum threshold.',
        metadata: {
          sampleSize: historical.sampleSize,
          historicalStrength: historical.historicalStrength,
        },
      });
      payload.explanation.baseReasons.push('Proven-only filtering requires at least 3 linked ended sessions.');
      payload.explanation.baseReasons = dedupeList(payload.explanation.baseReasons);
      payload.explanation.warnings = dedupeList(payload.explanation.warnings);
      payload.filtering.warnings = dedupeList(payload.filtering.warnings);
      return payload;
    }

    payload.spots = topSpot ? [topSpot] : [];
    payload.filtering.applied = true;
    payload.explanation.metadata.filtering.applied = true;
    appendModifier(payload, {
      type: 'spot_filtering',
      impact: 'bounded_filter',
      filterMode,
      rankMode,
      reason: 'Only the currently valid saved-spot-aligned recommendation was kept because this spot meets the proven-history threshold.',
      metadata: {
        sampleSize: historical.sampleSize,
        historicalStrength: historical.historicalStrength,
      },
    });
    payload.explanation.baseReasons.push('Proven-only filtering kept the current saved-spot-aligned recommendation.');
  } else if (filterMode === 'saved_spot_only') {
    payload.spots = topSpot ? [topSpot] : [];
    payload.filtering.applied = true;
    payload.explanation.metadata.filtering.applied = true;
    appendModifier(payload, {
      type: 'spot_filtering',
      impact: 'bounded_filter',
      filterMode,
      rankMode,
      reason: 'Saved-spot-only filtering focused the output on the currently loaded saved spot context.',
      metadata: {
        sampleSize: historical.sampleSize,
        historicalStrength: historical.historicalStrength,
      },
    });
    payload.explanation.baseReasons.push('Saved-spot-only filtering kept the current saved-spot-aligned recommendation.');
  }

  if (rankMode === 'history_first' && payload.spots.length > 1) {
    const currentTopIndex = primarySpotIndex(payload.spots);
    if (currentTopIndex >= 0) {
      if (historical.historicalStrength === 'weak' && currentTopIndex < payload.spots.length - 1) {
        const reordered = [...payload.spots];
        const [movedSpot] = reordered.splice(currentTopIndex, 1);
        reordered.splice(currentTopIndex + 1, 0, movedSpot);
        payload.spots = reordered;
        payload.filtering.applied = true;
        payload.explanation.metadata.filtering.applied = true;
        appendModifier(payload, {
          type: 'spot_filtering',
          impact: 'bounded_rank_adjustment',
          filterMode,
          rankMode,
          reason: 'Historically weak saved-spot performance lowered the top spot by one place among already-valid outputs.',
          metadata: {
            sampleSize: historical.sampleSize,
            historicalStrength: historical.historicalStrength,
          },
        });
        payload.explanation.baseReasons.push('History-first ranking moved the weak-history spot down one position.');
      } else if (historical.historicalStrength === 'strong') {
        payload.filtering.applied = true;
        payload.explanation.metadata.filtering.applied = true;
        appendModifier(payload, {
          type: 'spot_filtering',
          impact: 'bounded_rank_adjustment',
          filterMode,
          rankMode,
          reason: 'Historically strong saved-spot performance was considered first, but no additional upward movement was needed.',
          metadata: {
            sampleSize: historical.sampleSize,
            historicalStrength: historical.historicalStrength,
          },
        });
        payload.explanation.baseReasons.push('History-first ranking confirmed the strongest saved-spot-aligned option without overriding base validity.');
      } else if (historical.historicalStrength === 'moderate') {
        payload.filtering.applied = true;
        payload.explanation.metadata.filtering.applied = true;
        appendModifier(payload, {
          type: 'spot_filtering',
          impact: 'bounded_rank_adjustment',
          filterMode,
          rankMode,
          reason: 'Moderate saved-spot history was evaluated first, but no bounded reorder was required.',
          metadata: {
            sampleSize: historical.sampleSize,
            historicalStrength: historical.historicalStrength,
          },
        });
        payload.explanation.baseReasons.push('History-first ranking evaluated moderate saved-spot history without forcing movement.');
      } else {
        appendWarning(payload, 'Saved-spot history is insufficient to drive ranking changes, so environmental order was preserved.');
      }
    }
  }

  payload.explanation.baseReasons = dedupeList(payload.explanation.baseReasons);
  payload.explanation.warnings = dedupeList(payload.explanation.warnings);
  payload.filtering.warnings = dedupeList(payload.filtering.warnings);

  return payload;
}

module.exports = {
  VALID_FILTER_MODES,
  VALID_RANK_MODES,
  normalizeFilterMode,
  normalizeRankMode,
  applySpotFiltering,
};
