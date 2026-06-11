# AI Platform Wave 1D — Admin Gates & Diagnostics Closeout

**Wave:** 1D only (centralized-ai fence + diagnostics alignment)  
**Date:** 2026-06-03  
**Status:** **COMPLETE**  
**Parent:** [AI_PLATFORM_CERTIFICATION_STRATEGY.md](../AI_PLATFORM_CERTIFICATION_STRATEGY.md)

---

## Objective

Clear the primary **AI-L2** gate: `centralized-ai` admin fence and admin diagnostics truth alignment with canonical twin pipeline trace objects.

**Out of scope:** Wave 1E (provider capability matrix), Drive context (1C), ActionExecutor/toolExecutor changes.

---

## centralized-ai route disposition

**Mount (index.ts):** `authenticateJWT` → `requireAdmin` → `centralizedAiDeprecatedMiddleware` → `ai-centralized.ts`

| Class | Routes | Disposition |
|-------|--------|-------------|
| **Admin scaffold** | ~95 handlers (learning analytics, security, workflows, predictive, etc.) | **Admin-gated** — `requireAdmin` at mount |
| **Deprecated duplicate** | `POST /learning/event` | **410** → `POST /api/ai/learning/*` |
| **Deprecated duplicate** | `/models/*` (all methods) | **410** → `GET /api/ai/models` |
| **Production twin** | — | **Not present** on centralized-ai router |

**Web callers:** `admin-portal/ai-learning/page.tsx`, `adminApiService.ts` — remain valid for **admin** sessions only.

---

## Admin gate changes

| Surface | Before 1D | After 1D |
|---------|-----------|----------|
| `/api/centralized-ai/*` | `authenticateJWT` only; many handlers unauthenticated | **`requireAdmin`** on entire mount |
| `/api/admin-portal/ai-pipeline/*` | Already `requireAdmin` | Unchanged |
| `/api/ai-context-debug/*` | Per-route `requireAdmin` | Unchanged |

---

## Diagnostics schema alignment

| Canonical field | Persistence | Admin read path |
|-----------------|-------------|-----------------|
| `pipelineTrace` | `context._pipelineTrace` on twin history save | `extractCanonicalPipelineTraceFromHistoryContext` |
| Legacy alias | `context.pipelineTrace` | `extractPipelineTraceFromContext` (1D) |
| `conversationReasoning` | `context._conversationReasoning` on twin save | `mergeDiagnosticsFromHistoryContext` |
| `orchestrationSnapshot` | `contextDensity.orchestration` via query context | `mapOrchestrationToPipelineTraceInput` (unchanged) |
| Evidence bundle | `pipelineTrace.evidenceBundle` | Admin diagnostics + `evidenceBundleFromTrace` |

**Files:** `mergeDiagnosticsFromHistoryContext.ts`, `extractPipelineTraceFromContext.ts`, `adminPortalRoutes.aiPipeline.ts`, `routes/ai.ts` (history save).

---

## Tests

| File | Coverage |
|------|----------|
| `aiCentralizedAdminFence.test.ts` | Non-admin 403; admin health 200; deprecated 410; twin canonical path |
| `mergeDiagnosticsFromHistoryContext.test.ts` | Trace + reasoning merge; legacy `pipelineTrace` key |

---

## Certification updates

| Artifact | Change |
|----------|--------|
| `AI_PLATFORM_OPERATION_MATRIX.md` | Centralized-ai **N → C**; blocking N rows updated |
| `AI_PLATFORM_SCORECARD.md` | Post-1D; Admin pipeline truth **PASS** |
| `CERTIFICATION_LEDGER.md` | **L2-ready** pending 1E / formal review |
| `AI_PIPELINE_OWNERSHIP_MAP.md` | centralized-ai fence resolved |
| `AI_CANONICAL_ROUTE_MAP.md` | R-01 fence shipped |

---

## Remaining blockers (1E / L2 review)

1. **Provider capability matrix** — Wave **1E**
2. **Household / Business / Dashboard** LifeTwin stub actions — acceptable **N**
3. **Formal L2 promotion** — review package after 1E or explicit L2 council

---

## Sign-off

| Gate | Result |
|------|--------|
| centralized-ai admin-gated | PASS |
| No user production path via centralized-ai | PASS |
| Deprecated duplicates return 410 | PASS |
| Diagnostics read canonical trace + reasoning | PASS |
| `pnpm type-check` | PASS |
