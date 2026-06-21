# Account Platform — Composite Scorecard

**Program:** Account Platform — Umbrella Progress Review  
**Date:** 2026-06-20  
**Framework:** G1–G9 platform capability gates (umbrella composite variant)  
**Status:** Progress review score — **not evaluator-certified**; basis for planning charter

**Sub-program inputs:**

| Sub-program | Ratified score | Detail |
|-------------|---------------|--------|
| PP-1 Identity & Profile | 24/27 (~89%) | [PP1_CERTIFICATION_SCORECARD.md](./PP1_CERTIFICATION_SCORECARD.md) |
| PP-2 Settings Platform | 26/27 (~96%) | [PP2_CERTIFICATION_SCORECARD.md](./PP2_CERTIFICATION_SCORECARD.md) |
| PP-3 Billing & Entitlements | 23/27 (~85%) | [PP3_CERTIFICATION_SCORECARD.md](./PP3_CERTIFICATION_SCORECARD.md) |

---

## Summary

| Metric | Value |
|--------|-------|
| **Trilogy arithmetic mean** | **24/27 (~89%)** — (24+26+23)÷3 |
| **Umbrella cross-cutting composite** | **22/27 (~81%)** — gate-by-gate with cross-cut adjustments |
| **Blocking findings (umbrella lens)** | **0** |
| **Recommended umbrella target** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Plain L3 at umbrella** | **Not appropriate** — G9, MFA, F08 block |

---

## Scoring methodology

Two scores are reported:

1. **Trilogy mean** — unweighted average of ratified sub-program G1–G9 totals. Measures sub-domain certification strength.
2. **Umbrella cross-cutting composite** — gate scored at **program level**, applying:
   - **Minimum sub-score** where cross-cutting coherence is weakest (G1, G6, G9)
   - **Cross-cutting deductions** for unified matrix absence and MFA disposition
   - **Maximum sub-score** where sub-programs are uniformly strong (G3, G4, G7)

This follows portfolio precedent (Business Operations composite, Context Graph umbrella adjustment).

---

## Trilogy gate rollup (sub-program scores by gate)

| Gate | PP-1 | PP-2 | PP-3 | Min | Mean | Max |
|------|-----:|-----:|-----:|----:|-----:|----:|
| **G1** Authorization | 3 | 3 | 2 | 2 | 2.67 | 3 |
| **G2** Auditability | 2 | 3 | 3 | 2 | 2.67 | 3 |
| **G3** Service boundaries | 3 | 3 | 3 | 3 | 3.00 | 3 |
| **G4** API coherence | 3 | 3 | 3 | 3 | 3.00 | 3 |
| **G5** Ownership | 3 | 2 | 3 | 2 | 2.67 | 3 |
| **G6** Test evidence | 2 | 3 | 2 | 2 | 2.33 | 3 |
| **G7** Documentation | 3 | 3 | 3 | 3 | 3.00 | 3 |
| **G8** Production safety | 2 | 3 | 2 | 2 | 2.33 | 3 |
| **G9** UX consistency | 3 | 3 | 1 | 1 | 2.33 | 3 |
| **Total** | **24** | **26** | **23** | — | **24.33** | — |

---

## Umbrella cross-cutting G1–G9 scorecard

| Gate | Umbrella score | Max | Status | Justification |
|------|---------------:|----:|--------|---------------|
| **G1** Authorization | 2 | 3 | **PARTIAL** | PP3 module commerce PE gap (PP3-EVAL-F01); MFA dispositioned at PP-1 (PP1-F03) — no P0 bypass |
| **G2** Auditability | 2 | 3 | **PARTIAL** | PP1 identity domain events gap (PP1-EVAL-A01); PP3 invoice webhook activity deferred (PP3-F05) |
| **G3** Service boundaries | 3 | 3 | **PASS** | Trilogy services constitutional; thin controllers; documented exclusions held |
| **G4** API coherence | 3 | 3 | **PASS** | `/api/settings`, `/api/billing`, `/api/account/*`, identity APIs converged; payment retired |
| **G5** Ownership | 2 | 3 | **PARTIAL** | PP2-F05 business dedup; PP3-F02 tier vocab; exclusions (BA, AI, Dashboard) clean |
| **G6** Test evidence | 2 | 3 | **PARTIAL** | PP-2 strong (24 tests); PP-1/PP-3 partial depth; no umbrella integration E2E suite |
| **G7** Documentation | 3 | 3 | **PASS** | Complete trilogy doc set; unified operation matrix **pending** — does not block score |
| **G8** Production safety | 2 | 3 | **PARTIAL** | MFA absent (dispositioned); tier edge cases (F02); Stripe external dependency managed |
| **G9** UX consistency | 2 | 3 | **PARTIAL** | PP3-F08 modal billing pulls composite down; PP-1/PP-2 UX strong; not FAIL at umbrella (modal functional) |
| **TOTAL** | **22** | **27** | **~81%** | **L3 WITH FINDINGS target** |

**G9 umbrella adjustment:** Sub-program PP-3 scored G9=1 (FAIL). At umbrella level, PP-1 and PP-2 UX coherence compensates — composite G9 scored **2** (PARTIAL), not 1. Plain L3 still blocked.

---

## Gate detail — umbrella lens

### G1 — Authorization (2/3)

| Check | Result |
|-------|--------|
| Identity PE (`identityPolicyDual`) | ✅ |
| Settings PE | ✅ |
| Billing + entitlement PE | ✅ WF |
| Module subscription PE | ⚠️ PP3-EVAL-F01 |
| MFA | ⚠️ PP1-F03 dispositioned |

### G2 — Auditability (2/3)

| Check | Result |
|-------|--------|
| Trilogy module activity on writes | ✅ |
| Domain events (settings, billing) | ✅ |
| Identity domain events | ❌ PP1-EVAL-A01 |
| Invoice webhook activity | ⚠️ PP3-F05 |

### G3 — Service boundaries (3/3)

| Check | Result |
|-------|--------|
| PP-1 service extraction | ✅ |
| PP-2 orchestration layer | ✅ |
| PP-3 billing + entitlement facade | ✅ |
| Documented exclusions | ✅ |

### G4 — API coherence (3/3)

| Check | Result |
|-------|--------|
| Settings API contract | ✅ |
| Billing API canonical | ✅ |
| Account entitlement reads | ✅ |
| Payment API retired (JWT) | ✅ |

### G5 — Ownership (2/3)

| Check | Result |
|-------|--------|
| Sub-program SoR defined | ✅ |
| Tier SoR (`Subscription.tier`) | ✅ WF |
| Business settings triplication | ⚠️ PP2-F05 |
| Excluded domains held | ✅ |

### G6 — Test evidence (2/3)

| Check | Result |
|-------|--------|
| PP-2 core tests (24) | ✅ |
| PP-3 billing/entitlement tests (20+) | ✅ WF |
| PP-1 test gaps | ⚠️ G6 partial |
| Umbrella integration E2E | ❌ Not yet |

### G7 — Documentation (3/3)

| Check | Result |
|-------|--------|
| Trilogy architecture docs | ✅ |
| Operation matrices (per sub-program) | ✅ |
| Unified umbrella matrix | ⏳ Pending |
| Findings registers | ✅ |

### G8 — Production safety (2/3)

| Check | Result |
|-------|--------|
| Auth/session hardening | ✅ WF |
| MFA | ⚠️ Dispositioned |
| Stripe webhook security | ✅ |
| Tier vocabulary safety | ⚠️ F02 partial |

### G9 — UX consistency (2/3)

| Check | Result |
|-------|--------|
| Settings hub IA | ✅ |
| Identity profile UX | ✅ |
| Billing UX | ⚠️ Modal-only (F08) |
| Cross-hub navigation | ✅ WF |

---

## Threshold evaluation

| Threshold | Requirement | Umbrella result |
|-----------|-------------|-----------------|
| NOT READY | &lt;70% OR open blocking | **Not met** — passes |
| PROGRESS REVIEW | Trilogy ratified | **Met** — this review |
| EVALUATION PLANNING | ≥80% composite; 0 blockers | **Met** — 81% cross-cutting |
| READY FOR EVALUATION | Unified matrix + binder + auth | **Not met** — prep pending |
| Plain L3 | All ≥2, G9≥2, no FAIL | **Not met** |
| **L3 WITH FINDINGS** | Core + tracked findings | **Target — met at planning lens** |

---

## Sub-program vs umbrella comparison

| Metric | PP-1 | PP-2 | PP-3 | Umbrella |
|--------|------|------|------|----------|
| Score | 24/27 | 26/27 | 23/27 | 22/27 |
| % | 89% | 96% | 85% | 81% |
| Weakest gate | G2, G6, G8 | G5 | G9 | G1, G2, G5, G6, G8, G9 |
| Strongest gate | G1, G3, G4, G5, G7, G9 | G1–G4, G6–G8 | G2–G5, G7 | G3, G4, G7 |

---

## Score trajectory (program)

| Milestone | Composite est. | Notes |
|-----------|---------------|-------|
| Phase 0A discovery | ~44% avg | Pre-audit estimates |
| Post PP-1 foundation | ~89% | PP-1 alone |
| Post PP-2 foundation | ~91% | PP-1 + PP-2 |
| Post PP-3 ratification | **~89% trilogy / ~81% umbrella** | This scorecard |
| Post umbrella eval (projected) | ~82–85% | Evaluator conservative band |

---

**Last updated:** 2026-06-20 (Umbrella Progress Review)
