# Notifications Layout Consolidation Closeout (Wave 3C-6)

**Status:** **Done**  
**Date:** 2026-06-03  
**Mode:** Implementation + certification  
**Scope:** Notifications layout only — no PlatformShell, ConfirmModal, or other module migrations

---

## 1. Verdict

**PASS** — Double chrome removed from `/notifications`. First reusable management-page primitives (`PageHeader`, `PageToolbar`) shipped. `pnpm type-check` PASS. Notification handlers, APIs, and UX flows unchanged.

---

## 2. Problem (before)

| Layer | Issue |
|-------|-------|
| **Platform chrome** | `DashboardLayout` → `PlatformShell` (header 64px + L nav + R rail) |
| **Page chrome** | Local `min-h-screen` wrapper + duplicate header bar (`px-6 py-4`) |
| **Height** | `h-[calc(100vh-80px)]` ignored platform geometry |
| **Toolbar** | Filters embedded in ad hoc bordered `div` inside main column |

Result: duplicated headers, inconsistent spacing, management pattern diverging from shell standards.

---

## 3. Inventory (Phase 1)

| Region | Before | Classification |
|--------|--------|----------------|
| Platform header | `PlatformHeader` via `DashboardLayoutInner` | **Keep** — global shell |
| Local page header | Title, unread count, view toggle, bulk/select, mark-all, settings | **Split** → `PageHeader` + `PageToolbar` |
| Toolbar / filters | Search, show-read, time range, priority | **Extract** → `PageToolbar` |
| Category sidebar | Module category nav (256px) | **Notification-specific** — unchanged |
| Bulk actions | Selection mode bar | **Notification logic** — content in `PageToolbar.trailing` |
| Content list | List / grouped views | **Notification-specific** — unchanged |

### Reusable management patterns identified

- Title + description + primary actions row (`PageHeader`)
- Search + filters + view toggles + bulk bar (`PageToolbar`)
- Sidebar nav + main feed (future `ManagementLayout` — **deferred**)

---

## 4. Primitives Created (Phases 2–3)

### `PageHeader`

**Path:** `web/src/components/layouts/PageHeader.tsx`

```tsx
<PageHeader
  title="Notifications"
  description="3 unread notifications"
  icon={<Bell className="h-6 w-6" />}
  actions={<>...</>}
/>
```

| Owns | Does NOT own |
|------|----------------|
| Title (`h1`) | Filters |
| Description / subtitle | Bulk selection state |
| Optional icon slot | View toggles |
| Actions region (responsive stack) | Module business logic |

### `PageToolbar`

**Path:** `web/src/components/layouts/PageToolbar.tsx`

```tsx
<PageToolbar
  leading={<>search + show-read</>}
  trailing={<>view toggle + select/bulk</>}
  secondary={<>time range + priority</>}
/>
```

| Slot | Purpose |
|------|---------|
| `leading` | Search, filter chips, primary filter controls |
| `trailing` | View toggles, bulk actions, select mode |
| `secondary` | Extended filter row (time range, priority, etc.) |

Layout only — no state, no notification-specific logic.

---

## 5. Notifications Adoption (Phase 4)

**File:** `web/src/app/notifications/page.tsx`

| Change | Detail |
|--------|--------|
| Outer wrapper | `min-h-screen` → `flex h-full min-h-0 flex-col` (fits `PlatformShell` main) |
| Page header | `PageHeader` — title, unread count, mark-all, settings |
| Toolbar | `PageToolbar` — search, show-read, view toggle, select/bulk, time/priority filters |
| Body | `flex min-h-0 flex-1` — category sidebar + scrollable list (unchanged behavior) |
| Removed | Standalone header `div`, `h-[calc(100vh-80px)]`, duplicate full-page background |

### Preserved (unchanged)

- Notification loading, selection, bulk archive/delete/mark-read/snooze
- Per-item archive, delete, snooze, quick actions
- Category navigation, filters, view modes (list/grouped)
- Keyboard shortcuts, socket updates, API calls

---

## 6. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| Duplicate page header structure | **Removed** — single `PageHeader` |
| PlatformShell modified | **No** |
| Broken imports | **None** |
| Manual UI QA | **Pending** — verify `/notifications` inside dashboard shell |

---

## 7. Remaining Management-Layout Duplication

| Surface | Notes |
|---------|-------|
| `notifications/settings/page.tsx` | Own page chrome — candidate for `PageHeader` in future wave |
| Settings (`profile/settings`) | Sticky tab nav + forms — `ManagementLayout` deferred |
| Admin portal | Isolated dark shell — certified exception |
| Todo module header | Inline toolbar — candidate for `PageToolbar` |
| Business profile tabs | Management pattern — separate wave |

---

## 8. Recommended Next Wave

**3C-7** — Calendar + HR/Scheduling outer shell cleanup per [`LAYOUT_SHELL_STANDARDIZATION_REVIEW.md`](../LAYOUT_SHELL_STANDARDIZATION_REVIEW.md).

Alternative: **3B** ConfirmModal purge (out of 3C-6 scope).

**Do not start:** `ManagementLayout` full extraction without explicit wave authorization.
