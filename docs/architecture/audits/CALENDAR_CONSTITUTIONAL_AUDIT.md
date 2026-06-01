# Calendar Constitutional Audit

**Module id:** `calendar`  
**Phase:** Wave 1 Phase 0 — Audit only (no implementation)  
**Date:** 2026-05-31  
**Benchmarks:** File Hub (`drive`), Chat (`chat`) — [CHAT_REFERENCE_IMPLEMENTATION_REVIEW.md](../CHAT_REFERENCE_IMPLEMENTATION_REVIEW.md)  
**Related:** [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

## 1. Inventory

### Controllers and routes

| Artifact | Path | Lines (approx.) | Notes |
|----------|------|-----------------|-------|
| **Primary controller** | `server/src/controllers/calendarController.ts` | **1,713** | 17 exported handlers; **~63** `prisma.` calls |
| **AI context controller** | `server/src/controllers/calendarAIContextController.ts` | ~370 | Direct Prisma; personal-calendar scope only on upcoming/today |
| **Utils controller** | `server/src/controllers/calendarUtilsController.ts` | 43 | ICS export helper |
| **Event comments** | `server/src/controllers/eventCommentController.ts` | 62 | Inline Prisma |
| **Routes** | `server/src/routes/calendar.ts` | ~180 | Calendar CRUD, events, RSVP, import/export, AI context, public RSVP with inline Prisma |

### Services (module-specific)

| Service | Exists? | Role |
|---------|---------|------|
| `calendarEventService` | ❌ | — |
| `calendarVisibilityService` | ❌ | — |
| `calendarDeleteService` / trash service | ❌ | Trash in controller + `trashController` |
| `calendarNotificationService` | ❌ | Reminders via `reminderService` + inline email |
| `calendarActivityService` | ❌ | No `emitModuleActivityEvent` in calendar paths |
| `calendarRealtimeService` | ❌ | Inline `getChatSocketService().broadcastToUser` in controller |
| `calendarPolicyDual` | ❌ | — |
| `calendarVlinkAccessService` | ❌ | Resolver inline in `vlinkEntityResolverService` |
| **`reminderService`** | ✅ (platform) | `dispatchDueReminders` — cron calls Prisma + `NotificationService` directly |

### Background jobs / scheduler

| Job | Registry | Handler | Module boundary |
|-----|----------|---------|-----------------|
| `reminder_dispatch` | `platformCronJobs.ts` | `dispatchDueReminders(5)` | **Transitional** — not calling a `calendar*Service` |

### Recurrence

- **In-controller:** `rrule` / `rrulestr` expansion in `listEventsInRange`, `checkConflicts`, create/update/delete with `editMode` (`THIS` / `SERIES`), canceled exception children for single-occurrence delete.
- **No** dedicated `calendarRecurrenceService`.

### Reminders

- Created inline on `createEvent` / `updateEvent` (nested Prisma `reminders.create`).
- Dispatched by `reminderService.dispatchDueReminders` → `NotificationService` type `calendar_reminder`.
- **Duplicate path risk:** reminder logic split between controller defaults and cron dispatcher.

### Notifications

| Type | Emitted | Manifest metadata |
|------|---------|-------------------|
| `calendar_reminder` | ✅ (`reminderService`) | ❌ not in `builtInModuleManifests` |
| Invite/update/cancel email | ✅ (controller email helpers) | N/A (email, not in-app catalog) |

### AI integrations

| Path | Implementation | Compliance |
|------|----------------|------------|
| Context: upcoming / today / availability | `calendarAIContextController` | 🔴 Direct Prisma; narrow personal-calendar filter |
| `ActionExecutor` calendar ops | Imports `calendarController` `createEvent`, `updateEvent`, `deleteEvent`, `rsvpEvent`, `checkConflicts` | 🔴 §16 violation (same as pre-Chat AI) |
| `registerBuiltInModules` AI metadata | Declared providers + actions | 🟡 Metadata exists; runtime bypasses services |

### Permissions / authZ (current)

- **Calendar member roles:** `OWNER`, `ADMIN`, `EDITOR`, member read for RSVP.
- **Context membership:** `enforceCalendarContextMembership` on calendar create (personal/business/household).
- **Household child:** TEEN/CHILD read-only guard on writes.
- **Policy Engine:** `POLICY_ACTIONS.CALENDAR_EVENT_CREATE` defined in `policyActions.ts` — **not wired** in `policyEngine.ts` (fail closed if invoked).

### V_Link

- **Enum:** `VLinkEntityType.CALENDAR_EVENT`
- **Resolver:** `vlinkEntityResolverService` — inline Prisma (calendar membership + `trashedAt: null`)
- **Lifecycle:** No unlink on permanent delete (events soft-trash only today)
- **Manifest:** `vlink: true` — resolver exists but **no** `calendarVlinkAccessService` / platform entity registration

### Entity registration

- **Platform registry:** ❌ no `registerCalendarPlatformEntities`
- **Manifest `entities[]`:** ❌ missing (capabilities declare `vlink`, `trash`, `notifications`)

### Manifest (`builtInModuleManifests.ts` case `calendar`)

```text
capabilities: read, write, ai, vlink, trash, notifications, search, businessWorkspace
routes: /calendar
notifications[]: MISSING
entities[]: MISSING
```

### Realtime

- **Transport:** `chatSocketService.broadcastToUser` — event name `calendar_event`
- **Payloads:** create / update / delete from controller after persist
- **No** membership adapter layer separate from calendar domain services

### Tests (existing)

- `server/src/events/__tests__/chatCalendarDomainEvents.test.ts` — domain event emitter only
- `server/src/routes/__tests__/place-meeting-calendar-link.integration.test.ts` — Place ↔ calendar link
- No calendar service suite; no PE/trash/visibility contract tests

---

## 2. Constitutional compliance review

| Area | Status | Evidence / notes |
|------|--------|------------------|
| **Canonical Service Boundaries** (§16) | 🔴 | All mutations in `calendarController`; `reminderService` + AI context + trash inline |
| **Thin Controllers** (§16) | 🔴 | 1,713-line controller; comments/utils/AI also hold Prisma |
| **Policy Engine** (§4) | 🔴 | `calendarMember` role checks only; `CALENDAR_EVENT_CREATE` not implemented in engine |
| **Global Trash** (§7) | 🟡 | `trashedAt` on events; restore/delete in `trashController` — **no** `registerGlobalTrashHandlers` for `calendar` |
| **Visibility Services** | 🔴 | No `calendarVisibilityService`; list/read/search scattered |
| **Domain Events** (§8) | 🟡 | `calendar.event.created` only; emitted from **controller** on create |
| **Module Activity** (§3) | 🔴 | No `emitModuleActivityEvent` on calendar writes |
| **Notifications** (§3) | 🟡 | `calendar_reminder` via cron; no adapter; manifest incomplete |
| **Realtime** (§3) | 🟡 | Works via chat socket; not adapter-owned; `realtime: true` partially accurate |
| **AI Compliance** (§6) | 🔴 | Executor → controller; AI context Prisma-direct |
| **Scheduler Compliance** (§22) | 🟡 | Job registered in `platformJobRegistry` but handler bypasses calendar services |
| **Platform Entities** (§21) | 🔴 | Not registered |
| **V_Link** (§5) | 🟡 | Resolver for `CALENDAR_EVENT`; no lifecycle service; membership ≠ content access not centralized |
| **Manifest Truthfulness** (§19) | 🔴 | `trash`, `notifications`, `vlink`, `search` overstated vs handler/metadata/registry |
| **Tests** | 🟡 | Minimal coverage |
| **Documentation** | 🟢 | This audit + operation matrix (Phase 0) |

**Overall constitutional compliance:** **Low** — **Level 0 — Legacy** (aligned with ledger pre-Wave 1)

---

## 3. File Hub comparison

| File Hub pattern | Calendar status | Gap |
|------------------|-----------------|-----|
| `driveDeleteService` | 🔴 | Trash/restore/permanent delete split across controller + `trashController` |
| `driveVisibilityService` | 🔴 | No shared list/read/search/AI visibility |
| `driveNotificationService` | 🔴 | Reminders + emails not adapter-owned |
| `drivePolicyDual` | 🔴 | No `calendarPolicyDual` |
| `registerGlobalTrashHandlers` | 🔴 | Drive + Chat only |
| `platformEntityRegistry` | 🔴 | No calendar descriptor |
| `driveVlinkAccessService` + lifecycle | 🔴 | Inline resolver only |
| Domain event taxonomy | 🔴 | One event type vs full lifecycle |
| `emitModuleActivityEvent` writes | 🔴 | Missing |
| Thin controller | 🔴 | 1,713 lines |

---

## 4. Chat comparison

| Chat pattern (post–Wave 1) | Calendar status | Gap |
|----------------------------|-----------------|-----|
| `chat*Service` layer | 🔴 | None |
| `chatNotificationService` | 🔴 | Reminders in `reminderService` |
| `chatRealtimeService` | 🔴 | Inline socket in controller |
| `chatVisibilityService` + PE reads | 🔴 | AI context uses raw Prisma |
| `chatAIActionService` | 🔴 | Executor → `calendarController` |
| `chatTrashService` + handler | 🔴 | Trash in platform `trashController` |
| `chatPolicyDual` | 🔴 | Not started |
| `chatDomainEventService` | 🔴 | Single controller emission on create |
| Manifest `notifications[]` | 🔴 | Missing |
| Side-effect order in services | 🔴 | Controller interleaves persist, event, audit, socket, email |

---

## 5. Architectural drift

1. **Fat controller** — recurrence, conflicts, ICS import/export, email, realtime, and domain event in one file.
2. **Direct Prisma** — AI context, trash platform controller, public RSVP route, event comments.
3. **Scheduler bypass** — `dispatchDueReminders` scans all reminders globally without calendar service scoping or PE.
4. **Duplicate reminder paths** — default reminder creation in controller vs dispatcher timing logic.
5. **Duplicate notification paths** — in-app `calendar_reminder` + SMTP invite/update/cancel from controller.
6. **Duplicate recurrence paths** — expansion in list, conflicts, delete/update exception children (no shared module).
7. **AI controller coupling** — `ActionExecutor.executeCalendarAction` fabricates `req`/`res` to call controller exports.
8. **Permission inconsistencies** — `calendarMember` vs household role vs context membership; no Policy Engine unify.
9. **Trash API fragmentation** — `deleteEvent` sets `trashedAt`; Global Trash lists/restores via `trashController` inline Prisma (not module handler).
10. **V_Link capability overclaim** — manifest `vlink: true` without entity registration or lifecycle on delete.

---

## 6. Reference Module #3 potential

| Area | Status | Notes |
|------|--------|-------|
| **Scheduling Architecture** | 🟡 | Rich features exist but not service-bounded |
| **Recurrence** | 🟡 | RRULE in-controller; needs `calendarRecurrenceService` |
| **Notifications** | 🟡 | Reminder cron works; needs adapter + manifest |
| **Scheduler** | 🟡 | Registered job; needs service delegation |
| **AI Compliance** | 🔴 | Controller coupling |
| **Realtime** | 🟡 | Socket works; needs adapter |
| **V_Link** | 🟡 | Resolver exists; needs access + lifecycle services |
| **Entities** | 🔴 | Not registered |
| **Certification Potential** | 🟡 | **Candidate for Reference Module #3** after Wave 1 modernization (scheduling + recurrence + reminders are teachable patterns) |

**Initial certification level:** **0 — Legacy**  
**Target after Wave 1:** **Level 3** (same bar as Chat; Level 4 not in scope for Wave 1)

---

## 7. Modernization complexity estimate

| Factor | Rating | Rationale |
|--------|--------|-----------|
| Controller mass | **High** | 1,713 lines + AI + comments |
| Recurrence / exceptions | **High** | RRULE expansion, THIS/SERIES edit modes |
| Reminder + cron | **Medium** | Existing `reminderService`; extract to calendar-owned dispatch |
| Trash + Global Trash | **Medium** | `trashedAt` present; need handler like Chat Phase 2 |
| V_Link + entities | **Medium** | Resolver exists; mirror `chatVlinkAccessService` |
| AI migration | **Medium** | Same pattern as Chat 1F |
| ICS import/export | **Medium** | Keep in service but isolate |
| Email flows | **Low–Medium** | Can remain adapter-invoked from services |

**Overall Wave 1 effort:** **High** — comparable to Chat, **plus** scheduler/recurrence/reminder decomposition.

**Suggested Wave 1 duration (planning):** 4–6 weeks implementation after approved extraction plan (vs Chat ~3–4 weeks), excluding external calendar provider sync.

---

## 8. Biggest risks

1. **Shared calendar permission leaks** — member role checks easy to miss on new routes.
2. **Recurrence edit/delete bugs** — exception children and SERIES vs THIS semantics during extraction.
3. **Reminder double-send or missed dispatch** — split logic between create and cron.
4. **Trash inconsistency** — controller soft-trash vs Global Trash restore/permanent paths diverging.
5. **AI bypass during migration** — parallel controller + service paths if executor not switched atomically.
6. **V_Link dangling links** — no lifecycle on permanent delete.

---

## 9. Is Calendar the correct next module?

**Yes.** Ledger and roadmap designate Calendar as **Wave 2 priority #1** immediately after Chat. Rationale:

- Chat Reference Module #2 patterns apply directly (notifications, realtime, trash, AI, visibility).
- File Hub patterns apply to trash lifecycle and V_Link.
- Place integration already links meetings to calendar events (integration test exists).
- Deferring Calendar blocks Todo/Notes PE/trash templates that depend on scheduling adjacency.

**Do not start Calendar service extraction until Phase 0 audit is approved** (this document + operation matrix).

---

## 10. Phase 0 deliverables checklist

| Deliverable | Status |
|-------------|--------|
| Constitutional audit (this doc) | ✅ |
| Operation matrix | ✅ [CALENDAR_OPERATION_MATRIX.md](./CALENDAR_OPERATION_MATRIX.md) |
| Service extraction plan | ✅ [CALENDAR_SERVICE_EXTRACTION_PLAN.md](./CALENDAR_SERVICE_EXTRACTION_PLAN.md) |
| Phase 1B core services | ✅ (2026-06-01) — calendar CRUD + event writes + recurrence helpers + RSVP |
| Phase 1C visibility + PE | ✅ (2026-06-01) — `calendarVisibilityService`, `calendarPolicyDual`, read paths |
| Phase 1D side-effect adapters | ✅ (2026-06-01) — activity/notification/realtime/domain + reminder/scheduler |
| Phase 1E controller collapse | ✅ (2026-06-01) — `calendarIcsService`; zero Prisma in controller |
| Phase 1F AI compliance | ✅ (2026-06-01) — `calendarAIActionService`; AI context via visibility |
| Wave 1 complete | ✅ Phases 1A–1F |
| Phase 2A Global Trash | ✅ (2026-06-01) — [`CALENDAR_GLOBAL_TRASH_PHASE2A.md`](./CALENDAR_GLOBAL_TRASH_PHASE2A.md) |
| Phase 2B V_Link + entities | ✅ (2026-06-01) — [`CALENDAR_VLINK_PHASE2B.md`](./CALENDAR_VLINK_PHASE2B.md) |
| Phase 4 Level 3 certification | ✅ (2026-06-01) — [`CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md`](./CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md) |

---

## 11. Post–Wave 1 / Wave 2 compliance snapshot (2026-06-01)

Historical sections 1–9 describe **pre–Wave 1** state. **Level 3 Certified** per [CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md](./CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md).

| Area | Status | Notes |
|------|--------|-------|
| **Global Trash** (§7) | 🟢 | `calendarTrashService` + handler |
| **Canonical services** | 🟢 | Full `calendar*` service layer; comments/utils residual |
| **Thin controller** | 🟢 | Zero Prisma in `calendarController` |
| **Policy Engine** | 🟢 | `calendarPolicyDual` on reads and mutations |
| **V_Link / entities** | 🟢 | `calendar:event`; access + lifecycle |
| **Manifest truthfulness** | 🟢 | Capabilities aligned; SMTP-only emails not overclaimed |

**Reference Module #3 (Level 3)** — scheduling, recurrence, reminders, scheduler delegation.

**Non-blocking punch-list:** event comments extraction, optional workspace landing hub, matrix doc refresh.

---

*End of Calendar Constitutional Audit — Phase 0 + living updates through Phase 4 certification.*
