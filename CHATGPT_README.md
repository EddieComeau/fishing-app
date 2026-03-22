# CHATGPT_README.md

## Purpose

This file records architecture decisions, strategic guidance, and roadmap checkpoints for FishDex.

Unlike `CODEX_README.md`, this document does not represent implemented behavior.

It captures:

- architecture rules
- design decisions
- roadmap guidance
- boundaries for future development

Codex should treat this file as architecture guidance only.

Only work verified by Codex should be recorded in:

- `CODEX_README.md`

## Documentation Continuity Rules

FishDex has four continuity files that must stay current together:

- `CODEX_README.md`
- `CHATGPT_README.md`
- `INTELLIGENCE_MAP.md`
- `DECISIONS.md`

Update expectations:

- update `CODEX_README.md` when implementation is verified
- update `CHATGPT_README.md` when strategy, roadmap, or architecture guidance changes
- update `INTELLIGENCE_MAP.md` when system flow, boundaries, or service shape changes
- update `DECISIONS.md` when a meaningful architecture decision is made, clarified, or reversed

`INTELLIGENCE_MAP.md` and `DECISIONS.md` are living documents, not one-time artifacts.

## FishDex Architecture Strategy

FishDex is designed as an explainable fishing intelligence system built through deterministic vertical slices.

Primary design goals:

- explainable outputs
- deterministic heuristics
- low-risk additive architecture
- provider-swappable services
- safe fallback behavior

The architecture intentionally avoids:

- machine learning recommendation models
- opaque scoring systems
- uncontrolled personalization
- large schema rewrites

until the deterministic foundation is stable.

## Current System State

The FishDex intelligence pipeline currently operates as:

```text
conditions
  -> environmental scoring
  -> bite window detection
  -> species search
  -> species enrichment
  -> rig recommendation
  -> fight strategy
  -> catch logging
  -> catch analytics
  -> bounded rig personalization
```

Rig personalization currently supports:

- supporting signal
- tie-break adjustment
- one-rank adjustment

These behaviors have been verified and documented in `CODEX_README.md`.

Recent completed slices include:

- bounded rig personalization
- Bite Window Intelligence
- deterministic explanation contract

The system now has both:

- environment-driven intelligence
- user-history-driven refinement

The next architectural opportunity is runtime context awareness.

## Core Intelligence Pipeline

FishDex currently follows this pipeline:

```text
conditions
  -> environmental scoring
  -> bite window detection
  -> species search
  -> species enrichment
  -> rig recommendation
  -> fight strategy
  -> catch logging
  -> catch analytics
  -> bounded rig personalization
```

### Design Rule

Earlier layers must remain authoritative over later layers.

Examples:

- environmental constraints override personalization
- base rig rules override analytics modifiers
- providers never bypass service logic
- personalization must only reorder valid base candidates
- session intelligence must never bypass recommendation services

## Architectural Layers

FishDex uses a layered service architecture:

```text
controllers
   ↓
services
   ↓
providers
   ↓
external APIs
```

Example:

```text
species.controller
  -> species.service
     -> inat.provider
     -> speciesOrigin.service
        -> usgsNas.provider
```

Responsibilities:

| Layer | Responsibility |
| --- | --- |
| Controllers | HTTP endpoints |
| Services | business logic |
| Providers | external API adapters |
| External APIs | NOAA, iNaturalist, USGS |

This separation ensures providers can be replaced without rewriting the intelligence logic.

## Explainability Contract

All intelligence endpoints should return structured explanations.

Recommended structure:

```json
{
  "result": {},
  "explanation": {
    "baseReasons": [],
    "warnings": [],
    "modifiers": [],
    "metadata": {}
  }
}
```

Purpose:

- keep outputs explainable
- support UI explanation panels
- make personalization transparent

## Species Enrichment Strategy (Phase 11A)

Species enrichment adds metadata but does not alter recommendations.

Example enrichment:

```yaml
origin:
  status: native | introduced | invasive | unknown
```

Current provider:

- USGS NAS

Matching strategy:

- exact scientific name
- normalized scientific name
- alias / synonym mapping
- fallback unknown

The `Micropterus nigricans` / `Micropterus salmoides` taxonomy overlap is explicitly handled.

## Current Personalization Model

Rig personalization uses user catch history as a bounded signal.

Available signals:

- `rig_name`
- `bait_family`
- `landed`
- `species`

Example preference signal:

- Texas rig performs better for largemouth bass in the user's catch history

Personalization must never override:

- environmental constraints
- species-specific rig rules
- invalid presentations

### Personalization Thresholds

Recommended thresholds:

| Metric | Threshold |
| --- | --- |
| minimum structured catch history | 5 |
| minimum species-specific rig samples | 3 |
| strong signal threshold | 5 |
| landing rate advantage | >= 15 percentage points |
| landed count advantage | >= 2 |

If thresholds are not met:

- no personalization applied

Rig personalization currently follows this ladder:

1. evaluate signals
2. detect preference
3. tie-break if base candidates are tied
4. one-rank adjustment if strong evidence exists
5. otherwise supporting signal only

## Architecture Decision

FishDex will expand personalization gradually, keeping deterministic rules authoritative.

The next expansion should not introduce new recommendation layers yet.

Instead, the system should increase signal precision inside the existing rig personalization system.

## One-Rank Adjustment Guardrails

A one-rank adjustment may only occur when all conditions are satisfied.

### Strong Evidence Threshold

- species+rig samples >= 5
- landing rate advantage >= 15%
- landed count advantage >= 2

### Candidate Validity Rule

Personalization may only reorder rigs already returned by the base engine.

It may never introduce a new rig.

Example:

```text
Base candidates:
1 Texas rig
2 Jig
3 Carolina rig

Allowed adjustment:
1 Jig
2 Texas rig
3 Carolina rig
```

### Environmental Constraint Rule

Personalization must never violate environmental constraints.

Example:

- If heavy vegetation requires weedless rigs, a jig cannot be promoted.

### Base Score Gap Rule

One-rank adjustment is allowed only when:

- base score gap <= 0.20

This prevents personalization from overriding strong base recommendations.

### Maximum Influence Rule

Personalization may only move a rig up by one rank.

It may not:

- reorder the entire list
- promote lower-ranked candidates multiple levels

## Personalization Modifier Ladder

Rig personalization should evaluate in this order:

1. evaluate signals
2. detect preference
3. if candidates tied -> tie-break
4. if strong evidence + small base gap -> one-rank adjustment
5. otherwise -> supporting signal only

## Explanation Contract for One-Rank Adjustment

If adjustment occurs:

- `impact = "one_rank_adjustment"`

Example modifier:

```json
{
  "type": "personalization",
  "code": "one_rank_adjustment_applied",
  "impact": "one_rank_adjustment",
  "confidence": "high",
  "reason": "Your catch history for largemouth bass strongly favors Texas rig outcomes.",
  "evidence": {
    "species": "largemouth bass",
    "preferredRig": "Texas rig",
    "sampleSize": 7,
    "landingRate": 0.71,
    "runnerUpLandingRate": 0.40,
    "landingRateGap": 0.31,
    "landedCountGap": 3
  }
}
```

## Next Personalization Refinement

### Bait-Family-Aware Rig Personalization

After Session Mode, the next personalization-specific refinement should be bait-family-aware rig personalization.

The catch schema now captures:

- `species`
- `rig_name`
- `bait_family`
- `landed`

Current personalization evaluates:

- `species + rig_name`

The next personalization refinement layer should evaluate:

- `species + bait_family + rig_name`

Signal evaluation ladder:

1. `species + bait_family + rig_name`
2. `species + rig_name`
3. no personalization

This allows stronger signals when bait-family history exists while still falling back safely to the current rig-level model.

Behavior rules:

- bait-family refinement must follow the same guardrails as rig personalization
- allowed actions:
  - supporting signal
  - tie-break
  - one-rank adjustment
- forbidden actions:
  - introducing rigs not in the base candidate list
  - overriding environmental constraints
  - reordering more than one rank

Thresholds remain:

| Metric | Threshold |
| --- | --- |
| structured catch history | >= 5 |
| species+rig samples | >= 3 |
| strong evidence threshold | >= 5 |
| landing rate advantage | >= 15% |
| landed count advantage | >= 2 |

If bait-family samples do not meet threshold, fallback to:

- `species + rig` evaluation

Example modifier:

```json
{
  "type": "personalization",
  "code": "bait_family_preference",
  "impact": "one_rank_adjustment",
  "reason": "Your catch history for largemouth bass using creature baits favors Texas rig presentations.",
  "confidence": "high",
  "evidence": {
    "species": "largemouth bass",
    "baitFamily": "creature bait",
    "preferredRig": "Texas rig",
    "sampleSize": 6,
    "landingRate": 0.72
  }
}
```

## New Architectural Layer

### Phase 13 - Session Mode

Session Mode introduces a runtime intelligence container.

It allows FishDex to reason about an active fishing outing rather than isolated requests.

Purpose:

- add outing-level state
- tie together current intelligence and catch logging
- enable adaptive in-session recommendations

Updated conceptual pipeline:

```text
conditions
  -> environmental scoring
  -> bite window detection
  -> species search
  -> species enrichment
  -> rig recommendation
  -> fight strategy
  -> session runtime layer
  -> catch logging
  -> catch analytics
  -> bounded personalization
```

Session Mode should be implemented as an additive container around existing intelligence services, not as a rewrite of recommendation logic.

### Session Mode

Session Mode is a runtime state container around existing intelligence.

This layer should support:

- session start
- current intelligence snapshot
- bite-window context
- rig/fight recommendation
- outcome logging during session
- adaptive session suggestions
- session summary

Session Mode should be implemented in two slices.

### Phase 13A - Session Container

Goals:

- create sessions
- end sessions
- attach catches to sessions
- generate session summary

This slice does not introduce new intelligence logic.

### Phase 13B - Active Session Intelligence

When a session is active, the frontend should display:

- current bite window
- recommended rig
- recommended species
- current conditions
- last catch time

All values should come from existing endpoints. Session Mode orchestrates them.

After Phase 13A Session Container is implemented, Codex should continue with Phase 13B Active Session Intelligence unless a checkpoint trigger is hit.

### Session Resource

Introduce a new resource:

- `fishing_sessions`

Suggested schema fields:

- `id`
- `user_id`
- `name`
- `location_label`
- `species_focus`
- `started_at`
- `ended_at`
- `status`

Optional future fields:

- `latitude`
- `longitude`
- `water_type`
- `session_notes`

The schema should remain minimal in the first slice.

### Session Endpoints

Codex should introduce:

- `POST /api/sessions`
- `GET /api/sessions/active`
- `POST /api/sessions/:id/end`
- `GET /api/sessions/:id`

### Catch Integration

Catch records should optionally attach to sessions.

Add optional field:

- `session_id`

to:

- `POST /api/catches`

If a session is active, catches may automatically associate with it.

### Behavioral Guardrails

Session Mode must not:

- override recommendation engines
- introduce hidden logic
- change scoring systems
- duplicate intelligence services

Session Mode should only:

- store runtime context
- organize intelligence outputs
- enable session summaries

## Future Personalization Extensions

The following should not be implemented yet:

- fight strategy personalization
- seasonal fishing intelligence
- ML-based prediction

These require additional signals and should remain deferred.

## Architecture Invariants

These rules should always remain true:

- deterministic rules before machine learning
- external data failures must fall back safely
- base engines run before personalization
- personalization must always be explainable
- providers must remain replaceable

## When to Create a ChatGPT Checkpoint

Pause implementation and consult ChatGPT when:

- endpoint contracts change
- provider choice becomes unclear
- schema changes affect multiple services
- personalization logic expands beyond bounded modifiers
- new intelligence layers are introduced

Otherwise Codex should continue implementation.

## Current Next Step for Codex

Codex may implement Phase 13A Session Container without returning to ChatGPT.

Return to ChatGPT only if:

- session data model expands significantly
- recommendation logic begins depending on session data
- new intelligence layers are introduced

Otherwise development should continue with Phase 13B Active Session Intelligence.

## End of Strategy Document

This file preserves architecture decisions and design intent so FishDex can continue evolving even if development context is lost.

You can now give Codex:

- `CODEX_README.md`
- `CHATGPT_README.md`
- `INTELLIGENCE_MAP.md`

and it will have everything needed to continue.
