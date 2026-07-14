# AI Observation Delivery Assessment (Phase 5 → 5B)

**Date:** 2026-07-13  
**Scope:** Evidence-based audit of Phase 5 Runtime Observation Layer as implemented in the repository.  
**Rule:** Findings are from code inspection, not from closeout wording alone.

## Trace: one event from emit to durable store

| Step | Location | Behavior |
|------|----------|----------|
| 1. Call site | `DigitalLifeTwinCore.processAsDigitalTwin` | Calls `emitTwinTurnStarted` / `emitTwinObservation` / `emitTwinTurnCompleted` / `emitTwinTurnFailed` |
| 2. Facade | `server/src/ai/observation/runtimeObservation.ts` | `fireAndForget` → `void collectObservationEvent(prisma, input).catch(() => {})` |
| 3. Queue | None | No durable queue, no platform job, no domain-event bus reuse for observation |
| 4. Promise handling | Facade | Promise is **not** awaited by Twin or HTTP handler; errors swallowed |
| 5. Collector | `observationCollector.ts` | Validate → redact → push in-memory `Map` buffer → `await upsertExecutionFromObservation` |
| 6. Redaction | `redaction.ts` | Key/value patterns; blocked reasoning keys; string truncation |
| 7. Recorder | `executionRecorder.ts` | `findFirst` by `requestId` → create or **read-modify-write** JSON update |
| 8. Prisma transaction | **None** | Separate `findFirst` + `create`/`update`; no `$transaction`, no row lock |
| 9. Hub fields | `AIExecutionRecord` | `observationEventsJson`, `timelineJson`, linked artifacts, `completedAt` |
| 10. Admin read | `/api/admin/ai/operations/executions/:id` (+ `/events`, `/timeline`) | Reads hub JSON / derived timeline |

Route finalize (`ai.ts` `saveTwinQueryHistory`) also emits `ResponseReturned` with history/diagnostic IDs via the same F&F facade.

## Answers to required questions

### 1. Is delivery best-effort, at-least-once, or effectively exactly-once?

**Best-effort asynchronous telemetry**, with opportunistic persistence when the Node process stays alive long enough for the floating promise to complete.

- Not at-least-once: no retry, no durable outbox, no ack.
- Not exactly-once: no stable `eventId`; weak dedupe (`type` + `timestamp` string equality).

### 2. Can an event be lost after the HTTP response?

**Yes.** The HTTP Twin path does not await observation persistence. Response can complete while `collectObservationEvent` is still running or not yet scheduled on the event loop.

### 3. Can a process shutdown lose queued work?

**Yes.**

- In-memory buffer is process-local and discarded on exit.
- Floating promises have no shutdown flush hook / `beforeExit` drain.
- Cloud Run SIGTERM can drop in-flight Prisma writes.

### 4. Can collector failure be retried?

**No.** Failures are logged and returned as `{ ok: false }`; facade ignores the result. No retry queue.

### 5. Can retries create duplicate events?

**Yes, if anything retries.** Deduplication is `type + timestamp` only. Two emits of the same type with different timestamps both persist. There is no `eventId`.

### 6. Can late events arrive after completion?

**Yes.** Late emits (e.g. history link `ResponseReturned`, or future approval events) call the same upsert. Updates merge into JSON. Terminal `completedAt` is set when `ResponseReturned` / `ExecutionFailed` is the *latest* processed event; late intermediate events do not clear `completedAt`, but there is **no formal state machine** preventing status regression via other fields (e.g. overwriting summaries).

### 7. Can two events overwrite each other?

**Yes — concurrency hazard.** Concurrent collects for the same `requestId` each:

1. `findFirst`
2. read `observationEventsJson`
3. merge with **their** in-memory buffer view
4. `update` full JSON

Last writer wins → **lost events** under concurrency.

### 8. Can a stale event regress execution status?

**Partially.**

- `completedAt` is only set on terminal types; intermediate late events keep existing `completedAt`.
- However, summary fields (`provider`, `errorSummary`, linked IDs) can still be overwritten by later merges without transition rules.
- No `observationState` column; no illegal-transition guard.

### 9. Are events persisted independently or only inside one JSON document?

**Only inside one JSON document** (`observationEventsJson`) plus a materialized `timelineJson`. No immutable per-event rows in Phase 5.

### 10. What behavior occurs when the database is unavailable?

Collector catches errors, logs warn, returns `{ ok: false }`. Twin continues. Event may remain only in the in-memory buffer until buffer trim/clear — **not durable**.

## Additional evidence findings

| Topic | Evidence |
|-------|----------|
| Event identity | No `eventId`, `eventVersion`, `sequenceNumber`, `sourceComponent` |
| Ordering | Timeline sorts by `timestamp`; concurrent same-ms order undefined |
| Retention | `AI_OBSERVATION_RETENTION_POLICY` constants only; `scheduledJobsImplemented: false` |
| Scheduler available | Platform has `registerPlatformJob` (node-cron) used by trash cleanup etc. — **not wired to observation** |
| Domain event bus | Exists for module/workflow events; **not used** by observation (correct — different concern) |
| HTTP wait | No bounded await for start/terminal |
| Buffer overflow | Cap 200 events/requestId; excess silently not buffered (still attempts upsert with incomplete buffer) |
| Kill-switch | `AI_RUNTIME_OBSERVATION_ENABLED=false` |

## Reliability classification (Phase 5 as shipped)

| Area | Grade |
|------|-------|
| Isolation from Twin responses | **Good** (fail-safe) |
| Operator reconstructability | **Weak** (loss + RMW races) |
| Audit / compliance grade | **Not suitable** |
| Concurrency safety | **Not safe** |
| Deduplication | **Inadequate** |
| Retention enforcement | **Documented only** |

## Implications for Phase 5B

Must address:

1. Explicit delivery contract (recommended hybrid durability).
2. Stable event identity + schema version.
3. Immutable event rows (or equivalent concurrency-safe append).
4. Terminal state machine with late-event rules.
5. Bounded durable write for start/terminal; async for denser mid-events.
6. Health metrics + retention service (job optional/disabled-by-default).
7. Certification with limitations where audit-grade is not claimed.

## No-change note

This document intentionally contains **assessment only**. Implementation changes belong to Phase 5B subsequent tasks.
