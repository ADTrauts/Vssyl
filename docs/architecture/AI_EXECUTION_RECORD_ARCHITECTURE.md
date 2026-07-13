# AI Execution Record Architecture

**Program:** AI Architecture Phase 3 — Intelligence Platform  
**Date:** 2026-07-12  
**Status:** Active — observational hub design + schema  
**Source of Truth for:** Canonical `AIExecutionRecord` (one execution → one id)

---

## Principle

**One execution. One execution record. One identifier.**

The record is the **observability hub**. It links existing artifacts; it does **not** replace:

- `AIActionExecution` (mutation/idempotency ledger)
- `AIPipelineDiagnostic` (orchestration/quality trace)
- `AIConversationHistory` (turn analytics + feedback)

Knowledge remains scoped. Platform intelligence improves via evaluations and corrections — not by copying user memories globally.

---

## Reuse map

| Concern | Existing store | Hub link |
|---------|----------------|----------|
| Turn text / feedback | `AIConversationHistory` | `conversationHistoryId` |
| Pipeline / grounding trace | `AIPipelineDiagnostic` | `pipelineDiagnosticId` |
| Chat thread | `AIConversation` | `conversationId` |
| Mutating tools | `AIActionExecution` | `linkedArtifactsJson.actionExecutionIds` |
| Approvals | `AIApprovalRequest` | `linkedArtifactsJson.approvalIds` |
| Activity | module activity | `linkedArtifactsJson.activityIds` |
| Learning signals | `AILearningEvent` | `linkedArtifactsJson.learningEventIds` |

---

## Timeline

`timelineJson` is an ordered list of stages:

Request → Intent → Context → Knowledge → Prompt → Provider → Tool → Approval → Execution → Activity → Response → Feedback → Evaluation

Builders: `server/src/ai/intelligence/executionTimeline.ts`.

---

## Runtime posture (Phase 3)

- Services exist under `server/src/ai/intelligence/`
- **Not wired** into Twin / ActionExecutor / approval respond paths
- Populating records in production is a future observe hook (flagged, non-blocking)
- All mutating paths still use `AIActionExecution`

---

## Related

- [`AI_EVALUATION_ARCHITECTURE.md`](./AI_EVALUATION_ARCHITECTURE.md)
- [`AI_OPERATOR_PLATFORM.md`](./AI_OPERATOR_PLATFORM.md)
- [`AI_EXECUTION_ARCHITECTURE.md`](./AI_EXECUTION_ARCHITECTURE.md) (Phase 2 mutation lifecycle)
