# PP-3 — Post-Foundation Review

**Program:** Account Platform — Post-Foundation Certification Readiness Reassessment  
**Date:** 2026-06-20  
**Type:** Governance review only — no implementation  
**Baseline:** [PP3_PACKAGE1_IMPLEMENTATION_REPORT.md](./PP3_PACKAGE1_IMPLEMENTATION_REPORT.md) · [PP3_PACKAGE2_IMPLEMENTATION_REPORT.md](./PP3_PACKAGE2_IMPLEMENTATION_REPORT.md)

---

## Scope

Reassess PP-3 Billing & Entitlements after completion of:

- PP-3 Package 1 (Entitlement Foundation)
- PP-3 Package 2 (Billing Service & API Convergence)
- PP-2 Phase 1 (settings substrate; billing tab IA deferred)

---

## Foundation artifacts (verified)

| Service / artifact | Status |
|------------------|--------|
| `entitlementService` | ✅ Single resolver entry point |
| `billingService` | ✅ Single lifecycle entry point |
| `Subscription.tier` authoritative write path | ✅ |
| `Business.tier` consumer/cache model | ✅ |
| Entitlement read APIs (`/api/account/*`) | ✅ |
| Billing Policy Engine (`billing:read`, `billing:write`) | ✅ |
| Billing activity + domain events | ✅ Lifecycle paths |
| `/api/payment` deprecation layer | ✅ Phase 1 |
| Feature gating alignment (primary paths) | ✅ Partial |
| Tier read convergence (`aiQueryService`, `usageTrackingService`) | ✅ |
| Tests | ✅ 16 passing (entitlement + billing + convergence) |

**Explicitly not delivered (by design):** Client migration, router retirement, billing dashboard UX, invoice webhook events, certification.

---

## Findings register (PP3-F01 through PP3-F08)

| ID | Severity | Finding | Status | Evidence / remaining gap |
|----|----------|---------|--------|--------------------------|
| **PP3-F01** | Blocking | No entitlement SoR / `entitlementService` | **Closed** | `entitlementService.ts` + `/api/account/*` |
| **PP3-F02** | Blocking | Tier enum drift | **Partial** | `normalizeTier()` + consumer alignment; `subscriptionService` `standard` vocabulary + data migration deferred |
| **PP3-F03** | Blocking | Dual `/api/billing` + `/api/payment` | **Partial** | Deprecation headers + cancel/resume delegation; `web/src/api/payment.ts` + router retirement Phase 2–3 |
| **PP3-F04** | Major | Admin override writes `Business.tier` only | **Closed** | `setBusinessTierAuthority()` writes Subscription + cache |
| **PP3-F05** | Major | No PE/activity on subscription mutations | **Partial** | `billingService` lifecycle covered; invoice/payment-intent webhooks deferred |
| **PP3-F06** | Major | Fat `billingController` + inline Prisma / missing `billingService` | **Closed** | `billingService` + thinned controller |
| **PP3-F07** | Major | Gating fragmentation | **Partial** | Tier input unified; HR matrix by design; orphan `featureGatingService.simplified.ts` |
| **PP3-F08** | Major | Modal-only billing UX — no billing dashboard | **Open** | UX wave out of Package 2 scope |

### Related advisories (F09–F12)

| ID | Status | Notes |
|----|--------|-------|
| PP3-F09 | Open | Orphan `featureGatingService.simplified.ts` |
| PP3-F10 | Open | No product trial flow |
| PP3-F11 | Open | `subscriptionService` `standard` vs checkout `pro` vocabulary |
| PP3-F12 | Open | Legacy `web/src/api/payment.ts` still active — Phase 2 target |

---

## G1–G9 readiness estimate (billing & entitlements slice)

| Gate | Pre Package 1 | Post Package 2 | Notes |
|------|-------------|----------------|-------|
| G1 Authorization | 2 | **3** | `entitlement:*` + `billing:*` PE |
| G2 Auditability | 1 | **3** | Entitlement + billing lifecycle events |
| G3 Service boundaries | 2 | **3** | `entitlementService` + `billingService` canonical |
| G4 API coherence | 1 | **2** | `/api/account/*` + `/api/billing` canonical; `/api/payment` deprecated not retired |
| G5 Ownership | 2 | **3** | Subscription SoR enforced; cache model documented |
| G6 Test evidence | 2 | **3** | Resolver, billing, convergence tests |
| G7 Documentation | 2 | **3** | P1 + P2 architecture, alignment, convergence docs |
| G8 Production safety | 2 | **2** | Tier drift reduced; legacy clients remain |
| G9 UX consistency | 1 | **1** | Modal-only billing UX |
| **Total** | **~15/27 (~56%)** | **~23/27 (~85%)** | |

*Strongest backend maturity in Account Platform trilogy; G9 and G4 prevent full L3.*

---

## PP-3 readiness determination

| Dimension | Status |
|-----------|--------|
| Package 1 + Package 2 foundation charters | ✅ Complete |
| Entitlement SoR | ✅ Established |
| Billing service boundary | ✅ Established |
| PP-2 dependency (SOFT READ) | ✅ Met |
| L3 WITH FINDINGS candidate (full PP-3) | **No** — F03 partial, F08 open, matrix re-audit pending |
| Entitlement progress review | **Eligible** — Package 1 + resolver tests |
| Billing progress review | **Eligible** — post Package 2 backend slice |

---

## Remaining PP-3 work (not authorized)

| Wave | Items | Findings impact |
|------|-------|-----------------|
| **Phase 2 — Client migration** | `web/src/api/payment.ts`, `web/src/lib/stripe.ts` → `/api/billing`; router retirement path | Closes F03, F12 |
| **Remainder — UX** | Billing dashboard beyond modal | Closes F08 |
| **Remainder — Data** | Tier enum data migration; archive orphan gating file | Closes F02, F09, F11 |
| **Remainder — Events** | Invoice paid/failed webhook activity | Completes F05 |

---

**Last updated:** 2026-06-20 (Post-Foundation Reassessment)
