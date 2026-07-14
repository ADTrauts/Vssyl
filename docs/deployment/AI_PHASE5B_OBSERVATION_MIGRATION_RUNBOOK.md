# AI Phase 5B Observation Migration Runbook

## Migration

Folder: `prisma/migrations/20260713120000_ai_observation_reliability_phase5b/`

Adds:

- `ai_execution_records.observationState` (default `STARTED`)
- `ai_execution_records.observationVersion` (default `0`)
- table `ai_observation_events` with unique `eventId` and indexes

## Deploy order

1. `pnpm prisma:generate`
2. Deploy migration (`pnpm prisma:migrate:deploy` or reviewed `migrate dev`)
3. Deploy server build that writes event rows
4. (Optional) enable retention cron via env

## Backward compatibility

- Phase 5 `observationEventsJson` remains as materialized cache.
- Readers prefer immutable `AIObservationEvent` rows; fall back to JSON.
- Old hubs without rows still list via JSON until new events arrive.

## Growth expectations

- Roughly N observation events per Twin turn (typically 5–40 with denser 5B emits).
- Index on `(requestId, sequenceNumber)` and `eventId` unique.
- Purge job should keep table bounded when enabled.

## Rollback / forward-fix

- **Forward-fix:** stop writing new event types; old readers ignore unknown columns.
- **Rollback app:** older code ignores new table/columns; do not drop table without export.
- Destructive drop of `ai_observation_events` is **not** part of this runbook.

## Timeline rebuild

`rebuildTimelineForExecution(prisma, executionRecordId)` rebuilds `timelineJson` / JSON cache from event rows.
