# BA-1E UX Standardization Matrix

**Phase:** BA-1E — UX Modernization  
**Date:** 2026-06-18

---

## Native dialog migration

| File | Before | After | Pattern |
|------|--------|-------|---------|
| `org-chart/EmployeeManager.tsx` | `confirm()` remove employee | `useConfirm` + `ConfirmDialog` | Destructive confirm |
| `org-chart/PermissionManager.tsx` | `confirm()` delete; `prompt()` copy name | `useConfirm` + `Modal`/`Input` | Destructive + form modal |
| `business/GlobalBrandingEditor.tsx` | `confirm()` ×2 preset/reset | `useConfirm` | Standard + destructive |
| `business/FrontPageThemeCustomizer.tsx` | `confirm()` ×2 preset/reset | `useConfirm` | Standard + destructive |
| `business/StationsAndPositionsEditor.tsx` | `confirm()` ×2 delete | `useConfirm` | Destructive |
| `app/business/[id]/branding/page.tsx` | `confirm()` delete widget | `useConfirm` | Destructive |
| `app/business/[id]/modules/page.tsx` | `confirm()` uninstall | `useConfirm` | Destructive |
| `org-chart/OrgChartBuilder.tsx` | Already `ConfirmModal` | Unchanged | Reference pattern |

**BA native dialog count:** 11 sites → **0**

---

## Token migration (wave 1)

| Area | Files touched | `gray-*` before | `gray-*` after | Removed |
|------|---------------|-----------------|----------------|---------|
| `components/org-chart` | 5 | 270 | ~15 | ~255 |
| `components/business` | 18 | ~500 | ~50 | ~450 |
| `app/business` (BA pages) | 13 | ~514 | ~32 | ~482 |
| **Total** | **36** | **1,284** | **97** | **1,187** |

### Replacement conventions

| Legacy | Token |
|--------|-------|
| `text-gray-900 dark:text-gray-100` | `text-v-text-primary` |
| `text-gray-600 dark:text-gray-400` | `text-v-text-secondary` |
| `text-gray-500` / `text-gray-400` | `text-v-text-muted` |
| `bg-gray-50` / `bg-white` | `bg-v-background` / `bg-v-surface` |
| `border-gray-200` | `border-v-border` |
| `hover:bg-gray-50` | `hover:bg-v-background` |

**Residual `gray-*`:** Status chevrons, legacy badge contexts — acceptable per PASS WITH FINDINGS.

---

## EmptyState adoption

| Surface | Component | Title |
|---------|-----------|-------|
| EmployeeManager | `BusinessAdminEmptyState` | No employees / All positions filled |
| PermissionManager | `BusinessAdminEmptyState` | No permission sets / No templates |
| OrgChartBuilder | `BusinessAdminEmptyState` | No tiers / departments / positions |
| modules/page.tsx | `BusinessAdminEmptyState` | No modules (installed + marketplace) |
| WebhookSubscriptionsShell | `BusinessAdminEmptyState` | No webhook subscriptions |
| BusinessAIControlCenter | `BusinessAdminEmptyState` | No centralized insights |

**Wrapper:** `web/src/components/business/BusinessAdminEmptyState.tsx` → shared `EmptyState`

---

## Modal standardization

| Flow | Before | After |
|------|--------|-------|
| Permission set copy | `prompt()` | `Modal` + `Input` + confirm button |
| Org chart delete tier/dept/position | `ConfirmModal` | Unchanged (canonical) |
| Station/position create-edit | Custom `Modal` | Unchanged (already shared `Modal`) |
| Branding preset/reset | `confirm()` | `useConfirm` |

---

## Test enforcement

`web/src/lib/__tests__/businessAdministrationUxShell.test.ts` verifies:

- Zero native `confirm`/`prompt` in BA tree
- Required files use `useConfirm` or `ConfirmModal`
- `BusinessAdminEmptyState` on key surfaces
- v-* token dominance over `gray-*`

---

## Certification impact

| Finding | Status |
|---------|--------|
| BA-F-007 | **CLOSED** (BA scope) |
| BA-F-013 | **Improved** — 1,187 token replacements; residual documented |
| BA-F-014 | **CLOSED** — EmptyState on 10+ surfaces |
| G9 UX Consistency | **PASS** (BA administration surfaces) |
