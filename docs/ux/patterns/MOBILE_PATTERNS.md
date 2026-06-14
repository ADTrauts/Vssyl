# Mobile UX Patterns (Platform Standard)

**Status:** Wave 6A — extracted from Reference UX #1–#5  
**Authority:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md)  
**Origin:** Calendar **3C-7B** collapsible sheet — canonical mobile sidebar pattern

---

## UX-PAT-MOB-001 — Collapsible sidebar sheet (3C-7B)

| Field | Value |
|-------|-------|
| **Primary reference** | Calendar #5 |
| **Secondary references** | Notifications #2, AI #4 |
| **Pattern ID** | `UX-PAT-MOB-001` |

### Purpose

At viewports ≤375px, fixed sidebars become overlay sheets with backdrop, open/close controls, and Escape dismiss.

### When to use

- Any `WorkspaceSplitLayout` with persistent sidebar (calendars, conversations, categories, folders)

### When NOT to use

- Management pages that already use full-width feed without sidebar

### Required components

- Menu button to open sheet
- Backdrop click + `Escape` closes sheet
- `aria-label` on open/close (e.g. `Open calendars`, `Close conversations panel`)

### Required mobile behavior

- Core actions in main column reachable without opening sheet (composer, toolbar)
- No body horizontal scroll trap (`scrollW` ≤ viewport width)

### Reference implementations

| Module | QA evidence |
|--------|-------------|
| Calendar #5 | CAL-11, CAL-21 — `Open calendars` / `Close calendars panel` |
| Notifications #2 | NTF-09 — category sheet at 375px |
| AI #4 | AI-15, AI-20 — conversations sheet |

### Certified exceptions

| Gap | Rationale |
|-----|-----------|
| AI-16 BLOCKED | R-AI-2 verification — AI-15/17 pass structural mobile |

---

## UX-PAT-MOB-002 — Horizontal scroll canvas (week/board)

| Field | Value |
|-------|-------|
| **Primary reference** | Calendar #5 |
| **Secondary references** | Todo #3 (board) |
| **Pattern ID** | `UX-PAT-MOB-002` |

### Purpose

Wide canvases (week grid, kanban columns) scroll horizontally within main slot — not `document.body`.

### When to use

- Time-grid week view; task board columns

### Required mobile behavior

- `overflow-x: auto` on canvas container
- No viewport-level horizontal trap

### Reference implementations

| Module | QA |
|--------|-----|
| Calendar #5 | CAL-12 |
| Todo #3 | TODO-14 |

---

## UX-PAT-MOB-003 — Responsive secondary detail panel

| Field | Value |
|-------|-------|
| **Primary reference** | Todo #3 |
| **Secondary references** | Drive #1 |
| **Pattern ID** | `UX-PAT-MOB-003` |

### Purpose

Detail panel stacks or overlays on narrow viewports; primary list remains usable.

### When to use

- List + detail split workspaces

### Required components

- `shrink min-w-0` on flex children
- Avoid rigid fixed widths (e.g. `w-96` only at `lg+`)

### Reference implementations

| Module | QA |
|--------|-----|
| Todo #3 | TODO-15 — detail + actions at 375px |

---

## UX-PAT-MOB-004 — Mobile composer / action bar reachability

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Secondary references** | Chat (non-UX-ref), Calendar toolbar |
| **Pattern ID** | `UX-PAT-MOB-004` |

### Purpose

Primary input and send/attach actions remain visible and tappable at 375px without zoom.

### When to use

- Chat composers, quick-create inputs, floating action areas

### Reference implementations

| Module | QA |
|--------|-----|
| AI #4 | AI-17 — attach + send at 375px |

---

## UX-PAT-MOB-005 — Mobile QA gate (375px matrix)

| Field | Value |
|-------|-------|
| **Primary reference** | Calendar #5 (E-14) |
| **Secondary references** | All references Part 2 matrices |
| **Pattern ID** | `UX-PAT-MOB-005` |

### Purpose

UX-L3 modules must include 375px cases in manual QA matrix with screenshot evidence.

### When to use

- Certification and recertification of any reference or candidate module

### Required evidence

- Sheet open/close, primary flow completion, aria on mobile toggles
- **0 P0 FAIL** on exercisable mobile rows

### Known gap

| ID | Note |
|----|------|
| Drive F-8 | Historical — 375px not recorded at Drive registration |

---

## Related

- [`WORKSPACE_PATTERNS.md`](./WORKSPACE_PATTERNS.md)
- [`ACCESSIBILITY_PATTERNS.md`](./ACCESSIBILITY_PATTERNS.md)

**Last updated:** 2026-06-03 (Wave 6A)
