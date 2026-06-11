# Notifications Interaction Safety — Wave 5C.1 Closeout

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Implementation (interaction safety only)  
**Benchmark:** Drive Reference UX #1 — `requestBulkMoveToTrash` → `ConfirmModal`  
**Prior audit:** [`NOTIFICATIONS_UX_CERTIFICATION.md`](./NOTIFICATIONS_UX_CERTIFICATION.md) (Wave 5C)

---

## 1. Objective

Resolve Wave 5C P1 finding **N-1** by gating bulk delete behind shared `ConfirmModal`, matching per-item delete (`NotificationActionsMenu`) and Drive / Chat 5B.1 interaction standards.

**In scope:** 5C.1A bulk delete parity  
**Out of scope:** Layout, menus, Drive, Chat, Calendar, AI, Todo, re-certification, settings `PageHeader`, error toasts (N-2)

---

## 2. Pre-change bulk-action inventory (documented before code change)

| Action | Single item? | Bulk? | Destructive? | ConfirmModal? | Pre-5C.1 behavior |
|--------|--------------|-------|--------------|---------------|-------------------|
| Delete | ✅ | — | ✅ | ✅ | Menu → `pendingNotificationToDelete` → `ConfirmModal` → `onDelete` |
| Archive | ✅ | — | ❌ (soft hide) | ❌ | Immediate `archiveNotification` |
| Mark read | ✅ | — | ❌ | ❌ | Immediate `markAsRead` |
| Snooze | ✅ | — | ❌ (temporal hide) | ❌ | Immediate `snoozeNotification` |
| Bulk delete | — | ✅ | ✅ | ❌ | **`handleBulkDelete` immediate `deleteMultipleNotifications`** — **unsafe** |
| Bulk archive | — | ✅ | ❌ | ❌ | Immediate `archiveMultipleNotifications` |
| Bulk mark read | — | ✅ | ❌ | ❌ | Immediate `Promise.all(markAsRead)` |
| Bulk snooze (1d) | — | ✅ | ❌ | ❌ | Immediate inline toolbar handler |

**Native dialogs:** `confirm()` / `prompt()` — **0** in `notifications/*` (pre and post).

---

## 3. Post-change bulk-action matrix

| Action | Single item? | Bulk? | Destructive? | ConfirmModal? | Post-5C.1 behavior |
|--------|--------------|-------|--------------|---------------|---------------------|
| Delete | ✅ | — | ✅ | ✅ | Unchanged — `NotificationActionsMenu` gate |
| Archive | ✅ | — | ❌ | ❌ | Unchanged — immediate |
| Mark read | ✅ | — | ❌ | ❌ | Unchanged — immediate |
| Snooze | ✅ | — | ❌ | ❌ | Unchanged — immediate |
| Bulk delete | — | ✅ | ✅ | ✅ | **`requestBulkDelete` → `pendingBulkDelete` → `ConfirmModal` → `executeBulkDelete`** |
| Bulk archive | — | ✅ | ❌ | ❌ | Unchanged — immediate (acceptable) |
| Bulk mark read | — | ✅ | ❌ | ❌ | Unchanged — immediate (acceptable) |
| Bulk snooze (1d) | — | ✅ | ❌ | ❌ | Unchanged — immediate (acceptable) |

**Cancel / Escape / backdrop:** `ConfirmModal` `onClose` clears `pendingBulkDelete` with **no mutation**; selection state preserved.

**No direct delete from toolbar click:** Delete button calls `requestBulkDelete` only.

---

## 4. Sub-wave deliverables

### 5C.1A — Bulk delete parity ✅

| File | Change |
|------|--------|
| `web/src/app/notifications/page.tsx` | Added `pendingBulkDelete` / `isBulkDeleting` state; `requestBulkDelete` + `executeBulkDelete`; page-level `ConfirmModal`; toolbar Delete → `requestBulkDelete` |

**Preserved:** Selection state on cancel; bulk API call; list filter update; selection mode exit on confirm; loading on confirm; error `console.error` path; per-item delete unchanged.

---

## 5. Files modified

| File | Summary |
|------|---------|
| `web/src/app/notifications/page.tsx` | Bulk delete `ConfirmModal` gate (5C.1A) |

**Unchanged:** `NotificationActionsMenu` per-item `ConfirmModal`; settings route; layout shell.

---

## 6. ConfirmModal integrations

| Surface | Trigger | Pending state | Execute | Modal copy |
|---------|---------|---------------|---------|------------|
| Per-item delete | `DropdownMenu` Delete | `pendingNotificationToDelete` (id) | `executeDeleteNotification` | "Delete notification?" |
| **Bulk delete (new)** | Toolbar Delete in selection mode | `pendingBulkDelete` (boolean) | `executeBulkDelete` | "Delete notifications?" + count |

Pattern mirrors Drive `requestBulkMoveToTrash` and Chat 5B.1 `requestDeleteMessage`.

---

## 7. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** (2026-06-03) |
| Bulk delete → `ConfirmModal` | ✅ `requestBulkDelete` opens modal |
| Cancel → no mutation | ✅ `onClose` clears pending only |
| Escape / backdrop → no mutation | ✅ Shared `ConfirmModal` contract |
| Single-item delete unchanged | ✅ `NotificationActionsMenu` untouched |
| Native `confirm()` / `prompt()` | **0** |

**Manual QA:** Not executed (N-6 remains open).

---

## 8. Findings resolved / remaining

### Resolved (5C.1)

| ID | Finding | Status |
|----|---------|--------|
| N-1 | Bulk delete lacks `ConfirmModal` | **Resolved** |

### Remaining (not 5C.1)

| ID | Finding | Blocks L2/L3? |
|----|---------|---------------|
| N-2 | Main page API errors often `console.error` only | No |
| N-3 | Settings page not on `PageHeader` | No |
| N-4 | Local `EmptyState` vs shared primitive | No |
| N-5 | Fixed sidebar width on mobile | No |
| N-6 | Manual QA matrix not executed | L3 / process |
| N-7 | Row overflow lacks `aria-label` | No |
| N-8 | Grouped view limited delete affordances | No |

---

## 9. UX-L2 outlook (projected — not re-certified)

| Metric | Pre-5C.1 (5C audit) | Post-5C.1 (projected) |
|--------|---------------------|------------------------|
| PASS categories | 7 | **9** (cats 1, 11 upgrade) |
| PWF categories | 4 | **2** (4, 5 or 7, 8) |
| N-1 | Open | **Resolved** |
| L2 threshold (≥9 PASS) | ❌ | **Likely met** on static re-score |
| Official L2 award | Not certified | **Pending re-certification** |

**Interaction Consistency (cat 1):** Projected **PASS** — all destructive delete paths now confirmed.  
**Workflow Completion (cat 11):** Projected **PASS** — bulk delete confirm gap closed.

**L3 still blocked by:** N-6 manual QA; core quartet PWF (accessibility cat 4).

---

## 10. Readiness for re-certification

**Interaction safety:** **Ready** — bulk and per-item delete align with Drive #1 and Chat 5B.1.

**Recommended next step:** Notifications UX re-certification (documentation-only) after stakeholder sign-off; or proceed with Todo certification (5D) in parallel.

**Do not re-certify in 5C.1** — per wave charter.

---

## Related

- [`NOTIFICATIONS_UX_SCORECARD.md`](./NOTIFICATIONS_UX_SCORECARD.md)
- [`NOTIFICATIONS_UX_CERTIFICATION.md`](./NOTIFICATIONS_UX_CERTIFICATION.md)
- [`CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md`](./CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md)
- [`REFERENCE_MODULE_DRIVE.md`](./REFERENCE_MODULE_DRIVE.md)

**Last updated:** 2026-06-03 (Wave 5C.1 ACT closeout)
