# AI Operator Platform

**Program:** AI Architecture Phase 3  
**Date:** 2026-07-12  
**Status:** Active — data model + API contracts (no UI)  
**Source of Truth for:** Operator dashboard backend shape

---

## Operator flow

```
Execution → Evaluation → Root Cause → Correction → Regression → Status
```

---

## Data models

| Model | Role |
|-------|------|
| `AIExecutionRecord` | Hub + timeline |
| `AIEvaluation` | Labels / score / role |
| `AIRootCauseFinding` | Multi-cause taxonomy |
| `AICorrectionRoute` | Destination + status |
| `AIRegressionCase` | Future regression |

Explainability: `buildExecutionExplanation` (architecture only).  
Replay: contract only (`replayContract.ts`).  
Metrics: definitions + aggregation helpers.

---

## API contracts (future routes)

Documented in `server/src/ai/intelligence/operatorApiContracts.ts`:

| Method | Path |
|--------|------|
| GET | `/api/admin/ai/intelligence/executions` |
| GET | `/api/admin/ai/intelligence/executions/:id` |
| GET | `/api/admin/ai/intelligence/executions/:id/explain` |
| POST | `/api/admin/ai/intelligence/executions/:id/evaluations` |
| GET | `/api/admin/ai/intelligence/evaluations` |
| POST | `/api/admin/ai/intelligence/evaluations/:id/root-causes` |
| GET | `/api/admin/ai/intelligence/corrections` |
| PATCH | `/api/admin/ai/intelligence/corrections/:id` |
| POST | `/api/admin/ai/intelligence/regressions` |
| GET | `/api/admin/ai/intelligence/regressions` |
| GET | `/api/admin/ai/intelligence/metrics` |
| POST | `/api/admin/ai/intelligence/executions/:id/replay` |
| POST | `/api/ai/feedback/evaluation` |

Phase 3 does **not** register these HTTP routes.

---

## Auth posture (when wired)

- Admin/operator routes: existing admin portal auth
- User evaluation: authenticated user scoped to own executions
- Tenant isolation: `userId` / `businessId` on records
