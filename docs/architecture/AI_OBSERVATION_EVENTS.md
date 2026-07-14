# AI Observation Events

Canonical event model for Runtime Observation (Phase 5 + 5B). One model — do not invent parallel event buses.

## Envelope (schema version 2)

| Field | Description |
|-------|-------------|
| `eventId` | Stable identity across retries (unique) |
| `eventVersion` | Envelope schema version (`AI_OBSERVATION_EVENT_SCHEMA_VERSION`) |
| `requestId` | Turn correlation id |
| `executionRecordId` / `executionId` | Hub id once known |
| `sequenceNumber` | Ordering key within request |
| `emittedAt` / `observedAt` | Emitter vs collector clocks |
| `type` | `AIObservationEventType` |
| `surface` | e.g. `TWIN`, `GOVERNANCE` |
| `sourceComponent` | Emitting module |
| `conversationId` / `userId` / `businessId` | Scope |
| `deliveryClass` | `DURABLE_BOUNDED` \| `ASYNC_AT_LEAST_ONCE` |
| `retentionClass` | `HOT` \| `ARCHIVE` \| `PURGE_ELIGIBLE` |
| `correlationIds` | Optional map |
| `metadata` | Redacted structured details |

## Implemented vs taxonomy

Taxonomy in `shared/src/types/ai-runtime-observation.ts` is broad. **Implemented emits** map to real seams:

- Twin: ExecutionStarted, ContextBuilt, ProviderSelected, ProviderCallFailed, ProviderFallback*, Grounding*, EnforcementApplied, FileIssueRecorded, Vision*, Response*, ExecutionCompleted/Failed, ToolProposed, ApprovalRequested (pending)
- Governance: ToolAuthorizationEvaluated, Approval*, ActionExecution*, ActionExecutionReplayed
- Route finalize: ResponseReturned with history/diagnostic links

Unused taxonomy entries are reserved for future seams — do not emit without a code path + test.

## Storage

- Source of truth: `AIObservationEvent` rows
- Materialized cache: `AIExecutionRecord.observationEventsJson` + `timelineJson`
- Not a duplicate of `AIActionExecution`

## Related

- `AI_OBSERVATION_DELIVERY_CONTRACT.md`
- `AI_OBSERVATION_EXECUTION_STATE_MODEL.md`
