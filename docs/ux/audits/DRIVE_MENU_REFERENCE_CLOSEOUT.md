# Drive Reference Menu Closeout (Wave 3A-3)

**Status:** Closed — **PASS WITH FINDINGS**  
**Date:** 2026-06-03  
**Prerequisite:** Wave 3A-2 primitive hardening — [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](../CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md) §3A-2  
**Plan:** [`DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md`](../DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md)  
**Architecture:** Option A — `ContextMenu` / `Popover` / `DropdownMenu` layering

---

## 1. Executive Summary

Drive / File Hub is certified as the **Reference UX Module** for menu standardization. All **active** Drive floating menu surfaces in scope now use canonical shared primitives. Orphan components are documented; duplicate primitives removed.

| Sub-step | Surface | Primitive | Result |
|----------|---------|-----------|--------|
| **3A-3.1a** | `DriveModule.tsx` right-click | `ContextMenu` | **Done** |
| **3A-3.1b** | `DriveModule.tsx` filter panel | `Popover` | **Done** |
| **3A-3.2** | `starred/page.tsx` right-click | `ContextMenu` | **Done** |
| **3A-3.3** | `DriveSidebar.tsx` “New” | `DropdownMenu` | **Done** |
| **3A-3.4** | `DriveSearch.tsx` results panel | — | **Orphan — left intact** |
| **3A-3.5** | `EnhancedDriveModule.tsx` overflow | — | **Stub removed — no menu spec** |
| **3A-3.6** | `FileContextMenu.tsx` | — | **Deleted** |

---

## 2. Disposition Summary

### DriveSearch (3A-3.4)

| Field | Value |
|-------|-------|
| **Path** | `web/src/components/DriveSearch.tsx` |
| **Consumers** | **0** (`rg import DriveSearch` → zero in `web/`) |
| **Disposition** | **Orphan — not migrated** |
| **Rationale** | No runtime wiring; migration deferred until component is integrated into Drive UI |
| **Future** | When wired, migrate results panel to `Popover` (navigational autocomplete, not action menu) |

### EnhancedDriveModule (3A-3.5)

| Field | Value |
|-------|-------|
| **Path** | `web/src/components/drive/enterprise/EnhancedDriveModule.tsx` |
| **Menu surfaces** | `MoreVertical` overflow button — **no-op stub, no menu rendered** |
| **Disposition** | **Stub removed** — duplicate shell code eliminated |
| **Rationale** | Product has not defined overflow actions; no menu invented per rollout rules |
| **Future** | When actions are specified, wire `DropdownMenu` on overflow trigger |

### FileContextMenu (3A-3.6)

| Field | Value |
|-------|-------|
| **Path** | `web/src/components/FileContextMenu.tsx` (deleted) |
| **Consumers** | **0** runtime imports |
| **`createFileActions`** | **0** imports |
| **Disposition** | **Deleted** |
| **Replacement** | `DriveModule` + `starred/page.tsx` use shared `ContextMenu` + `ContextMenuItem[]` builders |

---

## 3. Certification Matrix

| Primitive | Drive consumer | Status |
|-----------|----------------|--------|
| **ContextMenu** | `DriveModule.tsx` (`buildDriveContextMenuItems`) | ✅ Migrated |
| **ContextMenu** | `starred/page.tsx` (`buildStarredContextMenuItems`) | ✅ Migrated |
| **DropdownMenu** | `DriveSidebar.tsx` (`newMenuItems`) | ✅ Migrated |
| **Popover** | `DriveModule.tsx` filter panel (`panelLabel="Drive filters"`) | ✅ Migrated |
| **Modal** | Keyboard shortcuts help (`DriveModule.tsx`) | ✅ Leave as-is (Wave 2A) |
| **Inline `<select>`** | `EnhancedDriveModule.tsx` enterprise toolbar filters | ✅ Leave as-is (form controls, not floating menu) |
| **Icon buttons** | `DriveModule.tsx` card hover quick actions | ✅ Leave as-is (not menus) |

---

## 4. Remaining Exceptions

| Exception | Location | Notes |
|-----------|----------|-------|
| **DriveSearch orphan** | `web/src/components/DriveSearch.tsx` | Inline `absolute` results panel; 0 consumers; defer Popover until wired |
| **Enterprise overflow** | `EnhancedDriveModule.tsx` | No overflow menu until product defines actions |
| **Share modal stub** | `starred/page.tsx` | Inline modal placeholder — Modal archetype, not menu scope |
| **AvatarContextMenu** | `web/src/components/AvatarContextMenu.tsx` | Platform surface — **3A-4**, not Drive |

**DriveModule grep:** zero `role="menu"` after 3A-3.1b.

---

## 5. Validation Summary

| Check | Result |
|-------|--------|
| `pnpm type-check` | **Passed** (2026-06-03 closeout) |
| `FileContextMenu` runtime references | **0** |
| `FileContextMenu.tsx` on disk | **Deleted** |
| Broken exports from deletion | **None** (file was not barrel-exported) |
| Drive compiles clean | **Yes** |

---

## 6. Manual QA

**Status:** **PENDING** — not recorded in-repo.

Recommended checklist:

- [ ] `DriveModule` — right-click menu, filter Popover
- [ ] `starred/page.tsx` — right-click menu
- [ ] `DriveSidebar` — “New” DropdownMenu
- [ ] `EnhancedDriveModule` — share action; no dead overflow button
- [ ] Escape / outside-click dismiss on all migrated surfaces
- [ ] Dark mode on ContextMenu, DropdownMenu, Popover panels

---

## 7. Recommended Next Rollout Domain

**Wave 3A-4 — Platform rollout** (per [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)):

1. **AI** — `ai-chat/page.tsx`, `AIChatDropdown.tsx` overflow/context patterns  
2. **Chat** — message action menus  
3. **Notifications** — `notifications/page.tsx`  
4. **Todo** — `TaskDetail.tsx` remaining menu surfaces  

Drive patterns to reuse: `build*ContextMenuItems()` local builders, controlled `open` state, no inline `fixed`/`absolute` menu shells.

---

## Related

- [`DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md`](../DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md)
- [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](../CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03
