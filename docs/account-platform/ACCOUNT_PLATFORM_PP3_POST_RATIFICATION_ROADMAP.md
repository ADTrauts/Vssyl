# Account Platform — PP-3 Post-Ratification Roadmap

**Program:** Account Platform — Post PP-3 Certification Ratification  
**Date:** 2026-06-20  
**Status:** Authoritative post-ratification roadmap  
**Council decision:** [ACCOUNT_PLATFORM_PP3_COUNCIL_DECISION.md](./ACCOUNT_PLATFORM_PP3_COUNCIL_DECISION.md)

**Constraint:** Governance roadmap only — no implementation authorized in this document except by reference to separate charters.

---

## Current position

```
Phase 0–0.6   ✅ Planning · Prep · Eval Authorization
Phase 1       ✅ PP-1 Evaluation · ✅ PP-2 Evaluation · ✅ PP-3 Evaluation
Phase 1b      ✅ PP-1 Ratification · ✅ PP-2 Ratification · ✅ PP-3 Ratification ← COMPLETE
Phase 1c      ⏳ Ledger PR (PP-1 + PP-2 + PP-3) — authorized, not executed
Phase 2       ⏳ Reference catalog PR (#AP-BILL-1) — authorized, not executed
Phase 3       ⏳ Umbrella Progress Review — **recommended next gate**
Phase 4       ⏳ Umbrella composite evaluation · ratification
```

---

## Ratified certification state (trilogy complete)

| Sub-program | Ratified level | Score | Open findings |
|-------------|----------------|-------|---------------|
| **PP-1 Identity** | L3 WITH FINDINGS | 24/27 | ~9 tracked |
| **PP-2 Settings** | L3 WITH FINDINGS | 26/27 | ~6 tracked |
| **PP-3 Billing** | L3 WITH FINDINGS | 23/27 | ~10 tracked |
| **Umbrella composite** | Not ratified | ~84% est. | Phase 3 gate |

---

## Immediate next gates (ordered)

| # | Gate | Type | Priority |
|---|------|------|----------|
| 1 | **Ledger PR** — PP-1 + PP-2 + PP-3 rows | Certification execution | **High** — authorized by ratification |
| 2 | **Umbrella progress review** | Governance | **High** — trilogy complete |
| 3 | Reference catalog PR — `#AP-BILL-1` | Governance | Medium |
| 4 | Umbrella evaluation authorization | Governance | Post progress review |
| 5 | Umbrella composite evaluation | Governance | Phase 4 |
| 6 | Umbrella ratification council | Governance | Phase 4 |

---

## PP-3 post-certification hygiene (optional charters)

| Item | Finding | Blocks plain L3? | Priority |
|------|---------|------------------|----------|
| Billing dashboard / account billing page | PP3-F08 | **Yes** | P1 |
| Tier enum data migration | PP3-F02 | **Yes** | P2 |
| Invoice webhook activity | PP3-F05 | Partial | P2 |
| Module commerce PE | PP3-EVAL-F01 | Partial | P2 |
| G9 UX shell alignment | G9 | **Yes** | P1 (with F08) |
| Checkout E2E test | PP3-EVAL-F02 | No | P3 |
| Orphan gating cleanup | PP3-F09 | No | P3 |
| Product trial UX | PP3-F10 | No | P3 |
| AI query balance docs | PP3-F13 | No | P3 |

**Modernization complete for:** Entitlement foundation, billing service facade, API convergence, client migration, payment route retirement, Stripe checkout sync, tier read convergence.

**Modernization incomplete for:** Dedicated billing UX surface (F08), tier vocabulary hardening (F02), invoice audit path (F05).

---

## Cross-trilogy hygiene (umbrella inputs)

| Theme | Sub-programs | Umbrella impact |
|-------|--------------|-----------------|
| MFA / security UX | PP-1 (F03) | Cross-cutting umbrella finding |
| Business settings dedup | PP-2 (F05) | BA-owned; umbrella advisory |
| Billing UX | PP-3 (F08) | PP-3 plain L3 blocker |
| Reference patterns | PP-1/PP-2 deferred; PP-3 `#AP-BILL-1` | Umbrella Phase 3 pattern council |

---

## Umbrella progress review scope (Phase 3)

When authorized, umbrella progress review should cover:

1. **Composite G1–G9** — weighted sub-program scores (~84%)
2. **Unified findings register** — merge PP-1 (~9) + PP-2 (~6) + PP-3 (~10)
3. **Cross-cutting risks** — MFA (PP-1), business dedup (PP-2), billing UX (PP-3)
4. **Reference portfolio** — PP-3 billing pattern; PP-1/PP-2 deferrals
5. **Ledger state** — confirm trilogy rows before umbrella evaluation
6. **Level 4 denial** — reaffirm File Hub as sole L4

**Umbrella target level (preliminary):** L3 WITH FINDINGS — consistent with all three sub-programs.

---

## Reference promotion path

| Capability | Current | Promotion trigger |
|------------|---------|-------------------|
| `#AP-BILL-1` Billing Pattern | Reference Capability With Findings | Close F08, F05, PP3-EVAL-F01 |
| PP-2 Settings Pattern | Deferred | Umbrella pattern council or F05 closure |
| PP-1 Identity Pattern | Deferred | MFA (F03) closure |
| Entitlement Resolver | Candidate | F02 closure |

---

## Program archive

**Not authorized** — trilogy ratification complete; umbrella path active. Archive deferred until umbrella composite ratification or explicit program closeout charter.

---

## Stop conditions (this roadmap)

| Action | Status |
|--------|--------|
| Runtime implementation | **Not authorized** |
| Certification execution | **Not authorized** (ledger PR separate) |
| Ledger update | **Not executed** |
| Program archive | **Not authorized** |

---

**Last updated:** 2026-06-20 (Post PP-3 Ratification Roadmap)
