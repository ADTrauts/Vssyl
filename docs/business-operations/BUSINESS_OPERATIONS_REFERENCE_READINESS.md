# Business Operations Reference Readiness

**Program:** Business Operations Certification Finalization  
**Date:** 2026-06-14  
**Authority:** [MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md), [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md)

---

## 1. Reference hierarchy context

| Level | Name | BO modules today |
|-------|------|------------------|
| **4** | Reference Implementation | Not eligible (File Hub only) |
| **3** | Certified Reference Module | Not yet — candidates only |
| **—** | Reference Candidate | HR + Scheduling recommended |

---

## 2. HR reference readiness

### Should HR be promoted to Reference Candidate?

# **Yes — upon council ratification**

| Criterion | Status |
|-----------|--------|
| Level 3 certified (with findings) | **Recommended** — not ratified |
| Primary controller Prisma-free | **Pass** |
| Service-owned mutations | **Pass** |
| V-Link (4 entities) | **Pass** |
| Trash (scoped employee_profile) | **Pass** |
| Activity + notifications | **Pass** |
| Org-chart symmetric lifecycle | **Pass** — unique BO strength |
| `hrScheduleService` bridge | **Pass** |
| Operation matrix | **Fail** — F-HR-002 |
| AI context service layer | **Fail** — F-HR-003 |
| Full PE coverage | **Partial** — F-HR-001 |

**Designation:** Reference Candidate #1 (Workforce Lifecycle)

**Copy-worthy patterns today:**

- `employeeManagementService` import/terminate/delete vacate
- Multi-entity V-Link across profile, PTO, attendance, onboarding
- Scoped global trash for legal retention
- HR ↔ Scheduling PTO calendar bridge
- Policy Dual resource types (`hr_employee`, `time_off_request`, etc.)

### What must close before Reference Module (not candidate)?

| Requirement | Finding |
|-------------|---------|
| Operation matrix published | F-HR-002 |
| AI context via service | F-HR-003 |
| PE coverage complete or waived | F-HR-001 |
| Council promotion vote | Governance |

**Advisory findings (F-HR-004..009) do not block Reference Module promotion.**

---

## 3. Scheduling reference readiness

### Should Scheduling be promoted to Reference Candidate?

# **Yes — upon council ratification (post-remediation)**

| Criterion | Status |
|-----------|--------|
| Level 3 certified (with findings) | **Recommended** — not ratified |
| Primary mutation controllers Prisma-free | **Pass** (post F-SCH-001) |
| Domain events | **Pass** (post F-SCH-003) |
| Manifest truthfulness | **Pass** (post F-SCH-002) |
| V-Link + trash | **Pass** |
| G09 manager facade | **Pass** |
| Operation matrix | **Fail** — F-SCH-006 |
| AI context service layer | **Fail** — F-SCH-004 |
| Full PE on auxiliary routes | **Partial** — F-SCH-005 |
| Claim-shift lifecycle | **Fail** — F-SCH-007 |

**Designation:** Reference Candidate #6 (Planning)

**Copy-worthy patterns today:**

- `schedulingScheduleService` / `schedulingShiftService` split
- `schedulingManagerService` G09 facade
- V-Link access with trashed fail-closed
- Trash + V-Link unlink on purge
- `schedulingDomainEventService` taxonomy

### What must close before Reference Module (not candidate)?

| Requirement | Finding |
|-------------|---------|
| AI context extraction | F-SCH-004 |
| PE route completion | F-SCH-005 |
| Operation matrix | F-SCH-006 |
| Claim-shift events | F-SCH-007 |
| Council promotion vote | Governance |

---

## 4. Side-by-side BO reference map

| Pattern domain | Best module | Reference Candidate |
|----------------|-------------|---------------------|
| Employee lifecycle | HR | #1 Workforce Lifecycle |
| Shift planning & publish | Scheduling | #6 Planning |
| Time-off ↔ calendar | HR | #1 |
| Manager approval workflows | Both | HR PTO; Scheduling G09 |
| Multi-entity V-Link (workforce) | HR | #1 |
| Domain events (planning) | Scheduling | #6 |
| Workforce broadcast | **None** — WC not built | WC future #7 (TBD) |

---

## 5. Reference status decision matrix

| Question | HR | Scheduling |
|----------|-----|------------|
| Reference Candidate now? | **Yes** (conditional) | **Yes** (conditional) |
| Reference Module now? | **No** | **No** |
| Level 4 Reference Implementation? | **No** | **No** |
| Blockers for candidate? | Ratification only | Ratification only |
| Blockers for module? | F-HR-001..003 | F-SCH-004..007 |

---

## 6. Workforce Communications reference relationship

WC will become **Reference Candidate #7 (Workforce Broadcast)** only after its own certification path — not part of this finalization.

WC implementation should **copy patterns from** HR (#1), Scheduling (#6), Chat (#2), Calendar (#3) — not invent parallel architectures.

---

## Related

- [BUSINESS_OPERATIONS_REFERENCE_CANDIDATE_ANALYSIS.md](./BUSINESS_OPERATIONS_REFERENCE_CANDIDATE_ANALYSIS.md) — superseded for Scheduling candidacy (was "No")
- [BUSINESS_OPERATIONS_GOVERNANCE_DECISIONS.md](./BUSINESS_OPERATIONS_GOVERNANCE_DECISIONS.md)
