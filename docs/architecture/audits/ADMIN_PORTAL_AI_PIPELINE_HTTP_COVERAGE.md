# Admin Portal — AI Pipeline HTTP Coverage

**Package:** 1B-D — Test Architecture  
**Date:** 2026-06-18  
**Finding:** AP-F-030  
**Registry:** `server/src/routes/__tests__/fixtures/aiPipelineHandlerRegistry.ts`  
**Test file:** `server/src/routes/__tests__/admin-portal-ai-pipeline-coverage.test.ts`

---

## Summary

| Metric | Value |
|--------|------:|
| Canonical handlers | **45** |
| HTTP smoke covered | **45** |
| Coverage ratio | **45/45 (100%)** |
| AuthZ sampling | **4** handlers × unauthenticated + non-admin |
| Prior baseline (0D-G) | 8/45 |
| Target (1B-D) | ≥40/45 |
| **Status** | **PASS** |

Provider governance panel endpoints (`/api/admin/ai-providers/*`) are **satellite mounts** per [ADMIN_PORTAL_AI_PIPELINE_SURFACE_MAP.md](./ADMIN_PORTAL_AI_PIPELINE_SURFACE_MAP.md) §3 — out of scope for the 45-handler pipeline prefix; covered by `adminPortalProviderGovernance.test.ts` (web hygiene).

---

## Handler matrix

| # | ID | Method | Path | Covered | Test file | Notes |
|---|-----|--------|------|---------|-----------|-------|
| 1 | catalog | GET | `/ai-pipeline/catalog` | ✅ | `admin-portal-ai-pipeline-coverage.test.ts` | AuthZ sample |
| 2 | registry-graph | GET | `/ai-pipeline/registry/graph` | ✅ | same | |
| 3 | registry-validate | POST | `/ai-pipeline/registry/validate` | ✅ | same | |
| 4 | policies-intents-create | POST | `/ai-pipeline/policies/intents` | ✅ | same | AuthZ sample |
| 5 | policies-intents-duplicate | POST | `/ai-pipeline/policies/intents/:intentId/duplicate` | ✅ | same | Nonexistent intent → 404 |
| 6 | policies-intents-archive | POST | `/ai-pipeline/policies/intents/:intentId/archive` | ✅ | same | |
| 7 | policies-intents-restore | POST | `/ai-pipeline/policies/intents/:intentId/restore` | ✅ | same | |
| 8 | policies-intents-enable | POST | `/ai-pipeline/policies/intents/:intentId/enable` | ✅ | same | |
| 9 | policies-intents-disable | POST | `/ai-pipeline/policies/intents/:intentId/disable` | ✅ | same | |
| 10 | policies-intents-update | PUT | `/ai-pipeline/policies/intents/:intentId` | ✅ | same | |
| 11 | policies-grounding-update | PUT | `/ai-pipeline/policies/grounding/:intentId` | ✅ | same | |
| 12 | policies-grounding-create | POST | `/ai-pipeline/policies/grounding` | ✅ | same | |
| 13 | policies-grounding-duplicate | POST | `/ai-pipeline/policies/grounding/:intentId/duplicate` | ✅ | same | |
| 14 | policies-grounding-archive | POST | `/ai-pipeline/policies/grounding/:intentId/archive` | ✅ | same | |
| 15 | policies-grounding-restore | POST | `/ai-pipeline/policies/grounding/:intentId/restore` | ✅ | same | |
| 16 | policies-grounding-enable | POST | `/ai-pipeline/policies/grounding/:intentId/enable` | ✅ | same | |
| 17 | policies-grounding-disable | POST | `/ai-pipeline/policies/grounding/:intentId/disable` | ✅ | same | |
| 18 | policies-sources-update | PUT | `/ai-pipeline/policies/sources/:sourceId` | ✅ | same | |
| 19 | policies-sources-create | POST | `/ai-pipeline/policies/sources` | ✅ | same | |
| 20 | policies-sources-duplicate | POST | `/ai-pipeline/policies/sources/:sourceId/duplicate` | ✅ | same | |
| 21 | policies-sources-archive | POST | `/ai-pipeline/policies/sources/:sourceId/archive` | ✅ | same | |
| 22 | policies-sources-restore | POST | `/ai-pipeline/policies/sources/:sourceId/restore` | ✅ | same | |
| 23 | policies-sources-enable | POST | `/ai-pipeline/policies/sources/:sourceId/enable` | ✅ | same | |
| 24 | policies-sources-disable | POST | `/ai-pipeline/policies/sources/:sourceId/disable` | ✅ | same | |
| 25 | policies-tools-update | PUT | `/ai-pipeline/policies/tools/:toolId` | ✅ | same | |
| 26 | policies-tools-create | POST | `/ai-pipeline/policies/tools` | ✅ | same | |
| 27 | policies-tools-duplicate | POST | `/ai-pipeline/policies/tools/:toolId/duplicate` | ✅ | same | |
| 28 | policies-tools-archive | POST | `/ai-pipeline/policies/tools/:toolId/archive` | ✅ | same | |
| 29 | policies-tools-restore | POST | `/ai-pipeline/policies/tools/:toolId/restore` | ✅ | same | |
| 30 | policies-tools-enable | POST | `/ai-pipeline/policies/tools/:toolId/enable` | ✅ | same | |
| 31 | policies-tools-disable | POST | `/ai-pipeline/policies/tools/:toolId/disable` | ✅ | same | |
| 32 | policies-settings-update | PUT | `/ai-pipeline/policies/settings` | ✅ | same | |
| 33 | audit | GET | `/ai-pipeline/audit` | ✅ | same | |
| 34 | quality-stats | GET | `/ai-pipeline/quality/stats` | ✅ | same | |
| 35 | diagnostics-list | GET | `/ai-pipeline/diagnostics` | ✅ | same | |
| 36 | diagnostics-get | GET | `/ai-pipeline/diagnostics/:traceId` | ✅ | same | |
| 37 | test-lab | POST | `/ai-pipeline/test-lab` | ✅ | same | Mocked `DigitalLifeTwinService`; AuthZ sample |
| 38 | context-providers-health | POST | `/ai-pipeline/context-providers/health` | ✅ | same | |
| 39 | retention-get | GET | `/ai-pipeline/retention` | ✅ | same | |
| 40 | retention-put | PUT | `/ai-pipeline/retention` | ✅ | same | |
| 41 | retention-purge | POST | `/ai-pipeline/retention/purge` | ✅ | same | AuthZ sample; `dryRun: true` |
| 42 | diagnostics-export | POST | `/ai-pipeline/diagnostics/export` | ✅ | same | |
| 43 | diagnostics-evidence | GET | `/ai-pipeline/diagnostics/:traceId/evidence` | ✅ | same | |
| 44 | suggestions-metrics | GET | `/ai-pipeline/suggestions/metrics` | ✅ | same | |
| 45 | suggestions-dry-run | POST | `/ai-pipeline/suggestions/dry-run` | ✅ | same | |

---

## Justified exceptions

**None.** All 45 canonical `/api/admin-portal/ai-pipeline/*` handlers have dedicated HTTP smoke cases.

### Smoke semantics

- Admin requests must **not** return 401/403.
- Allowed statuses include 200, 400, 404, 409, 500 (handler-specific subsets for test-lab, export, evidence).
- Mutation handlers use nonexistent entity IDs or dry-run payloads to avoid destructive side effects.

### Legacy overlap

`admin-portal-ai-pipeline.test.ts` (8 cases from 0D-G) remains as regression smoke; superseded for coverage accounting by the 45-handler registry suite.

---

## Verification

```bash
cd server && pnpm vitest run src/routes/__tests__/admin-portal-ai-pipeline-coverage.test.ts
```

**Result (2026-06-18):** 54 tests passed (45 handler smokes + registry assertion + 8 authZ samples).
