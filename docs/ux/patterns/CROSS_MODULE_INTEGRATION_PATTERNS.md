# Cross-Module Integration UX Patterns (Platform Standard)

**Status:** Wave 6A — extracted from Reference UX #1–#5  
**Authority:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md)

---

## UX-PAT-XMOD-001 — Global Trash integration

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | Todo #3, Calendar #5, AI #4 |
| **Pattern ID** | `UX-PAT-XMOD-001` |

### Purpose

User deletes set `trashedAt`; module registers `*TrashService` + global trash handler; UI uses confirm gates.

### When to use

- All modules with `trash: true` in manifest

### Required components

- `registerGlobalTrashHandlers` entry
- `trashItem()` client path after confirm
- List queries exclude `trashedAt != null`

### Reference implementations

| Module | Entity |
|--------|--------|
| Drive #1 | files/folders |
| Todo #3 | tasks |
| Calendar #5 | events |
| AI #4 | `ai_conversation` |

---

## UX-PAT-XMOD-002 — Notification feed integration

| Field | Value |
|-------|-------|
| **Primary reference** | Notifications #2 |
| **Secondary references** | All modules with `notifications[]` manifest |
| **Pattern ID** | `UX-PAT-XMOD-002` |

### Purpose

Modules emit `[module]_[event]` types; Notifications renders rows with metadata-driven quick actions and deep links.

### When to use

- Any module sending user notifications

### Required components

- Manifest `notifications` metadata per [`NOTIFICATION_METADATA_GUIDE.md`](../../guides/NOTIFICATION_METADATA_GUIDE.md)
- `NotificationService.createNotification` server-side
- Types registered in `web/src/app/notifications/page.tsx`

### See also

**UX-PAT-NAV-002**

---

## UX-PAT-XMOD-003 — Drive attachment bridge

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | Todo #3, AI #4, Calendar #5 (ICS) |
| **Pattern ID** | `UX-PAT-XMOD-003` |

### Purpose

Non-Drive modules link or attach Drive files via integration services — not by duplicating storage UI.

### When to use

- Task attachments, AI composer uploads, calendar ICS import

### Reference implementations

| Module | Pattern |
|--------|---------|
| Todo #3 | `todoIntegrationLinkService` |
| AI #4 | `AIFileUpload` |
| Calendar #5 | ICS in `EventDrawer` |

---

## UX-PAT-XMOD-004 — Calendar bridge (read surface)

| Field | Value |
|-------|-------|
| **Primary reference** | Todo #3 |
| **Secondary references** | Calendar #5 |
| **Pattern ID** | `UX-PAT-XMOD-004` |

### Purpose

Server-side calendar bridge surfaces due dates / events in non-calendar module UI.

### When to use

- Todo calendar view; cross-module scheduling displays

### Reference implementations

| Module | Service |
|--------|---------|
| Todo #3 | `todoCalendarBridgeService` |

---

## UX-PAT-XMOD-005 — Realtime (tenant-scoped)

| Field | Value |
|-------|-------|
| **Primary reference** | Notifications #2 |
| **Secondary references** | Chat arch #2, Calendar #5 |
| **Pattern ID** | `UX-PAT-XMOD-005` |

### Purpose

Socket room membership proven before join/emit; no cross-tenant leakage.

### When to use

- Grouped notification refresh, calendar rooms, chat (architecture)

### Reference implementations

| Module | Pattern |
|--------|---------|
| Notifications #2 | Grouped view socket refresh after membership check |

---

## UX-PAT-XMOD-006 — Error surfacing (toast)

| Field | Value |
|-------|-------|
| **Primary reference** | Notifications #2 |
| **Secondary references** | AI #4, Todo #3, Calendar #5 |
| **Pattern ID** | `UX-PAT-XMOD-006` |

### Purpose

Failed API actions show `toast.error` or inline banner — not silent `console.error` only on primary paths.

### When to use

- User-initiated mutations and feed loads

### Reference implementations

| Module | Pattern |
|--------|---------|
| Notifications #2 | `showNotificationActionError()` (5G N-2) |
| AI #4 | `toast.error` on twin, upload, trash |

---

## UX-PAT-XMOD-007 — Feed / inbox selection mode

| Field | Value |
|-------|-------|
| **Primary reference** | Notifications #2 |
| **Secondary references** | Drive #1 (bulk select) |
| **Pattern ID** | `UX-PAT-XMOD-007` |

### Purpose

Toolbar “Select” mode enables bulk action bar with confirm-gated deletes.

### When to use

- Inbox feeds, file grids with multi-select

### Reference implementations

| Module | Pattern |
|--------|---------|
| Notifications #2 | Selection toolbar + bulk delete |
| Drive #1 | Bulk move to trash |

---

## UX-PAT-XMOD-008 — Scheduling-specific integration (conflict, recurrence, ICS)

| Field | Value |
|-------|-------|
| **Primary reference** | Calendar #5 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-XMOD-008` |

### Purpose

Scheduling modules integrate reminders, ICS import, recurrence scope, and conflict detection in drawer UX.

### Reference implementations

| Module | Patterns |
|--------|----------|
| Calendar #5 | `calendarReminderService`, ICS import, **UX-PAT-DES-006/007** |

---

## UX-PAT-XMOD-009 — V_Link / platform entity (UX touchpoints)

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | Calendar #5, Todo #3 |
| **Pattern ID** | `UX-PAT-XMOD-009` |

### Purpose

User-facing “Add to V_Link” / link surfaces follow conservative single-entity patterns from File Hub.

### When to use

- Modules with `vlink: true` and drawer link affordances

### Reference implementations

| Module | Pattern |
|--------|---------|
| Calendar #5 | Event drawer V_Link |
| Drive #1 | Share/link flows |

---

## Related

- [`NAVIGATION_PATTERNS.md`](./NAVIGATION_PATTERNS.md)
- [`CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md`](./CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md)

**Last updated:** 2026-06-03 (Wave 6A)
