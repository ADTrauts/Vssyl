# Account Platform — Evaluation Roadmap

**Program:** Account Platform — Post-Council Umbrella Evaluation Roadmap  
**Date:** 2026-06-20  
**Status:** Authoritative evaluation roadmap — **umbrella execution authorized, not started**  
**Council decision:** [ACCOUNT_PLATFORM_EVALUATION_COUNCIL_DECISION.md](./ACCOUNT_PLATFORM_EVALUATION_COUNCIL_DECISION.md) — EA-AP-UMB-001

**Supersedes:** PP-1/PP-2/PP-3 sub-domain evaluation phases — **complete**. This roadmap governs **umbrella evaluation execution only**.

---

## Current position

```
Phase 0     ✅ Trilogy implementation + sub-domain eval + ratification
Phase 1     ✅ Umbrella progress review
Phase 2     ✅ Umbrella certification planning
Phase 3     ✅ Umbrella preparation package
Phase 4     ✅ Umbrella evaluation authorization review
Phase 5     ✅ Council authorization review ← COMPLETE (EA-AP-UMB-001)
Phase 6     ⏳ Umbrella evaluation execution — AUTHORIZED, NOT STARTED
Phase 7     ⏳ Umbrella ratification council
Phase 8     ⏳ Certification execution (ledger + certificate)
Phase 9     ⏳ Program closeout (optional)
```

---

## Phase 6 — Umbrella evaluation execution (authorized)

| # | Activity | Prerequisite | Status |
|---|----------|--------------|--------|
| 6.1 | Assign evaluator | Council APPROVE | ⏳ Ready |
| 6.2 | Submit evaluation packet | EA-AP-UMB-001 | ⏳ Ready |
| 6.3 | Matrix sample validation (≥40 rows) | Packet submitted | Pending |
| 6.4 | G1–G9 gate scoring | Evaluator assigned | Pending |
| 6.5 | AP-UMB findings confirmation | Eval in progress | Pending |
| 6.6 | Evaluation report production | Eval complete | Pending |
| 6.7 | L3 WITH FINDINGS recommendation | Report accepted | Pending |

**Recommended evaluation order:** **Single umbrella composite evaluation** — no sub-domain re-evaluations unless regression discovered.

**Expected duration:** 2–4 weeks governance cadence (evaluator sessions + report).

---

## Phase 7 — Umbrella ratification council

| # | Activity | Prerequisite |
|---|----------|--------------|
| 7.1 | Evaluation packet review | Phase 6 complete |
| 7.2 | Findings disposition vote | Eval recommendation |
| 7.3 | Reference status affirmation (`#AP-BILL-1`) | Eval recommendation |
| 7.4 | Ledger recommendation | Separate PR authorization |
| 7.5 | Ratification decision | Council APPROVE/REJECT/DEFER |

**Not authorized in Phase 6:** Ratification · Ledger · Certificate publication.

---

## Phase 8 — Certification execution

| # | Activity | Authorization source |
|---|----------|---------------------|
| 8.1 | Umbrella ledger row | Ratification council |
| 8.2 | Trilogy ledger rows (if not done) | Prior ratification authorization |
| 8.3 | Certificate publication | Governance execution charter |
| 8.4 | Reference catalog `#AP-BILL-1` | Separate PR |

---

## Parallel tracks (non-blocking)

| Track | Activity | Blocks Phase 6? |
|-------|----------|:---------------:|
| **Ledger PR** | Trilogy rows (PP-1 + PP-2 + PP-3) | No — recommended parallel |
| **Hygiene** | MFA, billing UX, BA dedup, tier migration | No |
| **Reference catalog** | `#AP-BILL-1` entry | No |

---

## Evaluation packet checklist (umbrella)

| Item | Source |
|------|--------|
| Composite G1–G9 evidence binder | [ACCOUNT_PLATFORM_COMPOSITE_EVIDENCE_BINDER.md](./ACCOUNT_PLATFORM_COMPOSITE_EVIDENCE_BINDER.md) |
| Unified operation matrix | [ACCOUNT_PLATFORM_UNIFIED_OPERATION_MATRIX.md](./ACCOUNT_PLATFORM_UNIFIED_OPERATION_MATRIX.md) |
| Matrix validation | [ACCOUNT_PLATFORM_UNIFIED_MATRIX_VALIDATION.md](./ACCOUNT_PLATFORM_UNIFIED_MATRIX_VALIDATION.md) |
| Composite findings register | [ACCOUNT_PLATFORM_COMPOSITE_FINDINGS_REVIEW.md](./ACCOUNT_PLATFORM_COMPOSITE_FINDINGS_REVIEW.md) |
| G1–G9 scoring model | [ACCOUNT_PLATFORM_COMPOSITE_G1_G9_MODEL.md](./ACCOUNT_PLATFORM_COMPOSITE_G1_G9_MODEL.md) |
| MFA disposition | [PP1_MFA_DISPOSITION_REVIEW.md](./PP1_MFA_DISPOSITION_REVIEW.md) |
| Webhook exception | [PP3_WEBHOOK_EXCEPTION_REVIEW.md](./PP3_WEBHOOK_EXCEPTION_REVIEW.md) |
| Trilogy ratification records | PP1/PP2/PP3 certification ratification |
| Council authorization | [ACCOUNT_PLATFORM_EVALUATION_AUTHORIZATION_COUNCIL_REVIEW.md](./ACCOUNT_PLATFORM_EVALUATION_AUTHORIZATION_COUNCIL_REVIEW.md) |
| Test inventory | ~57 trilogy-scoped tests (binder G6) |
| Sub-domain binders (reference) | PP1/PP2/PP3 G1–G9 evidence binders |

---

## Expected evaluation deliverables (Phase 6 output)

| Document | Purpose |
|----------|---------|
| `ACCOUNT_PLATFORM_CERTIFICATION_EVALUATION.md` | Evaluator report |
| `ACCOUNT_PLATFORM_CERTIFICATION_SCORECARD.md` | Final G1–G9 score |
| `ACCOUNT_PLATFORM_FINDINGS_REVIEW.md` | Umbrella findings disposition |
| `ACCOUNT_PLATFORM_CERTIFICATION_EXECUTIVE_SUMMARY.md` | Eval summary |

*Not created until evaluation execution — listed for roadmap planning only.*

---

## Timeline (illustrative)

| Milestone | Earliest |
|-----------|----------|
| Evaluator assignment | Immediate |
| Packet submission | Week 1 |
| Evaluation sessions | Weeks 1–3 |
| Evaluation report | Week 3–4 |
| Ratification council | Week 5–6 |
| Ledger PR | Post-ratification |

---

## Explicit exclusions

| Activity | Status |
|----------|--------|
| Runtime implementation during eval | Not required |
| Sub-domain re-evaluation | Out of scope unless regression |
| MFA / billing UX implementation | Post-cert hygiene |
| Ledger promotion during eval | Not authorized |
| Plain L3 certification pursuit | Not on roadmap |
| Program archive | Post-umbrella ratification |

---

## Roadmap authority

This document governs **umbrella evaluation execution** post-council authorization (EA-AP-UMB-001). Certification path remains **L3 WITH FINDINGS**. Sub-domain trilogy evaluations are **complete and ratified**.

---

**Last updated:** 2026-06-20 (Umbrella Evaluation Authorization Council Review)
