# AI Admin Surface Consolidation Matrix

**Program:** AI Architecture Phase 4B  
**Date:** 2026-07-12  
**Status:** Active  
**Source of Truth for:** Disposition of Admin Portal AI surfaces

---

## Canonical product

**Admin Portal → AI & Diagnostics → AI Pipeline** (`/admin-portal/ai-pipeline`)

Phase 3 intelligence capabilities and Phase 4 operational workflows are presented **inside this hub**. There is no separate “AI Operations Center” product.

---

## Disposition matrix

| Surface | Route | Nav | Purpose | Data | Overlap | Disposition |
|---------|-------|-----|---------|------|---------|-------------|
| AI Pipeline Hub | `/admin-portal/ai-pipeline` | AI Pipeline | Canonical operator shell | Pipeline + intelligence overview | — | **RETAIN** (canonical) |
| Response Diagnostics | `…/ai-pipeline/diagnostics` | Diagnostics | Trace/evidence | AIPipelineDiagnostic | Executions (different grain) | **RETAIN** |
| Test Lab | `…/ai-pipeline/test-lab` | via Diagnostics active-id | Dry-run twin | Test-lab APIs | Replay (prep only) | **RETAIN** |
| Quality & Enforcement | `…/ai-pipeline/quality` | Hub card | Weak phrases / enforcement | Pipeline quality | Metrics (complement) | **RETAIN** |
| Intents / Grounding / Sources / Tools | `…/ai-pipeline/{intents,grounding,sources,tools}` | Hub cards | Policy registry | Pipeline policies | — | **RETAIN** |
| Audit / Compliance | `…/ai-pipeline/{audit,compliance}` | Hub cards | Policy audit / retention | Pipeline | — | **RETAIN** |
| Provider Governance | `…/ai-pipeline#provider-governance` | Providers section | LLM spend/health | `/api/admin/ai-providers` | — | **RETAIN** |
| Execution Explorer | `…/ai-pipeline/executions` | Operator subnav | AIExecutionRecord browser | Phase 3 hub | Diagnostics | **EXTEND** (from Phase 4) |
| Evaluations | `…/ai-pipeline/evaluations` | Operator subnav | Evaluation queue | AIEvaluation | — | **EXTEND** |
| Corrections | `…/ai-pipeline/corrections` | Operator subnav | Correction proposals | AICorrectionRoute | — | **EXTEND** |
| Regressions | `…/ai-pipeline/regressions` | Operator subnav | Regression library | AIRegressionCase | — | **EXTEND** |
| Platform Metrics | `…/ai-pipeline/metrics` | Operator subnav | Intelligence metrics | Phase 3 aggregations | Quality page | **MERGE** (one metrics UX + quality retained) |
| Replay Preparation | `…/ai-pipeline/replay` | Operator subnav | Replay preview | Replay contract | Test Lab | **EXTEND** |
| System Health | `…/ai-pipeline/system-health` | Operator subnav | Unified health | Ops health + links to quality/providers | Phase 4 health | **MERGE** |
| Settings | `…/ai-pipeline/settings` | Operator subnav | Access + config links | Docs + policy links | Phase 4 settings | **MERGE** |
| AI Operations Center (Phase 4) | `/admin-portal/ai/operations/*` | Removed | Former parallel product | Same intelligence APIs | Pipeline hub | **REDIRECT** |
| AI Learning (legacy) | `/admin-portal/ai-learning` | Removed | Centralized AI | — | — | **REDIRECT** → Pipeline |
| AI Context (legacy) | `/admin-portal/ai-context` | Removed | Context debug | — | — | **REDIRECT** → Diagnostics |
| AI System (legacy) | `/admin-portal/ai-system` | Removed | Old launcher | — | — | **REDIRECT** → Pipeline |
| Business AI admin | `/admin-portal/business-ai` | Unlisted | Cross-tenant business AI | Business AI APIs | Not platform ops | **RETAIN** (separate; do not absorb) |
| Personal AI Identity | `/ai` | Customer | User twin UI | Twin | — | **RETAIN** (customer; do not absorb) |

---

## API disposition

| API | Disposition |
|-----|-------------|
| `/api/admin-portal/ai-pipeline/*` | **RETAIN** — pipeline control plane |
| `/api/admin/ai/operations/*` | **RETAIN** — intelligence workflow data API (UI lives in Pipeline) |
| `/api/admin/ai-providers/*` | **RETAIN** — provider satellite |
| `/api/admin/business-ai/*` | **RETAIN** — business product; not merged into Pipeline |

No duplicated service logic. Product shell ≠ API domain.

---

## Component disposition

| Component path | Disposition |
|----------------|-------------|
| `ai-pipeline/*` | **RETAIN** — shell ownership |
| `ai-operations/*` (tables, badges, metric grid, timeline) | **REUSE** from Pipeline pages (temporary co-location) |
| `AiOperationsLayoutShell` / `AiOperationsSubNav` | **DEFER_RETIREMENT** — unused by redirects; PipelineOperatorSubNav is SoT |
| `PipelineOperatorSubNav` | **RETAIN** — canonical section nav |
| `PipelineIntelligenceOverviewStrip` | **RETAIN** — hub overview merge |

---

## Related

- [`AI_PIPELINE_OPERATOR_INFORMATION_ARCHITECTURE.md`](./AI_PIPELINE_OPERATOR_INFORMATION_ARCHITECTURE.md)
- [`AI_PHASE4B_ADMIN_CONSOLIDATION_CLOSEOUT.md`](./AI_PHASE4B_ADMIN_CONSOLIDATION_CLOSEOUT.md)
