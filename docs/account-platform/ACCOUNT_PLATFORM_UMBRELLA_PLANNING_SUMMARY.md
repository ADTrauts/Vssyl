# Account Platform — Umbrella Planning Summary

**Program:** Account Platform — Umbrella Certification Planning  
**Date:** 2026-06-20  
**Audience:** Platform Architecture Governance · Engineering Leadership  
**Status:** **PLANNING COMPLETE**

---

## Planning outcome

**Formal umbrella certification strategy is complete.** Account Platform proceeds from progress review to **evaluation prep and authorization** — not back to primary modernization mode.

| Decision | Outcome |
|----------|---------|
| **Certification topology** | Composite platform capability over ratified trilogy |
| **Target level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Composite score (planning)** | **22/27 (~81%)** umbrella · **24/27 (~89%)** trilogy mean |
| **Blockers** | **0** |
| **Ready for evaluation execution?** | **No** — binder + authorization pending |
| **Ready for evaluation planning?** | **Yes — complete** |

---

## Trilogy foundation

| Sub-program | Score | Level | Open findings |
|-------------|------:|-------|---------------|
| PP-1 Identity & Profile | 24/27 | L3 WF | ~9 |
| PP-2 Settings Platform | 26/27 | L3 WF | ~6 |
| PP-3 Billing & Entitlements | 23/27 | L3 WF | ~10 |

---

## Composite findings posture

| Class | Count |
|-------|------:|
| Blocking | **0** |
| Major (AP-UMB-M01–M07) | **7** |
| Advisory (AP-UMB-ADV-01–18) | **18** |
| Accepted WITH FINDINGS | **2** |

Plain L3 blocked by MFA, billing UX, business dedup, tier vocabulary, and photo controller boundary.

---

## Unified operation matrix (merged)

| Slice | Rows | C / P / N |
|-------|-----:|-----------|
| Identity | 37 | 7 / 27 / 3 |
| Settings (core) | 26 | 15 / 11 / 0 |
| Billing & Entitlements | 47 | 19 / 23 / 2 |
| Shared platform | 12 | 8 / 4 / 0 |
| **Total** | **122** | **49 / 65 / 5** |

~**40% compliant** · ~**53% partial** · ~**4% non-compliant** (all dispositioned).

---

## Required questions — answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Umbrella certification topology? | **Composite platform capability** — inherited trilogy + cross-cut review |
| 2 | Composite scoring model? | **Dual score** — trilogy mean (89%) + gate aggregation (81%) |
| 3 | Composite blockers? | **0** |
| 4 | Composite majors? | **7** — MFA, billing UX, business dedup, tier vocab, invoice activity, photo controller, module PE |
| 5 | Composite advisories? | **18** |
| 6 | Evaluation prerequisites? | Composite evidence binder + evaluation authorization vote |
| 7 | Evaluation blockers? | **Binder + authorization** — not findings |
| 8 | Ready for evaluation planning? | **Yes — complete** |
| 9 | Ready for evaluation execution? | **No** |
| 10 | Earliest certification path? | **Q1–Q2 2027** illustrative |
| 11 | Recommended umbrella target? | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| 12 | Remaining modernization work? | **Hygiene** — MFA, billing dashboard, BA dedup, tier migration (non-blocking) |
| 13 | Remaining governance work? | Binder → eval auth → eval → ratification → ledger |
| 14 | Recommended next authorization? | **Composite evidence binder** then **umbrella evaluation authorization** |
| 15 | Final planning outcome? | **Strategy complete** — proceed to Phase 4 prep |

---

## Deliverables produced

| Document | Purpose |
|----------|---------|
| [ACCOUNT_PLATFORM_UMBRELLA_CERTIFICATION_PLAN.md](./ACCOUNT_PLATFORM_UMBRELLA_CERTIFICATION_PLAN.md) | Authoritative certification strategy |
| [ACCOUNT_PLATFORM_UNIFIED_OPERATION_MATRIX.md](./ACCOUNT_PLATFORM_UNIFIED_OPERATION_MATRIX.md) | Merged 122-row operation matrix |
| [ACCOUNT_PLATFORM_COMPOSITE_G1_G9_MODEL.md](./ACCOUNT_PLATFORM_COMPOSITE_G1_G9_MODEL.md) | Scoring rules and gate inheritance |
| [ACCOUNT_PLATFORM_UMBRELLA_FINDINGS_STRATEGY.md](./ACCOUNT_PLATFORM_UMBRELLA_FINDINGS_STRATEGY.md) | AP-UMB findings classification |
| [ACCOUNT_PLATFORM_UMBRELLA_EXECUTION_ROADMAP.md](./ACCOUNT_PLATFORM_UMBRELLA_EXECUTION_ROADMAP.md) | Phase 4–9 execution sequence |
| [ACCOUNT_PLATFORM_UMBRELLA_PLANNING_SUMMARY.md](./ACCOUNT_PLATFORM_UMBRELLA_PLANNING_SUMMARY.md) | This summary |

---

## Next gates (ordered)

| Priority | Gate | Type |
|----------|------|------|
| **1** | Composite G1–G9 evidence binder | Governance prep |
| **2** | Trilogy ledger PR | Certification execution (parallel OK) |
| **3** | Umbrella evaluation authorization | Council vote |
| **4** | Umbrella certification evaluation | Governance |
| **5** | Umbrella ratification council | Governance |

---

## Stop condition

Planning **complete**. No implementation. No certification. No ledger. No ratification.

---

**Last updated:** 2026-06-20 (Umbrella Certification Planning)
