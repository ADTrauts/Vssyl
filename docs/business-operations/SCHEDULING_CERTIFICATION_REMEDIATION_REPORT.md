# Scheduling Certification Remediation Report

**Program:** Scheduling Certification Remediation  
**Date:** 2026-06-14  
**Scope:** F-SCH-001, F-SCH-002, F-SCH-003 only  
**Status:** Remediation complete — ready for separate re-evaluation program  

---

## Executive summary

All three certification blockers identified in `SCHEDULING_FINDINGS_REGISTER.md` have been remediated in code. No certification was awarded; `CERTIFICATION_LEDGER.md` was not updated per program instructions.

---

## F-SCH-001 — Direct Prisma mutations in `schedulingAdminToolsController.ts`

| Field | Detail |
|-------|--------|
| **Finding** | Controller contained 32 `prisma.*` calls including mutations (`scheduleShift.create`, `businessStation` CRUD, `jobLocation` CRUD). |
| **Status** | **RESOLVED** |
| **Remediation** | Extracted all data access and business logic into dedicated scheduling services. Controller reduced to validation, auth context, service delegation, and response mapping. |
| **Evidence** | `grep 'prisma\\.' server/src/controllers/scheduling/schedulingAdminToolsController.ts` → **0 matches** (only `@prisma/client` enum imports remain for request casting). |

### Files created

| File | Responsibility |
|------|----------------|
| `server/src/services/schedulingAdminToolsService.ts` | Recommendations, AI schedule generation (via `createShiftForBusiness`), assignment suggestions |
| `server/src/services/schedulingStationService.ts` | Business station list/create/read/update/delete |
| `server/src/services/schedulingJobLocationService.ts` | Job location list/create/update/delete with admin access checks |

### Files modified

| File | Change |
|------|--------|
| `server/src/controllers/scheduling/schedulingAdminToolsController.ts` | Thin orchestration; delegates to services via `mapSchedulingServiceError` |
| `server/src/services/schedulingShiftService.ts` | Added optional `priority` on `CreateShiftInput` so AI-generated shifts route through canonical shift create |

### Tests

- `server/src/services/__tests__/schedulingServiceExtraction.5c.test.ts` — 10 passed (regression)
- `pnpm type-check` — passed

---

## F-SCH-003 — Domain event coverage incomplete

| Field | Detail |
|-------|--------|
| **Finding** | No `schedulingDomainEventService`; lifecycle actions emitted module activity only, not registered domain events (unlike Chat/Calendar/File Hub). |
| **Status** | **RESOLVED** |
| **Remediation** | Added 20 scheduling domain event types to `domainEventRegistry.ts`, emitters in `domainEventEmitters.ts`, and `schedulingDomainEventService.ts`. Wired emitters into canonical services after successful authorize → execute → activity paths. |

### Lifecycle coverage

| Lifecycle | Domain event type(s) | Canonical service |
|-----------|---------------------|-------------------|
| Schedule create | `scheduling.schedule.created` | `schedulingScheduleService` |
| Schedule update | `scheduling.schedule.updated` | `schedulingScheduleService` |
| Schedule publish | `scheduling.schedule.published` | `schedulingPublishService` |
| Schedule delete (trash/restore/purge) | `scheduling.schedule.trashed` / `.restored` / `.permanentlyDeleted` | `schedulingTrashService` |
| Shift create | `scheduling.shift.created` | `schedulingShiftService` |
| Shift update | `scheduling.shift.updated` | `schedulingShiftService` |
| Shift assign / unassign | `scheduling.shift.assigned` / `.unassigned` | `schedulingShiftService` |
| Shift delete (trash/restore/purge) | `scheduling.shift.trashed` / `.restored` / `.permanentlyDeleted` | `schedulingTrashService` |
| Swap request / resolve | `scheduling.swap.requested` / `.resolved` | `schedulingSwapService` |
| Shift template lifecycle | `scheduling.template.shift.created` / `.updated` / `.archived` | `schedulingTemplateService` |
| Schedule template lifecycle | `scheduling.template.schedule.created` / `.updated` / `.trashed` | `schedulingTemplateService` + `schedulingTrashService` |

### Files created

| File | Purpose |
|------|---------|
| `server/src/services/schedulingDomainEventService.ts` | Service-layer wrappers over scheduling emitters |
| `server/src/events/__tests__/schedulingDomainEvents.test.ts` | Metadata contract tests (no PII/title/body leakage) |

### Files modified

| File | Change |
|------|--------|
| `server/src/events/domainEventRegistry.ts` | 20 scheduling `DOMAIN_EVENT_TYPES` + contracts |
| `server/src/events/domainEventEmitters.ts` | Scheduling emitter functions |
| `server/src/services/schedulingScheduleService.ts` | Domain events on create/update |
| `server/src/services/schedulingPublishService.ts` | Domain event on publish |
| `server/src/services/schedulingShiftService.ts` | Domain events on create, update, assign paths |
| `server/src/services/schedulingTrashService.ts` | Domain events on schedule/shift/template trash lifecycle |
| `server/src/services/schedulingSwapService.ts` | Domain events on swap request/resolve |
| `server/src/services/schedulingTemplateService.ts` | Domain events on template create/update/archive |
| `server/src/controllers/scheduling/schedulingAdminController.ts` | Passes `actorUserId` into template services for event attribution |

### Tests

| Suite | Result |
|-------|--------|
| `server/src/events/__tests__/schedulingDomainEvents.test.ts` | 3 passed |
| `server/src/services/__tests__/schedulingTrashService.test.ts` | 5 passed |
| `server/src/services/__tests__/schedulingServiceExtraction.5c.test.ts` | 10 passed |

---

## F-SCH-002 — Manifest `realtime: true` without certified implementation parity

| Field | Detail |
|-------|--------|
| **Finding** | `builtInModuleManifests.ts` declared `realtime: true` but no `schedulingRealtimeService` adapter exists (Chat/Calendar pattern). `publishBusinessSchedule` uses `chatSocketService.broadcastSchedulePublished` directly — not a certified scheduling realtime surface. |
| **Status** | **RESOLVED** |
| **Remediation** | Removed `realtime: true` from scheduling manifest capabilities for capability truthfulness. Added manifest test asserting realtime is not declared until a certified adapter ships. |
| **Evidence** | `buildBuiltInModuleManifest('scheduling').capabilities?.realtime` is **undefined** (not `true`). |

### Files modified

| File | Change |
|------|--------|
| `server/src/startup/builtInModuleManifests.ts` | Removed `realtime: true` from scheduling case |
| `server/src/startup/__tests__/builtInModuleManifests.scheduling.test.ts` | Added test: realtime not declared |

### Note on existing socket usage

`schedulingPublishService` and `schedulingTrashService` still call `getChatSocketService()` for broadcast helpers. These are **not** re-declared as manifest `realtime` capability; a future certified `schedulingRealtimeService` would be required before re-enabling the manifest flag.

### Tests

| Suite | Result |
|-------|--------|
| `server/src/startup/__tests__/builtInModuleManifests.scheduling.test.ts` | 3 passed |

---

## Verification summary

| Check | Result |
|-------|--------|
| `schedulingAdminToolsController.ts` Prisma mutations | **0** |
| Scheduling domain event types registered | **20** |
| Manifest `realtime` for scheduling | **not declared** |
| `pnpm type-check` | **pass** |
| Targeted vitest suites | **21 tests passed** |

---

## Certification blocker summary

| Finding   | Resolved |
| --------- | -------- |
| F-SCH-001 | **YES**  |
| F-SCH-002 | **YES**  |
| F-SCH-003 | **YES**  |

---

## Stop condition

Remediation is complete. Scheduling is **ready for re-evaluation** under a separate Certification Re-Evaluation Program.

- Certification **not** awarded in this program  
- `CERTIFICATION_LEDGER.md` **not** updated  
- Workforce Communications / HR / Analytics work **not** started  
