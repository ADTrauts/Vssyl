# Account Platform — PP-3 Council Decision

**Program:** Account Platform — PP-3 Billing & Entitlements Certification Ratification Council  
**Ratification date:** 2026-06-20  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — governance record only; **certification execution not performed**; **ledger not updated**

**Completes:** Account Platform sub-program trilogy (PP-1, PP-2, PP-3 all ratified L3 WITH FINDINGS)

---

## Council session record

| Field | Value |
|-------|-------|
| Session | Account Platform Certification Council — PP-3 Ratification |
| Surface under vote | PP-3 Billing & Entitlements |
| Framework | Account Platform G1–G9 |
| Validated score | **23/27 (~85%)** |
| Blocking findings | **0** |
| Open major findings | **3** (F08 + 2 partial + PP3-EVAL-F01) |
| Open advisory findings | **~5** + gate hygiene |
| Level 4 denial | **Affirmed** — File Hub remains sole Reference Implementation (L4) |

---

## A. Certification vote — RD-AP3-001

| Field | Decision |
|-------|----------|
| **Vote** | **APPROVE** |
| **Certification level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Detail** | [PP3_CERTIFICATION_RATIFICATION.md](./PP3_CERTIFICATION_RATIFICATION.md) |

**Alternatives rejected:**

| Option | Reason |
|--------|--------|
| REJECT | 0 blockers; score within portfolio band |
| DEFER | No material benefit — evaluation and prep complete |

---

## B. Findings treatment — RD-AP3-002

| Class | Count | Certificate treatment |
|-------|-------|----------------------|
| Blocking (open) | 0 | — |
| Major | 1 open + 2 partial + 1 eval | **Tracked WITH FINDINGS** |
| Advisory | 5 + 2 eval | **Track-only** |
| Accepted exception | 1 (F14) | Documented |
| Closed | 6 | No reopen |

**Waivers:** F02 partial **waived for L3 WF** — `normalizeTier()` accepted as boundary control.

**Post-cert obligations (recommended, not mandatory):**

| Theme | Findings | Priority |
|-------|----------|----------|
| Billing UX | F08 | P1 for plain L3 |
| Audit completeness | F05, PP3-EVAL-F01 | P2 |
| Tier hardening | F02, F11 | P2 |
| Hygiene | F09, F10, F13, PP3-EVAL-F02 | P3 |

---

## C. Reference status — RD-AP3-REF-001

| Field | Decision |
|-------|----------|
| **Reference Billing Pattern** | **Reference Capability With Findings** — `#AP-BILL-1` proposed |
| **Entitlement resolver pattern** | **Deferred** (Candidate) |
| **Reference Module #N** | **Not applicable** |
| **Catalog PR** | **Authorized separately** |

**Detail:** [PP3_REFERENCE_DECISION.md](./PP3_REFERENCE_DECISION.md)

---

## D. Trilogy consistency review

| Sub-program | Score | Level | Open majors | Open advisories | Ratified |
|-------------|------:|-------|-------------|-----------------|----------|
| **PP-1 Identity** | 24/27 | L3 WF | 2 (WF) | ~9 | ✅ 2026-06-20 |
| **PP-2 Settings** | 26/27 | L3 WF | 1 partial | ~6 | ✅ 2026-06-20 |
| **PP-3 Billing** | 23/27 | L3 WF | 3 (WF) | ~7 | ✅ **This session** |
| Admin Portal | 24/27 | L3 WF | 1 waived | 4 | Precedent |
| Business Operations | 24/27 | L3 WF | 0 | 17 | Precedent |
| Reference Workspace | 23/27 | WS-L3 WF | 0 | 11 | Precedent |

**Council determination:** PP-3 ratification at **23/27** is **consistent with portfolio precedent**. Score aligns with Business Administration (23/27) and Reference Workspace (23/27). Advisory count (~7) is lower than Business Operations (17). L3 WITH FINDINGS is the correct level — not plain L3 (G9 FAIL, F08).

---

## E. Umbrella readiness — RD-AP3-UMB-001

| Field | Decision |
|-------|----------|
| **All three sub-programs ratified?** | **YES** |
| **Umbrella composite certifiable?** | **Not yet** — progress review eligible |
| **Umbrella evaluation authorized?** | **NO** — separate charter |
| **Umbrella progress review authorized?** | **YES** — recommended next governance gate |
| **Blocking umbrella factors** | Unified operation matrix merge; composite findings register; cross-cutting MFA (PP-1) |

**Estimated umbrella readiness:** ~**84%** composite (weighted PP-1 89%, PP-2 96%, PP-3 85%).

---

## F. Ledger recommendation — RD-AP3-LED-001

| Field | Recommendation |
|-------|----------------|
| **PP-3 ledger row authorized?** | **YES** — separate Platform Engineering PR |
| **Combined trilogy ledger PR?** | **Recommended** — PP-1 + PP-2 + PP-3 in single PR or phased |
| **Ledger updated in session?** | **NO** |
| **Certification execution in session?** | **NO** |
| **Proposed PP-3 notation** | LEVEL 3 CERTIFIED WITH FINDINGS · PP-3 Billing & Entitlements · G1–G9 23/27 |

---

## G. Certification execution authorization

| Field | Decision |
|-------|----------|
| **Ratification complete?** | **YES** |
| **Certification execution authorized?** | **NO** — separate governance execution charter |
| **Ledger PR authorized?** | **YES** |
| **Reference catalog PR authorized?** | **YES** |

Ratification **records the council decision**. Certification **execution** (ledger rows, certificate publication) requires separate authorized action — consistent with PP-1/PP-2 ratification posture.

---

## Required questions — answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Certification vote? | **APPROVE** |
| 2 | Certification level? | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| 3 | Blocking findings? | **0 open** |
| 4 | Major findings? | F08, F05/F07 partial, PP3-EVAL-F01 |
| 5 | Advisory findings? | F09, F10, F11, F13, PP3-EVAL-F02 + G6 |
| 6 | Advisory treatment? | **Track-only on certificate**; 90-day remediation recommended |
| 7 | Reference status? | **Reference Capability With Findings** — Billing Pattern |
| 8 | Ledger recommendation? | **Authorize PR** — not updated now |
| 9 | Consistent with precedent? | **Yes** — 23/27 band matches WS/BA |
| 10 | Remaining risks? | F08 UX, F02 vocab, Stripe ops |
| 11 | Modernization complete? | **Yes** — chartered PP-3 scope |
| 12 | Next initiative? | **Umbrella progress review** + ledger PR |
| 13 | Umbrella impact? | **Trilogy complete** — umbrella path unlocked |
| 14 | Ratification outcome? | **RATIFIED L3 WITH FINDINGS** |
| 15 | Certification execution authorized? | **NO** — separate charter |

---

**Last updated:** 2026-06-20 (PP-3 Certification Ratification Council)
