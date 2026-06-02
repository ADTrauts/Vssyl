# Todo Operation Matrix

**Module id:** `todo`  
**Status:** Wave 1–2 complete; **Level 3 Certified** (2026-06-02). C/P/N summary below is Phase 0 — see [TODO_LEVEL3_CERTIFICATION_REVIEW.md](./TODO_LEVEL3_CERTIFICATION_REVIEW.md) for certification-time assessment.  
**Extraction plan:** [TODO_SERVICE_EXTRACTION_PLAN.md](./TODO_SERVICE_EXTRACTION_PLAN.md)  
**Related:** [TODO_CONSTITUTIONAL_AUDIT.md](./TODO_CONSTITUTIONAL_AUDIT.md), [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant (target: service-owned, full side effects) |
| **P** | Partial — works but wrong layer or incomplete |
| **N** | Non-compliant or missing |
| **—** | Not applicable |

**Columns:** PE = Policy Engine; Sched = platform scheduler

---

## Permission model (current)

- **Access:** `createdById` OR `assignedToId` on most task paths; dashboard/business/household query params on list.
- **Policy Engine (1B):** `evaluateTodoPolicyDual` on core writes (`todo:task.create|update|complete|reopen|delete|assign`).
- **Policy Engine (1C):** `taskPassesReadPolicy` / `filterTasksByReadPolicy` on list/get/search; `todo:project.read` when filtering by `projectId`.
- **Target (1D+):** Full activity/domain on all mutations; AI/chat/dashboard reads via visibility.

---

## Master operation matrix

| Operation | Controller | Service | PE | Activity | Event | Notification | Scheduler | Realtime | AI | Trash | V_Link | Notes |
| --------- | ---------- | ------- | -- | -------- | ----- | ------------ | --------- | -------- | -- | ----- | ------ | ----- |
| **List tasks** | `getTasks` | `todoVisibilityService` | P | N | N | N | — | — | — | — | — | 1C: creator **or** assignee; PE post-filter; `q`/`filter` query |
| **Create task** | `createTask` | `todoTaskService`, adapters, `todoRecurrenceService` | P | P | P | P | — | P | — | — | — | 1D: activity + domain + realtime; assign notification |
| **Get task by id** | `getTaskById` | `todoVisibilityService` | P | N | N | N | — | — | — | — | — | 1C: legacy access + PE; 404 on deny (no leak) |
| **Update task** | `updateTask` | `todoTaskService`, adapters, `todoRecurrenceService` | P | P | P | P | — | P | — | — | — | 1D: adapters on update/assign |
| **Delete task (soft trash)** | `deleteTask` | `todoTrashService`, adapters | P | P | P | N | — | P | — | P | — | Phase 2: `todoTrashService`; domain `todo.task.trashed` |
| **Complete task** | `completeTask` | `todoTaskService`, adapters | P | P | P | N | — | P | — | — | — | 1D: activity + domain + realtime |
| **Reopen task** | `reopenTask` | `todoTaskService`, adapters | P | P | P | N | — | P | — | — | — | 1D: activity + domain + realtime |
| **Assign / unassign** | `updateTask` | `todoTaskService`, adapters | P | P | P | P | — | P | — | — | — | 1D: assign activity/domain/notification/realtime |
| **Create event from task** | `createEventFromTask` | — | N | N | N | N | — | — | — | — | — | Calendar bridge |
| **Link / unlink event** | `linkTaskToEvent`, `unlinkTaskFromEvent` | `todoIntegrationLinkService` | N | N | N | N | — | — | C | — | — | Calendar membership checked |
| **Link / unlink file** | `linkTaskToFile`, `unlinkTaskFromFile` | `todoIntegrationLinkService` | N | N | N | N | — | — | C | — | — | Drive `validateAccessibleFileIds` |
| **List linked files/events** | `getTaskLinkedFiles`, `getTaskLinkedEvents` | — | N | N | N | N | — | — | — | — | — | |
| **Create comment** | `createTaskComment` | `todoCommentService` | N | N | N | N | — | — | C | — | — | Phase 1G |
| **Update / delete comment** | `updateTaskComment`, `deleteTaskComment` | `todoCommentService` | N | N | N | N | — | — | C | — | — | Phase 1G |
| **Create subtask** | `createSubtask` | `todoSubtaskService` | N | N | N | N | — | — | C | — | — | Phase 1G |
| **Update / delete subtask** | `updateSubtask`, `deleteSubtask` | — | N | N | N | N | — | — | — | — | — | |
| **Complete subtask** | `completeSubtask` | — | N | N | N | N | — | — | — | — | — | |
| **Upload attachment** | `uploadTaskAttachment` | `todoAttachmentService` + `storageService` | N | N | N | N | — | — | C | — | — | Phase 1G |
| **Serve / delete attachment** | `serveTaskAttachment`, `deleteTaskAttachment` | — | N | N | N | N | — | — | — | — | — | |
| **Add / remove dependency** | `addTaskDependency`, `removeTaskDependency` | `todoDependencyService` | N | N | N | N | — | — | C | — | — | Phase 1G |
| **List dependencies** | `getTaskDependencies` | — | N | N | N | N | — | — | — | — | — | |
| **List / create / update / delete project** | `getProjects`, `createProject`, … | `todoProjectService` | N | N | N | N | — | — | C | — | — | Phase 1G |
| **Generate recurrence instances** | `generateRecurringInstances` | `todoRecurrenceService` | N | N | N | N | — | — | — | — | — | |
| **Recurrence description** | `getRecurrenceDescription` | `todoRecurrenceService` | N | N | N | N | — | — | — | — | — | |
| **Start / stop timer** | `startTimer`, `stopTimer` | `todoTimeLogService` | N | N | N | N | — | — | C | — | — | Phase 1G |
| **Get active timer** | `getActiveTimer` | — | N | N | N | N | — | — | — | — | — | |
| **Log / list / update / delete time log** | `logTime`, `getTimeLogs`, … | — | N | N | N | N | — | — | — | — | — | `TaskTimeLog` |
| **AI priority suggestions** | `getPrioritySuggestions` | `todoAIPrioritizationService` | N | N | N | N | — | — | P | — | — | Controller HTTP wrapper |
| **AI prioritize analyze/execute** | `analyzeTaskPriorities`, `executePriorityChanges` | `todoAIPrioritizationService` + `todoAIActionService` (execute) | N | N | N | N | — | — | C | — | — | Execute via task service |
| **AI schedule suggestions/analyze/execute** | `getSchedulingSuggestions`, … | `todoSmartSchedulingService` | N | N | N | N | — | — | P | — | — | |
| **AI context overview/upcoming/overdue/priority** | `todoAIContextController` | `todoVisibilityService` AI helpers | N | N | N | N | — | — | C | — | — | Policy-filtered reads |
| **Chat create task from message** | `createTaskFromMessage` | `todoChatIntegrationService` | N | N | N | N | — | — | P | — | — | |
| **Chat parse / list conversation tasks** | `parseMessageForTask`, `getTasksForConversation` | `todoChatIntegrationService` | N | N | N | N | — | — | — | — | — | |
| **Trash (Global Trash API)** | `trashController` | `todoTrashService` | P | P | P | N | — | P | — | P | — | Phase 2 handler delegate |
| **Restore task (Global Trash)** | `trashController` | `todoTrashService` | P | P | P | N | — | P | — | P | — | Phase 2; `todo.task.restored` |
| **Permanent delete (Global Trash)** | `trashController` | `todoTrashService` | P | P | P | N | — | P | — | P | — | Phase 2; V_Link unlink + `todo.task.permanentlyDeleted` |
| **Permanent delete task** | `trashController` | — | N | N | N | N | — | — | — | N | — | Hard delete from trash |
| **V_Link resolve task** | — | `vlinkEntityResolverService` | N | N | N | N | — | — | — | — | N | Inline Prisma |
| **ActionExecutor todo ops** | — | `todoAIActionService` | N | N | N | N | — | — | C | — | — | Phase 1F |
| **toolExecutor create_todo** | — | `todoAIActionService` → `todoTaskService` | N | N | N | N | — | — | C | — | — | Phase 1F |
| **Dashboard widget list** | `TodoWidget` (web) | — | — | — | — | — | — | — | — | — | — | Client `/api/todo` |

---

## Operation count summary

| Class | Rows | C | P | N |
|-------|------|---|---|---|
| Task CRUD + lifecycle | 7 | 0 | 2 | 5 |
| Links (calendar/drive) | 6 | 0 | 0 | 6 |
| Comments / subtasks | 7 | 0 | 0 | 7 |
| Attachments | 3 | 0 | 0 | 3 |
| Dependencies | 3 | 0 | 0 | 3 |
| Projects | 4 | 0 | 0 | 4 |
| Recurrence | 2 | 0 | 1 | 1 |
| Time tracking | 7 | 0 | 0 | 7 |
| AI (HTTP + executor) | 12 | 0 | 0 | 12 |
| Trash / V_Link / platform | 6 | 0 | 1 | 5 |
| **Total inventoried** | **~50** | **0** | **4** | **~46** |

---

## Certification impact of N/P rows (Phase 0)

| Area | Blocker for future L3? | Rationale |
|------|------------------------|-----------|
| Core task CRUD + trash | **Yes** (P0 for wave) | Must reach **C** via services + handler |
| Global Trash inline | **Yes** | Manifest claims `trash: true` |
| AI executor paths | **No** (1F) | Executor/tool/context migrated to services |
| Comments / subtasks / time logs | **No** (P1) | Can remain **P** at L3 if core task path is **C** (Chat comments parallel) |
| Projects / dependencies | **No** (P1) | Extract after core task service |
| Realtime | **No** unless declared | Do not add `realtime: true` until implemented |
| Task due reminders | **No** if product uses calendar bridge only | Document; add `todoReminderService` if product wants in-app due alerts |

---

## Target state (post–Todo Wave 1)

Mirror Chat + Calendar + File Hub bar:

- **Service** = `todo*Service` layer per domain
- **PE** = `todoPolicyDual` on mutations + visibility reads
- **Activity** = `todoActivityService` on writes
- **Event** = registered `todo.*` from services
- **Trash** = `todoTrashService` + `registerGlobalTrashModuleHandler('todo')`
- **V_Link** = `todoVlinkAccessService` + lifecycle on permanent delete
- **Entity** = `todo:task` only (conservative)

---

*End of Todo Operation Matrix — Phase 0.*
