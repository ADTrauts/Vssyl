# HR Domain Event Adoption Report

**Program:** PK-W3-DE-2  
**Date:** 2026-06-23  
**Status:** **Complete**

---

## 1. Pre-adoption state

| Dimension | Status |
|-----------|--------|
| Activity emission | ✅ `hrActivityService` — 12 operations |
| Domain event emission | ❌ None |
| Facade | ❌ Missing |
| Registry types | ❌ None |

---

## 2. Facade

**File:** `server/src/services/hrDomainEventService.ts`

Pattern matches `schedulingDomainEventService.ts` / `todoDomainEventService.ts`: thin delegates over `domainEventEmitters.ts`.

---

## 3. HR operations emitting domain events

| Activity action | Domain event type | Facade function |
|-----------------|-------------------|-----------------|
| `hr_employee_created` | `hr.employee.created` | `recordEmployeeCreatedDomainEvent` |
| `hr_employee_updated` | `hr.employee.updated` | `recordEmployeeUpdatedDomainEvent` |
| `hr_employee_terminated` | `hr.employee.terminated` | `recordEmployeeTerminatedDomainEvent` |
| `hr_employee_trashed` | `hr.employee.trashed` | `recordEmployeeTrashedDomainEvent` |
| `hr_employee_restored` | `hr.employee.restored` | `recordEmployeeRestoredDomainEvent` |
| `hr_employee_purged` | `hr.employee.permanentlyDeleted` | `recordEmployeePurgedDomainEvent` |
| `hr_onboarding_created` | `hr.onboarding.created` | `recordOnboardingCreatedDomainEvent` |
| `hr_onboarding_completed` | `hr.onboarding.completed` | `recordOnboardingCompletedDomainEvent` |
| `hr_pto_requested` | `hr.pto.requested` | `recordPtoRequestedDomainEvent` |
| `hr_pto_approved` | `hr.pto.approved` | `recordPtoApprovedDomainEvent` |
| `hr_pto_denied` | `hr.pto.denied` | `recordPtoDeniedDomainEvent` |
| `hr_attendance_exception_created` | `hr.attendance.exception.created` | `recordAttendanceExceptionCreatedDomainEvent` |

---

## 4. Wiring model

```
hrEmployeeService / hrPtoService / hrOnboardingService / hrTrashService / hrAttendanceService
  → hrActivityService.record*()
       → emitModuleActivityEvent (feed)
       → hrDomainEventService.record*DomainEvent()
            → domainEventEmitters.emitHr*Event()
                 → emitDomainEvent
```

Services continue to call `hrActivityService` only — **no call-site churn**.

---

## 5. Metadata policy

Per registry contracts:

- Includes: `moduleId`, `employeePositionId`, `employeeHrProfileId`, `templateId`, `type`, `terminationDate`, `reason` (non-PII)
- Excludes: `name`, `email`, `phone`, `ssn`, free-text notes

---

## 6. Activity-only operations remaining

**None.** Every `hrActivityService.record*` function dual-emits.

---

## 7. Call sites (unchanged)

| Service | Functions |
|---------|-----------|
| `hrEmployeeService` | created, updated, terminated |
| `hrTrashService` | trashed, restored, purged |
| `hrOnboardingService` | created, completed |
| `hrPtoService` | requested, approved, denied |
| `hrAttendanceService` | exception created |

---

**Last updated:** 2026-06-23
