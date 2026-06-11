# Vssyl UX Certification Scorecard

**Status:** Wave 5A framework (2026-06-03)  
**Supersedes:** Wave 0 numeric 0–5 rubric (preserved in [Appendix A](#appendix-a-legacy-numeric-rubric-wave-0))  
**Standard:** [`UX_CERTIFICATION_STANDARD.md`](./UX_CERTIFICATION_STANDARD.md)  
**Benchmark:** Drive / File Hub — [`audits/REFERENCE_MODULE_DRIVE.md`](./audits/REFERENCE_MODULE_DRIVE.md)

---

## How to use

1. Copy category table into a module audit (`docs/ux/audits/[MODULE]_UX_SCORECARD.md`).
2. Rate each category: **PASS**, **PASS WITH FINDINGS**, or **FAIL**.
3. Document findings with ID, severity, and remediation wave.
4. Apply level thresholds below for L1 / L2 / L3 / Reference designation.

**Worksheet:** [`UX_AUDIT_TEMPLATE.md`](./UX_AUDIT_TEMPLATE.md)

---

## Category ratings

| Rating | Definition |
|--------|------------|
| **PASS** | Meets standard for target level; no material gaps |
| **PASS WITH FINDINGS** | Meets bar; documented exceptions or pending human verification |
| **FAIL** | Violates standard; blocks certification at target level |

---

## Scoring categories

| # | Category | What to evaluate |
|---|----------|------------------|
| 1 | **Interaction Consistency** | Confirm gates, trash flows, bulk actions, drag/DnD, keyboard deletes, feedback on success/failure |
| 2 | **Layout Consistency** | Approved archetype; `WorkspaceSplitLayout` / `PlatformShell` / `PageHeader`+`PageToolbar` as appropriate |
| 3 | **Navigation** | Hub landing, sidebar, breadcrumbs, deep links, context switch (personal/business) |
| 4 | **Accessibility** | Labels, focus, keyboard paths, modal escape, contrast baseline, screen reader on primary flows |
| 5 | **Mobile** | 375px usability; touch targets; overflow; responsive shell behavior |
| 6 | **Cross-Module Integration** | Global trash, notifications, realtime, search, V_Link — no tenant leaks |
| 7 | **Error Handling** | API failures surfaced; retry or clear messaging; no silent errors on primary actions |
| 8 | **Empty States** | Intentional empty UI with guidance and optional CTA |
| 9 | **Loading States** | Initial load, action-in-progress, skeleton/spinner patterns |
| 10 | **Discoverability** | Primary actions visible; shortcuts documented match implementation; module entry obvious |
| 11 | **Workflow Completion** | End-to-end journeys completable (create → manage → archive/delete) without dead ends |

---

## Level thresholds

### UX-L1 — Certified

| Rule | Threshold |
|------|-----------|
| Categories | **No FAIL** in categories 1, 3, 4, 7 |
| Minimum PASS | At least **8 of 11** categories PASS |
| PASS WITH FINDINGS | Allowed in categories 5, 6, 8, 9, 10, 11 |
| Blockers | Zero native `prompt()`/`confirm()` on user paths; destructive actions confirmed |

### UX-L1 — Certified with Findings

Same as L1 Certified, but **3+** categories PASS WITH FINDINGS — findings must be documented with owner wave.

### UX-L2 — Certified

| Rule | Threshold |
|------|-----------|
| Prerequisite | UX-L1 Certified (or Certified with Findings) |
| Categories | **No FAIL** in categories 1, 2, 3, 5, 7, 8, 9 |
| Minimum PASS | At least **9 of 11** categories PASS |
| Layout + primitives | Categories 2 and 5 must be **PASS** or **PASS WITH FINDINGS** (not FAIL) |
| Menus | Category 1 includes menu primitive compliance |

### UX-L2 — Certified with Findings

L2 bar met; **2+** categories PASS WITH FINDINGS — typically mobile, a11y, or cross-module edges.

### UX-L3 — Certified

| Rule | Threshold |
|------|-----------|
| Prerequisite | UX-L2 Certified |
| Categories | **No FAIL** in any category |
| Minimum PASS | At least **9 of 11** categories **PASS** (not merely PASS WITH FINDINGS) |
| Core quartet | Categories **1, 2, 4, 11** must be **PASS** |
| Evidence | Manual QA matrix executed or explicitly waived by product |

### UX-L3 — Certified with Findings

L3 bar met; up to **2** categories may be PASS WITH FINDINGS if documented and non-blocking (e.g. mobile QA pending, advisory product stubs).

### Reference Module designation

| Rule | Threshold |
|------|-----------|
| Prerequisite | **UX-L3 Certified with Findings** minimum |
| Program | Registered per [`REFERENCE_MODULE_PROGRAM.md`](./REFERENCE_MODULE_PROGRAM.md) |
| Benchmark role | At least one category scored PASS at reference quality with audit rationale |
| Council | Product + engineering sign-off on registration doc |

**Current Reference UX Module #1:** Drive — see [`audits/REFERENCE_MODULE_DRIVE.md`](./audits/REFERENCE_MODULE_DRIVE.md).

---

## Certification decision matrix

| Scorecard result | Level awarded | Reference eligible? |
|------------------|---------------|---------------------|
| All PASS at L1 bar | UX-L1 Certified | No |
| L1 bar + findings | UX-L1 Certified with Findings | No |
| All PASS at L2 bar | UX-L2 Certified | No |
| L2 bar + findings | UX-L2 Certified with Findings | No |
| L3 bar all PASS | UX-L3 Certified | Yes (pending registration) |
| L3 bar + ≤2 findings | UX-L3 Certified with Findings | Yes (Drive model) |
| Any FAIL below bar | Not certified | No |

---

## Drive benchmark quick reference

Use Drive audits when scoring other modules:

| Category | Drive evidence |
|----------|----------------|
| Interaction | 3B-1–3B-5 closeouts |
| Layout | 3C-2 `WorkspaceSplitLayout` |
| Navigation | `DriveSidebar`, business hub |
| Accessibility | 3B-5 keyboard + trash a11y |
| Menus | 3A-3 closeout |
| Workflow | [`DRIVE_INTERACTION_MANUAL_QA_MATRIX.md`](./audits/DRIVE_INTERACTION_MANUAL_QA_MATRIX.md) |

---

## Appendix A — Legacy numeric rubric (Wave 0)

Preserved for historical audits. **New certifications use PASS / PASS WITH FINDINGS / FAIL only.**

| Score | Meaning |
|-------|---------|
| 0–5 per category | See Wave 0 definitions (tokens, typography, color, layout, components, interaction, a11y, dark, responsive, polish) |

**Legacy thresholds:** L1 avg ≥3.0; L2 avg ≥3.8; L3 avg ≥4.2 — superseded by category PASS rules above.

---

## Related

- [`UX_CERTIFICATION_STANDARD.md`](./UX_CERTIFICATION_STANDARD.md)
- [`REFERENCE_MODULE_PROGRAM.md`](./REFERENCE_MODULE_PROGRAM.md)
- [`audits/DRIVE_REFERENCE_UX_SCORECARD.md`](./audits/DRIVE_REFERENCE_UX_SCORECARD.md) (3B-6 pre-5A module scorecard)

**Last updated:** 2026-06-03 (Wave 5A)
