# HR Certification Audit

**Module id:** `hr`  
**Evaluation date:** 2026-06-16  
**Phase:** Business Operations Stage 2 — Certification Evaluation  
**Benchmarks:** File Hub (`drive`), Chat (`chat`), Calendar (`calendar`)  
**Authorities:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md), [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md)

---

## Executive summary

HR **satisfies** Level 3 certification requirements **with documented findings** comparable to Calendar's accepted partials at certification (2026-06-01).

**Evaluation outcome:** **PASS WITH FINDINGS**  
**Certification recommendation:** **LEVEL 3 CERTIFIED WITH FINDINGS**

Stage 2 decomposition (6A) and V-Link integration (6C) brought HR to constitutional parity with Chat/Calendar on activity, notifications, trash, V-Link, tenant isolation, and primary service boundaries. No **blocking** gate failures were identified. Findings require remediation tracking but do not prevent Level 3 promotion with findings notation.

**Findings count:** 9 (0 blocking · 3 major · 6 advisory)

---

## Architecture evaluation

### Thin controllers

| Controller | `prisma.` count | Verdict |
|------------|-----------------|---------|
| `hrController.ts` | **0** | 🟢 |
| `hrAIContextController.ts` | **15** | 🟡 |

Main controller is Prisma-free (verified; `hrController.delegation.test.ts`). At 2,242 LOC it remains orchestration-heavy — acceptable with finding, similar to Calendar's controller size before sub-resource extraction.

AI context controller retains direct Prisma — **same class** as Calendar's pre-extraction partials; Chat routes AI reads through `chatVisibilityService`. Finding F-HR-003; not a blocker (Calendar certified with AI context delegating to visibility — HR should follow in remediation).

### Service boundaries

| Service | Domain | Status |
|---------|--------|--------|
| `hrEmployeeService` | Profiles, terminate, import, export | 🟢 |
| `hrPtoService` | Time-off lifecycle | 🟢 |
| `hrSettingsService` | Settings stubs | 🟡 |
| `hrAnalyticsSupportService` | Dashboard aggregation | 🟢 |
| `hrAttendanceService` | Attendance + exceptions | 🟢 |
| `hrOnboardingService` | Onboarding journeys | 🟢 |
| `hrTrashService` | Global trash | 🟢 |
| `hrActivityService` | Activity adapter | 🟢 |
| `hrVlinkAccessService` / `Lifecycle` | V-Link | 🟢 |
| `hrServiceShared` | Audit + manager context | 🟢 |
| `employeeManagementService` | Org-chart authority | 🟢 |

### Domain ownership

- HR owns `EmployeeHRProfile`, time-off, attendance, onboarding per module boundary
- Org-chart identity via `EmployeePosition` — terminate/delete/import symmetry tested
- Tenant isolation: `businessId` on all service paths — 🟢

---

## Constitutional adoption

| Capability | Status | Evidence |
|------------|--------|----------|
| **Activity** | 🟢 | 14 `record*` exports; contract test |
| **Notifications** | 🟢 | 12 manifest types; completeness test |
| **Policy Engine** | 🟡 | 25 `checkHRPolicy` on routes; all destructive admin paths gated |
| **Global Trash** | 🟢 | `employee_profile`; purge V-Link unlink |
| **V-Link** | 🟢 | 4 entities; trashed profile fail-closed |
| **AI** | 🟡 | 3 providers; 15 Prisma in AI controller |
| **Audit** | 🟡 | `logEmployeeAudit` for employee mutations only |
| **Domain events** | 🟡 | Module activity; no `hr.*` domain event taxonomy |

---

## Platform integration

| Item | Status | Evidence |
|------|--------|----------|
| `registerHRPlatformEntities()` | 🟢 | 4 entities |
| Manifest `entities[]` | 🟢 | Post-6C |
| Manifest capabilities | 🟢 | Truthful (`realtime` not declared) |
| Trash handler | 🟢 | `registerGlobalTrashHandlers` HR block |
| V-Link resolver | 🟢 | 4 `HR_*` types |
| Permissions | 🟡 | Legacy `hrPermissions` + partial PE |

---

## Identity trust inheritance (CO-05)

| Operation | Path | Test |
|-----------|------|------|
| CSV import | `hrEmployeeService` → `employeeManagementService.importEmployeesFromCSV` | `hrController.import.test.ts` |
| Terminate | `deactivateEmployeePositionById` | `hrEmployeeService.test.ts` |
| Delete | `softTrashEmployeeProfile` + vacate | `hrTrashService.test.ts` |
| V-Link profile | Org-chart scoped access | `hrVlinkAccessService.test.ts` |

**Verdict:** 🟢 Lifecycle symmetry preserved.

---

## Quality

### Test coverage

~80 `it()` cases across 21 HR-focused test files. Strong coverage for decomposition, V-Link, trash, activity, notifications, policy dual.

### Remaining Prisma concentration

**15** in `hrAIContextController` only (main path clean).

### Remaining 501 stubs

None in core HR routes. Analytics controllers delegate to `hrAnalyticsService` (G18 adjacent).

### Controller debt

`hrControllerUtils.mapHrServiceError` unused. Analytics handlers remain in main controller. Settings are framework stubs.

---

## Level 3 gate review (detailed)

| Gate | Status | Evidence |
|------|--------|----------|
| Canonical services | 🟢 | 7+ domain services |
| Thin controllers | 🟡 | Main 0 Prisma; AI partial |
| Policy Engine | 🟡 | Destructive paths gated |
| Global Trash | 🟢 | Scoped by design |
| V_Link | 🟢 | Full |
| Platform entities | 🟢 | Full |
| Domain events | 🟡 | Activity only |
| Module activity | 🟢 | Full |
| Notifications | 🟢 | Full |
| Realtime | 🟢 | Not declared (truthful) |
| AI compliance | 🟡 | Context Prisma |
| Capability truth | 🟢 | Manifest accurate |
| Tests | 🟢 | ~80 cases |
| Documentation | 🟡 | This audit; operation matrix recommended |
| Legacy | 🟢 | Clean main path |

---

## Required remediation (findings tracking)

| Priority | Action | Type |
|----------|--------|------|
| **P1** | Extract `hrAIContextController` to service/visibility layer | Major |
| **P1** | Expand PE to team/me read routes or document Chat-style post-query filter waiver | Major |
| **P1** | Create `HR_OPERATION_MATRIX.md` | Major |
| **P2** | Implement `web/src/api/hr.ts` (6B) | Advisory |
| **P2** | Wire or remove `hrControllerUtils` | Advisory |
| **P2** | Add `hrDomainEventService` or platform waiver ticket | Advisory |
| **P3** | Split analytics controllers from main `hrController` | Enhancement |

---

## Reference candidacy — workforce lifecycle

**Qualified as REFERENCE CANDIDATE** (not Reference Implementation).

HR demonstrates workforce-lifecycle patterns — org-chart symmetric terminate/import/delete, PTO bridge via `hrScheduleService`, multi-entity V-Link, scoped global trash — suitable for documenting as Business Operations reference **after** P1 findings are tracked to closure.

---

## Certification decision

| Field | Value |
|-------|-------|
| **Evaluation outcome** | **PASS WITH FINDINGS** |
| **Certification recommendation** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Findings** | 9 — see [HR_FINDINGS_REGISTER.md](./HR_FINDINGS_REGISTER.md) |

---

## Related documents

- [HR_FINDINGS_REGISTER.md](./HR_FINDINGS_REGISTER.md)
- [BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md](./BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md)
- [HR_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md](./HR_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md)
