# BA-1E UX Shell Audit

**Phase:** BA-1E — UX Modernization  
**Date:** 2026-06-18  
**Reference:** [BUSINESS_ADMINISTRATION_UX_AUDIT.md](./BUSINESS_ADMINISTRATION_UX_AUDIT.md) (Phase 0B baseline)

---

## Scope

Business Administration configuration surfaces under:

- `web/src/components/business/**`
- `web/src/components/org-chart/**`
- `web/src/app/business/[id]/org-chart`, `branding`, `modules`, `profile`
- `web/src/app/business/[id]/workspace/settings`, `workspace/modules`
- `web/src/app/business/create`

**Out of scope:** HR admin pages (`/admin/hr/**`), employee self-service HR views — BO UX program.

---

## Pre BA-1E findings (BA-F-007)

| Issue | Baseline | Severity |
|-------|----------|----------|
| Native `confirm()` / `prompt()` | 8 files, 11+ sites | UX-L1 FAIL |
| Token drift (`gray-*`) | ~1,284 occurrences in BA tree | FAIL |
| EmptyState | 0 canonical adoption | FAIL |
| Modal inconsistency | `ConfirmModal` on 1 org-chart flow only | FAIL |

---

## Post BA-1E disposition

| Surface | Native dialogs | Tokens | EmptyState | Modal pattern |
|---------|----------------|--------|------------|---------------|
| `EmployeeManager` | **PASS** — `useConfirm` | v-* migrated | `BusinessAdminEmptyState` ×2 | `ConfirmDialog` |
| `PermissionManager` | **PASS** — `useConfirm` + `Modal` copy | v-* migrated | `BusinessAdminEmptyState` ×2 | `Modal` + `ConfirmDialog` |
| `OrgChartBuilder` | **PASS** — existing `ConfirmModal` | v-* migrated | `BusinessAdminEmptyState` ×3 | `ConfirmModal` |
| `GlobalBrandingEditor` | **PASS** — `useConfirm` | v-* migrated | N/A | `ConfirmDialog` |
| `FrontPageThemeCustomizer` | **PASS** — `useConfirm` | v-* migrated | N/A | `ConfirmDialog` |
| `branding/page.tsx` | **PASS** — `useConfirm` | v-* migrated | Deferred widget list | `ConfirmDialog` |
| `modules/page.tsx` | **PASS** — `useConfirm` | v-* migrated | `BusinessAdminEmptyState` ×2 | `ConfirmDialog` |
| `StationsAndPositionsEditor` | **PASS** — `useConfirm` | v-* migrated | Deferred (table-driven) | `ConfirmDialog` + existing `Modal` |
| `WebhookSubscriptionsShell` | **PASS** — none needed | v-* migrated | `BusinessAdminEmptyState` | N/A |
| `BusinessAIControlCenter` | **PASS** — none needed | v-* migrated | `BusinessAdminEmptyState` (insights) | Deferred tab empties |

---

## Deferred (documented, not BA-1E blockers)

| Item | Reason | Package |
|------|--------|---------|
| `BusinessAIControlCenter` tab-level empty paragraphs | Low-risk strings; main insights empty migrated | BA-2 hygiene |
| `workspace/settings/page.tsx` per-tab error boundaries | UX-R-006 — settings shell breadth | BA-2 |
| `StationsAndPositionsEditor` file ownership | BO overlap (BA-F-009) | BO program |
| Badge semantic colors (`blue-600`, `green-600`) | Intentional status accents | PASS WITH FINDINGS |
| HR routes under `/business/[id]/admin/hr` | Out of BA-1E scope | BO UX |

---

## G9 scorecard (BA surfaces)

| Category | Pre | Post |
|----------|-----|------|
| Native confirm/prompt | **FAIL** | **PASS** |
| EmptyState adoption | **FAIL** | **PASS** (10+ surfaces) |
| Token compliance | **FAIL** | **PASS WITH FINDINGS** |
| Modal consistency | **FAIL** | **PASS** |
| **G9 (BA scope)** | **1/3** | **3/3** |

---

## Related

- [BA_1E_UX_STANDARDIZATION_MATRIX.md](./BA_1E_UX_STANDARDIZATION_MATRIX.md)
- [BA_1E_IMPLEMENTATION_REPORT.md](./BA_1E_IMPLEMENTATION_REPORT.md)
