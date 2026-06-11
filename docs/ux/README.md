# UX reference (`docs/ux/`)

Cross-cutting **visual and interaction standards** for Vssyl. Complements architecture certification (`docs/architecture/CERTIFICATION_LEDGER.md`) with a parallel **UX certification** track.

**Agent enforcement:** `.cursor/rules/ux-standards.mdc` (short) + `.cursor/rules/ui-standards.mdc` (shared components).

**Last updated:** 2026-06-03 (Wave 5A certification framework)

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
| [UX_CERTIFICATION_STANDARD.md](./UX_CERTIFICATION_STANDARD.md) | UX-L1 / L2 / L3 certification definitions (Wave 5A) |
| [UX_CERTIFICATION_SCORECARD.md](./UX_CERTIFICATION_SCORECARD.md) | 11-category PASS/FAIL scorecard + level thresholds |
| [REFERENCE_MODULE_PROGRAM.md](./REFERENCE_MODULE_PROGRAM.md) | Reference UX / Architecture / Workspace / AI / Calendar slots |
| [audits/REFERENCE_MODULE_DRIVE.md](./audits/REFERENCE_MODULE_DRIVE.md) | Reference UX Module #1 registration (Drive) |
| [UX_AUDIT_TEMPLATE.md](./UX_AUDIT_TEMPLATE.md) | Module review worksheet (aligned to scorecard) |
| [UX_MODERNIZATION_ROADMAP.md](./UX_MODERNIZATION_ROADMAP.md) | Waves 0–5; reference UX candidate |
| [UX_PROGRAM_REVIEW.md](./UX_PROGRAM_REVIEW.md) | Post–Wave 2 program review; Wave 3A/B/C recommendations |
| [CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md](./CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md) | Wave 3A menu inventory + primitive hardening |
| [DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md](./DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md) | Wave 3A-3 Drive reference menu rollout plan |
| [COMPONENT_INVENTORY.md](./COMPONENT_INVENTORY.md) | Shared primitive inventory; Wave 2 scope |
| [audits/WAVE1_QA_CLOSEOUT.md](./audits/WAVE1_QA_CLOSEOUT.md) | Wave 1 / 1.5 formal QA closeout |
| [audits/MODAL_STANDARDIZATION_CLOSEOUT.md](./audits/MODAL_STANDARDIZATION_CLOSEOUT.md) | Wave 2A modal certification (PASS WITH FINDINGS) |
| [CONFIRMMODAL_STANDARDIZATION_PLAN.md](./CONFIRMMODAL_STANDARDIZATION_PLAN.md) | Wave 2B ConfirmModal planning + rollout |
| [audits/CONFIRMMODAL_PILOT_CLOSEOUT.md](./audits/CONFIRMMODAL_PILOT_CLOSEOUT.md) | Wave 2B-2 pilot certification |
| [CONFIRMMODAL_BATCH1_PLAN.md](./CONFIRMMODAL_BATCH1_PLAN.md) | Wave 2B-3 Batch 1 rollout (8 sites) |
| [MODAL_STANDARDIZATION_REVIEW.md](./MODAL_STANDARDIZATION_REVIEW.md) | Wave 2A Modal planning (inventory + migration order) |
| [WAVE2A2_CUSTOM_MODAL_MIGRATION_PLAN.md](./WAVE2A2_CUSTOM_MODAL_MIGRATION_PLAN.md) | Wave 2A-2 custom shell migration plan (per-candidate) |

---

## Parallel to architecture

| Architecture | UX |
|--------------|-----|
| `VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` | `UX_CONSTITUTION.md` |
| `CERTIFICATION_LEDGER.md` | `UX_CERTIFICATION_STANDARD.md` + scorecard + audits |
| Reference Module Catalog (L3 code) | `REFERENCE_MODULE_PROGRAM.md` + `REFERENCE_MODULE_*.md` |

**Runtime tokens:** `web/src/styles/tokens.css` (imported from `web/src/app/globals.css`). Tailwind: `v.*` namespace in `web/tailwind.config.js`.

---

## When to read

| Task | Start here |
|------|------------|
| New UI in any module | `UX_CONSTITUTION.md` → `DESIGN_TOKENS.md` → `COMPONENT_STANDARDS.md` |
| New page or layout | `LAYOUT_PATTERNS.md` |
| Module UX review | `UX_AUDIT_TEMPLATE.md` + `UX_CERTIFICATION_SCORECARD.md` |
| Modernization planning | `UX_MODERNIZATION_ROADMAP.md`, `COMPONENT_INVENTORY.md` |
| Wave 2 planning | `COMPONENT_INVENTORY.md` (after `audits/WAVE1_QA_CLOSEOUT.md`) |
