# AI Observation Delivery Contract (Phase 5B)

**Status:** Normative for Runtime Observation Layer  
**Supersedes:** Informal “fire-and-forget” description in Phase 5 architecture notes (history retained in Phase 5 closeout)  
**Based on:** `AI_OBSERVATION_DELIVERY_ASSESSMENT.md`

## Selected contract: Hybrid (bounded durable terminals + at-least-once intermediates)

### Guarantees

1. **Execution start and terminal outcome** (`ExecutionStarted`, `ResponseReturned` / `ExecutionCompleted`, `ExecutionFailed`, `ExecutionCancelled`)
   - Attempt a **bounded durable write** (default timeout **250ms**).
   - On timeout: Twin continues; health metric `persistence_timeout` increments; event may still complete asynchronously.
   - On DB error: Twin continues; metric `persistence_failures` increments.

2. **Intermediate / denser lifecycle events**
   - **At-least-once asynchronous** delivery (non-blocking fire-and-forget with in-process retry once on transient failure).
   - Deduplicated by stable **`eventId`** (unique constraint).

3. **Observation failure never changes Twin response content** or tool/approval outcomes.

4. **Duplicate `eventId` is idempotent** (insert ignored / no-op).

5. **Late events may append** after terminal state but **cannot regress** observation lifecycle state (see state model).

6. **Timeline rebuild** is possible from immutable `AIObservationEvent` rows.

### Non-guarantees

- **Not exactly-once distributed delivery.**
- **Not audit-grade WORM** storage.
- **Not** guaranteed if the process is killed before the bounded write or async task completes.
- **Not** a substitute for `AIActionExecution` mutation ledger.
- Raw provider payloads / chain-of-thought are **never** guaranteed persisted (redacted / dropped).

### Timeout behavior

| Class | Default | Behavior |
|-------|---------|----------|
| Terminal / start | 250ms await | Race collect vs timeout; always fail-open to Twin |
| Intermediate | 0ms await | Schedule async collect |
| Async retry | 1 retry | Only on classified transient DB errors |

Env overrides:

- `AI_OBSERVATION_DURABLE_TIMEOUT_MS` (default 250)
- `AI_RUNTIME_OBSERVATION_ENABLED` (`false` disables)

### Fallback behavior

| Failure | Twin | Observation |
|---------|------|-------------|
| DB down | Unchanged | Drop after retry; count failure |
| Redaction throws | Unchanged | Fail-closed: drop metadata payload, keep envelope |
| Malformed event | Unchanged | Reject; count dropped |
| Observation disabled | Unchanged | No-op |

### Operator UI labeling

Pipeline Hub must show:

- Delivery guarantee: **“Hybrid: durable terminals (bounded) · at-least-once mid-events”**
- Not labeled as audit-complete
- Health status: HEALTHY / DEGRADED / UNHEALTHY / DISABLED
- Completeness warnings when terminal event missing

### Audit / compliance limitations

Phase 5B observation supports **operational reconstruction** and evaluation workflows. It does **not** claim:

- cryptographic integrity of event chains;
- guaranteed retention without operator-enabled purge job;
- zero-loss under abrupt Cloud Run kill.

Certification state for audit use: **CERTIFIED_WITH_LIMITATION** unless a durable outbox is added in a later phase.
