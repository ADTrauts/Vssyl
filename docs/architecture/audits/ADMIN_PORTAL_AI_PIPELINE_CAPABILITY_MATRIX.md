# Admin Portal — AI Pipeline Capability Matrix

**Package:** 0D-D — AI Pipeline Consolidation  
**Initiative:** AP-AI-02  
**Date:** 2026-06-17

---

## Capability matrix

| Capability | Owner | Implementation status | UI surface | API surface |
|------------|-------|----------------------|------------|-------------|
| **Pipeline configuration** | AI Pipeline | **Production** | Hub + `PipelineEnforcementSettings` | `PUT /policies/settings`, `GET /catalog` |
| **Policies (intents)** | AI Pipeline | **Production** | `/ai-pipeline/intents` | `POST/PUT /policies/intents/*` (7 routes) |
| **Policies (grounding)** | AI Pipeline | **Production** | `/ai-pipeline/grounding` | `POST/PUT /policies/grounding/*` (8 routes) |
| **Policies (sources)** | AI Pipeline | **Production** | `/ai-pipeline/sources` | `POST/PUT /policies/sources/*` (8 routes) |
| **Policies (tools)** | AI Pipeline | **Production** | `/ai-pipeline/tools` | `POST/PUT /policies/tools/*` (8 routes) |
| **Registry graph & validation** | AI Pipeline | **Production** | Registry panels on intents/grounding/sources/tools | `GET /registry/graph`, `POST /registry/validate` |
| **Providers (LLM billing)** | Provider Governance satellite | **Production** | Hub `#provider-governance` | `/api/admin/ai-providers/*` (8) — 0D-C |
| **Context sources (runtime)** | AI Pipeline | **Production** | Sources page + trace detail | Catalog + grounding retrieval services |
| **Grounding rules** | AI Pipeline | **Production** | Grounding page + diagnostics evidence | Policy routes + `pipelineGroundingRetrieval` |
| **Diagnostics (traces)** | AI Pipeline | **Production** | `/ai-pipeline/diagnostics` | `GET /diagnostics`, `GET /diagnostics/:traceId`, evidence, export |
| **Diagnostics (legacy debug)** | ai-context-debug | **Duplicate** | `/admin-portal/ai-context` (5 tabs) | `/api/ai-context-debug` (6) — **0D-E merge** |
| **Evaluations (test lab)** | AI Pipeline | **Production** | `/ai-pipeline/test-lab` | `POST /test-lab` |
| **Evaluations (suggestions)** | AI Pipeline | **Production** | `SuggestionCorrelationDryRunPanel` | `POST /suggestions/dry-run`, `GET /suggestions/metrics` |
| **Monitoring (hub health)** | AI Pipeline | **Production** | Hub metrics, live feed, at-risk trends | `GET /catalog`, `GET /quality/stats`, diagnostics list |
| **Monitoring (quality)** | AI Pipeline | **Production** | `/ai-pipeline/quality` | `GET /quality/stats` |
| **Overrides (enforcement)** | AI Pipeline | **Production** | Quality page + hub badge | `PUT /policies/settings` (enforcement mode) |
| **Testing (dry-run)** | AI Pipeline | **Production** | Test lab panel | `POST /test-lab` |
| **Testing (module context)** | AI Pipeline | **Production** | `ContextProviderHealthPanel` | `POST /context-providers/health` |
| **Audit log** | AI Pipeline | **Production** | `/ai-pipeline/audit` | `GET /audit` |
| **Compliance (retention)** | AI Pipeline | **Production** | `/ai-pipeline/compliance` | `GET/PUT /retention`, `POST /retention/purge`, export |
| **Business AI** | Business AI satellite | **Production** | `/admin-portal/business-ai` | `/api/admin/business-ai/*` — out of pipeline scope |
| **Platform analytics** | Analytics (0C) | **Production** | `/admin-portal/analytics` | Platform analytics routes — out of scope |

---

## Status legend

| Status | Meaning |
|--------|---------|
| **Production** | Live UI + API; operators can use today |
| **Duplicate** | Overlapping legacy path — retirement planned |
| **Satellite** | Real feature on separate mount; linked from pipeline |
| **Deprecated** | Retired / 410 |

---

## Gap summary (feeds 0D-E / 1B)

| Gap | Capability | Blocked by |
|-----|------------|------------|
| No HTTP integration tests | All pipeline API | AP-F-030 — 0D-E |
| ai-context-debug duplication | Diagnostics | AP-F-029 — 0D-E |
| Thin route file (1,322 LOC) | All API | 1B service extraction |
| ai-system transitional launcher | Navigation | 0D-F full launcher refactor |

---

## AP-AI-02 alignment

All **policy, registry, diagnostics, evaluation, compliance** capabilities are owned by AI Pipeline with matching UI and API surfaces. The only material duplicate is **ai-context-debug** (documented, not touched in 0D-D).
