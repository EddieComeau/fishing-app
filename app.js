const fallbackSpecies = [
  "Largemouth Bass",
  "Smallmouth Bass",
  "Bluegill",
  "Redfish",
  "Speckled Trout",
];

const API_BASE = "http://localhost:3002/api";

let currentUser = null;

const contextForm = document.getElementById("context-form");
const waterTypeEl = document.getElementById("water-type");
const spotInputEl = contextForm?.querySelector('input[name="spot"]') || null;
const accessModeInputEl = contextForm?.querySelector('select[name="accessMode"]') || null;
const latInputEl = contextForm?.querySelector('input[name="lat"]') || null;
const lngInputEl = contextForm?.querySelector('input[name="lng"]') || null;
const tideStationInputEl = contextForm?.querySelector('input[name="tideStationId"]') || null;
const useMyLocationBtn = document.getElementById("use-my-location-btn");
const locationAssistNoteEl = document.getElementById("location-assist-note");
const tideStationWrapEl = document.getElementById("tide-station-wrap");
const statusBannerEl = document.getElementById("status-banner");
const snapshotEl = document.getElementById("snapshot");
const scoreSummaryEl = document.getElementById("score-summary");
const scoreRegimeEl = document.getElementById("score-regime");
const scorePillEl = document.getElementById("score-pill");
const scoreConfidenceEl = document.getElementById("score-confidence");
const scoreMetaTextEl = document.getElementById("score-meta-text");
const scoreBreakdownEl = document.getElementById("score-breakdown");
const scoreBreakdownToggleEl = document.getElementById("score-breakdown-toggle");
const scoreWarningWrapEl = document.getElementById("score-warning-wrap");
const scoreWarningTitleEl = document.getElementById("score-warning-title");
const scoreWarningsEl = document.getElementById("score-warnings");
const scoreReasonsEl = document.getElementById("score-reasons");
const biteWindowEl = document.getElementById("bite-window-output");
const targetsEl = document.getElementById("targets");
const setupEl = document.getElementById("setup-output");
const fightEl = document.getElementById("fight-output");

const authStatusEl = document.getElementById("auth-status");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const forgotPasswordForm = document.getElementById("forgot-password-form");
const resetPasswordForm = document.getElementById("reset-password-form");
const sessionPanel = document.getElementById("session-panel");
const sessionUserEl = document.getElementById("session-user");
const logoutBtn = document.getElementById("logout-btn");
const authForms = document.getElementById("auth-forms");

const catchForm = document.getElementById("catch-form");
const catchAuthNote = document.getElementById("catch-auth-note");
const catchList = document.getElementById("catch-list");
const catchRigNameEl = document.getElementById("catch-rig-name");
const sessionModeNoteEl = document.getElementById("session-mode-note");
const sessionStartForm = document.getElementById("session-start-form");
const sessionNameInputEl = sessionStartForm?.querySelector('input[name="name"]') || null;
const sessionSpeciesFocusInputEl = sessionStartForm?.querySelector('input[name="speciesFocus"]') || null;
const activeSessionCardEl = document.getElementById("active-session-card");
const activeSessionNameEl = document.getElementById("active-session-name");
const activeSessionMetaEl = document.getElementById("active-session-meta");
const activeSessionSummaryEl = document.getElementById("active-session-summary");
const activeSessionInsightsEl = document.getElementById("active-session-insights");
const refreshSessionBtn = document.getElementById("refresh-session-btn");
const endSessionBtn = document.getElementById("end-session-btn");
const speciesOptionsEl = document.getElementById("species-options");
const speciesInputEl = document.getElementById("species-input");
const analyticsNoteEl = document.getElementById("analytics-note");
const analyticsKpisEl = document.getElementById("analytics-kpis");
const analyticsInsightsEl = document.getElementById("analytics-insights");
const analyticsRefreshBtn = document.getElementById("analytics-refresh-btn");

let speciesSearchTimer = null;
const speciesSearchCache = new Map();
let currentRigRecommendation = null;
let currentFishingSession = null;
let currentIntelligenceSnapshot = null;
let lastSuggestedSessionName = "";
let lastSuggestedSpeciesFocus = "";

function clearListWithMessage(listEl, message) {
  if (!listEl) return;
  listEl.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = message;
  listEl.appendChild(li);
}

function setLocationAssistNote(message, type = "muted") {
  if (!locationAssistNoteEl) return;
  locationAssistNoteEl.textContent = message;
  locationAssistNoteEl.className = type === "warn" ? "status warn" : "muted";
}

function showStatus(message, type) {
  if (!message) {
    statusBannerEl.hidden = true;
    statusBannerEl.textContent = "";
    statusBannerEl.className = "status";
    return;
  }

  statusBannerEl.hidden = false;
  statusBannerEl.textContent = message;
  statusBannerEl.className = `status ${type}`;
}

function showAuthStatus(message, type) {
  if (!message) {
    authStatusEl.hidden = true;
    authStatusEl.textContent = "";
    authStatusEl.className = "status";
    return;
  }

  authStatusEl.hidden = false;
  authStatusEl.textContent = message;
  authStatusEl.className = `status ${type}`;
}

function setButtonBusy(buttonEl, busyLabel) {
  if (!buttonEl) return () => {};

  const originalLabel = buttonEl.textContent;
  buttonEl.disabled = true;
  if (busyLabel) buttonEl.textContent = busyLabel;

  return () => {
    buttonEl.disabled = false;
    buttonEl.textContent = originalLabel;
  };
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function classifyRegime(conditions) {
  if (conditions.weather.pressureTrend === "dropping" && (conditions.weather.windMph || 0) >= 10) {
    return "Pre-storm pressure drop";
  }

  if (conditions.tide.stage === "incoming" && (conditions.weather.windMph || 0) <= 10) {
    return "Incoming tide + low wind";
  }

  if ((conditions.weather.tempF || 0) >= 88) {
    return "Heat stress midday";
  }

  return "Stable mixed regime";
}

function confidenceFor(conditions) {
  const hasWeather = typeof conditions.weather.tempF === "number";
  const needsTide = conditions.spot.waterType !== "freshwater";
  const hasTide = !needsTide || conditions.tide.stage !== "n/a";

  if (hasWeather && hasTide) return "high";
  if (hasWeather) return "medium";
  return "low";
}

function scoreSpecies(species, conditions, accessMode, waterType) {
  let score = 55;
  const reasons = [];
  const tempF = conditions.weather.tempF ?? null;
  const windMph = conditions.weather.windMph ?? null;
  const tideStage = conditions.tide.stage || "n/a";

  if (tempF !== null && tempF >= 65 && tempF <= 82) {
    score += 12;
    reasons.push("Temperature is in an active feeding range");
  } else if (tempF !== null && (tempF < 50 || tempF > 88)) {
    score -= 10;
    reasons.push("Temperature is outside common active feeding range");
  }

  if (windMph !== null && windMph >= 6 && windMph <= 15) {
    score += 8;
    reasons.push("Moderate wind supports workable positioning");
  } else if (windMph !== null && windMph > 25) {
    score -= 12;
    reasons.push("Strong wind reduces consistency and control");
  }

  if (tideStage === "incoming" || tideStage === "outgoing") {
    score += 8;
    reasons.push(`${tideStage} tide can improve movement-based feeding`);
  }

  if (accessMode === "boat" || accessMode === "kayak") {
    score += 4;
    reasons.push(`Mobility from ${accessMode} can improve targeting options`);
  }

  const rigs = waterType === "freshwater"
    ? "Texas rig (weedless) or spinnerbait"
    : "Jighead + paddle tail or popping cork";
  const snagRisk = accessMode === "bank" || accessMode === "bridge" ? "medium" : "low";
  const fightHint = accessMode === "dock" || accessMode === "pier"
    ? "Apply steady side pressure and steer away from structure."
    : "Maintain steady tension and guide fish into open water.";

  return {
    name: species.commonName || species.scientificName || "Unknown Species",
    origin: species.origin || null,
    taxonomyNote: species.taxonomyNote || null,
    score: Math.min(100, score),
    reasons: reasons.slice(0, 3),
    rigs,
    snagRisk,
    fightHint,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function originBadgeClass(originStatus) {
  const value = String(originStatus || "unknown").toLowerCase();
  if (value === "native") return "origin-native";
  if (value === "introduced") return "origin-introduced";
  if (value === "invasive") return "origin-invasive";
  return "origin-unknown";
}

function speciesQueryForWaterType(waterType) {
  if (waterType === "freshwater") return "bass";
  if (waterType === "saltwater") return "snapper";
  return "trout";
}

async function fetchSpeciesSuggestions(query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (normalized.length < 2) return [];
  if (speciesSearchCache.has(normalized)) return speciesSearchCache.get(normalized);

  const response = await fetch(`${API_BASE}/species/search?q=${encodeURIComponent(normalized)}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Species search failed: ${response.status}`);
  }

  const payload = await response.json();
  const list = Array.isArray(payload) ? payload : [];
  speciesSearchCache.set(normalized, list);
  return list;
}

function renderSpeciesDatalist(speciesList) {
  speciesOptionsEl.innerHTML = "";
  speciesList.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.commonName || item.scientificName || "";
    speciesOptionsEl.appendChild(option);
  });
}

function scheduleSpeciesSearch() {
  if (!speciesInputEl) return;

  const value = String(speciesInputEl.value || "").trim();
  if (value.length < 2) return;

  if (speciesSearchTimer) clearTimeout(speciesSearchTimer);
  speciesSearchTimer = setTimeout(async () => {
    try {
      const list = await fetchSpeciesSuggestions(value);
      if (list.length) renderSpeciesDatalist(list.slice(0, 20));
    } catch {
      // Keep existing datalist if search fails.
    }
  }, 280);
}

function fmtIso(value) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toLocaleString();
}

function parseNumericInput(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasValidCoordinateRange(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function getCoordinateValidationMessage(input) {
  if (!Number.isFinite(input?.lat) || !Number.isFinite(input?.lng)) {
    return "Enter latitude and longitude before FishDex can estimate local conditions.";
  }

  if (!hasValidCoordinateRange(input.lat, input.lng)) {
    return "Latitude must be between -90 and 90, and longitude must be between -180 and 180.";
  }

  return null;
}

function hasValidCoordinates(input) {
  return getCoordinateValidationMessage(input) === null;
}

function locationBasisLabel(conditions) {
  const lat = Number(conditions?.spot?.lat);
  const lng = Number(conditions?.spot?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "No coordinates entered";
  }

  const spotName = String(conditions?.spot?.name || "").trim();
  return `Using form coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}${spotName ? ` near ${spotName}` : ""}`;
}

function renderLocationRequiredState(message = "Enter latitude and longitude before FishDex can estimate local conditions.") {
  showStatus(message, "warn");
  snapshotEl.innerHTML = "";
  scoreRegimeEl.textContent = "Location required";
  scorePillEl.textContent = "Score --";
  scorePillEl.className = "score-pill score-mixed";
  scoreConfidenceEl.textContent = "LOW";
  scoreConfidenceEl.className = "confidence-badge conf-low";
  scoreMetaTextEl.textContent = "Location required before environmental scoring can run.";
  scoreSummaryEl.textContent = "FishDex needs user-entered coordinates before it can estimate local conditions.";
  scoreWarningWrapEl.hidden = true;
  scoreWarningsEl.innerHTML = "";
  scoreReasonsEl.innerHTML = "<li>Latitude and longitude are required for live local estimates.</li>";
  scoreBreakdownEl.innerHTML = "<li>Enter coordinates first.</li>";
  biteWindowEl.innerHTML = '<p class="muted">Enter coordinates to generate a bite window outlook.</p>';
  clearListWithMessage(targetsEl, "No targets generated until a location is entered.");
  setupEl.textContent = "Setup recommendation pending location.";
  fightEl.textContent = "Fight guidance pending location.";
  currentRigRecommendation = null;
  currentIntelligenceSnapshot = null;
}

function renderSnapshot(conditions, regime, confidence, modeLabel) {
  snapshotEl.innerHTML = "";

  const items = [
    ["Mode", modeLabel],
    ["Spot", conditions.spot.name],
    ["Location basis", locationBasisLabel(conditions)],
    ["Coordinates", `${Number(conditions.spot.lat).toFixed(4)}, ${Number(conditions.spot.lng).toFixed(4)}`],
    ["Water type", conditions.spot.waterType || "n/a"],
    ["Tide station", conditions.spot.tideStationId || "n/a"],
    ["Regime", regime],
    ["Confidence", confidence],
    ["Observed", fmtIso(conditions.observedAt)],
    ["Temp", `${conditions.weather.tempF ?? "n/a"} F`],
    ["Wind", `${conditions.weather.windMph ?? "n/a"} mph`],
    ["Pressure", conditions.weather.pressureTrend || "n/a"],
    ["Tide stage", conditions.tide.stage],
    ["Weather src", `${conditions.sources.weather.provider} @ ${fmtIso(conditions.sources.weather.fetchedAt)}`],
    ["Tide src", `${conditions.sources.tides.provider} @ ${fmtIso(conditions.sources.tides.fetchedAt)}`],
    ["Alerts src", `${conditions.sources.alerts.provider} @ ${fmtIso(conditions.sources.alerts.fetchedAt)}`],
  ];

  items.forEach(([k, v]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${k}</span><strong>${v}</strong>`;
    snapshotEl.appendChild(li);
  });
}

function activityClass(level) {
  if (level === "high") return "activity-high";
  if (level === "moderate") return "activity-moderate";
  return "activity-low";
}

function renderBiteWindow(outlook, modeLabel) {
  if (!biteWindowEl) return;

  if (!outlook) {
    biteWindowEl.innerHTML = `<p class="muted">Bite window outlook unavailable in ${modeLabel}.</p>`;
    return;
  }

  const reasons = outlook.explanation?.baseReasons || [];
  const warnings = outlook.explanation?.warnings || [];
  const currentWindow = outlook.currentWindow;
  const nextWindow = outlook.nextWindow;

  biteWindowEl.innerHTML = `
    <div class="activity-strip">
      <span class="activity-pill ${activityClass(outlook.activityLevel)}">${String(outlook.activityLevel || "low").toUpperCase()}</span>
      <strong>Activity Score ${outlook.activityScore ?? 0}</strong>
    </div>
    <p><strong>Current window:</strong> ${currentWindow ? `${currentWindow.start} - ${currentWindow.end} (${currentWindow.type})` : "No major active window detected"}</p>
    <p><strong>Next window:</strong> ${nextWindow ? `${nextWindow.start} - ${nextWindow.end} (${nextWindow.type})` : "No upcoming window detected"}</p>
    <p><strong>Why:</strong> ${reasons.join(" ") || "No bite-window explanation returned."}</p>
    ${warnings.length ? `<p><strong>Warnings:</strong> ${warnings.join(" ")}</p>` : ""}
  `;
}

function renderTargets(results, confidence, accessMode, alerts) {
  targetsEl.innerHTML = "";

  if (alerts.length) {
    const alertLi = document.createElement("li");
    alertLi.innerHTML = `<div class="item-sub"><strong>Safety alert:</strong> ${alerts[0].headline} (${alerts[0].severity})</div>`;
    targetsEl.appendChild(alertLi);
  }

  if (!results.length) {
    const li = document.createElement("li");
    li.textContent = "No targets found for this context.";
    targetsEl.appendChild(li);
    return;
  }

  results
    .sort((a, b) => b.score - a.score)
    .forEach((item) => {
      const li = document.createElement("li");
      const origin = item.origin || null;
      const taxonomyNoteHtml = item.taxonomyNote
        ? `<div class="item-sub">Taxonomy note: ${escapeHtml(item.taxonomyNote)}</div>`
        : "";
      const originHtml = origin
        ? `
        <div class="item-sub item-origin-row">
          <span class="badge ${originBadgeClass(origin.status)}">${escapeHtml(origin.label || "Unknown")}</span>
          <span>${escapeHtml(origin.explanation?.[0] || "Origin metadata unavailable.")}</span>
        </div>
      `
        : "";

      li.innerHTML = `
        <div class="item-top">
          <strong>${item.name}</strong>
          <span class="badge">Score ${item.score}</span>
        </div>
        ${originHtml}
        ${taxonomyNoteHtml}
        <div class="item-sub">Confidence: ${confidence}</div>
        <div class="item-sub">Access tactic: Work structure edges from ${accessMode}.</div>
        <div class="item-sub">Why: ${item.reasons.slice(0, 3).join("; ")}</div>
      `;
      targetsEl.appendChild(li);
    });
}

function renderSetup(top) {
  if (!top) {
    setupEl.textContent = "No setup recommendation available.";
    currentRigRecommendation = null;
    return;
  }

  if (top.rod && top.line && top.leader) {
    currentRigRecommendation = top;
    if (catchRigNameEl && !String(catchRigNameEl.value || "").trim()) {
      catchRigNameEl.value = top.rigName || "";
    }
    const modifier = top.explanation?.modifiers?.[0] || null;
    const evidence = modifier?.evidence || null;
    const impactLabel = modifier?.impact
      ? modifier.impact.replace(/_/g, " ")
      : "";
    const personalizationText = modifier?.reason
      ? `
        <p><strong>Personalization:</strong> ${modifier.reason}</p>
        <p><strong>Modifier type:</strong> ${impactLabel || "supporting signal"}</p>
        <p><strong>Confidence:</strong> ${modifier.confidence || "unknown"}</p>
        ${evidence?.preferredRig ? `<p><strong>Preferred rig:</strong> ${evidence.preferredRig}</p>` : ""}
        ${typeof evidence?.sampleSize === "number" ? `<p><strong>Sample size:</strong> ${evidence.sampleSize}</p>` : ""}
        ${typeof evidence?.landingRateGap === "number" ? `<p><strong>Landing rate gap:</strong> ${Math.round(evidence.landingRateGap * 100)} percentage points</p>` : ""}
      `
      : "";
    setupEl.innerHTML = `
      <p><strong>Primary:</strong> ${top.rigName}</p>
      <p><strong>Rod:</strong> ${top.rod.power}, ${top.rod.length}, ${top.rod.action}</p>
      <p><strong>Main line:</strong> ${top.line.type} ${top.line.strengthLb} lb</p>
      <p><strong>Leader:</strong> ${top.leader.type} ${top.leader.strengthLb} lb, ${top.leader.lengthIn} in</p>
      <p><strong>Snag risk:</strong> ${top.snagRisk}</p>
      <p><strong>Why:</strong> ${(top.reasons || []).join("; ") || "No reasons returned"}</p>
      ${personalizationText}
    `;
    return;
  }

  currentRigRecommendation = null;
  setupEl.innerHTML = `
    <p><strong>Primary:</strong> ${top.rigs}</p>
    <p><strong>Rod:</strong> Medium-heavy fast action (7'0"-7'3")</p>
    <p><strong>Main line:</strong> 20 lb braid + 15 lb fluoro leader</p>
    <p><strong>Snag risk:</strong> ${top.snagRisk}</p>
    <p><strong>Mitigation:</strong> Use weedless options around timber/grass and avoid long bottom drags in unknown structure.</p>
  `;
}

function renderFight(top, accessMode) {
  if (!top) {
    fightEl.textContent = "No fight guidance available.";
    return;
  }

  if (top.pressurePlan && top.dragGuidance) {
    fightEl.innerHTML = `
      <p><strong>Pressure plan:</strong> ${top.pressurePlan}</p>
      <p><strong>Drag guidance:</strong> ${top.dragGuidance}</p>
      <p><strong>Landing tips:</strong> ${(top.landingTips || []).join("; ") || "No tips returned"}</p>
      <p><strong>Risk factors:</strong> ${(top.riskFactors || []).join("; ") || "No major risks flagged"}</p>
      <p><strong>Why:</strong> ${(top.reasons || []).join("; ") || "No reasons returned"}</p>
    `;
    return;
  }

  fightEl.innerHTML = `
    <p><strong>Pressure plan:</strong> ${top.fightHint}</p>
    <p><strong>Drag note:</strong> Smooth drag. Increase only if fish is heading into cover.</p>
    <p><strong>${accessMode} landing tip:</strong> Plan a landing angle before the fish reaches you; avoid high-stick rod lifts.</p>
  `;
}

function renderFishingSession(summary, isLoggedIn) {
  if (!sessionModeNoteEl || !sessionStartForm || !activeSessionCardEl) return;

  if (refreshSessionBtn) refreshSessionBtn.hidden = true;
  if (endSessionBtn) endSessionBtn.hidden = true;
  activeSessionNameEl.textContent = "";
  activeSessionMetaEl.textContent = "";
  activeSessionSummaryEl.innerHTML = "";
  activeSessionInsightsEl.innerHTML = "";

  if (!isLoggedIn) {
    sessionModeNoteEl.hidden = false;
    sessionModeNoteEl.textContent = "Login to start a fishing session.";
    sessionStartForm.hidden = true;
    activeSessionCardEl.hidden = true;
    currentFishingSession = null;
    return;
  }

  if (!summary) {
    sessionModeNoteEl.hidden = false;
    sessionModeNoteEl.textContent = "No active fishing session. Start one to attach catches to the outing.";
    sessionStartForm.hidden = false;
    activeSessionCardEl.hidden = true;
    currentFishingSession = null;
    syncSessionStartDefaults();
    return;
  }

  currentFishingSession = summary;
  sessionModeNoteEl.hidden = true;
  sessionStartForm.hidden = true;
  activeSessionCardEl.hidden = false;
  if (refreshSessionBtn) refreshSessionBtn.hidden = false;
  if (endSessionBtn) endSessionBtn.hidden = false;
  activeSessionNameEl.textContent = summary.name || "Active Session";
  activeSessionMetaEl.textContent = `${summary.locationLabel || "Unknown location"} | ${summary.sessionDuration || "n/a"} | ${summary.status || "active"}`;

  const summaryItems = [
    ["Species Focus", summary.speciesFocus || "n/a"],
    ["Catches", summary.catches ?? 0],
    ["Top Species", summary.topSpecies || "n/a"],
    ["Top Rig", summary.topRig || "n/a"],
    ["Activity At Start", summary.activityLevelAtStart || "n/a"],
    ["Start Bite Score", summary.biteWindowStrength ?? "n/a"],
    ["Last Catch", fmtIso(summary.lastCatchAt)],
  ];

  if (currentIntelligenceSnapshot) {
    summaryItems.push(["Current Activity", currentIntelligenceSnapshot.activityLevel || "n/a"]);
    summaryItems.push(["Current Bite Score", currentIntelligenceSnapshot.biteWindowStrength ?? "n/a"]);
    summaryItems.push(["Current Window", currentIntelligenceSnapshot.currentWindowLabel || "n/a"]);
    summaryItems.push(["Next Window", currentIntelligenceSnapshot.nextWindowLabel || "n/a"]);
    summaryItems.push(["Recommended Species", currentIntelligenceSnapshot.recommendedSpecies || "n/a"]);
    summaryItems.push(["Recommended Rig", currentIntelligenceSnapshot.recommendedRig || "n/a"]);
    summaryItems.push(["Current Regime", currentIntelligenceSnapshot.regime || "n/a"]);
    summaryItems.push(["Current Conditions", currentIntelligenceSnapshot.conditionsLabel || "n/a"]);
  }

  summaryItems.forEach(([label, value]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    activeSessionSummaryEl.appendChild(li);
  });

  const insightLines = Array.isArray(summary.insights) ? [...summary.insights] : [];
  const explanationWarnings = Array.isArray(summary.explanation?.warnings) ? summary.explanation.warnings : [];
  const explanationBaseReasons = Array.isArray(summary.explanation?.baseReasons) ? summary.explanation.baseReasons : [];

  explanationWarnings.forEach((warning) => {
    insightLines.push(`Warning: ${warning}`);
  });

  explanationBaseReasons.forEach((reason) => {
    insightLines.push(reason);
  });

  const uniqueInsights = [...new Set(insightLines.map((line) => String(line || "").trim()).filter(Boolean))];

  if (!uniqueInsights.length) {
    const li = document.createElement("li");
    li.textContent = "No session insights available yet.";
    activeSessionInsightsEl.appendChild(li);
    return;
  }

  uniqueInsights.forEach((insight) => {
    const li = document.createElement("li");
    li.textContent = insight;
    activeSessionInsightsEl.appendChild(li);
  });
}

function buildActiveSessionFallbackSummary(session) {
  if (!session) return null;

  return {
    sessionId: session.id,
    name: session.name || "Active Session",
    locationLabel: session.location_label || null,
    speciesFocus: session.species_focus || null,
    status: session.status || "active",
    startedAt: session.started_at || null,
    endedAt: session.ended_at || null,
    sessionDuration: session.started_at ? "Active now" : "n/a",
    catches: null,
    topSpecies: null,
    topRig: null,
    lastCatchAt: null,
    activityLevelAtStart: session.activity_level_at_start || null,
    biteWindowStrength: session.bite_window_score_start ?? null,
    explanation: {
      baseReasons: [
        "FishDex kept the active outing visible while the detailed session summary refresh was unavailable.",
      ],
      warnings: [
        "Detailed session summary could not be refreshed just now.",
      ],
      modifiers: [],
      metadata: {
        sessionStatus: session.status || "active",
        sessionStartedAt: session.started_at || null,
        fallback: true,
      },
    },
    insights: [
      "Active session is still in progress.",
      "Refresh again to load the latest session rollups.",
    ],
  };
}

function buildSessionDefaultName() {
  const context = parseContext();
  const species = currentIntelligenceSnapshot?.recommendedSpecies || sessionSpeciesFocusInputEl?.value || "Fishing";
  const spot = context.spot || "Spot";
  return `${species} at ${spot}`;
}

function shouldOverwriteSuggestedValue(inputEl, lastSuggestedValue) {
  if (!inputEl) return false;

  const currentValue = String(inputEl.value || "").trim();
  if (!currentValue) return true;

  return currentValue === String(lastSuggestedValue || "").trim();
}

function syncSessionStartDefaults() {
  if (currentFishingSession || !sessionStartForm) return;

  const nextSuggestedName = buildSessionDefaultName();
  const nextSuggestedSpeciesFocus = currentIntelligenceSnapshot?.recommendedSpecies || "";

  if (sessionNameInputEl && shouldOverwriteSuggestedValue(sessionNameInputEl, lastSuggestedSessionName)) {
    sessionNameInputEl.value = nextSuggestedName;
  }

  if (
    sessionSpeciesFocusInputEl &&
    shouldOverwriteSuggestedValue(sessionSpeciesFocusInputEl, lastSuggestedSpeciesFocus)
  ) {
    sessionSpeciesFocusInputEl.value = nextSuggestedSpeciesFocus;
  }

  lastSuggestedSessionName = nextSuggestedName;
  lastSuggestedSpeciesFocus = nextSuggestedSpeciesFocus;
}

function parseContext() {
  const form = new FormData(contextForm);
  const waterType = String(form.get("waterType"));

  return {
    spot: String(form.get("spot")).trim(),
    waterType,
    accessMode: String(form.get("accessMode")),
    lat: parseNumericInput(form.get("lat")),
    lng: parseNumericInput(form.get("lng")),
    tideStationId: waterType === "freshwater" ? "" : String(form.get("tideStationId")).trim(),
    liveMode: String(form.get("liveMode")),
    tempF: parseNumericInput(form.get("tempF")),
    windMph: parseNumericInput(form.get("windMph")),
    pressureTrend: String(form.get("pressureTrend")),
    tideStage: String(form.get("tideStage")),
  };
}

function updateLocationAssistForContext() {
  const input = parseContext();
  const coordinateValidationMessage = getCoordinateValidationMessage(input);
  if (coordinateValidationMessage) {
    if (Number.isFinite(input?.lat) || Number.isFinite(input?.lng)) {
      setLocationAssistNote(coordinateValidationMessage, "warn");
      return;
    }

    setLocationAssistNote("Use current device location anywhere in the country, or enter a custom spot manually.");
    return;
  }

  const tideNote = input.waterType === "freshwater"
    ? "Freshwater mode does not require a NOAA tide station."
    : `Review the NOAA tide station so it matches the same water system as ${String(input.spot || "your coordinates").trim()}.`;

  setLocationAssistNote(`Using ${input.lat.toFixed(4)}, ${input.lng.toFixed(4)} as the location basis. ${tideNote}`);
}

function suggestSpotNameFromCoordinates(lat, lng) {
  return `Current location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

function updateTideStationVisibility() {
  const isFresh = waterTypeEl.value === "freshwater";
  tideStationWrapEl.style.display = isFresh ? "none" : "block";
}

async function getLiveConditions(input) {
  const params = new URLSearchParams({
    lat: String(input.lat),
    lng: String(input.lng),
    waterType: input.waterType,
  });

  if (input.tideStationId) params.set("tideStationId", input.tideStationId);
  if (input.spot) params.set("spotName", input.spot);
  if (input.pressureTrend) params.set("pressureTrend", input.pressureTrend);

  const response = await fetch(`${API_BASE}/conditions?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(payload?.error || `Server conditions failed: ${response.status}`);
  }

  return response.json();
}

async function getConditionsScore(conditions, input) {
  const response = await fetch(`${API_BASE}/score/conditions`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      weather: {
        tempF: conditions.weather?.tempF ?? null,
        windMph: conditions.weather?.windMph ?? null,
        precipitation: conditions.weather?.precipitation ?? null,
        cloudCover: conditions.weather?.cloudCover ?? null,
      },
      tide: {
        stage: conditions.tide?.stage || "n/a",
      },
      accessMode: input.accessMode,
      waterType: input.waterType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Score endpoint failed: ${response.status}`);
  }

  return response.json();
}

async function getRigRecommendation(input, conditions, topTargetName) {
  const response = await fetch(`${API_BASE}/rig/recommend`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      waterType: input.waterType,
      accessMode: input.accessMode,
      targetSpecies: topTargetName || null,
      conditions: {
        weather: {
          tempF: conditions.weather?.tempF ?? null,
          windMph: conditions.weather?.windMph ?? null,
        },
        tide: {
          stage: conditions.tide?.stage || "n/a",
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Rig endpoint failed: ${response.status}`);
  }

  return response.json();
}

async function getFightStrategy(input, conditions, rigPayload, topTargetName) {
  const response = await fetch(`${API_BASE}/fight/strategy`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      waterType: input.waterType,
      accessMode: input.accessMode,
      targetSpecies: topTargetName || null,
      rig: {
        lineStrengthLb: rigPayload?.line?.strengthLb ?? null,
        leaderStrengthLb: rigPayload?.leader?.strengthLb ?? null,
      },
      conditions: {
        weather: {
          windMph: conditions.weather?.windMph ?? null,
        },
        tide: {
          stage: conditions.tide?.stage || "n/a",
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Fight endpoint failed: ${response.status}`);
  }

  return response.json();
}

function scoreBand(score) {
  if (score >= 80) return { className: "score-excellent", label: "Excellent" };
  if (score >= 60) return { className: "score-good", label: "Good" };
  if (score >= 40) return { className: "score-mixed", label: "Mixed" };
  if (score >= 20) return { className: "score-poor", label: "Poor" };
  return { className: "score-very-poor", label: "Very Poor" };
}

function confidenceClass(confidence) {
  const value = String(confidence || "low").toLowerCase();
  if (value === "high") return "conf-high";
  if (value === "medium") return "conf-medium";
  return "conf-low";
}

function renderScore(scorePayload) {
  if (!scorePayload) {
    scoreRegimeEl.textContent = "Regime unavailable";
    scorePillEl.textContent = "Score --";
    scorePillEl.className = "score-pill score-mixed";
    scoreConfidenceEl.textContent = "LOW";
    scoreConfidenceEl.className = "confidence-badge conf-low";
    scoreMetaTextEl.textContent = "Scoring metadata unavailable.";
    scoreSummaryEl.textContent = "Score explanation unavailable.";
    scoreBreakdownEl.innerHTML = "<li><span>Breakdown</span><strong>n/a</strong></li>";
    scoreWarningWrapEl.hidden = true;
    if (scoreWarningTitleEl) scoreWarningTitleEl.textContent = "Environmental Warnings";
    scoreWarningsEl.innerHTML = "";
    scoreReasonsEl.innerHTML = "<li>Scoring service unavailable for this refresh.</li>";
    return;
  }

  const band = scoreBand(Number(scorePayload.score) || 0);
  scoreRegimeEl.textContent = scorePayload.regimeLabel || "Regime unavailable";
  scorePillEl.textContent = `Score ${scorePayload.score} - ${band.label}`;
  scorePillEl.className = `score-pill ${band.className}`;
  scoreConfidenceEl.textContent = String(scorePayload.confidence || "low").toUpperCase();
  scoreConfidenceEl.className = `confidence-badge ${confidenceClass(scorePayload.confidence)}`;
  scoreMetaTextEl.textContent = `Model: ${scorePayload.scoreVersion || "n/a"} | Rules: ${scorePayload.ruleSet || "n/a"} | Generated: ${fmtIso(scorePayload.generatedAt)}`;
  scoreSummaryEl.textContent = `Overall ${band.label.toLowerCase()} conditions based on weather, tide, water type, and access context.`;
  scoreSummaryEl.className = "status";
  scoreBreakdownEl.innerHTML = "";
  scoreWarningsEl.innerHTML = "";
  scoreReasonsEl.innerHTML = "";

  const breakdown = scorePayload.breakdown || {};
  const breakdownItems = [
    ["Base", breakdown.base],
    ["Temp", breakdown.temperature],
    ["Wind", breakdown.wind],
    ["Precip", breakdown.precipitation],
    ["Tide", breakdown.tide],
    ["Raw Total", breakdown.totalRaw],
    ["Clamped", breakdown.totalClamped],
  ];

  breakdownItems.forEach(([label, value]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${label}</span><strong>${value ?? "n/a"}</strong>`;
    scoreBreakdownEl.appendChild(li);
  });

  const warnings = Array.isArray(scorePayload.warnings) ? scorePayload.warnings : [];
  if (warnings.length) {
    scoreWarningWrapEl.hidden = false;
    if (scoreWarningTitleEl) scoreWarningTitleEl.textContent = `Environmental Warnings (${warnings.length})`;
    warnings.forEach((warning) => {
      const li = document.createElement("li");
      li.textContent = warning;
      scoreWarningsEl.appendChild(li);
    });
  } else {
    scoreWarningWrapEl.hidden = true;
    if (scoreWarningTitleEl) scoreWarningTitleEl.textContent = "Environmental Warnings";
  }

  const reasons = Array.isArray(scorePayload.reasons) ? scorePayload.reasons : [];
  if (!reasons.length) {
    scoreReasonsEl.innerHTML = "<li>No scoring reasons returned.</li>";
    return;
  }

  reasons.forEach((reason) => {
    const li = document.createElement("li");
    li.textContent = reason;
    scoreReasonsEl.appendChild(li);
  });
}

async function refreshIntelligence() {
  const input = parseContext();
  const coordinateValidationMessage = getCoordinateValidationMessage(input);

  if (coordinateValidationMessage) {
    renderLocationRequiredState(coordinateValidationMessage);
    if (!currentFishingSession) syncSessionStartDefaults();
    return;
  }

  let conditions;
  let modeLabel = "manual";

  if (input.liveMode === "on") {
    try {
      conditions = await getLiveConditions(input);
      modeLabel = "live";
      showStatus("Live provider fetch succeeded.", "ok");
    } catch (error) {
      conditions = window.FishDexNormalize.normalizeManual(input);
      modeLabel = "manual fallback";
      showStatus(`Live fetch failed, fallback to manual mode: ${error.message}`, "warn");
    }
  } else {
    conditions = window.FishDexNormalize.normalizeManual(input);
    showStatus("Manual mode active.", "ok");
  }

  const regime = classifyRegime(conditions);
  const confidence = confidenceFor(conditions);
  renderBiteWindow(conditions.biteWindow || null, modeLabel);

  let speciesList = [];
  try {
    const query = speciesQueryForWaterType(input.waterType);
    speciesList = await fetchSpeciesSuggestions(query);
  } catch {
    speciesList = fallbackSpecies.map((name, index) => ({
      id: `fallback-${index}`,
      commonName: name,
      scientificName: null,
      imageUrl: null,
      source: "fallback",
    }));
  }

  renderSpeciesDatalist(speciesList.slice(0, 20));

  const targets = speciesList
    .slice(0, 8)
    .map((species) => scoreSpecies(species, conditions, input.accessMode, input.waterType))
    .filter((item) => item.score >= 55);

  renderSnapshot(conditions, regime, confidence, modeLabel);
  renderTargets(targets, confidence, input.accessMode, conditions.alerts || []);

  const topTargetName = targets[0]?.name || null;
  let rigPayload = null;
  let fightPayload = null;

  try {
    rigPayload = await getRigRecommendation(input, conditions, topTargetName);
  } catch {
    rigPayload = null;
  }

  try {
    fightPayload = await getFightStrategy(input, conditions, rigPayload, topTargetName);
  } catch {
    fightPayload = null;
  }

  renderSetup(rigPayload || targets[0]);
  renderFight(fightPayload || targets[0], input.accessMode);

  currentIntelligenceSnapshot = {
    activityLevel: conditions.biteWindow?.activityLevel || null,
    biteWindowStrength: conditions.biteWindow?.activityScore ?? null,
    currentWindowLabel: conditions.biteWindow?.currentWindow
      ? `${conditions.biteWindow.currentWindow.start} - ${conditions.biteWindow.currentWindow.end} (${conditions.biteWindow.currentWindow.type})`
      : "No major active window",
    nextWindowLabel: conditions.biteWindow?.nextWindow
      ? `${conditions.biteWindow.nextWindow.start} - ${conditions.biteWindow.nextWindow.end} (${conditions.biteWindow.nextWindow.type})`
      : "No upcoming window",
    recommendedSpecies: topTargetName,
    recommendedRig: rigPayload?.rigName || null,
    regime,
    conditionsLabel: `${conditions.weather?.tempF ?? "n/a"} F, ${conditions.weather?.windMph ?? "n/a"} mph wind, tide ${conditions.tide?.stage || "n/a"}`,
  };

  if (currentFishingSession) {
    renderFishingSession(currentFishingSession, true);
  } else {
    syncSessionStartDefaults();
  }

  try {
    const scorePayload = await getConditionsScore(conditions, input);
    renderScore(scorePayload);
  } catch {
    renderScore(null);
  }
}

function renderCatches(items) {
  catchList.innerHTML = "";

  if (!items.length) {
    catchList.innerHTML = "<li>No catches logged yet.</li>";
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-top">
        <strong>${item.species}</strong>
        <span>${item.weight_lb ?? "n/a"} lb</span>
      </div>
      <div class="item-sub">${item.bait || "No bait entered"}</div>
      <div class="item-sub">Rig: ${item.rig_name || "Not logged"}</div>
      <div class="item-sub">Bait family: ${item.bait_family || "Not logged"}</div>
      <div class="item-sub">Session: ${item.session_id || "None"}</div>
      <div class="item-sub">Landed: ${item.landed ? "yes" : "no"}</div>
    `;
    catchList.appendChild(li);
  });
}

function renderAnalytics(summary, isLoggedIn) {
  analyticsKpisEl.innerHTML = "";
  analyticsInsightsEl.innerHTML = "";

  if (!isLoggedIn) {
    analyticsNoteEl.textContent = "Login to view your catch analytics.";
    analyticsKpisEl.hidden = true;
    analyticsInsightsEl.hidden = true;
    if (analyticsRefreshBtn) analyticsRefreshBtn.hidden = true;
    return;
  }

  if (!summary) {
    analyticsNoteEl.textContent = "Analytics unavailable right now.";
    analyticsKpisEl.hidden = true;
    analyticsInsightsEl.hidden = true;
    if (analyticsRefreshBtn) analyticsRefreshBtn.hidden = false;
    return;
  }

  analyticsNoteEl.textContent = "Summary from your logged catches.";
  analyticsKpisEl.hidden = false;
  analyticsInsightsEl.hidden = false;
  if (analyticsRefreshBtn) analyticsRefreshBtn.hidden = false;

  const topSpecies = summary.topSpecies?.[0]?.species || "n/a";
  const topRig = summary.topRigs?.[0]?.rigName || "n/a";
  const landingRatePct = `${Math.round((summary.landingRate || 0) * 100)}%`;
  const kpis = [
    ["Total Catches", summary.totalCatches ?? 0],
    ["Landing Rate", landingRatePct],
    ["Top Species", topSpecies],
    ["Top Rig", topRig],
  ];

  kpis.forEach(([label, value]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    analyticsKpisEl.appendChild(li);
  });

  const insights = Array.isArray(summary.insights) ? summary.insights : [];
  if (!insights.length) {
    const li = document.createElement("li");
    li.textContent = "No insights available yet.";
    analyticsInsightsEl.appendChild(li);
    return;
  }

  insights.slice(0, 3).forEach((insight) => {
    const li = document.createElement("li");
    li.textContent = insight;
    analyticsInsightsEl.appendChild(li);
  });
}

async function refreshAnalytics() {
  if (!currentUser) {
    renderAnalytics(null, false);
    return;
  }

  try {
    const analyticsSummary = await api("/analytics/catches/summary", { method: "GET" });
    renderAnalytics(analyticsSummary, true);
  } catch {
    renderAnalytics(null, true);
  }
}

async function refreshFishingSession() {
  if (!currentUser) {
    renderFishingSession(null, false);
    return;
  }

  try {
    const payload = await api("/sessions/active", { method: "GET" });
    const session = payload.session || null;

    if (!session) {
      renderFishingSession(null, true);
      return;
    }

    try {
      const summary = await api(`/sessions/${session.id}`, { method: "GET" });
      renderFishingSession(summary, true);
    } catch {
      renderFishingSession(buildActiveSessionFallbackSummary(session), true);
      showAuthStatus("Active session found, but the detailed session summary could not be refreshed.", "warn");
    }
  } catch {
    if (currentFishingSession) {
      renderFishingSession(currentFishingSession, true);
      showAuthStatus("Session refresh failed. Showing the last known active session state.", "warn");
      return;
    }

    renderFishingSession(null, true);
    showAuthStatus("Session refresh failed.", "warn");
  }
}

async function refreshSession() {
  try {
    const payload = await api("/auth/me", { method: "GET" });
    currentUser = payload.user;
    authForms.hidden = true;
    sessionPanel.hidden = false;
    catchForm.hidden = false;
    catchAuthNote.hidden = true;
    sessionUserEl.textContent = `Signed in as ${currentUser.email}`;
    showAuthStatus("Session active.", "ok");
    const items = await api("/catches", { method: "GET" });
    renderCatches(items);

    await refreshAnalytics();
    await refreshFishingSession();
  } catch {
    currentUser = null;
    authForms.hidden = false;
    sessionPanel.hidden = true;
    catchForm.hidden = true;
    catchAuthNote.hidden = false;
    renderCatches([]);
    renderAnalytics(null, false);
    renderFishingSession(null, false);
    showAuthStatus("Not logged in.", "warn");
  }
}

async function onAuthSubmit(event, route) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const formData = new FormData(formEl);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    await api(route, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    formEl.reset();
    await refreshSession();
    showAuthStatus(route === "/auth/register" ? "Account created and signed in." : "Login successful.", "ok");
  } catch (error) {
    showAuthStatus(error.message, "warn");
  }
}

if (registerForm) registerForm.addEventListener("submit", (event) => onAuthSubmit(event, "/auth/register"));
if (loginForm) loginForm.addEventListener("submit", (event) => onAuthSubmit(event, "/auth/login"));

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const email = String(formData.get("email") || "").trim();

    try {
      const payload = await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      formEl.reset();
      const previewSuffix = payload.previewToken ? ` Reset token preview: ${payload.previewToken}` : "";
      showAuthStatus(`${payload.message || "Password reset requested."}${previewSuffix}`, "ok");
    } catch (error) {
      showAuthStatus(error.message, "warn");
    }
  });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const token = String(formData.get("token") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      formEl.reset();
      showAuthStatus("Password updated. You can now log in with the new password.", "ok");
    } catch (error) {
      showAuthStatus(error.message, "warn");
    }
  });
}

if (useMyLocationBtn) {
  useMyLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      setLocationAssistNote("This browser does not support device geolocation. Enter coordinates manually.", "warn");
      return;
    }

    const restoreButton = setButtonBusy(useMyLocationBtn, "Locating...");
    setLocationAssistNote("Requesting your current location from the browser...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);

        if (latInputEl) latInputEl.value = lat.toFixed(6);
        if (lngInputEl) lngInputEl.value = lng.toFixed(6);
        if (spotInputEl && !String(spotInputEl.value || "").trim()) {
          spotInputEl.value = suggestSpotNameFromCoordinates(lat, lng);
        }

        updateLocationAssistForContext();
        syncSessionStartDefaults();
        showStatus("Current location applied. Review water type and tide station before refreshing intelligence.", "ok");
        restoreButton();
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? "Location permission was denied. Enter coordinates manually if you prefer."
          : "Unable to read your current location. Enter coordinates manually or try again.";
        setLocationAssistNote(message, "warn");
        restoreButton();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}

logoutBtn.addEventListener("click", async () => {
  try {
    await api("/auth/logout", { method: "POST" });
  } finally {
    await refreshSession();
  }
});

contextForm.addEventListener("submit", (event) => {
  event.preventDefault();
  refreshIntelligence();
});

catchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    showAuthStatus("Please login first.", "warn");
    return;
  }

  const form = new FormData(catchForm);
  const payload = {
    clientCatchId: crypto.randomUUID(),
    species: String(form.get("species") || "").trim(),
    weightLb: form.get("weight") ? Number(form.get("weight")) : null,
    bait: String(form.get("bait") || "").trim(),
    rigName: String(form.get("rigName") || "").trim() || currentRigRecommendation?.rigName || null,
    baitFamily: String(form.get("baitFamily") || "").trim() || null,
    landed: String(form.get("landed")) === "true",
  };

  try {
    await api("/catches", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    catchForm.reset();
    const items = await api("/catches", { method: "GET" });
    renderCatches(items);
    await refreshAnalytics();
    await refreshFishingSession();
  } catch (error) {
    showAuthStatus(error.message, "warn");
  }
});

if (sessionStartForm) {
  sessionStartForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      showAuthStatus("Please login first.", "warn");
      return;
    }

    const form = new FormData(sessionStartForm);
    const context = parseContext();
    const submitBtn = sessionStartForm.querySelector('button[type="submit"]');
    const payload = {
      name: String(form.get("name") || "").trim(),
      locationLabel: context.spot || null,
      speciesFocus: String(form.get("speciesFocus") || "").trim() || null,
      activityLevelAtStart: currentIntelligenceSnapshot?.activityLevel || null,
      biteWindowStrength: currentIntelligenceSnapshot?.biteWindowStrength ?? null,
    };

    const restoreButton = setButtonBusy(submitBtn, "Starting...");

    try {
      await api("/sessions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      sessionStartForm.reset();
      syncSessionStartDefaults();
      await refreshFishingSession();
    } catch (error) {
      showAuthStatus(error.message, "warn");
    } finally {
      restoreButton();
    }
  });
}

if (sessionSpeciesFocusInputEl) {
  sessionSpeciesFocusInputEl.addEventListener("input", syncSessionStartDefaults);
}

if (endSessionBtn) {
  endSessionBtn.addEventListener("click", async () => {
    if (!currentFishingSession?.sessionId) return;

    const restoreButton = setButtonBusy(endSessionBtn, "Ending...");

    try {
      await api(`/sessions/${currentFishingSession.sessionId}/end`, {
        method: "POST",
      });
      await refreshFishingSession();
    } catch (error) {
      showAuthStatus(error.message, "warn");
    } finally {
      restoreButton();
    }
  });
}

if (refreshSessionBtn) {
  refreshSessionBtn.addEventListener("click", async () => {
    const restoreButton = setButtonBusy(refreshSessionBtn, "Refreshing...");

    try {
      await refreshIntelligence();
      await refreshFishingSession();
    } finally {
      restoreButton();
    }
  });
}

waterTypeEl.addEventListener("change", updateTideStationVisibility);
waterTypeEl.addEventListener("change", updateLocationAssistForContext);
if (spotInputEl) spotInputEl.addEventListener("input", () => {
  syncSessionStartDefaults();
  updateLocationAssistForContext();
});
if (accessModeInputEl) accessModeInputEl.addEventListener("change", syncSessionStartDefaults);
if (latInputEl) latInputEl.addEventListener("input", () => {
  syncSessionStartDefaults();
  updateLocationAssistForContext();
});
if (lngInputEl) lngInputEl.addEventListener("input", () => {
  syncSessionStartDefaults();
  updateLocationAssistForContext();
});
if (tideStationInputEl) tideStationInputEl.addEventListener("input", () => {
  syncSessionStartDefaults();
  updateLocationAssistForContext();
});
if (speciesInputEl) speciesInputEl.addEventListener("input", scheduleSpeciesSearch);
if (scoreBreakdownToggleEl) {
  scoreBreakdownToggleEl.addEventListener("click", () => {
    const hidden = scoreBreakdownEl.hidden;
    scoreBreakdownEl.hidden = !hidden;
    scoreBreakdownToggleEl.textContent = hidden ? "Hide scoring breakdown" : "Show scoring breakdown";
  });
}
if (analyticsRefreshBtn) {
  analyticsRefreshBtn.addEventListener("click", async () => {
    await refreshAnalytics();
  });
}

updateTideStationVisibility();
updateLocationAssistForContext();
scoreBreakdownEl.hidden = true;
if (scoreBreakdownToggleEl) scoreBreakdownToggleEl.textContent = "Show scoring breakdown";
refreshIntelligence();
refreshSession();
