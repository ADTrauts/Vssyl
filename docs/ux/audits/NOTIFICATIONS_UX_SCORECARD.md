# Notifications Module UX Scorecard (Wave 5C)

**Status:** Re-certified (Wave 5C.2)  
**Date:** 2026-06-03  
**Module:** Notifications (`/notifications`, settings sub-route)  
**Benchmark:** Drive / File Hub — Reference UX Module #1  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md) (Wave 5A)  
**Evidence:** Static code audit — `web/src/app/notifications/*`; wave closeouts 3A-4B, 3C-6

---

## Scope reviewed

| Area | Paths |
|------|-------|
| Primary route | `web/src/app/notifications/page.tsx` |
| Settings | `web/src/app/notifications/settings/page.tsx` |
| Layout | `web/src/app/notifications/layout.tsx` → `DashboardLayout` / `PlatformShell` |
| Components | Inline: `NotificationActionsMenu`, `NotificationQuickActions`, `EmptyState` |

**Prior waves:** 3A-4B menu rollout, 3C-6 layout consolidation (`PageHeader`, `PageToolbar`).

---

## Rating scale

| Rating | Meaning |
|--------|--------|
| **PASS** | Meets standard for target level |
| **PASS WITH FINDINGS** | Meets bar with documented exceptions |
| **FAIL** | Blocks certification at target level |

---

## Category results (5C.2 authoritative)

| # | Category | Rating | Rationale |
|---|----------|--------|-----------|
| 1 | **Interaction Consistency** | **PASS** | Per-row + bulk delete on `ConfirmModal` (5C.1). Archive/snooze/mark-read immediate (acceptable). Zero native dialogs. |
| 2 | **Layout Consistency** | **PASS** | Management archetype: `PageHeader` + `PageToolbar` (3C-6). Fits `PlatformShell` via `DashboardLayout`. Settings sub-route retains own chrome (N-3). |
| 3 | **Navigation** | **PASS** | `/notifications` + `/notifications/settings`. Category sidebar. Cross-module deep links. Global bell entry. |
| 4 | **Accessibility** | **PASS WITH FINDINGS** | Keyboard j/k/Space/Enter/Escape. **Findings:** Row overflow lacks `aria-label` (N-7); no human WCAG audit (N-6). |
| 5 | **Mobile** | **PASS WITH FINDINGS** | Responsive flex; scrollable list. **Findings:** Fixed `w-64` sidebar may crowd 375px (N-5); manual QA not signed (N-6). |
| 6 | **Cross-Module Integration** | **PASS** | Rich routing to chat/drive/place/business/AI; socket realtime; metadata quick actions. |
| 7 | **Error Handling** | **PASS WITH FINDINGS** | Settings uses `toast`; main feed errors often `console.error` only (N-2). |
| 8 | **Empty States** | **PASS WITH FINDINGS** | Category-specific local `EmptyState`. Not shared primitive (N-4). |
| 9 | **Loading States** | **PASS** | Initial spinner; load-more pagination. |
| 10 | **Discoverability** | **PASS** | Header actions, toolbar filters, view toggles, selection mode, category counts. |
| 11 | **Workflow Completion** | **PASS** | Core flows completable post N-1 fix. N-8 grouped-view affordance is P3 — not a dead-end. |

---

## Interaction inventory (5C.1)

| Surface / action | Implementation | ConfirmModal? | Notes |
|------------------|----------------|---------------|-------|
| **Notification list** | List view with filters | — | Primary feed |
| **Grouped view** | `viewMode === 'grouped'` | — | Expand/collapse groups |
| **Compact view** | N/A | — | Not shipped (list + grouped only) |
| **Category navigation** | Left sidebar `w-64` | — | Module categories + counts |
| **Selection mode** | Toolbar Select → checkboxes | — | Bulk bar replaces trailing toolbar |
| **Bulk mark read** | `handleBulkMarkAsRead` | ❌ | Immediate — acceptable |
| **Bulk archive** | `handleBulkArchive` | ❌ | Immediate — soft hide |
| **Bulk delete** | `requestBulkDelete` → `executeBulkDelete` | ✅ *(5C.1)* | Gated — was immediate pre-5C.1 (N-1) |
| **Bulk snooze (1d)** | Toolbar button | ❌ | Immediate — acceptable |
| **Per-item mark read** | Menu + inline button | ❌ | Immediate |
| **Per-item archive** | `DropdownMenu` | ❌ | Immediate |
| **Per-item delete** | `DropdownMenu` → `ConfirmModal` | ✅ | Platform standard |
| **Snooze 1h/1d/1w** | `DropdownMenu` flat group | ❌ | Immediate |
| **Unsnooze** | Menu when snoozed | ❌ | Immediate |
| **Settings access** | `PageHeader` → `/notifications/settings` | — | Working |
| **View toggles** | List / Grouped icons in toolbar | — | Working |
| **Quick actions** | `NotificationQuickActions` (approve/reject/view/reply) | ❌ | Metadata-driven; non-delete |
| **Group archive** | Group header bar | ❌ | Bulk archive for group ids |
| **Keyboard shortcuts** | j/k/Space/Enter/Escape | — | Implemented |

**Native dialogs:** `confirm()` / `prompt()` — **0** in `notifications/*`.

---

## Destructive action audit (5C.3)

| Action | ConfirmModal? | vs Drive #1 | Assessment |
|--------|---------------|-------------|------------|
| Delete (per item) | ✅ | Matches `requestMoveToTrash` gate pattern | **Safe** |
| Delete (bulk) | ✅ *(5C.1)* | Drive `requestBulkMoveToTrash` uses confirm | **Resolved** (was N-1) |
| Archive (per/bulk/group) | ❌ | Drive has no direct archive analog; hide action | **Acceptable** — reversible inbox hide |
| Snooze (per/bulk) | ❌ | N/A on Drive | **Acceptable** — temporal hide |

---

## Layout & menu compliance (5C.4)

| Check | Status | Evidence |
|-------|--------|----------|
| `PageHeader` | ✅ | 3C-6 adoption |
| `PageToolbar` | ✅ | leading/trailing/secondary slots |
| `DropdownMenu` | ✅ | `NotificationActionsMenu` (3A-4B) |
| `PlatformShell` integration | ✅ | Via `DashboardLayout`; no double chrome |
| `WorkspaceSplitLayout` | N/A | Management page — correct archetype |
| Token / dark mode | ✅ | `dark:` classes throughout |
| Settings `PageHeader` | ❌ | Own header pattern (N-3) |

**Deviations vs Drive/Chat:** Uses management pattern (not workspace split) — **by design** per [`LAYOUT_SHELL_STANDARDIZATION_REVIEW.md`](../LAYOUT_SHELL_STANDARDIZATION_REVIEW.md).

---

## Level awards (5C.2)

| Level | Decision |
|-------|----------|
| **UX-L1** | **Certified with Findings** |
| **UX-L2** | **Certified with Findings** (9/11 PASS) |
| **UX-L3** | **Not certified** |
| **Reference UX slot** | **Not eligible** |

### Threshold detail

| Target | Result |
|--------|--------|
| L1 CwF | ✅ 9 PASS; 4 PWF; no L1 blockers |
| L1 Certified (8 PASS, <3 PWF) | ❌ 4 PWF triggers CwF |
| L2 CwF (≥9 PASS) | ✅ 9 PASS; 4 PWF documented |
| L3 | ❌ Core quartet cat 4 PWF + QA (N-6) |

---

## Open findings

| ID | Finding | Severity |
|----|---------|----------|
| N-1 | Bulk delete lacks `ConfirmModal` | **Resolved** (5C.1) |
| N-2 | Main page API errors often `console.error` only | P2 |
| N-3 | Settings page not on `PageHeader` (3C-6 deferred) | P3 |
| N-4 | Local `EmptyState` vs shared primitive | P3 |
| N-5 | Fixed sidebar width — mobile crowding | P2 |
| N-6 | Manual QA matrix not executed (3A-4B, 3C-6) | Process |
| N-7 | Row overflow trigger lacks `aria-label` | P3 |
| N-8 | Grouped view: no per-notification delete in collapsed rows | P3 |

---

## Summary metrics

| Metric | Wave 5C | Wave 5C.2 |
|--------|---------|------------|
| PASS | 7 | **9** |
| PASS WITH FINDINGS | 4 | **4** |
| FAIL | 0 | **0** |

---

## Related

- [`NOTIFICATIONS_UX_CERTIFICATION.md`](./NOTIFICATIONS_UX_CERTIFICATION.md)
- [`NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md`](./NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md)
- [`NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md`](./NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md)
- [`REFERENCE_MODULE_DRIVE.md`](./REFERENCE_MODULE_DRIVE.md)

## Wave history

| Wave | Outcome |
|------|---------|
| 5C | Initial audit — 7 PASS / 4 PWF; UX-L1 CwF |
| 5C.1 | N-1 resolved — [`NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md`](./NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md) |
| 5C.2 | Re-cert — 9 PASS / 4 PWF; UX-L2 CwF — [`NOTIFICATIONS_UX_RECERTIFICATION_2026.md`](./NOTIFICATIONS_UX_RECERTIFICATION_2026.md) |

**Last updated:** 2026-06-03 (Wave 5C.2 re-certification)
