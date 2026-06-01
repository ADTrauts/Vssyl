# Todo Service Extraction Plan (Phase 1A)

**Module id:** `todo`  
**Version:** 1.0.0  
**Last updated:** 2026-06-01  
**Status:** Phase 0 complete — **no implementation**  
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
| **Responsibilities** | Wrap `authorize()` for `TASK_CREATE`, `TASK_UPDATE`, `TASK_DELETE`, `TASK_READ` (add read action if missing) |
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

### Phase 1B — Core write services

| Deliverable | |
|-------------|--|
| `todoPermissionService` | |
| `todoPolicyDual` (mutations) | |
| `todoTaskService` — create, update, complete, reopen | |
| `todoRecurrenceService` integration from task service | |
| Unit tests | |

### Phase 1C — Visibility + read Policy Dual

| Deliverable | |
|-------------|--|
| `todoVisibilityService` — list, get, filters | |
| `todoPolicyDual` on reads | |
| Controller read paths delegate | |
| Visibility + PE tests | |

### Phase 1D — Side-effect adapters + reminders

| Deliverable | |
|-------------|--|
| `todoActivityService`, `todoDomainEventService` | |
| `todoNotificationService` (minimal: assigned/due if product agrees) | |
| `todoReminderService` + `todoSchedulerService` **or** documented calendar-bridge-only | |
| Wire task service emits | |
| Domain registry types for `todo.*` | |

### Phase 1E — Controller collapse (core paths)

| Deliverable | |
|-------------|--|
| Thin `todoController` for task CRUD + list/get | |
| `todoController.contract.test.ts` (no Prisma) | |
| Delete route → `todoTrashService` (prep for Phase 2) | |

### Phase 1F — AI migration

| Deliverable | |
|-------------|--|
| `todoAIActionService` | |
| `ActionExecutor` → services | |
| `toolExecutor.create_todo` → `todoTaskService` | |
| `todoAIContextController` → `todoVisibilityService` helpers | |
| AI contract tests | |

### Phase 1G — Satellite features (optional split)

Extract when core path certified-ready:

- Comments, subtasks, attachments  
- Projects, dependencies, time tracking  
- AI prioritize/schedule HTTP (already partial services)  
- Chat integration routes  

Can run **after 1F** or in parallel if staffed — not required for first Global Trash registration.

### Phase 2 — Global Trash + Platform Entity + V_Link

| Deliverable | |
|-------------|--|
| `todoTrashService` + handler `moduleId: 'todo'`, `supportedTypes: ['task']` | |
| Remove inline task cases from `trashController` | |
| `registerTodoPlatformEntities` — `todo:task` → `TASK` or `TODO` (pick one enum) | |
| `todoVlinkAccessService` + `todoVlinkLifecycleService` | |
| Manifest `entities[]`, `vlink: true` | |

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
