# AI Observation Retention Runbook (Phase 5B)

## Policy

See `AI_RETENTION_POLICY.md` and `AI_OBSERVATION_RETENTION_POLICY` (shared).

| Class | Days |
|-------|------|
| Hot | 30 |
| Archive (design) | 90 |
| Purge eligible | 365 |

## Enforcement

### Operator dry-run / purge

```
POST /api/admin/ai/operations/observation/retention/purge
Authorization: platform ADMIN
Body: { "dryRun": true, "purgeAfterDays": 365, "batchLimit": 500, "includeHubs": false }
```

- **Default dryRun=true** unless explicitly `false`.
- Deletes oldest `AIObservationEvent` rows past cutoff (batch limited).
- `includeHubs=true` deletes hubs **without** evaluations/corrections/regressions past cutoff.

### Optional cron

Registered only when:

```
AI_OBSERVATION_RETENTION_CRON_ENABLED=true
```

Optional:

```
AI_OBSERVATION_RETENTION_DRY_RUN=false   # default remains dry-run unless set
```

Schedule: `30 5 * * *` via `registerPlatformJob` (`ai_observation_retention_purge`).

## Activation checklist

1. Confirm migration `20260713120000_ai_observation_reliability_phase5b` applied.
2. Dry-run purge and review counts.
3. Run a small live purge (`dryRun: false`, small `batchLimit`).
4. Only then enable cron env on one environment.
5. Monitor `/observation/health` retention backlog.

## Deferred

Cold archive export to GCS/object storage is not implemented in Phase 5B.
