# PP-3 — Foundation Status

**Program:** Account Platform — Foundation Checkpoint (post PP-1 / PP-2 / PP-3 Package 1)  
**Date:** 2026-06-20  
**Status:** Governance review only — no implementation

**Baseline:** [PP3_PACKAGE1_IMPLEMENTATION_REPORT.md](./PP3_PACKAGE1_IMPLEMENTATION_REPORT.md) · [PP3_STATUS_REVIEW.md](./PP3_STATUS_REVIEW.md)

---

## Foundation completion

PP-3 **Package 1 (Entitlement Foundation)** is **complete** per charter exit criteria.

| Artifact | Status |
|----------|--------|
| `entitlementService` | ✅ Single resolver entry point |
| `Subscription.tier` authoritative write path | ✅ |
| `Business.tier` consumer/cache model | ✅ (writes); transitional read fallback |
| Entitlement read APIs (`/api/account/*`) | ✅ |
| Feature gating alignment (3 primary paths) | ✅ Partial |
| `entitlement:read` / `entitlement:write` PE | ✅ |
| Activity + domain event foundation | ✅ Admin authority path |
| Tests | ✅ 14 passing |

**Explicitly not delivered (by design):** `billingService`, `/api/payment` retirement, billing UX, Stripe webhook → entitlement sync, full certification.

---

## Findings register

### Closed

| ID | Severity | Finding |
|----|----------|---------|
| **PP3-F01** | Blocking | No entitlement SoR / `entitlementService` |
| **PP3-F04** | Major | Admin override writes `Business.tier` only |

### Partially closed

| ID | Severity | Finding | Remaining gap |
|----|----------|---------|---------------|
| **PP3-F02** | Blocking | Tier enum drift | Canonical enum + `normalizeTier()`; legacy vocabulary + data migration deferred |
| **PP3-F05** | Major | No PE/activity on subscription mutations | Admin path only; checkout/webhooks not wrapped |
| **PP3-F07** | Major | Gating fragmentation | Tier input unified; HR matrix + orphan `featureGatingService.simplified.ts` remain |

### Open (blocking for PP-3 certification)

| ID | Severity | Finding | Package 2 target? |
|----|----------|---------|-------------------|
| **PP3-F03** | Blocking | Dual `/api/billing` + `/api/payment` | **Yes** — primary Package 2 deliverable |

### Open (major — Package 2 scope)

| ID | Finding |
|----|---------|
| PP3-F06 | Fat `billingController` + inline Prisma |
| PP3-F08 | Modal-only billing UX |

### Open (advisory)

| ID | Finding |
|----|---------|
| PP3-F09 | Orphan `featureGatingService.simplified.ts` |
| PP3-F10 | No product trial flow |
| PP3-F11 | `subscriptionService` `standard` vs checkout `pro` vocabulary |
| PP3-F12 | Legacy `web/src/api/payment.ts` still active |

---

## G1–G9 readiness estimate (entitlements slice)

| Gate | Pre Package 1 | Post Package 1 | Notes |
|------|-------------|----------------|-------|
| G1 Authorization | 2 | **3** | `entitlement:read/write` |
| G2 Auditability | 1 | **2** | Foundation events; billing flows absent |
| G3 Service boundaries | 2 | **3** | `entitlementService` canonical |
| G4 API coherence | 1 | **3** | `/api/account/*`; dual billing APIs remain |
| G5 Ownership | 1 | **3** | Subscription SoR documented + enforced on admin path |
| G6 Test evidence | 2 | **3** | Resolver + route tests |
| G7 Documentation | 1 | **3** | Architecture + ownership + implementation report |
| G8 Production safety | 2 | **2** | Tier drift reduced; not eliminated in all consumers |
| G9 UX consistency | 1 | **1** | Modal-only billing UX |
| **Total** | **~12/27 (~44%)** | **~23/27 (~85%)** | F03 blocks full L3 cert |

---

## PP-3 readiness determination

| Dimension | Status |
|-----------|--------|
| **Package 1 charter** | ✅ Complete |
| **Entitlement SoR** | ✅ Established |
| **PP-2 dependency (SOFT READ)** | ✅ Met — `/api/account/tier` available |
| **Package 2 authorized?** | ✅ **Yes** — PP-2 foundation gate satisfied per Option C |
| **L3 certification** | ❌ Not ready — F03 (dual APIs), F02 partial, billing PE/events incomplete |

---

## Consumers not yet on entitlementService (Package 2)

| Consumer | Target |
|----------|--------|
| `usageTrackingService` | Package 2 |
| `aiQueryService` | Package 2 |
| `subscriptionService` (tier vocabulary) | Package 2 |
| Billing checkout / Stripe webhooks | Package 2 |
| `featureGatingService.simplified.ts` | Archive (advisory) |

---

**Last updated:** 2026-06-20 (Foundation Reassessment)
