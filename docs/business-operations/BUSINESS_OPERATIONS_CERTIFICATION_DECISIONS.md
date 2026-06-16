# Business Operations Certification Decisions

**Program:** Business Operations Certification Evaluation  
**Decision date:** 2026-06-16  
**Authority:** Platform Architecture Governance (evaluation input — pending council ratification)  
**Evaluator:** Repository certification assessment

**These are formal certification recommendations. No automatic ledger updates were applied.**

---

## Decision summary

| Module | Evaluation outcome | Certification recommendation | Reference status |
|--------|-------------------|------------------------------|------------------|
| **Scheduling** | **FAIL** | **NOT CERTIFIED** | Not qualified |
| **HR** | **PASS WITH FINDINGS** | **LEVEL 3 CERTIFIED WITH FINDINGS** | **REFERENCE CANDIDATE** (conditional) |

---

## Scheduling (`scheduling`)

### Evaluation outcome

**FAIL**

### Certification recommendation

**NOT CERTIFIED**

Scheduling does not meet Level 3 requirements at evaluation time. Certification is **deferred** until blocking findings F-SCH-001, F-SCH-002, and F-SCH-003 are resolved and a re-evaluation passes.

### Blocking findings

| ID | Finding |
|----|---------|
| F-SCH-001 | AdminTools controller direct Prisma mutations (32 calls) |
| F-SCH-002 | Manifest `realtime: true` without implementation |
| F-SCH-003 | No domain event taxonomy (or approved waiver) |

### Required remediation before re-evaluation

1. Extract `schedulingAdminToolsController` to canonical services
2. Correct manifest realtime declaration OR implement realtime adapter
3. Add domain events or obtain architecture waiver
4. Re-run certification evaluation with regression tests

### Proposed CERTIFICATION_LEDGER row (upon future PASS)

```
| Scheduling | scheduling | Partial | Partial | 1 — Stabilizing | NOT CERTIFIED | This audit |
```

**Current action:** Do not add as Certified. Maintain as unstated / pre-ledger until re-evaluation.

---

## HR (`hr`)

### Evaluation outcome

**PASS WITH FINDINGS**

### Certification recommendation

**LEVEL 3 CERTIFIED WITH FINDINGS**

HR meets Level 3 constitutional requirements with documented findings comparable to Calendar (2026-06-01). Destructive mutations are service-owned and Policy Dual gated. Activity, notifications, trash, V-Link, and tenant isolation match Chat/Calendar certification bars.

### Findings attached to certification

| ID | Severity | Summary |
|----|----------|---------|
| F-HR-001 | Major | Partial PE route coverage |
| F-HR-002 | Major | Missing operation matrix |
| F-HR-003 | Major | AI context controller Prisma |

**Findings closure deadline:** 90 days from decision ratification (recommended).

### Proposed CERTIFICATION_LEDGER row (upon ratification)

```
| HR | hr | High | Partial | 3 — Certified (with findings) | LEVEL 3 CERTIFIED WITH FINDINGS | HR_CERTIFICATION_AUDIT.md |
```

**Constitutional compliance:** High  
**File Hub compliance:** Partial (AI context, PE coverage, no operation matrix yet)  
**Reference designation:** Reference Candidate #1 (Workforce Lifecycle) — conditional

---

## Reference implementation decisions

| Designation | Module | Decision |
|-------------|--------|----------|
| **REFERENCE IMPLEMENTATION (L4)** | Scheduling | **Denied** |
| **REFERENCE IMPLEMENTATION (L4)** | HR | **Denied** |
| **REFERENCE CANDIDATE** | Scheduling | **Denied** |
| **REFERENCE CANDIDATE** | HR | **Granted** (conditional on F-HR-001..003) |

---

## Allowed outcomes applied

| Outcome | Scheduling | HR |
|---------|------------|-----|
| PASS | — | — |
| PASS WITH FINDINGS | — | **✓** |
| FAIL | **✓** | — |

| Recommendation | Scheduling | HR |
|----------------|------------|-----|
| NOT CERTIFIED | **✓** | — |
| LEVEL 3 CERTIFIED | — | — |
| LEVEL 3 CERTIFIED WITH FINDINGS | — | **✓** |
| REFERENCE CANDIDATE | — | **✓** |
| REFERENCE IMPLEMENTATION | — | — |

---

## Governance actions required

| # | Action | Owner |
|---|--------|-------|
| 1 | Ratify HR Level 3 WITH FINDINGS in architecture council | Platform Architecture |
| 2 | Update `CERTIFICATION_LEDGER.md` HR row upon ratification | Platform Engineering |
| 3 | Open findings tracking tickets F-HR-001..003 | HR module owner |
| 4 | Open Scheduling remediation epic F-SCH-001..003 | Scheduling module owner |
| 5 | Schedule Scheduling re-evaluation after P0 remediation | BO Program Steward |
| 6 | Publish `HR_OPERATION_MATRIX.md` within 90 days | HR module owner |

---

## Re-evaluation criteria

### Scheduling re-evaluation entry

- [ ] F-SCH-001 resolved (AdminTools Prisma = 0)
- [ ] F-SCH-002 resolved (manifest truthful)
- [ ] F-SCH-003 resolved or waived
- [ ] `pnpm type-check` pass
- [ ] Scheduling test suite pass

### HR findings promotion to unconditional L3

- [ ] F-HR-001..003 closed
- [ ] Operation matrix published
- [ ] Optional: 6B web client (F-HR-004) — not required for unconditional L3

---

## Related documents

- [BUSINESS_OPERATIONS_CERTIFICATION_EVALUATION.md](./BUSINESS_OPERATIONS_CERTIFICATION_EVALUATION.md)
- [SCHEDULING_FINDINGS_REGISTER.md](./SCHEDULING_FINDINGS_REGISTER.md)
- [HR_FINDINGS_REGISTER.md](./HR_FINDINGS_REGISTER.md)
- [BUSINESS_OPERATIONS_REFERENCE_CANDIDATE_ANALYSIS.md](./BUSINESS_OPERATIONS_REFERENCE_CANDIDATE_ANALYSIS.md)
