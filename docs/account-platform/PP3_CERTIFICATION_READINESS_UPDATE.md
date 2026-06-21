# PP-3 — Certification Readiness Update (Post-PP2)

**Program:** Account Platform — Post-PP2 Certification Path Reassessment  
**Date:** 2026-06-20  
**Type:** Governance review only

**Baseline:** [PP3_PACKAGE1_IMPLEMENTATION_REPORT.md](./PP3_PACKAGE1_IMPLEMENTATION_REPORT.md) · [PP3_PACKAGE2_IMPLEMENTATION_REPORT.md](./PP3_PACKAGE2_IMPLEMENTATION_REPORT.md)

---

## Findings register (F01–F08)

| ID | Severity | Finding | Status | Notes |
|----|----------|---------|--------|-------|
| **PP3-F01** | Blocking | No entitlement SoR / `entitlementService` | **Closed** | Package 1 |
| **PP3-F02** | Blocking | Tier enum drift | **Partial** | `normalizeTier()`; legacy vocabulary remains |
| **PP3-F03** | Blocking | Dual `/api/billing` + `/api/payment` | **Partial** | P2 deprecation + delegation; clients not migrated |
| **PP3-F04** | Major | Admin override Business.tier only | **Closed** | Package 1 |
| **PP3-F05** | Major | No PE/activity on subscription mutations | **Partial** | Billing path covered; invoice webhooks deferred |
| **PP3-F06** | Major | Fat `billingController` + inline Prisma | **Closed** | Package 2 `billingService` |
| **PP3-F07** | Major | Gating fragmentation | **Partial** | Tier input unified; HR matrix separate |
| **PP3-F08** | Major | Modal-only billing UX | **Open** | Out of scope for Packages 1–2 |

### Advisories (F09+)

| ID | Status |
|----|--------|
| PP3-F09 Orphan `featureGatingService.simplified.ts` | Open |
| PP3-F10 No product trial flow | Open |
| PP3-F11 `standard` vs `pro` vocabulary | Partial |
| PP3-F12 Legacy `web/src/api/payment.ts` | Open — **client migration target** |

---

## G1–G9 estimate (post-Package 2)

| Gate | 0B-3 | P1 | P2 |
|------|------|----|----|
| G1 Authorization | 2 | 3 | **3** |
| G2 Auditability | 1 | 2 | **3** |
| G3 Service boundaries | 2 | 3 | **3** |
| G4 API coherence | 1 | 3 | **2** (dual API persists at client layer) |
| G5 Ownership | 1 | 3 | **3** |
| G6 Test evidence | 2 | 3 | **3** |
| G7 Documentation | 1 | 3 | **3** |
| G8 Production safety | 2 | 2 | **2** |
| G9 UX consistency | 1 | 1 | **1** |
| **Total** | **~44%** | **~85%** | **~23/27 (~85%)** |

*G4 regresses slightly at certification lens because legacy clients still call `/api/payment` despite server deprecation.*

---

## Certification posture

| Determination | Selected? |
|---------------|-----------|
| NOT READY (full L3) | ✅ for plain L3 |
| **READY FOR PROGRESS REVIEW** | ✅ |
| READY FOR EVALUATION (L3 WITH FINDINGS) | ⚠️ **After client migration** |
| READY FOR RATIFICATION PATH | ❌ |
| Plain L3 candidate | ❌ |

**Rationale:** Backend constitutional layer is strong (`entitlementService` + `billingService`). **PP3-F03 partial** and **F12** (active legacy clients) block evaluation until **PP-3 Client Migration** completes Phase 2 of API convergence plan. F08 (billing UX) is acceptable as WITH FINDINGS advisory once backend cert proceeds.

---

## Client migration dependency

| Prerequisite | Blocks PP-3 eval? |
|--------------|-------------------|
| Migrate `web/src/api/payment.ts` | **Yes** |
| Migrate `web/src/lib/stripe.ts` | **Yes** |
| Server deprecation headers only | Insufficient for cert |
| Billing UX dashboard | No (WITH FINDINGS) |

---

**Last updated:** 2026-06-20 (Post-PP2 Reassessment)
