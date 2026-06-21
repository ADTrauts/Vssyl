# PP-3 — Certification Evaluation

**Program:** Account Platform — PP-3 Billing & Entitlements Certification Evaluation  
**Date:** 2026-06-20  
**Authority:** Platform Architecture Governance (Account Platform)  
**Evaluator:** Certification Evaluation Panel (documentation + evidence review)  
**Status:** **EVALUATION COMPLETE** — recommendation issued; **no certification awarded**

**Scope:** Formal G1–G9 evaluation of PP-3 Billing & Entitlements platform capability based on Packages 1–2, Phase 3, Certification Preparation, and Evaluation Authorization.

**Constraint:** No runtime changes, no certification award, no ledger update, no council ratification in this program.

---

## 1. Evaluation scope

| Phase | Status | Evidence |
|-------|--------|----------|
| Phase 0B-3 Audit | Complete | Operation matrix, findings F01–F14 |
| PP-3 Package 1 — Entitlement Foundation | Complete | `entitlementService`, `/api/account/*` |
| PP-3 Package 2 — Billing Service & API Convergence | Complete | `billingService`, PE, activity/events |
| PP-3 Phase 3 — Client Migration | Complete | `billing.ts`, 410 retirement |
| Certification Preparation | Complete | Matrix re-audit, evidence binder |
| Evaluation Authorization | Complete | AUTHORIZE decision |

---

## 2. G1–G9 evaluation

| Gate | Name | Score | Max | Status |
|------|------|------:|----:|--------|
| **G1** | Authorization | **2** | 3 | PARTIAL |
| **G2** | Auditability | **3** | 3 | PASS |
| **G3** | Service boundaries | **3** | 3 | PASS |
| **G4** | API coherence | **3** | 3 | PASS |
| **G5** | Ownership | **3** | 3 | PASS |
| **G6** | Test evidence | **2** | 3 | PARTIAL |
| **G7** | Documentation | **3** | 3 | PASS |
| **G8** | Production safety | **2** | 3 | PARTIAL |
| **G9** | UX consistency | **1** | 3 | FAIL |
| | **Total** | **23** | **27** | **~85%** |

Detailed scorecard: [PP3_CERTIFICATION_SCORECARD.md](./PP3_CERTIFICATION_SCORECARD.md)

---

## 3. Gate evaluations (A–I)

### A. G1 — Authorization

**Score: 2 (PARTIAL)**

| Area | Finding |
|------|---------|
| `billingService` lifecycle | ✅ `billing:read` / `billing:write` enforced |
| `entitlementService` admin path | ✅ `entitlement:write` ADMIN-only |
| Entitlement reads | ✅ `entitlement:read` on `/api/account/*` |
| Module subscription mutations | ❌ JWT only — no dedicated PE |
| Invoice / PM mutations | ❌ Inline controller — no billing PE |
| Tier authority writes | ✅ PE on billing + admin entitlement paths |

**Eval finding:** PP3-EVAL-F01 — Module commerce routes lack Policy Engine alignment.

---

### B. G2 — Auditability

**Score: 3 (PASS)**

| Path | Activity | Domain events |
|------|----------|---------------|
| Platform subscription lifecycle | ✅ | ✅ |
| Checkout → `upsertSubscriptionFromCheckout` | ✅ | ✅ |
| Entitlement admin authority | ✅ | ✅ |
| Invoice paid/failed webhooks | ❌ | ❌ |

Lifecycle and checkout paths satisfy module interoperability contract. Invoice gap documented as PP3-F05 partial — waivable at WITH FINDINGS.

---

### C. G3 — Service boundaries

**Score: 3 (PASS)**

| Service | Verdict |
|---------|---------|
| `entitlementService` | Canonical tier resolver + admin writes |
| `billingService` | Canonical platform subscription lifecycle |
| `billingController` | Thin on lifecycle; partial on invoice/module rows |
| `subscriptionService` | Data layer — appropriately delegated |

Employee count update and module subscribe bypass `billingService` — partial rows, not boundary violations.

---

### D. G4 — API coherence

**Score: 3 (PASS)**

| Surface | Verdict |
|---------|---------|
| `/api/billing` | Canonical — all web clients |
| `/api/account/*` | Canonical entitlement reads |
| JWT `/api/payment/*` | 410 retired |
| `POST /api/payment/webhook` | Valid ops exception |
| `web/src/api/billing.ts` | Authoritative client |

PP3-F03 closed. No dual CRUD API drift detected.

---

### E. G5 — Ownership

**Score: 3 (PASS)**

| Domain | Owner | Cross-contamination |
|--------|-------|---------------------|
| Billing / subscriptions | PP-3 `billingService` | None |
| Entitlements / tier SoR | PP-3 `entitlementService` | None |
| Settings | PP-2 — billing tab embed only | Soft IA — PP-2 scope |
| Identity | PP-1 — `stripeCustomerId` on User | Correct lifecycle hook |
| `Business.tier` | Cache only — sync on writes | ✅ F04 closed |

F02 partial (vocabulary) does not break ownership model — normalization at boundaries.

---

### F. G6 — Test evidence

**Score: 2 (PARTIAL)**

| Suite | Count | Adequacy |
|-------|-------|----------|
| Entitlement unit + integration | 14 | ✅ Strong |
| Billing service + convergence | 6 | ✅ Adequate |
| Client migration (web) | 4 | ✅ Adequate |
| Stripe webhook billing | Present | ✅ |
| Full operation-matrix HTTP coverage | Partial | ❌ |
| End-to-end checkout E2E | Not dedicated | ❌ |

Sufficient for WITH FINDINGS; insufficient for plain L3.

---

### G. G7 — Documentation

**Score: 3 (PASS)**

Complete PP-3 program doc set: architecture (P1/P2/P3), ownership, convergence, client migration, matrix re-audit, activity/events, preparation, authorization, and this evaluation package.

---

### H. G8 — Production safety

**Score: 2 (PARTIAL)**

| Control | Status |
|---------|--------|
| Client migration without breaking changes | ✅ Deprecated wrappers |
| 410 retirement with successor headers | ✅ |
| Webhook raw body + signature | ✅ |
| Tier bypass via cache-only writes | ✅ Closed |
| Tier enum edge cases | ⚠️ F02 partial |
| Stripe external dependency | Accepted platform risk |

---

### I. G9 — UX consistency

**Score: 1 (FAIL)**

| Surface | Status |
|---------|--------|
| `BillingModal`, `UpgradeFlow`, checkout pages | Functional |
| Payment method management | Canonical API |
| Dedicated billing dashboard | **Missing** — F08 |
| Settings hub billing IA | Fragmented — PP-2 |

Modal-first architecture is coherent within its scope but fails G9 dashboard/hub standard.

---

## 4. Threshold evaluation

| Threshold | Requirement | Result |
|-----------|-------------|--------|
| NOT CERTIFIABLE | &lt;70% OR blocking OR critical G8/G9 fail without waiver | **Not met** — passes |
| CONDITIONALLY READY | ≥70%, zero blocking | **Met** |
| READY FOR EVALUATION | ≥85%, prep complete | **Met** (23/27) |
| Plain L3 | All gates ≥2, G9≥2, zero FAIL, minimal advisories | **Not met** |
| **L3 WITH FINDINGS** | Constitutional core + tracked findings | **Met** |

---

## 5. Certification recommendation

| Field | Value |
|-------|-------|
| **Recommendation** | **L3 WITH FINDINGS** |
| **Plain L3** | **Not recommended** |
| **NOT CERTIFIABLE** | **Not recommended** |
| **Certification awarded** | **No** — evaluation only |
| **Ledger update** | **Not performed** — recommend on ratification |

---

## 6. Comparison to authorization prediction

| Metric | Predicted | Evaluator actual |
|--------|-----------|------------------|
| G1–G9 total | 22–25/27 | **23/27** |
| Outcome | L3 WITH FINDINGS | **L3 WITH FINDINGS** |
| Open blocking | 0 | **0** |

Evaluator downgraded G1 and G6 one point vs self-score (24/27) due to module PE gap and integration test depth. Overall recommendation unchanged.

---

## 7. Required questions — answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Final G1–G9 score? | **23/27 (~85%)** |
| 2 | Open blocking findings? | **0** |
| 3 | Open major findings? | **3** — F08, F05 partial, F07 partial (+ F02 partial at blocking tier) |
| 4 | Open advisory findings? | **4** — F09, F10, F11, F13 |
| 5 | Certification recommendation? | **L3 WITH FINDINGS** |
| 6 | Plain L3 appropriate? | **No** |
| 7 | L3 WITH FINDINGS appropriate? | **Yes** |
| 8 | Reference candidate status? | **Reference Billing Pattern — Candidate** (see reference review) |
| 9 | Remaining risks? | F08 UX, F02 vocabulary, Stripe ops, module PE gap |
| 10 | Certification readiness? | **Ready for recommendation** — not yet awarded |
| 11 | Recommended next gate? | **Council ratification vote** |
| 12 | Modernization complete? | **Yes** — chartered PP-3 scope |
| 13 | Remediation required? | **Optional post-ratification** — not eval blockers |
| 14 | Ledger recommendation? | **Recommend draft row on ratification** — not updated now |
| 15 | Evaluation outcome? | **COMPLETE — recommend L3 WITH FINDINGS, no award** |

---

## 8. Deliverables

| Document |
|----------|
| [PP3_CERTIFICATION_EVALUATION.md](./PP3_CERTIFICATION_EVALUATION.md) (this file) |
| [PP3_CERTIFICATION_SCORECARD.md](./PP3_CERTIFICATION_SCORECARD.md) |
| [PP3_FINDINGS_REVIEW.md](./PP3_FINDINGS_REVIEW.md) |
| [PP3_REFERENCE_REVIEW.md](./PP3_REFERENCE_REVIEW.md) |
| [PP3_CERTIFICATION_EXECUTIVE_SUMMARY.md](./PP3_CERTIFICATION_EXECUTIVE_SUMMARY.md) |

---

**Last updated:** 2026-06-20 (Certification Evaluation)
