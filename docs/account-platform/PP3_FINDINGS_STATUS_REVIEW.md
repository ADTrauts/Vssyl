# PP-3 — Findings Status Review (Post-Migration)

**Program:** Account Platform — PP-3 Post-Migration Certification Reassessment  
**Date:** 2026-06-20  
**Type:** Governance review only  
**Baseline:** Packages 1–2, Phase 3, [PP3_BILLING_ENTITLEMENTS_OPERATION_MATRIX.md](./PP3_BILLING_ENTITLEMENTS_OPERATION_MATRIX.md)

---

## Summary

| Status | Count (F01–F12) |
|--------|-----------------|
| **Closed** | 6 |
| **Partial** | 3 |
| **Open** | 3 |

**Blocking findings (original F01–F03):** **0 open** · **1 partial** (F02)

---

## Full register (PP3-F01 through PP3-F12)

| ID | Severity | Finding | Status | Evidence / remaining gap |
|----|----------|---------|--------|--------------------------|
| **PP3-F01** | Blocking | No entitlement SoR / `entitlementService` | **Closed** | Package 1 — `entitlementService` + `/api/account/*` |
| **PP3-F02** | Blocking | Tier enum drift | **Partial** | `normalizeTier()` + consumer alignment; `subscriptionService` `standard` vs checkout `pro`; data migration deferred |
| **PP3-F03** | Blocking | Dual `/api/billing` + `/api/payment` | **Closed** | Phase 3 — canonical client; JWT routes 410; webhook only on `/api/payment/webhook` |
| **PP3-F04** | Major | Admin override writes `Business.tier` only | **Closed** | `setBusinessTierAuthority()` |
| **PP3-F05** | Major | No PE/activity on subscription mutations | **Partial** | `billingService` lifecycle + checkout emit; invoice/payment-intent webhook paths deferred |
| **PP3-F06** | Major | Fat `billingController` / missing `billingService` | **Closed** | Package 2 — `billingService` |
| **PP3-F07** | Major | Gating fragmentation | **Partial** | Primary paths on `entitlementService`; HR matrix by design; orphan `featureGatingService.simplified.ts` |
| **PP3-F08** | Major | Modal-only billing UX — no billing dashboard | **Open** | UX redesign explicitly out of scope |
| **PP3-F09** | Advisory | Orphan `featureGatingService.simplified.ts` | **Open** | Archive deferred |
| **PP3-F10** | Advisory | No product trial flow | **Open** | Stripe trialing in sync only |
| **PP3-F11** | Advisory | `subscriptionService` `standard` vs checkout `pro` | **Open** | Vocabulary overlap with F02 |
| **PP3-F12** | Advisory | Legacy `web/src/api/payment.ts` active | **Closed** | Phase 3 — delegates to `billing.ts` |

---

## Extended advisories (F13–F14)

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| PP3-F13 | Advisory | AI query balance boundary with AI Platform unclear in docs | **Open** |
| PP3-F14 | Advisory | No Global Trash for billing records (expected exception) | **Accepted** — documented exception |

---

## Closure since post-foundation review

| Finding | Pre Phase 3 | Post Phase 3 |
|---------|-------------|--------------|
| PP3-F03 | Partial | **Closed** |
| PP3-F12 | Open | **Closed** |
| G4 (API coherence) | 2 | **3** |

---

## Findings by certification impact

| Impact | IDs |
|--------|-----|
| **Blocks evaluation (strict plain L3)** | F02 partial, F08 open |
| **Acceptable at L3 WITH FINDINGS** | F05 partial, F07 partial, F09–F11, F13 |
| **Closed — eval enablers** | F01, F03, F04, F06, F12 |

---

**Last updated:** 2026-06-20 (Post-Migration Reassessment)
