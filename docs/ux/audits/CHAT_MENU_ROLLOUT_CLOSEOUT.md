# Chat Menu Rollout Closeout (Wave 3A-4C)

**Status:** Closed — **PASS WITH FINDINGS**  
**Date:** 2026-06-03  
**Prerequisite:** Notifications Menu Rollout — [`NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md`](./NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md)  
**Reference patterns:** Drive + AI + Notifications certified primitives

---

## 1. Menu Surface Inventory

| # | Surface | Location | Classification | Disposition |
|---|---------|----------|----------------|-------------|
| 1 | **Message right-click menu** | `web/src/app/chat/ChatMainPanel.tsx` | `ContextMenu` candidate | **Migrated** → `ContextMenu` |
| 2 | **Quick reactions hover panel** | `ChatMainPanel.tsx` ~L387 | Popover-like picker | **Not a menu** — unchanged |
| 3 | **Message right-click menu** | `web/src/components/chat/ChatWindow.tsx` | `ContextMenu` candidate | **Migrated** → `ContextMenu` (+ React submenu) |
| 4 | **Reaction picker (inline)** | `ChatWindow.tsx` (removed) | Popover-like | **Folded** into `ContextMenu` submenu |
| 5 | **Emoji picker (compose)** | `ChatWindow.tsx` ~L677+ | Popover-like | **Not a menu** — unchanged |
| 6 | **Message right-click menu** | `web/src/components/chat/UnifiedGlobalChat.tsx` | `ContextMenu` candidate | **Migrated** → `ContextMenu` |
| 7 | **Input toolbar `showMenu`** | `UnifiedGlobalChat.tsx` | Dead overflow stub | **Removed** — no menu rendered |
| 8 | **Mobile header options** | `web/src/components/MobileChat.tsx` | `DropdownMenu` candidate | **Migrated** → `DropdownMenu` |
| 9 | **MoreVertical collapse** | `web/src/app/chat/ChatLeftPanel.tsx` | Panel toggle | **Not a menu** — unchanged |
| 10 | **MoreHorizontal stub** | `web/src/components/chat/ChatSidebar.tsx` | Stub | **Not a menu** — documented exception |
| 11 | **MoreVertical stub** | `web/src/components/chat/enterprise/EnhancedChatModule.tsx` | Stub | **Removed** (3A-3.5 parity) |
| 12 | **UserAutocomplete** | `web/src/app/chat/UserAutocomplete.tsx` | Autocomplete | **Not a menu** — out of scope |

**Conversation/channel overflow menus (rename, archive, mute, pin, leave):** **None found** in scoped chat files.

---

## 2. Menus Migrated

### Message right-click → `ContextMenu` (×3)

| File | Actions preserved | Removals |
|------|-------------------|----------|
| `ChatMainPanel.tsx` | Reply, Classify (enterprise), Delete | Inline `fixed` shell; document `click` outside-click handler |
| `ChatWindow.tsx` | Reply, React (emoji submenu), Create Task (conditional), Delete | Inline `absolute` shell; separate reaction picker panel |
| `UnifiedGlobalChat.tsx` | Reply, Delete | Inline `absolute` shell |

**Positioning:** All three now use pointer-anchored `anchorPoint={{ x, y }}` from `clientX` / `clientY` on `contextmenu` (platform-standard; replaces mixed `fixed`/`absolute` shells).

### Mobile overflow → `DropdownMenu`

| File | Items | Removals |
|------|-------|----------|
| `MobileChat.tsx` | Search messages, Conversation info | Inline expand panel below header; `showOptions` state |

**Note:** Items remain no-op placeholders (same as pre-migration).

### Hygiene

| File | Change |
|------|--------|
| `UnifiedGlobalChat.tsx` | Removed dead `showMenu` state + `MoreHorizontal` input toolbar button |
| `EnhancedChatModule.tsx` | Removed orphan `MoreVertical` stub button |

---

## 3. ContextMenu / DropdownMenu Adoption

| Primitive | Chat consumers (post-3A-4C) |
|-----------|----------------------------|
| **`ContextMenu`** | `ChatMainPanel.tsx`, `ChatWindow.tsx`, `UnifiedGlobalChat.tsx` |
| **`DropdownMenu`** | `MobileChat.tsx` |
| **`Popover`** | 0 in scoped chat files |

---

## 4. Remaining Chat Menu Exceptions

| Exception | Location | Notes |
|-----------|----------|-------|
| **Quick reactions hover panel** | `ChatMainPanel.tsx` | Emoji strip on hover — not an action menu; Popover deferred |
| **Compose emoji picker** | `ChatWindow.tsx`, `MobileChat.tsx` | Emoji grid panels — specialty popovers; not menu shells |
| **ChatSidebar MoreHorizontal** | `ChatSidebar.tsx` | Stub affordance; no rendered menu |
| **ChatLeftPanel MoreVertical** | `ChatLeftPanel.tsx` | Collapses panel; not a menu |
| **Conversation/channel menus** | — | Not implemented in scoped surfaces |

---

## 5. Validation Summary

| Check | Result |
|-------|--------|
| `pnpm type-check` | **Passed** (2026-06-03) |
| Inline action/context menu shells in scoped chat files | **0** |
| Document outside-click handlers for migrated menus | **0** (inherited from primitives) |
| Chat APIs / realtime / permissions | **Unchanged** |

---

## 6. Manual QA

**Status:** **PENDING**

### Messages (desktop)
- [ ] Right-click message → context menu (ChatMainPanel, ChatWindow, UnifiedGlobalChat)
- [ ] Reply, delete
- [ ] Classify (enterprise) on ChatMainPanel
- [ ] React submenu on ChatWindow
- [ ] Create Task on ChatWindow (when handler present)
- [ ] Escape / outside-click dismiss
- [ ] Dark mode

### Mobile
- [ ] Header overflow menu opens
- [ ] Search messages / Conversation info visible
- [ ] Dismiss on outside tap / Escape

---

## 7. Certification

**Chat menu rollout (3A-4C):** **Ready for sign-off** pending manual QA.

**Recommended next domain:** **Todo** (`TaskDetail.tsx` / `TaskItem.tsx` overflow) per 3A-4 platform rollout order — **not** Calendar, Admin/Governance, or Accessibility Wave.

---

**Last updated:** 2026-06-03 (3A-4C ACT closeout)
