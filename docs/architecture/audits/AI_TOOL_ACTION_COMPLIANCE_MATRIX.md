# AI Tool and Action Compliance Matrix

**Phase:** AI Platform Wave 0 (2026-06-04)  
**Authority:** Platform Standards §6 (AI governance), File Hub / Chat reference patterns  
**Parent:** [AI_PLATFORM_CONSTITUTIONAL_AUDIT.md](./AI_PLATFORM_CONSTITUTIONAL_AUDIT.md)

> Module-level AI modernization for Chat, Calendar, Todo, Notebook, and Place is **complete** — this matrix records platform executors only and flags remaining gaps.

---

## Legend

| Column | Meaning |
|--------|---------|
| **PE** | Policy Engine enforced on write |
| **Activity** | `emitModuleActivityEvent` or module activity adapter on successful write |
| **Canonical** | Uses `*AIActionService` or visibility/upload service — not controller mock |
| **Prisma** | Direct Prisma in executor path |
| **Mock** | `mockReq` / `mockRes` controller invocation |
| **Tests** | Dedicated executor or tool test file |

**Disposition:** **Keep** | **Consolidate** | **Deprecate** | **Delete later** | **Review**

---

## Part A — ToolExecutor (`server/src/ai/tools/toolExecutor.ts`)

| Tool | Module | Op | R/W | Canonical service | PE | Activity | Prisma | Mock | Tests | Disposition |
|------|--------|-----|-----|-------------------|----|----------|--------|------|-------|-------------|
| `list_drive_files` | drive | list | R | `listAccessibleDriveFiles` (visibility) | read filter | N/A | No | No | `toolExecutor.listDriveFiles.test.ts` | **Keep** |
| `share_file` | drive | share | W | `grantFileShareByEmail` | via service | via service | No | No | `toolExecutor.shareFile.test.ts` | **Keep** — Wave 1B |
| `summarize_notebook_page` | notebook | summarize | R | `notebookAIActionService.summarizePage` | via service | N/A | No | No | `toolExecutor.notebook.test.ts` | **Keep** |
| `extract_notebook_action_items` | notebook | extract | R | `notebookAIActionService.extractActionItems` | via service | N/A | No | No | `toolExecutor.notebook.test.ts` | **Keep** |
| `search_places` | place | search | R | `placeAIActionService.searchPlaces` | via service | N/A | No | No | `toolExecutor.place.test.ts` | **Keep** |
| `get_place_recommendations` | place | recommend | R | `placeAIActionService.recommendPlaces` | via service | N/A | No | No | `toolExecutor.place.test.ts` | **Keep** |
| `get_place_purchase_help` | place | purchase_help | R | `placeAIActionService.purchaseHelp` | via service | N/A | No | No | `toolExecutor.place.test.ts` | **Keep** |
| `create_todo` | todo | create_task | W | `todoAIActionService.aiCreateTask` | via service | via service | No | No | `toolExecutor.createTodo.test.ts` | **Keep** |

---

## Part B — ActionExecutor built-in modules (`server/src/ai/core/ActionExecutor.ts`)

### B.1 Modernized (canonical `*AIActionService`)

| Module | Operations (sample) | R/W | Service | PE | Activity | Prisma | Mock | Tests |
|--------|---------------------|-----|---------|----|----------|--------|------|-------|
| **chat** | `send_message`, `create_conversation`, `respond_to_message`, `schedule_message` | W | `chatAIActionService` | Yes | Yes | No | No | `chatActionExecutor.test.ts` |
| **calendar** | `create_event`, `update_event`, `delete_event`, `rsvp_event`, `check_conflicts` | W | `calendarAIActionService` | Yes | Yes | No | No | `calendarActionExecutor.test.ts` |
| **todo** / **tasks** | `create_task`, `complete_task`, `update_priority`, `bulk_update_priority` | W | `todoAIActionService` | Yes | Yes | No | No | `todoActionExecutor.test.ts` |
| **notebook** | `summarize_page`, `extract_action_items`, `meeting_recap`, `suggest_links`, `get_page_ai_context`, `confirm_action_items` | R/W* | `notebookAIActionService` | Yes | Partial | No | No | `notebookActionExecutor.test.ts` |
| **place** | `get_place_context`, `recommend_places`, `purchase_help`, `reservation_help`, `search_places` | R | `placeAIActionService` | Yes | N/A | No | No | `placeActionExecutor.test.ts` |

\* Notebook writes that create tasks go through confirm flows / todo service.

### B.2 Legacy — mock req/res + controllers

| Module | Operations | R/W | Canonical | PE | Activity | Mock | Tests | Disposition |
|--------|------------|-----|-----------|----|----------|------|-------|-------------|
| **drive** | `create_folder`, `move_file`, `share_file`, `delete_file`, `organize_files` | W | `driveAIActionService` | Yes | Yes | No | `driveActionExecutor.test.ts` | **Keep** — Wave 1B |
| **hr** | `create_time_off_request`, `approve_time_off`, `clock_in`, `clock_out` | W | `hrAIActionService` + `hrAttendanceService` | Yes | Partial | No | — | **Keep** — Wave 1B |
| **scheduling** | `generate_schedule`, `suggest_assignments` | W | `schedulingAIActionService` | Partial | Partial | No | — | **Keep** — Wave 1B |

### B.3 Stub / placeholder executors

| Module | Operations | Behavior | Disposition |
|--------|------------|----------|-------------|
| **household** | assign_task, schedule_event, notify_members, manage_budget | Returns structured stub success | **Review** — disable or implement |
| **business** | schedule_meeting, delegate_task, generate_report, update_project | Stub | **Review** — route to business AI services |
| **dashboard** | create_widget, update_layout, add_module | Stub | **Review** |
| **notifications** | send_notification, schedule_reminder | Partial implementation | **Review** |

### B.4 Third-party — ActionExecutorRegistry

| Module | Mechanism | Class |
|--------|-----------|-------|
| Marketplace modules | `register()` at sync; webhook or in-process | **canonical** pattern for partners |
| Built-ins | **Not** in registry — hardcoded in `executeByModule` | **duplicate** pattern vs registry |

**Disposition:** Document built-in registry exemption in Wave 1A; optional future unify.

---

## Part C — AutonomousActionExecutor

| Path | R/W | Prisma | Approval | Tests | Disposition |
|------|-----|--------|----------|-------|-------------|
| `AutonomousActionExecutor.ts` | W | N/A on live path | Retired | `autonomousRetired.test.ts` | **Retired** — writes 410; history read-only (1B) |

---

## Part D — Module-specific AI action services (inventory)

| Service | Used by | Certified module evidence |
|---------|---------|---------------------------|
| `chatAIActionService.ts` | ActionExecutor | CHAT_LEVEL3, operation matrix |
| `calendarAIActionService.ts` | ActionExecutor | CALENDAR_LEVEL3 |
| `todoAIActionService.ts` | ActionExecutor, toolExecutor | TODO_LEVEL3 |
| `notebookAIActionService.ts` | ActionExecutor, toolExecutor | NOTEBOOK_LEVEL3 |
| `placeAIActionService.ts` | ActionExecutor, toolExecutor | PLACE_LEVEL3 (read-only) |
| `driveAIActionService.ts` | ActionExecutor | Wave 1B |
| `hrAIActionService.ts` | ActionExecutor | Wave 1B |
| `schedulingAIActionService.ts` | ActionExecutor | Wave 1B |

---

## Part E — Compliance summary

| Area | Compliant ops | Total ops | % |
|------|---------------|-----------|---|
| Tools | 8 | 8 | **100%** |
| ActionExecutor (modernized modules) | ~37 | ~37 | **~100%** |
| ActionExecutor (legacy mock modules) | 0 | 0 | **100%** |
| ActionExecutor (stubs) | 0 | ~10 | explicit not_implemented |

**Wave 1B:** ✅ 100% tool compliance; zero mock req/res in ActionExecutor; drive/HR/scheduling on services.

---

## Part F — Tests present (platform)

```
server/src/ai/core/__tests__/chatActionExecutor.test.ts
server/src/ai/core/__tests__/calendarActionExecutor.test.ts
server/src/ai/core/__tests__/todoActionExecutor.test.ts
server/src/ai/core/__tests__/notebookActionExecutor.test.ts
server/src/ai/core/__tests__/placeActionExecutor.test.ts
server/src/ai/core/__tests__/webhookExecutor.integration.test.ts
server/src/ai/tools/__tests__/toolExecutor.*.test.ts (5 files)
server/src/ai/actions/__tests__/autonomousTodoAction.test.ts
```

**Missing:** drive, hr, scheduling action executor tests; share_file prisma isolation test after refactor.
