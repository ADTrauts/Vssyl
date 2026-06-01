# Todo Constitutional Audit

**Module id:** `todo`  
**Phase:** Wave 1 Phase 0 — Audit only (no implementation)  
**Date:** 2026-06-01  
**Benchmarks:** [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) — File Hub #1, Chat #2, Calendar #3  
**Related:** [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

## 1. Inventory

### Controllers and routes

| Artifact | Path | Lines (approx.) | Notes |
|----------|------|-----------------|-------|
| **Primary controller** | `server/src/controllers/todoController.ts` | **4,401** | **~100** `prisma.` calls; **48** exported handlers |
| **AI context controller** | `server/src/controllers/todoAIContextController.ts` | **558** | **~15** `prisma.` calls; direct DB reads |
| **Routes** | `server/src/routes/todo.ts` | 97 | CRUD, comments, subtasks, attachments, projects, recurrence, time tracking, AI prioritize/schedule, chat integration |

### Services (module-specific)

| Service | Exists? | Role |
|---------|---------|------|
| `todoTaskService` | ❌ | All task CRUD in controller |
| `todoVisibilityService` | ❌ | List/filter in controller |
| `todoTrashService` | ❌ | Soft delete in controller; Global Trash inline in `trashController` |
| `todoPermissionService` | ❌ | Inline `createdById` / `assignedToId` OR checks |
| `todoPolicyDual` | ❌ | Generic `evaluateModuleMutationPolicyDual` on **create/delete only** |
| `todoActivityService` | ❌ | Sparse `emitModuleActivityEvent` in controller (~3 paths) |
| `todoDomainEventService` | ❌ | No `todo.*` domain event types in registry |
| `todoNotificationService` | ❌ | No in-app notifications |
| `todoRealtimeService` | ❌ | No socket fan-out |
| `todoReminderService` | ❌ | Due dates; optional sync to calendar via `ensureTaskCalendarEvent` in controller |
| `todoSchedulerService` | ❌ | No due-date reminder cron |
| `todoVlinkAccessService` | ❌ | Inline Prisma in `vlinkEntityResolverService` |
| `todoRecurrenceService` | ✅ (partial) | RRULE + instance generation; controller still orchestrates |
| `todoAIPrioritizationService` | ✅ (partial) | AI priority; controller exposes HTTP |
| `todoSmartSchedulingService` | ✅ (partial) | AI scheduling; controller exposes HTTP |
| `todoChatIntegrationService` | ✅ (partial) | Message → task; controller exposes HTTP |

### Background jobs / scheduler

| Job | Registry | Handler | Module boundary |
|-----|----------|---------|-----------------|
| Task due reminders | ❌ | — | No `todo_reminder_dispatch` job |
| Calendar reminder cron | ✅ | `calendarSchedulerService` | May cover tasks only when calendar event created from task due date |

### Trash

- **Schema:** `Task.trashedAt` ✅  
- **API delete:** `deleteTask` soft-trashes in controller ✅  
- **Global Trash:** `trashController` inline Prisma list/restore/permanent — **no** `registerGlobalTrashHandlers('todo')` ❌  
- **Manifest:** `trash: true` ❌ (no handler)

### V_Link / entities

- **Resolver:** `VLinkEntityType.TASK` / `TODO` — inline Prisma in `vlinkEntityResolverService`  
- **Lifecycle:** No unlink on permanent delete  
- **Platform entity:** Not registered  
- **Manifest:** No `entities[]`; no `vlink: true`

### AI

- **`ActionExecutor`:** Imports `todoController` (`createTask`, `updateTask`, `completeTask`) — **violates §16**  
- **`toolExecutor`:** `create_todo` → direct `prisma.task.create` — **violates §16**  
- **AI context:** `todoAIContextController` — direct Prisma  
- **Built-in manifest:** Rich `aiContext` in `registerBuiltInModules.ts`; capabilities in `builtInModuleManifests` minimal

### Tests

| Area | Coverage |
|------|----------|
| Integration | 3 route tests (`todo-task-complete`, `todo-task-context`, `todo-chat-conversation-tasks`) |
| Service unit | ❌ No `todo*Service` contract suite |
| PE / trash / V_Link | ❌ |

---

## 2. Constitutional compliance scorecard

| Area | Status | Evidence / notes |
|------|--------|------------------|
| **Canonical Service Boundaries** (§16) | 🔴 | 4,401-line controller; partial helpers only |
| **Thin Controllers** (§16) | 🔴 | Massive Prisma surface; AI context controller also fat |
| **Policy Engine** (§4) | 🟡 | `TASK_CREATE` / `TASK_DELETE` via `moduleMutationPolicyDual` on 2 paths; update/assign/complete omit dual |
| **Global Trash** (§7) | 🟡 | `trashedAt` + soft delete API; no module handler |
| **Visibility Services** (§16) | 🔴 | `getTasks` / `getTaskById` inline Prisma |
| **Domain Events** (§8) | 🔴 | No registered `todo.*` types; no service emitters |
| **Module Activity** (§3) | 🔴 | ~3 `emitModuleActivityEvent` calls; most writes skip activity |
| **Notifications** (§3) | 🔴 | None; due dates may create calendar events only |
| **Realtime** (§3) | 🔴 | Not declared or implemented |
| **Scheduler / reminder ownership** (§22) | 🔴 | No task reminder job; calendar bridge only |
| **AI Compliance** (§6) | 🔴 | Executor + toolExecutor + context controller bypass services |
| **Platform Entities** (§21) | 🔴 | Not registered |
| **V_Link** (§5) | 🔴 | Inline resolver; manifest does not declare `vlink` |
| **Manifest Truthfulness** (§19) | 🔴 | `trash: true` without handler; understates AI surface in registry vs builtIn manifest |
| **Tests** | 🟡 | 3 integration tests only |
| **Documentation** | 🟢 | This audit + operation matrix + extraction plan (Phase 0) |

**Overall constitutional compliance:** **Low** — **Level 0 — Legacy** (with isolated Level 1 traits: `trashedAt`, partial PE, recurrence helper)

---

## 3. Reference module comparison

| Pattern | File Hub | Chat | Calendar | Todo |
|---------|----------|------|----------|------|
| Trash service + handler | ✅ | ✅ | ✅ | 🔴 |
| Visibility service | ✅ | ✅ | ✅ | 🔴 |
| Policy dual (broad) | ✅ | ✅ | ✅ | 🟡 (2 ops) |
| Domain events | ✅ | ✅ | ✅ | 🔴 |
| Activity adapter | ✅ | ✅ | ✅ | 🔴 |
| Notification adapter | ✅ | ✅ | ✅ | 🔴 |
| Realtime adapter | ✅ | ✅ | ✅ | 🔴 |
| AI → services | ✅ | ✅ | ✅ | 🔴 |
| V_Link access + lifecycle | ✅ | ✅ | ✅ | 🔴 |
| Platform entity | ✅ | ✅ | ✅ | 🔴 |
| Thin controller | ✅ | ✅ | ✅ | 🔴 |
| Scheduler/reminders | — | — | ✅ | 🔴 (task reminders N/A) |

---

## 4. Architectural drift (top issues)

1. **Monolithic controller** — tasks, projects, comments, subtasks, attachments, dependencies, time tracking, recurrence, calendar/drive links, AI prioritize/schedule, chat integration in one file.
2. **AI bypass** — `ActionExecutor` and `toolExecutor` call controller or Prisma directly.
3. **Trash fragmentation** — API soft delete vs Global Trash inline Prisma vs no handler registration.
4. **Activity sparsity** — Most mutations do not emit normalized activity.
5. **No domain event taxonomy** — Cross-module subscribers cannot observe task lifecycle.
6. **Manifest lies** — `trash: true` without handler; rich AI in startup registry but thin `builtInModuleManifests` fragment.
7. **V_Link overclaim risk** — Enum includes TASK/TODO but no module access service or lifecycle.
8. **Due-date strategy split** — Calendar event sync in controller; no first-class task reminder service.
9. **Recurrence split** — `todoRecurrenceService` exists but controller owns orchestration and validation.
10. **No dedicated permission service** — Assignment and household/business scoping repeated in queries.

---

## 5. Certification forecast (Phase 0)

| Estimate | Value |
|----------|-------|
| **Starting level** | **0 — Legacy** (traits of **1 — Stabilizing**: `trashedAt`, partial PE, helper services) |
| **Likely path to Level 3** | **High effort** — comparable to Calendar (4,401-line controller > Calendar pre-wave 1,713 lines but broader feature surface) |
| **Wave count estimate** | 1A audit → 1B–1F service waves → 2 trash/V_Link/entity → 4 certification (mirror Chat/Calendar density) |
| **Timeline (planning)** | ~5–7 weeks implementation after approved extraction plan |

### Is Todo a good next module?

**Yes.** Ledger and roadmap designate Todo as **Wave 2 priority #1** after Calendar Level 3. Calendar and Chat patterns apply directly; File Hub patterns apply to trash and V_Link.

### Reference Module #4 candidacy

**Candidate (post–Level 3)** for **task lifecycle**, **assignment workflow**, **due-date/reminder workflow**, and **operational work management** (projects, dependencies, time logs). Not ready until service extraction and certification complete.

**Not Level 4** — File Hub remains sole L4 authority.

---

## 6. Phase 0 deliverables checklist

| Deliverable | Status |
|-------------|--------|
| Constitutional audit (this doc) | ✅ |
| Operation matrix | ✅ [TODO_OPERATION_MATRIX.md](./TODO_OPERATION_MATRIX.md) |
| Service extraction plan | ✅ [TODO_SERVICE_EXTRACTION_PLAN.md](./TODO_SERVICE_EXTRACTION_PLAN.md) |
| Reference catalog link | ✅ [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) |
| Implementation | ❌ Not started |

---

*End of Todo Constitutional Audit — Phase 0.*
