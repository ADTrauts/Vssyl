# Workforce Communications Reference Candidate Recommendation

**Module id:** `workforce_comms`  
**Date:** 2026-06-14  
**Status:** Recommendation only — not ratified  
**Authority:** [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md) Level 3 vs Level 4 definitions

---

## Recommendation

| Question | Answer |
|----------|--------|
| **Reference candidate?** | **YES** |
| **Reference implementation (Level 4)?** | **NO** |

---

## Rationale

Workforce Communications is recommended as a **Business Operations reference candidate** for the **operational broadcast** problem domain:

- Audience resolution from org chart (department, manager subtree, business-wide)
- Publish lifecycle with read receipts and acknowledgements
- Campaign grouping and Phase G reporting
- Optional cross-module bridges (Scheduling/HR) without ownership transfer
- Constitutional boundaries preserved (no Chat integration; NotificationService delivery-only)

This is **not** a platform-wide **Level 4 Reference Implementation** comparable to File Hub (`drive`). Level 4 requires architecture council approval, contribution to [MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md), and a dedicated `WORKFORCE_LEVEL3_CERTIFICATION_REVIEW` in `docs/architecture/audits/` — none of which are complete.

---

## Reference scope (what WC models)

| Pattern | WC as reference | Evidence |
|---------|-----------------|----------|
| Broadcast + audience materialization | **Yes** | `workforceAudienceService` + `WorkforceAudienceResolution` |
| Ack + read compliance | **Yes** | Ack/read services + Phase G compliance dashboards |
| `authorize → execute → emit → notify` | **Yes** | Publish path in `workforceCommunicationService` |
| Thin controllers + service-owned Prisma | **Yes** | 0 Prisma in `controllers/workforceComms/` |
| Full Policy Engine route coverage | **Yes** | 32/32 routes — exceeds HR/Scheduling partial coverage |
| Global Trash + V-Link | **Yes** | Phase E services + handler registration |
| Cross-module bridge (optional) | **Yes** | `workforceBridgeService` feature-flagged pattern |
| Realtime product surface | **No** | WC intentionally polling-based |
| AI write actions | **No** | Read-only AI context; not a negative for this domain |

---

## Reference scope (what WC does not model)

- File Hub storage/delete/visibility patterns
- Chat threading, sockets, or conversational messaging
- HR payroll/attendance domain logic
- Scheduling shift mutation logic
- Platform Level 4 extraction into pattern guide

---

## Comparison to existing reference modules

| Module | Reference status | WC relationship |
|--------|------------------|-----------------|
| File Hub | L4 Reference Implementation | WC follows FH service/thin-controller patterns |
| Chat | L3 Reference Module #2 | WC explicitly does not cross Chat boundary |
| Calendar | L3 Reference Module #3 | WC shares hub landing pattern |
| HR | L3 w/ findings (unratified) | WC bridges to HR; HR owns workflow notifs |
| Scheduling | L3 w/ findings (unratified) | WC bridges to Scheduling; Scheduling owns shift notifs |

---

## Conditions for reference candidacy

All conditions are **met** for **candidate** status (not L4 promotion):

1. Phases A–G complete per blueprint
2. F-WC-001..005 closed
3. Zero blocking findings
4. Operation matrix published
5. Test evidence (94 server + 9 web workforce tests)

**Not required for candidate:** HR/Scheduling ledger ratification (WC can be referenced independently for broadcast patterns).

---

## Council decision options

| Option | Description |
|--------|-------------|
| **A (Recommended)** | Accept **Reference Candidate** for Business Operations broadcast/ack/campaign patterns; **LEVEL 3 CERTIFIED** |
| **B** | Accept candidate with **LEVEL 3 CERTIFIED WITH FINDINGS** if advisory F-WC-006..009 must appear on certificate |
| **C** | Defer candidate until `docs/architecture/audits/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md` mirror exists |
| **Reject** | Not recommended — no blocking evidence |

---

## Related

- [WORKFORCE_COMMUNICATIONS_POST_G_CERTIFICATION_REEVALUATION.md](./WORKFORCE_COMMUNICATIONS_POST_G_CERTIFICATION_REEVALUATION.md)
- [WORKFORCE_COMMUNICATIONS_STRATEGIC_POSITIONING.md](./WORKFORCE_COMMUNICATIONS_STRATEGIC_POSITIONING.md)
