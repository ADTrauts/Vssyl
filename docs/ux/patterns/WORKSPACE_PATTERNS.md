# Workspace UX Patterns (Platform Standard)

**Status:** Wave 6A — extracted from Reference UX #1–#5  
**Authority:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md)  
**Framework:** [`UX_CERTIFICATION_STANDARD.md`](../UX_CERTIFICATION_STANDARD.md) · [`LAYOUT_PATTERNS.md`](../LAYOUT_PATTERNS.md)

---

## Purpose

Define **when and how** product modules adopt workspace shells, layout columns, loading surfaces, and multi-view canvases. These patterns are extracted from registered references — not invented in Wave 6A.

---

## UX-PAT-WS-001 — WorkspaceSplitLayout (file / entity browser)

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | Todo #3, Calendar #5, AI #4 |
| **Pattern ID** | `UX-PAT-WS-001` |

### Purpose

Three-column (or two-column) workspace: optional sidebar \| primary canvas \| optional secondary detail panel.

### When to use

- Browsing, selecting, and acting on a collection of entities (files, tasks, events, conversations)
- Persistent detail or preview in a secondary column
- Business and personal routes that need module-native chrome

### When NOT to use

- Single-feed management pages (use **UX-PAT-WS-010** — Notifications)
- Control-center settings with tabs only (use **UX-PAT-NAV-004** — AI identity)
- Dashboard widget embeds (certified exception surfaces)

### Required components

- `WorkspaceSplitLayout` from `shared/components`
- Sidebar slot (navigation, filters, entity list)
- Main slot (grid, list, board, time-grid, or thread)
- Optional `WorkspaceSecondary` for detail

### Required accessibility

- Sidebar and main regions logically grouped; focus order sidebar → main → secondary
- Collapsible panels must not trap focus

### Required mobile behavior

- Sidebar collapses to sheet pattern (**UX-PAT-MOB-001**) when viewport &lt; `lg`
- Main canvas must not horizontal-trap at 375px

### Reference implementations

| Module | Files |
|--------|-------|
| Drive #1 | `DrivePageContent`, `DriveModule.tsx` |
| Todo #3 | `TodoModule.tsx` |
| Calendar #5 | `CalendarPageShell.tsx` |
| AI #4 | `AIChatPageShell.tsx` |

### Certified exceptions

| Surface | Owner | Rationale |
|---------|-------|-----------|
| `CalendarModule.tsx` widget | Calendar #5 | Embedded grid — not primary shell |
| `EnhancedCalendarModule` | Calendar #5 | Enterprise tier panels |
| Dashboard `AIWidget` | AI #4 | Thin wrapper — not full shell |

---

## UX-PAT-WS-002 — PageHeader + PageToolbar + WorkspaceSplitLayout (modern workspace stack)

| Field | Value |
|-------|-------|
| **Primary reference** | Todo #3 |
| **Secondary references** | Calendar #5, AI #4 |
| **Pattern ID** | `UX-PAT-WS-002` |

### Purpose

Unified management chrome above a workspace split: title, context, and primary actions in header; filters/view controls in toolbar.

### When to use

- New first-party workspace modules post-5D/5H modernization
- Routes that need labeled view toggles, search, or module-level actions

### When NOT to use

- Legacy Drive routes that predate full toolbar (Drive #1 — migrate opportunistically)
- Notifications feed (management page without split — **UX-PAT-WS-010**)

### Required components

- `PageHeader` — module title + optional nav links
- `PageToolbar` — view toggles, filters, primary CTAs
- `WorkspaceSplitLayout` beneath

### Required accessibility

- View mode toggles: `aria-label` per mode (e.g. `List view`, `Board view`)
- Toolbar controls keyboard-reachable

### Required mobile behavior

- Toolbar wraps or collapses; no fixed-width overflow trap
- View toggles remain reachable at 375px

### Reference implementations

| Module | Files |
|--------|-------|
| Todo #3 | `TodoModule.tsx` |
| Calendar #5 | `CalendarPageShell.tsx` |
| AI #4 | `AIChatPageShell.tsx`, `/ai` `PageHeader` |

---

## UX-PAT-WS-003 — WorkspaceSecondary detail panel

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | Todo #3 |
| **Pattern ID** | `UX-PAT-WS-003` |

### Purpose

Persistent detail / inspector column for selected entity without route change.

### When to use

- File metadata, task detail, event preview where context list remains visible

### When NOT to use

- Full-screen editors that replace the canvas
- Mobile-first flows where detail should be a drawer (module-specific)

### Required components

- `WorkspaceSecondary` slot in `WorkspaceSplitLayout`
- Close or back affordance on mobile

### Required mobile behavior

- Todo #3: `shrink min-w-0`; `lg:w-96`; detail usable at 375px (T-7)
- Drive: detail panel scroll independent of main grid

### Reference implementations

| Module | Files |
|--------|-------|
| Drive #1 | Drive details column |
| Todo #3 | `TaskDetail.tsx` |

---

## UX-PAT-WS-004 — Time-grid page shell

| Field | Value |
|-------|-------|
| **Primary reference** | Calendar #5 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-WS-004` |

### Purpose

Scheduling archetype: shared shell across day/week/month/year routes with calendar sidebar and time-grid main.

### When to use

- Any module with time-based grid or agenda views

### When NOT to use

- Todo calendar **embed** inside task module (secondary — Todo #3 calendar view mode)

### Required components

- `CalendarPageShell` + `WorkspaceSplitLayout`
- `PageHeader` + `PageToolbar` with view route quartet
- Calendar list sidebar slot

### Reference implementations

| Module | Files |
|--------|-------|
| Calendar #5 | `CalendarPageShell.tsx`, month/day/week/year routes |

---

## UX-PAT-WS-005 — Multi-view workspace (list / board / calendar)

| Field | Value |
|-------|-------|
| **Primary reference** | Todo #3 |
| **Secondary references** | Drive #1 (grid/list modes) |
| **Pattern ID** | `UX-PAT-WS-005` |

### Purpose

Single module exposing multiple canvases on the same data with toolbar view toggles.

### When to use

- Work-item modules where users switch list, kanban, or calendar lenses

### When NOT to use

- Calendar primary routes (time-grid is the product — **UX-PAT-WS-004**)
- Notifications (feed archetype)

### Required components

- Toolbar view toggles with explicit `aria-label`
- Shared data layer; view-specific presentation components

### Required accessibility

- Each toggle labeled (`List view`, `Board view`, `Calendar view`)

### Reference implementations

| Module | Files |
|--------|-------|
| Todo #3 | `TodoModule.tsx`, `TaskList`, `TaskBoard` |

### Certified exceptions

| Surface | Rationale |
|---------|-----------|
| Todo board compact overflow hidden | T-6 P3 — density trade-off |

---

## UX-PAT-WS-006 — Board view with drag-and-drop

| Field | Value |
|-------|-------|
| **Primary reference** | Todo #3 |
| **Secondary references** | Drive #1 (grid DnD to trash) |
| **Pattern ID** | `UX-PAT-WS-006` |

### Purpose

Column or grid layout with dnd-kit (or equivalent) for status/category moves; trash via global bin with confirm gate.

### When to use

- Kanban-style task or pipeline modules

### Required components

- dnd-kit sensors and collision detection
- Global trash bin integration with **UX-PAT-DES-003**

### Required mobile behavior

- Horizontal scroll for columns without body trap (TODO-14)

### Reference implementations

| Module | Files |
|--------|-------|
| Todo #3 | `TaskBoard.tsx` |

---

## UX-PAT-WS-007 — Loading states (Spinner / overlay / skeleton)

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | Todo #3, Notifications #2, AI #4, Calendar #5 |
| **Pattern ID** | `UX-PAT-WS-007` |

### Purpose

Visible feedback during initial fetch and in-flight mutations.

### When to use

- Every primary data fetch and long-running action

### Required components

- `Spinner`, `LoadingOverlay`, or skeleton from `shared/components`
- Streaming indicators for AI threads (`AIThinkingIndicator` — AI #4)

### When NOT to use

- Silent spinners with no layout placeholder (causes layout shift without feedback)

### Reference implementations

| Module | Pattern |
|--------|---------|
| Drive #1 | `LoadingOverlay`, grid spinners |
| Todo #3 | Initial load spinner (TODO-21) |
| AI #4 | Conversation/message spinners, streaming state |

---

## UX-PAT-WS-008 — Event / entity drawer workflow

| Field | Value |
|-------|-------|
| **Primary reference** | Calendar #5 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-WS-008` |

### Purpose

Side drawer for create/edit of complex entities with multi-field forms and nested confirms.

### When to use

- Calendar events, or any entity needing recurrence/conflict sub-flows

### Required components

- `EventDrawer` (Calendar) or module-equivalent drawer
- Conflict `ConfirmModal` before save when applicable

### Reference implementations

| Module | Files |
|--------|-------|
| Calendar #5 | `EventDrawer.tsx` |

### Certified exceptions

| Surface | Rationale |
|---------|-----------|
| Month event modal inline Close/Edit | 5E.2 preserved; delete via drawer |

---

## UX-PAT-WS-009 — Twin workspace (conversation sidebar + thread)

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-WS-009` |

### Purpose

Conversational AI layout: conversation list sidebar + streaming thread main + composer footer.

### When to use

- AI chat, twin, or assistant modules

### When NOT to use

- Human-to-human messaging (Chat architecture reference — different UX track)

### Required components

- `AIChatPageShell` pattern: **UX-PAT-WS-002** stack
- Single `AIChatWorkspace` engine for page + embedded

### Reference implementations

| Module | Files |
|--------|-------|
| AI #4 | `AIChatWorkspace.tsx`, `AIChatPageShell.tsx` |

---

## UX-PAT-WS-010 — Management page shell (no workspace split)

| Field | Value |
|-------|-------|
| **Primary reference** | Notifications #2 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-WS-010` |

### Purpose

Full-width feed or management page with `PageHeader` + `PageToolbar` but **without** `WorkspaceSplitLayout`.

### When to use

- Inbox feeds, admin lists, notification centers

### When NOT to use

- Entity browsers needing sidebar + detail (use **UX-PAT-WS-001**)

### Required components

- `PageHeader` + `PageToolbar`
- Scrollable main feed column (`min-w-0` flex child)

### Reference implementations

| Module | Files |
|--------|-------|
| Notifications #2 | `/notifications` page |

### Certified exceptions

| Surface | Rationale |
|---------|-----------|
| `/notifications/settings` | N-3 — own header chrome |

---

## Related

- [`NAVIGATION_PATTERNS.md`](./NAVIGATION_PATTERNS.md)
- [`MOBILE_PATTERNS.md`](./MOBILE_PATTERNS.md)
- [`CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md`](./CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md)

**Last updated:** 2026-06-03 (Wave 6A)
