# UX reference (`docs/ux/`)

Cross-cutting **visual and interaction standards** for Vssyl. Complements architecture certification (`docs/architecture/CERTIFICATION_LEDGER.md`) with a parallel **UX certification** track.

**Agent enforcement:** `.cursor/rules/ux-standards.mdc` (short) + `.cursor/rules/ui-standards.mdc` (shared components).

**Last updated:** 2026-06-03

---

## Index

| Document | Purpose |
|----------|---------|
| [UX_CONSTITUTION.md](./UX_CONSTITUTION.md) | Non-negotiable UX principles (including Shared Token Ownership) |
| [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) | Five token families: colors, typography, spacing, radius, shadows |
| [LAYOUT_PATTERNS.md](./LAYOUT_PATTERNS.md) | Approved page archetypes (Dashboard, Workspace, Management, Detail) |
| [COMPONENT_STANDARDS.md](./COMPONENT_STANDARDS.md) | Canonical UI primitives, variants, states, repo locations |
| [INTERACTION_STANDARDS.md](./INTERACTION_STANDARDS.md) | Loading, empty, error, toast, confirm, DnD, search, forms |
| [ACCESSIBILITY_STANDARDS.md](./ACCESSIBILITY_STANDARDS.md) | Keyboard, focus, ARIA, contrast, motion, testing checklist |
| [UX_CERTIFICATION_SCORECARD.md](./UX_CERTIFICATION_SCORECARD.md) | 0–5 rubric and UX-L0–L3 levels |
| [UX_AUDIT_TEMPLATE.md](./UX_AUDIT_TEMPLATE.md) | Module review worksheet (aligned to scorecard) |
| [UX_MODERNIZATION_ROADMAP.md](./UX_MODERNIZATION_ROADMAP.md) | Waves 0–5; reference UX candidate |

---

## Parallel to architecture

| Architecture | UX |
|--------------|-----|
| `VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` | `UX_CONSTITUTION.md` |
| `CERTIFICATION_LEDGER.md` | `UX_CERTIFICATION_SCORECARD.md` + filled audits |
| Reference Module Catalog (L3 code) | Reference UX Module (L3 visual/interaction) |

**Runtime tokens:** `web/src/styles/tokens.css` (imported from `web/src/app/globals.css`). Tailwind: `v.*` namespace in `web/tailwind.config.js`.

---

## When to read

| Task | Start here |
|------|------------|
| New UI in any module | `UX_CONSTITUTION.md` → `DESIGN_TOKENS.md` → `COMPONENT_STANDARDS.md` |
| New page or layout | `LAYOUT_PATTERNS.md` |
| Module UX review | `UX_AUDIT_TEMPLATE.md` + `UX_CERTIFICATION_SCORECARD.md` |
| Modernization planning | `UX_MODERNIZATION_ROADMAP.md` |
