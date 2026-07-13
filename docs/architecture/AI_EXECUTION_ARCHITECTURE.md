# AI Execution Architecture

**Program:** AI Architecture Phase 2 — Execution Platform Consolidation  
**Date:** 2026-07-12  
**Status:** Active  
**Runtime SoT:** code under `server/src/ai/governance/**`, Twin tool loop, `POST /api/ai/approvals/:id/respond`  

---

## Purpose

Eliminate execution-path ambiguity. After Phase 2, there is **one** intended way AI mutations run:

**Propose → authorize → risk → approve (if required) → execute via domain service → ledger → activity (domain) → complete**

---

## Component roles

| Concern | Owner |
|---------|--------|
| Who creates tool proposals? | Model tool-calls in `DigitalLifeTwinCore` tool loop; or `ActionExecutor` via bridge |
| Who executes? | `executeGovernedTool` → `executeTool` → **module domain services**; legacy HIGH_RISK via `executeLegacyDomainAction` after approval |
| Who authorizes? | Domain AuthZ inside Drive/Chat/Todo/Calendar/… services (never the model) |
| Who approves? | User via `POST /api/ai/approvals/:id/respond` (canonical) |
| Who persists execution? | `AIActionExecution` ledger |
| Who persists approval? | `AIApprovalRequest` |
| Who emits activity? | Domain services (e.g. Drive share); ledger may store `activityId` |
| Who emits notifications? | Optional product paths; ApprovalManager notifications are **legacy** |
| Who retries? | Ledger: `FAILED` may retry; COMPLETED/AWAITING replay |
| Who handles idempotency? | `beginOrReplayActionExecution` + unique `idempotencyKey` |
| Who owns audit? | Structured `logger` on governed path + domain activity |
| Who owns rollback? | **Not implemented** (typed `REVERSED` reserved) |

---

## Path inventory

### Canonical (active)

```
POST /api/ai/twin
  → DigitalLifeTwinService
  → DigitalLifeTwinCore tool loop
  → executeGovernedTool
  → [AIApprovalRequest if gated]
  → executeTool → domain

POST /api/ai/approvals/:id/respond (approve)
  → executeApprovedGovernedAction
  → executeGovernedTool(approvalGranted) | executeLegacyDomainAction
```

### Consolidated (Phase 2)

```
ActionExecutor.executeAction
  → tryExecuteViaGovernedPlatform
      → mapped Twin tools → executeGovernedTool
      → other HIGH_RISK → propose on AIActionExecution + AIApprovalRequest
  → else legacy executeByModule (low-risk / unmigrated only)
```

### Historical / do not expand

| Path | Status |
|------|--------|
| `ApprovalManager.executeApprovedAction` | Status-only; **deprecated** |
| `/api/ai/autonomy/approvals/*/execute` | Legacy; does not run governed domain |
| `BusinessAIDigitalTwinService` interact | Mock Twin — use `POST /api/ai/twin` + `businessId` |
| Stub `ActionExecutor.storeApprovalRequest` | Superseded by governed propose |

---

## Result contracts

| Legacy | Canonical |
|--------|-----------|
| Tool JSON string + `governance` | Same + `AIActionExecutionResult` |
| `ActionExecutionResult` | Bridge embeds `canonical: AIActionExecutionResult` |
| Approval respond body | `{ success, data, execution, approvalId, executionId }` |

Shared types: `shared/src/types/ai-action-governance.ts`

---

## Business execution

No separate business execution engine. Business scope is a parameter on the same lifecycle:

`context.businessId` → membership gate on Twin route → governed tools with `businessId` on ledger.

See [`AI_EXECUTION_LIFECYCLE.md`](./AI_EXECUTION_LIFECYCLE.md).
