# AI Menu Rollout Closeout (Wave 3A-4A)

**Status:** Closed — **PASS WITH FINDINGS**  
**Date:** 2026-06-03  
**Prerequisite:** Drive Reference Menu Certification — [`DRIVE_MENU_REFERENCE_CLOSEOUT.md`](./DRIVE_MENU_REFERENCE_CLOSEOUT.md)  
**Reference patterns:** [`DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md`](../DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md)

---

## 1. Executive Summary

First multi-file platform rollout using certified menu primitives. All **active** AI conversation overflow menus and picker dropdowns in scope now use shared **`DropdownMenu`**.

| Surface | File | Primitive | Result |
|---------|------|-----------|--------|
| Conversation overflow (sidebar) | `ai-chat/page.tsx` | `DropdownMenu` | **Done** |
| Conversation overflow (header) | `ai-chat/page.tsx` | `DropdownMenu` | **Done** |
| Conversation overflow (dropdown) | `AIChatDropdown.tsx` | `DropdownMenu` | **Done** |
| Provider picker | `AIServicePicker.tsx` | `DropdownMenu` | **Done** |
| Model picker | `AIModelPicker.tsx` | `DropdownMenu` | **Done** |
| Provider + model picker | `AIProviderModelPicker.tsx` | `DropdownMenu` | **Done** |
| Search results panel | `DriveSearch.tsx` | — | **Out of scope** (Drive orphan) |

---

## 2. Menus Migrated

### Conversation action menus (5 items each)

Share, Rename, Pin/Unpin, Archive/Unarchive, Delete (`destructive: true` → `ConfirmModal` / trash flow unchanged).

**Locations:**
- Pinned conversation rows (`ai-chat/page.tsx`)
- Regular conversation rows (`ai-chat/page.tsx`)
- Active conversation header more menu (`ai-chat/page.tsx`)
- History list in header dropdown (`AIChatDropdown.tsx`)

**Removals:** Inline `absolute` menu shells; `menuRefs`; document `mousedown` outside-click handlers for conversation menus.

### Picker menus

| Picker | Items | Notes |
|--------|-------|-------|
| `AIServicePicker` | Auto, OpenAI, Anthropic | Icons preserved |
| `AIModelPicker` | Per-provider model list | Auto/static states unchanged |
| `AIProviderModelPicker` | Auto + grouped OpenAI/Anthropic models | Two-column hover panel → flat grouped menu with `heading` / `divider` |

---

## 3. Remaining AI Menu Exceptions

| Exception | Location | Notes |
|-----------|----------|-------|
| **AIChatDropdown shell** | `AIChatDropdown.tsx` | Full chat panel via `createPortal` — not an action menu; outside-click closes panel (correct) |
| **DriveSearch** | `web/src/components/DriveSearch.tsx` | Orphan; documented in Drive closeout; not AI scope |
| **Admin AI console** | Out of 3A-4A scope | Deferred to later wave |
| **AvatarContextMenu** | Platform header | **3A-4B+** |

---

## 4. Validation Summary

| Check | Result |
|-------|--------|
| `pnpm type-check` | **Passed** (2026-06-03) |
| Inline action menu shells in scoped files | **0** |
| `menuRefs` / picker `dropdownRef` in scoped files | **0** |
| ConfirmModal trash integration | **Unchanged** |
| AI provider/model state handlers | **Unchanged** |

---

## 5. Manual QA

**Status:** **PENDING**

### Conversations
- [ ] Sidebar conversation overflow (pinned + regular)
- [ ] Header more menu on active conversation
- [ ] AIChatDropdown history overflow
- [ ] Rename, pin, archive, share, delete → ConfirmModal
- [ ] Escape / outside-click dismiss
- [ ] Dark mode

### Pickers
- [ ] Provider/model selection in chat header
- [ ] Provider/model selection in AIChatDropdown
- [ ] Auto / OpenAI / Anthropic switching
- [ ] Vision warning still displays when applicable

---

## 6. Certification

**AI menu rollout (3A-4A):** **Ready for sign-off** pending manual QA.

Patterns established for **3A-4B+** platform rollout:
- `build*MenuItems()` local helpers
- Controlled `open` / `onOpenChange` per menu instance
- `destructive: true` + `divider` before delete
- No inline `absolute`/`fixed` action menu shells

---

## 7. Recommended Next Domain

**Wave 3A-4B — Notifications** (`notifications/page.tsx`) or **AvatarContextMenu** (header profile menu) — both are high-visibility platform surfaces with duplicate inline menu patterns per 3A-0 inventory.

---

## Related

- [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](../CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03
