# Analytics Capability Phase 1 — Activity Report

**Program:** Analytics Capability Phase 1 — Federated L2 Trust & Service Boundary  
**Date:** 2026-06-22  
**Status:** Complete

---

## 1. Design principle

Analytics **reads** emit normalized module activity events **after** successful authorization and execution. Failed or unauthorized reads do **not** emit (module interoperability contract).

Activity records describe **that a read occurred** — they are not substitutes for analytics warehouse facts (activity vs analytics separation).

---

## 2. Service

**File:** `server/src/services/analytics/analyticsActivityService.ts`

All events use `emitModuleActivityEvent` with `moduleId: 'analytics'`.

| Function | Action | Trigger |
|----------|--------|---------|
| `recordAnalyticsPersonalView` | `analytics.personal.view` | Successful personal capability read |
| `recordAnalyticsModuleView` | `analytics.module.view` | Successful module capability read |
| `recordAnalyticsDashboardSummaryView` | `analytics.dashboard_summary.view` | Successful dashboard summary read |
| `recordAnalyticsExport` | `analytics.export` | Successful export |

### Visibility scope

- Personal/module/export: `personal`
- Dashboard summary: `personal` | `business` | `household` based on dashboard tenant context

### Metadata

- `timeRange` on personal/module/export
- `degraded` flag on dashboard summary
- `format` on export

---

## 3. Wiring (capability service)

| Capability method | Activity recorded |
|-------------------|-------------------|
| `getPersonalAnalyticsCapability` | `recordAnalyticsPersonalView` |
| `getModuleAnalyticsCapability` | `recordAnalyticsModuleView` |
| `getDashboardSummaryCapability` | `recordAnalyticsDashboardSummaryView` |
| `exportAnalyticsCapability` | `recordAnalyticsExport` |

**File:** `server/src/services/analytics/analyticsCapabilityService.ts`

---

## 4. Personal analytics DTO note (AN-08)

Personal capability still **reads** historical `activity` rows for usage aggregation (derived metrics). Phase 1 adds **distinct analytics read events** so capability consumption is auditable separately from source module activity.

Full separation of personal DTO from raw activity table is a Phase 2+ rollup concern.

---

## 5. Tests

**File:** `server/src/services/analytics/__tests__/analyticsActivityService.test.ts`

- Validates envelope fields (`moduleId`, `action`, `visibilityScope`)
- Export and dashboard summary metadata

---

## 6. AN-08 closure

**Finding:** Activity conflation in personal analytics  
**Status:** **Closed at service layer** — dedicated analytics activity actions on all canonical reads; DTO derivation unchanged (acceptable for L2 federated phase)

---

**Last updated:** 2026-06-22
