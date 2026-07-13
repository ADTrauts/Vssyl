# AI Tool Risk and Approval Policy

**Program:** AI Architecture Phase 1  
**Date:** 2026-07-12  
**Status:** Active — executable policy for Twin tool loop  
**Code SSOT:** `shared/src/types/ai-action-governance.ts` · `server/src/ai/governance/aiToolRiskRegistry.ts` · `governedToolExecutor.ts`  
**Related:** [`AI_ACTIVE_TOOL_AND_ACTION_REGISTER.md`](./AI_ACTIVE_TOOL_AND_ACTION_REGISTER.md)

---

## Intent

Model tool-calls are **proposals**. Vssyl evaluates authorization (domain services), then **risk**, then approval, then idempotency, then execution.

Model confidence is **not** permission. Provider tool coordination is **not** approval.

---

## Risk categories

| Category | Meaning | RISK_BASED approval |
|----------|---------|---------------------|
| READ_ONLY | No mutation | NEVER |
| LOW_RISK_REVERSIBLE | Personal reversible mutation (e.g. create todo) | No |
| CONSEQUENTIAL_REVERSIBLE | Meaningful but reversible | Yes |
| EXTERNAL_VISIBILITY | Exposes data to another party (e.g. file share) | Yes |
| DESTRUCTIVE | Deletes / destroys | Yes |
| FINANCIAL_OR_REGULATED | Money / HR / regulated | Yes |
| IRREVERSIBLE_EXTERNAL | Cannot unwind externally | Yes |

Approval policies per tool: `NEVER` | `RISK_BASED` | `ALWAYS`.

---

## Direct user command vs approval

A Twin turn implies the user asked the assistant to help. That counts as **intent**, not as confirmation for EXTERNAL_VISIBILITY / DESTRUCTIVE / FINANCIAL / IRREVERSIBLE categories.

Those categories still create an `AIApprovalRequest` and return `AWAITING_APPROVAL` without executing.

---

## Non-delegable rules

1. Domain AuthZ always runs inside module services.  
2. High-risk tools do not execute until `approvalGranted` on the governed path.  
3. Unknown tools fail closed (treat as approval required).  
4. Idempotent mutating tools use `AIActionExecution` ledger.  
5. Do not revive `/api/ai/autonomous/*`.

---

## Failure behavior

| Case | Behavior |
|------|----------|
| Unauthorized domain call | Tool returns success:false; no silent retry as success |
| Approval required | Create approval + execution row AWAITING_APPROVAL |
| Idempotent replay COMPLETED | Return prior result; do not re-mutate |
| Idempotent key + different args | Conflict error |
| Cross-user key reuse | Conflict error |

---

## Business overrides

Business-specific approval overrides are **not** fully implemented in Phase 1. Documented as open decision. Business scope is recorded on execution rows when `businessId` is present.

---

## Migration for unclassified tools

1. Add declaration to `ACTIVE_AI_TOOL_RISK_REGISTRY`.  
2. Prefer fail-closed until classified.  
3. ActionExecutor / partner webhook paths: inventory in register; migrate incrementally (not all in Phase 1).

---

## Backward compatibility

- Read-only tools: unchanged UX.  
- `create_todo`: still executes without approval (LOW_RISK); now idempotent.  
- `share_file`: **behavior change** — requires approval before share (Phase 1 safety). UI must surface approval metadata from tool result / twin actions.
