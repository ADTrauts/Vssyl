# Vssyl UX Certification Standard

**Status:** Wave 5A foundation (2026-06-03)  
**Authority:** Platform-wide UX certification levels for every Vssyl module  
**Benchmark:** Drive / File Hub — Reference UX Module #1  
**Complements:** [`UX_CONSTITUTION.md`](./UX_CONSTITUTION.md), [`INTERACTION_STANDARDS.md`](./INTERACTION_STANDARDS.md), architecture [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md)

---

## Purpose

Define **UX-L1**, **UX-L2**, and **UX-L3** as repeatable certification levels. Any first-party or third-party module may be audited against this standard using [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md).

**UX certification is separate from architecture certification** (L0–L3 code maturity). A module may be architecture L3 while UX-L1 until remediated.

---

## Certification levels

| Level | Name | One-line definition |
|-------|------|---------------------|
| **UX-L0** | Unreviewed | No formal UX audit |
| **UX-L1** | Baseline usability | Safe, navigable, no critical interaction violations |
| **UX-L2** | Platform consistency | Shared primitives, layout shells, standardized patterns |
| **UX-L3** | Reference-grade experience | Benchmark-quality flows; suitable to copy across modules |
| **Reference designation** | Canonical example | Formally registered in [`REFERENCE_MODULE_PROGRAM.md`](./REFERENCE_MODULE_PROGRAM.md) |

---

## UX-L1 — Baseline usability

**Goal:** Users can complete core tasks without data-loss risk, broken navigation, or inaccessible blockers.

### Required criteria

| Area | Requirement | Evidence |
|------|-------------|----------|
| **Destructive confirmations** | Irreversible or high-impact deletes use `ConfirmModal` or Global Trash soft-delete — not silent hard delete | Grep + flow audit |
| **No native browser dialogs** | No `prompt()` / `window.confirm()` on user-facing module paths | Static grep |
| **Navigation consistency** | Module reachable from business/personal workspace; back/breadcrumb or sidebar path exists | Route + hub audit |
| **Responsive support** | Core flows usable at 375px width (no horizontal trap on primary views) | Viewport check |
| **Basic accessibility** | Focus visible on primary controls; icon-only buttons have `aria-label` or `title`; no keyboard trap on modals | Spot checklist |
| **Loading feedback** | Primary data fetches show loading state (spinner, skeleton, or overlay) | UI audit |
| **Error feedback** | Failed API actions surface toast or inline error — not silent failure | Flow audit |
| **Tenancy** | UI respects dashboard/business/household context; no cross-tenant leakage in labels | Code review |

### UX-L1 blockers (automatic fail)

- Native `confirm()` / `prompt()` on destructive or create flows
- Permanent delete without confirmation
- Module hub falls through to generic dashboard with no module landing
- Primary view unusable on mobile width

### Reference examples (Drive L1+)

- Move-to-trash ConfirmModal on menu, bulk, keyboard, drag (3B)
- `DriveCreateFolderModal` replaces folder `prompt()` (3B-4)
- Empty-trash and delete-forever ConfirmModal (3B-1, 3B-3)

---

## UX-L2 — Platform consistency

**Goal:** Module looks and behaves like part of one platform — shared tokens, shells, menus, and state patterns.

### Required criteria (in addition to L1)

| Area | Requirement | Reference |
|------|-------------|-----------|
| **Shared primitives** | `Button`, `Input`, `Card`, `Modal`, `ConfirmModal`, `EmptyState`, `Spinner` from `shared/components` | [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md) |
| **Token usage** | New UI uses `--v-*` / Tailwind `v.*` — not ad-hoc hex in new surfaces | [`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md) |
| **Layout shell** | Uses approved archetype shell: `WorkspaceSplitLayout`, `PlatformShell`, or management pattern (`PageHeader` + `PageToolbar`) | [`LAYOUT_PATTERNS.md`](./LAYOUT_PATTERNS.md) |
| **Workspace modules** | `WorkspaceSplitLayout` for sidebar \| main \| optional secondary | 3C-2 Drive/Chat pattern |
| **Business hub** | `[Module]WorkspaceLanding.tsx` + `BusinessWorkspaceContent` switch | `module-development.mdc` |
| **Menus** | Floating actions use `ContextMenu`, `DropdownMenu`, or `Popover` — not duplicate inline `fixed` menu shells | 3A certification |
| **Dark mode** | Primary surfaces readable in `.dark` | Screenshot pair |
| **Empty states** | Intentional `EmptyState` or equivalent on list/grid zero-data | Constitution Rule 6 |
| **Global trash** | User deletes use `trashedAt` + trash integration where applicable | Module contract |

### L2 primitives map

| Pattern | Canonical implementation |
|---------|-------------------------|
| Workspace split | `WorkspaceSplitLayout` |
| Platform chrome | `PlatformShell` + `PlatformHeader` |
| Management page header | `PageHeader` |
| Management toolbar | `PageToolbar` |
| Destructive confirm | `ConfirmModal` |
| Folder/create forms | Modal + `Input` (e.g. `DriveCreateFolderModal`) |
| Context actions | `ContextMenu` |
| Sidebar “New” | `DropdownMenu` |
| Filter panels | `Popover` |

### Reference examples (Drive L2)

- Menus: 3A-3 (`ContextMenu`, `Popover`, `DropdownMenu`)
- Layout: 3C-2 all Drive routes on `WorkspaceSplitLayout`
- Modals: 2A/2B ConfirmModal program

---

## UX-L3 — Reference-grade experience

**Goal:** Module is safe to cite as the **copy target** for interaction, accessibility, and cross-module behavior.

### Required criteria (in addition to L2)

| Area | Requirement |
|------|-------------|
| **Interaction consistency** | All soft-delete paths (menu, details, bulk, keyboard, drag, HTML5 drop where applicable) share one confirm gate |
| **Keyboard support** | Documented shortcuts implemented or help text trimmed; primary actions keyboard-reachable |
| **Accessibility audit** | Documented a11y review; known gaps listed with severity — no undocumented P0 a11y failures |
| **Mobile verification** | Manual QA matrix includes 375px pass on core flows |
| **Cross-module integration** | Trash, notifications, realtime, and global search behave correctly across tenant boundaries |
| **Workflow completion** | Primary user journeys (create → edit → share → archive/delete) completable without dead ends |
| **Certification artifact** | Filled scorecard + module certification doc in `docs/ux/audits/` |
| **Recertification plan** | Documented when re-audit required (major UI refactor, new destructive flows) |

### Reference examples (Drive L3)

- Full 3B interaction program (3B-1 through 3B-6)
- [`DRIVE_INTERACTION_CERTIFICATION.md`](./audits/DRIVE_INTERACTION_CERTIFICATION.md)
- [`DRIVE_INTERACTION_MANUAL_QA_MATRIX.md`](./audits/DRIVE_INTERACTION_MANUAL_QA_MATRIX.md)

---

## Certification outcomes

Scored via [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md):

| Outcome | Meaning |
|---------|---------|
| **Certified** | Meets target level; all categories PASS |
| **Certified with Findings** | Meets target level; one or more PASS WITH FINDINGS; no FAIL |
| **Not certified** | Any category FAIL or below level threshold |

**Reference Module designation** requires L3 **Certified with Findings** minimum and program registration — see [`REFERENCE_MODULE_PROGRAM.md`](./REFERENCE_MODULE_PROGRAM.md).

---

## Audit process (summary)

1. **Inventory** — Routes, hubs, destructive flows, layout shell, menus (module-specific review doc).
2. **Remediate** — Implementation waves before certification when gaps are P0/P1.
3. **Score** — Apply scorecard categories; record PASS / PASS WITH FINDINGS / FAIL.
4. **Decide** — Certified / Certified with Findings / Not certified.
5. **Register** — Reference modules recorded in `docs/ux/audits/REFERENCE_MODULE_*.md`.
6. **Maintain** — Recertify after material UX changes.

**Template:** [`UX_AUDIT_TEMPLATE.md`](./UX_AUDIT_TEMPLATE.md)

---

## Relationship to waves

| Wave program | Typical level unlocked |
|--------------|------------------------|
| Wave 1–2 (tokens, modals) | L1–L2 foundation |
| Wave 3A (menus) | L2 menus |
| Wave 3B (Drive interaction) | L3 interaction (Drive) |
| Wave 3C (layout shells) | L2 layout |
| **Wave 5A (this doc)** | Certification framework |
| Wave 5B+ (per-module) | L1/L2/L3 awards |

---

## Related

- [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md)
- [`REFERENCE_MODULE_PROGRAM.md`](./REFERENCE_MODULE_PROGRAM.md)
- [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03 (Wave 5A)
