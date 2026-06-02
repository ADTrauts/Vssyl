# Todo Level 3 Certification Review

**Module id:** `todo`  
**Date:** 2026-06-02  
**Phase:** Wave 3 Phase 3 — Certification closeout  
**Benchmarks:** File Hub (`drive`) — [FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md](./FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md); Chat (`chat`) — [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./CHAT_LEVEL3_CERTIFICATION_REVIEW.md); Calendar (`calendar`) — [CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md](./CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md)  
**Authorities:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

## Executive summary

Todo Wave 1 (1A–1G) and Wave 2 (Global Trash, platform entity, V_Link, manifest truth) satisfy **Level 3 — Certified** against the constitutional checklist and File Hub / Chat / Calendar pattern catalog. Residual gaps are **documented partials** (large controller file with thin delegates, satellite sub-resources without full PE/activity/domain, no in-app due-reminder cron, AI prioritize/schedule HTTP wrappers, optional workspace landing hub) that do not block certification and mirror acceptable Chat/Calendar partials.

**Reference Module #4:** Todo is designated **Reference Module #4 (Level 3)** for **task lifecycle**, **assignment workflows**, **operational work management**, **task–calendar bridge**, and **task–file integration** — patterns not fully demonstrated by File Hub, Chat, or Calendar alone. It is **not** Level 4 Reference Implementation; File Hub remains the sole Level 4 authority.

**Certification decision:** **Level 3 Certified** (2026-06-02)

---

## Level 3 gate review

| Gate | Status | Evidence |
|------|--------|----------|
| **Canonical Services** | 🟢 | `todoTaskService`, `todoVisibilityService`, `todoTrashService`, `todoPermissionService`, `todoPolicyDual`, `todoActivityService`, `todoDomainEventService`, `todoNotificationService`, `todoRealtimeService`, `todoAIActionService`, `todoVlinkAccessService`, `todoVlinkLifecycleService`, satellites (`todoCommentService`, `todoSubtaskService`, `todoAttachmentService`, `todoProjectService`, `todoDependencyService`, `todoTimeLogService`, `todoIntegrationLinkService`, `todoRecurrenceOrchestrationService`, `todoCalendarBridgeService`, `todoPresentationService`) |
| **Thin Controllers** | 🟡 | `todoController.ts` (~1,809 lines) — **zero** handler `prisma.`; core + satellite handlers delegate to services; contract tests `todoController.contract.test.ts`, `todoController.satellite.contract.test.ts`. File size large; pattern matches “thin handler” not “small file” (Chat satellite scale). |
| **Policy Engine** | 🟢 | `evaluateTodoPolicyDual` on core writes + trash + V_Link read; `taskPassesReadPolicy` / `filterTasksByReadPolicy` on list/get/search/AI reads |
| **Visibility Services** | 🟢 | `todoVisibilityService` — list/get/search/filters; legacy creator/assignee scope + post-query PE filter (Chat pattern) |
| **Global Trash** | 🟢 | `todoTrashService`; `registerGlobalTrashHandlers` `moduleId: 'todo'`, `supportedTypes: ['task']` — [TODO_PHASE2_TRASH_ENTITY_VLINK.md](./TODO_PHASE2_TRASH_ENTITY_VLINK.md) |
| **Domain Events** | 🟢 | Registered `todo.task.*` (created, updated, completed, reopened, assigned, unassigned, trashed, restored, permanentlyDeleted); `todoDomainEventService` emitters |
| **Module Activity** | 🟢 | `todoActivityService` on core task writes + trash lifecycle |
| **Notifications** | 🟢 | `todoNotificationService.notifyTaskAssigned`; manifest `todo_assigned` only |
| **Realtime** | 🟢 | `todoRealtimeService`; `todo_task` channel via chat socket infra |
| **AI Compliance** | 🟢 | `todoAIActionService`; `ActionExecutor` / `toolExecutor` / `AutonomousActionExecutor` → services; `todoAIContextController` → visibility AI helpers; tests forbid `todoController` import |
| **Platform Entities** | 🟢 | `registerTodoPlatformEntities` — `todo:task` → `TODO` |
| **V_Link** | 🟢 | `todoVlinkAccessService` + `todoVlinkLifecycleService`; resolver delegates `TASK`/`TODO` |
| **Manifest Truth** | 🟢 | Capabilities match runtime; single entity; one emitted notification type |
| **Tests** | 🟢 | 23 todo-focused test files, **77** tests (services, PE, trash, V_Link, manifest, AI executor, controller contract, trash controller) |
| **Documentation** | 🟢 | Constitutional audit, operation matrix, extraction plan, Phase 2 audit, this review |

No **🔴** blockers remain for Level 3.

---

## Constitutional / pattern violations (residual)

| Item | Severity | Status | Notes |
|------|----------|--------|-------|
| `todoController.ts` ~1,809 lines (satellite + AI HTTP) | Low | 🟡 Accepted | Handlers thin; no Prisma in route bodies; differs from Calendar ~475-line controller |
| Prisma in controller for AI/chat service constructors only | Low | 🟡 Accepted | `TodoAIPrioritizationService`, `TodoSmartSchedulingService`, `TodoChatIntegrationService` |
| Satellite ops without PE / activity / domain (comments, projects, time logs, etc.) | Low | 🟡 Accepted | Sub-resources; not platform entities; parallel Chat `eventCommentController` partial |
| No `todo_reminder_dispatch` cron / `todo_due` notification | Low | 🟡 Accepted | Due surfacing via `todoCalendarBridgeService`; documented in extraction plan |
| AI prioritize/schedule HTTP endpoints wrap partial services in controller | Low | 🟡 Accepted | Execute paths use `todoAIActionService` / `todoTaskService`; analyze HTTP is read-heavy |
| No dedicated `TodoWorkspaceLanding.tsx` | Low | 🟡 Accepted | `BusinessWorkspaceContent` case `todo`; same class as Chat/File Hub hub partial |
| `[TODO_OPERATION_MATRIX.md](./TODO_OPERATION_MATRIX.md)` C/P/N columns stale | Low | 🟡 Accepted | Certification-time assessment below supersedes Phase 0 matrix counts |
| Platform-wide activity **read** migration | Low | 🟡 Accepted | Shared with File Hub P2 ACT-R1 |

---

## Operation matrix audit

The matrix file predates Wave 2 closeout and **understates** compliance on core task paths, trash, and V_Link. Below is the **certification-time** assessment.

### Compliant (core task path — service-owned, side effects where applicable)

| Operation | Service | Blocker? |
|-----------|---------|----------|
| List / get / search tasks | `todoVisibilityService` | No |
| Create / update / complete / reopen task | `todoTaskService` + adapters | No |
| Assign / unassign (via update) | `todoTaskService` + adapters | No |
| Soft trash (API + Global Trash) | `todoTrashService` | No |
| Restore / permanent delete (Global Trash) | `todoTrashService` | No |
| V_Link resolve task | `todoVlinkAccessService` | No |
| AI context reads | `todoVisibilityService` AI helpers | No |
| AI executor writes | `todoAIActionService` → task services | No |
| `toolExecutor` `create_todo` | `todoAIActionService` | No |

### Partially compliant (acceptable for Level 3)

| Operation | Why P | Blocker? | Verdict |
|-----------|-------|----------|---------|
| List / get task (PE column) | Post-query `filterTasksByReadPolicy` (Chat/Calendar pattern) | No | 🟡 Accept |
| Link file / event | `todoIntegrationLinkService`; Drive/calendar membership checks; no module activity | No | 🟡 Accept |
| Recurrence generate / description | `todoRecurrenceOrchestrationService` / `todoRecurrenceService`; limited domain events | No | 🟡 Accept |
| Chat create task from message | `todoChatIntegrationService`; partial activity/domain | No | 🟡 Accept |
| AI priority/schedule HTTP analyze | Controller wraps `TodoAIPrioritizationService` / `TodoSmartSchedulingService` | No | 🟡 Accept |

### Non-compliant (impact assessment)

| Operation | Why N in matrix | Blocker? | Verdict |
|-----------|-----------------|----------|---------|
| Comments / subtasks / attachments / projects / dependencies / time logs | Service-owned writes; no PE/activity/domain on satellites | **No** | Sub-features; isolate in future hygiene |
| `createEventFromTask` | Delegates to `todoIntegrationLinkService` | **No** | Calendar bridge |
| Serve attachment / list dependencies (some handlers) | Thin controller delegate gaps in matrix only | **No** | Verify per-route; not L3 blocker |
| **Permanent delete task** (matrix row) | **Stale** — same as Global Trash permanent delete via `todoTrashService` | **No** | Matrix errata |
| **V_Link resolve** (matrix row) | **Stale** — `todoVlinkAccessService` | **No** | Matrix errata |

**Matrix maintenance:** Refresh [TODO_OPERATION_MATRIX.md](./TODO_OPERATION_MATRIX.md) summary when convenient; certification does not require full regrade.

---

## Task lifecycle review

| Stage | Owner | Activity | Domain event | Notification | Realtime |
|-------|-------|----------|--------------|--------------|----------|
| **Create** | `todoTaskService` | ✅ `create` | ✅ `todo.task.created` | ✅ on assign | ✅ `created` |
| **Update** | `todoTaskService` | ✅ `update` | ✅ `todo.task.updated` | ✅ on assign change | ✅ `updated` |
| **Assign** | `todoTaskService` | ✅ `assign` / `unassign` | ✅ assigned / unassigned | ✅ `todo_assigned` | ✅ assigned / unassigned |
| **Complete** | `todoTaskService` | ✅ `complete` | ✅ `todo.task.completed` | — | ✅ `completed` |
| **Reopen** | `todoTaskService` | ✅ `reopen` | ✅ `todo.task.reopened` | — | ✅ `reopened` |
| **Trash (soft)** | `todoTrashService` | ✅ `delete` (soft) | ✅ `todo.task.trashed` | — | ✅ `trashed` |
| **Restore** | `todoTrashService` | ✅ `restore` | ✅ `todo.task.restored` | — | ✅ `updated` |
| **Permanent delete** | `todoTrashService` | ✅ `permanently_delete` | ✅ `todo.task.permanentlyDeleted` | — | ✅ `trashed` |

**Trash platform alignment:**

- `Task.trashedAt` soft delete ✅  
- Global Trash handler registered ✅  
- Restore / permanent delete service-owned ✅  
- V_Link unlink on permanent delete only (not soft trash) ✅  
- Policy dual on trash mutations ✅  

**Order of operations:** authorize (permission + policy) → execute → activity → domain → notify/realtime — satisfied on core path.

---

## AI compliance review

| Surface | Status | Evidence |
|---------|--------|----------|
| `todoAIActionService` | 🟢 | `aiCreateTask`, `aiUpdateTask`, `aiCompleteTask`, `aiBulkUpdatePriority`, etc. |
| `todoVisibilityService` AI helpers | 🟢 | Overview/upcoming/overdue/priority; policy-filtered |
| `ActionExecutor` `executeTasksAction` | 🟢 | Dynamic import `todoAIActionService`; no `todoController` |
| `toolExecutor` `create_todo` | 🟢 | `aiCreateTask` |
| `AutonomousActionExecutor` | 🟢 | `todoAIActionService` for priority updates |
| `todoAIContextController` | 🟢 | No Prisma; visibility helpers |
| Mock req/res on todo paths | 🟢 | `todoActionExecutor.test.ts` asserts absence on task executor |
| Direct Prisma on AI writes | 🟢 | None on canonical paths |

**Partial:** HTTP routes `analyzeTaskPriorities`, `getSchedulingSuggestions`, etc. remain in `todoController` as thin wrappers around legacy AI services (constructors use `prisma`). Does not violate “AI writes via services” bar.

---

## Manifest truth review

| Capability | Declared | Runtime truth | Verdict |
|------------|----------|---------------|---------|
| `read` | ✅ | Visibility + legacy access | 🟢 |
| `write` | ✅ | Task + satellite services | 🟢 |
| `ai` | ✅ | `todoAIActionService` + visibility AI helpers | 🟢 |
| `vlink` | ✅ | `TODO` / `TASK` via `todoVlinkAccessService` | 🟢 |
| `trash` | ✅ | Global Trash handler + `trashedAt` | 🟢 |
| `search` | ✅ | `searchAccessibleTasks` / list filters | 🟢 |
| `realtime` | ✅ | `todoRealtimeService` | 🟢 |
| `notifications` | ✅ | `todo_assigned` emitted | 🟢 |
| `globalActivity` | ✅ | `todoActivityService` on writes | 🟢 |
| `businessWorkspace` | ✅ | `BusinessWorkspaceContent` case `todo` | 🟢 |

**entities[]:** `task` only — aligned with `registerTodoPlatformEntities`.

**notifications[]:** `todo_assigned` only — no `todo_due`, `todo_completed`, `todo_updated` (not runtime-backed). **No overclaim removed** in this review; manifest already truthful post–Phase 2.

---

## V_Link review

| Rule | Status | Evidence |
|------|--------|----------|
| Creator can resolve | 🟢 | `userCanAccessTaskLegacy` / `createdById` |
| Assignee can resolve | 🟢 | `assignedToId` |
| Policy `TODO_TASK_READ` enforced | 🟢 | `passesTodoTaskReadPolicy` in `todoVlinkAccessService.ts` |
| Trashed tasks fail closed | 🟢 | `state: 'trashed'`, `allowed: false` |
| Deleted tasks fail closed | 🟢 | `state: 'deleted'` when row missing |
| V_Link membership alone insufficient | 🟢 | Resolver does not grant content from V_Link membership |
| Permanent delete unlinks links | 🟢 | `unlinkTodoTaskFromAllVLinks` before `deleteMany` |
| Soft trash does not unlink | 🟢 | Unlink only in `permanentlyDeleteTask` |
| Unlink errors logged; delete continues | 🟢 | try/catch per link in lifecycle service |

Tests: `todoVlinkAccessService.test.ts`, `todoVlinkLifecycleService.test.ts`.

---

## Reference Module #4 assessment

| Area | Status | Notes |
|------|--------|-------|
| Task lifecycle (CRUD + complete/reopen) | 🟢 | Service-owned with full adapters |
| Assignment workflows | 🟢 | Assign notification + domain + realtime |
| Operational work management | 🟢 | Projects, dependencies, time logs (service layer; not L3 entities) |
| Due-date / calendar integration | 🟢 | `todoCalendarBridgeService`, `todoIntegrationLinkService` |
| Task–file integration | 🟢 | Drive visibility on link/list |
| Global Trash | 🟢 | Handler + service |
| V_Link (task entity) | 🟢 | Access + lifecycle |
| AI compliance | 🟢 | Canonical service routing |
| Certification readiness | 🟢 | Level 3 |

**Decision:** **Reference Module #4 (Level 3)** — use Todo as the fourth module pattern source for **task lifecycle**, **assignment**, **work-item satellites**, and **cross-module links** (calendar, drive). **Not** Level 4 until a dedicated reference implementation review and architecture council approval (File Hub bar).

**Not chosen: Not Ready** — Wave 1–2 deliverables meet the same bar Chat and Calendar met at Level 3.

**Not chosen: Candidate only** — formal certification and reference designation are warranted.

---

## Certification decision

### Level 3 Certified

All Level 3 gates are **🟢** or **🟡 accepted partial** with no 🔴 blockers. Evidence:

- Waves 1A–1G + Phase 2 complete
- **77** passing todo-focused tests; `pnpm exec tsc --noEmit -p server` clean
- Global Trash handler, V_Link access/lifecycle, platform entity, manifest truth
- Core task lifecycle: services own mutations; activity/domain/notify/realtime on success only

### Not chosen: Not Certified

Would require 🔴 blockers such as Prisma in main mutation handlers, missing trash handler while `trash: true`, or AI executor calling controllers — none apply.

### Not chosen: Conditionally Certified only

Conditional tier reserved when 🔴 blockers exist with time-bound remediation. Todo residual items are **🟡 accepted partials** at Level 3 (documented punch-list), matching Calendar/Chat closeout.

---

## Remaining punch-list (post–Level 3, non-blocking)

1. Optional matrix refresh (C/P/N columns for core task + trash + V_Link rows).
2. `TodoWorkspaceLanding.tsx` hub (`module-development.mdc` checklist).
3. `todo_reminder_dispatch` job + `todo_due` notification if product requires in-app due alerts (today: calendar bridge).
4. PE + activity/domain on satellite sub-resources if product needs cross-module feeds for comments/projects.
5. Collapse AI prioritize/schedule HTTP into dedicated thin service facades (file size hygiene).
6. Level 4 promotion: `TODO_REFERENCE_IMPLEMENTATION_REVIEW.md` + council (out of scope).

---

## Recommended next module

**Notes** (Wave 2 per roadmap) — apply File Hub + Chat patterns for trash, V_Link, visibility, and thin controllers. Do not start Place until Notes wave is planned.

---

## Evidence links

- [TODO_CONSTITUTIONAL_AUDIT.md](./TODO_CONSTITUTIONAL_AUDIT.md)
- [TODO_OPERATION_MATRIX.md](./TODO_OPERATION_MATRIX.md)
- [TODO_SERVICE_EXTRACTION_PLAN.md](./TODO_SERVICE_EXTRACTION_PLAN.md)
- [TODO_PHASE2_TRASH_ENTITY_VLINK.md](./TODO_PHASE2_TRASH_ENTITY_VLINK.md)
- [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)
- [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md)

---

*End of Todo Level 3 Certification Review.*
