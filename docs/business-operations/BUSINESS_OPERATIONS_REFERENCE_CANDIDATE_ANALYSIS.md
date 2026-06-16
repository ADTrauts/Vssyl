# Business Operations Reference Candidate Analysis

**Program:** Business Operations Certification Evaluation  
**Evaluation date:** 2026-06-16  
**Question:** Can Scheduling or HR become a Business Operations reference implementation?

---

## Reference hierarchy (platform)

| Level | Name | Current holders |
|-------|------|-----------------|
| **4** | Reference Implementation | File Hub (`drive`) only |
| **3** | Certified Reference Module | Chat (#2), Calendar (#3), Todo (#4), Place (#5) |
| **—** | Reference Candidate | Pre-promotion designation with remediation plan |

**Business Operations modules are not yet in [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md) matrix rows.**

---

## Scheduling — planning-domain reference candidacy

### Question

Can Scheduling serve as the **planning-domain reference implementation** for shift scheduling, workforce coverage, and manager publish workflows?

### Answer

# **No — not qualified**

Scheduling is **not a reference candidate** at evaluation time. It **fails Level 3 certification** and contains architectural patterns that must not be copied (fat AdminTools controller, false realtime capability).

### Comparison to certified modules

| Criterion | File Hub | Chat | Calendar | Scheduling |
|-----------|----------|------|----------|------------|
| Controller Prisma (primary) | 0 | 0 | 0 | **51** (32 in AdminTools) |
| Service-owned mutations | Yes | Yes | Yes | **Partial** — AdminTools bypass |
| V_Link pattern | Yes | Yes | Yes | Yes |
| Trash pattern | Yes | Yes | Yes | Yes |
| PE on destructive writes | Yes | Yes | Yes | Yes (core paths) |
| Domain events | Yes | Yes | Yes | **No** |
| Manifest truth | Yes | Yes | Yes | **No** (realtime) |
| Operation matrix | Yes | Yes | Yes | No |
| Reference doc | FH Review | CHAT L3 Review | CALENDAR L3 Review | This audit only |

### What Scheduling does well (future reference potential)

After remediation, these patterns could be documented for other planning modules:

- `schedulingScheduleService` / `schedulingShiftService` domain split
- G09 manager facade via `schedulingManagerService`
- V-Link access with trashed fail-closed + policy dual
- Trash lifecycle with V-Link unlink on permanent delete
- CO-08 three-concept template ownership

### Path to reference candidacy

1. Achieve **LEVEL 3 CERTIFIED** (not WITH FINDINGS)
2. Complete `SCHEDULING_OPERATION_MATRIX.md`
3. Extract AdminTools and AI context
4. Fix manifest truthfulness
5. Architecture council designation as **Reference Module #6 (Planning)** — separate from Level 4

**Earliest realistic status:** Post-remediation re-evaluation + 1 quarter hygiene

---

## HR — workforce-lifecycle reference candidacy

### Question

Can HR serve as the **workforce-lifecycle reference implementation** for employee profiles, time-off, attendance exceptions, onboarding, and org-chart symmetric lifecycle?

### Answer

# **Yes — REFERENCE CANDIDATE (conditional)**

HR is designated **REFERENCE CANDIDATE** for Business Operations workforce-lifecycle patterns, contingent on closure of major findings F-HR-001 through F-HR-003 within 90 days.

This is **not** Reference Implementation (Level 4) and **not** unconditional Reference Module status until findings close.

### Comparison to certified modules

| Criterion | File Hub | Chat | Calendar | HR |
|-----------|----------|------|----------|-----|
| Controller Prisma (primary) | 0 | 0 | 0 | **0** |
| Service-owned mutations | Yes | Yes | Yes | **Yes** |
| V_Link pattern | Yes | Yes | Yes | Yes (4 entities) |
| Trash pattern | Yes | Yes | Yes | Yes (scoped) |
| Org-chart integration | N/A | N/A | N/A | **Yes** (unique BO strength) |
| PE on destructive writes | Yes | Yes | Yes | **Yes** |
| Domain events | Yes | Yes | Yes | Partial |
| Manifest truth | Yes | Yes | Yes | **Yes** |
| Cross-module bridge | N/A | N/A | N/A | **`hrScheduleService`** |
| Operation matrix | Yes | Yes | Yes | No |

### HR differentiators (reference value)

Patterns not fully demonstrated by File Hub, Chat, or Calendar:

1. **Org-chart symmetric lifecycle** — import/terminate/delete via `employeeManagementService` vacate paths
2. **Multi-entity V-Link** across profile, PTO, attendance exception, onboarding journey
3. **Scoped global trash** for legal retention (`employee_profile` only)
4. **HR ↔ Scheduling bridge** — `hrScheduleService` neutral PTO calendar sync
5. **Policy Dual resource types** — `hr_employee`, `time_off_request`, `attendance_exception`, `onboarding_journey`

### Reference candidate conditions

| # | Condition | Status |
|---|-----------|--------|
| 1 | Level 3 certified (with or without findings) | **Met** — WITH FINDINGS |
| 2 | Operation matrix published | **Pending** — F-HR-002 |
| 3 | AI context via service layer | **Pending** — F-HR-003 |
| 4 | PE coverage documented | **Pending** — F-HR-001 |
| 5 | Architecture council review | **Pending** — this document inputs council |

### Proposed designation

**HR — Reference Candidate #1 (Workforce Lifecycle)** upon governance approval of [BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md](./BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md).

Promotion to **Reference Module #6** (architectural, Level 3) requires findings closure — not Level 4.

---

## Side-by-side BO reference suitability

| Domain pattern | Best current module | Why not the other |
|----------------|--------------------|--------------------|
| Shift planning & publish | Neither certified | Scheduling NOT CERTIFIED |
| Employee lifecycle | **HR** | Scheduling lacks HR profile model |
| Time-off & calendar bridge | **HR** | `hrScheduleService` contract |
| Manager approval workflows | Both partial | HR PE on PTO; Scheduling G09 services |
| Multi-entity V-Link (workforce) | **HR** | 4 entity types vs Scheduling 3 |
| Station/location admin | Scheduling (when fixed) | HR N/A |

---

## Recommendation

| Module | Reference status |
|--------|-----------------|
| Scheduling | **Not qualified** — remediate → re-evaluate → reconsider |
| HR | **REFERENCE CANDIDATE** — conditional on F-HR-001..003 closure |

Neither module should be promoted to **Reference Implementation (Level 4)**. File Hub remains sole L4 authority.

---

## Related documents

- [BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md](./BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md)
- [MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)
