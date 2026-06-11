# ContextMenu & Popover Standardization Review (Wave 3A Planning)

**Status:** Wave 3A-2 primitive hardening complete (2026-06-03)  
**Date:** 2026-06-03  
**Mode:** 3A-0 PLAN + 3A-1/3A-2 ACT (shared primitives only)  
**Prerequisite:** Wave 2 closed — [`audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md)  
**Inventory reference:** [`COMPONENT_INVENTORY.md`](./COMPONENT_INVENTORY.md)  
**Program context:** [`UX_PROGRAM_REVIEW.md`](./UX_PROGRAM_REVIEW.md)

---

## 1. Executive summary

### Does Vssyl have a single canonical menu system today?

**No.**

Vssyl has **two shared menu-related primitives** (`ContextMenu`, `Popover`) but **minimal adoption** in `web/` and **heavy inline duplication** across Drive, Chat, AI, Notifications, Scheduling, and header search surfaces.

| Metric | Count | Notes |
|--------|------:|-------|
| **Menu archetype families** | **4** | Right-click context, overflow/action, picker/dropdown, portal panels |
| **Shared canonical primitives** | **2** | `ContextMenu.tsx`, `Popover.tsx` |
| **Shared primitive consumers in `web/`** | **2** | `AvatarContextMenu`, `ScheduleCalendarGrid` (via shared `ContextMenu`) |
| **`Popover` consumers in `web/`** | **0** | Storybook only |
| **App-layer menu implementations** | **~28** | Distinct files with menu/dropdown UI (excludes stub `MoreVertical` buttons) |
| **Orphan / duplicate primitives** | **0** | `FileContextMenu.tsx` deleted (3A-3.6); `DriveSearch.tsx` orphan documented |
| **Stub overflow buttons (no menu)** | **~8** | `MoreVertical` / `showMoreMenu` state with no rendered panel |
| **Repeated outside-click handlers** | **~18** | Per-file `mousedown` listeners; no shared hook |
| **Portal-based menu UIs** | **5** | `ContextMenu`, search bars, `AIChatDropdown`, `GlobalTrashBin` (panel) |

**Target state (Wave 3A+):**

- **`ContextMenu`** — canonical **right-click / pointer-position** menu (portal, submenu, keyboard).
- **`DropdownMenu`** (new or evolved from **`Popover`**) — canonical **trigger-anchored** overflow / action / picker menus.
- **Single menu item contract** — align `ContextMenuItem` and dropdown items (icon, label, shortcut, disabled, destructive, divider, submenu).
- **Drive / File Hub** — reference UX rollout surface after shell hardening.

---

## 2. Inventory

### 2A. Shared primitives

| Component | Location | Type | Consumers | Canonical? | Notes |
|-----------|----------|------|-----------|------------|-------|
| **ContextMenu** | `shared/src/components/ContextMenu.tsx` | Right-click / pointer menu | `AvatarContextMenu`, `ScheduleCalendarGrid`, Storybook | **Candidate → 3A-1 tokenized** | **3A-1:** `v-surface`, `v-border`, `v-shadow-overlay`, `v-radius-lg`, `v-spacing`, `v-text-*`, `v-focus-ring`; `destructive` + `heading` item flags; submenu `role="menuitem"`; removed legacy inline shadow / debug border |
| **Popover** | `shared/src/components/Popover.tsx` | Trigger popover | Storybook only | **Partial (3A-1 shell)** | **3A-1:** token shell + `aria-expanded` / `aria-haspopup` / `aria-controls`; remains low-level — **not** `DropdownMenu` |
| **ContextMenuItem** | exported from `ContextMenu.tsx` | Item schema | 2 web consumers | **Candidate** | Shared with `ContextMenu` only |

### 2B. App-layer wrappers

| Component | Location | Type | Consumers | Canonical? | Notes |
|-----------|----------|------|-----------|------------|-------|
| **AvatarContextMenu** | `web/src/components/AvatarContextMenu.tsx` | Profile / header menu | `GlobalHeaderTabs`, `DashboardLayoutInner`, `admin-portal/layout`, `business/[id]/page` | **Wrapper** | Composes shared `ContextMenu`; click-triggered (not right-click); nested modals for settings/billing |
| **FileContextMenu** | `web/src/components/FileContextMenu.tsx` | File context menu | **None** (orphan) | **No** | Duplicate of `ContextMenu` patterns; `createFileActions` helper unused; fixed position, no portal, no `role="menu"` |

### 2C. Right-click / pointer-position context menus (custom inline)

| Component | Location | Type | Consumers | Canonical? | Notes |
|-----------|----------|------|-----------|------------|-------|
| **DriveModule context menu** | `web/src/components/modules/DriveModule.tsx` | Right-click file/folder menu | Drive module | **No** | Inline `fixed` panel; `role="menu"` + per-item `aria-label`; no shared primitive; duplicate of starred page |
| **Drive starred context menu** | `web/src/app/drive/starred/page.tsx` | Right-click menu | Starred page | **No** | Near-duplicate of `DriveModule`; `onMouseLeave` close (differs from DriveModule click-outside) |
| **ChatMainPanel message menu** | `web/src/app/chat/ChatMainPanel.tsx` | Right-click message menu | Chat main panel | **Yes (3A-4C)** | Shared `ContextMenu`; Reply / Classify / Delete |
| **ChatWindow message menu** | `web/src/components/chat/ChatWindow.tsx` | Right-click + emoji submenu | Floating chat window | **Yes (3A-4C)** | Shared `ContextMenu`; React via submenu |
| **UnifiedGlobalChat message menu** | `web/src/components/chat/UnifiedGlobalChat.tsx` | Right-click message menu | Global chat widget | **Yes (3A-4C)** | Shared `ContextMenu`; Reply / Delete |
| **ScheduleCalendarGrid context menu** | `web/src/components/scheduling/ScheduleCalendarGrid.tsx` | Employee row right-click | Scheduling admin | **Yes (shared)** | Uses shared `ContextMenu`; 1-item menu today |

### 2D. Overflow / action menus (trigger-anchored)

| Component | Location | Type | Consumers | Canonical? | Notes |
|-----------|----------|------|-----------|------------|-------|
| **NotificationActionsMenu** | `web/src/app/notifications/page.tsx` (local) | Row overflow menu | Notifications page | **No** | `MoreHorizontal`; snooze sub-panel; delete uses `ConfirmModal`; no Escape / keyboard |
| **TaskItem overflow menu** | `web/src/components/todo/TaskItem.tsx` | Task row actions | Todo module | **Yes (3A-4D)** | Shared `DropdownMenu`; Reopen / Edit / Delete |
| **AI conversation menus** | `web/src/app/ai-chat/page.tsx` | Conversation overflow (×3) | AI chat page | **No** | Duplicated inline menus (pinned / recent / mobile); share/edit/archive/pin/trash |
| **AIChatDropdown conversation menu** | `web/src/components/header/AIChatDropdown.tsx` | Conversation overflow | Global header | **No** | Duplicates `ai-chat/page.tsx` pattern inside portal panel |
| **DriveModule filter panel** | `web/src/components/modules/DriveModule.tsx` | Filter dropdown | Drive toolbar | **No** | `role="menu"` but content is **form controls** (selects, checkbox) — archetype blur |
| **DriveSidebar "New" menu** | `web/src/app/drive/DriveSidebar.tsx` | Create dropdown | Drive sidebar | **No** | Inline **styles** object (not Tailwind); legacy pattern |
| **FolderItem hover actions** | `web/src/components/sidebar/FolderItem.tsx` | Inline icon actions | Dashboard sidebar | **N/A** | Not a dropdown — exposed icon buttons on hover |

### 2E. Picker / select-style dropdowns

| Component | Location | Type | Consumers | Canonical? | Notes |
|-----------|----------|------|-----------|------------|-------|
| **AIModelPicker** | `web/src/components/ai/AIModelPicker.tsx` | Model picker | AI surfaces | **No** | `absolute top-full`; outside-click |
| **AIProviderModelPicker** | `web/src/components/ai/AIProviderModelPicker.tsx` | Provider + model picker | AI surfaces | **No** | Two-column dropdown panel |
| **AIServicePicker** | `web/src/components/ai/AIServicePicker.tsx` | Service picker | AI surfaces | **No** | Same visual recipe as model picker |
| **DriveSearch results** | `web/src/components/DriveSearch.tsx` | Search results dropdown | Drive | **No** | Results list, not action menu — shares dropdown mechanics |

### 2F. Portal overlay panels (menu-adjacent)

| Component | Location | Type | Consumers | Canonical? | Notes |
|-----------|----------|------|-----------|------------|-------|
| **GlobalSearchBar** | `web/src/components/GlobalSearchBar.tsx` | Search results portal | Header (legacy) | **No** | `createPortal`; autocomplete panel |
| **CompactSearchButton** | `web/src/components/header/CompactSearchButton.tsx` | Search results portal | Header | **No** | Primary search entry |
| **AIEnhancedSearchBar** | `web/src/components/AIEnhancedSearchBar.tsx` | AI search portal | Header / AI | **No** | Third search dropdown implementation |
| **AIChatDropdown panel** | `web/src/components/header/AIChatDropdown.tsx` | Full AI chat overlay | Header | **No** | `createPortal` `fixed` panel; contains nested conversation menus |
| **GlobalTrashBin expanded** | `web/src/components/GlobalTrashBin.tsx` | Trash list panel | Global chrome | **No** | Portal panel; not an action menu — shares positioning/portal patterns |

### 2G. Popover-like specialty panels

| Component | Location | Type | Consumers | Canonical? | Notes |
|-----------|----------|------|-----------|------------|-------|
| **ChatWindow emoji picker** | `web/src/components/chat/ChatWindow.tsx` | Emoji grid popover | Chat window | **No** | `.emoji-picker` class guard for outside-click |
| **MobileChat emoji picker** | `web/src/components/MobileChat.tsx` | Emoji grid popover | Mobile chat | **No** | Duplicate emoji panel pattern |
| **ScheduleBuilder color picker** | `web/src/components/scheduling/ScheduleBuilderVisual.tsx` | Color picker popover | Scheduling | **No** | `data-color-picker` outside-click |
| **TemplateBuilder color picker** | `web/src/components/scheduling/TemplateBuilderVisual.tsx` | Color picker popover | Scheduling templates | **No** | Duplicate of ScheduleBuilder pattern |

### 2H. Stub overflow buttons (menu intended, not implemented)

| Component | Location | Type | Consumers | Canonical? | Notes |
|-----------|----------|------|-----------|------------|-------|
| **EnhancedDriveModule** | `web/src/components/drive/enterprise/EnhancedDriveModule.tsx` | `MoreVertical` button | Enterprise drive | **Stub** | No menu panel |
| **TodoModule** | `web/src/components/todo/TodoModule.tsx` | `MoreVertical` button | Todo header | **Removed (3A-4D)** | Orphan stub deleted |
| **Admin users row** | `web/src/app/admin-portal/users/page.tsx` | `MoreVertical` button | Admin users table | **Stub** | No menu |
| **Workspace members** | `web/src/app/business/[id]/workspace/members/page.tsx` | `MoreVertical` button | Business members | **Stub** | No menu |
| **Workspace calendar** | `web/src/app/business/[id]/workspace/calendar/page.tsx` | `MoreVertical` button | Business calendar | **Stub** | No menu |
| **Workspace chat** | `web/src/app/business/[id]/workspace/chat/page.tsx` | `MoreVertical` button | Business chat | **Stub** | No menu |
| **EnhancedChatModule** | `web/src/components/chat/enterprise/EnhancedChatModule.tsx` | `MoreVertical` button | Enterprise chat | **Removed (3A-4C)** | Orphan stub deleted |
| **AIChatModule** | `web/src/components/ai/AIChatModule.tsx` | `showMoreMenu` state | AI module | **Stub** | State set on click; **no rendered menu** |

---

## 3. Duplicate pattern analysis

### Severity legend

| Severity | Meaning |
|----------|---------|
| **Critical** | Same UX archetype copy-pasted ≥3 times; blocks consistency and a11y |
| **High** | 2–3 parallel implementations or orphan primitive |
| **Medium** | Shared mechanics duplicated; different domain content |
| **Low** | Stub / placeholder; no user-facing menu yet |

### Findings

| Pattern | Severity | Instances | Impact |
|---------|----------|-----------|--------|
| **Drive right-click context menu** | **Critical** | `DriveModule.tsx`, `drive/starred/page.tsx`, `FileContextMenu.tsx` (orphan) | Three parallel implementations; close-on-outside differs (`mousedown` vs `mouseLeave`); destructive styling inconsistent |
| **AI conversation overflow menu** | **Critical** | `ai-chat/page.tsx` (×3), `AIChatDropdown.tsx`, `AIChatModule` (stub) | Same actions (share/edit/archive/pin/trash) rebuilt inline |
| **Chat message right-click menu** | **High** | `ChatMainPanel`, `ChatWindow`, `UnifiedGlobalChat` | Three variants; mixed positioning (`fixed` vs `absolute`); mixed outside-click (`click` vs `mousedown`) |
| **Outside-click close logic** | **High** | ~18 files | Identical `useEffect` + `mousedown` boilerplate; no `useDismissableLayer` / shared hook |
| **Picker dropdown shell** | **High** | `AIModelPicker`, `AIServicePicker`, `AIProviderModelPicker` | Same `absolute top-full` + white/slate panel classes |
| **Search portal dropdown** | **Medium** | `GlobalSearchBar`, `CompactSearchButton`, `AIEnhancedSearchBar` | Autocomplete, not action menus — but shares portal/positioning debt |
| **Scheduling color picker popover** | **Medium** | `ScheduleBuilderVisual`, `TemplateBuilderVisual` | Duplicate `data-color-picker` outside-click |
| **Emoji picker popover** | **Medium** | `ChatWindow`, `MobileChat` | Duplicate emoji grid panels |
| **Legacy inline-styles dropdown** | **Medium** | `DriveSidebar.tsx` | Only menu using style objects instead of Tailwind/tokens |
| **Filter panel mislabeled as menu** | **Low** | `DriveModule` filter dropdown | `role="menu"` on form panel — a11y smell |
| **Stub `MoreVertical` buttons** | **Low** | ~8 files | Future migration slots; no duplicate menu logic yet |

### Custom portal menus

| File | Portal? | Positioning |
|------|---------|-------------|
| `ContextMenu.tsx` | Yes (`document.body`) | `fixed` + viewport clamp |
| `AIChatDropdown.tsx` | Yes | `fixed` anchored to trigger rect |
| `GlobalSearchBar.tsx` | Yes | `fixed` below search input |
| `CompactSearchButton.tsx` | Yes | `fixed` below button |
| `AIEnhancedSearchBar.tsx` | Yes | `fixed` below input |
| `GlobalTrashBin.tsx` | Yes | `fixed` near FAB |

### Inline dropdowns (no portal)

Majority of overflow and picker menus use `absolute`/`fixed` without portal — risk of **overflow clipping** inside scroll containers (Drive grid, chat panels, todo list).

---

## 4. Accessibility audit

Documented for planning — **not fixed in 3A-0**.

### 4A. Shared `ContextMenu.tsx`

| Criterion | Status | Notes |
|-----------|--------|-------|
| Keyboard navigation | **Partial** | Arrow up/down, Enter/Space; ArrowRight submenu logic incomplete (`submenuIdx` vs `idx` bug risk) |
| Arrow key support | **Partial** | Main menu only; submenu buttons lack `role="menuitem"` / keyboard nav |
| Escape handling | **Implemented** | Window `keydown` listener |
| Focus management | **Partial** | Focuses first item on open; no roving tabindex |
| Focus return | **Missing** | No restore to trigger on close |
| Tab trapping | **N/A** | Menus should use arrow nav, not trap — correct to omit |
| `aria-expanded` | **Missing** | No trigger integration (pointer-position API) |
| `aria-controls` | **Missing** | No id linkage |
| `aria-haspopup` | **Missing** | Consumer responsibility; `AvatarContextMenu` does not set on avatar |
| Screen reader | **Partial** | `role="menu"`, `role="menuitem"`, `aria-disabled`; submenu not announced |
| Submenu hover-only | **Gap** | No keyboard path to submenu items |

### 4B. Shared `Popover.tsx`

| Criterion | Status |
|-----------|--------|
| Keyboard navigation | **Missing** |
| Escape handling | **Missing** |
| Focus management | **Missing** |
| `aria-expanded` / `aria-haspopup` | **Missing** |
| Outside click | **Missing** |
| Portal / scroll clipping | **Missing** |

### 4C. Custom implementations (aggregate)

| Criterion | Context menus (Drive, Chat) | Overflow menus (Todo, Notifications, AI) | Pickers (AI, DriveSearch) |
|-----------|----------------------------|-------------------------------------------|---------------------------|
| Keyboard navigation | **Missing** | **Missing** | **Partial** (native buttons only) |
| Escape handling | **Partial** (Drive: click-outside only; Chat: varies) | **Missing** (except Notifications partial via close) | **Missing** |
| Focus management | **Missing** | **Missing** | **Missing** |
| `role="menu"` | **Partial** (Drive yes; Chat no) | **Missing** | **N/A** |
| Destructive action semantics | **Partial** | **Partial** (`text-red-600` only) | **N/A** |

**Strongest a11y today:** shared `ContextMenu` (partial). **Weakest:** inline overflow menus across AI and Notifications.

---

## 5. UX consistency audit

| Dimension | Shared `ContextMenu` | Custom menus (typical) | Inconsistencies |
|-----------|---------------------|------------------------|-----------------|
| **Spacing** | `px-3 py-2`, `min-w-[200px]` | `px-4 py-2`, `min-w-[150px]`–`w-48` | 3+ width/min-width conventions |
| **Hover states** | `hover:bg-gray-50 dark:hover:bg-slate-700` | Same family but Chat uses `slate-800` vs `slate-700` | Dark hover shade drift |
| **Danger actions** | No `destructive` variant in API | `text-red-600`, `text-red-700 hover:bg-red-50` (FileContextMenu) | Red text only; no tokenized danger surface |
| **Icons** | Optional `icon` slot, `mr-2` | Lucide vs Heroicons mix | Drive/Chat use Lucide; shared ContextMenu stories use Heroicons |
| **Separators** | `divider: true` | Ad-hoc `<div className="border-t">` | No shared divider component |
| **Section headers** | **None** | AI lists use section headers outside menu | N/A in menus |
| **Disabled states** | `opacity-50`, `aria-disabled` | Mixed `cursor-not-allowed` / opacity | Generally similar |
| **Portal behavior** | Always portaled | Mixed — Drive/Chat inline `fixed` without portal | Stacking context risk |
| **Dark mode** | `dark:bg-slate-800`, inline shadow | `dark:bg-slate-900` vs `slate-800` | Surface shade split (`800` vs `900`) |
| **Z-index** | `99999` | `z-50`, `z-10`, `z-20` | Four+ z-index tiers |

---

## 6. Token adoption audit

### Shared primitives

| Primitive | `v-surface` | `v-border` | `v-shadow` | `v-radius` | `v-spacing` | `v-text-primary` | `v-focus-ring` | Verdict |
|-----------|-------------|----------|----------|----------|-----------|----------------|--------------|---------|
| **ContextMenu** | **Yes** | **Yes** | **Yes** (`shadow-v-overlay`) | **Yes** (`rounded-v-lg`, `rounded-v-md` items) | **Yes** (`p-v-*`, `px-v-3`, `py-v-2`) | **Yes** | **Yes** (items) | **Tokenized (3A-1)** |
| **Popover** | **Yes** | **Yes** | **Yes** (`shadow-v-panel`) | **Yes** (`rounded-v-lg`) | **Yes** | Partial (content slot) | No (trigger is consumer child) | **Partial (3A-1)** |

### App-layer implementations

| Pattern | Token adoption |
|---------|----------------|
| Drive / Chat / AI inline menus | **Legacy** — `bg-white dark:bg-slate-900`, `border-gray-200 dark:border-slate-700`, `shadow-lg` |
| DriveSidebar dropdown | **Legacy** — inline style hex colors |
| Notifications overflow | **Legacy** — same gray/slate recipe |
| Search portals | **Legacy** — same recipe |

**Wave 3A-1 delivered (shell only):** `bg-v-surface`, `border-v-border`, `shadow-v-overlay`, `rounded-v-lg` / `rounded-v-md`, `p-v-*`, `text-v-text-primary` / `text-v-text-secondary`, `v-focus-ring` on items, `text-v-danger` + `hover:bg-v-danger/10` for `destructive` items. App-layer menus unchanged.

---

## 7. Canonical ownership recommendation

### Retain

| Primitive | Rationale |
|-----------|-----------|
| **`ContextMenu`** | Best existing implementation: portal, overflow clamp, submenu, partial keyboard. **Retain as canonical right-click / pointer menu.** |
| **`ContextMenuItem` type** | Becomes shared item contract for all menu types. Extend with `destructive?: boolean`. |

### Merge / evolve

| Primitive | Recommendation |
|-----------|----------------|
| **`Popover`** | **Low-level floating shell** (Option A — see §11). Gain portal, placement, dismiss in 3A-2; **not** the public API for action menus. |
| **`FileContextMenu`** | **Deprecate** — unused; migrate any future adoption to shared `ContextMenu` + `destructive` item flag. |

### Introduce (planning only — Option A)

| Primitive | Purpose |
|-----------|---------|
| **`DropdownMenu`** | Trigger-anchored overflow / action menus; composes Popover-layer positioning + `ContextMenuItem` list (3A-2+). |
| **Shared menu item renderer** | Extract from `ContextMenu` for use by `DropdownMenu` (internal or exported helper). |
| **`useDismissableLayer`** | Outside-click + Escape — shared by `Popover`, `DropdownMenu`, optionally `ContextMenu`. |

### Do not implement in 3A-0

No code changes. 3A-1 scopes **shared shell tokenization** on `ContextMenu` + new/evolved `DropdownMenu` only — no consumer migrations.

---

## 8. Migration candidate ranking

### Tier A — Highest value (reference patterns, high traffic)

| Candidate | File(s) | Why |
|-----------|---------|-----|
| **Drive right-click menu** | `DriveModule.tsx`, `drive/starred/page.tsx` | Core File Hub UX; 2 near-duplicates; architecture reference module |
| **Drive filter / toolbar dropdown** | `DriveModule.tsx` (filter panel) | Mislabeled a11y; high visibility — consider `DropdownMenu` or `Popover` form variant |
| **DriveSidebar "New" menu** | `DriveSidebar.tsx` | Legacy styles; first-time create UX |
| **Avatar / profile menu** | `AvatarContextMenu.tsx` | Already on shared `ContextMenu`; token + a11y pass on trigger |
| **AI conversation overflow** | `ai-chat/page.tsx`, `AIChatDropdown.tsx` | 4+ duplicate menus; header + full page |

### Tier B — Moderate value

| Candidate | File(s) | Why |
|-----------|---------|-----|
| **Chat message context menus** | `ChatMainPanel.tsx`, `ChatWindow.tsx`, `UnifiedGlobalChat.tsx` | Consistent right-click UX across chat modes |
| **NotificationActionsMenu** | `notifications/page.tsx` | Extract to shared overflow; snooze sub-menu pattern |
| **TaskItem overflow** | `todo/TaskItem.tsx` | Representative list-row menu |
| **AI pickers** | `AIModelPicker`, `AIServicePicker`, `AIProviderModelPicker` | Same dropdown shell ×3 |
| **ScheduleCalendarGrid** | Already on shared `ContextMenu` | Retest after 3A-1 token pass |

### Tier C — Long-tail cleanup

| Candidate | File(s) | Why |
|-----------|---------|-----|
| **Search portal panels** | `GlobalSearchBar`, `CompactSearchButton`, `AIEnhancedSearchBar` | Separate SearchBox wave (Tier 3); menu-adjacent |
| **Emoji / color pickers** | Chat, Scheduling builders | Specialty popovers — lower priority |
| **Stub `MoreVertical` buttons** | Workspace, admin, enterprise stubs | Implement when feature ships, using `DropdownMenu` from day one |
| **FileContextMenu orphan** | `FileContextMenu.tsx` | Delete or redirect in hygiene PR |
| **GlobalTrashBin panel** | `GlobalTrashBin.tsx` | Panel archetype, not menu — out of 3A scope |

---

## 9. Reference UX candidate

**Recommendation: Drive / File Hub** (confirm roadmap candidate)

| Factor | Drive | Dashboard | AI | Business Workspace |
|--------|-------|-----------|-----|------------------|
| Context menu maturity | **Highest** — daily right-click on files | Low | Medium (overflow only) | Stubs only |
| Implementation count | **3** menu implementations (module, starred, sidebar) | Few | **4+** duplicates | **4** stubs |
| Architecture alignment | **Reference Implementation #1** | Widget-heavy | Growth surface | Shell-only |
| ConfirmModal progress | Soft-delete done; purge pending | — | Trash done | — |
| Token / dark mode | Good module baseline | High debt | Medium | Partial |

**Justification:** Drive already defines the platform file-action vocabulary (open, pin, share, download, trash, V_Link). Consolidating Drive menus first yields a **copy-paste reference** for Chat (message actions), AI (overflow), and Notifications (row actions). Dashboard lacks a single menu archetype; Business Workspace menus are mostly unimplemented stubs.

---

## 10. Proposed Wave 3A roadmap

Mirrors Modal Wave 2A phasing.

| Phase | Scope | Deliverable | ACT? |
|-------|-------|-------------|------|
| **3A-0 Inventory** | Repo-wide menu audit | This document | **Done (PLAN)** |
| **3A-1 Canonical shell + tokenization** | `ContextMenu.tsx` + `Popover.tsx` tokens; item flags; Storybook | Tokenized shells; no consumer migrations | **Done (ACT)** |
| **3A-2 Primitive hardening** | `menuShared`; `DropdownMenu` scaffold; Popover portal/dismiss; baseline a11y | Hardened primitives; no consumer migrations | **Done (ACT)** |
| **3A-3 Reference module rollout** | Drive menu migrations per [`DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md`](./DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md) | All active surfaces migrated | **Done (ACT)** — [`audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md`](./audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md) |
| **3A-4A AI menu rollout** | `ai-chat/page.tsx`, `AIChatDropdown.tsx`, AI pickers | `DropdownMenu` migrations | **Done (ACT)** — [`audits/AI_MENU_ROLLOUT_CLOSEOUT.md`](./audits/AI_MENU_ROLLOUT_CLOSEOUT.md) |
| **3A-4B Notifications menu rollout** | `notifications/page.tsx` `NotificationActionsMenu` | `DropdownMenu` | **Done (ACT)** — [`audits/NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md`](./audits/NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md) |
| **3A-4 Platform rollout** | Chat, Todo, Scheduling | Tier A/B migrations | **Done** — major domains complete; Scheduling deferred |
| **3A-5 Certification review** | Manual QA + closeout doc | `audits/CONTEXTMENU_POPOVER_CLOSEOUT.md` | After 3A-4 |

### 3A-1 closeout (2026-06-03)

| Deliverable | Status |
|-------------|--------|
| `ContextMenu` shell + item tokenization | **Done** |
| `ContextMenuItem.destructive` | **Done** |
| `ContextMenuItem.heading` (section header) | **Done** |
| `Popover` token shell + baseline `aria-*` | **Done** |
| `DropdownMenu` scaffold | **Deferred to 3A-2** (see Popover evaluation below) |
| Storybook: Basic, Destructive, Disabled, SectionHeading, DarkMode | **Done** |
| `web/` consumer migrations | **None** (per scope) |

### Popover evaluation (3A-1)

| Question | Finding |
|----------|---------|
| Can `Popover` become `DropdownMenu` foundation? | **No** — click-toggle `span` wrapper, no portal, no placement, no outside-click/Escape |
| Recommendation | **Keep `Popover` low-level**; introduce **`DropdownMenu` in 3A-2** as separate primitive sharing `ContextMenuItem` styling helpers |
| 3A-1 change to `Popover` | Token shell + `aria-expanded` / `aria-haspopup` / `aria-controls` only — no redesign |

### 3A-2 closeout (2026-06-03)

| Deliverable | Status |
|-------------|--------|
| `menuShared.tsx` — shell classes + `renderMenuItem` | **Done** |
| `ContextMenu` — shared item renderer; `menuLabel?` prop; submenu `aria-haspopup` / `aria-expanded` | **Done** |
| `Popover` — portal to `document.body`; outside-click + Escape dismiss; `panelLabel?` prop | **Done** |
| `DropdownMenu` scaffold — portal, `align`/`side`, `ContextMenuItem[]`, baseline `aria-*` | **Done** (scaffold only; no submenu) |
| `useDismissableLayer` shared hook | **Deferred** — inline dismiss in Popover/DropdownMenu per scope |
| Focus return / roving tabindex / submenu keyboard rewrite | **Deferred** — post-3A-3 if needed |
| Storybook: ContextMenu (5), Popover (2), DropdownMenu (2) | **Done** |
| `web/` consumer migrations | **None** |

### 3A-3 rollout closeout (2026-06-03)

**Authoritative plan:** [`DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md`](./DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md)  
**Closeout:** [`audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md`](./audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md) (**PASS WITH FINDINGS**)

| Item | Target | ACT step |
|------|--------|----------|
| `DriveModule.tsx` context menu | → `ContextMenu` | **Done (3A-3.1a)** |
| `DriveModule.tsx` filter panel | → `Popover` | **Done (3A-3.1b)** |
| `drive/starred/page.tsx` context menu | → `ContextMenu` | **Done (3A-3.2)** |
| `DriveSidebar.tsx` “New” dropdown | → `DropdownMenu` | **Done (3A-3.3)** |
| `DriveSearch.tsx` results panel | Orphan — documented | **Done (3A-3.4)** — defer Popover until wired |
| `EnhancedDriveModule.tsx` overflow stub | Stub removed | **Done (3A-3.5)** |
| `FileContextMenu.tsx` orphan | Deleted | **Done (3A-3.6)** |
| `AvatarContextMenu` | → `DropdownMenu` | **3A-4** (not Drive) |

### Accessibility status (post–3A-2)

| Primitive | Implemented | Deferred |
|-----------|-------------|----------|
| **ContextMenu** | `role="menu"` / `menuitem`; `aria-label`; `aria-disabled`; `aria-haspopup`/`aria-expanded` on submenu parents; `v-focus-ring`; Escape + outside-click | Focus return; roving tabindex; submenu keyboard |
| **Popover** | `aria-expanded` / `aria-haspopup` / `aria-controls`; `role="region"`; Escape + outside-click | Focus management |
| **DropdownMenu** | `role="menu"` / `menuitem`; trigger `aria-expanded` / `aria-haspopup="menu"` / `aria-controls`; Escape + outside-click | Keyboard nav; focus trap; submenu |

### 3A-3 certification

| Gate | Status |
|------|--------|
| All active Drive menu surfaces migrated | **Yes** |
| `FileContextMenu` deleted | **Yes** |
| `pnpm type-check` | **Pass** |
| Manual QA | **Pending** |
| **Drive Reference UX certification** | **Ready** — pending manual QA sign-off |

### Parallel tracks (not 3A)

- **ConfirmModal Batch 3** (Drive permanent purge) — separate **ConfirmModal 3B** track per [`UX_PROGRAM_REVIEW.md`](./UX_PROGRAM_REVIEW.md).
- **Layout shells** — **3C** track.

---

## 11. Architectural decision (menu primitive layering)

**Status:** Decision recorded (2026-06-03) — documentation only; no `DropdownMenu` implementation in this pass.

### Options considered

**Option A**

```txt
ContextMenu = right-click / pointer-position menus
Popover     = low-level floating-content primitive (positioning + dismiss)
DropdownMenu = trigger-anchored action/overflow menus (built on Popover layer)
```

**Option B**

```txt
ContextMenu = right-click / pointer-position menus
Popover     = canonical dropdown/menu primitive for all trigger-anchored menus
(no separate DropdownMenu)
```

### Recommendation: **Option A**

| Layer | Primitive | Responsibility |
|-------|-----------|----------------|
| **Menu (pointer)** | `ContextMenu` | Right-click and `{ x, y }` anchor; portal; `ContextMenuItem[]`; submenu by hover |
| **Floating (generic)** | `Popover` | Trigger-anchored **non-menu** or **custom-content** panels (tooltips-adjacent, emoji grid, simple panels) |
| **Menu (trigger)** | `DropdownMenu` *(3A-2+)* | `MoreVertical` overflow, profile click-menus, picker lists with `ContextMenuItem[]`; portal + placement + menu a11y |

### Rationale

1. **Two menu activation models exist in the repo** — pointer-position (Drive/Chat right-click) vs trigger-anchored (overflow, pickers, sidebar “New”). One component cannot serve both without API awkwardness. `ContextMenu` already owns the pointer model; trigger-anchored menus need a trigger ref, `side`/`align`, and `aria-expanded` on the button.

2. **Not all floating UI is a menu** — inventory found emoji pickers, color pickers, filter **form** panels, and search autocomplete portals. Collapsing these into a single “menu Popover” (Option B) bloats the primitive with menu-only concerns (`role="menu"`, roving tabindex, destructive rows) or forces non-menu surfaces to import menu APIs.

3. **3A-1 evidence** — `Popover` is 40 lines: click-toggle `span`, centered `absolute` panel, no portal, no outside-click/Escape, no placement. Option B would require evolving `Popover` into what is effectively `DropdownMenu` while keeping the name `Popover`, which conflicts with [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md) (“Dropdown | Partial | Popover”) and confuses developers (`Popover` for overflow vs for emoji grid).

4. **Option A matches Modal precedent** — Wave 2A kept `Modal` as shell and composed domain content inside. Here: `Popover` = floating **shell**; `DropdownMenu` = menu **semantics** + item list; `ContextMenu` = pointer menu **semantics** (may share item renderer with `DropdownMenu` in 3A-2).

5. **Shared internals, separate public APIs** — `DropdownMenu` should reuse a private positioning/dismiss layer extracted from or shared with `Popover` (portal, anchor rect, `useDismissableLayer`). Public exports stay distinct: import `DropdownMenu` for action lists, `Popover` for arbitrary `content`, `ContextMenu` for right-click.

### Why not Option B

| Risk | Impact |
|------|--------|
| API pollution | `Popover` props must grow (`items?`, `placement?`, `menu?`) or overload `content` |
| Naming drift | “Popover” used for destructive trash actions and model pickers — poor semantic fit |
| Migration churn | Every future menu migration targets `Popover`; Storybook/docs must redefine `Popover` away from generic floating UI |
| Avatar / profile pattern | `AvatarContextMenu` uses `ContextMenu` at click coordinates today — Option B does not clarify whether that stays `ContextMenu` or becomes “Popover menu”; Option A assigns it to **`DropdownMenu`** in 3A-4 |

### Migration implications

| Consumer archetype | Target primitive | Wave |
|--------------------|------------------|------|
| Right-click file/message menus | `ContextMenu` | **3A-3** (Drive), **3A-4** (Chat) |
| Overflow / `MoreVertical` action lists | `DropdownMenu` | **3A-4** (AI, Notifications, Todo) |
| Toolbar pickers (model/service) | `DropdownMenu` or `Popover` + custom list | **3A-4** — pickers with `ContextMenuItem`-shaped rows → `DropdownMenu`; bespoke two-column UI may stay custom inside `Popover` until a `Select`-class primitive exists |
| Filter form panel (Drive toolbar) | `Popover` or dedicated `FilterDropdown` | **3A-3/3A-4** — **not** `DropdownMenu` (form controls, not action list) |
| Emoji / color pickers | `Popover` (generic content) | Long-tail; optional 3A-4+ |
| Search autocomplete portals | Out of 3A — SearchBox wave (Tier 3) | Not `Popover` / `DropdownMenu` |
| `AvatarContextMenu` (click at avatar) | `DropdownMenu` | **3A-4** — migrate off coordinate-hack `ContextMenu` |
| `FileContextMenu` orphan | Deleted; use `ContextMenu` | **Done (3A-3.6)** |
| Stub `MoreVertical` buttons | `DropdownMenu` when implemented | Ship with feature work |

**No breaking changes to existing exports in 3A-1.** `Popover` API unchanged. `DropdownMenu` is **additive** in 3A-2+.

### Future Wave 3A rollout impact

| Phase | Option A impact |
|-------|-----------------|
| **3A-2** | Harden `ContextMenu` a11y; add `useDismissableLayer`; evolve `Popover` with portal + placement + dismiss (floating shell); **scaffold `DropdownMenu`** composing shell + `ContextMenuItem` renderer |
| **3A-3** | Drive right-click → `ContextMenu`; DriveSidebar “New” + filter panel → `DropdownMenu` vs `Popover` per table above |
| **3A-4** | AI overflow, Notifications, Todo → `DropdownMenu`; Chat right-click → `ContextMenu`; Avatar → `DropdownMenu` |
| **3A-5** | Certify two menu primitives + one floating primitive; document “when to use which” in `COMPONENT_STANDARDS.md` |

If **Option B** had been chosen, 3A-2 would have forced a breaking `Popover` redesign and 3A-3/3A-4 migrations would all target `Popover`, blurring form panels and action menus. **Option A keeps rollout phases separable and testable.**

### Decision log

| Field | Value |
|-------|-------|
| **Decision** | **Option A** |
| **Date** | 2026-06-03 |
| **Authority** | Wave 3A menu standardization program |
| **Implementation** | `DropdownMenu` deferred — **not** implemented in 3A-1 or this decision pass |
| **Review trigger** | Revisit only if a third-party design system is adopted (explicitly out of scope per roadmap) |

---

## Files reviewed

| Area | Files |
|------|-------|
| Shared primitives | `ContextMenu.tsx`, `Popover.tsx`, `ContextMenu.stories.tsx`, `Popover.stories.tsx`, `index.ts` |
| App wrappers | `AvatarContextMenu.tsx` |
| Drive | `DriveModule.tsx`, `drive/starred/page.tsx`, `DriveSidebar.tsx`, `DriveSearch.tsx`, `EnhancedDriveModule.tsx` |
| Chat | `ChatMainPanel.tsx`, `ChatWindow.tsx`, `UnifiedGlobalChat.tsx`, `ChatLeftPanel.tsx`, `ChatSidebar.tsx`, `EnhancedChatModule.tsx`, `MobileChat.tsx` |
| AI | `ai-chat/page.tsx`, `AIChatDropdown.tsx`, `AIChatModule.tsx`, `AIModelPicker.tsx`, `AIServicePicker.tsx`, `AIProviderModelPicker.tsx` |
| Header / search | `GlobalSearchBar.tsx`, `CompactSearchButton.tsx`, `AIEnhancedSearchBar.tsx`, `GlobalHeaderTabs.tsx` |
| Other | `notifications/page.tsx`, `todo/TaskItem.tsx`, `scheduling/ScheduleCalendarGrid.tsx`, `scheduling/ScheduleBuilderVisual.tsx`, `scheduling/TemplateBuilderVisual.tsx`, `GlobalTrashBin.tsx`, `sidebar/FolderItem.tsx` |
| Docs | `MODAL_STANDARDIZATION_REVIEW.md`, `COMPONENT_INVENTORY.md`, `UX_PROGRAM_REVIEW.md`, `UX_MODERNIZATION_ROADMAP.md` |

**Grep validation:** `ContextMenu` imports in `web/` (2), `Popover` imports in `web/` (0), `onContextMenu` handlers (10 files), `createPortal` menu-adjacent (6 files), `MoreVertical`/`MoreHorizontal` overflow affordances (22 files).

---

### 3A-4A AI rollout closeout (2026-06-03)

**Closeout:** [`audits/AI_MENU_ROLLOUT_CLOSEOUT.md`](./audits/AI_MENU_ROLLOUT_CLOSEOUT.md)

| Item | Primitive | Status |
|------|-----------|--------|
| `ai-chat/page.tsx` conversation overflow (×3) | `DropdownMenu` | **Done** |
| `AIChatDropdown.tsx` conversation overflow | `DropdownMenu` | **Done** |
| `AIServicePicker.tsx` | `DropdownMenu` | **Done** |
| `AIModelPicker.tsx` | `DropdownMenu` | **Done** |
| `AIProviderModelPicker.tsx` | `DropdownMenu` | **Done** |

### 3A-4B Notifications rollout closeout (2026-06-03)

**Closeout:** [`audits/NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md`](./audits/NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md)

| Item | Primitive | Status |
|------|-----------|--------|
| `NotificationActionsMenu` row overflow | `DropdownMenu` | **Done** |

### 3A-4C Chat rollout closeout (2026-06-03)

**Closeout:** [`audits/CHAT_MENU_ROLLOUT_CLOSEOUT.md`](./audits/CHAT_MENU_ROLLOUT_CLOSEOUT.md)

| Item | Primitive | Status |
|------|-----------|--------|
| `ChatMainPanel.tsx` message right-click | `ContextMenu` | **Done** |
| `ChatWindow.tsx` message right-click | `ContextMenu` | **Done** |
| `UnifiedGlobalChat.tsx` message right-click | `ContextMenu` | **Done** |
| `MobileChat.tsx` header overflow | `DropdownMenu` | **Done** |

### 3A-4D Todo rollout closeout (2026-06-03)

**Closeout:** [`audits/TODO_MENU_ROLLOUT_CLOSEOUT.md`](./audits/TODO_MENU_ROLLOUT_CLOSEOUT.md)

| Item | Primitive | Status |
|------|-----------|--------|
| `TaskItem.tsx` task overflow | `DropdownMenu` | **Done** |

### 3A-5 Platform menu certification (2026-06-03)

**Certification:** [`audits/PLATFORM_MENU_CERTIFICATION.md`](./audits/PLATFORM_MENU_CERTIFICATION.md) — **PASS WITH FINDINGS**

Wave 3A menu program **complete**. Option A layering ratified as platform standard.

**Last updated:** 2026-06-03 (3A-5 certification closeout)
