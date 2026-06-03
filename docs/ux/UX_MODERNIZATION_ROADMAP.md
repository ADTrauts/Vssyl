# Vssyl UX Modernization Roadmap

**Status:** Wave 0 foundation (2026-06-03)  
**Scope:** Governance and incremental waves — not a feature redesign sprint.

---

## Objective

Build and enforce a unified UX system (tokens, layouts, components, interactions, accessibility) across Dashboard, Drive/File Hub, Chat, Calendar, Place, Admin, Business Workspace, Analytics, Settings, and future modules.

Parallel to platform **architecture** modernization — same rigor, separate certification track.

---

## Initial Reference UX Candidate

**Candidate:** Drive / File Hub (`drive`, user-facing: **File Hub**)

**Not certified** on the UX scorecard in Wave 0.

### Why Drive

Drive currently exercises a large percentage of platform UX patterns:

- Context menus
- Detail panels
- Search
- Drag and drop
- Activity views
- Sidebars
- Empty states
- Loading states
- File cards
- Permissions UI
- Shared layouts (Workspace archetype)

### Clarification

This identifies Drive as the **strongest candidate for future UX-L3 / Reference UX Module** status. Formal designation requires Wave 5 audit using [`UX_AUDIT_TEMPLATE.md`](./UX_AUDIT_TEMPLATE.md) and scorecard thresholds in [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md).

**Architecture alignment:** File Hub is already Reference Implementation #1 for code — see [`FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md`](../architecture/audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md).

---

## Wave 0 — Inventory & foundation (current)

| Task | Status |
|------|--------|
| UX constitution + standards docs | Done (2026-06-03) |
| Five-family token scaffolding (`tokens.css`) | Done (2026-06-03) |
| Agent rule `ux-standards.mdc` | Done (2026-06-03) |
| Audit template + scorecard | Done (2026-06-03) |
| Module-by-module inventory appendix | **Pending** (fill during audits) |

### Wave 0 inventory checklist (to complete in Wave 4 prep)

| Module | Layout archetype | Token debt | Component gaps | Dark mode | Notes |
|--------|------------------|------------|----------------|-----------|-------|
| Dashboard | Dashboard | High (widgets) | Mixed | Partial | |
| Drive / File Hub | Workspace | Medium | Low | Good | Reference candidate |
| Chat | Workspace | Medium | Medium | Good | |
| Calendar | Workspace | Medium | Medium | Partial | |
| Place | Workspace | Medium | Medium | Partial | |
| Admin Portal | Management | High | Medium | Partial | |
| Business Workspace | Workspace | Medium | Hub landing | Partial | |
| Analytics | Management | High | Charts | Partial | |
| Settings | Management | Medium | Forms | Partial | |
| Notebook | Workspace | Medium | MLVP | Partial | |

---

## Wave 1 — Token foundation

- Adopt `v.*` Tailwind and `--v-*` CSS in **shared primitives** (Button, Input, Card) after visual review
- Document migration playbook per module
- **No** full-app class replacement

---

## Wave 2 — Shared components

Priority primitives:

- Button, Input, Card, Panel, Modal, Dropdown, ContextMenu
- EmptyState (+ optional action prop)
- LoadingState, ErrorState (dedicated)
- Select, IconButton (new shared)

Eliminate duplicate `Checkbox 2.tsx` / index duplicates.

---

## Wave 3 — Layout shells

- Standardize Dashboard, Workspace, Management, Detail shells
- Extract repeated workspace chrome where safe
- Mobile behavior per [`LAYOUT_PATTERNS.md`](./LAYOUT_PATTERNS.md)

---

## Wave 4 — Module audits

For each module in inventory table:

1. Copy [`UX_AUDIT_TEMPLATE.md`](./UX_AUDIT_TEMPLATE.md)
2. Score with [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md)
3. File remediation PRs by wave

Order suggestion: Drive (baseline) → Chat → Calendar → Dashboard → Place → Business → Admin → Analytics → Settings.

---

## Wave 5 — UX certification

- Assign UX-L1/L2/L3 per module
- Confirm or replace **Reference UX Module** (Drive candidate)
- Publish UX certification ledger (future doc, parallel to `CERTIFICATION_LEDGER.md`)
- Remediation burn-down for any module below L2

---

## Explicitly out of scope (all waves until approved)

- Full visual rebrand
- Third-party design system adoption
- Module feature redesign
- Breaking layout refactors without migration plan

---

## Related

- [`UX_CONSTITUTION.md`](./UX_CONSTITUTION.md)
- [`docs/plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md`](../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) (architecture track)

**Last updated:** 2026-06-03
