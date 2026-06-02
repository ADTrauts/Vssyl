# Todo Constitutional Audit

**Module id:** `todo`  
**Phase:** **Level 3 Certified** — Reference Module #4 (2026-06-02)  
**Date:** 2026-06-01 (audit); 2026-06-02 (1B–1G, Phase 2, Phase 3 cert)  
**Certification:** [TODO_LEVEL3_CERTIFICATION_REVIEW.md](./TODO_LEVEL3_CERTIFICATION_REVIEW.md)  
**Benchmarks:** [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) — File Hub #1, Chat #2, Calendar #3  
**Related:** [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

## 1. Inventory

### Controllers and routes

| Artifact | Path | Lines (approx.) | Notes |
|----------|------|-----------------|-------|
| **Primary controller** | `server/src/controllers/todoController.ts` | **~1,600** (post-1G) | Core + satellite handlers thin; Prisma only for AI/chat service constructors |
| **AI context controller** | `server/src/controllers/todoAIContextController.ts` | **~200** | Thin adapter; delegates to `todoVisibilityService` AI helpers (no Prisma) |
| **Routes** | `server/src/routes/todo.ts` | 97 | CRUD, comments, subtasks, attachments, projects, recurrence, time tracking, AI prioritize/schedule, chat integration |

### Services (module-specific)

| Service | Exists? | Role |
|---------|---------|------|
| `todoTaskService` | ✅ (1B) | Core writes: create, update, complete, reopen, soft trash |
| `todoVisibilityService` | ✅ (1C) | List/get/search; dashboard scope; PE read filter |
| `todoTrashService` | ✅ (Phase 2) | Global Trash + API soft trash; restore/permanent delete; `emptyTodoTrash` |
| `todoPermissionService` | ✅ (1B) | Legacy creator/assignee access; dashboard context on create |
| `todoPolicyDual` | ✅ (1B) | `todo:task.*` dual enforcement on core writes |
| `todoActivityService` | ✅ (1D) | Core task writes via `todoTaskService` |
| `todoDomainEventService` | ✅ (1D) | `todo.task.*` registered emitters |
| `todoNotificationService` | ✅ (1D) | `todo_assigned` only (runtime-backed) |
| `todoRealtimeService` | ✅ (1D) | `todo_task` socket channel |
| `todoReminderService` | ✅ (1D) | Foundation only; calendar-bridge for due dates |
| `todoSchedulerService` | ✅ (1D) | No platform cron registered |
| `todoCalendarBridgeService` | ✅ (1E) | Due-date calendar sync (deferred from controller) |
| `todoRecurrenceOrchestrationService` | ✅ (1E) | RRULE validation + instance generation hooks |
| `todoPresentationService` | ✅ (1E) | Attachment URL mapping for task detail |
| `todoAIActionService` | ✅ (1F) | AI writes: task CRUD lifecycle, priority/schedule execute |
| `todoCommentService` | ✅ (1G) | Task comments |
| `todoSubtaskService` | ✅ (1G) | Subtasks |
| `todoAttachmentService` | ✅ (1G) | Upload/serve/delete attachments |
| `todoProjectService` | ✅ (1G) | Projects CRUD |
| `todoDependencyService` | ✅ (1G) | Task dependencies |
| `todoTimeLogService` | ✅ (1G) | Timers and time logs |
| `todoIntegrationLinkService` | ✅ (1G) | Calendar/drive links; Drive visibility on file link/list |
| `todoVlinkAccessService` | ✅ (Phase 2) | Canonical TASK/TODO resolver; legacy + Policy Dual read |
| `todoVlinkLifecycleService` | ✅ (Phase 2) | Unlink on permanent delete only |
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
- **Global Trash:** `registerGlobalTrashHandlers('todo')` ✅; `trashController` delegates list/trash/restore/delete/empty ✅  
- **Manifest:** `trash: true` ✅ (handler-backed)

### V_Link / entities

- **Resolver:** `TASK` / `TODO` → `todoVlinkAccessService` ✅  
- **Lifecycle:** `todoVlinkLifecycleService` on permanent delete ✅; soft trash does not unlink ✅  
- **Platform entity:** `todo:task` registered (`vlinkEntityType: TODO`) ✅  
- **Manifest:** `entities[]` task only; `vlink: true` ✅

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

## 2. Constitutional compliance scorecard (certification-time — 2026-06-02)

| Area | Status | Evidence / notes |
|------|--------|------------------|
| **Canonical Service Boundaries** (§16) | 🟢 | `todo*Service` layer; core + trash + satellites + adapters |
| **Thin Controllers** (§16) | 🟡 | Zero handler `prisma.`; ~1,809-line file with thin delegates; contract tests |
| **Policy Engine** (§4) | 🟢 | `todoPolicyDual` on core writes, trash, V_Link; read filter on visibility |
| **Global Trash** (§7) | 🟢 | `todoTrashService` + handler; controller delegates |
| **Visibility Services** (§16) | 🟢 | `todoVisibilityService` list/get/search/AI |
| **Domain Events** (§8) | 🟢 | `todo.task.*` registered; `todoDomainEventService` |
| **Module Activity** (§3) | 🟢 | Core task + trash lifecycle via `todoActivityService` |
| **Notifications** (§3) | 🟢 | `todo_assigned` runtime-backed |
| **Realtime** (§3) | 🟢 | `todoRealtimeService`; manifest `realtime: true` |
| **Scheduler / reminder ownership** (§22) | 🟡 | Calendar bridge only; no `todo_reminder_dispatch` (accepted L3 partial) |
| **AI Compliance** (§6) | 🟢 | `todoAIActionService`; no controller coupling on executor paths |
| **Platform Entities** (§21) | 🟢 | `todo:task` registered |
| **V_Link** (§5) | 🟢 | `todoVlinkAccessService` + lifecycle |
| **Manifest Truthfulness** (§19) | 🟢 | Post–Phase 2 manifest aligned with runtime |
| **Tests** | 🟢 | 77 todo-focused unit tests + integration routes |
| **Documentation** | 🟢 | Audit, matrix, extraction plan, Phase 2, Level 3 review |

**Overall constitutional compliance:** **High** — **Level 3 — Certified**; **Reference Module #4**. See [TODO_LEVEL3_CERTIFICATION_REVIEW.md](./TODO_LEVEL3_CERTIFICATION_REVIEW.md).

---

## 3. Reference module comparison

| Pattern | File Hub | Chat | Calendar | Todo |
|---------|----------|------|----------|------|
| Trash service + handler | ✅ | ✅ | ✅ | ✅ |
| Visibility service | ✅ | ✅ | ✅ | ✅ |
| Policy dual (broad) | ✅ | ✅ | ✅ | ✅ (core + reads) |
| Domain events | ✅ | ✅ | ✅ | ✅ (core task) |
| Activity adapter | ✅ | ✅ | ✅ | ✅ (core task) |
| Notification adapter | ✅ | ✅ | ✅ | ✅ (`todo_assigned`) |
| Realtime adapter | ✅ | ✅ | ✅ | ✅ |
| AI → services | ✅ | ✅ | ✅ | ✅ |
| V_Link access + lifecycle | ✅ | ✅ | ✅ | ✅ |
| Platform entity | ✅ | ✅ | ✅ | ✅ (`task`) |
| Thin controller | ✅ | ✅ | ✅ | 🟡 (large file) |
| Scheduler/reminders | — | — | ✅ | 🟡 (calendar bridge) |

---

## 4. Architectural drift (top issues)

1. **Monolithic controller** — tasks, projects, comments, subtasks, attachments, dependencies, time tracking, recurrence, calendar/drive links, AI prioritize/schedule, chat integration in one file.
2. ~~**AI bypass**~~ — **Resolved (1F)** for executor, tool, and context reads; HTTP prioritize/schedule analyze still use partial services only.
3. **Trash fragmentation** — API soft delete vs Global Trash inline Prisma vs no handler registration.
4. **Activity sparsity** — Most mutations do not emit normalized activity.
5. **No domain event taxonomy** — Cross-module subscribers cannot observe task lifecycle.
6. **Manifest lies** — `trash: true` without handler; rich AI in startup registry but thin `builtInModuleManifests` fragment.
7. **V_Link overclaim risk** — Enum includes TASK/TODO but no module access service or lifecycle.
8. **Due-date strategy split** — Calendar event sync in controller; no first-class task reminder service.
9. **Recurrence split** — `todoRecurrenceService` exists but controller owns orchestration and validation.
10. **No dedicated permission service** — Assignment and household/business scoping repeated in queries.

---

## 5. Certification outcome (Phase 3 — 2026-06-02)

| Outcome | Value |
|---------|-------|
| **Certification level** | **3 — Certified** |
| **Reference designation** | **Reference Module #4 (Level 3)** |
| **Review artifact** | [TODO_LEVEL3_CERTIFICATION_REVIEW.md](./TODO_LEVEL3_CERTIFICATION_REVIEW.md) |

### Reference Module #4

**Designated** for **task lifecycle**, **assignment workflow**, **task–calendar** and **task–file** integration, and **operational work management** (satellite services). Not Level 4 until reference implementation review + council (File Hub bar).

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
