# Account Platform — Certification Council Decision

**Program:** Account Platform — PP-1 + PP-2 Certification Ratification Council  
**Ratification date:** 2026-06-20  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED & EXECUTED** — see [ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md](./ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md) (2026-06-20)

**Supersedes:** Planning-only certification status in [PP1_CERTIFICATION_PLAN.md](./PP1_CERTIFICATION_PLAN.md) and [PP2_CERTIFICATION_PLAN.md](./PP2_CERTIFICATION_PLAN.md)

---

## Council session record

| Field | Value |
|-------|-------|
| Session | Account Platform Certification Council — PP-1 + PP-2 Ratification |
| Surfaces under vote | PP-1 Identity & Profile · PP-2 Settings Platform |
| Framework | Account Platform G1–G9 (sub-program capability) |
| Level 4 denial | **Affirmed** — File Hub remains sole Reference Implementation (L4) |
| Parallel ratification | **Yes** — both sub-programs voted together |

---

## A. PP-1 certification vote

| Field | Decision |
|-------|----------|
| **Vote** | **APPROVE** |
| **Certification level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Decision ID** | RD-AP1-001 |
| **Score** | 24/27 (~89%) |
| **Detail** | [PP1_CERTIFICATION_RATIFICATION.md](./PP1_CERTIFICATION_RATIFICATION.md) |

---

## B. PP-2 certification vote

| Field | Decision |
|-------|----------|
| **Vote** | **APPROVE** |
| **Certification level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Decision ID** | RD-AP2-001 |
| **Score** | 26/27 (~96%) |
| **Detail** | [PP2_CERTIFICATION_RATIFICATION.md](./PP2_CERTIFICATION_RATIFICATION.md) |

---

## C. Certification consistency review

Comparison to portfolio precedent at ratification vote:

| Surface | Score at ratification | Level | Open majors | Open advisories | Consistent? |
|---------|----------------------|-------|-------------|-----------------|-------------|
| **PP-1 Identity** | 24/27 (~89%) | L3 WF | 2 (WF dispositioned) | ~8 | ✅ |
| **PP-2 Settings** | 26/27 (~96%) | L3 WF | 1 partial | 5 | ✅ |
| Admin Portal | 24/27 (~89%) | L3 WF | 1 (waived) | 4 | ✅ Aligned with PP-1 score band |
| Business Operations | 24/27 (~89%) | L3 WF | 0 | 17 | ✅ PP-2 fewer advisories |
| Business Administration | 23/27 | L3 WF | — | — | ✅ Score band aligned |
| Context Graph | 24/27 → 25/27 | L3 WF → promoted | 0 at cert | 8 | ✅ Promotion path exists |
| Reference Workspace | 23/27 | WS-L3 WF | 0 | 11 | ✅ Advisory-heavy WF accepted |

**Council determination:** Account Platform PP-1 and PP-2 ratification is **consistent with portfolio precedent**. L3 WITH FINDINGS at 89–96% with documented open findings matches Admin Portal, Business Operations, Workspace, and Context Graph ratification patterns. No score or findings posture requires rejection or deferral.

**Not consistent with:** Plain L3 at open majors — **correctly not pursued**.

---

## D. Advisory treatment — RD-APLAT-002

| Field | Decision |
|-------|----------|
| **Blocks certification?** | **No** |
| **Disposition** | **Accepted on certificate** — tracked findings register |
| **Individual waivers required?** | **No** — advisories track-only per framework |
| **PP-1 findings on certificate** | 9 items (see PP1 ratification) |
| **PP-2 findings on certificate** | 6 items (see PP2 ratification) |
| **Remediation plan** | **Recommended** — 90-day hygiene themes (see post-ratification roadmap) |

**Promotion blockers (plain L3):**

| Sub-program | Blockers |
|-------------|----------|
| PP-1 | PP1-F03 (MFA), PP1-F04 (photo controller), G6 test gaps |
| PP-2 | PP2-F05 (business dedup) |

---

## E. Reference status — RD-APLAT-003

| Sub-program | Reference Module #N | Pattern reference | Council opened |
|-------------|---------------------|-------------------|----------------|
| PP-1 | **Not applicable** | **Deferred** (identity substrate) | **No** |
| PP-2 | **Not applicable** | **Deferred** (settings pattern) | **No** |

**Rationale:** Sub-program capabilities are not workspace modules. Reference designation deferred to Umbrella Phase 3 or dedicated Account Platform pattern council after PP-3 certification.

---

## F. Ledger recommendation — RD-APLAT-004

| Field | Decision |
|-------|----------|
| **Ledger PR authorized?** | **YES** — separate Platform Engineering PR |
| **Ledger updated in this session?** | **NO** |
| **Rows proposed** | PP-1 Identity & Profile · PP-2 Settings Platform |
| **Proposed level (both)** | **3 — Certified** |
| **Proposed notation** | LEVEL 3 CERTIFIED WITH FINDINGS + G1–G9 score + findings count |
| **Umbrella composite row** | **Not yet** — requires PP-3 + Phase 3 review |

---

## G. Post-ratification modernization gate — RD-APLAT-005

| Initiative | Authorization |
|------------|---------------|
| **PP-3 Client Migration** | **Next implementation priority** (Track B) |
| PP-1 Phase 1B (MFA/session) | Hygiene — separate charter |
| PP-2 email adapter convergence | Hygiene — optional |
| Umbrella Phase 3 | After PP-3 eval |
| Ledger PR (PP-1 + PP-2) | **Authorized** — separate execution |

---

## Explicit non-actions

| Action | Status |
|--------|--------|
| Certification execution (ledger write) | ❌ Not performed — PR authorized |
| Program archive | ❌ |
| Runtime implementation | ❌ |
| PP-3 evaluation | ❌ — client migration gate |
| Reference designation council | ❌ — deferred |
| Umbrella composite certification | ❌ — Phase 3 |

---

## Ratification outcome summary

| Sub-program | Vote | Certified level (ratified) | Execution |
|-------------|------|---------------------------|-----------|
| **PP-1** | **APPROVE** | **L3 WITH FINDINGS** | **Executed** 2026-06-20 |
| **PP-2** | **APPROVE** | **L3 WITH FINDINGS** | **Executed** 2026-06-20 |

**Overall ratification outcome:** **BOTH APPROVED** — Account Platform sub-domains PP-1 and PP-2 ratified at **LEVEL 3 CERTIFIED WITH FINDINGS**.

---

**Last updated:** 2026-06-20 (Certification Ratification Council)
