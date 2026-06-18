# Admin Portal — AI UX Ownership Model

**Package:** 0D-F — AI Control Plane UX Consolidation  
**Date:** 2026-06-17  
**Authority:** Post-0D-F operator UX boundaries

---

## Ownership table

| Capability | Owner (domain) | Route | UI owner |
|------------|----------------|-------|----------|
| **AI control plane hub** | AI Pipeline | `/admin-portal/ai-pipeline` | `PipelineOperationsHub`, `PipelineHubToolSections` |
| **Diagnostics / response forensics** | AI Pipeline | `/admin-portal/ai-pipeline/diagnostics` | `AiPipelineDiagnosticsPage`, `PipelineTraceTable`, `PipelineTraceDetail` |
| **Evaluation / test lab** | AI Pipeline | `/admin-portal/ai-pipeline/test-lab` | Test lab subpages + fixtures |
| **Provider governance** | AI Pipeline (governance panel) | `/admin-portal/ai-pipeline#provider-governance` | `ProviderGovernancePanel` |
| **Pipeline catalog & policies** | AI Pipeline | `/admin-portal/ai-pipeline/*` | Pipeline sub-shell pages |
| **Business AI global** | Business AI (satellite) | `/admin-portal/business-ai` | `BusinessAIGlobalDashboard` |
| **AI launcher** | Admin Portal (transitional) | `/admin-portal/ai-system` | `ai-system/page.tsx` (cards + quick actions only) |
| **Module AI certification** | Module governance | `/admin-portal/modules` (ai-context tab) | `modules/page.tsx` |
| **Legacy context debug UI** | — (retired) | `/admin-portal/ai-context` → redirect | Redirect stub only |
| **Legacy centralized learning UI** | — (retired) | `/admin-portal/ai-learning` → redirect | Redirect stub only |

---

## Verification matrix (0D-F)

| Requirement | Expected owner | Verified |
|-------------|----------------|----------|
| Diagnostics → Pipeline | `ai-pipeline/diagnostics` | **Yes** |
| Evaluation → Pipeline | `ai-pipeline/test-lab` | **Yes** |
| Providers → Pipeline Governance | `ai-pipeline#provider-governance` | **Yes** |
| Business AI → Business AI | `business-ai` | **Yes** (unchanged) |
| Legacy ai-context → Redirect | `ai-pipeline/diagnostics` | **Yes** |
| Legacy ai-learning → Redirect | `ai-pipeline` | **Yes** (0D-B) |

---

## Transitional assets (not UX owners)

| Asset | Role | Next phase |
|-------|------|------------|
| `/api/ai-context-debug` | API with Deprecation headers | Mount shrink 0D-G / 1B |
| `ai-system` embedded analytics charts | Overview context only | Optional strip in 0D-G |
| `ai-system` BI insight link | Cross-link to analytics satellite | Advisory — not AI admin duplicate |

---

## Retired UX owners (0D-F)

| Former owner | Replacement |
|--------------|-------------|
| `UserContextInspector` | Pipeline diagnostics user filter + trace list |
| `AIReasoningViewer` | `PipelineTraceDetail` evidence bundle |
| `ContextValidationTools` | Test lab + pipeline quality endpoints |
| `CrossModuleContextMap` | `ContextProviderHealthPanel` on hub |
| `RealTimeContextMonitor` | Pipeline hub operations metrics |
| `web/src/api/aiContextDebug.ts` | `adminApiService` pipeline methods |

---

## Navigation ownership

| Entry point | Owns capability? | Notes |
|-------------|------------------|-------|
| `layout.tsx` AI nav | No — routes only | AI System + AI Pipeline |
| `ai-system` launcher | No — deep links only | Four canonical destinations |
| `PipelineOperationsHub` | Yes — hub composition | Single diagnostics link |

---

## Non-goals (0D-F scope)

- Business AI page changes
- Provider API route changes
- Governance architecture (1B)
- Certification execution (0D-G)

---

## References

- [ADMIN_PORTAL_DIAGNOSTICS_OWNERSHIP_MODEL.md](./ADMIN_PORTAL_DIAGNOSTICS_OWNERSHIP_MODEL.md)
- [ADMIN_PORTAL_AI_PIPELINE_OWNERSHIP_MODEL.md](./ADMIN_PORTAL_AI_PIPELINE_OWNERSHIP_MODEL.md)
- [ADMIN_PORTAL_AI_NAVIGATION_MATRIX.md](./ADMIN_PORTAL_AI_NAVIGATION_MATRIX.md)
