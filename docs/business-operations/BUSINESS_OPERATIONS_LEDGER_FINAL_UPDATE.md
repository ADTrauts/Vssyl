# Business Operations Ledger Final Update

**Program:** Business Operations Architecture Council Ratification  
**Ratification date:** 2026-06-14  
**Target document:** [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md)  
**Status:** **APPROVED** — apply via Platform Engineering PR (this document is the authoritative patch spec)

**Council authorization:** [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](./BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md) RD-BO-001..003, G-1

**Do not apply without:** PR review + evidence link verification

---

## 1. Summary of changes

| Action | Module id | Certification | Reference |
|--------|-----------|---------------|-----------|
| **Add row** | `hr` | LEVEL 3 CERTIFIED WITH FINDINGS | Candidate #1 |
| **Add row** | `scheduling` | LEVEL 3 CERTIFIED WITH FINDINGS | Candidate #6 |
| **Add row** | `workforce_comms` | LEVEL 3 CERTIFIED | Candidate #7 |
| **Add section** | Business Operations | Program closeout link | 3 modules |

---

## 2. Proposed section insert (after Place row, before Dashboard)

Insert the following rows into the **Certification matrix** table in [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md):

```markdown
| **HR** | `hr` | **High** | **Partial** | **3 — Certified** | **LEVEL 3 CERTIFIED WITH FINDINGS** · **Reference Candidate #1 (Workforce Lifecycle)** · Ratified 2026-06-14 | [HR_CERTIFICATION_AUDIT.md](../business-operations/HR_CERTIFICATION_AUDIT.md), [HR_FINDINGS_REGISTER.md](../business-operations/HR_FINDINGS_REGISTER.md), [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](../business-operations/BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md) |
| **Scheduling** | `scheduling` | **High** | **Partial** | **3 — Certified** | **LEVEL 3 CERTIFIED WITH FINDINGS** · **Reference Candidate #6 (Planning)** · Ratified 2026-06-14 · Supersedes NOT CERTIFIED | [SCHEDULING_CERTIFICATION_REEVALUATION.md](../business-operations/SCHEDULING_CERTIFICATION_REEVALUATION.md), [SCHEDULING_POST_REMEDIATION_FINDINGS.md](../business-operations/SCHEDULING_POST_REMEDIATION_FINDINGS.md), [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](../business-operations/BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md) |
| **Workforce Communications** | `workforce_comms` | **High** | **High** | **3 — Certified** | **LEVEL 3 CERTIFIED** · **Reference Candidate #7 (Broadcast & Acknowledgement)** · Phases A–G · Ratified 2026-06-14 | [WORKFORCE_COMMUNICATIONS_POST_G_CERTIFICATION_REEVALUATION.md](../business-operations/WORKFORCE_COMMUNICATIONS_POST_G_CERTIFICATION_REEVALUATION.md), [WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md](../business-operations/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md), [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](../business-operations/BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md) |
```

---

## 3. Row field justification

### HR (`hr`)

| Field | Value | Notes |
|-------|-------|-------|
| Constitutional | High | Service-owned mutations; destructive PE gated |
| File Hub | Partial | No operation matrix; AI context Prisma; partial PE |
| Level | 3 — Certified | WITH FINDINGS notation in Status |
| Findings | F-HR-001..003 major; F-HR-004..009 advisory | 90-day plan |

### Scheduling (`scheduling`)

| Field | Value | Notes |
|-------|-------|-------|
| Constitutional | High | Post-remediation: 0 AdminTools Prisma; domain events |
| File Hub | Partial | AI context; PE gaps on auxiliary routes |
| Level | 3 — Certified | WITH FINDINGS |
| Findings | F-SCH-004..007 major; F-SCH-008..012 advisory | F-SCH-001..003 closed |

### Workforce Communications (`workforce_comms`)

| Field | Value | Notes |
|-------|-------|-------|
| Constitutional | High | Full PE coverage; no realtime lie |
| File Hub | High | Greenfield thin controllers; canonical services |
| Level | 3 — Certified | Unconditional; F-WC-001..005 closed |
| Findings | F-WC-006..009 advisory only | Track; non-blocking |

---

## 4. Optional ledger appendix addition

Add under certification matrix or new **Business Operations** subsection:

```markdown
### Business Operations program (ratified 2026-06-14)

| Module | Certification | Reference | Program status |
|--------|---------------|-----------|----------------|
| HR | L3 WITH FINDINGS | Candidate #1 | Certified — findings tracked |
| Scheduling | L3 WITH FINDINGS | Candidate #6 | Certified — findings tracked |
| Workforce Communications | L3 Certified | Candidate #7 | Certified — Phases A–G complete |

**Program closeout:** [BUSINESS_OPERATIONS_PROGRAM_CLOSEOUT.md](../business-operations/BUSINESS_OPERATIONS_PROGRAM_CLOSEOUT.md)  
**Findings plan:** [BUSINESS_OPERATIONS_FINDINGS_TRACKING_PLAN.md](../business-operations/BUSINESS_OPERATIONS_FINDINGS_TRACKING_PLAN.md)
```

---

## 5. Platform systems row updates (optional same PR)

| System | Suggested note |
|--------|----------------|
| Global Trash API | Add `hr`, `scheduling`, `workforce_comms` handlers |
| V_Link | Add HR (4 entities), Scheduling (3), WC (2) |
| Domain Event Bus | Add `hr.*` waiver note; `scheduling.*` (20); `workforce.*` (17) |
| Manifest governance | BO built-ins reconciled via `registerBuiltInModules` + seeds |

---

## 6. PR checklist

- [ ] Council ratification doc linked in PR description
- [ ] Three matrix rows inserted with resolving evidence links
- [ ] `BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md` header: Scheduling FAIL superseded
- [ ] `CERTIFICATION_LEDGER.md` Last updated date bumped
- [ ] No Level 4 promotion for BO modules
- [ ] Findings 90-day deadline noted: **2026-09-12** (90 days from 2026-06-14)

---

## 7. Post-ledger maintenance triggers

| Event | Action |
|-------|--------|
| F-HR-001..003 closed | Update HR Status → unconditional L3 or Reference Module #1 vote |
| F-SCH-004..007 closed | Update Scheduling Status → unconditional L3 or Reference Module #6 vote |
| F-WC-006..009 closed | Optional WC status annotation cleanup |
| Major finding regression | Reopen certification review; downgrade row |

---

## Related

- [BUSINESS_OPERATIONS_LEDGER_UPDATE_RECOMMENDATION.md](./BUSINESS_OPERATIONS_LEDGER_UPDATE_RECOMMENDATION.md) — pre-ratification HR/SCH only (superseded by this doc for WC)
- [WORKFORCE_COMMUNICATIONS_LEDGER_UPDATE_RECOMMENDATION.md](./WORKFORCE_COMMUNICATIONS_LEDGER_UPDATE_RECOMMENDATION.md)
