# AI Phase 5B Observation Reliability Certification

**Date:** 2026-07-13  
**Overall decision:** **CERTIFIED_WITH_LIMITATION**

Limitations: not audit-WORM; process kill can still lose in-flight bounded writes after timeout; retention cron disabled by default.

| ID | Area | Risk | Control | Evidence | Test | Result | Limitation | State |
|----|------|------|---------|----------|------|--------|------------|-------|
| R1 | Start-event durability | Lost start hub | Bounded durable emit (250ms) | `emitDurableObservation` + `ExecutionStarted` | Phase5b unit | Pass | Timeout continues async | CERTIFIED_WITH_LIMITATION |
| R2 | Terminal-event durability | Lost completion | Bounded durable `ResponseReturned`/`ExecutionFailed` | `runtimeObservation.ts` | Phase5b unit | Pass | Same timeout limit | CERTIFIED_WITH_LIMITATION |
| R3 | Intermediate delivery | Loss under load | Async + 1 retry | `collectObservationEventWithRetry` | Phase5b concurrent | Pass | Best-effort under kill | CERTIFIED_WITH_LIMITATION |
| R4 | Deduplication | Duplicate rows | Unique `eventId` | Prisma unique + P2002 | Phase5b dedupe | Pass | Caller must pass stable id/key | CERTIFIED |
| R5 | Ordering | Ambiguous order | `sequenceNumber` + `emittedAt` | Recorder + timeline | Timeline test | Pass | Clock skew possible | CERTIFIED_WITH_LIMITATION |
| R6 | Concurrency | Lost JSON RMW | Immutable event rows + txn | `persistObservationEvent` | 100 concurrent | Pass | Hub create race may dup hubs rare | CERTIFIED_WITH_LIMITATION |
| R7 | Late events | State regression | State machine terminal lock | `executionStateMachine` | Late approval test | Pass | Summary fields may still update | CERTIFIED |
| R8 | Timeline rebuild | Stale cache | Rebuild from rows | `rebuildTimelineForExecution` | Timeline ordering | Pass | — | CERTIFIED |
| R9 | Redaction | Secret leakage | Hardened redaction fail-closed | `redaction.ts` | Nested adversarial | Pass | Allowlist soft by default | CERTIFIED |
| R10 | Provider events | Blind routing diagnosis | Emit select/fail/fallback | Core hooks | Provider unit suite (existing) | Pass (observe-only) | Not all call starts | CERTIFIED_WITH_LIMITATION |
| R11 | Fallback events | Silent fallback | FallbackStarted/Completed | Core hooks | Existing fallback tests | Pass | — | CERTIFIED |
| R12 | Context/retrieval | Blind context | ContextBuilt + retrieval types available | Core ContextBuilt; taxonomy ready | Partial | Pass | Not every provider fetch instrumented | CERTIFIED_WITH_LIMITATION |
| R13 | Grounding | Blind enforcement | Grounding*/EnforcementApplied | Core hooks | Existing enforcement tests | Pass | — | CERTIFIED |
| R14 | Approval/action | Blind governance | Governance emits | governedToolExecutor + approvals route | Governance tests | Pass | — | CERTIFIED |
| R15 | File/vision | Content leak | Codes/counts only | FileIssueRecorded / Vision* | Unit | Pass | — | CERTIFIED |
| R16 | Failure isolation | Twin break | Never throw | Facade | Isolation tests | Pass | — | CERTIFIED |
| R17 | Health metrics | Blind ops | Counters + API | `observationHealth` | Health test | Pass | Process-local counters | CERTIFIED_WITH_LIMITATION |
| R18 | Retention | Unbounded growth | Purge service + opt-in cron | retention service/runbook | Dry-run test | Pass | Cron off by default | CERTIFIED_WITH_LIMITATION |
| R19 | Migration safety | Break prod | Additive migration | migration SQL + runbook | prisma generate | Pass | Apply before relying on table | CERTIFIED |
| R20 | Performance | Latency tax | Bounded timeout + async | docs + smoke | Enqueue when disabled | Pass | Not prod-scale certified | CERTIFIED_WITH_LIMITATION |

## Tested scale

- Unit: 100 concurrent events / one requestId (in-memory mock Prisma)
- Not claimed: multi-instance Cloud Run soak, DB saturation, or chaos kill injection
