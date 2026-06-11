# AI Wave 1B Execution Plan

**Wave:** AI Platform **1B** — Tool/action compliance + route mount fix  
**Status:** **Complete** (2026-06-10)  
**Last updated:** 2026-06-10  
**Prerequisite:** Wave **1A** complete — [AI_CANONICAL_ROUTE_MAP.md](./AI_CANONICAL_ROUTE_MAP.md), [AI_LEGACY_RETIREMENT_PLAN.md](./AI_LEGACY_RETIREMENT_PLAN.md)  
**Authority:** [AI_PLATFORM_CERTIFICATION_STRATEGY.md](./AI_PLATFORM_CERTIFICATION_STRATEGY.md) Level 1→2 exit criteria

**Scope boundary:** Wave 1B does **not** include full 1C context provider rewrite (Drive visibility) except where required for `share_file` / list tools. Drive context Prisma (P1-3) is **1C primary** with 1B prep.

---

## Objectives

1. Clear all **P1 blockers** from certification audit (user-numbered P1-1 through P1-5).  
2. Zero mock `req/res` controller invocation on built-in **write** paths in `ActionExecutor`.  
3. Eliminate direct Prisma in `toolExecutor` for `share_file`.  
4. Resolve `/api/ai/context` route collision + update web clients.  
5. Hard-disable or sunset `/api/ai/autonomous` with migration note.  
6. Deprecate `POST /api/ai/chat` → twin.

**Exit gate:** `pnpm type-check` + AI executor/tool tests green; operation matrix blocking **N** rows reduced per strategy.

---

## P1 work packages

### P1-2 — Route collision: `GET /api/ai/context`

**Certification finding:** Constitutional audit **P0-3**; register **R-02**; Safety/category route ambiguity.

| Item | Detail |
|------|--------|
| **Problem** | `ai.ts` mounted at `/api/ai` before `ai-user-context` at `/api/ai/context`. `GET /` serves twin cross-module context, not user CRUD. Web clients expect CRUD list. |
| **Canonical** | Twin: keep `GET /api/ai/context` + `GET /api/ai/context/:module`. User CRUD: **`/api/ai/user-context`**. |

**Files impacted:**

| File | Change |
|------|--------|
| `server/src/index.ts` | Remount `aiUserContextRouter` at `/api/ai/user-context` |
| `server/src/routes/ai-user-context.ts` | Update file header comments |
| `web/src/components/ai/CustomContext.tsx` | Path prefix |
| `web/src/components/ai/AIMemoriesView.tsx` | Path prefix |
| `web/src/api/aiContextLearning.ts` | `pending`, `review` paths |
| `docs/architecture/AI_CANONICAL_ROUTE_MAP.md` | Mark collision resolved |

**Migration strategy:**

1. Add mount `/api/ai/user-context` (parallel).  
2. Update all web callers.  
3. Optionally return `410` + message on old CRUD paths if any external callers exist (grep repo).  
4. Document `GET /api/ai/context/:module` — module ids only; UUIDs use user-context.

**Risks:**

- Missed client still calling old GET → receives twin payload (silent wrong data). Mitigation: grep `web/`, `mobile/`, tests.  
- `/:module` vs UUID: add validation in twin route (reject UUID format → 404).

**Tests required:**

- Integration: `GET /api/ai/user-context` returns user entries; `GET /api/ai/context` returns orchestrated twin shape.  
- Contract test for mount order in `server/src/startup/__tests__` or route test file.

**Certification resolved:** P0-3 route shadow; matrix N row context collision; Level 1 exit #1 partial.

---

### P1-1 — `ActionExecutor` mock req/res (Drive, HR, Scheduling)

**Certification finding:** Constitutional **P0-1**, **P1-5** (stubbed household/dashboard); register **E-01**; [AI_TOOL_ACTION_COMPLIANCE_MATRIX](./audits/AI_TOOL_ACTION_COMPLIANCE_MATRIX.md).

| Item | Detail |
|------|--------|
| **Problem** | `ActionExecutor.executeByModule` synthesizes Express `req/res` and calls controllers for drive, HR, scheduling writes. |
| **Canonical** | Invoke `drive*AIActionService`, `hr*AIActionService`, `scheduling*AIActionService` (or existing canonical services). |

**Files impacted:**

| File | Change |
|------|--------|
| `server/src/ai/actions/ActionExecutor.ts` | Replace mock paths with service calls |
| `server/src/services/drive/*` | Expose AI-action entry points if missing |
| `server/src/services/hr/*` or controllers thin wrappers | Service methods for AI writes |
| `server/src/services/scheduling/*` | Same |
| `server/src/ai/actions/ActionExecutorRegistry.ts` | Verify registry parity |
| `server/src/services/__tests__/*` | Service-level tests |
| New: `server/src/ai/actions/__tests__/ActionExecutor.compliance.test.ts` | No mock req/res assertion |

**Migration strategy:**

1. Inventory each `executeByModule` branch with mock pattern (grep `mockResponse` / synthetic req).  
2. For each action: map to existing File Hub / module service method (reuse File Hub patterns).  
3. Pass `PolicyEngine` context through service layer (not controller).  
4. Household/dashboard: return explicit `not_implemented` or wire minimal service — **no synthetic success**.  
5. Remove mock helpers when last branch migrated.

**Risks:**

- Policy Engine dual enforcement skipped if service entry bypasses PE — mirror module certification patterns.  
- Activity/event emission dropped — each service must preserve `authorize → execute → emit`.  
- Regression on twin action suggestions UX.

**Tests required:**

- Unit: each migrated action calls service mock, not controller.  
- Integration: twin end-to-end with drive share/move action (if shipped).  
- Compliance matrix row update to **C**.

**Certification resolved:** P0-1 V2 mock writes; P1-5 stubs; matrix drive/HR/scheduling action rows.

---

### P1-4 — `share_file` Prisma in `toolExecutor`

**Certification finding:** Constitutional **P1-2**; File Hub audit P1-12 adjacent.

| Item | Detail |
|------|--------|
| **Problem** | `toolExecutor` `share_file` (and possibly `list_drive_files`) uses direct Prisma for permission lookup. |
| **Canonical** | `driveVisibilityService` + share permission service. |

**Files impacted:**

| File | Change |
|------|--------|
| `server/src/ai/tools/toolExecutor.ts` | Replace Prisma with service calls |
| `server/src/services/drive/driveVisibilityService.ts` | Export share lookup if needed |
| `server/src/ai/tools/__tests__/toolExecutor.drive.test.ts` | Extend coverage |

**Migration strategy:**

1. Extract share target resolution to `driveVisibilityService` or `driveShareService`.  
2. Tool executor calls service with `userId`, `dashboardId`, `businessId` scope.  
3. Align `list_drive_files` with `listAccessibleDriveFiles` (may overlap P1-3 — minimum fix in 1B for write/read used by tools).

**Risks:**

- Performance regression if service adds extra joins — acceptable for compliance.  
- Tool loop auth context missing tenant ids — validate twin passes scope.

**Tests required:**

- Tool executor test: share_file does not import `prisma` directly.  
- Visibility parity test vs controller list.

**Certification resolved:** V1 on tool path; matrix tool compliance 100% target.

---

### P1-5 — `AutonomousActionExecutor` + `/api/ai/autonomous`

**Certification finding:** Constitutional **P0-2**; register **E-03**, **R-05**.

| Item | Detail |
|------|--------|
| **Problem** | Parallel write path with deprecated routes; Prisma writes without twin approval parity. |
| **Canonical** | Twin tool loop + `/api/ai/approvals` only. |

**Files impacted:**

| File | Change |
|------|--------|
| `server/src/routes/ai/autonomous.ts` | Return `410 Gone` or feature flag off |
| `server/src/index.ts` | Optional: keep mount with deprecation middleware |
| `server/src/ai/actions/AutonomousActionExecutor.ts` | Remove from production path / delete calls |
| `server/src/routes/ai.ts` | Ensure approvals are canonical |
| `memory-bank/moduleSpecs.md` | Sunset note if referenced |

**Migration strategy:**

1. Grep all callers of `/api/ai/autonomous` (web + server).  
2. If none: hard-disable routes with clear JSON error + link to twin.  
3. Remove autonomous executor registration from any startup path.  
4. Keep file for one release with deprecation header, delete in Wave 2.

**Risks:**

- Hidden internal caller — grep + log deprecation week before removal.

**Tests required:**

- Route returns 410/403 for all autonomous endpoints.  
- Twin approval flow still works.

**Certification resolved:** P0-2; Level 1 exit #5.

---

### P1-3 — Drive context provider Prisma (prep in 1B, complete in 1C)

**Certification finding:** Constitutional **P1-1**; register **C-05**.

| Item | Detail |
|------|--------|
| **Problem** | `driveAIContextController` queries Prisma directly for recent files / storage stats. |
| **Canonical** | `listAccessibleDriveFiles`, drive visibility service. |

**1B scope (prep only):**

- Document interface contract in compliance matrix.  
- If `list_drive_files` tool migrated in P1-4, share visibility helper.

**1C scope (full):**

| File | Change |
|------|--------|
| `server/src/controllers/driveAIContextController.ts` | Thin → service |
| `server/src/services/drive/driveVisibilityService.ts` | Context read methods |
| `server/src/routes/drive.ts` | No change if controller delegates |

**Tests:** Provider integration test; orchestrator fetch drive context.

**Certification resolved:** Matrix N drive context row — **1C**.

---

### Additional 1B items (from 1A register)

| ID | Item | Files | Wave |
|----|------|-------|------|
| R-03 | Deprecate `POST /api/ai/chat` | `ai.ts`, web grep | 1B — return 308 or twin proxy |
| R-04 | Personality/autonomy shims | `ai.ts` | 1C — remove GET/PUT duplicates |
| Save-to-drive | AI media → drive service | `ai.ts` generate-image save | 1B follow-up P2 |

---

## Suggested implementation order

| Order | Package | Est. effort | Blocks |
|------:|---------|-------------|--------|
| 1 | **P1-2** route remount + web | 0.5–1 day | Client correctness |
| 2 | **P1-4** share_file service | 1 day | Tool compliance |
| 3 | **P1-1** ActionExecutor drive branch | 2–3 days | Largest risk |
| 4 | **P1-1** HR + scheduling branches | 2 days | PE parity |
| 5 | **P1-5** autonomous sunset | 0.5 day | Safety |
| 6 | **R-03** chat deprecation | 0.5 day | Route clarity |
| 7 | Stub guard household/dashboard | 0.5 day | P1-5 honesty |

**Total estimate:** 7–10 engineering days + review.

---

## Test plan (1B exit)

| # | Check |
|---|-------|
| 1 | `pnpm type-check` |
| 2 | `pnpm test` — server suite |
| 3 | `ActionExecutor.compliance.test.ts` — zero mock controller |
| 4 | `toolExecutor` drive tests — no direct Prisma |
| 5 | Route tests — user-context vs twin context |
| 6 | Manual: Control Center custom context CRUD |
| 7 | Manual: twin chat with drive tool share |
| 8 | Update [AI_TOOL_ACTION_COMPLIANCE_MATRIX](./audits/AI_TOOL_ACTION_COMPLIANCE_MATRIX.md) |

---

## Certification impact (estimated)

| Metric | Before 1B | After 1B (target) |
|--------|-----------|-------------------|
| AI Platform level | **L0** (G0) | **L1 stabilizing** → **L2 path open** |
| Operation matrix **N** (blocking) | 6 | ≤3 (drive context remains 1C) |
| Constitutional P0 | 3 | **0** |
| Constitutional P1 (route/executor) | 5+ | **1** (drive context → 1C) |
| Tool/action matrix compliance | Partial | **~95%** (pending 1C context) |
| Safety scorecard category | FAIL | **PASS** (route + autonomous) |

**Level 2 promotion** still requires **Wave 1C** (Drive context provider) + **1D** admin gates per [AI_PLATFORM_CERTIFICATION_STRATEGY.md](./AI_PLATFORM_CERTIFICATION_STRATEGY.md).

---

## Definition of done (1B)

- [x] `/api/ai/user-context` live; web clients migrated  
- [x] `GET /api/ai/context` unambiguously twin aggregate  
- [x] No mock req/res in `ActionExecutor` built-in write branches  
- [x] `share_file` uses drive services  
- [x] `/api/ai/autonomous` disabled with tests  
- [x] `POST /api/ai/chat` deprecated  
- [x] Compliance matrix + ledger updated  
- [x] Memory bank activeContext/progress updated on ACT closeout

---

## Wave 1A → 1B handoff

| 1A deliverable | 1B consumer |
|----------------|-------------|
| [AI_CANONICAL_ROUTE_MAP.md](./AI_CANONICAL_ROUTE_MAP.md) | Route rename spec |
| [AI_PIPELINE_OWNERSHIP_MAP.md](./AI_PIPELINE_OWNERSHIP_MAP.md) | Service ownership targets |
| [AI_LEGACY_RETIREMENT_PLAN.md](./AI_LEGACY_RETIREMENT_PLAN.md) | P1 matrix rows |
| This document | Implementation checklist |

**Authorization:** Explicit user **ACT** for Wave 1B before code changes.
