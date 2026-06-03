# Vssyl Layout Patterns

**Status:** Wave 0 foundation (2026-06-03)  
**Rule:** Every page must use one approved archetype ([`UX_CONSTITUTION.md`](./UX_CONSTITUTION.md) §3).

---

## Overview

| Pattern | Primary use | Repo anchor |
|---------|-------------|-------------|
| **Dashboard** | Personal/business home, widgets | `web/src/app/dashboard/DashboardLayout.tsx`, `DashboardLayoutInner.tsx` |
| **Workspace** | Module tools (Drive, Chat, Calendar, Place) | Module content inside dashboard shell; `BusinessWorkspaceContent.tsx` |
| **Management** | Admin, settings, lists | Admin routes, settings pages, table-heavy views |
| **Detail** | Single-entity focus | `FilePreviewPanel`, thread detail, event drawer |

---

## 1. Dashboard Layout

### When to use

- Personal dashboard home and widget canvas
- Business dashboard overview
- Routes that need global nav + multi-dashboard tabs

### Required regions

| Region | Description |
|--------|-------------|
| Global header | Search, AI, trash, avatar, context switchers |
| Left navigation | Module icons, sidebar customization |
| Main canvas | Widget grid or child route outlet |

### Optional regions

| Region | Description |
|--------|-------------|
| Right utility rail | Contextual tools (module-specific) |
| Work tab / business strip | Business context entry |

### Repo reference

- `web/src/app/dashboard/DashboardLayout.tsx` — provider wrapper
- `web/src/app/dashboard/DashboardLayoutInner.tsx` — sidebar, tabs, main area
- Used by: `drive/layout.tsx`, `chat/layout.tsx`, `calendar/layout.tsx`, `notebook/layout.tsx`, etc.

### Mobile behavior

- Sidebar collapses to drawer or icon strip
- Widget grid stacks single column
- Header remains sticky; touch targets ≥ 44px

### Accessibility

- Skip link to main content (target for future wave)
- Sidebar items: visible focus, `aria-current` for active module
- Dashboard tabs: keyboard navigable

---

## 2. Workspace Layout

### When to use

- Drive / File Hub
- Chat
- Calendar
- Place (`PlaceContent`, business `PlaceWorkspaceLanding`)
- Business workspace module views

### Required regions

| Region | Description |
|--------|-------------|
| Context header | Module title, actions, scope (folder, channel, calendar) |
| Left sidebar | Tree, channels, calendars, place nav |
| Main content | Primary work area (grid, messages, calendar grid) |

### Optional regions

| Region | Description |
|--------|-------------|
| Right details panel | File preview, thread info, event details |
| Bottom sheet (mobile) | Replace right panel on narrow viewports |

### Repo reference

- Drive: `web/src/components/drive/enterprise/EnhancedDriveModule.tsx`
- Chat: `web/src/components/chat/UnifiedGlobalChat.tsx`, chat layouts
- Business hub: `web/src/components/business/BusinessWorkspaceContent.tsx`
- Place: `web/src/components/place/PlaceContent.tsx`, `PlaceWorkspaceLanding.tsx`

### Mobile behavior

- Sidebar → overlay drawer
- Details panel → full-screen sheet or tab
- Preserve context header with condensed actions (overflow menu)

### Accessibility

- Landmark regions: `nav`, `main`, complementary panel
- Panel open/close: focus moves into panel; Escape closes

---

## 3. Management Layout

### When to use

- Admin Portal
- Settings (user, business, module)
- Business admin (members, billing, modules)
- Module management (install, permissions)

### Required regions

| Region | Description |
|--------|-------------|
| Page header | Title, description, primary action |
| Filter/search row | Search, filters, date range when applicable |
| Data surface | Table or card list |

### Optional regions

| Region | Description |
|--------|-------------|
| Details drawer/modal | Row click → detail without leaving list |
| Bulk action bar | Multi-select operations |
| Secondary tabs | Sub-sections within settings |

### Repo reference

- Admin: `web/src/app/admin/**`
- Settings patterns across `web/src/app/settings/**`
- `shared/components/Table`, `Pagination`, `ModuleList`

### Mobile behavior

- Table → horizontal scroll or card list transformation
- Filters → collapsible panel
- Bulk bar → sticky bottom on mobile

### Accessibility

- Sortable columns: `aria-sort`
- Row selection: checkbox labels tied to row title
- Dialogs for create/edit: focus trap

---

## 4. Detail Layout

### When to use

- File details / preview
- Business profile detail
- User profile
- Calendar event detail
- Chat thread detail (when full-page)

### Required regions

| Region | Description |
|--------|-------------|
| Hero/header | Title, primary metadata, key actions |
| Metadata strip | Dates, owner, status, tags |
| Content sections | Tabs or stacked sections (activity, permissions, versions) |

### Optional regions

| Region | Description |
|--------|-------------|
| Activity/context panel | Comments, audit trail, related items |
| Breadcrumbs | Navigation back to parent list |

### Repo reference

- `shared/src/components/FilePreviewPanel.tsx`
- Event drawers in calendar components
- Chat thread header patterns

### Mobile behavior

- Metadata strip wraps or collapses to accordion
- Activity panel stacks below content

### Accessibility

- Heading hierarchy matches visual hierarchy
- Actions in header reachable by keyboard
- Tabs: roving tabindex pattern

---

## Choosing a pattern

```text
Home / widgets        → Dashboard
Tool / editor         → Workspace
Admin list / settings → Management
Single record focus   → Detail
```

Hybrid pages (e.g. Drive with preview open) = **Workspace** + optional **Detail** panel — not a fifth pattern.

---

## Business branding

Business workspaces may apply branding colors to header/sidebar via approved token overrides. Layout **structure** does not change per tenant.

---

## Related

- [`UX_CONSTITUTION.md`](./UX_CONSTITUTION.md)
- [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md)
- [`docs/architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`](../architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md)

**Last updated:** 2026-06-03
