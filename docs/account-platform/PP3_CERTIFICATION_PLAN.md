# PP-3 — Certification Plan

**Program:** Account Platform — Certification Planning Charter  
**Sub-program:** PP-3 Billing & Entitlements  
**Date:** 2026-06-20  
**Status:** Planning only — evaluation not authorized

---

## Readiness score

| Metric | Value |
|--------|-------|
| **G1–G9 estimate** | **~23/27 (~85%)** |
| **Certification posture** | **NOT READY FOR EVALUATION** |
| **Progress review** | Eligible after client migration |
| **Target outcome** | L3 WITH FINDINGS (not plain L3) |

---

## Required client migration scope (before evaluation)

Per [PP3_API_CONVERGENCE_PLAN.md](./PP3_API_CONVERGENCE_PLAN.md) Phase 2:

| # | Work item | Closes |
|---|-----------|--------|
| 1 | Migrate `web/src/api/payment.ts` → `/api/billing` | PP3-F12 |
| 2 | Migrate `web/src/lib/stripe.ts` → `/api/billing` | PP3-F03 (client layer) |
| 3 | Eliminate production calls to legacy subscription CRUD on `/api/payment` | PP3-F03 |
| 4 | Document payment intent path (`/api/payment/intent` or `/api/billing/intent`) | Advisory |
| 5 | Verification test: no legacy client references in grep audit | Eval evidence |

**Out of client migration scope (WITH FINDINGS at eval):**
- Billing dashboard UX (F08)
- `/api/payment` router unmount (Phase 3 — post-eval remainder)
- Invoice webhook PE/events (F05 partial)

**Client migration is a separate implementation charter** — not authorized by this planning charter.

---

## Evaluation prerequisites

| # | Prerequisite | Status |
|---|--------------|--------|
| 1 | PP-3 Package 1 + Package 2 complete | ✅ |
| 2 | **PP-3 Client Migration complete** | ❌ **Hard gate** |
| 3 | Operation matrix re-audit (PP-3 rows) | ⏳ Required |
| 4 | G1–G9 evidence binder assembled | ⏳ Required |
| 5 | Stripe alignment report + billing tests | ✅ Partial |
| 6 | Council evaluation authorization vote | ⏳ Separate |

**Does not require:** PP-1/PP-2 evaluation completion (may run in parallel with PP-1/PP-2 evals during client migration work).

---

## Remaining findings

### Majors (F01–F08)

| ID | Status | Evaluation disposition |
|----|--------|------------------------|
| PP3-F01 | Closed | — |
| PP3-F02 | Partial | **WITH FINDINGS** — tier enum migration deferred |
| **PP3-F03** | **Partial** | **Must close** (client layer) before eval |
| PP3-F04 | Closed | — |
| PP3-F05 | Partial | **WITH FINDINGS** — invoice webhooks deferred |
| PP3-F06 | Closed | `billingService` |
| PP3-F07 | Partial | **WITH FINDINGS** — HR matrix by design |
| **PP3-F08** | **Open** | **WITH FINDINGS** — modal-only UX |

### Advisories

| ID | Disposition |
|----|-------------|
| PP3-F09 | WITH FINDINGS — orphan gating file |
| PP3-F10 | WITH FINDINGS — no trial flow |
| PP3-F11 | WITH FINDINGS — `standard` vs `pro` vocabulary |
| PP3-F12 | Open — **closes with client migration** |

---

## Findings that block evaluation vs certification

| Finding | Blocks evaluation? | Blocks plain L3? |
|---------|-------------------|------------------|
| **PP3-F03 partial** | **Yes** — until client migration | Yes |
| PP3-F08 billing UX | No | Yes (plain L3) |
| PP3-F02 tier drift | No | WITH FINDINGS |
| PP3-F05 invoice events | No | WITH FINDINGS |

---

## Likely certification outcome

| Outcome | Probability | Conditions |
|---------|-------------|------------|
| **L3 WITH FINDINGS** | **High** | After client migration + prerequisites |
| Plain L3 | Very low | Requires F08 UX + F02 migration + F05 full coverage |
| NOT CERTIFIABLE | Low | Only if F03 not closed at client layer |

**Expected findings at evaluation:** 4–6 WITH FINDINGS (F02, F05, F07, F08, F09–F11 advisories).

---

## Required evidence (G1–G9 binder)

| Gate | Evidence required |
|------|-------------------|
| G1 | `entitlement:read/write`, `billing:read/write` PE matrix |
| G2 | Entitlement + billing activity/domain events |
| G3 | `entitlementService` + `billingService` boundary diagram |
| G4 | Single client namespace audit; deprecation headers; route mapping |
| G5 | Subscription SoR ownership model |
| G6 | entitlementService + billingService + convergence tests |
| G7 | Package 1 + Package 2 architecture docs |
| G8 | Tier normalization; admin override safety |
| G9 | BillingModal UX note (F08 WITH FINDINGS) |

---

## Evaluation timing

| Milestone | Earliest |
|-----------|----------|
| Client migration | Before eval (~4–6 weeks implementation) |
| Evaluation execution | **After PP-1/PP-2** (may overlap if migration finishes early) |
| Evaluates **last** among sub-domains | **Yes** — hard gate |

---

## Does PP-3 require client migration before evaluation?

**Yes.** Server deprecation alone is insufficient for certification lens. Active legacy clients (`web/src/api/payment.ts`, `web/src/lib/stripe.ts`) constitute open PP3-F03 at evaluation time.

---

**Last updated:** 2026-06-20 (Certification Planning Charter)
