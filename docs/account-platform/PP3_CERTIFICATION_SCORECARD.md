# PP-3 — Certification Scorecard

**Program:** Account Platform — PP-3 Billing & Entitlements Certification Evaluation  
**Date:** 2026-06-20  
**Framework:** G1–G9 platform capability gates  
**Baseline comparison:** Phase 0B (15/27) → Post P2 (23/27) → Post P3 prep (24/27 self) → **Eval final (23/27)**

---

## Final G1–G9 scorecard

| Gate | Score | Max | Status | Justification |
|------|------:|----:|--------|---------------|
| **G1 Authorization** | 2 | 3 | **PARTIAL** | `billing:*` and `entitlement:*` PE on platform lifecycle + admin paths. Module subscription and invoice/PM routes JWT-only. No security P0. |
| **G2 Auditability** | 3 | 3 | **PASS** | Billing + entitlement activity/domain events on all successful lifecycle mutations; checkout sync emits. Invoice webhooks deferred (F05) — waivable. |
| **G3 Service boundaries** | 3 | 3 | **PASS** | `entitlementService` + `billingService` canonical; controllers thin on lifecycle; `subscriptionService` delegated appropriately. |
| **G4 API coherence** | 3 | 3 | **PASS** | `/api/billing` + `/api/account/*` canonical; clients migrated; JWT `/api/payment` 410; webhook exception documented. |
| **G5 Ownership** | 3 | 3 | **PASS** | `Subscription.tier` SoR; `Business.tier` cache; cross-domain boundaries clean. F02 vocabulary partial — does not break model. |
| **G6 Test evidence** | 2 | 3 | **PARTIAL** | 20+ automated tests (entitlement, billing, migration, webhook). No full matrix HTTP suite; no dedicated checkout E2E. |
| **G7 Documentation** | 3 | 3 | **PASS** | Complete P1/P2/P3 architecture, audit, implementation, preparation, evaluation doc set. |
| **G8 Production safety** | 2 | 3 | **PARTIAL** | Webhook hardened; migration safe; 410 retirement. F02 tier vocabulary edge cases; Stripe external dependency. |
| **G9 UX consistency** | 1 | 3 | **FAIL** | Modal-first billing functional; no dedicated dashboard (F08). Settings billing IA deferred to PP-2. |
| **TOTAL** | **23** | **27** | **~85%** | **RECOMMEND L3 WITH FINDINGS** |

---

## Score trajectory

| Milestone | Score | Notes |
|-----------|------:|-------|
| Phase 0B-3 audit | 15/27 (~56%) | Pre-implementation |
| Post Package 2 | 23/27 (~85%) | billingService + entitlement SoR |
| Post Phase 3 (self) | 24/27 (~89%) | Client migration |
| **Evaluator final** | **23/27 (~85%)** | G1/G6 conservative adjustment |

---

## Threshold evaluation

| Threshold | Requirement | PP-3 result |
|-----------|-------------|-------------|
| NOT READY | &lt;70% OR open blocking | **Not met** — passes |
| CONDITIONALLY READY | ≥70%, zero blocking | **Met** |
| READY FOR EVALUATION | ≥85%, evidence complete | **Met** |
| Plain L3 | All ≥2, G9≥2, no FAIL | **Not met** — G9 FAIL |
| **L3 WITH FINDINGS** | Core + tracked findings | **Met** |

---

## Gate status legend

| Status | Gates |
|--------|-------|
| **PASS (3)** | G2, G3, G4, G5, G7 |
| **PARTIAL (2)** | G1, G6, G8 |
| **FAIL (1)** | G9 |

---

## Evaluator adjustments vs self-score

| Gate | Self (prep) | Evaluator | Reason |
|------|------------|-----------|--------|
| G1 | 3 | **2** | Module commerce PE gap material |
| G6 | 3 | **2** | Integration/E2E depth insufficient for score 3 |
| All others | — | Unchanged | — |

---

## Evidence index

| Gate | Primary evidence |
|------|------------------|
| G1 | `billingPolicyDual.ts`, `entitlementPolicyDual.ts`, `billingService.ts` |
| G2 | `billingActivityService.ts`, `entitlementActivityService.ts`, domain registry |
| G3 | `billingService.ts`, `entitlementService.ts`, `billingController.ts` |
| G4 | `billing.ts` routes, `web/src/api/billing.ts`, `paymentRouteRetired.ts` |
| G5 | `PP3_ENTITLEMENT_OWNERSHIP_MODEL.md`, `PP3_BILLING_SERVICE_MODEL.md` |
| G6 | Test inventory in `PP3_G1_G9_EVIDENCE_BINDER.md` |
| G7 | PP-3 program doc set (30+ documents) |
| G8 | `PP3_WEBHOOK_EXCEPTION_REVIEW.md`, migration reports |
| G9 | `BillingModal.tsx`, F08 disposition |

---

## Operation matrix compliance (re-audit)

| Metric | Phase 0B | Re-audit | Evaluator confirmation |
|--------|----------|----------|------------------------|
| Compliant (C) | 7 (~15%) | 19 (~38%) | **Confirmed** |
| Partial (P) | 33 (~70%) | 23 (~55%) | **Confirmed** |
| Non-compliant (N) | 7 (~15%) | 2 (~7%) | **Confirmed** — F08, F10 UX rows |

---

**Last updated:** 2026-06-20 (Certification Evaluation)
