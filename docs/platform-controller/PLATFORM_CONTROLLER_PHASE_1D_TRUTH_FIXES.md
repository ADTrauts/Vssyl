# Platform Controller Phase 1D — Operational Truth Fixes

**Program:** Platform Controller Program  
**Phase:** 1D  
**Date:** 2026-06-25  
**Status:** **COMPLETE**

---

## Objective

Remove misleading operational signals from Platform Controller without new features, UI redesign, or unrelated API refactors.

---

## Changes implemented

### G-003 — Security module metrics

| Before | After |
|--------|-------|
| `Math.random()` for violations, alerts, compliance, threat | Real `securityEvent` unresolved counts |
| Fabricated compliance score 80–100 | `complianceScore: null`, `complianceScoreStatus: requires_instrumentation` |
| Random threat level | Derived from unresolved critical/high events, or `unknown` |

**Files:**
- `server/src/services/admin/adminSecurityService.ts` — `getAdminSecurityModuleMetrics`
- `server/src/routes/adminSecurityRoutes.ts` — `GET /module-metrics` (distinct from platform `/security/metrics` events API)
- `web/src/components/admin/SecurityDashboard.tsx` — uses `/module-metrics`, shows "Unavailable" / "Requires instrumentation"

### G-001 — Billing subscription amounts

| Before | After |
|--------|-------|
| `amount: 0` when unknown | `amount: null`, `amountStatus: 'unknown'` |
| Summary from `additionalEmployeeCost` | Sum of known Stripe metadata item totals |
| UI shows `$0` | UI shows **Unavailable** or **Free** |

**Files:**
- `server/src/services/admin/subscriptionDisplayAmount.ts` — resolver + tests
- `server/src/services/admin/adminBillingService.ts` — summary uses known totals
- `server/src/routes/admin-portal/adminPortalRoutes.analyticsOps.ts` — `amount` + `amountStatus` on list
- `web/src/lib/subscriptionAmountDisplay.ts` — formatter
- `web/src/app/admin-portal/billing/page.tsx` — truthful display + unknown count note

**Stripe metadata shape:** sums `stripeMetadata.items[].amount * quantity` after sync.

### G-004–G-006 — Platform Programs hub copy

| Program | New operational signal label |
|---------|------------------------------|
| Platform Kernel | Infrastructure pressure (host CPU/memory — not kernel SLO) |
| AI Retrieval | Pipeline quality (7d) |
| Context Graph | Registered sources (catalog count — not graph health) |
| Marketplace | Review queue (not partner runtime health) |

**Files:**
- `web/src/components/admin-portal/usePlatformProgramsHubHealth.ts`
- `web/src/components/admin-portal/PlatformProgramCard.tsx` — badge "Within threshold" / "Needs attention"; section "Operational signal"

Also: hub now surfaces `readinessRes.error` in error state (G-019).

---

## Guard tests

| Test file | Guards |
|-----------|--------|
| `server/src/services/admin/__tests__/subscriptionDisplayAmount.test.ts` | Resolver semantics |
| `web/src/lib/__tests__/platformControllerPhase1D.test.ts` | No `Math.random` in admin services; billing route/page; honest program copy |

---

## Acceptance criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Random security metrics removed or unavailable | ✅ |
| 2 | Billing amounts no longer false $0 | ✅ |
| 3 | Free subscriptions still show Free/$0 | ✅ |
| 4 | Platform Program labels truthful | ✅ |
| 5 | Tests pass | ✅ |
| 6 | Documentation updated | ✅ |

---

## Explicitly not done (out of scope)

- Full Stripe revenue redesign
- New security instrumentation platform
- Dashboard revenue including module + tier unified MRR
- UI redesign beyond copy and display semantics

---

## Gap register updates

| ID | Status after 1D |
|----|-----------------|
| G-001 | **Resolved** (display + API; prod Stripe sync still ops responsibility) |
| G-003 | **Resolved** |
| G-004 | **Resolved** (copy) |
| G-005 | **Resolved** (copy) |
| G-006 | **Resolved** (copy) |
| G-019 | **Resolved** |

---

**Last updated:** 2026-06-25
