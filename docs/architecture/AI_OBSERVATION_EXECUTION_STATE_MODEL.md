# AI Observation Execution State Model (Phase 5B)

Observation-side lifecycle for one AI **turn** (hub: `AIExecutionRecord.observationState`).  
Does **not** replace `AIActionExecution` statuses.

## States

| State | Meaning |
|-------|---------|
| `STARTED` | Turn accepted / observation hub created |
| `CONTEXT_BUILDING` | Context assembly in progress |
| `RETRIEVING` | Retrieval / evidence gathering |
| `GROUNDING` | Grounding / enforcement evaluation |
| `PROVIDER_RUNNING` | Provider call in flight (incl. fallback) |
| `AWAITING_TOOL` | Tool proposed / tool loop |
| `AWAITING_APPROVAL` | Waiting on user approval |
| `EXECUTING_ACTION` | Governed action executing |
| `RESPONDING` | Assembling / returning response |
| `COMPLETED` | Terminal success |
| `FAILED` | Terminal failure |
| `CANCELLED` | Terminal cancel |
| `PARTIAL` | Completed with non-fatal subsystem failures recorded |

## Legal transitions

```
STARTED → CONTEXT_BUILDING | PROVIDER_RUNNING | FAILED | CANCELLED
CONTEXT_BUILDING → RETRIEVING | GROUNDING | PROVIDER_RUNNING | FAILED | PARTIAL
RETRIEVING → GROUNDING | PROVIDER_RUNNING | FAILED | PARTIAL
GROUNDING → PROVIDER_RUNNING | RESPONDING | FAILED | PARTIAL
PROVIDER_RUNNING → AWAITING_TOOL | AWAITING_APPROVAL | RESPONDING | FAILED | PARTIAL
AWAITING_TOOL → AWAITING_APPROVAL | PROVIDER_RUNNING | EXECUTING_ACTION | RESPONDING | FAILED
AWAITING_APPROVAL → EXECUTING_ACTION | RESPONDING | FAILED | CANCELLED | COMPLETED | PARTIAL
EXECUTING_ACTION → AWAITING_APPROVAL | RESPONDING | COMPLETED | FAILED | PARTIAL
RESPONDING → COMPLETED | FAILED | PARTIAL
Any non-terminal → FAILED | CANCELLED | PARTIAL
```

## Terminal states

`COMPLETED`, `FAILED`, `CANCELLED` are terminal.

`PARTIAL` is **soft-terminal**: further late events may append (approvals, evaluations) but cannot move to earlier active states.

## Late event rules

- Events after terminal **append** to the immutable event log.
- State updates applying illegal transitions are **ignored** (event still stored).
- Summary fields may update links (`approvalId`, `actionExecutionId`) without state regression.

## Event → state hints

| Event types (examples) | Target state |
|------------------------|--------------|
| ExecutionStarted | STARTED |
| Context* | CONTEXT_BUILDING → CONTEXT built implies advance |
| Retrieval* | RETRIEVING |
| Grounding* / EnforcementApplied | GROUNDING |
| Provider* | PROVIDER_RUNNING |
| ToolProposed / ToolAuthorizationEvaluated | AWAITING_TOOL |
| ApprovalRequested | AWAITING_APPROVAL |
| ApprovalGranted / ActionExecutionStarted | EXECUTING_ACTION |
| ResponseStarted / ResponseReturned | RESPONDING → COMPLETED |
| ExecutionFailed | FAILED |
| ExecutionCancelled | CANCELLED |

Exact mapping implemented in `server/src/ai/observation/executionStateMachine.ts`.
