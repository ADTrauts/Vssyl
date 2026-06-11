# Todo Menu Rollout Closeout (Wave 3A-4D)

**Status:** Closed — **PASS WITH FINDINGS**  
**Date:** 2026-06-03  
**Prerequisite:** Chat Menu Rollout — [`CHAT_MENU_ROLLOUT_CLOSEOUT.md`](./CHAT_MENU_ROLLOUT_CLOSEOUT.md)  
**Reference patterns:** Drive + AI + Notifications + Chat certified primitives

---

## 1. Menu Surface Inventory

| # | Surface | Location | Classification | Disposition |
|---|---------|----------|----------------|-------------|
| 1 | **TaskItem overflow menu** | `web/src/components/todo/TaskItem.tsx` | `DropdownMenu` candidate | **Migrated** → `DropdownMenu` |
| 2 | **TaskDetail row actions** | `TaskDetail.tsx` | Inline icon buttons | **Not a menu** — edit/delete on comments, subtasks, attachments, dependencies |
| 3 | **ProjectManager row actions** | `ProjectManager.tsx` | Inline icon buttons | **Not a menu** — edit/delete per project row |
| 4 | **AttachmentViewer actions** | `AttachmentViewer.tsx` | Inline icon buttons | **Not a menu** — download/delete per attachment |
| 5 | **TimeHistory row actions** | `TimeHistory.tsx` | Inline icon buttons | **Not a menu** — edit/delete per time log |
| 6 | **TodoModule MoreVertical** | `TodoModule.tsx` | Stub | **Removed** — no menu rendered |
| 7 | **TaskDetail header actions** | `TaskDetail.tsx` | Direct buttons | **Not a menu** — complete, delete, close |
| 8 | **Filter button** | `TodoModule.tsx` | Toolbar button | **Not a menu** — unchanged |
| 9 | **View mode toggles** | `TodoModule.tsx` | Toggle buttons | **Not a menu** — unchanged |
| 10 | **QuickTaskInput suggestions** | `QuickTaskInput.tsx` | Autocomplete positioning | **Not a menu** — out of scope |

**ContextMenu candidates:** 0 (no right-click task menus in Todo)  
**Popover candidates:** 0 in scoped files

---

## 2. Menus Migrated

### TaskItem overflow → `DropdownMenu`

**Actions preserved (order):**
1. Reopen Task (if completed + `onReopen`)
2. Edit Task (if `onEdit`)
3. Delete Task (`destructive: true`, if `onDelete`)

**Removals:**
- Inline `absolute right-0 top-full` menu shell (~50 lines)
- `menuRef` + document `mousedown` outside-click handler
- `showMenu` state → `menuOpen` controlled via `DropdownMenu`

**Unchanged:**
- Parent `onDelete` / `ConfirmModal` flow (delete confirm lives in parent, not TaskItem)
- Menu hidden in compact/board view (`!isCompact` guard preserved)
- Menu hidden when no actions available (`menuItems.length > 0` guard)

### Hygiene

| File | Change |
|------|--------|
| `TodoModule.tsx` | Removed orphan `MoreVertical` header stub |

---

## 3. ContextMenu / DropdownMenu Adoption

| Primitive | Todo consumers (post-3A-4D) |
|-----------|------------------------------|
| **`ContextMenu`** | 0 |
| **`DropdownMenu`** | `TaskItem.tsx` |
| **`Popover`** | 0 in scoped Todo files |

---

## 4. Remaining Todo Menu Exceptions

| Exception | Location | Notes |
|-----------|----------|-------|
| **Inline edit/delete icons** | `TaskDetail.tsx`, `ProjectManager.tsx`, `AttachmentViewer.tsx`, `TimeHistory.tsx` | Row-level icon buttons — not overflow menus; converting would redesign UX |
| **ConfirmModal flows** | All scoped files with delete | Unchanged — certified in Wave 2B |
| **Scheduling builder menus** | Out of 3A-4D scope | Deferred to Scheduling wave |

---

## 5. Validation Summary

| Check | Result |
|-------|--------|
| `pnpm type-check` | **Passed** (2026-06-03) |
| Inline menu shells in scoped Todo files | **0** |
| `menuRef` / `showMenu` in scoped Todo files | **0** |
| ConfirmModal integrations | **Unchanged** |
| Todo APIs / task logic | **Unchanged** |

---

## 6. Manual QA

**Status:** **PENDING**

### Tasks
- [ ] TaskItem overflow menu (list view)
- [ ] Reopen, edit, delete actions
- [ ] Delete → parent ConfirmModal (if applicable)
- [ ] Escape / outside-click dismiss
- [ ] Dark mode
- [ ] Board/compact view — no overflow button shown

### Projects / Attachments / Time History
- [ ] Inline edit/delete still work (unchanged)
- [ ] ConfirmModal on delete still works

---

## 7. Certification

**Todo menu rollout (3A-4D):** **Ready for sign-off** pending manual QA.

**Platform menu certification (Wave 3A-5):** **Ready to begin** — all major domain rollouts complete (Drive reference, AI, Notifications, Chat, Todo). Deferred surfaces documented: Scheduling builders, `AvatarContextMenu`, `DriveSearch` orphan, specialty popovers.

---

**Last updated:** 2026-06-03 (3A-4D ACT closeout)
