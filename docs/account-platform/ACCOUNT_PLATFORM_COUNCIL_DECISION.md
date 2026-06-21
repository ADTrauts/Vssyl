# Account Platform — Council Decision

**Program:** Account Platform — Umbrella Certification Ratification Council  
**Ratification date:** 2026-06-20  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — certification **EXECUTED** 2026-06-20; ledger updated; program **ARCHIVED**

**Completes:** Account Platform modernization program — trilogy + umbrella composite

---

## Council session record

| Field | Value |
|-------|-------|
| Session | Account Platform Certification Council — Umbrella Ratification |
| Surface under vote | Account Platform (umbrella composite) |
| Framework | Account Platform G1–G9 (umbrella variant) |
| Validated score | **22/27 (~81%)** |
| Blocking findings | **0** |
| Open major findings | **7** |
| Open advisory findings | **19** |
| Level 4 denial | **Affirmed** — File Hub remains sole Reference Implementation (L4) |

---

## A. Certification vote — RD-AP-UMB-001

| Field | Decision |
|-------|----------|
| **Vote** | **APPROVE** |
| **Certification level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Detail** | [ACCOUNT_PLATFORM_CERTIFICATION_RATIFICATION.md](./ACCOUNT_PLATFORM_CERTIFICATION_RATIFICATION.md) |

**Alternatives rejected:**

| Option | Reason |
|--------|--------|
| REJECT | 0 blockers; score within portfolio band; complete evaluation |
| DEFER | No material benefit — all prep and eval gates complete |
| Plain L3 | 7 open majors block — correctly not pursued |

---

## B. Findings treatment — RD-AP-UMB-002

| Class | Count | Certificate treatment |
|-------|------:|----------------------|
| Blocking (open) | 0 | — |
| Major | 7 | **Tracked WITH FINDINGS** |
| Advisory | 19 | **Track-only** |
| Accepted WF | 2 | **Documented waivers** |
| Closed (frozen) | ~23 | No reopen |

**Post-cert obligations (recommended, not mandatory):**

| Theme | Findings | Priority |
|-------|----------|----------|
| Security | M01 (MFA) | P1 for plain L3 |
| Billing UX | M02 | P1 for plain L3 |
| Cross-domain ownership | M03 (BA dedup) | P2 |
| Entitlement hardening | M04, M05, M07 | P2 |
| Identity boundary | M06 | P3 |
| Hygiene | ADV-01–18, EVAL-F01 | P3 |

---

## C. Reference status — RD-AP-UMB-REF-001

| Field | Decision |
|-------|----------|
| **Account Platform composite** | **Not a reference domain** |
| **#AP-BILL-1 Billing Pattern** | **Reference Capability With Findings** |
| **PP-1 / PP-2 patterns** | **Deferred** |
| **Entitlement resolver** | **Candidate** |
| **Catalog PR** | **Authorized separately** |

**Detail:** [ACCOUNT_PLATFORM_REFERENCE_DECISION.md](./ACCOUNT_PLATFORM_REFERENCE_DECISION.md)

---

## D. Trilogy + umbrella consistency review

| Surface | Score | Level | At ratification |
|---------|------:|-------|-----------------|
| PP-1 Identity | 24/27 | L3 WF | ✅ Prior ratification |
| PP-2 Settings | 26/27 | L3 WF | ✅ Prior ratification |
| PP-3 Billing | 23/27 | L3 WF | ✅ Prior ratification |
| **Account Platform umbrella** | **22/27** | **L3 WF** | **✅ This session** |
| Reference Workspace | 23/27 | WS-L3 WF | Precedent |
| Business Operations | 24/27 | L3 WF | Precedent |

**Council determination:** Umbrella ratification at **22/27** is **consistent with portfolio precedent**. Composite score below trilogy mean (89%) is expected for cross-cut aggregation. Advisory count (19) below Business Operations (17 at eval + majors). L3 WITH FINDINGS correct — not plain L3.

---

## E. Program status — RD-AP-UMB-003

| Field | Status |
|-------|--------|
| **Account Platform program** | **RATIFIED L3 WITH FINDINGS** |
| **Trilogy** | **Complete** — all sub-domains + umbrella |
| **Modernization charters** | **Complete** — chartered scope delivered |
| **Program closeout** | **ARCHIVED** 2026-06-20 — [ACCOUNT_PLATFORM_PROGRAM_ARCHIVE.md](./ACCOUNT_PLATFORM_PROGRAM_ARCHIVE.md) |
| **Umbrella evaluation** | **Complete** |
| **Umbrella ratification** | **Complete** |

---

## F. Ledger recommendation — RD-AP-UMB-004

| Field | Recommendation |
|-------|----------------|
| **Umbrella ledger row authorized?** | **YES** — separate Platform Engineering PR |
| **Combined trilogy + umbrella PR?** | **Recommended** — single PR or phased |
| **Ledger updated in session?** | **YES** — executed 2026-06-20 Final Governance Execution |
| **Certification execution in session?** | **YES** — executed 2026-06-20 Final Governance Execution |
| **Proposed notation** | LEVEL 3 CERTIFIED WITH FINDINGS · Account Platform · G1–G9 22/27 |

---

## G. Certification execution authorization

| Field | Decision |
|-------|----------|
| **Ratification complete?** | **YES** |
| **Certification execution authorized?** | **NO** — separate governance execution charter |
| **Ledger PR authorized?** | **YES** |
| **Reference catalog PR authorized?** | **YES** |
| **Program archive authorized?** | **NO** — deferred until ledger execution |

Ratification **records the council decision**. Certification **execution** (ledger rows, certificate publication) requires separate authorized action — consistent with trilogy ratification posture.

---

## Prior council decisions (preserved)

| Decision ID | Surface | Status |
|-------------|---------|--------|
| RD-AP1-001 | PP-1 Identity | ✅ Ratified |
| RD-AP2-001 | PP-2 Settings | ✅ Ratified |
| RD-AP3-001 | PP-3 Billing | ✅ Ratified |
| EA-AP-UMB-001 | Umbrella eval authorization | ✅ Executed |
| **RD-AP-UMB-001** | **Account Platform umbrella** | **✅ Ratified this session** |

Sub-program ratification detail remains in [ACCOUNT_PLATFORM_CERTIFICATION_COUNCIL_DECISION.md](./ACCOUNT_PLATFORM_CERTIFICATION_COUNCIL_DECISION.md) (PP-1/PP-2 era) and PP-3 council documents.

---

## Required questions — answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Certification vote? | **APPROVE** |
| 2 | Certification level? | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| 3 | Blocking findings? | **0** |
| 4 | Major findings? | **7** — AP-UMB-M01–M07 |
| 5 | Advisory findings? | **19** — ADV-01–18 + EVAL-F01 |
| 6 | Findings treatment? | **Majors WITH FINDINGS on certificate; advisories track-only** |
| 7 | Reference status? | **#AP-BILL-1** Reference Capability With Findings; composite not reference domain |
| 8 | Ledger recommendation? | **Executed** 2026-06-20 — trilogy + umbrella rows |
| 9 | Consistent with precedent? | **Yes** — 22/27 band matches WS; advisory-heavy WF accepted |
| 10 | Remaining risks? | MFA, billing UX, BA dedup, tier vocab, integration tests |
| 11 | Modernization complete? | **Yes** — chartered Account Platform scope |
| 12 | Next initiative? | **Optional post-cert hygiene only** — no program waves |
| 13 | Program status? | **ARCHIVED** — certifications executed |
| 14 | Ratification outcome? | **RATIFIED** — RD-AP-UMB-001 |
| 15 | Certification execution authorized? | **Executed** 2026-06-20 — [ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md](./ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md) |

---

**Last updated:** 2026-06-20 (Umbrella Certification Ratification Council · certification executed)
