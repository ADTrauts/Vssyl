# AI Approval Architecture

**Program:** AI Architecture Phase 2  
**Date:** 2026-07-12  
**Status:** Active  

---

## Canonical approval path

| Step | Mechanism |
|------|-----------|
| Propose | `executeGovernedTool` or ActionExecutor bridge creates `AIApprovalRequest` |
| List | `GET /api/ai/approvals` |
| Respond | `POST /api/ai/approvals/:id/respond` |
| Execute on approve | `executeApprovedGovernedAction` (Twin tools **or** legacy ActionExecutor HIGH_RISK) |
| Reject | Ledger → `REJECTED` |
| Expire | 410 + ledger failure |

Frontend: `ApprovalManager.tsx` and notifications use `/api/ai/approvals` (not autonomy execute).

Twin surfaces proposals as `metadata.pendingToolApprovals`.

---

## Duplication map

| Component | Role after Phase 2 |
|-----------|-------------------|
| `AIApprovalRequest` | **Canonical** approval row |
| `executeApprovedGovernedAction` | **Canonical** approve→execute |
| `ApprovalManager` (server) | Historical create/respond/notify; `executeApprovedAction` **deprecated** (status flip only) |
| `/api/ai/autonomy/approvals/*` | Legacy surface — do not expand; prefer `/api/ai/approvals` |
| ActionExecutor stub `storeApprovalRequest` | Unused for HIGH_RISK (bridge writes real rows) |
| Twin `response.actions` requiring approval | Legacy action-list path; tool-loop governance is preferred |

---

## Non-delegable rules

1. Model tool-call ≠ approval  
2. Model confidence ≠ approval bypass  
3. Domain AuthZ re-checked at execute time  
4. Args hash must match proposal  
5. Cross-user / cross-business approval reuse forbidden  

---

## Related

- [`AI_TOOL_RISK_AND_APPROVAL_POLICY.md`](./AI_TOOL_RISK_AND_APPROVAL_POLICY.md)  
- [`AI_EXECUTION_LIFECYCLE.md`](./AI_EXECUTION_LIFECYCLE.md)  
- [`AI_EXECUTION_ARCHITECTURE.md`](./AI_EXECUTION_ARCHITECTURE.md)  
