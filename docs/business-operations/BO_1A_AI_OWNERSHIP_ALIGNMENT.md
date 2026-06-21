# BO-1A AI Ownership Alignment

**Program:** Business Operations BO-1A  
**Date:** 2026-06-19

---

## Constitutional rule

**AI may consume context. AI may not own persistence.**

Controllers under `/api/*/ai/context/*` must be thin HTTP adapters. All Prisma reads/writes belong in module constitutional services.

---

## Scheduling AI manifest (BO-F-D03)

| Metric | Before BO-1A | After BO-1A |
|--------|--------------|-------------|
| Manifest declared actions | 9 (included `view_schedules`) | **8** |
| Implemented executors | 2 (`generate_schedule`, `suggest_assignments`) | **8** |
| Placeholder errors | 6 | **0** |

### Manifest actions (after)

1. `create_schedule` → `aiCreateSchedule`
2. `publish_schedule` → `aiPublishSchedule`
3. `assign_shift` → `aiAssignShift`
4. `swap_shift` → `aiRequestShiftSwap`
5. `set_availability` → `aiSetAvailability`
6. `claim_open_shift` → `aiClaimOpenShift`
7. `generate_schedule` → `aiGenerateSchedule`
8. `suggest_assignments` → `aiSuggestShiftAssignments`

**Removed:** `view_schedules` — read intent served by context providers (`/ai/context/overview`, `coverage`, `conflicts`).

### Ownership model

| Layer | Owner |
|-------|-------|
| Manifest registration | `registerBuiltInModules.ts` |
| AI write execution | `schedulingAIActionService.ts` → existing scheduling services |
| Action routing | `ActionExecutor.executeSchedulingAction` |
| AI context reads | `schedulingAiContextService.ts` |
| HTTP adapters | `schedulingAiContextController.ts` (no Prisma) |

**BO-F-D03:** Closed.

---

## AI context Prisma remediation

### Scheduling (F-SCH-004)

| Metric | Before | After |
|--------|--------|-------|
| Controller Prisma reads | 16 | **0** |
| Service ownership | None (controller) | `schedulingAiContextService.ts` |

**F-SCH-004:** Closed.

### HR (F-HR-003)

| Metric | Before | After |
|--------|--------|-------|
| Controller Prisma reads | 15 | **0** |
| Service ownership | None (controller) | `hrAiContextService.ts` |

**F-HR-003:** Closed.

---

## Context provider endpoints (unchanged paths)

| Module | Endpoints |
|--------|-----------|
| Scheduling | `/api/scheduling/ai/context/overview`, `coverage`, `conflicts` |
| HR | `/api/hr/ai/context/overview`, `headcount`, `time-off` |

PE added on HR AI context routes: `HR_EMPLOYEE_READ` / `HR_TIME_OFF_READ`.
