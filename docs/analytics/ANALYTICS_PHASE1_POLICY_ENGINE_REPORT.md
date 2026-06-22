# Analytics Capability Phase 1 — Policy Engine Report

**Program:** Analytics Capability Phase 1 — Federated L2 Trust & Service Boundary  
**Date:** 2026-06-22  
**Status:** Complete

---

## 1. Policy actions introduced (K1-03)

| Action | Constant | Purpose |
|--------|----------|---------|
| `analytics:read` | `POLICY_ACTIONS.ANALYTICS_READ` | Canonical capability reads + export |
| `analytics:admin` | `POLICY_ACTIONS.ANALYTICS_ADMIN` | Business admin / platform admin operator paths |

**File:** `server/src/auth/policyActions.ts`

---

## 2. Authorizers

### `authorizeAnalyticsRead`

| Operation (metadata) | Policy behavior |
|---------------------|-----------------|
| `personal`, `export` | Self-only (`resourceId === userId`); deny `NOT_OWNER` otherwise |
| `module` | Authenticated read (`analytics_module_read_authenticated`) |
| `dashboard_summary` | Delegates to `authorizeDashboardRead` with dashboard resource |
| *(default)* | Authenticated read |

### `authorizeAnalyticsAdmin`

| Scope | Policy behavior |
|-------|-----------------|
| `businessId` present | Active member; `ADMIN` or `MANAGER` → allow |
| No business scope | Platform `user.role === 'ADMIN'` → allow |
| Otherwise | `INSUFFICIENT_ROLE` / `NOT_MEMBER` |

**File:** `server/src/auth/policyEngine.ts`

---

## 3. Dual enforcement layer

`evaluateAnalyticsPolicyDual` mirrors dashboard dual pattern:

- Calls central `authorize()`
- **Blocks** on security deny reasons: `INSUFFICIENT_ROLE`, `TENANT_MISMATCH`, `NOT_OWNER`, `NOT_MEMBER`
- Logs structured warn on deny
- Non-security denies may pass through (delegation compatibility)

**File:** `server/src/auth/analyticsPolicyDual.ts`

**Wired in:**

- `analyticsCapabilityService.assertAnalyticsRead`
- `analyticsDashboardSummaryService` (dashboard summary path)

---

## 4. Route coverage (PE parity)

| Route | Action | Operation metadata | Phase 1 |
|-------|--------|-------------------|---------|
| `GET /api/analytics/personal` | `analytics:read` | `personal` | ✅ |
| `GET /api/analytics/modules/:moduleId` | `analytics:read` | `module` | ✅ |
| `GET /api/analytics/export` | `analytics:read` | `export` | ✅ |
| `GET /api/analytics/dashboard-summary` | `analytics:read` | `dashboard_summary` | ✅ |

**Pre-Phase 1 gap:** Only dashboard-summary used dashboard PE; personal/module/export were ungated or ad hoc.

---

## 5. Tests

| Test file | Coverage |
|-----------|----------|
| `server/src/auth/__tests__/policyEngine.test.ts` | `analytics:read`, `analytics:admin` authorizers |
| `server/src/auth/__tests__/analyticsPolicyDual.test.ts` | Dual allow/block paths |
| `server/src/services/analytics/__tests__/analyticsCapabilityService.test.ts` | Service denies on policy block |
| `server/src/services/analytics/__tests__/analyticsDashboardSummaryService.test.ts` | Summary denies on policy block |

---

## 6. AN-03 closure

**Finding:** PE gap on 3/4 capability routes  
**Status:** **Closed** — all canonical routes gated via `analytics:read` + dual enforcement

---

**Last updated:** 2026-06-22
