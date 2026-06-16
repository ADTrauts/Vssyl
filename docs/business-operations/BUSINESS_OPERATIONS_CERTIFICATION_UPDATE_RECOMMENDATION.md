# Business Operations Certification Update Recommendation

**Program:** Business Operations Certification Re-Evaluation  
**Date:** 2026-06-14  
**Scope:** Scheduling certification status change only  
**Authority:** Platform Architecture Governance (recommendation — pending council ratification)

**No ledger update was applied in this program.**

---

## Status change summary

| Field | Prior (2026-06-16) | Recommended (post-remediation) |
|-------|-------------------|-------------------------------|
| **Evaluation outcome** | FAIL | **PASS WITH FINDINGS** |
| **Certification recommendation** | NOT CERTIFIED | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Reference status** | Denied | **REFERENCE CANDIDATE** (conditional) |
| **Ledger row** | Not present | **Add row** (upon ratification) |

---

## Rationale

### Why upgrade from NOT CERTIFIED

All three certification blockers that caused the FAIL are **verified closed**:

1. **F-SCH-001** — `schedulingAdminToolsController` has zero Prisma; mutations service-owned
2. **F-SCH-002** — Manifest no longer falsely declares `realtime`
3. **F-SCH-003** — Full `scheduling.*` domain event taxonomy with service emission

These were the **only** findings marked blocking in `SCHEDULING_FINDINGS_REGISTER.md`.

### Why WITH FINDINGS (not unconditional PASS)

Residual major findings mirror HR's certified-with-findings profile:

| Scheduling finding | HR parallel |
|--------------------|-------------|
| F-SCH-004 AI context Prisma | F-HR-003 AI context Prisma |
| F-SCH-005 Partial PE routes | F-HR-001 Partial PE routes |
| F-SCH-006 No operation matrix | F-HR-002 No operation matrix |
| F-SCH-007 Claim-shift event gap | (scheduling-specific lifecycle gap) |

HR received **LEVEL 3 CERTIFIED WITH FINDINGS** under the same bar. Parity applies.

### Why not FAIL

No constitutional blocker remains on primary mutation surfaces. Controller Prisma concentration dropped from **51** to **19**, confined to read-only AI context and dashboard aggregation — not module mutations in HTTP layer for core schedule/shift/station/location workflows.

### Why conditional Reference Candidate

Post-remediation, Scheduling exposes copy-worthy planning patterns:

- `schedulingScheduleService` / `schedulingShiftService` domain split
- `schedulingManagerService` G09 facade
- V-Link access with trashed fail-closed
- Trash lifecycle with V-Link unlink on purge
- Domain event service aligned with Chat/Calendar

Designation is **conditional** on F-SCH-004..007 closure within 90 days — same governance model as HR Reference Candidate #1.

Scheduling is **not** recommended for Level 4 Reference Implementation.

---

## Recommended governance actions

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Ratify Scheduling **LEVEL 3 CERTIFIED WITH FINDINGS** in architecture council | Platform Architecture | P0 |
| 2 | Update `CERTIFICATION_LEDGER.md` Scheduling row upon ratification | Platform Engineering | P0 |
| 3 | Open findings tickets F-SCH-004..007 with 90-day closure deadline | Scheduling module owner | P1 |
| 4 | Publish `SCHEDULING_OPERATION_MATRIX.md` | Scheduling module owner | P1 |
| 5 | Designate **Reference Candidate #6 (Planning)** upon F-SCH-004..007 closure | Architecture council | P2 |

---

## Proposed CERTIFICATION_LEDGER entry (ratification text)

Apply only after architecture council approval. **Do not apply automatically.**

```markdown
| **Scheduling** | `scheduling` | **High** | **Partial** | **3 — Certified (with findings)** | **LEVEL 3 CERTIFIED WITH FINDINGS** · **Reference Candidate #6 (Planning, conditional)** | [SCHEDULING_CERTIFICATION_REEVALUATION.md](../business-operations/SCHEDULING_CERTIFICATION_REEVALUATION.md), [SCHEDULING_POST_REMEDIATION_FINDINGS.md](../business-operations/SCHEDULING_POST_REMEDIATION_FINDINGS.md) |
```

**Findings attachment:** F-SCH-004, F-SCH-005, F-SCH-006, F-SCH-007 — closure deadline 90 days from ratification (recommended).

**Constitutional compliance:** High (primary mutation paths)  
**File Hub compliance:** Partial (AI context extraction, PE route gaps, no operation matrix)

---

## What not to do

| Action | Recommendation |
|--------|----------------|
| Award unconditional Level 3 | **Do not** — major findings open |
| Award Level 4 Reference Implementation | **Do not** |
| Re-declare `realtime: true` without `schedulingRealtimeService` | **Do not** |
| Update ledger without council ratification | **Do not** (this program) |
| Re-audit HR or start Workforce Communications cert | **Out of scope** |

---

## HR row (unchanged)

HR recommendation from 2026-06-16 evaluation stands:

- **LEVEL 3 CERTIFIED WITH FINDINGS**
- **REFERENCE CANDIDATE** (Workforce Lifecycle, conditional)

This re-evaluation program does not modify HR status.

---

## Related documents

- [SCHEDULING_CERTIFICATION_REEVALUATION.md](./SCHEDULING_CERTIFICATION_REEVALUATION.md)
- [SCHEDULING_POST_REMEDIATION_FINDINGS.md](./SCHEDULING_POST_REMEDIATION_FINDINGS.md)
- [BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md](./BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md) — superseded for Scheduling only
- [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md)
