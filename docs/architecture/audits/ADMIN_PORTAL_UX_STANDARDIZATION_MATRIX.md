# Admin Portal UX Standardization Matrix

**Program:** Stage 1A  
**Date:** 2026-06-18

---

## Finding → pattern matrix

| Finding | Required pattern | Implementation | Status |
|---------|------------------|----------------|--------|
| AP-F-023 | UX Constitution `v-*` tokens | Bulk migration + `AdminPortalPageShell` | **Closed** |
| AP-F-024 | `EmptyState` / `AdminPortalEmptyState` | 9+ surfaces migrated | **Closed** |
| AP-F-025 | `ConfirmModal` / `useConfirm` | 7 destructive flows migrated | **Closed** |
| AP-F-026 | No `window.confirm` | All native confirms replaced | **Closed** |

---

## Confirm migration matrix

| File | Action | Pattern |
|------|--------|---------|
| `seed-modules/page.tsx` | Seed core modules | `useConfirm` |
| `overrides/page.tsx` | Grant/revoke admin, set tier | `useConfirm` (destructive for revoke) |
| `system-logs/page.tsx` | Delete alert | `useConfirm` destructive |
| `PipelineIntentRegistrySection.tsx` | Archive intent | `useConfirm` destructive |
| `users/page.tsx` | Start impersonation | `ConfirmModal` |
| `impersonate/page.tsx` | View user dashboard | `ConfirmModal` |
| `modules/page.tsx` | Promote version | `ConfirmModal` destructive |

---

## Empty state matrix

| File | Context |
|------|---------|
| `PipelineTraceTable.tsx` | No diagnostics traces |
| `PipelinePolicyAuditTable.tsx` | No policy changes |
| `PipelineHealthMetrics.tsx` | No quality metrics |
| `PipelineQualityDashboard.tsx` | Empty diagnostics sections |
| `analytics/page.tsx` | No recent activity |
| `dashboard/page.tsx` | No recent activity |
| `developers/page.tsx` | No payouts |
| `testing/page.tsx` | No test files |
| `BusinessAIGlobalDashboard.tsx` | Patterns / insights |

---

## Token migration matrix

| Layer | Files touched | Replacements |
|-------|---------------|--------------|
| App pages | 27+ | ~800 |
| Admin components | 31+ | ~850 |
| Shell | `layout.tsx`, `PipelineSubpageShell.tsx`, `AdminStatCard.tsx` | Manual + bulk |

**Registry:** `AdminPortalPageShell.tsx`, `AdminPortalEmptyState.tsx`

---

## Test coverage

| Test file | Assertions |
|-----------|------------|
| `adminPortalUxShell.test.ts` | No native confirm; ConfirmModal adoption; EmptyState count; layout tokens; docs exist |

---

**Last updated:** 2026-06-18
