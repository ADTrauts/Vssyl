# Notifications Menu Rollout Closeout (Wave 3A-4B)

**Status:** Closed — **PASS WITH FINDINGS**  
**Date:** 2026-06-03  
**Prerequisite:** AI Menu Rollout — [`AI_MENU_ROLLOUT_CLOSEOUT.md`](./AI_MENU_ROLLOUT_CLOSEOUT.md)  
**Reference patterns:** Drive + AI `DropdownMenu` adoption

---

## 1. Menu Surface Inventory

| # | Surface | Location | Classification | Disposition |
|---|---------|----------|----------------|-------------|
| 1 | **NotificationActionsMenu** | `page.tsx` ~L1461 | Action menu | **Migrated** → `DropdownMenu` |
| 2 | Bulk selection toolbar | `page.tsx` ~L842–901 | Direct `Button` actions | **Not a menu** — unchanged |
| 3 | **NotificationQuickActions** | `page.tsx` ~L1639+ | Inline action buttons | **Not a menu** — unchanged |
| 4 | Category sidebar | `page.tsx` ~L936+ | Navigation buttons | **Not a menu** — unchanged |
| 5 | View mode toggles | `page.tsx` ~L820+ | Toggle buttons | **Not a menu** — unchanged |
| 6 | Toolbar (Select, Mark all read, Settings) | `page.tsx` ~L904+ | Toolbar buttons | **Not a menu** — unchanged |
| 7 | Per-row quick actions (Mark read, Go to…) | `page.tsx` ~L1357+ | Inline buttons | **Not a menu** — unchanged |

**ContextMenu candidates:** 0  
**Popover candidates:** 0

---

## 2. Migration Summary

### NotificationActionsMenu → `DropdownMenu`

**Actions preserved (order):**
1. Mark as read (if unread)
2. Unsnooze (if snoozed) **OR** Snooze group (1 hour, 1 day, 1 week)
3. Archive
4. Delete (`destructive: true` → `ConfirmModal`)

**Removals:**
- Inline `absolute` menu shell (~100 lines)
- `menuRef` + document `mousedown` outside-click handler
- `showSnoozeOptions` expand/collapse state

**Unchanged:**
- `ConfirmModal` delete gate per notification row
- Parent handlers (`handleArchive`, `handleDelete`, `handleMarkAsRead`, snooze/unsnooze callbacks)
- Bulk toolbar snooze (direct button, not menu)

---

## 3. Snooze Menu Disposition

| Before | After |
|--------|-------|
| Collapsible "Snooze" parent + inline nested panel (1h/1d/1w) | Flat `DropdownMenu` group: `heading: 'Snooze'` + three duration items |

**Limitation:** No collapsible snooze submenu; all duration options visible when not snoozed. `DropdownMenu` scaffold does not render `submenu` items (deferred to future wave). Behavior unchanged — same three durations + unsnooze path.

---

## 4. Validation Summary

| Check | Result |
|-------|--------|
| `pnpm type-check` | **Passed** (2026-06-03) |
| Inline action menu shells in `notifications/page.tsx` | **0** |
| `ConfirmModal` delete flow | **Unchanged** |
| Notification API / handlers | **Unchanged** |

---

## 5. Manual QA

**Status:** **PENDING**

- [ ] Row overflow menu opens
- [ ] Mark as read, archive, delete
- [ ] Snooze 1h / 1d / 1w
- [ ] Unsnooze when snoozed
- [ ] Delete → ConfirmModal → confirm/cancel
- [ ] Escape / outside-click dismiss
- [ ] Dark mode
- [ ] Bulk toolbar actions still work (unchanged)

---

## 6. Certification

**Notifications menu rollout (3A-4B):** **Ready for sign-off** pending manual QA.

---

## 7. Recommended Next Domain

**Wave 3A-4C — Chat** message action menus (per 3A-0 inventory) or **Todo** (`TaskDetail.tsx`).

---

## Related

- [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](../CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03
