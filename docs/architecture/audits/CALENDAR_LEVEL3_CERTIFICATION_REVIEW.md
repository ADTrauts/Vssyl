# Calendar Level 3 Certification Review

**Module id:** `calendar`  
**Date:** 2026-06-01  
**Phase:** Wave 2 Phase 4 — Certification closeout  
**Benchmarks:** File Hub (`drive`) — [FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md](./FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md); Chat (`chat`) — [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./CHAT_LEVEL3_CERTIFICATION_REVIEW.md)  
**Authorities:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

## Executive summary

Calendar Wave 1 (1A–1F) and Wave 2 (2A Global Trash, 2B V_Link + platform entity) satisfy **Level 3 — Certified** against the constitutional checklist and File Hub / Chat pattern catalog. Residual gaps are **documented partials** (event comments controller, utils ICS export route, SMTP-only invite emails, optional workspace landing hub) that do not block certification and mirror acceptable Chat partials.

**Reference Module #3:** Calendar is designated **Reference Module #3 (Level 3)** for scheduling, recurrence, reminder dispatch, and scheduler→service delegation — patterns not fully demonstrated by File Hub or Chat. It is **not** Level 4 Reference Implementation; File Hub remains the sole Level 4 authority.

**Certification decision:** **Level 3 Certified** (2026-06-01)

---

## Level 3 gate review

| Gate | Status | Evidence |
|------|--------|----------|
| **Canonical Service Boundaries** | 🟢 | `calendarService`, `calendarEventService`, `calendarVisibilityService`, `calendarTrashService`, `calendarAttendeeService`, `calendarIcsService`, `calendarRecurrenceService`, `calendarSchedulerService`, `calendarReminderService`, `calendarAIActionService`, adapters (`calendarActivityService`, `calendarNotificationService`, `calendarRealtimeService`, `calendarDomainEventService`), `calendarVlinkAccessService`, `calendarVlinkLifecycleService` |
| **Thin Controllers** | 🟢 | `calendarController.ts` (~475 lines, **zero** `prisma.`); `calendarAIContextController.ts` delegates to visibility; contract test `calendarController.contract.test.ts` |
| **Policy Engine** | 🟢 | `calendarPolicyDual` + `policyEngine` calendar actions on event create and reads; `getCalendarForWrite` / membership on mutations |
| **Global Trash** | 🟢 | `calendarTrashService`; `registerGlobalTrashHandlers` `moduleId: 'calendar'`, `supportedTypes: ['event']` — [CALENDAR_GLOBAL_TRASH_PHASE2A.md](./CALENDAR_GLOBAL_TRASH_PHASE2A.md) |
| **Visibility Services** | 🟢 | `calendarVisibilityService` — list/search/conflicts/free-busy/AI; `trashedAt: null`; post-query PE read filter |
| **Domain Events** | 🟢 | Registered `calendar.event.*`, `calendar.calendar.*`, `calendar.event.reminderDispatched`; service-owned via `calendarDomainEventService` |
| **Module Activity** | 🟢 | `calendarActivityService` on event/calendar writes, trash lifecycle, reminder dispatch |
| **Notifications** | 🟢 | `calendarNotificationService`; manifest `calendar_reminder`; SMTP invite/update/cancel via adapter (not in-app catalog — intentional) |
| **Realtime** | 🟢 | `calendarRealtimeService`; `calendar_event` fan-out on create/update/delete |
| **Scheduler Ownership** | 🟢 | `platformCronJobs` → `calendarSchedulerService.runReminderDispatch` → `calendarReminderService` (no cron Prisma) |
| **Reminder Ownership** | 🟢 | `calendarReminderService.dispatchDueReminders`; activity + domain event on dispatch |
| **AI Compliance** | 🟢 | `calendarAIActionService`; `ActionExecutor` → services; AI context via `calendarVisibilityService` helpers |
| **Platform Entities** | 🟢 | `registerCalendarPlatformEntities` — `calendar:event` → `CALENDAR_EVENT` |
| **V_Link** | 🟢 | `calendarVlinkAccessService` + `calendarVlinkLifecycleService` on permanent delete — [CALENDAR_VLINK_PHASE2B.md](./CALENDAR_VLINK_PHASE2B.md) |
| **Manifest Truthfulness** | 🟢 | Capabilities match runtime; single entity; one emitted notification type |
| **Tests** | 🟢 | 25 calendar-related test files, 68 tests (services, PE, trash, V_Link, manifest, AI, controller contract) |
| **Documentation** | 🟢 | Constitutional audit, operation matrix, extraction plan, Phase 2A/2B audits, this review |

No **🔴** blockers remain for Level 3.

---

## Constitutional / pattern violations (residual)

| Item | Severity | Status | Notes |
|------|----------|--------|-------|
| `eventCommentController` inline Prisma (~62 lines) | Low | 🟡 Accepted | Sub-resource; not linkable entity; no trash/V_Link |
| `calendarUtilsController` ICS export helper | Low | 🟡 Accepted | Read-oriented; event export primary path is `calendarIcsService` |
| SMTP invite/update/cancel not in-app notification catalog | Low | 🟡 Accepted | Manifest lists only `calendar_reminder` (actually emitted) |
| No dedicated `CalendarWorkspaceLanding.tsx` | Low | 🟡 Accepted | Same class as Chat/File Hub workspace hub partial |
| `reminder_dispatch` job tier `transitional` in registry | Low | 🟡 Accepted | Handler delegates to module service; inventory documented |
| Platform-wide activity **read** migration | Low | 🟡 Accepted | Shared with File Hub P2 ACT-R1 |
| Place → calendar integration not service-extracted | Low | 🟡 Deferred | Integration test exists; not calendar core |

---

## Operation matrix audit

The matrix file predates closeout and **understates** compliance on several rows (e.g. calendar CRUD activity, event create/update domain events). Below is the **certification-time** assessment of inventoried operations.

### Compliant (service-owned, side effects where applicable)

| Operation | Service | Blocker? |
|-----------|---------|----------|
| Create / update / delete event (soft trash) | `calendarEventService` / `calendarTrashService` | No |
| Global Trash trash / restore / permanent delete | `calendarTrashService` | No |
| RSVP (auth) | `calendarAttendeeService` | No |
| Import / export ICS (events) | `calendarIcsService` | No |
| V_Link resolve event | `calendarVlinkAccessService` | No |
| Dispatch reminders | `calendarSchedulerService` → `calendarReminderService` | No |
| AI context + executor | `calendarVisibilityService` / `calendarAIActionService` | No |

### Partially compliant (acceptable for Level 3)

| Operation | Why P | Blocker? | Verdict |
|-----------|-------|----------|---------|
| List / search events, conflicts, free/busy | Service-owned reads; PE applied post-query filter (Chat pattern) | No | 🟡 Accept |
| Create / update / delete **calendar** | `calendarService` + activity/domain; matrix PE column not updated | No | 🟡 Accept |
| Create / update event | Full adapters; matrix columns stale | No | 🟡 Accept |
| RSVP (public token) | Service-owned; no PE on token route (by design) | No | 🟡 Accept |
| Import ICS | Activity on import; optional domain event gap | No | 🟡 Accept |
| Realtime fan-out row | Implemented via `calendarRealtimeService` from services; matrix lists controller | No | 🟡 Accept |
| List calendars | Visibility + PE filter | No | 🟡 Accept |

### Non-compliant (impact assessment)

| Operation | Why N | Blocker? | Verdict |
|-----------|-------|----------|---------|
| List / add / delete event **comments** | `eventCommentController` Prisma | **No** | Sub-feature; isolate in future wave |
| Export calendar ICS (`calendarUtils`) | Utils controller | **No** | Thin export helper |
| Place → calendar link | `placeMeetingController` | **No** | Cross-module integration |
| Auto-provision calendar | In `calendarService` but matrix N for PE column | **No** | Service-owned |

**Matrix maintenance:** Update [CALENDAR_OPERATION_MATRIX.md](./CALENDAR_OPERATION_MATRIX.md) event/notification summary tables when convenient; certification does not require full matrix regrade.

---

## Scheduler architecture review

**Chain (verified in repo):**

```text
platformCronJobs.registerPlatformJob('reminder_dispatch')
  → calendarSchedulerService.runReminderDispatch(5)
    → calendarReminderService.dispatchDueReminders(5)
      → prisma (due reminders query only inside reminder service)
      → calendarNotificationService.notifyReminderDue
      → calendarActivityService.recordReminderDispatched
      → calendarDomainEventService.recordCalendarEventReminderDispatchedDomainEvent
```

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Cron does not use Prisma directly | 🟢 | `platformCronJobs.ts` imports only `runReminderDispatch` |
| Scheduler does not own business logic | 🟢 | `calendarSchedulerService.ts` is one-line delegate |
| Reminder lifecycle service-owned | 🟢 | `calendarReminderService.ts` |
| Legacy `reminderService` deprecated | 🟢 | Re-exports `dispatchDueReminders` from calendar module |

**Finding:** Architecture matches Chat/File Hub “cron → module scheduler → domain service” pattern. Job remains `tier: 'transitional'` in platform registry (inventory partial platform-wide, not a Calendar L3 blocker).

---

## Manifest truth review

| Capability | Declared | Runtime truth | Verdict |
|------------|----------|---------------|---------|
| `read` | ✅ | Visibility + membership scope | 🟢 |
| `write` | ✅ | Services own mutations | 🟢 |
| `ai` | ✅ | `calendarAIActionService` + visibility AI helpers | 🟢 |
| `vlink` | ✅ | `CALENDAR_EVENT` via `calendarVlinkAccessService` | 🟢 |
| `trash` | ✅ | Global Trash handler + `trashedAt` | 🟢 |
| `search` | ✅ | `searchEvents` in visibility service | 🟢 |
| `realtime` | ✅ | `calendarRealtimeService` | 🟢 |
| `notifications` | ✅ | `calendar_reminder` emitted | 🟢 |
| `globalActivity` | ✅ | `calendarActivityService` writes | 🟢 |
| `businessWorkspace` | ✅ | `BusinessWorkspaceContent` case `calendar` | 🟢 |

**entities[]:** `event` only — aligned with `registerCalendarPlatformEntities` and resolver.

**notifications[]:** `calendar_reminder` only — no aspirational invite/update/cancel in-app types (SMTP flows remain adapter-only).

**Not added:** calendar container, reminder, attendee, recurrence instance entities (deferred per Phase 2B).

---

## V_Link review

| Rule | Status | Evidence |
|------|--------|----------|
| Member / personal owner / attendee can resolve | 🟢 | `userHasLegacyCalendarEventReadAccess` in `calendarVlinkAccessService.ts` |
| Policy `CALENDAR_EVENT_READ` enforced | 🟢 | `passesCalendarEventReadPolicy` |
| Trashed events fail closed | 🟢 | `state: 'trashed'`, `allowed: false` |
| Deleted events fail closed | 🟢 | `state: 'deleted'` when row missing |
| V_Link membership alone insufficient | 🟢 | Resolver never checks V_Link participants for content |
| Permanent delete unlinks links | 🟢 | `unlinkCalendarEventFromAllVLinks` before `deleteMany` in trash service |
| Unlink domain event | 🟢 | `emitVLinkEntityUnlinkedEvent` per link (errors logged, delete continues) |

Tests: `calendarVlinkAccessService.test.ts`, `calendarVlinkLifecycleService.test.ts`, `vlinkEntityResolverService.calendar.test.ts`.

---

## Activity vs domain event coverage (certification snapshot)

| Operation | Module activity | Domain event |
|-----------|-----------------|--------------|
| Create calendar | ✅ | ✅ `calendar.calendar.created` |
| Update / delete calendar | ✅ | ✅ updated / deleted |
| Create / update event | ✅ | ✅ created / updated |
| Trash / restore / permanent delete event | ✅ | ✅ trashed / restored / permanentlyDeleted |
| RSVP update | ✅ | ✅ `calendar.event.rsvpUpdated` |
| Reminder dispatched | ✅ | ✅ `calendar.event.reminderDispatched` |

Soft trash no longer emits legacy `calendar.event.deleted` with `softDelete: true` (use `calendar.event.trashed`).

---

## Reference Module #3 assessment

| Area | Status | Notes |
|------|--------|-------|
| Scheduling | 🟢 | Multi-context calendars, attendees, ICS |
| Recurrence | 🟢 | `calendarRecurrenceService` — RRULE, THIS/SERIES, exceptions |
| Reminder Dispatch | 🟢 | Cron → reminder service → notification adapter |
| Scheduler Ownership | 🟢 | Thin `calendarSchedulerService` |
| Notifications | 🟢 | In-app reminder + SMTP invite flows via adapter |
| Realtime | 🟢 | `calendarRealtimeService` |
| AI Compliance | 🟢 | No controller/executor Prisma on calendar paths |
| Global Trash | 🟢 | Handler + service |
| V_Link | 🟢 | Event access + lifecycle |
| Platform Entities | 🟢 | `calendar:event` |
| Certification Readiness | 🟢 | Level 3 |

**Decision:** **Reference Module #3 (Level 3)** — use Calendar as the third module pattern source for **scheduling**, **recurrence**, **reminders**, and **scheduler delegation**. **Not** Level 4 until a dedicated reference implementation review and architecture council approval (File Hub bar).

---

## Certification decision

### Level 3 Certified

All Level 3 gates are **🟢** or **🟡 accepted partial** with no 🔴 blockers. Evidence:

- Waves 1A–1F + 2A–2B complete and pushed (`74970bd6` … `35aacd89`)
- 68 passing calendar-focused tests; `tsc --noEmit -p server` clean
- Thin controller, Global Trash handler, V_Link access/lifecycle, manifest truth

### Not chosen: Not Certified / Conditionally Certified only

Conditional tier reserved when 🔴 blockers exist (e.g. Prisma in main controller, missing trash handler, missing PE on destructive writes). Calendar does not meet those failure criteria.

---

## Remaining punch-list (post–Level 3, non-blocking)

1. Extract `eventCommentService` or defer comments to a later hygiene phase.
2. Consolidate `calendarUtilsController` export into `calendarIcsService` if desired.
3. Optional in-app notification metadata for SMTP invite/update/cancel if product adds catalog entries.
4. `CalendarWorkspaceLanding.tsx` hub (module-development checklist).
5. Refresh operation matrix C/P/N columns to match runtime (documentation hygiene).
6. Level 4 promotion: `CALENDAR_REFERENCE_IMPLEMENTATION_REVIEW.md` + council (out of scope).

---

## Recommended next module

**Todo** (Wave 2 per roadmap) — apply Calendar + Chat patterns for services, PE, Global Trash, and manifest entities. Do not start until this review is acknowledged.

---

## Evidence links

- [CALENDAR_CONSTITUTIONAL_AUDIT.md](./CALENDAR_CONSTITUTIONAL_AUDIT.md)
- [CALENDAR_OPERATION_MATRIX.md](./CALENDAR_OPERATION_MATRIX.md)
- [CALENDAR_SERVICE_EXTRACTION_PLAN.md](./CALENDAR_SERVICE_EXTRACTION_PLAN.md)
- [CALENDAR_GLOBAL_TRASH_PHASE2A.md](./CALENDAR_GLOBAL_TRASH_PHASE2A.md)
- [CALENDAR_VLINK_PHASE2B.md](./CALENDAR_VLINK_PHASE2B.md)
- [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

*End of Calendar Level 3 Certification Review.*
