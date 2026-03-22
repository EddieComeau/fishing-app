function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeInput(input) {
  return {
    waterType: String(input?.waterType || '').toLowerCase(),
    accessMode: String(input?.accessMode || '').toLowerCase(),
    targetSpecies: input?.targetSpecies ? String(input.targetSpecies) : null,
    windMph: asNumber(input?.conditions?.weather?.windMph),
    tideStage: String(input?.conditions?.tide?.stage || 'n/a').toLowerCase(),
    lineStrengthLb: asNumber(input?.rig?.lineStrengthLb),
    leaderStrengthLb: asNumber(input?.rig?.leaderStrengthLb),
  };
}

function validateRequired(input) {
  if (!input.waterType) {
    const err = new Error('waterType is required');
    err.status = 400;
    throw err;
  }

  if (!input.accessMode) {
    const err = new Error('accessMode is required');
    err.status = 400;
    throw err;
  }
}

function basePlanForAccess(accessMode) {
  if (accessMode === 'boat' || accessMode === 'kayak') {
    return {
      pressurePlan: 'moderate',
      dragGuidance: 'medium',
      reasons: ['Mobile access reduces fixed structure lock-in risk during the fight'],
      riskFactors: [],
      landingTips: ['Keep steady pressure and reposition angle if fish changes direction'],
    };
  }

  if (accessMode === 'dock' || accessMode === 'pier') {
    return {
      pressurePlan: 'heavy',
      dragGuidance: 'tight',
      reasons: ['Pier/dock structure increases wrap risk, requiring faster steering control'],
      riskFactors: ['structure'],
      landingTips: ['Steer fish away from pilings early and keep line clear of edges'],
    };
  }

  if (accessMode === 'surf') {
    return {
      pressurePlan: 'moderate',
      dragGuidance: 'medium',
      reasons: ['Surf fights are controlled by surge timing and line tension consistency'],
      riskFactors: ['wave surge', 'current'],
      landingTips: ['Use wave timing to gain line and avoid high-stick lifts in surge'],
    };
  }

  // bank / bridge / default
  return {
    pressurePlan: 'moderate',
    dragGuidance: 'medium',
    reasons: ['Shoreline access favors steady pressure over abrupt drag spikes'],
    riskFactors: [],
    landingTips: ['Maintain steady pressure and guide fish to a clear landing lane'],
  };
}

function applyWaterTypeModifiers(plan, waterType) {
  if (waterType === 'saltwater') {
    plan.reasons.push('Saltwater fights often include longer initial runs under sustained pressure');
    if (plan.dragGuidance === 'medium') {
      // keep medium/tight preference in saltwater
      plan.dragGuidance = 'medium';
    }
  }

  if (waterType === 'freshwater') {
    if (plan.dragGuidance === 'tight') plan.dragGuidance = 'medium';
    plan.reasons.push('Freshwater fights generally favor smoother drag over max lock pressure');
  }

  if (waterType === 'brackish') {
    plan.reasons.push('Brackish fights blend moving-water pressure with structure management');
  }
}

function applyWindModifier(plan, windMph) {
  if (windMph !== null && windMph > 15) {
    plan.riskFactors.push('line slack risk from wind drift');
    plan.landingTips.push('Maintain a lower rod tip angle to reduce wind bow in line');
    plan.reasons.push('Higher wind increases slack-control difficulty during direction changes');
  }
}

function applyTideModifier(plan, tideStage) {
  if (tideStage === 'incoming' || tideStage === 'outgoing') {
    plan.riskFactors.push('current pressure');
    plan.landingTips.push('Keep fish upstream of current where possible to maintain control');
    plan.reasons.push('Active tidal flow increases pressure on fish and line angle during the fight');
  }
}

function maybeApplyLineStrengthHint(plan, lineStrengthLb, leaderStrengthLb) {
  // Lightweight heuristic only; no physics model.
  if (lineStrengthLb !== null && leaderStrengthLb !== null) {
    if (leaderStrengthLb <= 10 && plan.dragGuidance === 'tight') {
      plan.dragGuidance = 'medium';
      plan.reasons.push('Lighter leader suggests avoiding fully tight drag to reduce break-off risk');
    }

    if (lineStrengthLb >= 30 && leaderStrengthLb >= 20 && plan.pressurePlan === 'moderate') {
      plan.reasons.push('Heavier line/leader supports controlled pressure when steering from structure');
    }
  }
}

function fightStrategy(inputBody) {
  const input = normalizeInput(inputBody);
  validateRequired(input);

  const plan = basePlanForAccess(input.accessMode);

  applyWaterTypeModifiers(plan, input.waterType);
  applyWindModifier(plan, input.windMph);
  applyTideModifier(plan, input.tideStage);
  maybeApplyLineStrengthHint(plan, input.lineStrengthLb, input.leaderStrengthLb);

  if (input.targetSpecies) {
    plan.reasons.push(`Target species context included: ${input.targetSpecies}`);
  }

  return {
    pressurePlan: plan.pressurePlan,
    dragGuidance: plan.dragGuidance,
    landingTips: Array.from(new Set(plan.landingTips)).slice(0, 4),
    riskFactors: Array.from(new Set(plan.riskFactors)).slice(0, 4),
    reasons: Array.from(new Set(plan.reasons)).slice(0, 4),
  };
}

module.exports = {
  fightStrategy,
};
