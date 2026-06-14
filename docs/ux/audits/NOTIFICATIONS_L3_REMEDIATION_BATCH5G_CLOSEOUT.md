# Notifications UX-L3 Remediation — Wave 5G Closeout

**Module:** Notifications (`/notifications`)  
**Date:** 2026-06-03  
**Wave:** 5G-Notifications (engineering remediation)  
**Mode:** Engineering only — **no certification review**, **no Reference UX registration**

**Scope:** N-2 (error handling), N-5 (mobile), N-7 (accessibility)

---

## Executive summary

| Finding | Disposition | Category impact |
|---------|-------------|-----------------|
| **N-2** | **Resolved** | Cat **7** Error Handling → projected **PASS** at QA |
| **N-5** | **Resolved** | Cat **5** Mobile → engineering complete; **N-6** QA confirms NTF-09 |
| **N-7** | **Resolved** | Cat **4** Accessibility → aria remediated; **N-6** QA confirms NTF-16 |

**Certification levels unchanged** in this wave. UX-L2 CwF remains authoritative until **5G-Notifications-D** after Part 2B QA.

**Projected scorecard (post-engineering, pre-QA):** **10 PASS / 3 PWF / 0 FAIL** (was 9 / 4 / 0).

---

## N-2 — Error handling

**Status:** **Resolved**

### Problem

Main feed actions surfaced failures via `console.error` only. Settings page already used `toast.error` — feed was inconsistent.

### Remediation

Added `showNotificationActionError()` helper (`react-hot-toast`) in `web/src/app/notifications/page.tsx` and wired user-visible feedback for:

| Action path | Toast message |
|-------------|---------------|
| Load notifications (initial) | Failed to load notifications. Please try again. |
| Load more | Failed to load more notifications. |
| Mark as read (single / bulk / all) | Failed to mark notification(s) as read. |
| Archive (single / bulk / group) | Failed to archive notification(s). |
| Delete (single / bulk) | Failed to delete notification(s). |
| Snooze / unsnooze / bulk snooze | Failed to snooze / unsnooze notifications. |
| Group mark-read | Failed to mark group as read. |
| Quick actions (approve/reject/view/reply) | Failed to complete notification action. |
| Socket group refresh (grouped view) | Failed to refresh notification groups. |

Logging retained as secondary via `console.error` inside the helper.

### Pattern alignment

Matches `web/src/app/notifications/settings/page.tsx` and platform modules (Calendar, Drive, Todo).

---

## N-5 — Mobile

**Status:** **Resolved** (engineering)

### Problem

Category sidebar used fixed `w-64` in a horizontal flex layout with no mobile collapse — crowded ~375px viewports (NTF-09 risk).

### Remediation

Implemented **Calendar 3C-7B mobile sheet pattern** (`CalendarPageShell.tsx`):

- Mobile bar (`md:hidden`) with **Open notification categories** menu trigger and active category label
- Sidebar **hidden below `md`**; opens as fixed left sheet with backdrop + close control
- `Escape` dismisses sheet
- Category selection closes sheet (`closeMobileSidebar`)
- Main feed uses `min-w-0` to prevent horizontal overflow clipping

### Deferred

None — layout change is scoped CSS/state only; no redesign of management archetype.

**QA gate:** Part 2B **NTF-09** must confirm 375px usability.

---

## N-7 — Accessibility

**Status:** **Resolved** (engineering)

### Problem

Icon-only controls lacked accessible names; row overflow trigger had no `aria-label` (NTF-16).

### Remediation

| Control | Attributes added |
|---------|------------------|
| `NotificationActionsMenu` trigger | `Button` + `aria-label="Notification actions"` (Todo `TaskItem` pattern) |
| View mode toggles | `role="group"`, `aria-label="Notification view mode"`, per-button `aria-label` + `aria-pressed` |
| Settings header button | `aria-label="Notification settings"` |
| Mobile category open/close | `aria-label` on menu, backdrop, and close buttons |
| Category nav buttons | `type="button"`, `aria-current="page"` when selected |
| Group expand header | `role="button"`, `tabIndex={0}`, `aria-expanded`, `aria-label`, Enter/Space handler |
| `DropdownMenu` wrapper | Existing `aria-expanded` / `aria-controls` on trigger span (shared 3A-2) |

### Pattern alignment

- Todo 5G: `TaskItem.tsx` `aria-label="Task actions"`
- Calendar 3C-7C: mobile shell aria on open/close
- Shared `DropdownMenu`: `menuLabel="Notification actions"`

**QA gate:** Part 2B **NTF-16** + broader cat 4 matrix (N-6).

---

## Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| Server notification vitest (manifest + services) | **18 passed** (5 files) |
| Web runtime tests (`moduleRegistry`, `workspaceRuntimeHelpers`) | **16 passed** (2 files) |
| Dedicated `notifications/page.tsx` unit tests | **N/A** — none in repo |

---

## Projected scorecard (engineering-only; QA not executed)

| # | Category | Pre-5G | Post-5G (projected) |
|---|----------|--------|---------------------|
| 4 | Accessibility | PWF (N-7, N-6) | **PWF** (N-6 QA only) |
| 5 | Mobile | PWF (N-5, N-6) | **PWF** (N-6 QA only) |
| 7 | Error Handling | PWF (N-2) | **PASS** |
| 8 | Empty States | PWF (N-4) | PWF |

| Metric | Pre-5G | Post-5G (projected) |
|--------|--------|---------------------|
| PASS | 9 | **10** |
| PWF | 4 | **3** |
| FAIL | 0 | 0 |

**L3 CwF threshold (≤2 PWF):** Not met until **N-6** QA upgrades cats 4 and/or 5 and/or N-4 addressed.

---

## Readiness for Part 2B QA execution

| Gate | Status |
|------|--------|
| N-2 engineering | ✅ Ready |
| N-5 engineering | ✅ Ready |
| N-7 engineering | ✅ Ready |
| N-6 manual matrix | ⏳ **Next** — `PLATFORM_MANUAL_QA_MATRIX.md` Part 2B (NTF-01–20) |
| Certification promotion | ❌ Not in scope — await **5G-Notifications-D** |

**Recommendation:** Execute **5G-QA-EXEC Part 2B** on local/staging with evidence folder `docs/ux/audits/qa-evidence/5G-QA/notifications/`.

---

## Files changed

| Path | Change |
|------|--------|
| `web/src/app/notifications/page.tsx` | N-2 toasts, N-5 mobile sheet, N-7 aria |
| `docs/ux/audits/NOTIFICATIONS_UX_SCORECARD.md` | Finding status + projected cats |
| `docs/ux/audits/NOTIFICATIONS_UX_CERTIFICATION.md` | Findings register |
| `docs/ux/UX_MODERNIZATION_ROADMAP.md` | Wave 5G-Notifications entry |
| `memory-bank/activeContext.md` | Wave status |
| `memory-bank/progress.md` | Wave status |

---

## Related

- [`NOTIFICATIONS_UX_L3_READINESS_REVIEW.md`](./NOTIFICATIONS_UX_L3_READINESS_REVIEW.md)
- [`NOTIFICATIONS_UX_SCORECARD.md`](./NOTIFICATIONS_UX_SCORECARD.md)
- [`PLATFORM_MANUAL_QA_MATRIX.md`](../PLATFORM_MANUAL_QA_MATRIX.md) Part 2B
- [`CALENDAR_QA_EXEC_R3_REPORT_2026.md`](./CALENDAR_QA_EXEC_R3_REPORT_2026.md) (QA evidence pattern)

**Last updated:** 2026-06-03 (Wave 5G-Notifications remediation)
