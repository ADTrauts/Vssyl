# AI Execution Lifecycle

**Program:** AI Architecture Phase 2  
**Date:** 2026-07-12  
**Status:** Active — official mutation lifecycle  

---

## Official lifecycle

```mermaid
sequenceDiagram
  participant U as User
  participant Twin as Twin HTTP / Service / Core
  participant G as executeGovernedTool
  participant L as AIActionExecution
  participant A as AIApprovalRequest
  participant D as Domain service
  participant Act as Module activity

  U->>Twin: Query / tool intent
  Twin->>Twin: Reasoning + context
  Twin->>G: Tool proposal
  G->>G: Risk + AuthZ (via domain later)
  alt Approval required
    G->>L: EXECUTING → AWAITING_APPROVAL
    G->>A: PENDING
    Twin-->>U: pendingToolApprovals / message
    U->>A: POST /approvals/:id/respond approve
    A->>G: approvalGranted
    G->>L: EXECUTING
    G->>D: Mutate
    D->>Act: emit (optional)
    G->>L: COMPLETED (+ activityId)
  else No approval
    G->>L: begin / EXECUTING (if ledger)
    G->>D: Mutate
    D->>Act: emit (optional)
    G->>L: COMPLETED
  end
```

---

## State machine

```mermaid
stateDiagram-v2
  [*] --> PROPOSED: model/ActionExecutor proposes
  PROPOSED --> AUTHORIZED: risk + scope accepted
  AUTHORIZED --> AWAITING_APPROVAL: policy requires confirm
  AUTHORIZED --> EXECUTING: no approval needed
  AWAITING_APPROVAL --> APPROVED: user approve
  AWAITING_APPROVAL --> REJECTED: user reject
  AWAITING_APPROVAL --> FAILED: expired
  APPROVED --> EXECUTING: resume
  EXECUTING --> COMPLETED: domain success
  EXECUTING --> FAILED: domain failure
  FAILED --> EXECUTING: retryable retry
  COMPLETED --> [*]
  REJECTED --> [*]
  COMPLETED --> REVERSED: future
  [*] --> CANCELLED: future cancel
```

Statuses are defined in `AIActionExecutionStatus` (`shared`).

---

## Stages (normative)

1. **User request** — Twin query or legacy action payload  
2. **Reasoning** — conversation reasoning / intent (does not authorize)  
3. **Tool / action proposal** — model tool-call or ActionExecutor action  
4. **Authorization** — proven at domain service boundary  
5. **Risk classification** — `aiToolRiskRegistry` / `legacyActionRiskRegistry`  
6. **Approval (optional)** — `AIApprovalRequest` + ledger `AWAITING_APPROVAL`  
7. **Execution** — domain mutation exactly once under idempotency key  
8. **Activity** — module SoR activity when domain emits; link `activityId` when available  
9. **Notification** — product optional; not required for execution correctness  
10. **Learning signal** — separate from execution (do not conflate)  
11. **Complete** — ledger `COMPLETED` / `FAILED` / `REJECTED`  

---

## Identity

One execution identity: **`AIActionExecution.id` (`executionId`)**.

- Approvals reference it in `actionData.executionId` and `approvalId` on the ledger row  
- Activity may be linked via `activityId`  
- Notifications (if any) should prefer `approvalId` + `executionId`  

Do not create a second parallel execution record for the same mutation.
