# Business Administration — Council Executive Summary

**Program:** BA-3 — Certification Council Ratification  
**Date:** 2026-06-18  
**Audience:** Architecture Council, product leadership, Platform Engineering  
**Status:** **RATIFIED**

---

## Bottom line

The Architecture Council **ratifies LEVEL 3 CERTIFIED WITH FINDINGS** for Business Administration, **waives BA-F-005** for certification scope (not for plain L3), and **approves Reference Platform Capability Candidates #OC-1 and #OC-2**. Ledger update is **authorized** but **not executed** in BA-3.

---

## Council decisions at a glance

| # | Question | Ratified answer |
|---|----------|-----------------|
| 1 | Certification disposition | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| 2 | BA-F-005 blocks certification? | **No** — **major waivable**; **yes** blocks plain L3 |
| 3 | #OC-1 Reference Candidate? | **YES** — Org Chart Identity & Structure |
| 4 | #OC-2 Reference Candidate? | **YES** — Permission Sets & Module Access |
| 5 | #OC-3 deferred? | **YES** — until approval hierarchy runtime |
| 6 | Add to CERTIFICATION_LEDGER.md? | **YES** — see ledger recommendation (not executed) |
| 7 | Next initiative | **BA-F-005 approval hierarchy implementation** (90-day plan) |

---

## Certification

| Metric | Value |
|--------|-------|
| **Disposition** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Validated score** | **22/27 (~81%)** |
| **Blocking findings** | **0** |
| **Open major** | **1** (BA-F-005 — waiver ratified) |
| **Gates PASS** | G2, G3, G6, G9 |
| **Gates PARTIAL** | G1, G4, G5, G7, G8 |

**Rejected:** NOT CERTIFIED, plain LEVEL 3 CERTIFIED, Reference Domain, Reference Implementation (L4).

---

## BA-F-005 waiver

| Rule | Council position |
|------|------------------|
| Blocks L3 WITH FINDINGS? | **No** |
| Blocks plain L3? | **Yes** |
| Classification | **Major — waivable** |
| Marketing | Do not claim approval chains as shipped |
| Tracking | **90-day implementation plan** required |

---

## Reference status

| Designation | Decision |
|-------------|----------|
| **#OC-1** Org Chart | **Ratified** — Reference Platform Capability Candidate |
| **#OC-2** Permissions | **Ratified** — Reference Platform Capability Candidate |
| **#OC-3** Approval Boundaries | **Deferred** |
| Reference Domain | **Denied** |
| Reference Implementation (L4) | **Denied** |

---

## Consistency with prior programs

| Program | Outcome | BA alignment |
|---------|---------|--------------|
| HR | L3 WITH FINDINGS; 3 open majors | **Consistent** — BA has fewer majors (1) |
| Scheduling | L3 WITH FINDINGS; 4 open majors | **Consistent** |
| Workforce Communications | Plain L3; 0 majors | BA does not meet unconditional bar |
| Admin Portal | L3 WITH FINDINGS → promoted | **Consistent** at ratification tier |

**Conclusion:** L3 WITH FINDINGS is **consistent** with established council precedent for zero-blocker programs with open waivable majors.

---

## Ledger

**YES** — add Platform systems row. Proposed entry:

```
Business Administration | platform subdomain | High | Partial/N/A | 3 — Certified |
LEVEL 3 CERTIFIED WITH FINDINGS · Ratified 2026-06-18 · G1–G9 22/27 ·
#OC-1, #OC-2 capability candidates · BA-F-005 waiver
```

Full row: [BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md](./BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md)

**Not executed in BA-3.**

---

## Governance actions (30 / 90 days)

| Deadline | Action |
|----------|--------|
| **Next PR** | Ledger row + changelog (G-BA-1) |
| **30 days** | Operation matrix to `docs/architecture/audits/` (BA-F-011) |
| **30 days** | #OC-1/#OC-2 catalog annex (G-BA-5) |
| **90 days** | BA-F-005 implementation checkpoint |
| **Immediate** | Marketing guardrail on approval chains (G-BA-6) |

---

## Next initiative

**Primary:** BA-F-005 approval hierarchy implementation  
**Parallel track 0:** BA advisory cleanup (BA-F-011 matrix publish)  
**Independent:** Business Operations BO-1A may proceed in parallel

Roadmap: [BUSINESS_ADMINISTRATION_POST_RATIFICATION_ROADMAP.md](./BUSINESS_ADMINISTRATION_POST_RATIFICATION_ROADMAP.md)

---

## BA-3 stop condition

| Constraint | Met? |
|------------|------|
| Ratification documents only | **Yes** — 5 deliverables |
| No code | **Yes** |
| No ledger update | **Yes** |
| No certification award execution | **Yes** |
| No BA-F-005 implementation | **Yes** |

---

## Deliverables

| Document | Purpose |
|----------|---------|
| [COUNCIL_RATIFICATION](./BUSINESS_ADMINISTRATION_COUNCIL_RATIFICATION.md) | Full ratification record + consistency review |
| [LEDGER_RECOMMENDATION](./BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md) | Proposed ledger row (pending PR) |
| [REFERENCE_CANDIDATE_DECISION](./BUSINESS_ADMINISTRATION_REFERENCE_CANDIDATE_DECISION.md) | #OC-1 / #OC-2 / #OC-3 disposition |
| [POST_RATIFICATION_ROADMAP](./BUSINESS_ADMINISTRATION_POST_RATIFICATION_ROADMAP.md) | 0/30/90-day plan |
| **This document** | Executive summary for council minutes |

---

## Council minutes action

Record ratification of **LEVEL 3 CERTIFIED WITH FINDINGS** for Business Administration subdomain, BA-F-005 waiver (RD-BA-002), Reference Platform Capability Candidates #OC-1 and #OC-2 (RD-BA-003), and authorization of ledger PR per RD-BA-004.
