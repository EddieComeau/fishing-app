# CODEX_README.md

## Handoff Purpose
This file is the Codex-side source of truth for FishDex implementation state, verified runtime behavior, and checkpoint timing.

Last updated: **March 14, 2026 (America/New_York)**

## Project Outline
FishDex is an explainable fishing intelligence app built as deterministic vertical slices.

Core pipeline:

`conditions -> score -> species search -> species enrichment -> rig recommendation -> fight strategy -> catch logging -> catch analytics -> future bounded refinement`

Primary goals:
- Explainable outputs over opaque logic
- Deterministic heuristics before ML
- Low-risk additive slices
- Portfolio-readable architecture
- Real-world usefulness

## Project Paths
- Workspace: `/Users/eddiecomeau/Video Game Info`
- App root: `/Users/eddiecomeau/Video Game Info/fishing-app`
- Backend root: `/Users/eddiecomeau/Video Game Info/fishing-app/server`

## Runtime Baseline
- Backend start:
  - `cd "/Users/eddiecomeau/Video Game Info/fishing-app/server"`
  - `npm run dev`
- Local URL:
  - `http://localhost:3002`
- Database:
  - Postgres `fishdex`

## Transfer Protocol
Use this at every Codex/ChatGPT switch:

1. Codex owns implementation, runtime checks, and `CODEX_README.md`
2. ChatGPT owns architecture checkpoints and roadmap forks
3. `CODEX_README.md` is implementation truth
4. `CHATGPT_README.md` is strategic guidance
5. `INTELLIGENCE_MAP.md` must be updated whenever system structure, service boundaries, or runtime flow changes
6. `DECISIONS.md` must be updated whenever a meaningful architecture decision is made or revised
7. Nothing is considered complete unless Codex verified it locally

## Documentation Continuity Rules
Treat these four files as living project documents:

- `CODEX_README.md`: verified implementation state and runtime checks
- `CHATGPT_README.md`: architecture strategy and roadmap guidance
- `INTELLIGENCE_MAP.md`: current system shape, boundaries, and flow
- `DECISIONS.md`: architecture decision history and rationale

Update them continuously as the project evolves. Do not treat `INTELLIGENCE_MAP.md` or `DECISIONS.md` as one-time setup files.

## Current Implemented API Surface
- `GET /api/conditions`
- `GET /api/species/search?q=`
- `POST /api/score/conditions`
- `GET /api/bite-window`
- `POST /api/rig/recommend`
- `POST /api/fight/strategy`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/sessions`
- `GET /api/sessions/active`
- `POST /api/sessions/:id/end`
- `GET /api/sessions/:id`
- `POST /api/catches`
- `GET /api/catches`
- `GET /api/analytics/catches/summary` (auth required)

## Completed Phases

### Phase 1 + 1b ✅
- Conditions backend slice
- NOAA provider integration
- Normalization and cache
- Frontend moved to backend conditions endpoint

### Phase 2 ✅
- Postgres integration
- Session auth
- Catch persistence
- Auth hardening updates added after initial Phase 2:
  - fixed frontend auth form reset bug after async submit
  - added password reset token flow
  - added email-event logging for account creation and password reset events
  - local development now returns a reset-token preview instead of pretending real email delivery exists

### Phase 3 ✅
- Species search backend via iNaturalist

### Phase 4–7 ✅
- Environmental scoring backend
- Frontend explanation UX

### Phase 8 ✅
- Rig recommendation backend

### Phase 9 + 9b ✅
- Fight strategy backend
- Frontend rig/fight integration

### Phase 10a ✅
- Architecture artifact added:
  - `INTELLIGENCE_MAP.md`

### Phase 10b ✅
- Personal catch analytics backend

### Phase 10c ✅
- Frontend analytics card
- Analytics refresh behavior

### Phase 11A ✅
- Species-origin enrichment implemented on top of `GET /api/species/search?q=`
- Added:
  - `server/src/providers/usgsNas.provider.js`
  - `server/src/services/speciesOrigin.service.js`
- Updated:
  - `server/src/services/species.service.js`
  - `app.js`
  - `styles.css`
- Behavior:
  - existing species search array contract preserved
  - matching results include optional `origin`
  - unmatched results return `origin.status = "unknown"`
  - enrichment failure falls back to base iNaturalist results

### Phase 11B-prep ✅
- Catch schema expanded for future refinement readiness
- Added structured fields:
  - `rig_name`
  - `bait_family`
- Updated:
  - `server/src/config/db.js`
  - `server/src/services/catches.service.js`
  - `index.html`
  - `app.js`
- Catch logging UI now captures:
  - species
  - weight
  - bait text
  - rig used
  - bait family
  - landed
- Catch list now renders rig and bait family when present

### Analytics extension after Phase 11B-prep ✅
- `GET /api/analytics/catches/summary` now also returns:
  - `topRigs`
  - `topBaitFamilies`
- Frontend analytics card now shows `Top Rig`

### Taxonomy clarification update ✅
- Added explicit handling for the `Micropterus nigricans` / `Micropterus salmoides` split/synonym case
- Species enrichment now supports scientific-name alias matching for that known largemouth/Florida bass taxonomy overlap
- Species results may now include:
  - `taxonomyNote`
- Purpose:
  - reduce confusion when iNaturalist and older naming conventions differ
  - make species-origin matching behavior explainable instead of implicit

### Phase 11B slice 1 ✅
- Bounded rig personalization evaluation added to `POST /api/rig/recommend`
- Added:
  - `server/src/services/rigPersonalization.service.js`
- Updated:
  - `server/src/services/rig.service.js`
  - `server/src/controllers/rig.controller.js`
  - `app.js`
- Behavior:
  - base rig logic still runs first
  - base rig selection is unchanged in this slice
  - personalization only evaluates when session auth and structured history exist
  - response now includes:
    - `explanation.baseReasons`
    - `explanation.warnings`
    - `explanation.modifiers`
    - `explanation.metadata`
  - applied v1 modifier code:
    - `preference_detected_no_rerank`
  - authenticated requests with strong species+rig history can return:
    - `impact = "supporting_signal"`
    - `personalizationPreview`

### Phase 11B slice 2 ✅
- Base rig engine refactored to rank multiple viable candidates internally
- Personalization can now apply a bounded tie-break when:
  - the preferred rig is already a valid top candidate
  - the top two base candidates are exactly tied on score
- Updated:
  - `server/src/services/rig.service.js`
- Behavior:
  - existing endpoint remains `POST /api/rig/recommend`
  - base engine now returns additive `candidates`
  - personalization still never invents an invalid rig
  - tie-break is allowed

### Phase 11B slice 3 ✅
- Rig personalization now supports a bounded one-rank adjustment path
- Updated:
  - `server/src/services/rig.service.js`
  - `server/src/services/rigPersonalization.service.js`
  - `app.js`
- Behavior in code:
  - tie-break still evaluates first
  - one-rank adjustment only evaluates when tie-break does not apply
  - preferred rig must already be the second-ranked base candidate
  - strong evidence requires:
    - species+rig samples >= 5
    - landing rate gap >= 15 percentage points
    - landed count gap >= 2
  - base score gap must be `<= 0.20`
  - personalization still cannot introduce a new rig
  - applied modifier code:
    - `one_rank_adjustment_applied`
  - applied impact:
    - `one_rank_adjustment`
- Frontend setup panel now shows:
  - modifier type
  - confidence
  - preferred rig
  - sample size
  - landing rate gap

### Phase 12 ✅
- Bite Window Intelligence implemented as an additive deterministic layer
- Added:
  - `server/src/services/biteWindow.service.js`
  - `server/src/controllers/biteWindow.controller.js`
  - `server/src/routes/biteWindow.routes.js`
- Updated:
  - `server/src/services/conditions.service.js`
  - `server/src/controllers/conditions.controller.js`
  - `server/src/utils/normalizeConditions.js`
  - `server/src/index.js`
  - `index.html`
  - `styles.css`
  - `app.js`
- Behavior:
  - new endpoint available at `GET /api/bite-window`
  - `GET /api/conditions` now includes additive `biteWindow` data
  - bite-window scoring is deterministic and currently uses:
    - sunrise / sunset windows
    - tide-transition windows
    - pressure-trend boosts
  - frontend now renders a `Fishing Activity Outlook` card
  - existing score, target, rig, fight, and analytics flows remain intact

### Phase 13A ✅
- Session Container implemented as a runtime outing layer around existing intelligence
- Added:
  - `server/src/services/sessions.service.js`
  - `server/src/controllers/sessions.controller.js`
  - `server/src/routes/sessions.routes.js`
- Updated:
  - `server/src/config/db.js`
  - `server/src/services/catches.service.js`
  - `server/src/index.js`
  - `index.html`
  - `styles.css`
  - `app.js`
- Behavior:
  - new authenticated endpoints available:
    - `POST /api/sessions`
    - `GET /api/sessions/active`
    - `POST /api/sessions/:id/end`
    - `GET /api/sessions/:id`
  - new `fishing_sessions` table added
  - catches now support optional `session_id`
  - `POST /api/catches` auto-attaches to the user’s active session when no `sessionId` is provided
  - explicit `sessionId` is ownership-validated before a catch can attach
  - session summaries are deterministic rollups of attached catches
  - sessions can now store bite-window state at start:
    - `activityLevelAtStart`
    - `biteWindowStrength`
  - frontend now includes a minimal Fishing Session card for:
    - starting a session
    - viewing active session summary
    - ending a session

### Phase 13B-partial (frontend wiring only; browser runtime not verified)
- Active session card now shows existing intelligence context when available:
  - current bite window level
  - current bite window score
  - current bite window window label
  - next bite window window label
  - recommended species
  - recommended rig
  - current regime
  - current conditions snapshot text
- active session card now includes a manual `Refresh Session` action
- manual session refresh now pulls fresh intelligence before re-rendering the session card
- session-start form defaults now behave as tracked suggestions:
  - suggested session name updates with current spot and species context
  - suggested species focus updates from current intelligence when the user has not overridden it
  - once the user types their own values, the suggestions stop overwriting them
- session action controls now guard against duplicate submissions:
  - start session button shows a temporary busy state
  - refresh session button shows a temporary busy state
  - end session button shows a temporary busy state
- active session card now renders deterministic session explanation text:
  - summary insights still appear first
  - warnings from the session explanation are surfaced in the card
  - base reasons from the session explanation are surfaced in the card
- session action buttons are now explicitly hidden when no active session is present
- location trust/entry improvements:
  - FishDex no longer needs to silently rely on starter coordinates
  - context form now prompts for user-entered coordinates and tide station values
  - context form now includes a browser-based `Use My Location` action
  - intelligence refresh stops early with a warning when latitude/longitude are missing
  - conditions snapshot now shows the exact coordinate basis used for local estimates
  - location helper text now clarifies that browser geolocation is generic and country-wide, while tide station choice still needs to match the same water system
- This reuses existing page intelligence outputs and does not add new recommendation logic

## Verification Snapshot

### Phase 11A runtime verification
Verified on **March 9, 2026**:
- `GET /api/species/search?q=bass`
  - returned enriched species results with `origin`
  - matched results included `status`, `label`, `source`, `confidence`, `explanation`, `provenance`
- `GET /api/species/search?q=redfish`
  - returned valid base species results
  - unmatched records correctly fell back to `origin.status = "unknown"`

### Taxonomy clarification verification
Verified on **March 9, 2026**:
- `GET /api/species/search?q=bass` now returns:
  - `Largemouth Bass` / `Micropterus nigricans`
    - with `taxonomyNote`
    - with `origin.provenance.matchedOn = "scientificAlias"`
  - `Florida Bass` / `Micropterus salmoides`
    - with `taxonomyNote`
    - with direct scientific-name enrichment
- This is treated as a known taxonomy split / historical naming overlap, not a random duplicate bug

Important note:
- iNaturalist returned both `Micropterus nigricans` and `Micropterus salmoides` in bass-related results
- some largemouth-bass labeling matched by historical synonym logic rather than direct scientific-name identity
- this is acceptable for Phase 11A and is now explicitly documented in the response structure

### Phase 11B-prep verification
Verified on **March 9, 2026**:
- `node --check app.js` passed
- `node --check server/src/index.js` passed
- `node --check server/src/services/catches.service.js` passed
- `node --check server/src/config/db.js` passed
- authenticated `POST /api/catches` successfully persisted:
  - `rig_name`
  - `bait_family`
- authenticated `GET /api/catches` returned those fields correctly

### Analytics extension verification
Verified on **March 9, 2026**:
- `node --check app.js` passed
- `node --check server/src/services/analytics.service.js` passed
- authenticated `GET /api/analytics/catches/summary` returned:
  - `topRigs`
  - `topBaitFamilies`
  - updated insights using the new structured catch data

### Phase 11B slice 1 verification
Verified on **March 9, 2026**:
- `node --check app.js` passed
- `node --check server/src/services/rig.service.js` passed
- `node --check server/src/services/rigPersonalization.service.js` passed
- `node --check server/src/controllers/rig.controller.js` passed
- unauthenticated `POST /api/rig/recommend` returned:
  - unchanged base rig
  - `explanation.modifiers = []`
  - `personalizationEvaluated = false`
  - `personalizationCode = "unauthenticated"`
- authenticated `POST /api/rig/recommend` with seeded largemouth-bass rig history returned:
  - unchanged base rig (`Texas rig`)
  - one personalization modifier
  - `code = "preference_detected_no_rerank"`
  - `impact = "supporting_signal"`
  - explicit evidence showing species, preferred rig, sample size, landing rate gap, and landed-count gap

### Phase 11B slice 2 verification
Verified on **March 9, 2026**:
- `node --check server/src/services/rig.service.js` passed
- unauthenticated `POST /api/rig/recommend` still returned:
  - stable base recommendation
  - `personalizationCode = "unauthenticated"`
  - additive `candidates` list
- authenticated `POST /api/rig/recommend` in a non-tie scenario returned:
  - `code = "preference_detected_no_rerank"`
  - unchanged winner
- authenticated `POST /api/rig/recommend` in an exact-tie scenario returned:
  - `code = "tie_break_applied"`
  - `impact = "tie_break"`

### Phase 11B slice 3 verification
Verified on **March 10, 2026**:
- `node --check server/src/services/rig.service.js` passed
- `node --check server/src/services/rigPersonalization.service.js` passed
- `node --check server/src/controllers/rig.controller.js` passed
- `node --check app.js` passed
- authenticated `POST /api/rig/recommend` with seeded `redfish` history returned:
  - `code = "one_rank_adjustment_applied"`
  - `impact = "one_rank_adjustment"`
  - `personalizationPreview.appliedAs = "one_rank_adjustment"`
  - `baseScoreGap = 0.20`
  - the preferred rig was promoted only one rank from second to first
- authenticated `POST /api/rig/recommend` with seeded `smallmouth bass` history returned:
  - `code = "tie_break_applied"`
  - `impact = "tie_break"`
  - tie-break applied only when the top two base candidates were exactly tied
- authenticated `POST /api/rig/recommend` with seeded `trout` history returned:
  - `code = "preference_detected_no_rerank"`
  - `impact = "supporting_signal"`
  - `strongEvidence = false`

### Phase 12 verification
Verified on **March 11, 2026**:
- `node --check server/src/services/biteWindow.service.js` passed
- `node --check server/src/controllers/biteWindow.controller.js` passed
- `node --check server/src/routes/biteWindow.routes.js` passed
- `node --check server/src/services/conditions.service.js` passed
- `node --check server/src/controllers/conditions.controller.js` passed
- `node --check server/src/utils/normalizeConditions.js` passed
- `node --check server/src/index.js` passed
- `node --check app.js` passed
- live `GET /api/bite-window` returned:
  - `activityScore`
  - `activityLevel`
  - `currentWindow`
  - `nextWindow`
  - structured `explanation`
- live `GET /api/conditions` returned:
  - additive `biteWindow` object
  - preserved existing weather, tide, and alerts payloads
- verified example:
  - `pressureTrend = "dropping"` contributed to the explanation
  - next window combined `sunrise transition + low-tide transition`

### Phase 13A verification
Verified on **March 14, 2026**:
- `node --check server/src/config/db.js` passed
- `node --check server/src/services/sessions.service.js` passed
- `node --check server/src/controllers/sessions.controller.js` passed
- `node --check server/src/routes/sessions.routes.js` passed
- `node --check server/src/services/catches.service.js` passed
- `node --check server/src/index.js` passed
- `node --check app.js` passed
- authenticated `POST /api/sessions` returned:
  - active session record with `id`, `name`, `location_label`, `species_focus`, `started_at`, `status`
- authenticated `GET /api/sessions/active` returned:
  - the currently active session
- authenticated `POST /api/catches` with no `sessionId` while a session was active returned:
  - `session_id` automatically set to the active session id
- authenticated `GET /api/catches` returned:
  - attached catch records including `session_id`
- authenticated `GET /api/sessions/:id` returned:
  - deterministic session summary including:
    - `sessionDuration`
    - `catches`
    - `topSpecies`
    - `topRig`
    - `lastCatchAt`
    - `activityLevelAtStart`
    - `biteWindowStrength`
    - structured `explanation`
- authenticated `POST /api/sessions/:id/end` returned:
  - ended session record with `status = "ended"` and `ended_at`
- authenticated `GET /api/sessions/active` after ending returned:
  - `session = null`

### Phase 13B-partial verification
Verified on **March 15, 2026**:
- `node --check app.js` passed
- `node --check server/src/services/auth.service.js` passed
- `node --check server/src/controllers/auth.controller.js` passed
- `node --check server/src/routes/auth.routes.js` passed
- `node --check server/src/services/email.service.js` passed
- `node --check server/src/config/db.js` passed
- frontend active-session intelligence display is wired in code
- session-start default suggestion syncing is wired in code
- session action busy-state guards are wired in code
- session explanation rendering is wired in code
- no-session button hiding is wired in code
- auth submit null-reset bug is fixed in code
- forgot-password and reset-password flows are wired in code
- location-required gating and coordinate-basis display are wired in code
- browser geolocation assist is wired in code
- browser runtime verification for the new session card display is still pending

## Current Architecture Artifacts
- `CODEX_README.md`
- `CHATGPT_README.md`
- `INTELLIGENCE_MAP.md`
- `DECISIONS.md`

## Scope Guardrails
Do not implement unless explicitly approved:
- ML or predictive recommendation models
- automatic learning loops
- offline queue/sync
- major infrastructure rewrites
- unbounded personalization logic
- large schema rewrites beyond what rig personalization actually needs

## Recommended Next Step

### Phase 13 next step
- Phase 13A Session Container is implemented and runtime-verified
- Phase 13B Active Session Intelligence can continue without a ChatGPT checkpoint as long as:
  - recommendation engines remain unchanged
  - session data stays a container/orchestration layer
  - no new intelligence layer is introduced
