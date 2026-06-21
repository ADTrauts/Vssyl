# PP-3 — Findings Review (Certification Evaluation)

**Program:** Account Platform — PP-3 Certification Evaluation  
**Date:** 2026-06-20  
**Type:** Evaluator findings disposition — **no certification awarded**

---

## Summary

| Category | Count at evaluation |
|----------|---------------------|
| **Blocking (open)** | **0** |
| **Blocking (partial)** | **1** — F02 |
| **Major (open)** | **1** — F08 |
| **Major (partial)** | **2** — F05, F07 |
| **Advisory (open)** | **4** — F09, F10, F11, F13 |
| **Closed** | **6** |
| **Accepted exception** | **1** — F14 |
| **New eval findings** | **2** — PP3-EVAL-F01, PP3-EVAL-F02 |

---

## Original register disposition (PP3-F01–F14)

| ID | Original | Status at eval | Evaluator verdict | Blocks award? |
|----|----------|----------------|-------------------|---------------|
| **PP3-F01** | Blocking | **Closed** | ✅ Verified — `entitlementService` operational | No |
| **PP3-F02** | Blocking | **Partial** | ⚠️ Accepted — `normalizeTier()` sufficient for WITH FINDINGS | No |
| **PP3-F03** | Blocking | **Closed** | ✅ Verified — client migration + 410 retirement | No |
| **PP3-F04** | Major | **Closed** | ✅ Verified — admin authority path | No |
| **PP3-F05** | Major | **Partial** | ⚠️ **Open at WITH FINDINGS** — invoice webhook activity gap | No |
| **PP3-F06** | Major | **Closed** | ✅ Verified — `billingService` | No |
| **PP3-F07** | Major | **Partial** | ⚠️ Accepted — HR matrix by design; orphan file advisory | No |
| **PP3-F08** | Major | **Open** | ⚠️ **Open major** — modal-only billing UX | No* |
| **PP3-F09** | Advisory | **Open** | Advisory — archive orphan file | No |
| **PP3-F10** | Advisory | **Open** | Advisory — trial UX | No |
| **PP3-F11** | Advisory | **Open** | Advisory — F02 overlap | No |
| **PP3-F12** | Advisory | **Closed** | ✅ Verified — `payment.ts` wrapper | No |
| **PP3-F13** | Advisory | **Open** | Advisory — AI boundary docs | No |
| **PP3-F14** | Advisory | **Accepted** | Documented exception — billing records | No |

*F08 blocks plain L3 only, not L3 WITH FINDINGS.

---

## New evaluation findings (PP3-EVAL)

| ID | Severity | Finding | Gate | Remediation |
|----|----------|---------|------|-------------|
| **PP3-EVAL-F01** | Major (waivable) | Module subscription routes lack Policy Engine | G1 | Post-cert: PE on `moduleSubscriptionService` writes |
| **PP3-EVAL-F02** | Advisory | No dedicated checkout/subscription E2E test | G6 | Post-cert: integration test charter |

---

## Findings by certification impact

### Blocking

**None open.** F02 partial documented with boundary normalization — does not block L3 WITH FINDINGS per BO/WS precedent.

### Majors (expected open at WITH FINDINGS award)

| ID | Finding | Evaluator note |
|----|---------|----------------|
| **PP3-F08** | Modal-only billing UX | Primary open major; pre-briefed; functional within modal scope |
| **PP3-F05** | Invoice webhook activity gap | Lifecycle path complete; invoice slice deferred |
| **PP3-EVAL-F01** | Module commerce PE gap | New; waivable at WITH FINDINGS |

### Advisories (expected open)

| ID | Topic |
|----|-------|
| PP3-F07 | HR gating matrix separation |
| PP3-F09 | Orphan `featureGatingService.simplified.ts` |
| PP3-F10 | Product trial UX |
| PP3-F11 | Tier vocabulary (`standard` vs `pro`) |
| PP3-F13 | AI query balance boundary docs |
| PP3-EVAL-F02 | E2E test depth |

---

## Closed findings — evaluator verification

| ID | Verification method | Result |
|----|---------------------|--------|
| PP3-F01 | Code + tests + `/api/account/*` | **Confirmed closed** |
| PP3-F03 | Client grep + 410 middleware + webhook review | **Confirmed closed** |
| PP3-F04 | `admin-override.ts` → `setBusinessTierAuthority` | **Confirmed closed** |
| PP3-F06 | `billingService.ts` + controller delegation | **Confirmed closed** |
| PP3-F12 | `payment.ts` → `billing.ts` re-exports | **Confirmed closed** |

---

## Remediation requirements

| Priority | Finding | Required before award? |
|----------|---------|------------------------|
| — | None mandatory | **No** — WITH FINDINGS path |
| Optional P1 | F08 billing dashboard | Plain L3 only |
| Optional P2 | F02 data migration | Hardening |
| Optional P3 | F05 invoice events | Audit completeness |
| Optional P4 | PP3-EVAL-F01 module PE | G1 score improvement |
| Optional P5 | F09 orphan archive | Hygiene |

**Remediation is recommended post-ratification, not pre-award.**

---

## Findings register for council packet

**Total open at recommended award:** ~8 (1 major + 2 partial majors + 5 advisories)

**Acceptable for L3 WITH FINDINGS:** Yes — aligns with BO (17 advisories) and WS (11 advisories) precedent.

---

**Last updated:** 2026-06-20 (Certification Evaluation)
