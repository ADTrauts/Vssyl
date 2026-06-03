# Vssyl UX Constitution

**Status:** Wave 0 foundation (2026-06-03)  
**Authority:** Canonical UX rules for all first-party and third-party modules.  
**Complements:** [`docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) (code/architecture), [`memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md) (interop contract).

---

## Purpose

This document defines **non-negotiable** UX principles for Vssyl. It is the UX equivalent of the platform architecture constitution: governance first, module redesigns later.

**Product feel target:** Clean, modern, professional, slightly playful but enterprise-safe; spacious; consistent across personal and business contexts. Inspired by polished SaaS (Google Drive, Linear, Notion, Figma) without copying any single product.

---

## Non-negotiable rules

### 1. Use shared design tokens before raw values

Prefer `--v-*` CSS variables and Tailwind `v.*` classes (see [`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md)). Legacy `--primary`, `bg-blue-600`, and Tailwind grays remain valid until migration waves; **new** UI should use the shared token system.

### 2. Do not invent one-off visual primitives

No ad-hoc hex colors, font sizes, box shadows, or border radii in module code unless routed through the token layer (Rule 11).

### 3. Every page must use an approved layout pattern

One of: Dashboard, Workspace, Management, or Detail (see [`LAYOUT_PATTERNS.md`](./LAYOUT_PATTERNS.md)).

### 4. Every major module must support light and dark mode

Use class-based `.dark` theming; test both modes before UX sign-off.

### 5. Every interactive element must have complete states

Where applicable: default, hover, focus, disabled, loading. Do not ship click targets without visible focus.

### 6. Every empty state must be intentional

Include icon, title, description; add a primary action when a clear next step exists (see [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md) — `EmptyState`).

### 7. Destructive actions require guardrails

Use confirmation dialogs or reversible soft-delete (Global Trash) per platform patterns—not silent hard deletes for user data.

### 8. Reuse shared UI primitives before custom UI

Import from `shared/components` per [`.cursor/rules/ui-standards.mdc`](../../.cursor/rules/ui-standards.mdc). App-specific composition lives under `web/src/components/[module]/`.

### 9. Accessibility is not optional

Meet [`ACCESSIBILITY_STANDARDS.md`](./ACCESSIBILITY_STANDARDS.md) minimums; WCAG 2.1 AA is the target for new surfaces.

### 10. UX changes must preserve platform boundaries

Do not bypass auth, permissions, tenancy, API proxy, or module contracts for visual convenience.

### 11. Shared Token Ownership

**No module may create its own independent design token system.**

All colors, typography, spacing, radii, shadows, elevations, and layout primitives must originate from the shared Vssyl UX token system documented in [`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md) and implemented in `web/src/styles/tokens.css`.

Module-specific overrides are permitted **only** when routed through the shared token architecture (e.g. business branding overrides `--v-color-primary` via an approved branding layer—not a parallel `PlaceColorSystem.ts`).

---

## Approved patterns

| Situation | Approved approach |
|-----------|-------------------|
| Primary button | `shared/components` `Button` variant `primary`, or `bg-v-primary` / `var(--v-color-primary)` |
| Page background | `bg-v-background` or `var(--v-color-background)` |
| Business accent | Override token layer (`GlobalBrandingContext`, business CSS vars on approved keys) |
| Empty folder | `EmptyState` with icon, title, description, optional CTA |
| Delete user file | Soft-delete + Global Trash |
| Module hub | `[Module]WorkspaceLanding.tsx` + `BusinessWorkspaceContent` switch |
| Dark mode text on light card | `text-gray-700` minimum per `ui-standards.mdc` |

---

## Disallowed patterns

| Situation | Why disallowed | Instead |
|-----------|----------------|---------|
| `PlaceColorSystem.ts` with module-only palette | Violates Rule 11 | Use `--v-color-*`; scope branding via token overrides |
| Calendar-specific spacing scale | Fragmented system | `--v-space-*` |
| Chat-only typography tokens | Fragmented system | `--v-font-*` + type scale in DESIGN_TOKENS |
| Hardcoded `#3b82f6` in new components | One-off color | `var(--v-color-primary)` |
| `text-gray-400` on white for body copy | Fails contrast | `text-gray-600` minimum (secondary) |
| Custom modal with no focus trap | A11y failure | `shared/components` `Modal` |
| Empty `<div>No items</div>` | Poor UX | `EmptyState` |
| UX change that removes permission check | Security regression | Keep authZ; style only |

---

## Examples (Rule 11)

**Allowed:**

```text
Business branding overrides primary color via approved token layer
(--business-primary-color mapped to --v-color-primary at runtime).
```

**Not allowed:**

```text
Place creates PlaceColorSystem.ts
Calendar creates separate spacing scale
Chat introduces custom typography tokens
```

---

## Enforcement

| Gate | Mechanism |
|------|-----------|
| PR review | UX constitution + scorecard for material UI changes |
| Agent | `ux-standards.mdc`, `ui-standards.mdc` |
| Module UX audit | [`UX_AUDIT_TEMPLATE.md`](./UX_AUDIT_TEMPLATE.md) |
| Certification | [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md) (Wave 5+) |

---

## Related documents

- [`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md)
- [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md)
- [`docs/VSSYL_SOURCE_OF_TRUTH.md`](../VSSYL_SOURCE_OF_TRUTH.md)

**Last updated:** 2026-06-03
