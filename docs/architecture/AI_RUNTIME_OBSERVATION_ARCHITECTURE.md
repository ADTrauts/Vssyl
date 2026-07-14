# AI Runtime Observation Architecture (Phase 5 / 5B)

**Status:** Phase 5 implemented; Phase 5B reliability upgrades applied (**CERTIFIED_WITH_LIMITATION**)  
**Audience:** Platform engineers, AI operators  
**Depends on:** Phase 3 `AIExecutionRecord`, Phase 4 AI Pipeline / Operations APIs  

## Purpose

The Runtime Observation Layer automatically records the lifecycle of Digital Twin executions into the existing Intelligence Platform hub (`AIExecutionRecord`) **without changing Twin runtime behavior**.

Phase 5B adds durable event identity, concurrency-safe immutable event rows, a turn state machine, denser lifecycle emits, health metrics, and retention tooling.

## Constitutional rule

The Twin **must not know about** execution-record persistence semantics, evaluations, corrections, metrics, replay, or Operations Center.

The Twin **may** call a thin facade that **emits observation events only**.

## Architecture (Phase 5B)

```
DigitalLifeTwinCore / governance / ai routes
        │ emit (durable-bounded terminals | async mid-events)
        ▼
runtimeObservation.ts
        │
        ▼
observationCollector.ts  (validate → redact → normalize → identity)
        │
        ▼
executionRecorder.ts  (txn: insert AIObservationEvent + hub state machine)
        │
        ├── AIObservationEvent (immutable rows, unique eventId)
        └── AIExecutionRecord (hub summary + timeline cache)
        │
        ▼
/api/admin/ai/operations/*  (Pipeline Hub)
```

## Delivery contract

See `AI_OBSERVATION_DELIVERY_CONTRACT.md` and assessment evidence in `AI_OBSERVATION_DELIVERY_ASSESSMENT.md`.

## Related docs

- `AI_OBSERVATION_EVENTS.md`
- `AI_OBSERVATION_EXECUTION_STATE_MODEL.md`
- `AI_REDACTION_POLICY.md`
- `AI_RETENTION_POLICY.md`
- `AI_OBSERVATION_RETENTION_RUNBOOK.md`
- `AI_PHASE5_CLOSEOUT.md`
- `AI_PHASE5B_CLOSEOUT.md`
- `AI_PHASE5B_OBSERVATION_RELIABILITY_CERTIFICATION.md`
