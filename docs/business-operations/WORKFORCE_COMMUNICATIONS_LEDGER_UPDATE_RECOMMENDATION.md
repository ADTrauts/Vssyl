# Workforce Communications Ledger Update Recommendation

**Module id:** `workforce_comms`  
**Date:** 2026-06-14  
**Status:** Recommendation only — **do not edit** [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md) until council ratifies  
**Trigger:** Post-Phase-G certification re-evaluation complete

---

## Recommendation

| Question | Answer |
|----------|--------|
| **Ledger update recommended?** | **YES** |
| **Timing** | With HR + Scheduling ratification batch per [BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md](./BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md) |

---

## Proposed ledger row

Insert in **Certification matrix** (after Scheduling or in Business Operations grouping when ledger adds BO section):

| Module | Module id | Constitutional Compliance | File Hub Compliance | Certification Level | Status | Evidence |
|--------|-----------|---------------------------|---------------------|---------------------|--------|----------|
| **Workforce Communications** | `workforce_comms` | **High** | **High** | **3 — Certified** | **BO Reference Candidate** (broadcast) · Phases A–G complete | [WORKFORCE_COMMUNICATIONS_POST_G_CERTIFICATION_REEVALUATION.md](./WORKFORCE_COMMUNICATIONS_POST_G_CERTIFICATION_REEVALUATION.md), [WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md](./WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md) |

### Alternative row (conservative)

If council requires advisory findings on certificate:

| Certification Level | Status |
|---------------------|--------|
| **3 — Certified** | **LEVEL 3 CERTIFIED WITH FINDINGS** (F-WC-006..009 advisory) |

---

## Field justification

| Column | Value | Rationale |
|--------|-------|-----------|
| Constitutional Compliance | High | All §3/§4/§5/§7/§8/§16 gates pass; no realtime lie; tenant isolation tested |
| File Hub Compliance | High | Greenfield thin controllers; canonical services; adapter pattern for notifications/activity/trash/vlink |
| Level | 3 — Certified | F-WC-001..005 closed; 0 blocking; 0 open major |
| Status | BO Reference Candidate | Broadcast/ack/campaign reference — not L4 |
| Evidence | Post-G re-evaluation + operation matrix | Meets ledger evidence link requirement |

---

## Supporting updates (same PR / council action)

1. Add cross-link from [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md) §Business Operations to WC row when section created.
2. Optional: mirror [WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md](./WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md) to `docs/architecture/audits/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md` (F-WC-009).
3. Update [BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md](./BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md) §2 table with WC row:

| Module | Evaluation | Recommended certification | Blockers | Ratified? | Ledger row? |
|--------|------------|---------------------------|----------|-----------|-------------|
| **Workforce Communications** | PASS WITH FINDINGS (advisory) | **LEVEL 3 CERTIFIED** | **0** | **No** | **No** (pending) |

4. Update `memory-bank/progress.md` when product steward accepts (out of scope for this re-evaluation unless requested).

---

## What not to add

- **Do not** promote to Level 4 Reference Implementation without council vote and pattern-guide contribution.
- **Do not** add WC to Reference Module #N numbering until Architecture assigns BO reference slot.
- **Do not** auto-ratify HR/Scheduling as part of WC row — separate rows remain required.

---

## Verification checklist before ledger edit

- [ ] Architecture Council meeting minutes reference WC post-G package
- [ ] `pnpm type-check` pass on `main` at ratification commit
- [ ] Workforce test suites pass (94 server + 9 web minimum)
- [ ] F-WC-001..005 closure acknowledged in minutes
- [ ] Advisory findings F-WC-006..009 disposition recorded (accept / 90-day plan)

---

## Related

- [WORKFORCE_COMMUNICATIONS_POST_G_CERTIFICATION_REEVALUATION.md](./WORKFORCE_COMMUNICATIONS_POST_G_CERTIFICATION_REEVALUATION.md)
- [WORKFORCE_COMMUNICATIONS_POST_G_EXECUTIVE_SUMMARY.md](./WORKFORCE_COMMUNICATIONS_POST_G_EXECUTIVE_SUMMARY.md)
