# Business Operations Platform Adoption Report

**Program:** Business Operations Stage 2 Closeout  
**Modules:** Scheduling, HR  
**Assessment date:** 2026-06-16  
**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §19 Capability Matrix

---

## Platform adoption matrix

| Capability | Scheduling | HR | Combined status | Notes |
|------------|------------|-----|-----------------|-------|
| **Activity** | **Adopted** | **Adopted** | **PASS** | Both use `emitModuleActivityEvent` via dedicated `*ActivityService`; contract tests verify controller delegation |
| **Notifications** | **Adopted** | **Adopted** | **PASS** | Manifest types match runtime emitters; grouping service maps BO types |
| **Policy Engine** | **Partial** | **Partial** | **PARTIAL** | Both have `*PolicyDual.ts`; write paths largely covered; read/admin list gaps remain |
| **Global Trash** | **Adopted** | **Adopted (scoped)** | **PASS** | Scheduling: schedule/shift/template; HR: `employee_profile` only; handlers registered |
| **V-Link** | **Adopted** | **Adopted** | **PASS** | Registry + access + lifecycle + resolver + manifest `entities[]` + migrations |
| **AI** | **Adopted** | **Adopted** | **PARTIAL** | Context providers registered; HR AI controller retains Prisma; governed writes via action services |
| **Search** | **Not adopted** | **Not adopted** | **DEFERRED** | `supportsSearch: false` — intentional Phase 1 scope per blueprint |
| **Audit** | **Not adopted** | **Partial** | **GAP** | HR: `logEmployeeAudit` for employee mutations; Scheduling: no module audit trail |

---

## Activity — detailed evidence

### Scheduling

| Item | Path / detail |
|------|---------------|
| Service | `server/src/services/schedulingActivityService.ts` |
| Export count | 20 `record*` functions |
| Envelope | `moduleId: 'scheduling'` via `emitModuleActivityEvent` |
| G09 flows | Publish + assign emit activity (tested) |
| Contract | `businessOperationsActivity.contract.test.ts` |
| Unit tests | `schedulingActivityService.test.ts` — 6 cases |

### HR

| Item | Path / detail |
|------|---------------|
| Service | `server/src/services/hrActivityService.ts` |
| Export count | 14 `record*` functions (employee, PTO, onboarding, attendance) |
| Envelope | `moduleId: 'hr'` |
| Contract | `businessOperationsActivity.contract.test.ts` |
| Unit tests | `hrActivityService.test.ts` — 7 cases |

**Verdict:** Stage 1 CO-01 contract **adopted** by both modules for primary mutation paths.

---

## Notifications — detailed evidence

### Scheduling

| Type | Emitter | Manifest |
|------|---------|----------|
| `scheduling_schedule_published` | `schedulingNotificationService` / manager publish | ✅ |
| `scheduling_shift_assigned` | assign flow | ✅ |
| `scheduling_open_shift_available` | open shift paths | ✅ |
| `scheduling_swap_requested` | swap service | ✅ |
| `scheduling_swap_approved` | swap service | ✅ |
| `scheduling_swap_denied` | swap service | ✅ |

Tests: `schedulingNotificationService.test.ts` (5), `builtInModuleManifests.hr-scheduling.test.ts` (4).

### HR

| Category | Count | Examples |
|----------|-------|----------|
| Time-off | 4 | `hr_time_off_request_submitted`, approved, denied, balance_low |
| Onboarding | 4 | assigned, task approved, pending approval, journey completed |
| Attendance | 4 | exception created/resolved, policy violation, missing punch |

Tests: `hrNotificationCompleteness.test.ts` (3), manifest cross-check (4).

**Verdict:** Stage 1 CO-02 taxonomy **adopted**. Workforce Communications types marked `planned: true` — not emitted (correct).

---

## Policy Engine — detailed evidence

### Scheduling

| Item | Detail |
|------|--------|
| Module file | `server/src/auth/schedulingPolicyDual.ts` |
| Actions | 11 `SCHEDULING_*` in `policyActions.ts` |
| Route middleware | `checkSchedulingPolicy` on publish, shift CRUD, assign, swap manage, template write |
| Tests | `schedulingPolicyDual.test.ts` — 7 cases |
| Gaps | Availability admin update, schedule-template reads, swap list, some station/location routes |

### HR

| Item | Detail |
|------|--------|
| Module file | `server/src/auth/hrPolicyDual.ts` |
| Actions | 17 `HR_*` actions |
| Route coverage | ~25/59 handlers (~42%) |
| Tests | `hrPolicyDual.test.ts` — 6 cases |
| Gaps | Analytics routes, team/me reads, AI context routes |

**Verdict:** Stage 1 CO-03 pattern **adopted**; **rollout incomplete** on both modules — P1 certification finding, not P0 blocker for review.

---

## Global Trash — detailed evidence

### Scheduling

| Item | Detail |
|------|--------|
| Service | `schedulingTrashService.ts` |
| Entity types | schedule, shift, schedule_template, shift_template |
| Field | `trashedAt` on schedule/shift (+ migration `20260615120000`) |
| Handler | `registerGlobalTrashHandlers.ts` scheduling block |
| V-Link | Unlink on permanent delete via `schedulingVlinkLifecycleService` |
| Tests | `schedulingTrashService.test.ts` (5), `trashController.scheduling.test.ts` (4) |

### HR

| Item | Detail |
|------|--------|
| Service | `hrTrashService.ts` |
| Entity types | `employee_profile` only |
| Field | `trashedAt` on `EmployeeHRProfile` (+ migration `20260615120100`) |
| Handler | `registerGlobalTrashHandlers.ts` HR block |
| V-Link | `unlinkEmployeeProfileFromAllVLinks` on purge |
| Tests | `hrTrashService.test.ts` (5), `trashController.hr.test.ts` (4) |

**Verdict:** Stage 1 CO-04 **adopted** for scoped entity sets. HR trash scope matches blueprint (profile only).

---

## V-Link — detailed evidence

### Scheduling (5D)

| entityType | vlinkEntityType | supportsTrash |
|------------|-----------------|---------------|
| schedule | SCHEDULE | true |
| shift | SCHEDULE_SHIFT | true |
| swap_request | SHIFT_SWAP_REQUEST | false |

Services: `schedulingVlinkAccessService.ts`, `schedulingVlinkLifecycleService.ts`  
Migration: `20260614000000_scheduling_vlink_entity_types`

### HR (6C)

| entityType | vlinkEntityType | supportsTrash |
|------------|-----------------|---------------|
| employee_profile | HR_EMPLOYEE_PROFILE | true |
| time_off_request | HR_TIME_OFF_REQUEST | false |
| attendance_exception | HR_ATTENDANCE_EXCEPTION | false |
| onboarding_journey | HR_ONBOARDING_JOURNEY | false |

Services: `hrVlinkAccessService.ts`, `hrVlinkLifecycleService.ts`  
Migration: `20260616000000_hr_vlink_entity_types`

**Access model (both):** V_Link membership → `resolveEntityAccess` → module access service → business membership + domain read rules + Policy Dual.

**Verdict:** Stage 2 CO-09 / G13 **complete** for both modules.

---

## AI — detailed evidence

### Scheduling

| Surface | Status |
|---------|--------|
| Context providers | 3 — overview, coverage, conflicts |
| Routes | `/api/scheduling/ai/context/*` |
| Write actions | `schedulingAIActionService` |
| Manifest | `ai: true` |
| Debt | `schedulingAiContextController` — 16 Prisma calls |

### HR

| Surface | Status |
|---------|--------|
| Context providers | 3 — overview, headcount, time-off |
| Routes | `/api/hr/ai/context/*` |
| Write actions | `hrAIActionService` (where applicable) |
| Manifest | `ai: true` in capabilities |
| Debt | `hrAIContextController` — 15 Prisma calls; light route guards |

**Verdict:** AI **structurally adopted** per module-development contract; **service-boundary gap** on context controllers — P2 debt.

---

## Search — detailed evidence

| Module | Registry | Manifest | Implementation |
|--------|----------|----------|----------------|
| Scheduling | `supportsSearch: false` (all 3 entities) | Same | No search indexer |
| HR | `supportsSearch: false` (all 4 entities) | Same | No search indexer |

**Verdict:** **Intentionally deferred** per Stage 2 blueprint entity scope. Not a Stage 2 failure.

---

## Audit — detailed evidence

| Module | Implementation |
|--------|----------------|
| Scheduling | No module-specific audit trail |
| HR | `logEmployeeAudit` → `auditLog` for HR_EMPLOYEE_CREATED/UPDATED/TERMINATED |

**Verdict:** **Platform audit pattern not fully adopted** by Scheduling; HR has **partial** employee audit only. P2 architectural debt; not Stage 2 exit criterion.

---

## Cross-module bridge (CO-07)

| Item | Status |
|------|--------|
| `hrScheduleService` | Contract tests (6 cases); PTO calendar sync in `hrPtoService` |
| Scheduling → HR dependency | Time-off events on business + personal calendars |

**Verdict:** **PASS** — neutral bridge preserved post-Stage 2.

---

## Comparison to reference modules

| Capability | File Hub | Chat | Calendar | Scheduling | HR |
|------------|----------|------|----------|------------|-----|
| Activity | High | High | High | High | High |
| Notifications | High | High | High | High | High |
| Policy Dual | High | High | High | Partial | Partial |
| Trash | High | High | High | High | High (scoped) |
| V-Link | High | High | High | High | High |
| AI | High | High | High | Partial | Partial |
| Search | Partial | N/A | Partial | Deferred | Deferred |
| Thin controllers | High | High | High | Partial | Partial |

---

## Overall platform adoption verdict

**Scheduling and HR have adopted the Stage 1 constitutional stack** (activity, notifications, trash, V-Link, AI context) at a level comparable to pre-certification Chat/Calendar work. **Policy Engine rollout** and **search** are the primary platform standards still incomplete relative to File Hub Level 4.

---

## Related documents

- [STAGE_2_CLOSEOUT_REPORT.md](./STAGE_2_CLOSEOUT_REPORT.md)
- [SCHEDULING_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md](./SCHEDULING_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md)
- [HR_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md](./HR_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md)
