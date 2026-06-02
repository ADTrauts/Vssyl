# Todo Service Extraction Plan (Phase 1A)

**Module id:** `todo`  
**Version:** 1.0.0  
**Last updated:** 2026-06-01  
**Status:** Phase 1G + **Phase 2 complete** (2026-06-02). See [TODO_PHASE2_TRASH_ENTITY_VLINK.md](./TODO_PHASE2_TRASH_ENTITY_VLINK.md).  
**Wave:** Todo Wave 1

**Authorities:**

| Layer | Document |
|-------|----------|
| Constitutional | [TODO_CONSTITUTIONAL_AUDIT.md](./TODO_CONSTITUTIONAL_AUDIT.md) |
| Operations | [TODO_OPERATION_MATRIX.md](./TODO_OPERATION_MATRIX.md) |
| Reference catalog | [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) |
| Execution | [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) |

---

## Section 1 — Executive summary

**Todo** is the **fourth major modernization** target after File Hub (L4), Chat (L3 RM#2), and Calendar (L3 RM#3).

Complexity is **high**: a **4,401-line** controller with projects, dependencies, time tracking, recurrence, calendar/drive links, attachments, and AI surfaces. **Do not combine phases** like a small module — follow **Chat/Calendar density** (1B → 1C → 1D → 1E → 1F → 2 → 4).

**Copy order:** File Hub (trash, visibility, V_Link, entities) → Calendar (recurrence, reminders, scheduler) → Chat (AI, activity, domain, notifications).

---

## Section 2 — Target service map

### 2.1 `todoPermissionService`

| Field | Detail |
|-------|--------|
| **Reference** | File Hub `drivePermissionService`; Calendar `calendarPermissionService` |
| **Responsibilities** | Assert user can read/write task; assignment rules; dashboard/business/household scope |
| **Dependencies** | `prisma`, tenant context helpers |
| **Owns** | `assertCanReadTask`, `assertCanWriteTask`, `resolveTaskAccessScope` |
| **Not owns** | Policy decisions (delegates to `todoPolicyDual`) |

### 2.2 `todoPolicyDual`

| Field | Detail |
|-------|--------|
| **Reference** | Calendar `calendarPolicyDual` |
| **Responsibilities** | Wrap `authorize()` for `todo:task.*` actions (1B: mutations; 1C: read) |
| **Dependencies** | `policyEngine`, `policyActions` |
| **Owns** | Dual enforcement helpers for mutations and visibility |
| **Not owns** | Business logic |

### 2.3 `todoVisibilityService`

| Field | Detail |
|-------|--------|
| **Reference** | File Hub + Chat visibility |
| **Responsibilities** | List tasks, get by id (read model), search/filter; `trashedAt: null`; PE read filter |
| **Dependencies** | `todoPermissionService`, `todoPolicyDual`, `prisma` |
| **Owns** | `listAccessibleTasks`, `getTaskIfAccessible`, filters (status, priority, dueDate, project) |
| **Not owns** | Mutations |

### 2.4 `todoTaskService`

| Field | Detail |
|-------|--------|
| **Reference** | Calendar `calendarEventService` |
| **Responsibilities** | Create, update, complete, reopen task; assignment changes; calendar bridge hooks |
| **Dependencies** | `todoPermissionService`, `todoPolicyDual`, adapters, `todoRecurrenceService` |
| **Owns** | Core task lifecycle mutations |
| **Not owns** | Trash (→ `todoTrashService`), comments, attachments, time logs |

### 2.5 `todoTrashService`

| Field | Detail |
|-------|--------|
| **Reference** | File Hub `driveDeleteService`; Calendar `calendarTrashService` |
| **Responsibilities** | Soft trash, restore, permanent delete, list trashed for Global Trash |
| **Dependencies** | `todoPermissionService`, activity/domain adapters, `todoVlinkLifecycleService` |
| **Owns** | All trash lifecycle |
| **Not owns** | API route parsing |

### 2.6 `todoRecurrenceService` (extend existing)

| Field | Detail |
|-------|--------|
| **Reference** | Calendar `calendarRecurrenceService` |
| **Responsibilities** | RRULE validate/expand; instance generation; move validation out of controller |
| **Dependencies** | `prisma` |
| **Owns** | Recurrence math and instance rows |
| **Not owns** | Parent task CRUD (called from `todoTaskService`) |

### 2.7 `todoReminderService` + `todoSchedulerService`

| Field | Detail |
|-------|--------|
| **Reference** | Calendar reminder/scheduler pair |
| **Responsibilities** | Due-date reminder dispatch (if product requires in-app); cron entry `todo_reminder_dispatch` OR document calendar-bridge-only |
| **Dependencies** | `todoNotificationService`, `prisma` |
| **Owns** | Due reminder selection and fan-out |
| **Not owns** | Cron registration (platform job calls scheduler) |
| **Phase note** | **1D decision:** If due alerts remain calendar-event-only, scheduler may be no-op + doc; do not fake reminders |

### 2.8 Side-effect adapters

| Service | Reference | Owns |
|---------|-----------|------|
| `todoActivityService` | Chat `chatActivityService` | `emitModuleActivityEvent` + audit for task/project/comment actions |
| `todoDomainEventService` | Chat `chatDomainEventService` | `todo.task.created`, `updated`, `completed`, `trashed`, `restored`, `permanentlyDeleted`, etc. |
| `todoNotificationService` | Chat `chatNotificationService` | In-app types when product defines them (e.g. `todo_assigned`, `todo_due`) |
| `todoRealtimeService` | Chat `chatRealtimeService` | Only if `realtime: true` added to manifest |

### 2.9 `todoVlinkAccessService` + `todoVlinkLifecycleService`

| Field | Detail |
|-------|--------|
| **Reference** | Calendar Phase 2B |
| **Responsibilities** | `TASK`/`TODO` resolve; member/assignee access; trashed fail-closed; unlink on permanent delete |
| **Dependencies** | `todoVisibilityService`, `todoPolicyDual` |
| **Owns** | V_Link access + lifecycle |
| **Not owns** | Resolver switch (thin delegate in `vlinkEntityResolverService`) |

### 2.10 `todoAIActionService`

| Field | Detail |
|-------|--------|
| **Reference** | Calendar `calendarAIActionService` |
| **Responsibilities** | `ActionExecutor` todo block; no controller imports |
| **Dependencies** | `todoTaskService`, `todoVisibilityService` |
| **Owns** | AI write/read operations for tasks |
| **Not owns** | OpenAI prioritization math (delegate to existing `todoAIPrioritizationService`) |

### 2.11 Optional domain services (Phase 1E+ or 1G)

| Service | When | Reference |
|---------|------|-----------|
| `todoCommentService` | If comments stay in-module | Chat message patterns (simpler) |
| `todoAttachmentService` | If attachments stay | File Hub `storageService` |
| `todoProjectService` | Project CRUD extraction | Calendar calendarService (container) |
| `todoDependencyService` | Dependency graph | — |
| `todoTimeLogService` | Timer/time entries | — |
| `todoLinkService` | Calendar/drive link tables | Cross-module link pattern |
| `todoChatIntegrationService` | Keep; wire from thin controller | Existing file |

**Only add `todoAttachmentService` if** task file attachments remain a certified surface.

---

## Section 3 — Extraction phases (recommended)

Todo is **more complex than Calendar** in controller mass and feature breadth — **do not combine 1B/1C or 1E/1F**.

### Phase 1A — Audit (complete)

| Deliverable | Status |
|-------------|--------|
| Constitutional audit | ✅ |
| Operation matrix | ✅ |
| Service extraction plan | ✅ |
| Reference catalog | ✅ |

### Phase 1B — Core write services (complete 2026-06-02)

| Deliverable | Status |
|-------------|--------|
| `server/src/services/todo/todoErrors.ts`, `todoTypes.ts`, `todoIncludes.ts` | ✅ |
| `todoPermissionService` | ✅ |
| `todoPolicyDual` (`server/src/services/todoPolicyDual.ts`) | ✅ |
| `todoTaskService` — create, update, complete, reopen, soft trash | ✅ |
| Controller delegates core writes; recurrence/calendar remain in controller | ✅ |
| Unit tests (`todoPermissionService`, `todoPolicyDual`, `todoTaskService`) | ✅ |
| `todoRecurrenceService` integration from task service | Deferred — controller still orchestrates instances (1B scope) |

### Phase 1C — Visibility + read Policy Dual (complete 2026-06-02)

| Deliverable | Status |
|-------------|--------|
| `todoVisibilityService` — list, get, search, preset filters | ✅ |
| `todoPolicyDual` on reads (`todo:task.read`, `todo:project.read`) | ✅ |
| `taskListInclude` / `taskDetailInclude` in `todo/todoIncludes.ts` | ✅ |
| Controller delegates `getTasks`, `getTaskById` | ✅ |
| Query presets: `filter=assigned\|overdue\|dueSoon\|completed`, `q`/`search` | ✅ |
| Unit tests (`todoVisibilityService.test.ts`) | ✅ |
| Deferred: AI context reads, chat conversation tasks, dashboard widgets | Documented below |

**1C deferrals (intentional):**

| Consumer | Path | Phase |
|----------|------|-------|
| AI context | `todoAIContextController` (inline Prisma, creator-only) | 1F |
| Chat-linked tasks | `getTasksForConversation` | 1G / chat integration |
| Dashboard widgets | No dedicated API yet | Wire to `todoVisibilityService` when widgets land |
| Global Trash list | No core route; `listTrashedTasks` helper only | Phase 2 |

### Phase 1D — Side-effect adapters + reminders (complete 2026-06-02)

| Deliverable | Status |
|-------------|--------|
| `todoActivityService` | ✅ |
| `todoDomainEventService` + registry `todo.task.*` emitters | ✅ |
| `todoNotificationService` — `todo_assigned` via `createNotification` | ✅ |
| `todoRealtimeService` — `todo_task` channel via chat socket infra | ✅ |
| `todoReminderService` + `todoSchedulerService` — no-op foundation (calendar-bridge-only) | ✅ |
| `todoTaskService` coordinates adapters post-persist | ✅ |
| Unit tests (activity, domain, notification, realtime, task coordination) | ✅ |

**Reminder decision:** No platform cron or in-app due dispatch in v1. Due surfacing remains **calendar bridge** (`ensureTaskCalendarEvent` in controller). `dispatchDueReminders()` returns `{ dispatched: 0 }` until Phase 2+ defines `todo_due` + cron.

### Phase 1E — Controller collapse (core paths) (complete 2026-06-02)

| Deliverable | Status |
|-------------|--------|
| Thin core handlers (`/* <todo-core-handlers> */` region) | ✅ |
| `todoController.contract.test.ts` — forbidden patterns in core region only | ✅ |
| `todoCalendarBridgeService`, `todoRecurrenceOrchestrationService`, `todoPresentationService` | ✅ |
| `TodoServiceError` mapping via `respondTodoServiceError` | ✅ |
| Full controller Prisma removal | Deferred — satellites still inline |
| Delete route → `todoTrashService` | Deferred — Phase 2 Global Trash |

### Phase 1F — AI migration ✅ (2026-05-31)

| Deliverable | Status |
|-------------|--------|
| `todoAIActionService` — create/update/complete/reopen/trash/assign/prioritize/schedule execute | ✅ |
| `ActionExecutor` / `AutonomousActionExecutor` → services (no `todoController`, no mock req/res) | ✅ |
| `toolExecutor.create_todo` → `todoAIActionService` → `todoTaskService` | ✅ |
| `todoAIContextController` → `todoVisibilityService` AI helpers | ✅ |
| AI contract + guardrail tests | ✅ |

### Phase 1G — Satellite extraction ✅ (2026-06-02)

| Deliverable | Status |
|-------------|--------|
| `todoCommentService` | ✅ |
| `todoSubtaskService` | ✅ |
| `todoAttachmentService` | ✅ |
| `todoProjectService` | ✅ |
| `todoDependencyService` | ✅ |
| `todoTimeLogService` | ✅ |
| `todoIntegrationLinkService` (calendar/drive links + filtered reads) | ✅ |
| Recurrence HTTP → `todoRecurrenceOrchestrationService` helpers | ✅ |
| Satellite controller delegates + contract tests | ✅ |
| Chat routes | Already on `todoChatIntegrationService` (unchanged) |
| AI prioritize/schedule HTTP | Deferred — still partial services + thin controller |

### Phase 2 — Global Trash + Platform Entity + V_Link ✅ (2026-06-02)

| Deliverable | Status |
|-------------|--------|
| `todoTrashService` + handler `moduleId: 'todo'`, `supportedTypes: ['task']` | ✅ |
| Remove inline task cases from `trashController` | ✅ |
| `registerTodoPlatformEntities` — `todo:task`, `vlinkEntityType: TODO` | ✅ |
| `todoVlinkAccessService` + `todoVlinkLifecycleService` | ✅ |
| Manifest `entities[]`, `vlink`, `search`, `realtime`, `globalActivity` | ✅ |
| Domain events `todo.task.restored` / `todo.task.permanentlyDeleted` | ✅ |

### Phase 3 — Manifest truth + hygiene

| Deliverable | |
|-------------|--|
| Align `builtInModuleManifests` with `registerBuiltInModules` AI context | |
| `notifications[]` only for emitted types | |
| Do not declare `realtime` until implemented | |

### Phase 4 — Level 3 certification review

| Deliverable | |
|-------------|--|
| `TODO_LEVEL3_CERTIFICATION_REVIEW.md` | |
| Ledger promotion | |
| Reference Module #4 decision | |

---

## Section 4 — Operation → service routing (target)

| Operation | Target owner |
|-----------|----------------|
| create/update/complete/reopen task | `todoTaskService` |
| list/get task | `todoVisibilityService` |
| delete/restore/permanent (API + Global Trash) | `todoTrashService` |
| recurrence instances | `todoRecurrenceService` |
| AI executor/context | `todoAIActionService` + visibility |
| comments/subtasks/projects/time | Phase 1G services or P at L3 |
| V_Link | `todoVlinkAccessService` |

---

## Section 5 — Certification forecast

| Question | Answer |
|----------|--------|
| Starting level | **0 — Legacy** (Level 1 traits: `trashedAt`, partial PE, helper services) |
| Path to Level 3 | **5–7 weeks** implementation (estimate); **6 phases** before certification |
| Good next module? | **Yes** — roadmap P0 after Calendar |
| Reference Module #4? | **Candidate** after L3 — teaches **task lifecycle**, **assignment**, **due-date workflow**, **work management** |
| Unique pattern | Operational task graph (deps, projects, time) + assignment — neither FH nor Chat nor Calendar alone |

---

## Section 6 — Risks

1. **Scope creep** — extracting everything before core path delays trash/V_Link.  
2. **AI surface** — three AI integration styles (executor, tool, HTTP) must migrate together in 1F.  
3. **Calendar bridge** — `ensureTaskCalendarEvent` must stay correct when task service owns writes.  
4. **Global Trash** — manifest already claims `trash: true`.  
5. **Enum duality** — `TASK` vs `TODO` in Prisma enum; pick one for entity registration.

---

## Section 7 — Phase 0 completion checklist

| Item | Status |
|------|--------|
| No Todo code changes in Phase 0 | ✅ |
| Docs linked from ledger/README | ✅ (pending index commit) |
| Implementation gate | User approval of plan → start **Phase 1B** |

---

*End of Todo Service Extraction Plan — Phase 1A (design only).*
