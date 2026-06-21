# Account Platform — Certification Planning Charter

**Program:** Account Platform — Certification Planning  
**Date:** 2026-06-20  
**Type:** Governance charter — **planning only**  
**Status:** **Ratified for planning purposes** — no evaluation, certification, or ledger execution authorized

**Authority:** Supersedes Phase 0C certification timing for evaluation sequencing. Does not authorize implementation, evaluation execution, or ledger promotion.

**Baseline:** [ACCOUNT_PLATFORM_POST_PP2_REASSESSMENT.md](./ACCOUNT_PLATFORM_POST_PP2_REASSESSMENT.md) · [ACCOUNT_PLATFORM_CERTIFICATION_SEQUENCE_UPDATE.md](./ACCOUNT_PLATFORM_CERTIFICATION_SEQUENCE_UPDATE.md)

---

## Charter purpose

Define the **authoritative certification roadmap** for the Account Platform trilogy (PP-1 Identity, PP-2 Settings, PP-3 Billing & Entitlements) and the umbrella composite capability.

---

## Program posture at charter issuance

| Sub-program | Readiness | Evaluation posture |
|-------------|-----------|-------------------|
| **PP-1 Identity & Profile** | ~89% | READY FOR EVALUATION |
| **PP-2 Settings Platform** | ~93% | READY FOR EVALUATION |
| **PP-3 Billing & Entitlements** | ~85% | NOT READY — client migration prerequisite |
| **Account Platform umbrella** | ~82% | NOT CERTIFIABLE — planning only |

---

## Certification model

| Field | Decision |
|-------|----------|
| **Topology** | **Hybrid Option C** — phased sub-domain L3 WITH FINDINGS, then umbrella composite |
| **Target outcome (sub-domains)** | **L3 WITH FINDINGS** — not plain L3 |
| **Target outcome (umbrella)** | **Progress review** → composite L3 WITH FINDINGS (no plain L3 in horizon) |
| **Framework** | G1–G9 platform capability gates |
| **Evaluator** | Council-designated certification evaluator (separate authorization per eval) |
| **Ledger** | **Out of scope** — no promotion in this charter |

---

## Certification boundaries

### In scope

| Boundary | Includes |
|----------|----------|
| **PP-1** | `authService`, `profileService`, `profilePhotoService`, `privacyService`, `connectionService`, identity activity, `/api/auth`, `/api/profile`, `/api/privacy`, `/api/profile-photos`, `/api/member` |
| **PP-2** | `settingsService`, `preferenceRegistry`, `/api/settings`, settings activity, personal settings hub IA, notification adapter |
| **PP-3** | `entitlementService`, `billingService`, `/api/account/*`, `/api/billing/*`, billing PE/events, entitlement SoR |
| **Umbrella** | Cross-cutting ownership, unified operation matrix, trilogy dependency coherence |

### Explicitly excluded

| Area | Owner / reason |
|------|----------------|
| Business Administration profile/branding | BA L3 certified — separate program |
| AI personality / autonomy | AI Platform deferred L3 |
| Dashboard layout preferences | Dashboard Wave 3 |
| Admin Portal billing ops | Admin Portal L3 |
| MFA implementation | PP-1 Phase 1B — disposition document only for eval |
| Billing dashboard UX | PP-3 WITH FINDINGS advisory |
| Business settings deduplication | BA program — PP2-F05 WITH FINDINGS |

---

## Planning prerequisites (before any evaluation begins)

| # | Requirement | Owner | Blocks |
|---|-------------|-------|--------|
| 1 | Operation matrix re-audit (PP-1, PP-2, PP-3) | Program governance | All evals |
| 2 | G1–G9 evidence binders per sub-program | Program governance | All evals |
| 3 | Findings disposition register (WITH FINDINGS vs must-close) | Program governance | All evals |
| 4 | MFA disposition document (PP1-F03) | PP-1 governance | PP-1 eval |
| 5 | PP-3 client migration charter (separate) | PP-3 governance | PP-3 eval only |
| 6 | Evaluation authorization vote (per sub-domain) | Council | Each eval |

**This charter satisfies item 3 at planning level.** Items 1, 2, 4, 6 remain before evaluation execution.

---

## Authoritative evaluation order

| Phase | Activity | Timing |
|-------|----------|--------|
| **0** | Planning prerequisites (matrix re-audit, evidence binders) | Before evals |
| **1** | **PP-1 + PP-2 evaluations in parallel** | After Phase 0 |
| **1b** | PP-3 Client Migration (implementation — separate charter) | Parallel with Phase 1 OK |
| **2** | PP-3 evaluation | After client migration |
| **3** | Umbrella progress review | After all three sub-domain evals |
| **4** | Umbrella certification recommendation | Council vote — separate |

**Recommendation:** **Parallel PP-1 + PP-2 evaluations** — justified because both are eval-ready, independent constitutional boundaries, and PP-2 no longer depends on PP-3 client migration. PP-1 is listed first for **certification narrative** (foundation dependency) but not required to complete before PP-2 eval starts.

**PP-3 evaluates last** among sub-domains — client migration is a hard gate.

---

## Readiness gates summary

| Gate | PP-1 | PP-2 | PP-3 | Umbrella |
|------|------|------|------|----------|
| Implementation foundation | ✅ | ✅ | ✅ | Partial |
| No open **blocking** findings (eval lens) | ✅ | ✅ | ❌ F03 partial | ❌ |
| Operation matrix current | ⏳ | ⏳ | ⏳ | ⏳ |
| G6 test evidence adequate | Partial | ✅ | ✅ | Partial |
| Client namespace converged | — | — | ❌ | ❌ |
| All sub-domains L3 WITH FINDINGS | — | — | — | ❌ |

---

## Required questions — charter answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Which sub-domain evaluates first? | **PP-1 and PP-2 in parallel** (PP-1 first in narrative sequence) |
| 2 | Which sub-domain certifies first? | **PP-2** (strongest score ~93%) or PP-1 if parallel completes together |
| 3 | Strongest today? | **PP-2 (~93%)** |
| 4 | Findings block evaluation? | **PP3-F03 partial** blocks PP-3 only; none block PP-1/PP-2 after planning prereqs |
| 5 | Findings block certification? | **PP1-F03** blocks plain L3; **PP3-F03** blocks PP-3 plain L3; **F05/F08** → WITH FINDINGS |
| 6 | PP-3 client migration before eval? | **Yes** |
| 7 | PP-1 evaluate now? | **Yes** — after planning prerequisites (matrix re-audit, evidence binder) |
| 8 | PP-2 evaluate now? | **Yes** — same prerequisites |
| 9 | PP-3 evaluate now? | **No** |
| 10 | Umbrella planning begin? | **Yes** — this charter |
| 11 | Earliest umbrella evaluation? | **~2–3 months after PP-1/PP-2 evals + client migration + PP-3 eval** (illustrative: Q4 2026–Q1 2027) |
| 12 | Earliest umbrella certification? | **Q1–Q2 2027** illustrative — composite L3 WITH FINDINGS only |
| 13 | Certification sequence? | Parallel PP-1/PP-2 → PP-3 → Umbrella |
| 14 | Implementation sequence from here? | Matrix re-audit → Client Migration ∥ Eval prep → Evaluations → Umbrella review |
| 15 | Do NOT work on next? | Ledger, council ratification, billing UX, plain L3, eval execution without separate authorization |

---

## Deliverables produced by this charter

| Document |
|----------|
| [ACCOUNT_PLATFORM_CERTIFICATION_PLANNING_CHARTER.md](./ACCOUNT_PLATFORM_CERTIFICATION_PLANNING_CHARTER.md) |
| [PP1_CERTIFICATION_PLAN.md](./PP1_CERTIFICATION_PLAN.md) |
| [PP2_CERTIFICATION_PLAN.md](./PP2_CERTIFICATION_PLAN.md) |
| [PP3_CERTIFICATION_PLAN.md](./PP3_CERTIFICATION_PLAN.md) |
| [ACCOUNT_PLATFORM_CERTIFICATION_SEQUENCE.md](./ACCOUNT_PLATFORM_CERTIFICATION_SEQUENCE.md) |
| [ACCOUNT_PLATFORM_CERTIFICATION_EXECUTIVE_SUMMARY.md](./ACCOUNT_PLATFORM_CERTIFICATION_EXECUTIVE_SUMMARY.md) |

---

## Stop condition

Planning charter **complete**. No implementation. No evaluation execution. No certification. No ledger. No council ratification vote.

**Next governance actions (separate authorizations):**
1. Operation matrix re-audit charter
2. PP-3 Client Migration implementation charter
3. PP-1 / PP-2 evaluation authorization votes

---

**Last updated:** 2026-06-20 (Certification Planning Charter)
