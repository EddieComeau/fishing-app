const { evaluateRigPersonalization } = require('./rigPersonalization.service');

function scoreFreshwaterCandidates(tempF, windMph) {
  const candidates = [
    {
      rigName: 'Texas rig',
      score: 3,
      reasons: ['Texas rig provides a versatile baseline for freshwater structure'],
    },
    {
      rigName: 'Spinnerbait',
      score: 2,
      reasons: ['Spinnerbait offers moving-bait coverage for active freshwater fish'],
    },
    {
      rigName: 'Drop shot',
      score: 2,
      reasons: ['Drop shot gives a controlled finesse presentation around pressured fish'],
    },
    {
      rigName: 'Wacky rig',
      score: 2,
      reasons: ['Wacky rig can slow down the presentation when fish are less aggressive'],
    },
  ];

  candidates.forEach((candidate) => {
    if (candidate.rigName === 'Spinnerbait' && windMph !== null && windMph > 15) {
      candidate.score += 2;
      candidate.reasons.unshift('Windy freshwater conditions favor moving bait coverage');
    }

    if (candidate.rigName === 'Drop shot' && tempF !== null && tempF < 60) {
      candidate.score += 2;
      candidate.reasons.unshift('Cool freshwater conditions can favor slower finesse presentations');
    }

    if (candidate.rigName === 'Wacky rig' && tempF !== null && tempF > 80) {
      candidate.score += 2;
      candidate.reasons.unshift('Warm freshwater can reward slower subtle presentations');
    }

    if (candidate.rigName === 'Texas rig' && tempF !== null && tempF >= 60 && tempF <= 80) {
      candidate.score += 1;
    }
  });

  return candidates;
}

function scoreSaltOrBrackishCandidates(accessMode, tideStage, windMph) {
  const access = String(accessMode || '').toLowerCase();
  const candidates = [
    {
      rigName: 'Jighead + paddle tail',
      score: 3,
      reasons: ['Jighead + paddle tail is a versatile salt/brackish baseline'],
    },
    {
      rigName: 'Popping cork',
      score: 2,
      reasons: ['Popping cork keeps baits suspended around active salt/brackish fish'],
    },
    {
      rigName: 'Fish finder rig',
      score: 2,
      reasons: ['Fish finder rig offers bottom-oriented stability in moving water'],
    },
    {
      rigName: 'Surf high-low rig',
      score: access === 'surf' ? 3 : 1,
      reasons: ['Surf high-low rig supports distance and multi-hook surf presentations'],
    },
  ];

  candidates.forEach((candidate) => {
    if (candidate.rigName === 'Surf high-low rig' && access === 'surf') {
      candidate.score += 2;
      candidate.reasons.unshift('Surf access benefits from distance-capable multi-hook rigs');
    }

    if (access === 'pier' || access === 'dock' || access === 'bridge') {
      if (candidate.rigName === 'Jighead + paddle tail' && tideStage === 'outgoing') {
        candidate.score += 2;
        candidate.reasons.unshift('Outgoing tide can improve current-lane bait movement near structure');
      }

      if (candidate.rigName === 'Popping cork') {
        candidate.score += 1;
        candidate.reasons.unshift('Dock/pier structure often pairs well with suspended presentations');
      }
    }

    if (candidate.rigName === 'Fish finder rig' && windMph !== null && windMph > 18) {
      candidate.score += 2;
      candidate.reasons.unshift('Higher wind/current can favor bottom-oriented stability rigs');
    }
  });

  return candidates;
}

function buildRod(accessMode) {
  const access = String(accessMode || '').toLowerCase();

  if (access === 'surf') return { power: 'Medium-Heavy', length: '8ft-10ft', action: 'Fast' };
  if (access === 'boat' || access === 'kayak') return { power: 'Medium-Heavy', length: '7ft-7ft6', action: 'Fast' };
  if (access === 'pier' || access === 'dock' || access === 'bridge') return { power: 'Medium', length: '6ft6-7ft', action: 'Fast' };
  return { power: 'Medium', length: '7ft', action: 'Fast' };
}

function buildLine(waterType, accessMode) {
  const wt = String(waterType || 'freshwater').toLowerCase();
  const access = String(accessMode || '').toLowerCase();

  if (wt === 'freshwater') {
    if (access === 'bank') return { type: 'Braided', strengthLb: 15 };
    return { type: 'Fluorocarbon', strengthLb: 12 };
  }

  if (access === 'surf') return { type: 'Braided', strengthLb: 30 };
  if (access === 'pier' || access === 'dock' || access === 'bridge') return { type: 'Braided', strengthLb: 20 };
  return { type: 'Braided', strengthLb: 20 };
}

function buildLeader(waterType, accessMode) {
  const wt = String(waterType || 'freshwater').toLowerCase();
  const access = String(accessMode || '').toLowerCase();

  if (wt === 'freshwater') return { type: 'Fluorocarbon', strengthLb: 10, lengthIn: 18 };
  if (access === 'surf') return { type: 'Fluorocarbon', strengthLb: 25, lengthIn: 36 };
  if (access === 'pier' || access === 'dock' || access === 'bridge') return { type: 'Fluorocarbon', strengthLb: 15, lengthIn: 24 };
  return { type: 'Fluorocarbon', strengthLb: 15, lengthIn: 24 };
}

function estimateSnagRisk(rigName, accessMode) {
  const access = String(accessMode || '').toLowerCase();

  if (rigName === 'Texas rig' || rigName === 'Spinnerbait') return 'low';
  if (rigName === 'Fish finder rig' || rigName === 'Surf high-low rig') return access === 'surf' ? 'medium' : 'high';
  if (access === 'pier' || access === 'dock' || access === 'bridge') return 'medium';
  return 'medium';
}

function normalizeInput(input) {
  const weather = input?.conditions?.weather || {};
  const tide = input?.conditions?.tide || {};

  return {
    waterType: String(input?.waterType || 'freshwater').toLowerCase(),
    accessMode: String(input?.accessMode || 'bank').toLowerCase(),
    targetSpecies: input?.targetSpecies ? String(input.targetSpecies) : null,
    tempF: Number.isFinite(Number(weather.tempF)) ? Number(weather.tempF) : null,
    windMph: Number.isFinite(Number(weather.windMph)) ? Number(weather.windMph) : null,
    tideStage: String(tide.stage || 'n/a').toLowerCase(),
  };
}

function rankCandidates(candidates, normalized) {
  return candidates
    .map((candidate) => {
      const reasons = [...candidate.reasons];

      if (normalized.accessMode === 'boat' || normalized.accessMode === 'kayak') {
        reasons.push('Mobile access allows slightly heavier and more control-oriented setups');
      }

      if (normalized.waterType === 'freshwater') {
        reasons.push('Freshwater rig selection prioritizes structure navigation and bite consistency');
      } else if (normalized.waterType === 'saltwater') {
        reasons.push('Saltwater rig selection prioritizes current movement and abrasion resilience');
      } else {
        reasons.push('Brackish rig selection balances tide movement with structure control');
      }

      if (normalized.accessMode === 'pier' || normalized.accessMode === 'dock' || normalized.accessMode === 'bridge') {
        reasons.push('Structure-heavy access favors controlled retrieves and abrasion-resistant leadering');
      } else if (normalized.accessMode === 'surf') {
        reasons.push('Surf access favors longer rods and distance-capable presentations');
      } else if (normalized.accessMode === 'bank') {
        reasons.push('Bank access favors weedless or snag-aware rig profiles');
      }

      if (normalized.targetSpecies) {
        reasons.push(`Target species context considered: ${normalized.targetSpecies}`);
      }

      return {
        ...candidate,
        reasons: Array.from(new Set(reasons)).slice(0, 4),
      };
    })
    .sort((a, b) => b.score - a.score || a.rigName.localeCompare(b.rigName));
}

function withBaseRanks(candidates) {
  return candidates.map((candidate, index) => ({
    ...candidate,
    baseRank: index + 1,
  }));
}

function applyTieBreakIfEligible(candidates, personalization, targetSpecies) {
  if (!personalization.applied || !personalization.preview?.preferredRig || candidates.length < 2) {
    return { candidates, personalization, tieBreakApplied: false };
  }

  const preferredRig = personalization.preview.preferredRig;
  const top = candidates[0];
  const second = candidates[1];
  const isTie = top.score === second.score;

  if (!isTie || top.rigName === preferredRig || second.rigName !== preferredRig) {
    return { candidates, personalization, tieBreakApplied: false };
  }

  const reordered = [second, top, ...candidates.slice(2)];
  const modifier = personalization.modifier
    ? {
        ...personalization.modifier,
        code: 'tie_break_applied',
        reason: `Base rules considered multiple rigs similarly valid. Your catch history for ${targetSpecies} favors ${preferredRig} outcomes, so it was selected as the tie-break winner.`,
        impact: 'tie_break',
      }
    : null;

  return {
    candidates: reordered,
    personalization: {
      ...personalization,
      code: 'tie_break_applied',
      modifier,
      preview: {
        ...personalization.preview,
        preferredRig,
        appliedAs: 'tie_break',
      },
    },
    tieBreakApplied: true,
  };
}

function applyOneRankAdjustmentIfEligible(candidates, personalization, targetSpecies) {
  if (!personalization.applied || !personalization.preview?.preferredRig || candidates.length < 2) {
    return { candidates, personalization, oneRankAdjustmentApplied: false };
  }

  const preferredRig = personalization.preview.preferredRig;
  const top = candidates[0];
  const second = candidates[1];
  const strongEvidence = personalization.preview.strongEvidence === true;
  const baseScoreGap = top.score > 0
    ? Number(((top.score - second.score) / top.score).toFixed(2))
    : 1;

  if (
    !strongEvidence ||
    top.rigName === preferredRig ||
    second.rigName !== preferredRig ||
    baseScoreGap > 0.2
  ) {
    return { candidates, personalization, oneRankAdjustmentApplied: false };
  }

  const reordered = [second, top, ...candidates.slice(2)];
  const modifier = personalization.modifier
    ? {
        ...personalization.modifier,
        code: 'one_rank_adjustment_applied',
        reason: `Your catch history for ${targetSpecies} strongly favors ${preferredRig} outcomes, so it was moved up one rank within a narrow base-score gap.`,
        impact: 'one_rank_adjustment',
        confidence: 'high',
        evidence: {
          ...personalization.modifier.evidence,
          baseScoreGap,
        },
      }
    : null;

  return {
    candidates: reordered,
    personalization: {
      ...personalization,
      code: 'one_rank_adjustment_applied',
      modifier,
      preview: {
        ...personalization.preview,
        baseScoreGap,
        appliedAs: 'one_rank_adjustment',
      },
    },
    oneRankAdjustmentApplied: true,
  };
}

async function recommendRig(input, options = {}) {
  const normalized = normalizeInput(input);
  const baseCandidates = normalized.waterType === 'freshwater'
    ? scoreFreshwaterCandidates(normalized.tempF, normalized.windMph)
    : scoreSaltOrBrackishCandidates(normalized.accessMode, normalized.tideStage, normalized.windMph);
  const rankedCandidates = withBaseRanks(rankCandidates(baseCandidates, normalized));

  const rod = buildRod(normalized.accessMode);
  const line = buildLine(normalized.waterType, normalized.accessMode);
  const personalization = await evaluateRigPersonalization({
    userId: options.userId || null,
    targetSpecies: normalized.targetSpecies,
  });
  const personalizationResult = applyTieBreakIfEligible(
    rankedCandidates,
    personalization,
    normalized.targetSpecies
  );
  const oneRankAdjustedResult = personalizationResult.tieBreakApplied
    ? personalizationResult
    : applyOneRankAdjustmentIfEligible(
        personalizationResult.candidates,
        personalizationResult.personalization,
        normalized.targetSpecies
      );
  const finalCandidates = oneRankAdjustedResult.candidates;
  const rigChoice = finalCandidates[0];
  const leader = buildLeader(normalized.waterType, normalized.accessMode);
  const snagRisk = estimateSnagRisk(rigChoice.rigName, normalized.accessMode);
  const baseReasons = rigChoice.reasons;

  const explanation = {
    baseReasons,
    whyNot: finalCandidates.slice(1, 4).map((candidate) => ({
      option: candidate.rigName,
      reason: candidate.reasons?.[0] || 'A stronger-fit rig ranked ahead of this option for the current context.',
    })),
    warnings: [],
    modifiers: oneRankAdjustedResult.personalization.modifier ? [oneRankAdjustedResult.personalization.modifier] : [],
    metadata: {
      personalizationEvaluated: oneRankAdjustedResult.personalization.evaluated,
      personalizationApplied: oneRankAdjustedResult.personalization.applied,
      personalizationCode: oneRankAdjustedResult.personalization.code,
      candidateOrder: oneRankAdjustedResult.personalization.code === 'preference_detected_no_rerank' || !oneRankAdjustedResult.personalization.applied
        ? 'base'
        : 'personalized',
      candidateScoreMeaning: 'base_rule_score',
    },
  };

  return {
    rigName: rigChoice.rigName,
    rod,
    line,
    leader,
    snagRisk,
    reasons: baseReasons,
    explanation,
    personalizationPreview: oneRankAdjustedResult.personalization.preview || null,
    candidates: finalCandidates.map((candidate, index) => ({
      rigName: candidate.rigName,
      score: candidate.score,
      baseRank: candidate.baseRank,
      personalizedRank: index + 1,
    })),
  };
}

module.exports = {
  recommendRig,
};
