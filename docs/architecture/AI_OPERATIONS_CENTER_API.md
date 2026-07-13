# AI Operations Center API

> **Phase 4B notice:** Phase 4 initially introduced the AI Operations Center as a separate
> route. Phase 4B consolidated UI into the AI Pipeline Hub. **API namespace
> `/api/admin/ai/operations/*` is retained** as the intelligence workflow data API.
> This document remains current for that API.

**Program:** AI Architecture Phase 4 / 4B  
**Base path:** `/api/admin/ai/operations`  
**Auth:** `Authorization: Bearer <JWT>` + platform ADMIN (see [`AI_PIPELINE_OPERATOR_RBAC.md`](./AI_PIPELINE_OPERATOR_RBAC.md))

---

## Response shape

```json
{ "success": true, "data": { } }
{ "success": false, "error": "message" }
```

---

## Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/overview` | `operations:read` | Dashboard counts + recent metrics |
| GET | `/executions` | `executions:search` | Paginated execution list |
| GET | `/executions/:id` | `executions:read` | Detail + timeline + linked actions |
| GET | `/executions/:id/explain` | `explainability:read` | Architecture explainability |
| POST | `/executions/:id/evaluations` | `evaluations:write` | Create operator evaluation |
| GET | `/evaluations` | `evaluations:read` | Evaluation queue |
| PATCH | `/evaluations/:id` | `evaluations:write` | Workflow update / assign / comment |
| POST | `/evaluations/bulk` | `evaluations:bulk` | Bulk workflow update |
| POST | `/evaluations/:id/root-causes` | `root_causes:write` | Add root causes |
| PATCH | `/root-causes/:id` | `root_causes:write` | Approve/reject cause |
| GET | `/corrections` | `corrections:read` | Correction routes |
| PATCH | `/corrections/:id` | `corrections:write` | Approve/override/assign |
| GET | `/regressions` | `regressions:read` | Regression library |
| POST | `/regressions` | `regressions:write` | Create case |
| GET | `/metrics` | `metrics:read` | Aggregated metrics |
| POST | `/executions/:id/replay/prepare` | `replay:prepare` | Replay preview (no execute) |
| GET | `/health` | `operations:read` | Observe-only posture |

---

## Query parameters (list endpoints)

`page`, `pageSize`, `sortBy`, `sortDir`, `search`, `userId`, `businessId`, `provider`, `surface`, `conversationId`, `executionId`, `dateFrom`, `dateTo`, `workflowStatus`, `priority`, `assignedToUserId`, `correctionStatus`, `regressionStatus`

---

## Implementation

- Router: `server/src/routes/adminAiOperations.ts`
- Services: `server/src/ai/operations/*`
- Intelligence reuse: `server/src/ai/intelligence/*`

No duplicated execution or approval logic.
