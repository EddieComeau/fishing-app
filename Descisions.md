DECISIONS.md
# DECISIONS.md

## Purpose

This file records **major architecture decisions made during FishDex development**.

Unlike `CODEX_README.md`, this file does **not track implementation state**.

Instead it records:

- architecture decisions
- reasoning behind those decisions
- consequences for future development

This allows future contributors (or future sessions with ChatGPT/Codex) to understand **why the system was designed a certain way**.

Implementation verification always belongs in:
CODEX_README.md

Architecture guidance belongs in:
CHATGPT_README.md

---

# Decision Index

| ID | Decision | Phase | Date |
|----|---------|------|------|
| D001 | Deterministic intelligence architecture | Initial design | 2026 |
| D002 | Layered service architecture (controllers → services → providers) | Early architecture | 2026 |
| D003 | Explainability contract for all intelligence endpoints | Phase 4–7 | 2026 |
| D004 | Species enrichment via external provider | Phase 11A | 2026 |
| D005 | Rig personalization as bounded modifier layer | Phase 11B | 2026 |
| D006 | Tie-break personalization allowed | Phase 11B slice 2 | 2026 |
| D007 | One-rank adjustment allowed with strict guardrails | Phase 11B slice 3 | 2026 |

---

# D001 — Deterministic Intelligence Architecture

### Decision
FishDex will be built using **deterministic rule-based intelligence** before introducing any machine learning.

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

---

# D002 — Layered Service Architecture

### Decision

FishDex uses the architecture:
controllers
↓
services
↓
providers
↓
external APIs

### Reason

This allows:

- provider replacement
- separation of concerns
- easier testing
- easier debugging

### Consequences

External APIs must **never be called directly from controllers**.

All external data must pass through provider adapters.

---

# D003 — Explainability Contract

### Decision

All intelligence endpoints must return structured explanations.

### Standard structure

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
Reason
This ensures:
UI explanation panels work consistently
personalization remains transparent
debugging is easier
D004 — Species Origin Enrichment
Decision
Species search results are enriched using external metadata providers.
Initial provider:
USGS NAS
Reason
Allows FishDex to show:
native
introduced
invasive
unknown
without changing the core recommendation engine.
Consequences
Species enrichment must remain additive and non-breaking.
Base species search results must still return if enrichment fails.
D005 — Rig Personalization as Modifier Layer
Decision
User catch history may influence rig recommendations only as a bounded modifier layer.
Rules
Personalization:
must run after base recommendation
must never override environmental constraints
must never introduce invalid rigs
Reason
This keeps FishDex explainable and prevents recommendation drift.
D006 — Tie-Break Personalization
Decision
Personalization may break ties between near-equal base rig candidates.
Example
Base candidates:
Texas rig
Jig
If both are nearly equal and user history favors Texas rig, it becomes the winner.
Reason
Tie-break personalization is low risk and easy to explain.
D007 — One-Rank Adjustment
Decision
FishDex allows bounded one-rank adjustment when strong evidence exists.
Guardrails
Adjustment allowed only when:
species+rig samples ≥ 5
landing rate advantage ≥ 15%
landed count advantage ≥ 2
base candidate score gap ≤ 0.20
Restrictions
Personalization may:
move a rig up by one rank
Personalization may not:
reorder the entire candidate list
override environmental constraints
introduce new rigs
Reason
This allows FishDex to adapt to user experience without overpowering the base rule engine.
Future Decision Areas
Future architecture decisions may include:
bait-family-aware rig refinement
fight strategy personalization
seasonal intelligence signals
potential ML introduction
These decisions should be recorded here when made.
End of Decisions Log

---

# Your final documentation system

Your repo will now have **four key continuity files**:
CODEX_README.md
CHATGPT_README.md
INTELLIGENCE_MAP.md
DECISIONS.md

Each has a clear role:

| File | Role |
|-----|------|
| CODEX_README.md | verified implementation state |
| CHATGPT_README.md | architecture strategy |
| INTELLIGENCE_MAP.md | system design |
| DECISIONS.md | architecture decision history |

This is **a very professional documentation structure** and would look completely normal in a serious engineering project.

---

If you want, I can also show you **one final small improvement** that will make Codex dramatically less likely to introduce architecture drift as the project grows.