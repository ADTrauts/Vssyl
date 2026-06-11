# Platform Menu Certification (Wave 3A-5)

**Status:** Closed — **PASS WITH FINDINGS**  
**Date:** 2026-06-03  
**Mode:** Certification audit only — no code changes  
**Prerequisite:** Wave 3A-4 platform rollouts complete — Drive (3A-3), AI (3A-4A), Notifications (3A-4B), Chat (3A-4C), Todo (3A-4D)

---

## 1. Certification Result

| Verdict | **PASS WITH FINDINGS** |
|---------|------------------------|
| **Platform menu architecture** | Certified as the **platform standard** for action menus |
| **Blocking issues** | **None** for certification |
| **Gates before full sign-off** | Manual QA pending for 3A-3 through 3A-4D |

### Rationale

All five major platform domains have migrated active floating action menus to shared primitives. Duplicate inline menu shells are eliminated in scoped rollouts (`rg` validation: **0** matches for legacy `shadow-lg py-1` / `menuRef` / `absolute right-0 top-full` patterns in `web/`). Primitives are token-compliant, share a unified `ContextMenuItem` contract via `menuShared.tsx`, and exhibit consistent dismiss behavior (Escape + outside pointer-down).

Findings are **non-blocking** by program policy: deferred accessibility depth (Wave 4+), documented exceptions (orphans, specialty popovers, stubs), `DropdownMenu` submenu gap, and pending manual QA.

---

## 2. Primitive Certification

### 2A. ContextMenu

| Criterion | Status | Evidence |
|-----------|--------|----------|
| **API stability** | ✅ Certified | `open`, `onClose`, `anchorPoint`, `items`, `menuLabel` — unchanged since 3A-2 |
| **Token compliance** | ✅ Certified | `MENU_SHELL_CLASS` uses `v-surface`, `v-border`, `v-shadow-overlay`, `v-radius-lg`, `v-spacing`, `v-text-*`, `v-danger` |
| **Adoption quality** | ✅ Strong | 7 `web/` consumers; pointer-position model used consistently for right-click surfaces |
| **Accessibility baseline** | ⚠️ Partial | See §5 — acceptable for certification; not L3 a11y |

**Strengths:** Portal rendering; viewport clamping; submenu support (mouse); Arrow Up/Down + Enter/Space; first focusable item focused on open; `role="menu"` + `role="menuitem"`.

**Findings:** No focus return to trigger; submenu keyboard navigation incomplete (`ArrowRight` handler partial); no roving `tabindex`.

---

### 2B. DropdownMenu

| Criterion | Status | Evidence |
|-----------|--------|----------|
| **API stability** | ✅ Certified | `open`, `onOpenChange`, `children` (trigger), `items`, `align`, `side`, `menuLabel` |
| **Item model** | ✅ Certified | Shared `ContextMenuItem` — icon, label, shortcut, disabled, destructive, heading, divider, submenu (type only) |
| **Destructive actions** | ✅ Certified | `destructive: true` → `v-danger` styling; rollouts use divider-before-delete pattern |
| **Heading support** | ✅ Certified | `heading: true` used in Notifications snooze group, AI provider picker |
| **Divider support** | ✅ Certified | `divider: true` before delete across all rollouts |
| **Rollout suitability** | ✅ Certified | 9 `web/` consumers; trigger-anchored overflow model proven across domains |

**Strengths:** Portal + fixed positioning; scroll/resize reposition; `aria-expanded` / `aria-haspopup` / `aria-controls` on trigger wrapper; Escape + outside dismiss.

**Findings:** **Submenu items ignored** (`handleItemActivate` returns early if `item.submenu`) — ChatWindow uses `ContextMenu` for React submenu instead; AI/Notifications flattened groups. No inter-item keyboard navigation. Documented in primitive JSDoc as intentional 3A-2 scope.

---

### 2C. Popover

| Criterion | Status | Evidence |
|-----------|--------|----------|
| **Shell quality** | ✅ Certified | Token shell: `v-surface`, `v-border`, `v-shadow-panel`, `v-radius-lg` |
| **Positioning** | ✅ Certified | Portal; trigger-anchored; scroll/resize listeners |
| **Dismissal** | ✅ Certified | Escape + outside `mousedown` |
| **Foundation readiness** | ✅ Certified | Explicitly **not** for action menus; suitable for filter panels, pickers, informational panels |

**Adoption:** **1** `web/` consumer (`DriveModule` filter panel). Under-adopted but architecturally sound.

**Findings:** `role="region"` (not dialog); trigger wraps children with `onClick` toggle — consumers must not nest interactive triggers incorrectly. `zIndex: 50` vs menu `99999` — acceptable layering for non-menu panels.

---

### 2D. Shared item contract (`menuShared.tsx`)

| Feature | ContextMenu | DropdownMenu | Status |
|---------|-------------|--------------|--------|
| `destructive` | ✅ | ✅ | Certified |
| `heading` | ✅ | ✅ | Certified |
| `divider` | ✅ | ✅ | Certified |
| `submenu` | ✅ (mouse) | ❌ (ignored) | Documented gap |
| `disabled` | ✅ | ✅ | Certified |
| `icon` / `shortcut` | ✅ | ✅ | Certified |

---

## 3. Domain Rollout Review

| Domain | Wave | Primitives | Migration completeness | Shell removal | Certification |
|--------|------|------------|------------------------|---------------|---------------|
| **Drive** | 3A-3 | ContextMenu (×2), DropdownMenu (×1), Popover (×1) | **Complete** for active surfaces | `FileContextMenu` deleted; `EnhancedDriveModule` stub removed | **PASS WITH FINDINGS** — [`DRIVE_MENU_REFERENCE_CLOSEOUT.md`](./DRIVE_MENU_REFERENCE_CLOSEOUT.md) |
| **AI** | 3A-4A | DropdownMenu (×6 surfaces) | **Complete** for scoped AI menus | Inline shells + `menuRefs` removed | **PASS WITH FINDINGS** — [`AI_MENU_ROLLOUT_CLOSEOUT.md`](./AI_MENU_ROLLOUT_CLOSEOUT.md) |
| **Notifications** | 3A-4B | DropdownMenu (×1) | **Complete** | `NotificationActionsMenu` shell removed; snooze flattened | **PASS WITH FINDINGS** — [`NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md`](./NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md) |
| **Chat** | 3A-4C | ContextMenu (×3), DropdownMenu (×1) | **Complete** for message/mobile menus | 3 inline context shells removed; dead `showMenu` removed | **PASS WITH FINDINGS** — [`CHAT_MENU_ROLLOUT_CLOSEOUT.md`](./CHAT_MENU_ROLLOUT_CLOSEOUT.md) |
| **Todo** | 3A-4D | DropdownMenu (×1) | **Complete** for overflow menu | `TaskItem` shell removed; `TodoModule` stub removed | **PASS WITH FINDINGS** — [`TODO_MENU_ROLLOUT_CLOSEOUT.md`](./TODO_MENU_ROLLOUT_CLOSEOUT.md) |

### Per-domain remaining exceptions (in scope)

| Domain | Exception | Classification |
|--------|-----------|----------------|
| Drive | `DriveSearch.tsx` orphan (0 consumers) | Certified exception — defer until wired |
| Drive | `EnhancedDriveModule` — no overflow menu | Certified exception — product undefined |
| Drive | Card hover quick-action icon buttons | Not a menu |
| AI | `AIChatDropdown` full portal panel | Not a menu — overlay shell |
| AI | `AIChatModule` `showMoreMenu` dead state | Needs correction (hygiene) |
| Notifications | Bulk toolbar / inline quick actions | Not a menu |
| Chat | Emoji/quick-reaction specialty panels | Certified exception — specialty popover |
| Chat | `ChatSidebar` `MoreHorizontal` stub | Certified exception — stub |
| Todo | Inline edit/delete in TaskDetail, ProjectManager, etc. | Not a menu — icon buttons |

---

## 4. Remaining Exceptions Inventory

| Exception | Location | Classification | Notes |
|-----------|----------|----------------|-------|
| **DriveSearch orphan** | `web/src/components/DriveSearch.tsx` | Certified exception | 0 consumers; migrate to `Popover` when wired |
| **AvatarContextMenu** | `web/src/components/AvatarContextMenu.tsx` | Certified exception | Already uses shared `ContextMenu`; click-triggered profile menu; complex nested modals — platform header, not domain rollout |
| **ScheduleCalendarGrid** | `web/src/components/scheduling/ScheduleCalendarGrid.tsx` | Future migration | Uses `ContextMenu` (pre-rollout consumer); scheduling domain not in 3A-4 scope |
| **Scheduling color pickers** | `ScheduleBuilderVisual.tsx`, `TemplateBuilderVisual.tsx` | Certified exception | Inline `absolute z-50` panels — specialty popovers, not action menus |
| **Calendar binary-choice** | `business/.../calendar/page.tsx` stubs | Future migration | `MoreVertical` affordances; out of 3A-4 scope |
| **Chat emoji pickers** | `ChatWindow`, `MobileChat`, `ChatMainPanel`, `EnhancedChatModule` | Certified exception | Specialty popover panels; `.emoji-picker` guard pattern |
| **AIChatModule stub** | `web/src/components/ai/AIChatModule.tsx` | Needs correction | `showMoreMenu` state + `MoreVertical` buttons; **no menu renders** — hygiene debt |
| **ChatSidebar stub** | `web/src/components/chat/ChatSidebar.tsx` | Certified exception | `MoreHorizontal` — no menu |
| **ChatLeftPanel MoreVertical** | `web/src/app/chat/ChatLeftPanel.tsx` | Certified exception | Panel collapse toggle, not menu |
| **Global search panels** | `GlobalSearchBar`, `CompactSearchButton`, etc. | Future migration | Portal autocomplete — not action menus |
| **Admin / Business stubs** | Various `MoreVertical` in admin, members, widgets | Future migration | Out of 3A-4 scope |
| **DropdownMenu submenu gap** | `shared/src/components/DropdownMenu.tsx` | Certified exception | By design in 3A-2; use `ContextMenu` or flat groups |

---

## 5. Accessibility Review

### Implemented (certified baseline)

| Feature | ContextMenu | DropdownMenu | Popover |
|---------|-------------|--------------|---------|
| Escape dismiss | ✅ | ✅ | ✅ |
| Outside click dismiss | ✅ (`mousedown`) | ✅ (`mousedown`) | ✅ (`mousedown`) |
| `aria-label` on panel | ✅ `menuLabel` | ✅ `menuLabel` | ✅ `panelLabel` |
| `aria-expanded` on trigger | N/A (pointer) | ✅ | ✅ |
| `aria-haspopup` | N/A | ✅ `menu` | ✅ `true` |
| `aria-controls` | N/A | ✅ when open | ✅ when open |
| `role="menu"` / `menuitem` | ✅ | ✅ | N/A (`region`) |
| Initial focus | ✅ first item | ❌ | ❌ |

### Missing (deferred — not certification blockers)

| Gap | Blocker? | Wave |
|-----|----------|------|
| Focus return to trigger | **No** | Accessibility Wave |
| Roving `tabindex` | **No** | Accessibility Wave |
| Full submenu keyboard | **No** | Accessibility Wave |
| Menu focus trap | **No** | Accessibility Wave |
| DropdownMenu arrow-key nav | **No** | Accessibility Wave |

### Determination

**Acceptable for certification.** Program explicitly deferred roving tabindex, focus architecture, and accessibility overhaul to future waves. Current baseline meets **UX-L1** interaction minimum (dismiss + basic roles + destructive styling). Not **UX-L3** accessibility.

---

## 6. Program Metrics

| Metric | Count | Notes |
|--------|------:|-------|
| **`ContextMenu` `web/` consumers** | **7** | DriveModule, starred/page, ChatMainPanel, ChatWindow, UnifiedGlobalChat, AvatarContextMenu, ScheduleCalendarGrid |
| **`DropdownMenu` `web/` consumers** | **9** | DriveSidebar, ai-chat/page, AIChatDropdown, 3× AI pickers, notifications/page, MobileChat, TaskItem |
| **`Popover` `web/` consumers** | **1** | DriveModule filter panel |
| **Domains certified (3A-4)** | **5** | Drive, AI, Notifications, Chat, Todo — all PASS WITH FINDINGS |
| **Legacy duplicate menu shells (grep)** | **0** | No `shadow-lg py-1`, `menuRef`, `showMenu &&` inline panels in `web/` |
| **Orphan components removed** | **1** | `FileContextMenu.tsx` |
| **Stub affordances removed** | **4** | EnhancedDriveModule, EnhancedChatModule, TodoModule, UnifiedGlobalChat dead `showMenu` |
| **Stub affordances remaining** | **~6+** | AIChatModule, ChatSidebar, ChatLeftPanel, calendar pages, admin stubs |
| **Manual QA completion** | **0 / 5** domains | All closeouts list QA as PENDING |

### Rollout closeout references

- [`DRIVE_MENU_REFERENCE_CLOSEOUT.md`](./DRIVE_MENU_REFERENCE_CLOSEOUT.md)
- [`AI_MENU_ROLLOUT_CLOSEOUT.md`](./AI_MENU_ROLLOUT_CLOSEOUT.md)
- [`NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md`](./NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md)
- [`CHAT_MENU_ROLLOUT_CLOSEOUT.md`](./CHAT_MENU_ROLLOUT_CLOSEOUT.md)
- [`TODO_MENU_ROLLOUT_CLOSEOUT.md`](./TODO_MENU_ROLLOUT_CLOSEOUT.md)

---

## 7. Architecture Standard (post-certification)

```
Pointer-position (right-click)     →  ContextMenu  + anchorPoint
Trigger-anchored action/overflow   →  DropdownMenu + controlled open
Informational / filter / picker    →  Popover      + content panel
Destructive row action             →  destructive item + ConfirmModal (unchanged Wave 2B)
Item builder pattern               →  useMemo(() => ContextMenuItem[], [...])
```

**Option A layering** (from [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](../CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md) §11) is **ratified** as platform standard.

---

## 8. Wave 3 Completion Status

| Track | Status |
|-------|--------|
| **Wave 3A — Menu primitives + platform rollout** | ✅ **Complete** (certified PASS WITH FINDINGS) |
| **Wave 3B — Drive interaction completion** | ⏳ Not started (ConfirmModal purge, drag-to-trash) |
| **Wave 3C — Layout shells** | ⏳ Not started |

**Wave 3 overall:** **Not complete** — 3B and 3C remain.  
**Wave 3A menu program:** **Complete** — certification closed.

---

## 9. Recommended Next UX Wave

| Priority | Wave | Rationale |
|----------|------|-----------|
| **1 (gate)** | Manual QA — 3A-3 through 3A-4D | All closeouts pending QA; required before production sign-off |
| **2** | **Wave 3B** — Drive interaction completion | ConfirmModal permanent purge (2 Drive sites); natural follow-on to menu + modal work |
| **3** | Hygiene — stub removal pass | `AIChatModule` dead `showMoreMenu`, `ChatSidebar` stub — small PR, no redesign |
| **4** | **Wave 3C** — Layout shells | Workspace chrome standardization |
| **Deferred** | Scheduling menu migration | `ScheduleCalendarGrid` already on `ContextMenu`; builders need specialty popover pass |
| **Deferred** | Accessibility Wave | Focus return, roving tabindex, full keyboard menus |
| **Out of scope** | Calendar, Admin/Governance menu rollout | Per program boundaries |

---

## 10. Certification Sign-off Checklist

- [x] Primitives reviewed (`ContextMenu`, `DropdownMenu`, `Popover`)
- [x] Five domain rollouts reviewed
- [x] Exceptions inventoried and classified
- [x] Accessibility baseline assessed
- [x] Program metrics reported
- [ ] Manual QA — 3A-3 Drive
- [ ] Manual QA — 3A-4A AI
- [ ] Manual QA — 3A-4B Notifications
- [ ] Manual QA — 3A-4C Chat
- [ ] Manual QA — 3A-4D Todo

---

**Certified by:** Wave 3A-5 audit (documentation)  
**Last updated:** 2026-06-03
