# Todo Wave 2 Phase 2 — Global Trash, Platform Entity, V_Link, Manifest Truth

**Module id:** `todo`  
**Date:** 2026-06-02  
**Status:** Complete  
**Related:** [TODO_CONSTITUTIONAL_AUDIT](./TODO_CONSTITUTIONAL_AUDIT.md), [GLOBAL_TRASH.md](../GLOBAL_TRASH.md), [V_LINK.md](../V_LINK.md), [PLATFORM_ENTITY_MODEL.md](../PLATFORM_ENTITY_MODEL.md), [RELATIONSHIP_FRAMEWORK_INDEX.md](../RELATIONSHIP_FRAMEWORK_INDEX.md)

---

## Delivered

| Area | Implementation |
|------|----------------|
| **Global Trash** | `todoTrashService` — soft trash, restore, permanent delete, list trashed, empty module trash |
| **Handler** | `registerGlobalTrashHandlers` — `moduleId: todo`, `supportedTypes: ['task']` |
| **Controller** | `trashController` delegates task paths; no inline task Prisma |
| **Domain events** | `todo.task.restored`, `todo.task.permanentlyDeleted` (+ existing `todo.task.trashed`) |
| **Activity** | `restore`, `permanently_delete` module activity actions |
| **Platform entity** | Registry key `todo:task`, `vlinkEntityType: TODO` |
| **V_Link access** | `todoVlinkAccessService` — creator/assignee + Policy Dual; trashed/missing fail closed |
| **V_Link lifecycle** | `todoVlinkLifecycleService` — unlink `TASK`/`TODO` rows on permanent delete only |
| **Resolver** | `vlinkEntityResolverService` delegates `TASK`/`TODO` to Todo module |
| **Manifest** | Truthful capabilities: `vlink`, `trash`, `search`, `realtime`, `globalActivity`; `entities[]` task only; `notifications[]` `todo_assigned` only |

## Deferred (intentional)

- Platform entities: comments, subtasks, projects, dependencies, time logs, attachments
- Notifications: `todo_due`, `todo_completed`, `todo_updated` (not runtime-backed)
- Reminder cron / scheduler registration
- Level 3 certification review — **complete**; see [TODO_LEVEL3_CERTIFICATION_REVIEW.md](./TODO_LEVEL3_CERTIFICATION_REVIEW.md)

## Tests

- `todoTrashService.test.ts`, `todoVlinkAccessService.test.ts`, `todoVlinkLifecycleService.test.ts`
- `platformEntityRegistry.todo.test.ts`, `registerGlobalTrashHandlers.todo.test.ts`
- `builtInModuleManifests.todo.test.ts`, `trashController.todo.test.ts`
- 71 Todo-related unit tests passing; `pnpm exec tsc --noEmit -p server` clean

## Certification impact

Phase 2 closes Global Trash, V_Link, and platform-entity gaps for **tasks only**. Level 3 review may proceed when Wave 1 residual items (AI prioritize/schedule HTTP thinness, reminder cron) are triaged — certification review **not started** in this phase.
