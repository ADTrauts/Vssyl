# Context Graph — Staging Soak Results

**Program:** L4-F01 Staging Soak  
**Date:** 2026-06-23  
**Environment:** Local dev validation lane + automated staging gate  
**Status:** Phase 1 complete; Phase 2 protocol defined

---

## Executive summary

**Phase 1 (automated gate) passed.** All 37 pilot-related tests pass. Scenarios A–E mapped to automated validation. Phase 2 (14-day live staging soak) is **recommended before broad production pilot** but does not block **controlled internal production pilot** per recommendation doc.

---

## Phase 1 — Automated gate

| Check | Result |
|-------|--------|
| Test suite | **37/37 passed** |
| Duration | ~3.5s total (4 test files) |
| Rollback test | ✅ `rolls back when pilot flags disabled` |
| Scope isolation | ✅ `planning` does not trigger bridge/reconcile |

**Test files:**

- `pipelineGroundingRetrieval.projectAssistantPilot.test.ts` (7)
- `groundingReconcile.test.ts` (8)
- `retrievalBundleInferenceBridge.test.ts` (14)
- `pipelineGroundingRetrieval.retrievalPilot.test.ts` (8)

---

## Scenario validation

### Scenario A — Project status query

| Field | Result |
|-------|--------|
| Query | "Give me a project summary and context update" |
| Intent | `project_assistant` ✅ |
| Retrieval | ✅ `retrievalDiscovery` populated |
| `projectProfile` | ✅ Present with `retrievalSourceDiversity` |
| Bridge | ✅ `retrieval_inference_bridge` in sources |
| Reconcile | ✅ `_grounding_reconcile` diagnostics |

### Scenario B — Cross-module discovery

| Field | Result |
|-------|--------|
| Query | "Help me understand everything related to this project" |
| Modules | drive, todo, chat (3 modules) |
| `modulesContributingEvidence` | `['drive', 'todo', 'chat']` ✅ |
| `retrievalSourceDiversity` | 3 ✅ |
| Bundle nodes | Inference nodes from 3 modules ✅ |

### Scenario C — Recent changes query

| Field | Result |
|-------|--------|
| Query | "What is the project status and what changed recently?" |
| Pipeline | Completes without error ✅ |
| Retrieval diagnostics | `permissionEnforcementStatus: enforced` ✅ |
| Sources | `ai_retrieval`, `graph_bundle`, `retrieval_inference_bridge` ✅ |

### Scenario D — File + task + conversation relationships

| Field | Result |
|-------|--------|
| Query | "What files, tasks, and messages are for this project?" |
| Evidence entities | file-alpha, task-alpha, conv-alpha |
| V_Link explicit file | file-alpha in hub |
| Post-reconcile evidence | file-alpha **removed** (dedup) ✅ |
| Inference nodes | task-alpha, conv-alpha retained ✅ |
| `duplicateCount` | > 0 ✅ |
| `sourcePriorityApplied` | includes `vlink_explicit` ✅ |

### Scenario E — Permission boundary

| Field | Result |
|-------|--------|
| Setup | V_Link linked entity `access: restricted` |
| `skippedUnsafeMergeCount` | > 0 ✅ |
| file-alpha in evidence | **Retained** (no unsafe merge) ✅ |
| Leakage | **None** — restricted access not downgraded |

---

## Diagnostics review

| Diagnostic | Usefulness | Completeness | Operator visibility |
|------------|:----------:|:------------:|:-------------------:|
| `projectProfile` | High | Good | Module context patch |
| `groundingReconcileDiagnostics` | High | Good | Patch + pipeline result |
| `aiRetrievalDiscovery` / `retrievalDiscovery` | High | Good | ctxRecord + patch |
| Inference provenance | High | Good | Bundle node metadata |
| `modulesContributingEvidence` | Medium | Good | Retrieval diagnostics |
| `retrievalSourceDiversity` | Medium | Good | projectProfile |

**Gap (advisory):** No centralized admin dashboard — diagnostics in pipeline metadata only. Sufficient for pilot; improve in L5.

---

## Performance observations (measurement only)

| Metric | Observed (test/staging mocks) | Notes |
|--------|------------------------------|-------|
| `searchDurationMs` | 12 | Mock retrieval discovery |
| `retrievalDurationMs` | 18 | End-to-end retrieval adapter |
| Reconcile duration | < 1ms | Synchronous in-process; not separately timed |
| Bridge enrichment | < 1ms | In-process; scales with evidence count |
| Evidence count (Scenario B) | 3 | Within limit (10 for project_assistant) |
| `duplicateCount` (Scenario D) | ≥ 1 | Confirms dedup overhead is worthwhile |
| Full pilot test suite | ~3.5s | 37 tests — not production latency |

**No optimization performed.** Live staging p95 targets in soak plan.

---

## Safety review

| Control | Verified | Evidence |
|---------|:--------:|----------|
| Permission preservation | ✅ | Scenario E; PE on federation path |
| Tenant isolation | ✅ | `dashboardId` required for bridge |
| No evidence leakage | ✅ | Unsafe merge skip test |
| Rollback effectiveness | ✅ | Flag-off test restores prior behavior |
| Flag behavior | ✅ | Each flag gates its stage independently |
| Inference persistence | ✅ | Constitutional test — no Prisma in bridge |
| Production defaults off | ✅ | `.env.example` + code defaults |

---

## Rollback drill

| Step | Result |
|------|--------|
| Disable all three flags | ✅ Tested |
| Pipeline without bridge/reconcile artifacts | ✅ Verified |
| Time | Config-only (< 1 min in dev) |

---

## Phase 2 status (live staging soak)

| Item | Status |
|------|--------|
| 14-day live staging | **Protocol defined** — execute in staging environment |
| Internal dogfood cohort | Recommended before broad pilot |
| Operator sign-off | Pending Phase 2 completion for broad pilot |

---

## Findings

| ID | Finding | Severity |
|----|---------|----------|
| SOAK-F01 | No live 14-day staging metrics yet | Advisory |
| SOAK-F02 | Reconcile/bridge not separately timed in production logs | Advisory |
| SOAK-F03 | Admin diagnostics dashboard absent | Advisory |

**Blocking:** **0**

**Last updated:** 2026-06-23
