# Scheduling Certification Audit

**Module id:** `scheduling`  
**Evaluation date:** 2026-06-16  
**Phase:** Business Operations Stage 2 — Certification Evaluation  
**Benchmarks:** File Hub (`drive`), Chat (`chat`), Calendar (`calendar`)  
**Authorities:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md), [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md)

---

## Executive summary

Scheduling **does not satisfy** Level 3 certification requirements at evaluation time.

**Evaluation outcome:** **FAIL**  
**Certification recommendation:** **NOT CERTIFIED**

The module achieved substantial Stage 2 modernization (G09 manager APIs, primary service extraction, V-Link integration) but retains **hard blockers** that Chat and Calendar did not carry at certification: a controller performing direct Prisma **mutations** (`schedulingAdminToolsController`) and a manifest declaring **`realtime: true`** without a realtime adapter.

**Findings count:** 12 (3 blocking · 4 major · 5 advisory)

---

## Architecture evaluation

### Thin controllers

| Controller | `prisma.` count | Verdict |
|------------|-----------------|---------|
| `schedulingAdminController` | 0 | 🟢 |
| `schedulingEmployeeController` | 0 | 🟢 |
| `schedulingTeamController` | 0 | 🟢 |
| `schedulingAdminToolsController` | **32** | 🔴 |
| `schedulingAiContextController` | **16** | 🔴 |
| `schedulingDashboardController` | **3** | 🟡 |

**Critical evidence:** `schedulingAdminToolsController.ts` contains direct `prisma.scheduleShift.create`, `prisma.businessStation.create/update/delete`, and `prisma.jobLocation.create/update/delete` — module mutations in HTTP layer. This violates CERTIFICATION_LEDGER § "Not acceptable at Level 3: Direct Prisma in controllers … for module mutations."

Chat and Calendar certified with **zero** Prisma in primary controllers. Calendar's accepted exception (`eventCommentController`, ~62 lines) is a minor sub-resource; AdminTools is core admin infrastructure.

### Service boundaries

| Service | Domain | Status |
|---------|--------|--------|
| `schedulingScheduleService` | Schedule CRUD, publish lists | 🟢 |
| `schedulingShiftService` | Shift CRUD, assign, open shifts | 🟢 |
| `schedulingTemplateService` | Shift + schedule templates | 🟢 |
| `schedulingAvailabilityService` | Employee availability | 🟢 |
| `schedulingSwapService` | Swap lifecycle | 🟢 |
| `schedulingPublishService` | Publish orchestration | 🟢 |
| `schedulingManagerService` | G09 facade | 🟢 |
| `schedulingActivityService` | Activity adapter | 🟢 |
| `schedulingNotificationService` | Notification adapter | 🟢 |
| `schedulingTrashService` | Trash lifecycle | 🟢 |
| `schedulingVlinkAccessService` / `Lifecycle` | V-Link | 🟢 |
| **AdminTools** | Stations, locations, bulk shift create | 🔴 **Not extracted** |

### Domain ownership

- Scheduling owns `Schedule`, `ScheduleShift`, `ShiftTemplate`, `ScheduleTemplate` per CO-08 decision (`SHIFT_TEMPLATE_DOMAIN_DECISION.md`)
- Tenant isolation via `businessId` + `requireAuthorizedBusinessId` — 🟢
- Integration test: `scheduling-tenant-scope.integration.test.ts` (3 cases)

---

## Constitutional adoption

| Capability | Status | Evidence |
|------------|--------|----------|
| **Activity** | 🟢 | 20 `record*` exports; G09 publish/assign tested |
| **Notifications** | 🟢 | 6 manifest types; `schedulingNotificationService` |
| **Policy Engine** | 🟡 | 27 `checkSchedulingPolicy` usages; gaps on schedule-template delete, admin tools routes |
| **Global Trash** | 🟢 | Handler; `trashedAt`; V-Link unlink on purge |
| **V-Link** | 🟢 | 3 entities; fail-closed on trashed; 13 tests |
| **AI** | 🔴 | 16 Prisma in context controller; action service exists for writes |
| **Audit** | 🔴 | No scheduling audit trail |
| **Domain events** | 🔴 | No `scheduling.*` registered types; activity-only |

---

## Platform integration

| Item | Status | Evidence |
|------|--------|----------|
| `registerSchedulingPlatformEntities()` | 🟢 | 3 entities |
| Manifest `entities[]` | 🟢 | Matches registry |
| Manifest capabilities | 🔴 | `realtime: true` — **no** `schedulingRealtimeService` |
| Trash handler | 🟢 | `registerGlobalTrashHandlers` scheduling block |
| V-Link resolver | 🟢 | `SCHEDULE`, `SCHEDULE_SHIFT`, `SHIFT_SWAP_REQUEST` |
| Permissions | 🟡 | Legacy role middleware + partial PE |

---

## Quality

### Test coverage

~74 `it()` cases across 16 scheduling-focused test files. Strong service-layer coverage; missing `schedulingTeamController.g09.test.ts` per Stage 2 matrix.

### Remaining Prisma concentration

**51 total** in scheduling controllers — **32 in AdminTools alone**.

### Remaining 501 stubs

3 analytics endpoints in `schedulingAdminController` (G18 / Stage 4 — documented out of scope).

### Controller debt

Primary G09/admin/employee/team surfaces are clean. **AdminTools, AI context, and dashboard** remain Stage 2 extraction tail.

---

## Level 3 gate review (detailed)

| Gate | Status | Evidence |
|------|--------|----------|
| Canonical services | 🟡 | AdminTools bypass |
| Thin controllers | 🔴 | AdminTools mutations |
| Policy Engine | 🟡 | Core writes gated |
| Global Trash | 🟢 | Full |
| V_Link | 🟢 | Full |
| Platform entities | 🟢 | Full |
| Domain events | 🔴 | None |
| Module activity | 🟢 | Full |
| Notifications | 🟢 | Full |
| Realtime | 🔴 | Manifest lie |
| AI compliance | 🔴 | Context Prisma |
| Capability truth | 🔴 | realtime |
| Tests | 🟡 | Service-heavy |
| Documentation | 🟡 | This audit; no operation matrix |
| Legacy | 🟡 | G18 501 |

---

## Required remediation (certification path)

| Priority | Action | Gate |
|----------|--------|------|
| **P0** | Extract `schedulingAdminToolsController` to `schedulingStationService` / `schedulingLocationService` / shift bulk service | #2 |
| **P0** | Set `realtime: false` in manifest OR implement `schedulingRealtimeService` | #10, #12 |
| **P1** | Extract `schedulingAiContextController` reads to visibility/service layer | #11 |
| **P1** | Add `schedulingDomainEventService` + register `scheduling.*` types OR document platform waiver | #7 |
| **P1** | Add PE to schedule-template delete and admin tools write routes | #3 |
| **P2** | Create `SCHEDULING_OPERATION_MATRIX.md` | #14 |
| **P2** | Extract `schedulingDashboardController` (3 Prisma) | #2 |

---

## Reference candidacy — planning domain

**Not qualified** as planning-domain reference implementation.

Scheduling cannot serve as the workforce-planning reference until AdminTools extraction and manifest truthfulness match Chat/Calendar certification bars.

---

## Certification decision

| Field | Value |
|-------|-------|
| **Evaluation outcome** | **FAIL** |
| **Certification recommendation** | **NOT CERTIFIED** |
| **Re-evaluation trigger** | P0 remediation complete + regression test pass |

---

## Related documents

- [SCHEDULING_FINDINGS_REGISTER.md](./SCHEDULING_FINDINGS_REGISTER.md)
- [BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md](./BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md)
- [SCHEDULING_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md](./SCHEDULING_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md)
