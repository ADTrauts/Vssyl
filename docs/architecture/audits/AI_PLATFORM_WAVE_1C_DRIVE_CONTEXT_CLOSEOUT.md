# AI Platform Wave 1C — Drive Context Provider Closeout

**Wave:** 1C only (Drive context provider compliance)  
**Date:** 2026-06-03  
**Status:** **COMPLETE**  
**Parent:** [AI_PLATFORM_CERTIFICATION_STRATEGY.md](../AI_PLATFORM_CERTIFICATION_STRATEGY.md), [AI_CONTEXT_PROVIDER_MATRIX.md](./AI_CONTEXT_PROVIDER_MATRIX.md)

---

## Objective

Move Drive AI context retrieval off direct Prisma in `driveAIContextController` onto canonical File Hub visibility services (`driveVisibilityService`), preserving response contracts for twin orchestration and grounding.

**Out of scope (not started):** Wave 1D (centralized-ai admin gates), Wave 1E (provider capability matrix), L2 certification promotion.

---

## Path inventory (before → after)

### Routes (unchanged)

| Route | Controller | Service chain |
|-------|------------|---------------|
| `GET /api/drive/ai/context/recent` | `getRecentFilesContext` | `driveAIContextService.buildRecentFilesAIContext` → `driveVisibilityService.listAccessibleRecentFilesForAIContext` |
| `GET /api/drive/ai/context/storage` | `getStorageStatsContext` | `buildStorageStatsAIContext` → `aggregateAccessibleDriveStorageForAIContext` |
| `GET /api/drive/ai/query/count` | `getFileCount` | `buildFileCountAIContext` → `countAccessibleDriveFilesForAIContext` |

**Mount:** `server/src/routes/drive.ts` (no route changes).

### AI consumers (unchanged contracts)

- `ContextProviderOrchestrator` → `fetchModuleContextProvider` → Drive endpoints (registered in `registerBuiltInModules.ts` as `recent_files`, `storage_overview`)
- `DigitalLifeTwinCore` / `AIContextAssembler` — same JSON envelope (`success`, `recentFiles`, `summary`, `storage`, `files`, `status`, metadata)
- Pipeline grounding prepass — no direct controller coupling

### Direct Prisma removed

| Location (pre-1C) | Behavior | Replacement |
|-------------------|----------|-------------|
| `driveAIContextController` — second `prisma.file.findMany` for folder enrichment | Bypassed PE on enrichment pass | Single PE-gated query via `listAccessibleRecentFilesForAIContext` with `driveAIContextFileSelect` |
| `driveAIContextController` — `prisma.file.count` / `findMany` for storage stats | `accessibleOwnedOrSharedFileClause` without per-file PE | `aggregateAccessibleDriveStorageForAIContext` → `filterFilesByReadPolicy` |
| `driveAIContextController` — `prisma.file.count` for file count | Same clause gap | `countAccessibleDriveFilesForAIContext` |

**Post-1C:** `driveAIContextController.ts` has **no** `prisma` import. Prisma remains only inside `driveVisibilityService` (canonical File Hub read layer).

### Permission and visibility model

Documented in `DRIVE_AI_CONTEXT_VISIBILITY_MODEL`:

- **Owner OR FilePermission** with `trashedAt: null`
- **Policy Engine** `file:read` per row via `filterFilesByReadPolicy` / `canReadFile` / `evaluateDrivePolicyDual`
- Optional **`dashboardId`** query param for business dashboard scoping
- Soft-deleted (`trashedAt` set) files excluded at query and PE layers

---

## Files changed

| File | Change |
|------|--------|
| `server/src/controllers/driveAIContextController.ts` | Thin HTTP; delegates to `driveAIContextService` |
| `server/src/services/driveAIContextService.ts` | **New** — response shaping only |
| `server/src/services/driveVisibilityService.ts` | Wave 1C AI context exports + visibility model |
| `server/src/services/__tests__/driveVisibilityService.test.ts` | 5 AI context cases |
| `server/src/services/__tests__/driveAIContextService.test.ts` | **New** — response shape stability |
| `server/src/controllers/__tests__/driveAIContextController.test.ts` | **New** — no Prisma, service delegation |

**Not modified (per scope):** Drive UI, upload/delete/share routes, `ActionExecutor`, `toolExecutor`, centralized-ai, admin UI.

---

## Tests

| Test file | Coverage |
|-----------|----------|
| `driveVisibilityService.test.ts` | Excludes trashed; PE filters unauthorized; business `dashboardId` scope; storage/count aggregates |
| `driveAIContextService.test.ts` | Stable `recentFiles`, `storage`, `files.byType` shapes |
| `driveAIContextController.test.ts` | Controller imports no Prisma; calls service builders |

**Validation:**

- `pnpm type-check` — PASS
- Vitest (3 files, 21 tests) — PASS

---

## Certification updates

| Artifact | Change |
|----------|--------|
| [AI_CONTEXT_PROVIDER_MATRIX.md](./AI_CONTEXT_PROVIDER_MATRIX.md) | `recent_files`, `storage_overview`: visibility **Yes**, Prisma **No**, tests **yes** |
| [AI_PLATFORM_OPERATION_MATRIX.md](../AI_PLATFORM_OPERATION_MATRIX.md) | Drive context providers **N → C** |
| [AI_PLATFORM_SCORECARD.md](../AI_PLATFORM_SCORECARD.md) | Post-1C metrics; Drive blocker resolved |
| [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md) | AI Platform 1C complete; L2 gated on **1D** |
| [AI_PIPELINE_OWNERSHIP_MAP.md](../AI_PIPELINE_OWNERSHIP_MAP.md) | Drive context ownership → visibility service |

**AI_TOOL_ACTION_COMPLIANCE_MATRIX:** No change (tools already compliant post-1B; this wave is read-path context only).

---

## Remaining blockers (1D / 1E)

1. **centralized-ai admin gates** — Wave **1D**
2. **Provider capability matrix** — Wave **1E**
3. **Household / Business / Dashboard** LifeTwin stub actions — explicit `not_implemented` (tracked N; not 1C scope)
4. **HR / Scheduling / Dashboard** context providers — still direct Prisma (future waves)

---

## L2 readiness outlook

| Criterion | Post-1C |
|-----------|---------|
| Wave 1C Drive context via visibility service | **Met** |
| Drive context matrix **N** | **Resolved → C** |
| Blocking matrix **N** (admin gates) | **Open** — 1D |
| Full L2 promotion | **Not yet** — requires 1D zero-N on admin blocking rows per certification strategy |

**Platform level:** Remains **L1 — L2 path open**; 1C clears the primary File Hub / AI context constitutional gap (P1-3 / C-05).

---

## Sign-off

| Gate | Result |
|------|--------|
| No direct Prisma in Drive AI context controller | PASS |
| Canonical `driveVisibilityService` path | PASS |
| Response shape preserved | PASS |
| Permission + soft-delete tests | PASS |
| `pnpm type-check` | PASS |
