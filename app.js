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
const savedSpotsPanelEl = document.getElementById("saved-spots-panel");
const savedSpotsNoteEl = document.getElementById("saved-spots-note");
const savedSpotsAuthNoteEl = document.getElementById("saved-spots-auth-note");
const savedSpotsSelectEl = document.getElementById("saved-spots-select");
const loadSavedSpotBtn = document.getElementById("load-saved-spot-btn");
const deleteSavedSpotBtn = document.getElementById("delete-saved-spot-btn");
const saveCurrentSpotBtn = document.getElementById("save-current-spot-btn");
const updateSavedSpotBtn = document.getElementById("update-saved-spot-btn");
const shareSavedSpotBtn = document.getElementById("share-saved-spot-btn");
const savedSpotNameInputEl = document.getElementById("saved-spot-name");
const savedSpotNotesInputEl = document.getElementById("saved-spot-notes");
const savedSpotShareNoteEl = document.getElementById("saved-spot-share-note");
const savedSpotSummaryWrapEl = document.getElementById("saved-spot-summary-wrap");
const savedSpotSummaryEl = document.getElementById("saved-spot-summary");
const savedSpotSummaryInsightsEl = document.getElementById("saved-spot-summary-insights");
const savedSpotPlanEl = document.getElementById("saved-spot-plan");
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
const spotsEl = document.getElementById("spots-output");
const spotFilterProvenOnlyEl = document.getElementById("spot-filter-proven-only");
const spotRankHistoryFirstEl = document.getElementById("spot-rank-history-first");
const spotFilterNoteEl = document.getElementById("spot-filter-note");
const intelligenceEl = document.getElementById("intelligence-output");
const decisionEl = document.getElementById("decision-output");
const tripPrepEl = document.getElementById("trip-prep-output");
const sessionStartIntelligenceEl = document.getElementById("session-start-intelligence-output");
const applySessionStartSuggestionsBtn = document.getElementById("apply-session-start-suggestions-btn");
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
const activeSessionSuggestionsWrapEl = document.getElementById("active-session-suggestions-wrap");
const activeSessionSuggestionsEl = document.getElementById("active-session-suggestions");
const activeSessionInsightsEl = document.getElementById("active-session-insights");
const refreshSessionBtn = document.getElementById("refresh-session-btn");
const endSessionBtn = document.getElementById("end-session-btn");
const sessionHistoryNoteEl = document.getElementById("session-history-note");
const sessionHistoryListEl = document.getElementById("session-history-list");
const sessionHistoryDetailEl = document.getElementById("session-history-detail");
const sessionHistoryDetailNameEl = document.getElementById("session-history-detail-name");
const sessionHistoryDetailMetaEl = document.getElementById("session-history-detail-meta");
const sessionHistoryDetailSummaryEl = document.getElementById("session-history-detail-summary");
const shareSessionBtn = document.getElementById("share-session-btn");
const sessionShareNoteEl = document.getElementById("session-share-note");
const sessionHistoryDetailSuggestionsWrapEl = document.getElementById("session-history-detail-suggestions-wrap");
const sessionHistoryDetailSuggestionsEl = document.getElementById("session-history-detail-suggestions");
const sessionHistoryDetailInsightsEl = document.getElementById("session-history-detail-insights");
const sessionHistoryReviewWrapEl = document.getElementById("session-history-review-wrap");
const sessionHistoryReviewOutputEl = document.getElementById("session-history-review-output");
const sessionHistoryComparisonWrapEl = document.getElementById("session-history-comparison-wrap");
const sessionHistoryComparisonOutputEl = document.getElementById("session-history-comparison-output");
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
let currentSavedSpots = [];
let currentLoadedSavedSpotId = null;
let currentSessionHistory = [];
let currentSessionHistoryDetail = null;
let currentSessionStartSuggestion = null;
let lastSuggestedSessionName = "";
let lastSuggestedSpeciesFocus = "";

const PUBLIC_SHARE_BASE = API_BASE.replace(/\/api$/, "");

function clearListWithMessage(listEl, message) {
  if (!listEl) return;
  listEl.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = message;
  listEl.appendChild(li);
}

function getSpotPreferenceState() {
  return {
    filterMode: spotFilterProvenOnlyEl?.checked ? "proven_only" : "default",
    rankMode: spotRankHistoryFirstEl?.checked ? "history_first" : "environment_first",
  };
}

function setLocationAssistNote(message, type = "muted") {
  if (!locationAssistNoteEl) return;
  locationAssistNoteEl.textContent = message;
  locationAssistNoteEl.className = type === "warn" ? "status warn" : "muted";
}

function setSavedSpotsNote(message, type = "muted") {
  if (!savedSpotsNoteEl) return;
  savedSpotsNoteEl.textContent = message;
  savedSpotsNoteEl.className = type === "warn" ? "status warn" : type === "ok" ? "status ok" : "muted";
}

function setSavedSpotShareNote(message, type = "muted") {
  if (!savedSpotShareNoteEl) return;
  savedSpotShareNoteEl.textContent = message;
  savedSpotShareNoteEl.className = type === "warn" ? "status warn" : type === "ok" ? "status ok" : "muted";
}

function setSessionShareNote(message, type = "muted") {
  if (!sessionShareNoteEl) return;
  sessionShareNoteEl.textContent = message;
  sessionShareNoteEl.className = type === "warn" ? "status warn" : type === "ok" ? "status ok" : "muted";
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

async function copyText(text) {
  if (!navigator.clipboard?.writeText) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
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
  clearListWithMessage(spotsEl, "Spot recommendations pending location.");
  if (intelligenceEl) intelligenceEl.innerHTML = '<p class="muted">Unified recommendation pending location.</p>';
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

async function getSpotRecommendations(input) {
  const spotPreferences = getSpotPreferenceState();
  const params = new URLSearchParams({
    lat: String(input.lat),
    lng: String(input.lng),
    waterType: input.waterType,
  });

  if (input.tideStationId) params.set("tideStationId", input.tideStationId);
  if (input.spot) params.set("spotName", input.spot);
  if (input.pressureTrend) params.set("pressureTrend", input.pressureTrend);
  if (Number.isInteger(currentLoadedSavedSpotId)) params.set("savedSpotId", String(currentLoadedSavedSpotId));
  if (spotPreferences.filterMode !== "default") params.set("filterMode", spotPreferences.filterMode);
  if (spotPreferences.rankMode !== "environment_first") params.set("rankMode", spotPreferences.rankMode);

  const response = await fetch(`${API_BASE}/spots?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(payload?.error || `Spot endpoint failed: ${response.status}`);
  }

  return response.json();
}

async function getUnifiedIntelligence(input) {
  const spotPreferences = getSpotPreferenceState();
  const params = new URLSearchParams({
    lat: String(input.lat),
    lng: String(input.lng),
    waterType: input.waterType,
    accessMode: input.accessMode,
  });

  if (input.tideStationId) params.set("tideStationId", input.tideStationId);
  if (input.spot) params.set("spotName", input.spot);
  if (input.pressureTrend) params.set("pressureTrend", input.pressureTrend);
  if (Number.isInteger(currentLoadedSavedSpotId)) params.set("savedSpotId", String(currentLoadedSavedSpotId));
  if (spotPreferences.filterMode !== "default") params.set("filterMode", spotPreferences.filterMode);
  if (spotPreferences.rankMode !== "environment_first") params.set("rankMode", spotPreferences.rankMode);

  const response = await fetch(`${API_BASE}/intelligence?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(payload?.error || `Intelligence endpoint failed: ${response.status}`);
  }

  return response.json();
}

async function getTripDecision(input) {
  const spotPreferences = getSpotPreferenceState();
  const params = new URLSearchParams({
    lat: String(input.lat),
    lng: String(input.lng),
    waterType: input.waterType,
    accessMode: input.accessMode,
  });

  if (input.tideStationId) params.set("tideStationId", input.tideStationId);
  if (input.spot) params.set("spotName", input.spot);
  if (input.pressureTrend) params.set("pressureTrend", input.pressureTrend);
  if (Number.isInteger(currentLoadedSavedSpotId)) params.set("savedSpotId", String(currentLoadedSavedSpotId));
  if (spotPreferences.filterMode !== "default") params.set("filterMode", spotPreferences.filterMode);
  if (spotPreferences.rankMode !== "environment_first") params.set("rankMode", spotPreferences.rankMode);

  const response = await fetch(`${API_BASE}/decision?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(payload?.error || `Decision endpoint failed: ${response.status}`);
  }

  return response.json();
}

async function getTripPrep(input) {
  const spotPreferences = getSpotPreferenceState();
  const params = new URLSearchParams({
    lat: String(input.lat),
    lng: String(input.lng),
    waterType: input.waterType,
    accessMode: input.accessMode,
  });

  if (input.tideStationId) params.set("tideStationId", input.tideStationId);
  if (input.spot) params.set("spotName", input.spot);
  if (input.pressureTrend) params.set("pressureTrend", input.pressureTrend);
  if (Number.isInteger(currentLoadedSavedSpotId)) params.set("savedSpotId", String(currentLoadedSavedSpotId));
  if (spotPreferences.filterMode !== "default") params.set("filterMode", spotPreferences.filterMode);
  if (spotPreferences.rankMode !== "environment_first") params.set("rankMode", spotPreferences.rankMode);

  const response = await fetch(`${API_BASE}/trip-prep?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(payload?.error || `Trip prep endpoint failed: ${response.status}`);
  }

  return response.json();
}

async function getSessionStartSuggestions(input) {
  const spotPreferences = getSpotPreferenceState();
  const params = new URLSearchParams({
    lat: String(input.lat),
    lng: String(input.lng),
    waterType: input.waterType,
    accessMode: input.accessMode,
  });

  if (input.tideStationId) params.set("tideStationId", input.tideStationId);
  if (input.spot) params.set("spotName", input.spot);
  if (input.pressureTrend) params.set("pressureTrend", input.pressureTrend);
  if (Number.isInteger(currentLoadedSavedSpotId)) params.set("savedSpotId", String(currentLoadedSavedSpotId));
  if (spotPreferences.filterMode !== "default") params.set("filterMode", spotPreferences.filterMode);
  if (spotPreferences.rankMode !== "environment_first") params.set("rankMode", spotPreferences.rankMode);

  const response = await fetch(`${API_BASE}/session-start?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(payload?.error || `Session-start endpoint failed: ${response.status}`);
  }

  return response.json();
}

function renderSpotRecommendations(payload, modeLabel) {
  if (!spotsEl) return;
  spotsEl.innerHTML = "";
  if (spotFilterNoteEl) {
    spotFilterNoteEl.textContent = "Environmental spot logic stays primary. These options only filter or reorder already-valid spot outputs.";
    spotFilterNoteEl.className = "muted";
  }

  if (!payload) {
    const li = document.createElement("li");
    li.textContent = `Spot recommendations unavailable in ${modeLabel}.`;
    spotsEl.appendChild(li);
    return;
  }

  const spots = Array.isArray(payload.spots) ? payload.spots : [];
  const warnings = Array.isArray(payload.explanation?.warnings) ? payload.explanation.warnings : [];
  const filtering = payload.filtering || null;
  const filteringModifier = Array.isArray(payload.explanation?.modifiers)
    ? payload.explanation.modifiers.find((modifier) => modifier?.type === "spot_filtering")
    : null;

  if (spotFilterNoteEl && filtering) {
    const appliedLabel = filtering.applied
      ? `History filter active: ${filtering.filterMode.replace(/_/g, " ")} / ${filtering.rankMode.replace(/_/g, " ")}.`
      : filtering.filterMode !== "default" || filtering.rankMode !== "default"
        ? `History filter requested: ${filtering.filterMode.replace(/_/g, " ")} / ${filtering.rankMode.replace(/_/g, " ")}.`
        : "Environmental spot logic stays primary. These options only filter or reorder already-valid spot outputs.";
    spotFilterNoteEl.textContent = filteringModifier?.reason || appliedLabel;
    spotFilterNoteEl.className = filtering.applied ? "status ok" : warnings.length ? "status warn" : "muted";
  }

  if (!spots.length) {
    const li = document.createElement("li");
    li.textContent = "No spot recommendations available for this context.";
    spotsEl.appendChild(li);
    warnings.forEach((warning) => {
      const warningLi = document.createElement("li");
      warningLi.innerHTML = `<div class="item-sub"><strong>Warning:</strong> ${warning}</div>`;
      spotsEl.appendChild(warningLi);
    });
    return;
  }

  spots.forEach((spot) => {
    const feedback = spot.historicalFeedback || null;
    const feedbackLine = feedback
      ? `Historical confidence: ${String(feedback.confidenceLevel || "low").toUpperCase()} from ${feedback.sampleSize ?? 0} linked sessions${feedback.adjustment && feedback.adjustment !== "none" ? ` (${feedback.adjustment.replace(/_/g, " ")})` : ""}.`
      : "";
    const feedbackWarnings = Array.isArray(feedback?.warnings) ? feedback.warnings : [];
    const filterBadge = filtering?.applied ? `<div class="item-sub"><strong>Filter mode:</strong> ${String(filtering.filterMode || "default").replace(/_/g, " ")} / ${String(filtering.rankMode || "default").replace(/_/g, " ")}</div>` : "";
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-top">
        <strong>${spot.label || "Fishing spot"}</strong>
        <span class="badge">${String(spot.confidence || "medium").toUpperCase()}</span>
      </div>
      <div class="item-sub">${spot.reason || "No spot explanation returned."}</div>
      ${feedbackLine ? `<div class="item-sub">${feedbackLine}</div>` : ""}
      ${filterBadge}
      ${feedbackWarnings.length ? `<div class="item-sub"><strong>History warning:</strong> ${feedbackWarnings.join(" ")}</div>` : ""}
    `;
    spotsEl.appendChild(li);
  });

  warnings.forEach((warning) => {
    const li = document.createElement("li");
    li.innerHTML = `<div class="item-sub"><strong>Warning:</strong> ${warning}</div>`;
    spotsEl.appendChild(li);
  });
}

function renderUnifiedIntelligence(payload, modeLabel) {
  if (!intelligenceEl) return;

  if (!payload) {
    intelligenceEl.innerHTML = `<p class="muted">Unified recommendation unavailable in ${modeLabel}.</p>`;
    return;
  }

  const reasons = Array.isArray(payload.explanation?.baseReasons) ? payload.explanation.baseReasons : [];
  const warnings = Array.isArray(payload.explanation?.warnings) ? payload.explanation.warnings : [];
  const signalsAligned = Array.isArray(payload.explanation?.metadata?.signalsAligned)
    ? payload.explanation.metadata.signalsAligned
    : [];

  intelligenceEl.innerHTML = `
    <div class="activity-strip">
      <span class="confidence-badge ${confidenceClass(payload.confidence)}">${String(payload.confidence || "low").toUpperCase()}</span>
      <strong>${escapeHtml(payload.targetSpecies || "No target selected")}</strong>
    </div>
    <p><strong>Spot:</strong> ${escapeHtml(payload.recommendedSpot || "n/a")}</p>
    <p><strong>Rig:</strong> ${escapeHtml(payload.recommendedRig || "n/a")}</p>
    <p><strong>Approach:</strong> ${escapeHtml(payload.recommendedApproach || "n/a")}</p>
    <p><strong>Why:</strong> ${escapeHtml(reasons.join(" ") || "No unified explanation returned.")}</p>
    <p><strong>Aligned signals:</strong> ${escapeHtml(signalsAligned.join(", ") || "None clearly aligned")}</p>
    ${warnings.length ? `<p><strong>Warnings:</strong> ${escapeHtml(warnings.join(" "))}</p>` : ""}
  `;
}

function renderTripDecision(payload, modeLabel) {
  if (!decisionEl) return;

  if (!payload) {
    decisionEl.innerHTML = `<p class="muted">Trip decision unavailable in ${modeLabel}.</p>`;
    return;
  }

  const summaryWarnings = Array.isArray(payload.summary?.warnings) ? payload.summary.warnings : [];
  const supportingSignals = Array.isArray(payload.summary?.supportingSignals) ? payload.summary.supportingSignals : [];
  const missingSignals = Array.isArray(payload.explanation?.signalsMissing) ? payload.explanation.signalsMissing : [];

  decisionEl.innerHTML = `
    <div class="activity-strip">
      <span class="confidence-badge ${confidenceClass(payload.decision?.confidence)}">${String(payload.decision?.confidence || "low").toUpperCase()}</span>
      <strong>${escapeHtml(String(payload.decision?.goFishing || "conditional").toUpperCase())}</strong>
    </div>
    <p><strong>Primary reason:</strong> ${escapeHtml(payload.summary?.primaryReason || "No decision summary returned.")}</p>
    <p><strong>Focus:</strong> Spot ${escapeHtml(payload.recommendedFocus?.spot || "n/a")} | Species ${escapeHtml(payload.recommendedFocus?.species || "n/a")} | Rig ${escapeHtml(payload.recommendedFocus?.rig || "n/a")}</p>
    <p><strong>Signals:</strong> ${escapeHtml(supportingSignals.join(" ") || "No supporting signals returned.")}</p>
    ${summaryWarnings.length ? `<p><strong>Warnings:</strong> ${escapeHtml(summaryWarnings.join(" "))}</p>` : ""}
    ${missingSignals.length ? `<p><strong>Missing:</strong> ${escapeHtml(missingSignals.join(", "))}</p>` : ""}
  `;
}

function renderTripPrep(payload, modeLabel) {
  if (!tripPrepEl) return;

  if (!payload) {
    tripPrepEl.innerHTML = `<p class="muted">Trip prep unavailable in ${modeLabel}.</p>`;
    return;
  }

  const prep = payload.tripPrep || {};
  const checklist = payload.checklist || {};
  const warnings = Array.isArray(payload.warnings) ? payload.warnings : [];
  const baseReasons = Array.isArray(payload.explanation?.baseReasons) ? payload.explanation.baseReasons : [];
  const signalsMissing = Array.isArray(payload.explanation?.signalsMissing) ? payload.explanation.signalsMissing : [];
  const gear = Array.isArray(checklist.gear) ? checklist.gear : [];
  const notes = Array.isArray(checklist.notes) ? checklist.notes : [];

  tripPrepEl.innerHTML = `
    <div class="activity-strip">
      <span class="confidence-badge ${confidenceClass(prep.confidence)}">${escapeHtml(String(prep.confidence || "low").toUpperCase())}</span>
      <strong>${escapeHtml(prep.expectation || "Trip prep available")}</strong>
    </div>
    <p><strong>Departure window:</strong> ${escapeHtml(prep.recommendedDepartureWindow || "No strong departure window identified.")}</p>
    <p><strong>Starting rig:</strong> ${escapeHtml(prep.suggestedStartingRig || "n/a")}</p>
    <p><strong>Target species:</strong> ${escapeHtml(prep.suggestedTargetSpecies || "n/a")}</p>
    <p><strong>Focus spot:</strong> ${escapeHtml(prep.suggestedFocusSpot || "n/a")}</p>
    <p><strong>Conditions:</strong> ${escapeHtml(prep.conditionsSummary || "No trip-prep conditions summary returned.")}</p>
    <p><strong>Checklist:</strong> ${escapeHtml(gear.join(" | ") || "No special gear callouts.")}</p>
    <p><strong>Prep notes:</strong> ${escapeHtml(notes.join(" | ") || "No additional prep notes returned.")}</p>
    ${warnings.length ? `<p><strong>Warnings:</strong> ${escapeHtml(warnings.join(" "))}</p>` : ""}
    ${baseReasons.length ? `<p><strong>Why:</strong> ${escapeHtml(baseReasons.join(" "))}</p>` : ""}
    ${signalsMissing.length ? `<p><strong>Missing:</strong> ${escapeHtml(signalsMissing.join(", "))}</p>` : ""}
  `;
}

function renderSessionStartIntelligence(payload, modeLabel) {
  if (!sessionStartIntelligenceEl) return;

  currentSessionStartSuggestion = payload || null;

  if (!payload) {
    sessionStartIntelligenceEl.innerHTML = `<p class="muted">Session-start guidance unavailable in ${modeLabel}.</p>`;
    return;
  }

  const sessionStart = payload.sessionStart || {};
  const startingContext = payload.startingContext || {};
  const warnings = Array.isArray(payload.warnings) ? payload.warnings : [];
  const baseReasons = Array.isArray(payload.explanation?.baseReasons) ? payload.explanation.baseReasons : [];
  const missingSignals = Array.isArray(payload.explanation?.signalsMissing) ? payload.explanation.signalsMissing : [];

  sessionStartIntelligenceEl.innerHTML = `
    <div class="activity-strip">
      <span class="confidence-badge ${confidenceClass(sessionStart.readiness)}">${escapeHtml(String(sessionStart.readiness || "low").toUpperCase())}</span>
      <strong>${escapeHtml(sessionStart.suggestedSessionName || "Fishing Session")}</strong>
    </div>
    <p><strong>Species focus:</strong> ${escapeHtml(sessionStart.suggestedSpeciesFocus || "n/a")}</p>
    <p><strong>Starting rig:</strong> ${escapeHtml(sessionStart.suggestedStartingRig || "n/a")}</p>
    <p><strong>Focus spot:</strong> ${escapeHtml(sessionStart.suggestedFocusSpot || "n/a")}</p>
    <p><strong>Location label:</strong> ${escapeHtml(sessionStart.suggestedLocationLabel || "n/a")}</p>
    <p><strong>Departure window:</strong> ${escapeHtml(startingContext.departureWindow || "No departure window guidance returned.")}</p>
    <p><strong>Expectation:</strong> ${escapeHtml(startingContext.expectation || "No expectation guidance returned.")}</p>
    <p><strong>Trip decision:</strong> ${escapeHtml(startingContext.tripDecision || "No trip decision guidance returned.")}</p>
    ${warnings.length ? `<p><strong>Warnings:</strong> ${escapeHtml(warnings.join(" "))}</p>` : ""}
    ${baseReasons.length ? `<p><strong>Why:</strong> ${escapeHtml(baseReasons.join(" | "))}</p>` : ""}
    ${missingSignals.length ? `<p><strong>Missing:</strong> ${escapeHtml(missingSignals.join(", "))}</p>` : ""}
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

function buildSessionSummaryItems(summary, options = {}) {
  const includeCurrentContext = Boolean(options.includeCurrentContext);
  const items = [
    ["Species Focus", summary.speciesFocus || "n/a"],
    ["Saved Spot", summary.savedSpotName || summary.locationLabel || "n/a"],
    ["Catches", summary.catches ?? 0],
    ["Top Species", summary.topSpecies || "n/a"],
    ["Top Rig", summary.topRig || "n/a"],
    ["Activity At Start", summary.activityLevelAtStart || "n/a"],
    ["Start Bite Score", summary.biteWindowStrength ?? "n/a"],
    ["Last Catch", fmtIso(summary.lastCatchAt)],
  ];

  if (includeCurrentContext && currentIntelligenceSnapshot) {
    items.push(["Current Activity", currentIntelligenceSnapshot.activityLevel || "n/a"]);
    items.push(["Current Bite Score", currentIntelligenceSnapshot.biteWindowStrength ?? "n/a"]);
    items.push(["Current Window", currentIntelligenceSnapshot.currentWindowLabel || "n/a"]);
    items.push(["Next Window", currentIntelligenceSnapshot.nextWindowLabel || "n/a"]);
    items.push(["Recommended Species", currentIntelligenceSnapshot.recommendedSpecies || "n/a"]);
    items.push(["Recommended Rig", currentIntelligenceSnapshot.recommendedRig || "n/a"]);
    items.push(["Current Regime", currentIntelligenceSnapshot.regime || "n/a"]);
    items.push(["Current Conditions", currentIntelligenceSnapshot.conditionsLabel || "n/a"]);
  }

  return items;
}

function renderSessionSummaryList(listEl, items) {
  if (!listEl) return;
  listEl.innerHTML = "";

  items.forEach(([label, value]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    listEl.appendChild(li);
  });
}

function renderSuggestionList(listEl, wrapEl, suggestions, options = {}) {
  if (!listEl || !wrapEl) return;

  const labelTopSuggestion = Boolean(options.labelTopSuggestion);
  listEl.innerHTML = "";

  if (!Array.isArray(suggestions) || !suggestions.length) {
    wrapEl.hidden = true;
    return;
  }

  wrapEl.hidden = false;
  suggestions.forEach((suggestion, index) => {
    const suggestionWarnings = Array.isArray(suggestion.warnings) ? suggestion.warnings : [];
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-top">
        <strong>${labelTopSuggestion && index === 0 ? `Top suggestion: ${suggestion.message || "Suggested adjustment"}` : suggestion.message || "Suggested adjustment"}</strong>
        <span class="badge">${String(suggestion.priority || "medium").toUpperCase()} PRIORITY</span>
      </div>
      <div class="item-sub">Confidence: ${String(suggestion.confidence || "medium").toUpperCase()}</div>
      <div class="item-sub">${suggestion.reason || "No explanation returned."}</div>
      ${suggestionWarnings.length ? `<div class="item-sub">Warnings: ${suggestionWarnings.join("; ")}</div>` : ""}
    `;
    listEl.appendChild(li);
  });
}

function collectSessionInsightLines(summary) {
  const insightLines = Array.isArray(summary.insights) ? [...summary.insights] : [];
  const explanationWarnings = Array.isArray(summary.explanation?.warnings) ? summary.explanation.warnings : [];
  const explanationBaseReasons = Array.isArray(summary.explanation?.baseReasons) ? summary.explanation.baseReasons : [];

  explanationWarnings.forEach((warning) => {
    insightLines.push(`Warning: ${warning}`);
  });

  explanationBaseReasons.forEach((reason) => {
    insightLines.push(reason);
  });

  return [...new Set(insightLines.map((line) => String(line || "").trim()).filter(Boolean))];
}

function renderInsightList(listEl, insights, emptyMessage) {
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!insights.length) {
    const li = document.createElement("li");
    li.textContent = emptyMessage;
    listEl.appendChild(li);
    return;
  }

  insights.forEach((insight) => {
    const li = document.createElement("li");
    li.textContent = insight;
    listEl.appendChild(li);
  });
}

function renderFishingSession(summary, isLoggedIn) {
  if (!sessionModeNoteEl || !sessionStartForm || !activeSessionCardEl) return;

  if (refreshSessionBtn) refreshSessionBtn.hidden = true;
  if (endSessionBtn) endSessionBtn.hidden = true;
  activeSessionNameEl.textContent = "";
  activeSessionMetaEl.textContent = "";
  activeSessionSummaryEl.innerHTML = "";
  if (activeSessionSuggestionsWrapEl) activeSessionSuggestionsWrapEl.hidden = true;
  if (activeSessionSuggestionsEl) activeSessionSuggestionsEl.innerHTML = "";
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
  renderSessionSummaryList(activeSessionSummaryEl, buildSessionSummaryItems(summary, { includeCurrentContext: true }));
  renderSuggestionList(activeSessionSuggestionsEl, activeSessionSuggestionsWrapEl, summary.adaptiveSuggestions || [], {
    labelTopSuggestion: true,
  });
  renderInsightList(activeSessionInsightsEl, collectSessionInsightLines(summary), "No session insights available yet.");
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

function clearSessionHistoryDetail() {
  if (!sessionHistoryDetailEl) return;
  currentSessionHistoryDetail = null;
  sessionHistoryDetailEl.hidden = true;
  if (sessionHistoryDetailNameEl) sessionHistoryDetailNameEl.textContent = "";
  if (sessionHistoryDetailMetaEl) sessionHistoryDetailMetaEl.textContent = "";
  if (sessionHistoryDetailSummaryEl) sessionHistoryDetailSummaryEl.innerHTML = "";
  setSessionShareNote("");
  if (sessionHistoryDetailSuggestionsWrapEl) sessionHistoryDetailSuggestionsWrapEl.hidden = true;
  if (sessionHistoryDetailSuggestionsEl) sessionHistoryDetailSuggestionsEl.innerHTML = "";
  if (sessionHistoryDetailInsightsEl) sessionHistoryDetailInsightsEl.innerHTML = "";
  if (sessionHistoryReviewWrapEl) sessionHistoryReviewWrapEl.hidden = true;
  if (sessionHistoryReviewOutputEl) sessionHistoryReviewOutputEl.innerHTML = "";
  if (sessionHistoryComparisonWrapEl) sessionHistoryComparisonWrapEl.hidden = true;
  if (sessionHistoryComparisonOutputEl) sessionHistoryComparisonOutputEl.innerHTML = "";
}

function renderSessionReview(review) {
  if (!sessionHistoryReviewWrapEl || !sessionHistoryReviewOutputEl) return;

  if (!review) {
    sessionHistoryReviewWrapEl.hidden = true;
    sessionHistoryReviewOutputEl.innerHTML = "";
    return;
  }

  const whatWorked = Array.isArray(review.whatWorked) ? review.whatWorked : [];
  const whatDidNotWork = Array.isArray(review.whatDidNotWork) ? review.whatDidNotWork : [];
  const patterns = Array.isArray(review.patterns) ? review.patterns : [];
  const missedOpportunities = Array.isArray(review.missedOpportunities) ? review.missedOpportunities : [];
  const warnings = Array.isArray(review.warnings) ? review.warnings : [];

  sessionHistoryReviewWrapEl.hidden = false;
  sessionHistoryReviewOutputEl.innerHTML = `
    <div class="activity-strip">
      <span class="confidence-badge ${confidenceClass(review.review?.confidence)}">${escapeHtml(String(review.review?.confidence || "low").toUpperCase())}</span>
      <strong>${escapeHtml(String(review.review?.overallOutcome || "mixed").toUpperCase())}</strong>
    </div>
    <p><strong>Expectation match:</strong> ${escapeHtml(String(review.review?.expectationMatch || "matched").toUpperCase())}</p>
    <p><strong>Summary:</strong> ${escapeHtml(review.review?.summary || "No session review summary returned.")}</p>
    <p><strong>What worked:</strong> ${escapeHtml(whatWorked.join(" | ") || "No strong success pattern was confirmed.")}</p>
    <p><strong>What didn't work:</strong> ${escapeHtml(whatDidNotWork.join(" | ") || "No clear failure pattern was isolated.")}</p>
    <p><strong>Patterns:</strong> ${escapeHtml(patterns.join(" | ") || "No clear session pattern was isolated.")}</p>
    <p><strong>Missed opportunities:</strong> ${escapeHtml(missedOpportunities.join(" | ") || "No major missed opportunity was identified.")}</p>
    ${warnings.length ? `<p><strong>Warnings:</strong> ${escapeHtml(warnings.join(" "))}</p>` : ""}
  `;
}

function renderSessionComparison(comparison) {
  if (!sessionHistoryComparisonWrapEl || !sessionHistoryComparisonOutputEl) return;

  if (!comparison) {
    sessionHistoryComparisonWrapEl.hidden = true;
    sessionHistoryComparisonOutputEl.innerHTML = "";
    return;
  }

  const patterns = Array.isArray(comparison.patterns) ? comparison.patterns : [];
  const warnings = Array.isArray(comparison.warnings) ? comparison.warnings : [];
  const deltas = comparison.deltas || {};

  sessionHistoryComparisonWrapEl.hidden = false;
  sessionHistoryComparisonOutputEl.innerHTML = `
    <div class="activity-strip">
      <span class="confidence-badge ${confidenceClass(comparison.comparison?.confidence)}">${escapeHtml(String(comparison.comparison?.confidence || "low").toUpperCase())}</span>
      <strong>${escapeHtml(String(comparison.comparison?.relativeOutcome || "typical").replace(/_/g, " ").toUpperCase())}</strong>
    </div>
    <p><strong>Trend:</strong> ${escapeHtml(String(comparison.comparison?.trend || "unclear").toUpperCase())}</p>
    <p><strong>Baseline window:</strong> ${escapeHtml(String(comparison.comparison?.baselineWindow || 5))} recent ended sessions</p>
    <p><strong>Summary:</strong> ${escapeHtml(comparison.comparison?.summary || "No session comparison summary returned.")}</p>
    <p><strong>Deltas:</strong> ${escapeHtml(`Catches ${Number(deltas.catchesDelta || 0) >= 0 ? "+" : ""}${Number(deltas.catchesDelta || 0)}, Duration ${Number(deltas.durationDeltaMinutes || 0) >= 0 ? "+" : ""}${Number(deltas.durationDeltaMinutes || 0)}m, Top rig match ${deltas.topRigMatch ? "yes" : "no"}, Top species match ${deltas.topSpeciesMatch ? "yes" : "no"}`)}</p>
    <p><strong>Patterns:</strong> ${escapeHtml(patterns.join(" | ") || "No clear recent-session comparison pattern was isolated.")}</p>
    ${warnings.length ? `<p><strong>Warnings:</strong> ${escapeHtml(warnings.join(" "))}</p>` : ""}
  `;
}

function renderSessionHistoryDetail(summary, review = null, comparison = null) {
  if (!summary || !sessionHistoryDetailEl) return;

  currentSessionHistoryDetail = summary;
  sessionHistoryDetailEl.hidden = false;
  sessionHistoryDetailNameEl.textContent = summary.name || "Trip Detail";
  sessionHistoryDetailMetaEl.textContent = `${summary.locationLabel || summary.savedSpotName || "Unknown location"} | ${summary.sessionDuration || "n/a"} | ${summary.status || "ended"}`;
  renderSessionSummaryList(
    sessionHistoryDetailSummaryEl,
    buildSessionSummaryItems(summary, { includeCurrentContext: false })
  );
  renderSuggestionList(sessionHistoryDetailSuggestionsEl, sessionHistoryDetailSuggestionsWrapEl, summary.adaptiveSuggestions || []);
  renderInsightList(sessionHistoryDetailInsightsEl, collectSessionInsightLines(summary), "No trip insights available yet.");
  renderSessionReview(review);
  renderSessionComparison(comparison);
  setSessionShareNote("Create a read-only public link if you want to share this completed trip.");
}

async function loadSessionHistoryDetail(sessionId) {
  if (!currentUser || !Number.isInteger(sessionId)) return;

  try {
    const [summary, review, comparison] = await Promise.all([
      api(`/sessions/${sessionId}`, { method: "GET" }),
      api(`/sessions/${sessionId}/review`, { method: "GET" }),
      api(`/sessions/${sessionId}/comparison`, { method: "GET" }),
    ]);
    renderSessionHistoryDetail(summary, review, comparison);
  } catch (error) {
    clearSessionHistoryDetail();
    showAuthStatus(error.message, "warn");
  }
}

function renderSessionHistory(sessions, isLoggedIn) {
  if (!sessionHistoryNoteEl || !sessionHistoryListEl) return;

  currentSessionHistory = Array.isArray(sessions) ? sessions : [];
  sessionHistoryListEl.innerHTML = "";

  if (!isLoggedIn) {
    sessionHistoryNoteEl.hidden = false;
    sessionHistoryNoteEl.textContent = "Login to review previous outings.";
    sessionHistoryListEl.hidden = true;
    clearSessionHistoryDetail();
    return;
  }

  sessionHistoryNoteEl.hidden = false;

  if (!currentSessionHistory.length) {
    sessionHistoryNoteEl.textContent = "No completed trips yet. End a session to add it to history.";
    sessionHistoryListEl.hidden = true;
    clearSessionHistoryDetail();
    return;
  }

  sessionHistoryNoteEl.textContent = "Ended sessions appear here newest first. Open one to load its existing deterministic trip summary.";
  sessionHistoryListEl.hidden = false;

  currentSessionHistory.forEach((session) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-top">
        <strong>${session.name || "Ended Session"}</strong>
        <span class="badge">${String(session.status || "ended").toUpperCase()}</span>
      </div>
      <div class="item-sub">${session.locationLabel || session.savedSpotName || "Unknown location"} | ${session.sessionDuration || "n/a"} | Started ${fmtIso(session.startedAt)}</div>
      <div class="item-sub">Catches: ${session.summary?.catches ?? 0} | Top Species: ${session.summary?.topSpecies || "n/a"} | Top Rig: ${session.summary?.topRig || "n/a"}</div>
      ${session.savedSpotName ? `<div class="item-sub">Saved Spot: ${session.savedSpotName}</div>` : ""}
    `;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.textContent = "Open Trip";
    button.addEventListener("click", () => {
      loadSessionHistoryDetail(session.id);
    });
    li.appendChild(button);

    sessionHistoryListEl.appendChild(li);
  });
}

async function refreshSessionHistory() {
  if (!currentUser) {
    renderSessionHistory([], false);
    return;
  }

  try {
    const payload = await api("/sessions/history", { method: "GET" });
    renderSessionHistory(payload.sessions || [], true);
  } catch (error) {
    renderSessionHistory([], true);
    sessionHistoryNoteEl.textContent = error.message || "Session history could not be loaded.";
  }
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

function setSavedSpotSelection(savedSpotId) {
  currentLoadedSavedSpotId = Number.isInteger(savedSpotId) ? savedSpotId : null;
  if (savedSpotsSelectEl) {
    savedSpotsSelectEl.value = currentLoadedSavedSpotId ? String(currentLoadedSavedSpotId) : "";
  }
  if (!currentLoadedSavedSpotId) {
    clearSavedSpotSummary();
    setSavedSpotShareNote("");
  }
}

function populateSavedSpotFieldsFromContext() {
  if (savedSpotNameInputEl && !String(savedSpotNameInputEl.value || "").trim()) {
    savedSpotNameInputEl.value = String(spotInputEl?.value || "").trim();
  }
}

function applySavedSpotToContext(spot) {
  if (!spot) return;

  if (spotInputEl) spotInputEl.value = spot.locationLabel || spot.name || "";
  if (waterTypeEl) waterTypeEl.value = spot.waterType || "freshwater";
  updateTideStationVisibility();
  if (latInputEl) latInputEl.value = Number(spot.latitude).toFixed(6);
  if (lngInputEl) lngInputEl.value = Number(spot.longitude).toFixed(6);
  if (tideStationInputEl) tideStationInputEl.value = spot.tideStationId || "";
  if (savedSpotNameInputEl) savedSpotNameInputEl.value = spot.name || "";
  if (savedSpotNotesInputEl) savedSpotNotesInputEl.value = spot.notes || "";

  setSavedSpotSelection(spot.id);
  updateLocationAssistForContext();
  syncSessionStartDefaults();
}

function buildSavedSpotPayloadFromContext() {
  const context = parseContext();
  const coordinateValidationMessage = getCoordinateValidationMessage(context);
  if (coordinateValidationMessage) {
    throw new Error(coordinateValidationMessage);
  }

  const name = String(savedSpotNameInputEl?.value || context.spot || "").trim();
  if (!name) {
    throw new Error("Saved spot name is required");
  }

  return {
    name,
    latitude: context.lat,
    longitude: context.lng,
    waterType: context.waterType,
    tideStationId: context.tideStationId || null,
    locationLabel: context.spot || null,
    notes: String(savedSpotNotesInputEl?.value || "").trim() || null,
  };
}

function renderSavedSpots(spots) {
  currentSavedSpots = Array.isArray(spots) ? spots : [];

  if (!savedSpotsSelectEl) return;

  savedSpotsSelectEl.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = currentSavedSpots.length ? "Choose a saved spot" : "No saved spots yet";
  savedSpotsSelectEl.appendChild(placeholder);

  currentSavedSpots.forEach((spot) => {
    const option = document.createElement("option");
    option.value = String(spot.id);
    option.textContent = `${spot.name} (${spot.waterType})`;
    savedSpotsSelectEl.appendChild(option);
  });

  if (currentLoadedSavedSpotId && currentSavedSpots.some((spot) => spot.id === currentLoadedSavedSpotId)) {
    savedSpotsSelectEl.value = String(currentLoadedSavedSpotId);
  } else {
    setSavedSpotSelection(null);
  }
}

function clearSavedSpotSummary() {
  if (savedSpotSummaryWrapEl) savedSpotSummaryWrapEl.hidden = true;
  if (savedSpotSummaryEl) savedSpotSummaryEl.innerHTML = "";
  if (savedSpotSummaryInsightsEl) savedSpotSummaryInsightsEl.innerHTML = "";
  if (savedSpotPlanEl) savedSpotPlanEl.innerHTML = "";
}

function renderSavedSpotSummary(payload, planPayload = null) {
  if (!savedSpotSummaryWrapEl || !savedSpotSummaryEl || !savedSpotSummaryInsightsEl || !savedSpotPlanEl || !payload) return;

  const summary = payload.summary || {};
  const explanation = payload.explanation || {};
  const insights = payload.insights || {};
  const plan = planPayload?.plan || {};
  const planExplanation = planPayload?.explanation || {};

  savedSpotSummaryWrapEl.hidden = false;
  savedSpotSummaryEl.innerHTML = "";
  savedSpotSummaryInsightsEl.innerHTML = "";
  savedSpotPlanEl.innerHTML = "";

  const summaryItems = [
    ["Sessions", summary.totalSessions ?? 0],
    ["Catches", summary.totalCatches ?? 0],
    ["Avg Catches / Session", summary.avgCatchesPerSession ?? 0],
    ["Top Species", summary.topSpecies || "n/a"],
    ["Top Rig", summary.topRig || "n/a"],
    ["Best Window", summary.bestTimeOfDay || "n/a"],
    ["Last Fished", fmtIso(summary.lastFishedAt)],
  ];

  summaryItems.forEach(([label, value]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    savedSpotSummaryEl.appendChild(li);
  });

  const insightLines = [
    insights.bestTime ? `Best Time: ${insights.bestTime}` : null,
    insights.bestRig ? `Best Rig: ${insights.bestRig}` : null,
    insights.productivity ? `Productivity: ${insights.productivity}` : null,
    insights.patternSummary ? `Pattern: ${insights.patternSummary}` : null,
    ...(Array.isArray(insights.warnings) ? insights.warnings.map((warning) => `Warning: ${warning}`) : []),
  ].filter(Boolean);

  const fallbackExplanationLines = [
    ...(Array.isArray(explanation.baseReasons) ? explanation.baseReasons : []),
    ...(Array.isArray(explanation.warnings) ? explanation.warnings.map((warning) => `Warning: ${warning}`) : []),
  ].filter(Boolean);

  if (!insightLines.length) {
    if (!fallbackExplanationLines.length) {
      const li = document.createElement("li");
      li.textContent = "No spot performance summary available yet.";
      savedSpotSummaryInsightsEl.appendChild(li);
      return;
    }

    fallbackExplanationLines.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      savedSpotSummaryInsightsEl.appendChild(li);
    });
  } else {
    insightLines.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      savedSpotSummaryInsightsEl.appendChild(li);
    });
  }

  const planLines = [
    plan.recommendedTime ? `Recommended Time: ${plan.recommendedTime}` : null,
    plan.recommendedRig ? `Recommended Rig: ${plan.recommendedRig}` : null,
    plan.strategy ? `Strategy: ${plan.strategy}` : null,
    plan.confidence ? `Confidence: ${String(plan.confidence).toUpperCase()}` : null,
    ...(Array.isArray(planExplanation.warnings) ? planExplanation.warnings.map((warning) => `Warning: ${warning}`) : []),
  ].filter(Boolean);

  if (!planLines.length) {
    const li = document.createElement("li");
    li.textContent = "No saved-spot plan is available yet.";
    savedSpotPlanEl.appendChild(li);
  } else {
    planLines.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      savedSpotPlanEl.appendChild(li);
    });
  }

  setSavedSpotShareNote("Create a read-only public link if you want to share this saved spot summary.");
}

async function refreshSavedSpotSummary(savedSpotId = currentLoadedSavedSpotId) {
  if (!currentUser || !Number.isInteger(savedSpotId)) {
    clearSavedSpotSummary();
    return;
  }

  try {
    const [summaryPayload, planPayload] = await Promise.all([
      api(`/spots/saved/${savedSpotId}/summary`, { method: "GET" }),
      api(`/spots/saved/${savedSpotId}/plan`, { method: "GET" }),
    ]);
    renderSavedSpotSummary(summaryPayload, planPayload);
  } catch (error) {
    clearSavedSpotSummary();
    setSavedSpotsNote(error.message, "warn");
  }
}

async function refreshSavedSpots() {
  if (!savedSpotsPanelEl || !savedSpotsAuthNoteEl) return;

  if (!currentUser) {
    savedSpotsPanelEl.hidden = true;
    savedSpotsAuthNoteEl.hidden = false;
    renderSavedSpots([]);
    clearSavedSpotSummary();
    setSavedSpotShareNote("");
    if (savedSpotNameInputEl) savedSpotNameInputEl.value = "";
    if (savedSpotNotesInputEl) savedSpotNotesInputEl.value = "";
    setSavedSpotsNote("Login to save and reload fishing locations.");
    return;
  }

  savedSpotsPanelEl.hidden = false;
  savedSpotsAuthNoteEl.hidden = true;

  try {
    const payload = await api("/spots/saved", { method: "GET" });
    renderSavedSpots(payload.spots || []);
    setSavedSpotsNote("Save a trusted location context so you can reload it quickly next time.");
    populateSavedSpotFieldsFromContext();
    await refreshSavedSpotSummary();
  } catch (error) {
    renderSavedSpots([]);
    clearSavedSpotSummary();
    setSavedSpotsNote(error.message, "warn");
  }
}

async function createSpotShareLink() {
  if (!currentUser || !Number.isInteger(currentLoadedSavedSpotId)) {
    setSavedSpotShareNote("Load a saved spot before sharing it.", "warn");
    return;
  }

  const restoreButton = setButtonBusy(shareSavedSpotBtn, "Sharing...");

  try {
    const payload = await api(`/share/spot/${currentLoadedSavedSpotId}`, { method: "POST" });
    const publicUrl = `${PUBLIC_SHARE_BASE}${payload.url}`;
    const copied = await copyText(publicUrl);
    setSavedSpotShareNote(copied ? `Share link copied: ${publicUrl}` : `Share link ready: ${publicUrl}`, "ok");
  } catch (error) {
    setSavedSpotShareNote(error.message || "Could not create a share link.", "warn");
  } finally {
    restoreButton();
  }
}

async function createSessionShareLink() {
  const sessionId = Number(currentSessionHistoryDetail?.sessionId);

  if (!currentUser || !Number.isInteger(sessionId)) {
    setSessionShareNote("Open a completed trip before sharing it.", "warn");
    return;
  }

  const restoreButton = setButtonBusy(shareSessionBtn, "Sharing...");

  try {
    const payload = await api(`/share/session/${sessionId}`, { method: "POST" });
    const publicUrl = `${PUBLIC_SHARE_BASE}${payload.url}`;
    const copied = await copyText(publicUrl);
    setSessionShareNote(copied ? `Share link copied: ${publicUrl}` : `Share link ready: ${publicUrl}`, "ok");
  } catch (error) {
    setSessionShareNote(error.message || "Could not create a share link.", "warn");
  } finally {
    restoreButton();
  }
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

  let spotPayload = null;
  let intelligencePayload = null;
  let decisionPayload = null;
  let tripPrepPayload = null;
  let sessionStartPayload = null;
  if (modeLabel === "live") {
    try {
      spotPayload = await getSpotRecommendations(input);
    } catch {
      spotPayload = null;
    }
    try {
      intelligencePayload = await getUnifiedIntelligence(input);
    } catch {
      intelligencePayload = null;
    }
    try {
      decisionPayload = await getTripDecision(input);
    } catch {
      decisionPayload = null;
    }
    try {
      tripPrepPayload = await getTripPrep(input);
    } catch {
      tripPrepPayload = null;
    }
    try {
      sessionStartPayload = await getSessionStartSuggestions(input);
    } catch {
      sessionStartPayload = null;
    }
  }
  renderSpotRecommendations(spotPayload, modeLabel);
  renderUnifiedIntelligence(intelligencePayload, modeLabel);
  renderTripDecision(decisionPayload, modeLabel);
  renderTripPrep(tripPrepPayload, modeLabel);
  renderSessionStartIntelligence(sessionStartPayload, modeLabel);

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
    recommendedSpecies: intelligencePayload?.targetSpecies || topTargetName,
    recommendedRig: intelligencePayload?.recommendedRig || rigPayload?.rigName || null,
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

    const context = parseContext();
    const params = new URLSearchParams();
    const coordinateValidationMessage = getCoordinateValidationMessage(context);
    if (!coordinateValidationMessage) {
      params.set("lat", String(context.lat));
      params.set("lng", String(context.lng));
      params.set("waterType", context.waterType);
      params.set("accessMode", context.accessMode);
      if (context.tideStationId) params.set("tideStationId", context.tideStationId);
      if (context.spot) params.set("spotName", context.spot);
      if (context.pressureTrend) params.set("pressureTrend", context.pressureTrend);
    }

    try {
      const summary = await api(`/sessions/${session.id}${params.toString() ? `?${params.toString()}` : ""}`, { method: "GET" });
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
    await refreshSavedSpots();
    await refreshFishingSession();
    await refreshSessionHistory();
  } catch {
    currentUser = null;
    authForms.hidden = false;
    sessionPanel.hidden = true;
    catchForm.hidden = true;
    catchAuthNote.hidden = false;
    renderCatches([]);
    renderAnalytics(null, false);
    await refreshSavedSpots();
    renderFishingSession(null, false);
    renderSessionHistory([], false);
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
      savedSpotId: currentLoadedSavedSpotId || null,
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
      await refreshSessionHistory();
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

if (applySessionStartSuggestionsBtn) {
  applySessionStartSuggestionsBtn.addEventListener("click", () => {
    if (currentFishingSession?.sessionId) {
      showAuthStatus("An active session is already running. End it before applying new start suggestions.", "warn");
      return;
    }

    if (!currentUser) {
      showAuthStatus("Login to copy session-start suggestions into the session form.", "warn");
      return;
    }

    if (!currentSessionStartSuggestion?.sessionStart) {
      showAuthStatus("Refresh live intelligence before applying session-start suggestions.", "warn");
      return;
    }

    const sessionStart = currentSessionStartSuggestion.sessionStart;

    if (sessionNameInputEl && sessionStart.suggestedSessionName) {
      sessionNameInputEl.value = sessionStart.suggestedSessionName;
      lastSuggestedSessionName = sessionStart.suggestedSessionName;
    }

    if (
      sessionSpeciesFocusInputEl &&
      sessionStart.suggestedSpeciesFocus &&
      String(sessionStart.suggestedSpeciesFocus).toLowerCase() !== "n/a"
    ) {
      sessionSpeciesFocusInputEl.value = sessionStart.suggestedSpeciesFocus;
      lastSuggestedSpeciesFocus = sessionStart.suggestedSpeciesFocus;
    }

    showAuthStatus("Session-start suggestions copied into the form. Review them before starting the trip.", "ok");
  });
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
      await refreshSessionHistory();
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

if (saveCurrentSpotBtn) {
  saveCurrentSpotBtn.addEventListener("click", async () => {
    if (!currentUser) {
      setSavedSpotsNote("Login to save fishing locations.", "warn");
      return;
    }

    let payload;
    try {
      payload = buildSavedSpotPayloadFromContext();
    } catch (error) {
      setSavedSpotsNote(error.message, "warn");
      return;
    }

    const restoreButton = setButtonBusy(saveCurrentSpotBtn, "Saving...");

    try {
      const response = await api("/spots/saved", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSavedSpotSelection(response.spot?.id || null);
      await refreshSavedSpots();
      await refreshSavedSpotSummary(response.spot?.id || null);
      setSavedSpotsNote("Saved current location context.", "ok");
    } catch (error) {
      setSavedSpotsNote(error.message, "warn");
    } finally {
      restoreButton();
    }
  });
}

if (loadSavedSpotBtn) {
  loadSavedSpotBtn.addEventListener("click", async () => {
    if (!currentUser) {
      setSavedSpotsNote("Login to load saved fishing locations.", "warn");
      return;
    }

    const selectedId = Number(savedSpotsSelectEl?.value || "");
    if (!Number.isInteger(selectedId)) {
      setSavedSpotsNote("Select a saved spot first.", "warn");
      return;
    }

    const restoreButton = setButtonBusy(loadSavedSpotBtn, "Loading...");

    try {
      const response = await api(`/spots/saved/${selectedId}`, { method: "GET" });
      applySavedSpotToContext(response.spot);
      await refreshSavedSpotSummary(response.spot?.id || selectedId);
      setSavedSpotsNote(`Loaded ${response.spot?.name || "saved spot"} into the current context.`, "ok");
      showStatus("Saved spot loaded into the context form. Refresh intelligence when you are ready.", "ok");
    } catch (error) {
      setSavedSpotsNote(error.message, "warn");
    } finally {
      restoreButton();
    }
  });
}

if (updateSavedSpotBtn) {
  updateSavedSpotBtn.addEventListener("click", async () => {
    if (!currentUser) {
      setSavedSpotsNote("Login to update saved fishing locations.", "warn");
      return;
    }

    const selectedId = Number(savedSpotsSelectEl?.value || "");
    if (!Number.isInteger(selectedId)) {
      setSavedSpotsNote("Select a saved spot to update.", "warn");
      return;
    }

    let payload;
    try {
      payload = buildSavedSpotPayloadFromContext();
    } catch (error) {
      setSavedSpotsNote(error.message, "warn");
      return;
    }

    const restoreButton = setButtonBusy(updateSavedSpotBtn, "Updating...");

    try {
      const response = await api(`/spots/saved/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSavedSpotSelection(response.spot?.id || selectedId);
      await refreshSavedSpots();
      await refreshSavedSpotSummary(response.spot?.id || selectedId);
      setSavedSpotsNote("Saved spot updated.", "ok");
    } catch (error) {
      setSavedSpotsNote(error.message, "warn");
    } finally {
      restoreButton();
    }
  });
}

if (deleteSavedSpotBtn) {
  deleteSavedSpotBtn.addEventListener("click", async () => {
    if (!currentUser) {
      setSavedSpotsNote("Login to delete saved fishing locations.", "warn");
      return;
    }

    const selectedId = Number(savedSpotsSelectEl?.value || "");
    if (!Number.isInteger(selectedId)) {
      setSavedSpotsNote("Select a saved spot to delete.", "warn");
      return;
    }

    const restoreButton = setButtonBusy(deleteSavedSpotBtn, "Deleting...");

    try {
      await api(`/spots/saved/${selectedId}`, { method: "DELETE" });
      if (currentLoadedSavedSpotId === selectedId) {
        setSavedSpotSelection(null);
      }
      await refreshSavedSpots();
      clearSavedSpotSummary();
      setSavedSpotsNote("Saved spot deleted.", "ok");
    } catch (error) {
      setSavedSpotsNote(error.message, "warn");
    } finally {
      restoreButton();
    }
  });
}

if (shareSavedSpotBtn) {
  shareSavedSpotBtn.addEventListener("click", async () => {
    await createSpotShareLink();
  });
}

waterTypeEl.addEventListener("change", updateTideStationVisibility);
waterTypeEl.addEventListener("change", () => {
  setSavedSpotSelection(null);
  updateLocationAssistForContext();
});
if (spotInputEl) spotInputEl.addEventListener("input", () => {
  setSavedSpotSelection(null);
  syncSessionStartDefaults();
  updateLocationAssistForContext();
  populateSavedSpotFieldsFromContext();
});
if (accessModeInputEl) accessModeInputEl.addEventListener("change", syncSessionStartDefaults);
if (latInputEl) latInputEl.addEventListener("input", () => {
  setSavedSpotSelection(null);
  syncSessionStartDefaults();
  updateLocationAssistForContext();
  populateSavedSpotFieldsFromContext();
});
if (lngInputEl) lngInputEl.addEventListener("input", () => {
  setSavedSpotSelection(null);
  syncSessionStartDefaults();
  updateLocationAssistForContext();
  populateSavedSpotFieldsFromContext();
});
if (tideStationInputEl) tideStationInputEl.addEventListener("input", () => {
  setSavedSpotSelection(null);
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
  if (savedSpotsSelectEl) {
  savedSpotsSelectEl.addEventListener("change", async () => {
    const selectedId = Number(savedSpotsSelectEl.value || "");
    setSavedSpotSelection(Number.isInteger(selectedId) ? selectedId : null);
    await refreshSavedSpotSummary(Number.isInteger(selectedId) ? selectedId : null);
  });
}

if (spotFilterProvenOnlyEl) {
  spotFilterProvenOnlyEl.addEventListener("change", () => {
    refreshIntelligence();
  });
}

if (spotRankHistoryFirstEl) {
  spotRankHistoryFirstEl.addEventListener("change", () => {
    refreshIntelligence();
  });
}

if (shareSessionBtn) {
  shareSessionBtn.addEventListener("click", async () => {
    await createSessionShareLink();
  });
}

updateTideStationVisibility();
updateLocationAssistForContext();
populateSavedSpotFieldsFromContext();
scoreBreakdownEl.hidden = true;
if (scoreBreakdownToggleEl) scoreBreakdownToggleEl.textContent = "Show scoring breakdown";
refreshIntelligence();
refreshSession();
