# Account Platform — Certification Scorecard

**Program:** Account Platform — Umbrella Certification Evaluation  
**Date:** 2026-06-20  
**Evaluator:** Account Platform certification evaluation (governance)  
**Outcome:** **LEVEL 3 CERTIFIED WITH FINDINGS** (recommended — not ratified)

---

## Summary

| Metric | Value |
|--------|-------|
| **Final G1–G9 score** | **22/27 (~81%)** |
| **Prep binder estimate** | 22/27 (~81%) |
| **Delta** | **0** — prep score confirmed |
| **Trilogy mean (informational)** | 24/27 (~89%) |
| **Blocking findings** | **0** |
| **Certification recommendation** | **L3 WITH FINDINGS** |
| **Plain L3** | **Not appropriate** |

---

## Gate scorecard

| Gate | Name | Prep | Eval | Score | Verdict |
|------|------|------|------|-------|---------|
| **G1** | Authorization | 2/3 | 2/3 | **2** | **PARTIAL** |
| **G2** | Auditability | 2/3 | 2/3 | **2** | **PARTIAL** |
| **G3** | Service boundaries | 3/3 | 3/3 | **3** | **PASS** |
| **G4** | API coherence | 3/3 | 3/3 | **3** | **PASS** |
| **G5** | Ownership | 2/3 | 2/3 | **2** | **PARTIAL** |
| **G6** | Test evidence | 2/3 | 2/3 | **2** | **PARTIAL** |
| **G7** | Documentation | 3/3 | 3/3 | **3** | **PASS** |
| **G8** | Production safety | 2/3 | 2/3 | **2** | **PARTIAL** |
| **G9** | UX consistency | 2/3 | 2/3 | **2** | **PARTIAL** |
| | **Total** | 22/27 | **22/27** | **22** | **L3 WITH FINDINGS** |

**Scoring rule:** Gate ≥2 = pass. G9 compensation applied (PP-3 G9=1 → umbrella G9=2).

---

## Inherited sub-domain scores (not re-scored)

| Sub-program | Ratified score | Umbrella influence |
|-------------|---------------:|-------------------|
| PP-1 Identity | 24/27 | G1, G2, G6, G8, G9 inputs |
| PP-2 Settings | 26/27 | G2, G5, G9 inputs |
| PP-3 Billing | 23/27 | G1, G2, G5, G8, G9 inputs |

---

## G1 — Authorization (2/3)

| Check | Slice | Result |
|-------|-------|--------|
| Identity PE | PP-1 | ✅ |
| Settings PE | PP-2 | ✅ |
| Billing + entitlement PE | PP-3 | ✅ WF |
| Module commerce PE | PP-3 | ❌ M07 |
| MFA | Cross-cut | ⚠️ M01 dispositioned |

---

## G2 — Auditability (2/3)

| Check | Result |
|-------|--------|
| Trilogy module activity on writes | ✅ |
| Settings/billing/entitlement domain events | ✅ |
| Identity domain events in registry | ❌ ADV-05 |
| Invoice webhook activity | ⚠️ M05 |
| Emit on failure only — never | ✅ |

---

## G3 — Service boundaries (3/3)

| Check | Result |
|-------|--------|
| Constitutional service layers (trilogy) | ✅ |
| Thin controllers on mutation paths | ✅ WF |
| No cross-slice unauthorized writes | ✅ |
| Exclusions held | ✅ |

---

## G4 — API coherence (3/3)

| Check | Result |
|-------|--------|
| Identity API namespace | ✅ |
| Settings API contract | ✅ |
| Billing + account API canonical | ✅ |
| Payment API retired | ✅ |
| Client convergence | ✅ |

---

## G5 — Ownership (2/3)

| Check | Result |
|-------|--------|
| Sub-program SoR defined | ✅ |
| Tier SoR (`Subscription.tier`) | ✅ WF |
| Business settings triplication | ⚠️ M03 |
| BA / AI / Dashboard exclusions | ✅ |

---

## G6 — Test evidence (2/3)

| Check | Result |
|-------|--------|
| Trilogy tests (~57) | ✅ Adequate WF |
| PP-2 strong coverage (24) | ✅ |
| PP-1 partial (8) | ⚠️ Inherited |
| Umbrella cross-slice E2E | ❌ EVAL-F01 |

---

## G7 — Documentation (3/3)

| Check | Result |
|-------|--------|
| Trilogy doc set (60+) | ✅ |
| Umbrella planning + prep | ✅ |
| Unified matrix + validation | ✅ |
| Evaluation packet | ✅ |

---

## G8 — Production safety (2/3)

| Check | Result |
|-------|--------|
| Auth/session hardening | ✅ WF |
| Stripe webhook security | ✅ |
| Migration safety (410, wrappers) | ✅ |
| MFA | ⚠️ M01 dispositioned |
| Tier vocabulary | ⚠️ ACC-01 |

---

## G9 — UX consistency (2/3)

| Check | Result |
|-------|--------|
| Settings hub IA | ✅ |
| Identity UX | ✅ |
| Billing modal functional | ✅ |
| Billing dashboard | ❌ M02 |
| G9 compensation from PP-3 | ✅ Applied |

---

## Threshold evaluation

| Threshold | Requirement | Result |
|-----------|-------------|--------|
| NOT CERTIFIABLE | &lt;70% OR blocking | **Not met** |
| L3 WITH FINDINGS | All ≥2 · 0 blockers | **Met** |
| Plain L3 | All ≥2, G9≥3, no majors | **Not met** |

---

## Portfolio comparison

| Surface | Score at eval | Level rec. | Umbrella |
|---------|--------------|------------|----------|
| Business Operations | 24/27 | L3 WF | ✅ Same band |
| Reference Workspace | 23/27 | L3 WF | ✅ Adjacent |
| PP-3 Billing | 23/27 | L3 WF | ✅ Sub-domain |
| **Account Platform** | **22/27** | **L3 WF** | **Evaluated** |

---

**Last updated:** 2026-06-20 (Umbrella Certification Evaluation)
