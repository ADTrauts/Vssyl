# PP-3 — Status Review (Foundation Checkpoint)

**Program:** Account Platform — PP-3 Package 1 Foundation Checkpoint  
**Date:** 2026-06-20  
**Status:** Governance review only — no implementation

**Baseline:** [PP3_PACKAGE1_IMPLEMENTATION_REPORT.md](./PP3_PACKAGE1_IMPLEMENTATION_REPORT.md) · Phase 0B-3 audit findings

---

## Package 1 completion posture

PP-3 **Package 1 (Entitlement Foundation)** is **complete**:

| Deliverable | Status |
|-------------|--------|
| `entitlementService` | ✅ Single resolver entry point |
| `Subscription.tier` authoritative write path | ✅ |
| `Business.tier` consumer/cache model | ✅ (writes); transitional read fallback |
| Entitlement read APIs (`/api/account/*`) | ✅ |
| Feature gating alignment (3 paths) | ✅ Partial — tier input unified |
| `entitlement:read` / `entitlement:write` PE | ✅ |
| Activity + domain event foundation | ✅ Admin authority path |
| Test suite | ✅ 14 tests passing |

**Explicitly not delivered (by design):** Billing UX, `/api/payment` retirement, `billingService`, Stripe webhook → entitlement sync, full PP-3 certification.

---

## Findings register (post Package 1)

### Closed

| ID | Severity | Finding |
|----|----------|---------|
| **PP3-F01** | Blocking | No entitlement SoR / `entitlementService` |
| **PP3-F04** | Major | Admin override writes `Business.tier` only |

### Partially closed

| ID | Severity | Finding | Remaining gap |
|----|----------|---------|---------------|
| **PP3-F02** | Blocking | Tier enum drift | Canonical enum + `normalizeTier()`; legacy rows + `subscriptionService` `standard` vocabulary; full data migration deferred |
| **PP3-F05** | Major | No PE/activity on subscription mutations | Admin path only; checkout/webhooks not wrapped |
| **PP3-F07** | Major | Gating fragmentation | Tier input unified; HR matrix + orphan `featureGatingService.simplified.ts` remain |

### Open (blocking for PP-3 certification only)

| ID | Severity | Finding | PP-2 blocker? |
|----|----------|---------|---------------|
| **PP3-F03** | Blocking | Dual `/api/billing` + `/api/payment` | **No** — billing API retirement is Package 2 |

### Open (major — Package 2 / remainder)

| ID | Finding |
|----|---------|
| PP3-F06 | Fat `billingController` + inline Prisma |
| PP3-F08 | Modal-only billing UX |
| PP3-F09–F14 | Advisory items (orphan gating file, trial flow, legacy clients, etc.) |

---

## Remaining blockers

| Blocker type | Status |
|--------------|--------|
| PP-2 start (entitlement foundation) | **None** — Package 1 meets SOFT READ dependency |
| PP-3 full L3 certification | **PP3-F03** remains; **PP3-F02** partial |
| Account Platform umbrella cert | **Not in scope** |

---

## PP-2 dependencies (PP-3 → PP-2)

Per [ACCOUNT_PLATFORM_DEPENDENCY_MODEL.md](./ACCOUNT_PLATFORM_DEPENDENCY_MODEL.md):

| Dependency | Type | Status |
|------------|------|--------|
| `entitlementService` for tier-gated settings UI | **SOFT** | ✅ `resolveTier()`, `/api/account/tier` |
| Billing hub IA | **IA** | Deferred to PP-3 Remainder (after PP-2) |
| `/api/payment` retirement | — | **Not required** for PP-2 |

**Conclusion:** PP-3 entitlement foundation is **sufficient** for PP-2. Billing remainder must **wait** until after PP-2 per ratified Option C.

---

## G1–G9 estimate (entitlements slice, post Package 1)

| Gate | Pre P1 | Post P1 | Notes |
|------|--------|---------|-------|
| G1 Authorization | 2 | **3** | `entitlement:read/write` |
| G2 Auditability | 1 | **2** | Foundation events; billing flows absent |
| G3 Service boundaries | 2 | **3** | `entitlementService` canonical |
| G4 API coherence | 1 | **3** | `/api/account/*`; dual billing APIs remain elsewhere |
| G5 Ownership | 1 | **3** | Subscription SoR documented + enforced on admin path |
| G6 Test evidence | 2 | **3** | Resolver + route tests |
| G7 Documentation | 1 | **3** | Architecture + ownership + implementation report |
| G8 Production safety | 2 | **2** | Tier drift reduced; not eliminated in all consumers |
| **Total (entitlements)** | **~12/27 (~44%)** | **~22/27 (~81%)** | L3 WITH FINDINGS path after Package 2 + F03 |

---

## Consumers not yet on entitlementService

| Consumer | Package |
|----------|---------|
| `usageTrackingService` | Package 2 |
| `aiQueryService` | Package 2 |
| `subscriptionService` (tier enum vocabulary) | Package 2 |
| Billing checkout / Stripe webhooks | Package 2 |
| `featureGatingService.simplified.ts` | Archive (advisory) |

**Not PP-2 blockers** — settings tier reads should use `entitlementService` / `/api/account/tier` from day one of PP-2.

---

**Last updated:** 2026-06-20 (Foundation Checkpoint)
