# Navigation UX Patterns (Platform Standard)

**Status:** Wave 6A — extracted from Reference UX #1–#5  
**Authority:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md)

---

## UX-PAT-NAV-001 — Business workspace hub landing

| Field | Value |
|-------|-------|
| **Primary reference** | Todo #3 (`TodoWorkspaceLanding`) |
| **Secondary references** | Drive #1, Calendar #5, AI #4, Notifications #2 (indirect) |
| **Pattern ID** | `UX-PAT-NAV-001` |

### Purpose

Every business module exposes `[Module]WorkspaceLanding.tsx` and a `BusinessWorkspaceContent` switch — prevents dashboard fallback.

### When to use

- All built-in and marketplace business modules (`module-development.mdc`)

### When NOT to use

- Platform shell-only surfaces (Reference Workspace track)

### Required components

- `web/src/components/[module]/[Module]WorkspaceLanding.tsx`
- `case '[moduleId]':` in `BusinessWorkspaceContent.tsx`
- Icon + display name in `BrandedWorkDashboard.tsx`

### Reference implementations

| Module | File |
|--------|------|
| Todo #3 | `TodoWorkspaceLanding.tsx` |
| Calendar #5 | `CalendarWorkspaceLanding.tsx` |
| AI #4 | `AIWorkspaceLanding.tsx` |
| Drive #1 | Business branch in Drive routes |

---

## UX-PAT-NAV-002 — Cross-module deep linking (inbox router)

| Field | Value |
|-------|-------|
| **Primary reference** | Notifications #2 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-NAV-002` |

### Purpose

Metadata-driven navigation from notification rows to originating module routes without bypassing Next.js API proxy.

### When to use

- Notification types `[module]_[event]`
- Any cross-module “open source” affordance

### When NOT to use

- Hardcoded external URLs in partner modules without manifest metadata

### Required components

- Manifest `notifications[]` metadata
- `NotificationQuickActions` / routing adapter
- Relative `/api/...` paths via proxy

### Reference implementations

| Module | Files |
|--------|-------|
| Notifications #2 | `NotificationQuickActions`, feed routing |

---

## UX-PAT-NAV-003 — Canonical cross-route navigation (module family)

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-NAV-003` |

### Purpose

Central navigation model file + shared nav link component between related routes in one module family.

### When to use

- Multi-route modules (e.g. `/ai-chat` ↔ `/ai`)

### Required components

- `*Navigation.ts` route constants
- `*NavLinks.tsx` shared component in header/toolbar

### Reference implementations

| Module | Files |
|--------|-------|
| AI #4 | `aiExperienceNavigation.ts`, `AIExperienceNavLinks.tsx` |

---

## UX-PAT-NAV-004 — Control-center tabs (identity / settings archetype)

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 (`/ai`) |
| **Secondary references** | Notifications #2 settings (exception) |
| **Pattern ID** | `UX-PAT-NAV-004` |

### Purpose

`PageHeader` + tabbed control center without full workspace split.

### When to use

- User identity, behavior, provider settings — non-CRUD workspace flows

### When NOT to use

- Primary data workspace (use **UX-PAT-WS-001**)

### Certified exceptions

| Surface | Rationale |
|---------|-----------|
| `/ai` identity tabs | Certified — not `WorkspaceSplitLayout` |
| `/notifications/settings` | N-3 certified sub-route |

### Reference implementations

| Module | Route |
|--------|-------|
| AI #4 | `/ai` |

---

## UX-PAT-NAV-005 — Header quick-access overlay (global entry)

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 (`AIChatDropdown`) |
| **Secondary references** | Notifications bell → full feed |
| **Pattern ID** | `UX-PAT-NAV-005` |

### Purpose

Portal overlay for quick access; must link to full-page module for extended sessions.

### When to use

- Global header entry to high-frequency modules

### When NOT to use

- Sole implementation of module UX (must have full-page route)

### Required components

- Overlay with dismiss + nav links to canonical routes
- `aria-label` on open/close

### Certified exceptions

| Surface | Rationale |
|---------|-----------|
| `AIChatDropdown` | Quick-access twin — escape hatch to `/ai-chat` |

### Reference implementations

| Module | Files |
|--------|-------|
| AI #4 | `AIChatDropdown.tsx` |

---

## UX-PAT-NAV-006 — View route quartet (scheduling)

| Field | Value |
|-------|-------|
| **Primary reference** | Calendar #5 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-NAV-006` |

### Purpose

Dedicated routes per time view (day/week/month/year) with shared toolbar and redirect from module root.

### When to use

- Scheduling modules with distinct grid densities per view

### Reference implementations

| Module | Routes |
|--------|--------|
| Calendar #5 | `/calendar/month`, `/day`, `/week`, `/year` |

---

## UX-PAT-NAV-007 — Category / filter sidebar navigation

| Field | Value |
|-------|-------|
| **Primary reference** | Notifications #2 |
| **Secondary references** | Drive #1 sidebar, Calendar #5 calendar list |
| **Pattern ID** | `UX-PAT-NAV-007` |

### Purpose

Sidebar or panel for filters, categories, or folder tree with counts.

### When to use

- Feeds with categories; file trees; calendar list selection

### Reference implementations

| Module | Pattern |
|--------|---------|
| Notifications #2 | Category sidebar + counts |
| Drive #1 | Folder tree |
| Calendar #5 | Calendar list sidebar |

---

## Related

- [`WORKSPACE_PATTERNS.md`](./WORKSPACE_PATTERNS.md)
- [`CROSS_MODULE_INTEGRATION_PATTERNS.md`](./CROSS_MODULE_INTEGRATION_PATTERNS.md)

**Last updated:** 2026-06-03 (Wave 6A)
