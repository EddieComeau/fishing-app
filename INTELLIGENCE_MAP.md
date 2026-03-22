# FishDex Intelligence Map

## Overview
FishDex is an explainable fishing intelligence system built as modular vertical slices. Its runtime pipeline is designed to stay deterministic, inspectable, and easy to extend without rewriting core recommendation behavior.

## Maintenance Rule

This file is a living architecture artifact.

Update it whenever any of the following change:

- runtime pipeline order
- service boundaries
- provider relationships
- endpoint responsibilities
- personalization placement in the system

It should stay aligned with `CODEX_README.md`, `CHATGPT_README.md`, and `DECISIONS.md`.

## System Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│                           FishDex Frontend                           │
│                                                                      │
│  User inputs / actions                                               │
│  - location / water / date context                                   │
│  - species search                                                    │
│  - request intelligence refresh                                      │
│  - submit catch                                                      │
│  - review catch history + analytics                                  │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTP / session cookie
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                           Express API Layer                          │
│                                                                      │
│  Routes / Controllers                                                │
│  - GET  /api/conditions                                              │
│  - GET  /api/species/search?q=                                       │
│  - POST /api/score/conditions                                        │
│  - GET  /api/bite-window                                             │
│  - POST /api/rig/recommend                                           │
│  - POST /api/fight/strategy                                          │
│  - POST /api/auth/register | login | logout                          │
│  - GET  /api/auth/me                                                 │
│  - POST /api/sessions                                                │
│  - GET  /api/sessions/active                                         │
│  - POST /api/sessions/:id/end                                        │
│  - GET  /api/sessions/:id                                            │
│  - POST /api/catches                                                 │
│  - GET  /api/catches                                                 │
│  - GET  /api/analytics/catches/summary                               │
└───────────────┬───────────────────────┬──────────────────────────────┘
                │                       │
                ▼                       ▼
┌──────────────────────────────┐   ┌───────────────────────────────────┐
│     Intelligence Services    │   │        Auth / Data Services      │
│                              │   │                                   │
│  Conditions Service          │   │  Auth Service                     │
│  Score Service               │   │  Catch Service                    │
│  Bite Window Service         │   │  Session Service                  │
│  Species Service             │   │  Analytics Service                │
│  Rig Service                 │   │                                   │
│  Fight Service               │   │                                   │
└───────┬───────────┬──────────┘   └───────────────────┬───────────────┘
        │           │                                  │
        ▼           ▼                                  ▼
┌──────────────┐  ┌──────────────────────┐   ┌──────────────────────────┐
│ Provider /   │  │ Deterministic Rule   │   │ Persistence Layer        │
│ Adapter      │  │ Engines              │   │                          │
│ Layer        │  │                      │   │ Postgres                 │
│              │  │ score heuristics     │   │ - users                  │
│ NOAA         │  │ rig heuristics       │   │ - sessions/auth state    │
│ iNaturalist  │  │ fight heuristics     │   │ - catches                │
│ USGS NAS     │  │ analytics summaries  │   │                          │
└──────────────┘  └──────────────────────┘   └──────────────────────────┘
```

## Runtime Intelligence Flow

1. Fetch and normalize conditions
2. Compute deterministic environmental score
3. Detect bite windows
4. Search candidate species
5. Enrich species metadata where available
6. Generate deterministic rig recommendation
7. Generate deterministic fight strategy
8. Store active outing context when session mode is used
9. Persist user catch outcomes
10. Summarize outcomes into analytics
11. Use analytics later only as bounded, explainable modifiers

## Planned Expansion Direction

The next approved architecture slice after the current bite-window slice is:

- Session Mode (Phase 13A)

This is a future architectural direction, not implemented behavior.

## Explainable Intelligence View

```text
conditions
   ↓
normalized conditions
   ↓
environmental score
   ↓
species search / candidate species
   ↓
species origin enrichment
   ↓
rig recommendation
   ↓
fight strategy
   ↓
catch logging
   ↓
catch analytics
   ↓
future bounded refinement layers
```

## Planned Future Pipelines

### Current Bite Window Layer

```text
conditions
   ↓
normalized conditions
   ↓
environmental score
   ↓
bite window detection
   ↓
species search / candidate species
   ↓
species origin enrichment
   ↓
rig recommendation
   ↓
fight strategy
   ↓
catch logging
   ↓
catch analytics
   ↓
bounded personalization
```

### Current Session Container Layer

```text
conditions
   ↓
environmental score
   ↓
bite window detection
   ↓
species search / candidate species
   ↓
species origin enrichment
   ↓
rig recommendation
   ↓
fight strategy
   ↓
session runtime layer
   ↓
catch logging
   ↓
catch analytics
   ↓
bounded personalization
```

### Planned Session Container Responsibilities

```text
POST /api/sessions
        │
        ▼
sessions.controller
        │
        ▼
sessions.service
        │
        ├── create active session
        ├── end active session
        ├── summarize session catches
        └── attach existing intelligence context
```

Session Mode should orchestrate existing services rather than duplicate score, rig, fight, or bite-window logic.
The current session container can also store bite-window context captured at session start for deterministic summary output.

## Current Service Boundaries

### Species Search + Enrichment

```text
GET /api/species/search?q=
        │
        ▼
species.controller
        │
        ▼
species.service
        │
        ├──► inat.provider
        │         │
        │         ▼
        │    base species results
        │
        └──► speciesOrigin.service
                  │
                  ├── normalize names
                  ├── deterministic matching
                  └── enrich results
                           │
                           ▼
                    usgsNas.provider
```

Phase 11A adds species-origin enrichment as an additive layer only. It does not change scoring, rig, or fight behavior in the first slice.

### Future-safe Recommendation Boundary

```text
POST /api/rig/recommend
        │
        ▼
rig.controller
        │
        ▼
rig.service
        │
        ├──► base rig rules engine
        │
        └──► personalization/refinement layer
                    │
                    └── uses catch analytics signals only if:
                        - authenticated
                        - enough sample size
                        - bounded modifier allowed
```

That future refinement layer is additive only and must never replace the base rules engine.

Current bounded behaviors in this layer:

- supporting-signal evaluation
- tie-break selection between exactly tied top candidates
- one-rank adjustment when strong evidence exists and the base-score gap remains narrow

## API / Layer Purpose

### 1) Environmental Data Providers
Input: lat/lng, water type, tide station context.
Output: raw weather, tide, and alert observations.
Why: provides real-world environmental context.

### 2) Conditions API Layer (`GET /api/conditions`)
Input: client spot and context parameters.
Output: normalized environmental payload with source metadata.
Why: centralizes provider orchestration, caching, and stable contracts.

### 3) Normalization Layer
Input: mixed provider payloads.
Output: shared conditions shape consumed by downstream services.
Why: keeps the rest of the system provider-agnostic.

### 4) Environmental Scoring Engine (`POST /api/score/conditions`)
Input: normalized weather/tide plus water/access context.
Output: score, confidence, regime label, reasons, warnings, and breakdown.
Why: creates an explainable environmental readiness signal.

### 5) Bite Window Intelligence (`GET /api/bite-window`)
Input: normalized conditions context including spot, tide timing, and pressure trend when available.
Output: activity score, activity level, current window, next window, and structured explanation.
Why: adds deterministic time-of-day feeding context before recommendations.

### 6) Species Intelligence (`GET /api/species/search`)
Input: species query text.
Output: normalized species candidates, plus origin metadata when available.
Why: drives target selection and species-aware intelligence.

### 7) Rig Recommendation Engine (`POST /api/rig/recommend`)
Input: water/access/conditions with optional species context.
Output: rigName, rod, line, leader, snagRisk, reasons.
Why: turns environmental and target context into tackle guidance.

Current refinement order inside this boundary:

1. base candidate ranking
2. personalization signal evaluation
3. tie-break when candidates are exactly tied
4. one-rank adjustment when evidence is strong and the preferred rig is already next in line

### 8) Fight Strategy Engine (`POST /api/fight/strategy`)
Input: water/access/conditions with optional rig/species context.
Output: pressurePlan, dragGuidance, landingTips, riskFactors, reasons.
Why: translates hook-up situations into actionable landing guidance.

### 9) Catch Persistence (`POST /api/catches`, `GET /api/catches`)
Input: authenticated catch records, now with optional `session_id`.
Output: durable catch history tied to a user.
Why: stores the outcome data needed for analytics and future personalization.

### 10) Session Container (`POST /api/sessions`, `GET /api/sessions/active`, `POST /api/sessions/:id/end`, `GET /api/sessions/:id`)
Input: authenticated outing context such as session name, location label, and species focus.
Output: active-session state and deterministic session summaries, including stored bite-window-at-start context when available.
Why: adds short-term runtime context around existing intelligence without replacing recommendation engines.

### 11) Personal Catch Analytics (`GET /api/analytics/catches/summary`)
Input: authenticated user context.
Output: total catches, landed count, landing rate, top species, top baits, insights.
Why: closes the first feedback loop from outcomes back into the product.

## Portfolio-friendly Summary

```text
External conditions data  -> normalize -> score
Time-window context       -> bite window detection
External species data     -> search -> enrich
Score + species context   -> rig rules -> fight rules
Active outing context     -> session container -> deterministic session summary
User catch outcomes       -> analytics -> future bounded refinements
```

## Design Principles
- Explainable recommendations over opaque outputs
- Deterministic heuristics before complexity
- Source and provenance visibility where possible
- Provider-swappable service boundaries
- Additive vertical slices with low contract risk
- Personalization only as bounded modifier layers
