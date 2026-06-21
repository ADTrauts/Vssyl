# PP-3 — Findings Reclassification (Certification Prep)

**Program:** Account Platform — PP-3 Certification Preparation  
**Date:** 2026-06-20  
**Type:** Governance only — evaluation packet input

---

## Classification legend

| Class | Meaning for evaluation |
|-------|------------------------|
| **Closed** | Remediation complete; no eval finding expected |
| **Partial** | Remediation substantive; remainder documented |
| **Open** | Not remediated; expect eval finding |
| **Accepted WITH FINDINGS** | Open by design; acceptable at L3 WITH FINDINGS award |

---

## Full register (PP3-F01–F14)

| ID | Original severity | Finding | Status | Eval class | Blocking? |
|----|-------------------|---------|--------|------------|-----------|
| **PP3-F01** | Blocking | No entitlement SoR / `entitlementService` | **Closed** | Closed | No |
| **PP3-F02** | Blocking | Tier enum drift | **Partial** | Partial | No* |
| **PP3-F03** | Blocking | Dual `/api/billing` + `/api/payment` | **Closed** | Closed | No |
| **PP3-F04** | Major | Admin override `Business.tier` only | **Closed** | Closed | No |
| **PP3-F05** | Major | No PE/activity on subscription mutations | **Partial** | Accepted WITH FINDINGS | No |
| **PP3-F06** | Major | Fat controller / missing `billingService` | **Closed** | Closed | No |
| **PP3-F07** | Major | Gating fragmentation | **Partial** | Accepted WITH FINDINGS | No |
| **PP3-F08** | Major | Modal-only billing UX | **Open** | **Accepted WITH FINDINGS** | No |
| **PP3-F09** | Advisory | Orphan `featureGatingService.simplified.ts` | **Open** | Advisory | No |
| **PP3-F10** | Advisory | No product trial flow | **Open** | Advisory | No |
| **PP3-F11** | Advisory | `standard` vs `pro` vocabulary | **Open** | Advisory (F02 overlap) | No |
| **PP3-F12** | Advisory | Legacy `web/src/api/payment.ts` | **Closed** | Closed | No |
| **PP3-F13** | Advisory | AI query balance boundary docs | **Open** | Advisory | No |
| **PP3-F14** | Advisory | No Global Trash for billing | **Accepted** | Documented exception | No |

*F02 partial does not block L3 WITH FINDINGS evaluation per post-migration reassessment.

---

## Counts by classification

| Category | Count |
|----------|-------|
| **Closed** | 6 (F01, F03, F04, F06, F12) |
| **Partial** | 3 (F02, F05, F07) |
| **Open** | 4 (F08, F09, F10, F11, F13 — F08 major, rest advisory) |
| **Accepted WITH FINDINGS** | 3 (F05 partial, F07 partial, F08 open) |
| **Accepted exception** | 1 (F14) |

---

## Blocking findings (evaluation lens)

| ID | Status | Notes |
|----|--------|-------|
| PP3-F01 | Closed | — |
| PP3-F02 | Partial | Document `normalizeTier()` + deferred data migration |
| PP3-F03 | Closed | — |

**Open blocking findings: 0**

---

## Major findings (evaluation lens)

| ID | Status | Expected at L3 WITH FINDINGS |
|----|--------|------------------------------|
| PP3-F04 | Closed | — |
| PP3-F05 | Partial | Open major or partial — invoice webhook gap |
| PP3-F06 | Closed | — |
| PP3-F07 | Partial | Advisory — HR matrix by design |
| PP3-F08 | Open | **Open major** — billing dashboard |

---

## Advisory findings (expected open)

| ID | Topic |
|----|-------|
| PP3-F09 | Orphan gating file |
| PP3-F10 | Trial UX |
| PP3-F11 | Tier vocabulary |
| PP3-F13 | AI boundary docs |

---

## Evaluator briefing — accepted WITH FINDINGS items

| ID | Briefing text |
|----|---------------|
| **PP3-F08** | Billing is modal-embedded (`BillingModal`); no standalone billing dashboard. Functional for platform subscription management; UX wave deferred by charter. |
| **PP3-F05** | Platform subscription lifecycle has PE + normalized activity + domain events via `billingService`. Invoice paid/failed webhook activity deferred. |
| **PP3-F07** | Primary tier reads unified on `entitlementService`. HR uses separate feature matrix by product design; orphan simplified gating file unused. |
| **PP3-F02** | `normalizeTier()` at boundaries; legacy `standard` vocabulary in validators; no production tier bypass from dual SoR. |

---

## Disposition vs Phase 0B audit

| Phase 0B blocking | Re-audit disposition |
|-------------------|---------------------|
| F01 entitlement SoR | **Closed** |
| F02 tier drift | **Partial** — non-blocking |
| F03 dual API | **Closed** |

---

**Last updated:** 2026-06-20 (Certification Preparation)
