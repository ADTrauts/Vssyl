# CO-04 Global Trash Alignment — Engineering Blueprint

**CO:** CO-04 (G06)  
**Status:** Engineering scope — no implementation  
**Last updated:** 2026-06-14  
**Plan source:** [GLOBAL_TRASH_ALIGNMENT_PLAN.md](./GLOBAL_TRASH_ALIGNMENT_PLAN.md)  
**Pattern:** `trashController.ts`, `registerGlobalTrashHandlers.ts`

---

## Purpose

Engineering scope to align Scheduling and HR with platform Global Trash: `trashedAt` lifecycle, module handlers, restore/purge paths. Scheduling currently hard-deletes; HR uses `deletedAt`.

---

## Work packages (engineering mapping)

| WP | Deliverable |
|----|-------------|
| WP-04-01 | Prisma migrations — `trashedAt` columns |
| WP-04-02 | CREATE `schedulingTrashService.ts` |
| WP-04-03 | CREATE `hrTrashService.ts` |
| WP-04-04 | Register handlers in `registerGlobalTrashHandlers.ts` |
| WP-04-05 | Replace hard deletes in scheduling controllers |
| WP-04-06 | Align HR `deletedAt` queries to `trashedAt` |
| WP-04-07 | Web trash integration |
| WP-04-08 | Trash tests |

---

## Entities

### Scheduling (add `trashedAt DateTime?`)

| Model | Schema file | List query filter |
|-------|-------------|-------------------|
| `Schedule` | `prisma/modules/scheduling/core.prisma` | `trashedAt: null` |
| `ScheduleShift` | same | `trashedAt: null` |
| `ScheduleTemplate` | same | `trashedAt: null` |
| `ShiftTemplate` | same | `trashedAt: null` (P2) |
| `EmployeeAvailability` | same | `trashedAt: null` (P2) |

**`ScheduleStatus.ARCHIVED`:** Map to trash disposition or retain as business state — document in migration notes (M3). Do not conflate ARCHIVED with trashed without explicit rule.

### HR (migrate `deletedAt` → `trashedAt`)

| Model | Current | Target |
|-------|---------|--------|
| `EmployeeHRProfile` | `deletedAt` | `trashedAt` (+ data migration) |
| Onboarding templates | verify | `trashedAt` if user-deletable |

**Schema file:** `prisma/modules/hr/core.prisma`

---

## Handlers

**Registry:** `server/src/services/globalTrashModuleRegistry.ts`  
**Registration:** `server/src/startup/registerGlobalTrashHandlers.ts`

**Current handlers (inspection):** drive, chat, calendar, todo, notes, place — **no scheduling/hr**

### Planned registrations (MODIFY `registerGlobalTrashHandlers.ts`)

| moduleId | Handler service | Operations |
|----------|-----------------|------------|
| `scheduling` | `schedulingTrashService.ts` | trash, restore, purge, list |
| `hr` | `hrTrashService.ts` | trash, restore, purge, list |

**Controller:** `server/src/controllers/trashController.ts` — routes delegate to registered handlers

---

## New services (CREATE)

### `schedulingTrashService.ts`

| Function | Behavior |
|----------|----------|
| `trashSchedule(id, ctx)` | Set `trashedAt`; cascade shifts optional |
| `restoreSchedule(id, ctx)` | Clear `trashedAt` |
| `purgeSchedule(id, ctx)` | Hard delete (admin purge from global trash) |
| `listTrashed(ctx)` | Business-scoped trashed schedules |
| `trashShift` / `restoreShift` / `purgeShift` | Shift-level operations |

### `hrTrashService.ts`

| Function | Behavior |
|----------|----------|
| `trashEmployee(id, ctx)` | Set `trashedAt` on profile |
| `restoreEmployee(id, ctx)` | Clear `trashedAt` |
| `purgeEmployee(id, ctx)` | Hard delete (exception path) |
| `listTrashed(ctx)` | Business-scoped trashed employees |

**Pattern reference:** `calendarTrashService.ts`, `todoTrashService.ts`

---

## Restore paths

| Entry | Flow |
|-------|------|
| Global Trash UI | `GlobalTrashBin.tsx` → `restoreItem` → `trashController` → handler `restore*` |
| API | `POST /api/trash/restore` (existing platform route) |

**Web file:** `web/src/components/GlobalTrashBin.tsx` — already dispatches `scheduleTrashed` custom event (~L269); wire scheduling module metadata

---

## Purge paths

| Entry | Flow |
|-------|------|
| Empty trash | `emptyTrash` → handler `purge*` per item |
| Permanent delete | `deleteItem` in GlobalTrashContext |

---

## Hard delete replacement (Scheduling)

**Inspection findings — MODIFY to soft-delete:**

| File | Function | Line ref |
|------|----------|----------|
| `schedulingAdminController.ts` | `deleteSchedule` | ~L400 |
| `schedulingAdminController.ts` | `deleteShift` | ~L424 |
| `schedulingAdminController.ts` | other deletes | ~L1302, ~L1976 |
| `schedulingTeamController.ts` | verify deletes | grep `.delete(` |
| `schedulingEmployeeController.ts` | verify | — |

**Replace:** `prisma.*.delete` → `schedulingTrashService.trash*`

---

## HR deletedAt alignment

| File | Change |
|------|--------|
| `hrController.ts` | `deleteEmployee`, `terminateEmployee` — use `hrTrashService` |
| `hrController.ts` | ~L1010 `deletedAt` filters → `trashedAt` |
| `hrAttendanceService.ts` | Employee queries exclude trashed |
| `employeeManagementService.ts` | EP queries respect HR profile trash state |

---

## Migrations

| ID | File (planned) | Content |
|----|----------------|---------|
| M1 | `prisma/migrations/YYYYMMDD_scheduling_trashed_at/` | Add `trashedAt` to Schedule, ScheduleShift, templates |
| M2 | `prisma/migrations/YYYYMMDD_hr_trashed_at/` | Add `trashedAt`; migrate `deletedAt` data; deprecate column |
| M3 | Decision doc in migration README | ARCHIVED vs trashed |

---

## Routes

No new routes. Existing delete routes change behavior (soft delete). Trash API uses platform `trashController`.

| Route | New behavior |
|-------|--------------|
| `DELETE /admin/schedules/:id` | Soft trash |
| `DELETE /admin/shifts/:id` | Soft trash |
| `DELETE /admin/employees/:id` | Soft trash via HR handler |

---

## Web targets

| File | Change |
|------|--------|
| `web/src/contexts/GlobalTrashContext.tsx` | Module icons for scheduling/hr |
| `web/src/components/GlobalTrashBin.tsx` | `scheduleTrashed` event handler completion |
| Scheduling UI components | Call trash via `useGlobalTrash().trashItem` where applicable |

---

## Tests

| Test file (CREATE) | Scope |
|--------------------|-------|
| `server/src/services/__tests__/schedulingTrashService.test.ts` | trash/restore/purge |
| `server/src/services/__tests__/hrTrashService.test.ts` | trash/restore/purge |
| `server/src/controllers/__tests__/trashController.scheduling.test.ts` | Handler routing |
| `server/src/controllers/__tests__/trashController.hr.test.ts` | Handler routing |

**Test requirements:**

- Trashed items excluded from list queries
- Restore idempotent
- Purge requires trashed state
- Tenant isolation on all paths

---

## Entry / exit criteria

| | Criteria |
|---|----------|
| **Entry** | CO-05 lifecycle paths defined; CO-01 delete events ready |
| **Exit** | Handlers registered; migrations applied; no scheduling hard-delete on user paths; HR uses `trashedAt` |

---

## Assumptions

- Global Trash platform API stable.
- Cascade rules documented per entity (shift with schedule).
- Purge remains admin-only exception.

---

## Risks

| ID | Risk |
|----|------|
| R-01 | Migration data loss (`deletedAt` → `trashedAt`) |
| R-10 | Hard-delete callers outside controllers |
| R-11 | ARCHIVED schedule confusion |

---

## Dependencies

| CO | Reason |
|----|--------|
| CO-05 | Employee delete/terminate alignment |
| CO-01 | Delete activity events after soft-delete |
| CO-02 | Optional trash notifications (P2) |

---

## Verification criteria

- [ ] `registerGlobalTrashHandlers` includes scheduling + hr
- [ ] No user-facing `prisma.schedule.delete` without trash service
- [ ] List endpoints filter `trashedAt: null`
- [ ] Global Trash UI shows scheduling/hr items
- [ ] Migration rollback plan documented
