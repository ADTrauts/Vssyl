# Business Operations Governance Decisions

**Program:** Business Operations Certification Finalization  
**Decision date:** 2026-06-14  
**Authority:** Platform Architecture Governance (recommendation — pending council ratification)  
**Status:** Formal governance record — not automatically applied

---

## Decision record

| # | Decision | Outcome | Effective upon |
|---|----------|---------|----------------|
| **GD-BO-001** | HR certification level | **LEVEL 3 CERTIFIED WITH FINDINGS** | Council ratification |
| **GD-BO-002** | Scheduling certification level | **LEVEL 3 CERTIFIED WITH FINDINGS** (supersedes NOT CERTIFIED) | Council ratification |
| **GD-BO-003** | HR Reference Candidate | **Approve #1 Workforce Lifecycle (conditional)** | Council ratification |
| **GD-BO-004** | Scheduling Reference Candidate | **Approve #6 Planning (conditional)** | Council ratification |
| **GD-BO-005** | CERTIFICATION_LEDGER update | **Authorize two new rows** | Ratification + engineering PR |
| **GD-BO-006** | Findings closure deadline | **90 days** from ratification for major findings | Ratification |
| **GD-BO-007** | WC implementation gate | **Open after ratification** — Path C parallel | Ratification |
| **GD-BO-008** | Constitutional decisions | **Closed — do not reopen** | Immediate |
| **GD-BO-009** | HR/Scheduling redesign | **Prohibited** in this program | Immediate |
| **GD-BO-010** | Level 4 Reference Implementation | **Denied** for HR and Scheduling | Immediate |

---

## GD-BO-001 — HR certification

**Question:** What certification level should HR receive?

**Decision:** LEVEL 3 CERTIFIED WITH FINDINGS

**Rationale:**

- Evaluation outcome PASS WITH FINDINGS (2026-06-16)
- Zero certification blockers
- Major findings F-HR-001..003 are tracked remediation — same bar as Chat/Calendar WITH FINDINGS precedent
- Server architecture meets thin-controller standard on primary `hrController`

**Not awarded:** Unconditional Level 3 (major findings open)

---

## GD-BO-002 — Scheduling certification

**Question:** What certification level should Scheduling receive after remediation?

**Decision:** LEVEL 3 CERTIFIED WITH FINDINGS

**Supersedes:** [BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md](./BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md) — Scheduling FAIL / NOT CERTIFIED

**Rationale:**

- F-SCH-001, F-SCH-002, F-SCH-003 verified closed per [SCHEDULING_CERTIFICATION_REMEDIATION_REPORT.md](./SCHEDULING_CERTIFICATION_REMEDIATION_REPORT.md)
- Re-evaluation PASS WITH FINDINGS
- Parity with HR major-finding profile (AI context, PE gaps, operation matrix)

**Not awarded:** Unconditional Level 3 until F-SCH-004..007 close

---

## GD-BO-003 — HR Reference Candidate

**Question:** Should HR be promoted to Reference Candidate?

**Decision:** **Yes** — Reference Candidate #1 (Workforce Lifecycle), conditional on F-HR-001..003 closure within 90 days

**Rationale:**

- Unique org-chart lifecycle, multi-entity V-Link, HR↔Scheduling bridge patterns
- Primary controller Prisma-free
- Conditional designation matches Chat/Calendar candidate promotion model

**Not awarded:** Reference Module or Level 4

---

## GD-BO-004 — Scheduling Reference Candidate

**Question:** Should Scheduling be promoted to Reference Candidate?

**Decision:** **Yes** — Reference Candidate #6 (Planning), conditional on F-SCH-004..007 closure within 90 days

**Rationale:**

- Post-remediation exposes copy-worthy planning patterns (schedule/shift split, G09 facade, domain events)
- Prior analysis denied candidacy pre-remediation — remediation satisfied prerequisites

**Not awarded:** Reference Module or Level 4

---

## GD-BO-005 — Ledger

**Question:** What ledger updates are required?

**Decision:** Add HR and Scheduling rows per [BUSINESS_OPERATIONS_LEDGER_UPDATE_RECOMMENDATION.md](./BUSINESS_OPERATIONS_LEDGER_UPDATE_RECOMMENDATION.md)

**Constraint:** No ledger change without council ratification

---

## GD-BO-006 — Findings timeline

**Question:** What must close before reference module status (beyond candidate)?

**Decision:**

| Module | Must close for Reference Module |
|--------|--------------------------------|
| HR | F-HR-001, F-HR-002, F-HR-003 |
| Scheduling | F-SCH-004, F-SCH-005, F-SCH-006, F-SCH-007 |

Advisory findings do not block reference module promotion.

**Deadline:** 90 days from ratification (recommended)

---

## GD-BO-007 — Workforce Communications gate

**Question:** Is Business Operations ready to establish Workforce Communications?

**Decision:** **Ready after ratification** — implement Path C (parallel)

See [WORKFORCE_COMMUNICATIONS_IMPLEMENTATION_GATE.md](./WORKFORCE_COMMUNICATIONS_IMPLEMENTATION_GATE.md)

---

## GD-BO-008 — Constitutional freeze

**Decisions closed (do not reopen):**

- Model C audience architecture
- Chat vs WC boundary
- Notification Center as delivery only
- Scheduling socket semantics (UI sync, not broadcast)
- HR workflow notifications vs WC campaigns
- Front page Phase 1 as evolution seed (not greenfield)
- `workforce_comms` module id and dedicated workspace hub

---

## Finding classification (governance)

### Certification blockers

**None** for HR or Scheduling under WITH FINDINGS model.

### Major (tracked — not blockers)

| HR | Scheduling |
|----|------------|
| F-HR-001 PE coverage | F-SCH-004 AI context Prisma |
| F-HR-002 Operation matrix | F-SCH-005 Partial PE |
| F-HR-003 AI context Prisma | F-SCH-006 Operation matrix |
| | F-SCH-007 Claim-shift events |

### Advisory (track — do not block)

| HR | Scheduling |
|----|------------|
| F-HR-004..009 | F-SCH-008..012 |

---

## Ratification required

These decisions are **recommendations** until architecture council records approval. No code, ledger, or certification badge changes until ratified.

---

## Related

- [BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md](./BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md)
- [BUSINESS_OPERATIONS_FINALIZATION_EXECUTIVE_SUMMARY.md](./BUSINESS_OPERATIONS_FINALIZATION_EXECUTIVE_SUMMARY.md)
