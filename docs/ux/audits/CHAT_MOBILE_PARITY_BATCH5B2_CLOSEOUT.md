# Chat Mobile Parity — Wave 5B.2 Closeout

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Implementation (mobile parity only)  
**Prior wave:** [`CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md`](./CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md)  
**Scope:** `web/src/components/MobileChat.tsx` only

---

## 1. Objective

Resolve certification finding **C-4** (mobile delete / overflow menu stubs) by removing dead affordances and aligning `MobileChat` message actions with existing desktop/chat infrastructure — **no new features**.

---

## 2. Mobile action inventory (pre-5B.2)

| Action | Surface | Pre behavior | Implemented? | Stub? | Desktop equivalent |
|--------|---------|--------------|--------------|-------|-------------------|
| **Delete** | Message | Absent | ❌ | — | `ChatMainPanel` / `ChatWindow` context menu → `ConfirmModal` |
| **Reply** | Message | Absent | ❌ | — | Context menu + reply banner (`ChatMainPanel`, `ChatWindow`) |
| **React** | Message | Absent | ❌ | — | `ChatWindow` context submenu; `ChatMainPanel` hover quick reactions |
| **Archive** | — | Not exposed | ❌ | — | Not in scoped desktop UI |
| **Pin** | — | Not exposed | ❌ | — | Not in scoped desktop UI |
| **Mute** | — | Not exposed | ❌ | — | Not in scoped desktop UI |
| **Search messages** | Header overflow | Menu item, no `onClick` | ❌ | ✅ | `ChatMainPanel` search stub (out of scope) |
| **Conversation info** | Header overflow | Menu item, no `onClick` | ❌ | ✅ | `ChatRightPanel` details (desktop only) |
| **Phone call** | Header button | No handler | ❌ | ✅ | Not on desktop chat |
| **Video call** | Header button | No handler | ❌ | ✅ | Not on desktop chat |
| **Attach file** | Input toolbar | No handler | ❌ | ✅ | `ChatMainPanel` attach (desktop) — not wired on mobile |
| **Overflow menu** | Header | `DropdownMenu` with stubs | Partial | ✅ | N/A |
| **Long-press / context menu** | Message | Absent | ❌ | — | `ContextMenu` on `ChatMainPanel` / `ChatWindow` |
| **Compose emoji** | Input | Working grid | ✅ | ❌ | Certified specialty popover (3A-4C) |
| **Send** | Input | Working | ✅ | ❌ | Same |

---

## 3. Post-5B.2 mobile action inventory

| Action | Surface | Post behavior | Implemented? | Desktop equivalent |
|--------|---------|---------------|--------------|-------------------|
| **Delete** | Message long-press menu | `requestDeleteMessage` → `ConfirmModal` → `trashItem` | ✅ | Same as 5B.1 desktop gate |
| **Reply** | Message long-press menu | Sets `replyToMessage`; banner; `replyToId` on send | ✅ | `ChatWindow` / `ChatMainPanel` |
| **React** | Message long-press submenu | `chatAPI.addReaction` + reload | ✅ | `ChatWindow` React submenu |
| **Reaction display** | Message bubble | Grouped emoji chips | ✅ | `ChatMainPanel` grouped reactions |
| **Search messages** | — | **Removed** (stub) | — | Still stub on desktop (out of scope) |
| **Conversation info** | — | **Removed** (stub) | — | Desktop right panel only |
| **Phone / Video** | — | **Removed** (stubs) | — | Not on desktop |
| **Attach file** | — | **Removed** (stub) | — | Desktop only today |
| **Header overflow** | — | **Removed** (no valid items) | — | — |
| **Compose emoji** | Input | Unchanged | ✅ | Same |
| **Send** | Input | Unchanged + reply support | ✅ | Same |

**Long-press:** `onContextMenu` on message rows (mobile browsers fire on long-press where supported; same primitive as desktop `ContextMenu`).

---

## 4. Sub-wave deliverables

### 5B.2A — Overflow menu audit ✅

| Item | Decision |
|------|----------|
| Search messages | **Removed** — desktop search not implemented; no feature to connect |
| Conversation info | **Removed** — no mobile details surface exists |
| Phone / Video header buttons | **Removed** — dead stubs, not on desktop chat |
| Entire `DropdownMenu` | **Removed** — zero non-stub items remained |

### 5B.2B — Delete parity ✅

| Check | Result |
|-------|--------|
| Delete affordance | ✅ Message `ContextMenu` → Delete |
| `ConfirmModal` gate | ✅ Same contract as `ChatMainPanel` (5B.1) |
| `useGlobalTrash` / soft-delete | ✅ |
| Native `confirm()` | ❌ none |

### 5B.2C — Message action parity ✅

| Parity item | Status | Notes |
|-------------|--------|-------|
| Reply | ✅ | Existing `chatAPI.sendMessage` `replyToId` param |
| Delete | ✅ | 5B.1 pattern |
| React | ✅ | Existing `chatAPI.addReaction` |
| Create Task | ❌ Not added | `ChatWindow`-only when handler wired; no mobile infra |
| Enterprise classify | ❌ Not added | Enterprise-only desktop path |
| Drag-to-trash | ❌ Not added | Desktop HTML5 + `GlobalTrashBin`; poor mobile UX |

### 5B.2D — Certification evidence update ✅

See updated [`CHAT_UX_SCORECARD.md`](./CHAT_UX_SCORECARD.md) and [`CHAT_UX_CERTIFICATION.md`](./CHAT_UX_CERTIFICATION.md). **No level award** in this wave.

---

## 5. Files modified

| File | Change |
|------|--------|
| `web/src/components/MobileChat.tsx` | Parity implementation + stub removal |

**Desktop / widget chat:** Unchanged (5B.2 scope).

---

## 6. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** (2026-06-03) |
| No dead mobile menu items | ✅ Overflow menu removed |
| No placeholder header/input actions | ✅ Phone/Video/attach/search/info removed |
| Delete → `ConfirmModal` | ✅ |
| Desktop chat unchanged | ✅ No edits outside `MobileChat.tsx` |

**Manual QA (C-8):** Still pending — 375px long-press matrix not executed.

---

## 7. Findings status

| ID | Finding | 5B.2 status |
|----|---------|-------------|
| **C-4** | Mobile delete / overflow stubs | **Resolved** |
| C-5 | Message search | Open (out of scope) |
| C-6 | Pin / archive / mute / leave | Open (future wave) |
| C-7 | `ChatPopup.tsx` absent | Open (doc) |
| C-8 | Manual QA matrix | Open (process) |
| C-9 | `ChatWorkspaceLanding` | Open (P3) |

---

## 8. Readiness for Chat re-certification

**Interaction safety:** Desktop (5B.1) + mobile (5B.2) delete paths now share `ConfirmModal` + global trash.

**Re-certification prerequisites:**

1. Execute manual QA matrix including mobile long-press actions (C-8).
2. Re-score 11-category scorecard — **Mobile** and **Interaction Consistency** categories expected to improve.
3. Reference UX #2 still requires **UX-L3** bar — formal re-cert wave only; not started here.

**5B.2 complete.** Do not begin 5C or re-certification without explicit authorization.

---

## Related

- [`CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md`](./CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md)
- [`CHAT_UX_CERTIFICATION.md`](./CHAT_UX_CERTIFICATION.md)

**Last updated:** 2026-06-03 (Wave 5B.2 ACT closeout)
