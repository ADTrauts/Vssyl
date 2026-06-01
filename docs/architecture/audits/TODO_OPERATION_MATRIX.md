# Todo Operation Matrix

**Module id:** `todo`  
**Status:** Wave 1 Phase 0 — Audit only (2026-06-01)  
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
- **Policy Engine:** `evaluateModuleMutationPolicyDual` on **create** and **delete** only (`TASK_CREATE`, `TASK_DELETE`).
- **Target:** Dedicated `todoPolicyDual` on all privileged mutations and visibility reads (Calendar/Chat pattern).

---

## Master operation matrix

| Operation | Controller | Service | PE | Activity | Event | Notification | Scheduler | Realtime | AI | Trash | V_Link | Notes |
| --------- | ---------- | ------- | -- | -------- | ----- | ------------ | --------- | -------- | -- | ----- | ------ | ----- |
| **List tasks** | `getTasks` | — | N | N | N | N | — | — | — | — | — | Inline Prisma; filters status/priority/dueDate |
| **Create task** | `createTask` | `todoRecurrenceService` (instances) | P | P | N | N | — | — | — | — | — | PE on create; activity on create; RRULE instances |
| **Get task by id** | `getTaskById` | — | N | N | N | N | — | — | — | — | — | Includes subtasks, comments, links |
| **Update task** | `updateTask` | `todoRecurrenceService` | N | N | N | N | — | — | — | — | — | Calendar sync `ensureTaskCalendarEvent` |
| **Delete task (soft trash)** | `deleteTask` | — | P | P | N | N | — | — | — | P | — | `trashedAt`; not Global Trash handler |
| **Complete task** | `completeTask` | — | N | N | N | N | — | — | — | — | — | Sets status DONE + `completedAt` |
| **Reopen task** | `reopenTask` | — | N | N | N | N | — | — | — | — | — | |
| **Assign / unassign** | `updateTask` | — | N | N | N | N | — | — | — | — | — | Via `assignedToId` field |
| **Create event from task** | `createEventFromTask` | — | N | N | N | N | — | — | — | — | — | Calendar bridge |
| **Link / unlink event** | `linkTaskToEvent`, `unlinkTaskFromEvent` | — | N | N | N | N | — | — | — | — | — | `TaskEventLink` |
| **Link / unlink file** | `linkTaskToFile`, `unlinkTaskFromFile` | — | N | N | N | N | — | — | — | — | — | `TaskFileLink` |
| **List linked files/events** | `getTaskLinkedFiles`, `getTaskLinkedEvents` | — | N | N | N | N | — | — | — | — | — | |
| **Create comment** | `createTaskComment` | — | N | N | N | N | — | — | — | — | — | |
| **Update / delete comment** | `updateTaskComment`, `deleteTaskComment` | — | N | N | N | N | — | — | — | — | — | |
| **Create subtask** | `createSubtask` | — | N | N | N | N | — | — | — | — | — | Parent/child tasks |
| **Update / delete subtask** | `updateSubtask`, `deleteSubtask` | — | N | N | N | N | — | — | — | — | — | |
| **Complete subtask** | `completeSubtask` | — | N | N | N | N | — | — | — | — | — | |
| **Upload attachment** | `uploadTaskAttachment` | `storageService` (via multer) | N | N | N | N | — | — | — | — | — | File Hub storage pattern partial |
| **Serve / delete attachment** | `serveTaskAttachment`, `deleteTaskAttachment` | — | N | N | N | N | — | — | — | — | — | |
| **Add / remove dependency** | `addTaskDependency`, `removeTaskDependency` | — | N | N | N | N | — | — | — | — | — | |
| **List dependencies** | `getTaskDependencies` | — | N | N | N | N | — | — | — | — | — | |
| **List / create / update / delete project** | `getProjects`, `createProject`, … | — | N | N | N | N | — | — | — | — | — | `TaskProject` |
| **Generate recurrence instances** | `generateRecurringInstances` | `todoRecurrenceService` | N | N | N | N | — | — | — | — | — | |
| **Recurrence description** | `getRecurrenceDescription` | `todoRecurrenceService` | N | N | N | N | — | — | — | — | — | |
| **Start / stop timer** | `startTimer`, `stopTimer` | — | N | N | N | N | — | — | — | — | — | Time tracking |
| **Get active timer** | `getActiveTimer` | — | N | N | N | N | — | — | — | — | — | |
| **Log / list / update / delete time log** | `logTime`, `getTimeLogs`, … | — | N | N | N | N | — | — | — | — | — | `TaskTimeLog` |
| **AI priority suggestions** | `getPrioritySuggestions` | `todoAIPrioritizationService` | N | N | N | N | — | — | P | — | — | Controller HTTP wrapper |
| **AI prioritize analyze/execute** | `analyzeTaskPriorities`, `executePriorityChanges` | `todoAIPrioritizationService` | N | N | N | N | — | — | P | — | — | |
| **AI schedule suggestions/analyze/execute** | `getSchedulingSuggestions`, … | `todoSmartSchedulingService` | N | N | N | N | — | — | P | — | — | |
| **AI context overview/upcoming/overdue/priority** | `todoAIContextController` | — | N | N | N | N | — | — | N | — | — | Direct Prisma |
| **Chat create task from message** | `createTaskFromMessage` | `todoChatIntegrationService` | N | N | N | N | — | — | P | — | — | |
| **Chat parse / list conversation tasks** | `parseMessageForTask`, `getTasksForConversation` | `todoChatIntegrationService` | N | N | N | N | — | — | — | — | — | |
| **Trash (Global Trash API)** | `trashController` | — | N | N | N | N | — | — | — | N | — | Inline Prisma |
| **Restore task (Global Trash)** | `trashController` | — | N | N | N | N | — | — | — | N | — | Inline Prisma |
| **Permanent delete task** | `trashController` | — | N | N | N | N | — | — | — | N | — | Hard delete from trash |
| **V_Link resolve task** | — | `vlinkEntityResolverService` | N | N | N | N | — | — | — | — | N | Inline Prisma |
| **ActionExecutor todo ops** | — | `todoController` | N | N | N | N | — | — | N | — | — | Fabricated req/res |
| **toolExecutor create_todo** | — | — (Prisma) | N | N | N | N | — | — | N | — | — | Direct `prisma.task.create` |
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
| AI executor paths | **Yes** | Constitutional §16 violation |
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
