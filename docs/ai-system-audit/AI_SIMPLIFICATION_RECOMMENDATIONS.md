# AI Simplification Recommendations

**Date:** 2026-07-12  
**Categories:** RETAIN · CLARIFY · DOCUMENT · RENAME · CONSOLIDATE · REFACTOR · DEPRECATE · REMOVE_LATER · REPLACE · ADD_GUARDRAIL · ADD_TEST · ADD_OBSERVABILITY · NO_ACTION  

---

## Retain (necessary)

| Item | Why |
|------|-----|
| DigitalLifeTwinService / Core split | Clear preload vs turn orchestration |
| ContextProviderOrchestrator + registry | Module contract |
| Pipeline catalog / grounding / enforcement | Safety |
| Conversation reasoning | Understanding without over-acting |
| PreferenceResolver + memory facts | Governed influence |
| Provider adapters + capability matrix | Provider independence seam |
| toolExecutor via domain services | AuthZ |
| Knowledge composition (`server/src/knowledge`) | Assemble don’t duplicate |
| Ambient suggestions parallel path | Non-blocking UX |
| Admin AI Pipeline hub | Operator plane |

---

## Clarify / Document / Rename

| Item | Action | Effort |
|------|--------|--------|
| CrossModuleContextEngine name | CLARIFY as facade; optional RENAME later | S |
| Knowledge Engine location | DOCUMENT `src/knowledge` vs empty `ai/knowledge` | S |
| Autonomy UI vs runtime | CLARIFY copy — settings ≠ autopilot | S |
| Decision Model vs engines | DOCUMENT (this audit) | S |
| Notebook exemption | DOCUMENT SPECIALIZED path | S |
| Deep-dive orphan surfaces | DOCUMENT superseded entries | S |

---

## Consolidate (later, carefully)

| Item | Notes | Risk |
|------|-------|------|
| Vision helpers into matrix | capabilities.ts overlap | Low |
| Admin debug → pipeline only | ai-context-debug | Low |
| Learning API surfaces | Advanced vs personal vs centralized narratives | Medium |
| ActionExecutor onto same services as tools | Wave E-01 | Medium |

**Do not consolidate** orchestrator into Core, or Knowledge Decision Model into a god service, or providers into Core.

---

## Deprecate / Remove later

| Item | Category | Prerequisites |
|------|----------|---------------|
| `POST /api/ai/chat` | DEPRECATE → REMOVE_LATER | Confirm zero clients |
| `/api/ai/autonomous/*` | Already retired | Remove handlers/UI |
| AutonomousActionExecutor | REMOVE_LATER | Grep gate |
| ai/analytics/* orphans | REMOVE_LATER | Schema review |
| AutoML / AIModelManagement / WorkflowAutomation | REMOVE_LATER | Schema review |
| DecisionEngine if stays inert | REMOVE_LATER or REPLACE with real planner | Product call |
| Frontend orphans | REMOVE_LATER | Confirm product |
| Personality/autonomy shims on ai.ts | DEPRECATE | Clients on dedicated routers |
| ContinuousLearning scaffolds | REMOVE_LATER with parents | — |

---

## Refactor (not Phase 0)

| Item | Category | Why wait |
|------|----------|----------|
| Split DigitalLifeTwinCore stages | REFACTOR | High blast radius; needs tests T-01 first |
| ModelTier routing | REPLACE heuristic | Needs ADR + catalog config |
| Unified AiExecutionRecord | ADD_OBSERVABILITY | Phase 4 |

---

## Add guardrails / tests / observability

| Item | Category |
|------|----------|
| Tool side-effect approval policy | ADD_GUARDRAIL + CONFIRM-01 |
| Twin E2E + fallback + reasoning tests | ADD_TEST |
| Hardcoded model lint (except catalog/adapters) | ADD_GUARDRAIL |
| Execution record for twin+notebook | ADD_OBSERVABILITY |

---

## Do not touch

| Item | Reason |
|------|--------|
| Module context provider HTTP contract | Platform interoperability |
| Pipeline enforcement semantics | Safety |
| Tenant scoping rules | Trust boundary |
| Provider adapter isolation | Portability |
| Knowledge review gates | Constitution |

---

## Recommended sequence

### Phase 0 — Documentation (no runtime behavior)

- Objective: SoT cleanup, naming, surface maps  
- Changes: docs only (this package + banners on conflicts)  
- Risks: low  
- Exit: Navigation guide points here; CONF-* listed  
- ADR: not required  

### Phase 1 — Retire disconnected / obsolete

- Objective: Remove or fence orphans safely  
- Changes: dead engines, autonomous UI, deprecated routes after tests  
- Files: `server/src/ai/analytics/*`, actions, routes, web orphans  
- Dependencies: Phase 0 + grep gates + schema hold  
- Risks: accidental delete of reflected Prisma-only features  
- Tests: import/boot smoke; retirement redirects  
- Exit: zero production imports to deleted modules  
- ADR: optional for schema drops  

### Phase 2 — Consolidate true duplicates / ownership

- Objective: Canonical owners for learning APIs, debug, action services  
- Dependencies: Phase 1  
- Risks: medium  
- ADR: for learning API consolidation  

### Phase 3 — Provider-neutral task routing

- Objective: ModelTier + config maps; migrate SPECIALIZED paths  
- Files: providerRouting, modelCatalog, notebook/extraction  
- Risks: cost/quality shifts  
- Tests: routing table + fallback  
- ADR: **required**  

### Phase 4 — Observability & cost

- Objective: AiExecutionRecord, routing explanations, regression monitors  
- ADR: optional  

### Phase 5 — Selective new provider capabilities

- Objective: caching, effort, advanced tools — behind adapters  
- ADR: **required** per capability  

---

## Example recommendation records

### REC-01 — Core over-breadth

| Field | Value |
|-------|-------|
| Problem | Core owns too many layers |
| Evidence | ~2575 LOC processAsDigitalTwin |
| Why it matters | Change risk, onboarding cost |
| Action | REFACTOR later into staged pipeline |
| Components | DigitalLifeTwinCore |
| Migration risk | High |
| User impact | None if behavior-preserving |
| Effort | L |
| Prerequisites | T-01 E2E tests |
| Tests | Full twin pack |
| Rollback | Branch revert |
| Product code change? | Yes (later) |
| Confidence | H |

### REC-02 — Orphan analytics engines

| Field | Value |
|-------|-------|
| Problem | Dead code implies false capabilities |
| Evidence | Zero production imports |
| Action | REMOVE_LATER |
| Migration risk | Low–Med (Prisma tables) |
| Product code change? | Yes (later) |
| Confidence | H |

### REC-03 — Task-tier routing

| Field | Value |
|-------|-------|
| Problem | Hardcoded provider heuristics + model names in side paths |
| Evidence | providerRouting complexity; notebook/extraction hardcodes |
| Action | REPLACE with ModelTier config (Phase 3) |
| Product code change? | Yes (later) |
| Confidence | H |
