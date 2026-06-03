# Vssyl Component Standards

**Status:** Wave 0 foundation (2026-06-03)  
**Import path:** `import { Button, Card, ... } from 'shared/components';` (see `ui-standards.mdc`)

Before creating new shared components, search `shared/src/components/` and `web/src/components/` for equivalents.

---

## Summary table

| Component | In repo | Location | Notes |
|-----------|---------|----------|-------|
| Button | Yes | `shared/src/components/Button.tsx` | variants: primary, secondary, ghost; sizes sm, md, lg |
| IconButton | Partial | Use `Button` ghost + icon, or app-specific | Dedicated primitive TBD Wave 2 |
| Input | Yes | `shared/src/components/Input.tsx` | |
| Select | No (shared) | Native `<select>` in forms | Shared Select TBD Wave 2 |
| Textarea | Yes | `shared/src/components/Textarea.tsx` | |
| Checkbox | Yes | `shared/src/components/Checkbox.tsx` | Duplicate `Checkbox 2.tsx` — tech debt |
| Toggle | Yes | `shared/src/components/Switch.tsx` | |
| Card | Yes | `shared/src/components/Card.tsx` | Simple wrapper; no CardHeader subcomponents |
| Panel | Partial | `Section.tsx`, app panels | |
| Modal | Yes | `shared/src/components/Modal.tsx` | |
| Drawer | Yes | `shared/src/components/Drawer.tsx` | |
| Dropdown | Partial | `Popover.tsx` | |
| ContextMenu | Yes | `shared/src/components/ContextMenu.tsx` | Drive reference patterns |
| Tabs | Yes | `shared/src/components/Tabs.tsx` | |
| Breadcrumbs | Yes | `shared/src/components/Breadcrumbs.tsx` | |
| Table | Yes | `shared/src/components/Table.tsx` | |
| DataList | Partial | `ModuleList.tsx`, `FileGrid.tsx` | |
| EmptyState | Yes | `shared/src/components/EmptyState.tsx` | Missing optional `action` prop — Wave 2 |
| LoadingState | Yes | `Spinner.tsx`, `LoadingSkeleton.tsx`, `LoadingOverlay.tsx` | |
| ErrorState | Partial | `Alert.tsx`, `ErrorBoundary2.tsx` | Dedicated ErrorState TBD |
| Toast | Yes | `Toast.tsx`, `ToastProvider.tsx`; also `react-hot-toast` in app | |
| Badge | Yes | `shared/src/components/Badge.tsx` | |
| Avatar | Yes | `shared/src/components/Avatar.tsx` | |
| Tooltip | Yes | `shared/src/components/Tooltip.tsx` | |
| SearchBox | App | `web/src/components/header/CompactSearchButton.tsx` | Module-local search patterns |

---

## Button

**Purpose:** Primary user actions.

| Attribute | Standard |
|-----------|----------|
| Variants | `primary`, `secondary`, `ghost` only |
| Sizes | `sm`, `md`, `lg` |
| States | hover, focus (`focus:ring`), disabled (`disabled:opacity-50`), loading (spinner + `aria-busy`) |
| A11y | Native `<button>`; `type="button"` when not submitting |

**Future:** Map colors to `--v-color-primary` (Wave 2).

---

## IconButton

**Purpose:** Icon-only actions in toolbars.

| Attribute | Standard |
|-----------|----------|
| States | Same as Button |
| A11y | Required `aria-label`; min 44×44px touch target |

**Today:** `Button` variant `ghost` with icon child, or module-local icon buttons.

---

## Input / Textarea

**Purpose:** Text entry.

| Attribute | Standard |
|-----------|----------|
| States | default, focus, disabled, error (border `--v-color-danger`) |
| A11y | Associated `<label>` or `aria-label`; `aria-invalid` + `aria-describedby` for errors |

---

## Select

**Purpose:** Choose one of many options.

**Today:** Native select styled with Tailwind in forms.

**Future:** Shared `Select` with keyboard listbox pattern (Wave 2).

---

## Checkbox / Toggle (Switch)

**Purpose:** Boolean settings.

| Attribute | Standard |
|-----------|----------|
| A11y | Label click target; Switch exposes role switch + `aria-checked` |

---

## Card

**Purpose:** Group related content.

| Attribute | Standard |
|-----------|----------|
| Usage | Simple wrapper — **no** CardHeader/CardTitle/CardContent subcomponents |
| Radius | `--v-radius-card` when on token system |

---

## Panel

**Purpose:** Secondary surfaces (sidebars, inspectors).

Use `Section` or module layout; elevation `--v-shadow-panel`.

---

## Modal / Drawer

**Purpose:** Focused tasks without full navigation.

| Attribute | Standard |
|-----------|----------|
| States | open/close animation; loading body |
| A11y | Focus trap; Escape closes; return focus to trigger |
| Radius | `--v-radius-modal` |

---

## ContextMenu / Dropdown

**Purpose:** Contextual actions (Drive reference).

| Attribute | Standard |
|-----------|----------|
| A11y | Keyboard arrows; Escape dismiss; first item focus on open |

---

## Tabs

**Purpose:** Section switching within a page.

| Attribute | Standard |
|-----------|----------|
| A11y | `role="tablist"` / `tab` / `tabpanel`; arrow key navigation |

---

## Table

**Purpose:** Management layout data grids.

| Attribute | Standard |
|-----------|----------|
| States | hover row, selected row, empty |
| A11y | `<th scope="col">`; caption or `aria-label` on table |

---

## EmptyState

**Purpose:** Zero-data education and next step.

| Attribute | Standard |
|-----------|----------|
| Required | icon, title, description |
| Optional | primary action (documented; prop TBD Wave 2) |
| A11y | Heading for title; action is real button |

---

## LoadingState

**Purpose:** In-progress feedback.

| Attribute | Standard |
|-----------|----------|
| Patterns | `Spinner` inline; `LoadingSkeleton` for lists; `LoadingOverlay` for blocking |
| A11y | `aria-busy="true"` on region; prefer skeleton over spinner-only for layout shift |

---

## ErrorState

**Purpose:** Recoverable failures.

| Attribute | Standard |
|-----------|----------|
| Required | What failed, why (if safe), retry or alternate action |
| Today | `Alert` variant danger + module copy |

---

## Toast

**Purpose:** Transient global feedback.

| Attribute | Standard |
|-----------|----------|
| Usage | Success/info short messages; not for critical errors requiring acknowledgment |
| Duration | ~4s default; user-dismiss for errors |

---

## Badge / Avatar / Tooltip

**Badge:** Status counts, labels — do not rely on color alone.  
**Avatar:** Image + fallback initials; alt text for user identity.  
**Tooltip:** Supplementary only — not sole label for controls.

---

## SearchBox

**Purpose:** Filter or global search entry.

Drive/Chat patterns: debounced input, clear button, keyboard shortcut hint where applicable.

---

## Creating new shared components

1. Confirm no duplicate in `shared/src/components/`.
2. Use `--v-*` tokens for new styling.
3. Export from `shared/src/components/index.ts`.
4. Document in this file.
5. Add vitest only when behavior is non-trivial.

**Recommended path:** `shared/src/components/[Name].tsx`

---

## Related

- [`INTERACTION_STANDARDS.md`](./INTERACTION_STANDARDS.md)
- [`ACCESSIBILITY_STANDARDS.md`](./ACCESSIBILITY_STANDARDS.md)
- `shared/src/components/README.md`

**Last updated:** 2026-06-03
