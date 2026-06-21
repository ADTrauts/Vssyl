# PP-3 — G1–G9 Reassessment (Post-Migration)

**Program:** Account Platform — PP-3 Post-Migration Certification Reassessment  
**Date:** 2026-06-20  
**Type:** Governance estimate — **not evaluator-certified**  
**Framework:** Platform capability gates (Admin Portal, BO, Reference Workspace precedent)

---

## Score progression

| Gate | Phase 0B-3 (audit) | Post Package 2 | Post Phase 3 | Δ (P2→P3) |
|------|-------------------|----------------|--------------|-----------|
| **G1** Authorization | 2 | 3 | **3** | — |
| **G2** Auditability | 1 | 3 | **3** | — |
| **G3** Service boundaries | 2 | 3 | **3** | — |
| **G4** API coherence | 1 | 2 | **3** | +1 |
| **G5** Ownership | 2 | 3 | **3** | — |
| **G6** Test evidence | 2 | 3 | **3** | — |
| **G7** Documentation | 2 | 3 | **3** | — |
| **G8** Production safety | 2 | 2 | **2** | — |
| **G9** UX consistency | 1 | 1 | **1** | — |
| **Total** | **~15/27 (~56%)** | **~23/27 (~85%)** | **~24/27 (~89%)** | +1 |

*Consolidated estimate: **~88%** (user/program baseline aligns with 24/27).*

---

## Gate detail

### G1 — Authorization · **3 / PASS**

| Evidence | Status |
|----------|--------|
| `entitlement:read` / `entitlement:write` | ✅ |
| `billing:read` / `billing:write` on subscription owner | ✅ |
| JWT on protected routes | ✅ |
| Module subscription / invoice paths without dedicated PE | ⚠️ Partial — acceptable WITH FINDINGS |

### G2 — Auditability · **3 / PASS**

| Evidence | Status |
|----------|--------|
| Entitlement activity + domain events | ✅ |
| Billing lifecycle activity + domain events | ✅ |
| Invoice paid/failed webhook activity | ❌ Deferred (F05 partial) |

### G3 — Service boundaries · **3 / PASS**

| Evidence | Status |
|----------|--------|
| `entitlementService` canonical | ✅ |
| `billingService` canonical | ✅ |
| `billingController` orchestrates; some inline Prisma on invoices/PM | ⚠️ Partial rows |

### G4 — API coherence · **3 / PASS**

| Evidence | Status |
|----------|--------|
| `/api/billing` canonical for clients | ✅ |
| `/api/account/*` entitlement reads | ✅ |
| `web/src/api/billing.ts` authoritative client | ✅ |
| Webhook on `/api/payment/webhook` (ops URL) | ✅ Intentional — not dual CRUD API |
| JWT `/api/payment/*` retired (410) | ✅ |

### G5 — Ownership · **3 / PASS**

| Evidence | Status |
|----------|--------|
| `Subscription.tier` write SoR | ✅ |
| `Business.tier` cache model | ✅ |
| Tier vocabulary drift in legacy validators | ⚠️ F02 partial |

### G6 — Test evidence · **3 / PASS**

| Evidence | Status |
|----------|--------|
| `entitlementService.test.ts` (11) | ✅ |
| `billingService.test.ts` (4) | ✅ |
| `payment-api-convergence` + retirement tests | ✅ |
| `billingClient.test.ts` (web, 4) | ✅ |
| Operation-matrix-complete integration suite | ❌ Not required for WITH FINDINGS |

### G7 — Documentation · **3 / PASS**

| Evidence | Status |
|----------|--------|
| P1/P2/P3 architecture + convergence + client docs | ✅ |
| Operation matrix (Phase 0B — **re-audit pending**) | ⚠️ Stale rows vs runtime |

### G8 — Production safety · **2 / PARTIAL**

| Evidence | Status |
|----------|--------|
| Webhook raw body + signature path | ✅ |
| Stripe integration maturity | ✅ |
| Tier enum / vocabulary drift risk | ⚠️ F02 partial |
| Module subscribe without stripeCustomerId edge | ⚠️ Pre-existing edge |

### G9 — UX consistency · **1 / FAIL**

| Evidence | Status |
|----------|--------|
| `BillingModal`, `UpgradeFlow`, checkout flows | ✅ Functional |
| Dedicated billing dashboard / hub | ❌ F08 open |
| Modal-only primary billing surface | ❌ G9 blocker for plain L3 |

---

## Gate summary

| Result | Gates |
|--------|-------|
| **PASS (3)** | G1, G2, G3, G4, G5, G6, G7 |
| **PARTIAL (2)** | G8 |
| **FAIL (1)** | G9 |

**L3 WITH FINDINGS threshold:** Met on gate count (≥7 gates at 3, none at 1 except G9 — BO precedent allows G9=1 with open major).  
**Plain L3 threshold:** Not met — G9 FAIL + G8 PARTIAL.

---

**Last updated:** 2026-06-20 (Post-Migration Reassessment)
