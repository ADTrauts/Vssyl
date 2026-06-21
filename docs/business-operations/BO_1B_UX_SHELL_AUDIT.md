# BO-1B UX Shell Audit

**Program:** Business Operations BO-1B  
**Date:** 2026-06-19  
**Scope:** Scheduling · HR · Workforce Communications

---

## A. Native dialog inventory

| Module | Before | After |
|--------|--------|-------|
| Scheduling | **10** (9× `confirm`, 1× `prompt`) | **0** |
| HR | 0 | 0 |
| Workforce Communications | 0 | 0 |
| **Total** | **10** | **0** |

### Scheduling sites remediated

| File | Pattern | Replacement |
|------|---------|-------------|
| `SchedulingAdminContent.tsx` | 4× confirm | `useConfirm` |
| `ScheduleBuilderVisual.tsx` | 1× confirm | `useConfirm` |
| `TemplateBuilderVisual.tsx` | 1× confirm | `useConfirm` |
| `ShiftBlock.tsx` | 1× confirm | `useConfirm` |
| `AvailabilityManagement.tsx` | 1× confirm | `useConfirm` |
| `SchedulingEmployeeContent.tsx` | 1× confirm, 1× prompt | `useConfirm` + `Modal` |
| `OpenShiftsList.tsx` | custom Modal confirm | `ConfirmModal` |

---

## B. EmptyState audit

### Before

Ad hoc empty UI: inline `<p>`, centered cards, icon + text without shared component.

### After — surfaces migrated (12)

| Module | Surface |
|--------|---------|
| Scheduling | `OpenShiftsList`, `SchedulingEmployeeContent` (×2), `SchedulingAdminContent` analytics |
| Workforce Comms | `CommunicationList`, `CampaignManager`, `WorkforceCommsFeed`, `CommunicationAnalyticsPanel`, `CampaignAnalyticsPanel`, `AckComplianceDashboard` |
| HR | `EmployeeOnboardingJourneyView`, `TeamOnboardingTaskList` |

**Wrapper:** `web/src/components/business-operations/BusinessOperationsEmptyState.tsx` (delegates to shared `EmptyState`).

---

## C. Token audit

| Metric | Before BO-1B | After BO-1B |
|--------|--------------|-------------|
| `gray-*` occurrences (3 module trees) | ~762 | **31** |
| `v-*` token occurrences | 0 | **762+** |
| Files token-migrated | — | **56** (+ manual touch-ups) |

**Migration tool:** `scripts/bo-1b-token-migrate.mjs` (common gray → v-* mappings).

### Remaining exceptions (31 `gray-*` hits)

| Category | Examples | Rationale |
|----------|----------|-----------|
| Semantic status colors | `bg-green-100`, `bg-yellow-100`, `bg-red-100` on shift badges | Status semantics — not neutral UI chrome |
| Availability type chips | `border-green-300`, `text-green-800` in `AvailabilityManagement` | Domain-coded availability states |
| Progress / chart accents | occasional `purple-500`, `blue-700` links | Data visualization / legacy accent (advisory) |

---

## D. Modal standardization

| Flow | Before | After |
|------|--------|-------|
| Open shift claim | Custom `Modal` + manual buttons | `ConfirmModal` |
| Swap request notes | `prompt()` | `Modal` + `Textarea` |
| Destructive deletes (scheduling) | `confirm()` | `useConfirm` / `ConfirmModal` |
| WC publish/trash | Already `ConfirmModal` | Unchanged (compliant) |

---

## E. Regression tests

**File:** `web/src/lib/__tests__/businessOperationsUxShell.test.ts`

| Test | Purpose |
|------|---------|
| No native confirm/prompt | Blocks regression to browser dialogs |
| Destructive flows use ConfirmModal/useConfirm | Modal contract |
| Swap notes Modal (no prompt) | Prompt elimination |
| EmptyState adoption (≥10 surfaces) | Empty state bar |
| v-* dominates gray-* (3× ratio) | Token compliance |
| BO-1B docs exist | Deliverable gate |

---

## Finding disposition

| ID | Status |
|----|--------|
| **BO-F-D05** | **Closed** — domain UX shell standard via `BusinessOperationsEmptyState` + ConfirmModal/useConfirm bar |
