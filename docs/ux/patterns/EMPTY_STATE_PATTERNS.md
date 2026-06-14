# Empty State UX Patterns (Platform Standard)

**Status:** Wave 6A — extracted from Reference UX #1–#5  
**Authority:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md)

---

## UX-PAT-EMP-001 — Shared EmptyState primitive

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | Todo #3, AI #4, Calendar #5 |
| **Pattern ID** | `UX-PAT-EMP-001` |

### Purpose

Zero-data and filter-empty states use `EmptyState` from `shared/components` with guidance text and optional CTA.

### When to use

- List/grid/sidebar with no items
- Filter/search with no matches

### When NOT to use

- Inline loading placeholders (use **UX-PAT-WS-007**)

### Required components

- `EmptyState` from `shared/components`
- Module wrapper optional (e.g. `EmptyTaskState`, `AIChatEmptyState`)

### Required accessibility

- Heading or `aria` structure for empty message
- CTA buttons labeled

### Reference implementations

| Module | Files |
|--------|-------|
| Drive #1 | Drive empty folders/grid |
| Todo #3 | `EmptyTaskState.tsx` |
| AI #4 | `AIChatEmptyState.tsx` |
| Calendar #5 | `CalendarEventsEmptyState` |

### Certified exceptions

| Surface | Rationale |
|---------|-----------|
| Notifications local `EmptyState` | N-4 P3 — behavior verified; primitive adoption deferred |

---

## UX-PAT-EMP-002 — Filter-empty vs zero-data copy

| Field | Value |
|-------|-------|
| **Primary reference** | Todo #3 |
| **Secondary references** | AI #4, Calendar #5, Drive #1 |
| **Pattern ID** | `UX-PAT-EMP-002` |

### Purpose

Distinguish “nothing here yet” from “no results for current filter/search.”

### When to use

- Any module with search, filters, or category selection

### Required behavior

- Different title/body copy per state
- Filter-empty may offer “clear filters” CTA

### Reference implementations

| Module | QA |
|--------|-----|
| Todo #3 | TODO-20 filtered-empty |
| AI #4 | AI-21 filter-empty sidebar |
| Calendar #5 | Search/filter empty copy |

---

## UX-PAT-EMP-003 — Welcome / onboarding empty (no selection)

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Secondary references** | Drive #1 (no selection in details) |
| **Pattern ID** | `UX-PAT-EMP-003` |

### Purpose

Main canvas empty when no entity selected — welcome message + suggested actions.

### When to use

- Split workspaces where sidebar has items but main awaits selection
- New session with no thread (AI welcome)

### Reference implementations

| Module | QA |
|--------|-----|
| AI #4 | AI-22 welcome `EmptyState` |

---

## Related

- [`WORKSPACE_PATTERNS.md`](./WORKSPACE_PATTERNS.md)

**Last updated:** 2026-06-03 (Wave 6A)
