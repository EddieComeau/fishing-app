# DECISIONS.md

## Purpose

This file records major architecture decisions made during FishDex development.

Unlike `CODEX_README.md`, this file does not track implementation state.

It records:

- architecture decisions
- reasoning behind those decisions
- consequences for future development

This allows future contributors, ChatGPT sessions, and Codex sessions to understand why the system was designed a certain way.

Implementation verification always belongs in:

- `CODEX_README.md`

Architecture guidance belongs in:

- `CHATGPT_README.md`

## Maintenance Rule

This is a living decision log.

Update it whenever:

- a new architecture decision is made
- an existing decision is clarified
- a previous decision is reversed
- a temporary implementation constraint becomes a formal rule

If the system changes structurally, keep this file aligned with `CHATGPT_README.md`, `INTELLIGENCE_MAP.md`, and `CODEX_README.md`.

## Decision Index

| ID | Decision | Phase | Date |
| --- | --- | --- | --- |
| D001 | Deterministic intelligence architecture | Initial design | 2026 |
| D002 | Layered service architecture (`controllers -> services -> providers`) | Early architecture | 2026 |
| D003 | Explainability contract for all intelligence endpoints | Phases 4-7 | 2026 |
| D004 | Species enrichment via external provider | Phase 11A | 2026 |
| D005 | Rig personalization as bounded modifier layer | Phase 11B | 2026 |
| D006 | Tie-break personalization allowed | Phase 11B slice 2 | 2026 |
| D007 | One-rank adjustment allowed with strict guardrails | Phase 11B slice 3 | 2026 |
| D008 | Product-first roadmap after bounded rig personalization | Post-Phase 11B | 2026 |
| D009 | Bite Window Intelligence added before recommendations | Phase 12 | 2026 |
| D010 | Session Mode added as a runtime container around existing intelligence | Phase 13 | 2026 |

## D001 - Deterministic Intelligence Architecture

### Decision

FishDex will be built using deterministic rule-based intelligence before introducing any machine learning.

### Reason

Explainable outputs are required for:

- debugging
- user trust
- portfolio readability
- stable recommendation behavior

### Consequences

FishDex will rely on:

- heuristic scoring
- explicit recommendation rules
- transparent modifiers

Machine learning is intentionally deferred.

## D002 - Layered Service Architecture

### Decision

FishDex uses the architecture:

```text
controllers
-> services
-> providers
-> external APIs
```

### Reason

This allows:

- provider replacement
- separation of concerns
- easier testing
- easier debugging

### Consequences

External APIs must never be called directly from controllers.

All external data must pass through provider adapters.

## D003 - Explainability Contract

### Decision

All intelligence endpoints must return structured explanations.

### Standard Structure

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

### Reason

This ensures:

- UI explanation panels work consistently
- personalization remains transparent
- debugging is easier

## D004 - Species Origin Enrichment

### Decision

Species search results are enriched using external metadata providers.

Initial provider:

- USGS NAS

### Reason

This allows FishDex to show:

- native
- introduced
- invasive
- unknown

without changing the core recommendation engine.

### Consequences

Species enrichment must remain additive and non-breaking.

Base species search results must still return if enrichment fails.

## D005 - Rig Personalization as Modifier Layer

### Decision

User catch history may influence rig recommendations only as a bounded modifier layer.

### Rules

Personalization:

- must run after the base recommendation
- must never override environmental constraints
- must never introduce invalid rigs

### Reason

This keeps FishDex explainable and prevents recommendation drift.

## D006 - Tie-Break Personalization

### Decision

Personalization may break ties between base rig candidates that are exactly tied on score.

### Example

Base candidates:

- Texas rig
- Jig

If both are tied and user history favors Texas rig, it becomes the winner.

### Reason

Tie-break personalization is low risk and easy to explain.

## D007 - One-Rank Adjustment

### Decision

FishDex allows bounded one-rank adjustment when strong evidence exists.

### Guardrails

Adjustment is allowed only when:

- species+rig samples >= 5
- landing rate advantage >= 15%
- landed count advantage >= 2
- base candidate score gap <= 0.20

### Restrictions

Personalization may:

- move a rig up by one rank

Personalization may not:

- reorder the entire candidate list
- override environmental constraints
- introduce new rigs

### Reason

This allows FishDex to adapt to user experience without overpowering the base rule engine.

## D008 - Product-First Roadmap After Phase 11B

### Decision

After bounded rig personalization stabilizes, FishDex should prioritize:

1. Bite Window Intelligence
2. Session Mode
3. Bait-family-aware rig refinement

### Reason

This order improves user-facing decision quality faster than deepening personalization first.

- bite windows improve "what now"
- session mode improves outing-level usefulness
- bait-family refinement can then deepen personalization inside a stronger runtime loop

### Consequences

- Bite Window Intelligence should be implemented as an additive deterministic layer before recommendations
- Session Mode should be implemented as a runtime container around existing intelligence, not a rewrite
- Bait-family refinement remains the next personalization-specific extension, but not the first product-level expansion

## D009 - Bite Window Intelligence Before Recommendations

### Decision

FishDex adds Bite Window Intelligence as a deterministic layer between environmental scoring and species search.

### Reason

This allows FishDex to answer a time-aware question without introducing ML:

- what should I throw right now

### Consequences

- the runtime pipeline now includes bite-window detection before species search
- Bite Window Intelligence remains additive and explainable
- Session Mode is now the next major architecture checkpoint after Phase 12

## D010 - Session Mode As Runtime Container

### Decision

FishDex will add Session Mode as a runtime container around existing intelligence services.

### Reason

FishDex already has:

- environmental intelligence
- long-term user behavior intelligence

It lacks short-term outing intelligence. Session Mode adds that missing runtime context without rewriting the engines.

### Consequences

- Session Mode must call existing recommendation services rather than duplicate them
- Phase 13A should stay minimal:
  - create sessions
  - end sessions
  - attach catches to sessions
  - generate deterministic session summaries
- recommendation engines must remain authoritative over any session-level orchestration

## Future Decision Areas

Future architecture decisions may include:

- bait-family-aware rig refinement after Session Mode
- fight strategy personalization
- seasonal intelligence signals
- potential ML introduction

These decisions should be recorded here when made.

## End of Decisions Log

## Documentation System

FishDex now has four key continuity files:

- `CODEX_README.md`
- `CHATGPT_README.md`
- `INTELLIGENCE_MAP.md`
- `DECISIONS.md`

Each has a clear role:

| File | Role |
| --- | --- |
| `CODEX_README.md` | verified implementation state |
| `CHATGPT_README.md` | architecture strategy |
| `INTELLIGENCE_MAP.md` | system design |
| `DECISIONS.md` | architecture decision history |
