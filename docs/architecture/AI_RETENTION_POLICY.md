# AI Observation Retention Policy

Policy constants: `AI_OBSERVATION_RETENTION_POLICY` (`phase5b-v1`).

| Stage | Days | Status |
|-------|------|--------|
| Hot | 30 | Events + hub summary |
| Archive after | 90 | Design (export future) |
| Purge after | 365 | Service + dry-run API |
| Scheduled jobs | — | Implemented in registry; **disabled by default** |

## Enforcement

See `AI_OBSERVATION_RETENTION_RUNBOOK.md`.

- Purge service: `observationRetentionService.ts`
- Admin: `POST /api/admin/ai/operations/observation/retention/purge`
- Cron env: `AI_OBSERVATION_RETENTION_CRON_ENABLED=true`

## Principles

1. Immutable events are the retention unit; hub JSON is cache.
2. Do not purge hubs that still have evaluations/corrections/regressions unless explicitly requested.
3. Knowledge must not be promoted via observation stores.
