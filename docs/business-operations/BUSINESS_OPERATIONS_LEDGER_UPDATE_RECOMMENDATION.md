# Business Operations Ledger Update Recommendation

**Program:** Business Operations Certification Finalization  
**Date:** 2026-06-14  
**Target document:** [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md)  
**Status:** Recommendation only — **do not apply without council ratification**

---

## 1. Current ledger state

| Observation | Detail |
|-------------|--------|
| HR row | **Absent** |
| Scheduling row | **Absent** |
| Prior Scheduling decision | FAIL / NOT CERTIFIED in [BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md](./BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md) — **superseded** |
| Workforce Communications | **Absent** (expected — not implemented) |

---

## 2. Recommended ledger actions

| # | Action | When |
|---|--------|------|
| 1 | **Add HR row** | Upon ratification |
| 2 | **Add Scheduling row** | Upon ratification |
| 3 | Link evidence docs in ledger | Same PR as rows |
| 4 | Update BO program status in ledger intro or appendix | Optional same PR |
| 5 | **Do not** add WC row | Until WC certification evaluation |

---

## 3. Proposed HR row

Insert in Level 3 module matrix (alphabetical or BO grouping per ledger convention):

```markdown
| **HR** | `hr` | **High** | **Partial** | **3 — Certified (with findings)** | **LEVEL 3 CERTIFIED WITH FINDINGS** · **Reference Candidate #1 (Workforce Lifecycle, conditional)** | [HR_CERTIFICATION_AUDIT.md](../business-operations/HR_CERTIFICATION_AUDIT.md), [HR_FINDINGS_REGISTER.md](../business-operations/HR_FINDINGS_REGISTER.md), [HR_FINDINGS_CLOSURE_PLAN.md](../business-operations/HR_FINDINGS_CLOSURE_PLAN.md) |
```

**Field notes:**

| Field | Value | Rationale |
|-------|-------|-----------|
| Constitutional compliance | High | Primary mutations service-owned; destructive PE gated |
| File Hub compliance | Partial | No operation matrix; AI context fat; partial PE |
| Level | 3 WITH FINDINGS | 0 blockers; 3 major tracked |
| Reference | Candidate #1 conditional | F-HR-001..003 closure → module promotion |

**Findings attachment (ledger annotation):** F-HR-001, F-HR-002, F-HR-003 — 90-day closure from ratification.

---

## 4. Proposed Scheduling row

```markdown
| **Scheduling** | `scheduling` | **High** | **Partial** | **3 — Certified (with findings)** | **LEVEL 3 CERTIFIED WITH FINDINGS** · **Reference Candidate #6 (Planning, conditional)** | [SCHEDULING_CERTIFICATION_REEVALUATION.md](../business-operations/SCHEDULING_CERTIFICATION_REEVALUATION.md), [SCHEDULING_POST_REMEDIATION_FINDINGS.md](../business-operations/SCHEDULING_POST_REMEDIATION_FINDINGS.md), [SCHEDULING_FINDINGS_CLOSURE_PLAN.md](../business-operations/SCHEDULING_FINDINGS_CLOSURE_PLAN.md) |
```

**Field notes:**

| Field | Value | Rationale |
|-------|-------|-----------|
| Constitutional compliance | High | Post-remediation: 0 AdminTools Prisma; domain events live |
| File Hub compliance | Partial | AI context; PE gaps; no operation matrix |
| Level | 3 WITH FINDINGS | Blockers closed; 4 major tracked |
| Reference | Candidate #6 conditional | F-SCH-004..007 closure → module promotion |

**Findings attachment:** F-SCH-004, F-SCH-005, F-SCH-006, F-SCH-007 — 90-day closure.

**Status change note:** Supersedes 2026-06-16 NOT CERTIFIED evaluation.

---

## 5. Ledger update PR checklist

- [ ] Council minutes or ratification record linked in PR description
- [ ] Two new matrix rows added
- [ ] Evidence links resolve
- [ ] Findings IDs and 90-day deadline in row footnote or linked register
- [ ] `BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md` header note: Scheduling section superseded
- [ ] No automatic WC row

---

## 6. Post-ratification maintenance

| Event | Ledger action |
|-------|---------------|
| F-HR-001..003 closed | Update HR row: promote to unconditional L3 or Reference Module #1 |
| F-SCH-004..007 closed | Update Scheduling row: promote to unconditional L3 or Reference Module #6 |
| WC certified (future) | Add WC row after WC certification evaluation |
| Finding regression | Downgrade row; reopen certification review |

---

## 7. What not to update

| Item | Reason |
|------|--------|
| Chat, Calendar, Todo, Drive rows | Out of scope |
| AI Tools row | Separate program |
| WC row | Not certified |
| Level 4 for HR/Scheduling | Not eligible |

---

## Related

- [BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md](./BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md)
- [BUSINESS_OPERATIONS_GOVERNANCE_DECISIONS.md](./BUSINESS_OPERATIONS_GOVERNANCE_DECISIONS.md)
