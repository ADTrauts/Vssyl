# Accessibility UX Patterns (Platform Standard)

**Status:** Wave 6A — extracted from Reference UX #1–#5  
**Authority:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md)

---

## UX-PAT-A11Y-001 — Icon-only control labels

| Field | Value |
|-------|-------|
| **Primary reference** | Todo #3 |
| **Secondary references** | AI #4, Calendar #5, Notifications #2 |
| **Pattern ID** | `UX-PAT-A11Y-001` |

### Purpose

Every icon-only button has `aria-label` or visible `title` with consistent naming.

### When to use

- Overflow menus, toolbar icons, composer actions, trash/edit icons

### Required naming examples

- `Task actions`, `Notification actions`, `Conversation options`
- Attach / voice / send on AI composer

### Reference implementations

| Module | QA |
|--------|-----|
| Todo #3 | TODO-24 |
| Notifications #2 | NTF-16 |
| AI #4 | AI-18, AI-19 |
| Calendar #5 | CAL-20 |

### Known gap

| ID | Note |
|----|------|
| Drive F-6 | Trash page restore/delete icons — carry-forward |

---

## UX-PAT-A11Y-002 — Modal focus and Escape

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | Todo #3, Calendar #5, Notifications #2, AI #4 |
| **Pattern ID** | `UX-PAT-A11Y-002` |

### Purpose

`ConfirmModal` and dialogs: focus trap while open; `Escape` dismisses without side effect on cancel paths.

### When to use

- All modals and confirm gates

### Reference implementations

| Module | QA |
|--------|-----|
| Todo #3 | TODO-17 |
| AI #4 | AI-14 |
| Calendar #5 | CAL-16 |
| Notifications #2 | NTF-12 |

---

## UX-PAT-A11Y-003 — Feed keyboard shortcuts

| Field | Value |
|-------|-------|
| **Primary reference** | Notifications #2 |
| **Secondary references** | Calendar #5 |
| **Pattern ID** | `UX-PAT-A11Y-003` |

### Purpose

Documented keyboard shortcuts for feed/list modules: navigation and primary actions.

### Standard shortcuts (Notifications)

| Key | Action |
|-----|--------|
| `j` / `k` | Move focus |
| `Space` | Mark read |
| `Enter` | Open |
| `Escape` | Dismiss menu/modal |

### Calendar extension

| Key | Action |
|-----|--------|
| `?` | Shortcuts help (when not in input) |

### Known gaps

| ID | Note |
|----|------|
| Drive F-5 | Documents unimplemented shortcuts |
| AI R-AI-3 | No shortcuts help — L3 CwF carry-forward |
| Todo T-12 | No arrow-key list nav — KNOWN-PWF |

---

## UX-PAT-A11Y-004 — Mobile panel toggle labels

| Field | Value |
|-------|-------|
| **Primary reference** | Calendar #5 |
| **Secondary references** | AI #4, Notifications #2 |
| **Pattern ID** | `UX-PAT-A11Y-004` |

### Purpose

Open/close sheet controls have explicit `aria-label` (not icon-only without name).

### Required labels (examples)

- `Open calendars` / `Close calendars panel`
- `Open conversations panel` / `Close conversations panel`
- `Open notification categories` / `Close categories panel`

### Reference implementations

| Module | QA |
|--------|-----|
| Calendar #5 | CAL-21 |
| AI #4 | AI-20 |
| Notifications #2 | N-5 mobile labels |

---

## UX-PAT-A11Y-005 — View mode toggle labels

| Field | Value |
|-------|-------|
| **Primary reference** | Todo #3 |
| **Secondary references** | Calendar #5 |
| **Pattern ID** | `UX-PAT-A11Y-005` |

### Purpose

Toolbar view switches expose accessible names for screen readers.

### Examples

- `List view`, `Board view`, `Calendar view`
- Calendar nav: day/week/month/year controls labeled

### Reference implementations

| Module | QA |
|--------|-----|
| Todo #3 | TODO-25 |
| Calendar #5 | CAL-20 |

---

## UX-PAT-A11Y-006 — DropdownMenu menuLabel

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Secondary references** | Todo #3, Notifications #2 |
| **Pattern ID** | `UX-PAT-A11Y-006` |

### Purpose

`DropdownMenu` triggers use `menuLabel` prop or equivalent `aria-label` on `More` controls.

### Reference implementations

| Module | QA |
|--------|-----|
| AI #4 | AI-19 |

---

## UX-PAT-A11Y-007 — Dark mode readability (L2 gate)

| Field | Value |
|-------|-------|
| **Primary reference** | Todo #3 |
| **Secondary references** | Calendar #5, Notifications #2 |
| **Pattern ID** | `UX-PAT-A11Y-007` |

### Purpose

Primary surfaces readable in `.dark` — token-based colors, not ad-hoc hex in new UI.

### When to use

- All L2+ certified modules

### Verification

- Matrix dark-theme row recommended (TODO-16, CAL dark cases)
- AI R-AI-4: dark mode not in Part 2F — carry-forward

---

## Related

- [`MOBILE_PATTERNS.md`](./MOBILE_PATTERNS.md)
- [`CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md`](./CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md)

**Last updated:** 2026-06-03 (Wave 6A)
