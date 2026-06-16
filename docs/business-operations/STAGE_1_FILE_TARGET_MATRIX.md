# Stage 1 File Target Matrix

**Program:** Business Operations Stage 1 Engineering Blueprint  
**Status:** Authoritative file-level scope — no implementation  
**Last updated:** 2026-06-14  
**Row count:** 62

---

## Legend

| Column | Values |
|--------|--------|
| **Owner** | Platform, Scheduling, HR, Workforce Communications, Shared |
| **Change Type** | CREATE, MODIFY, MIGRATE, TEST, CONFIG, DOC |
| **Risk** | Low, Medium, High |
| **Dependency** | CO-05, CO-01, CO-02, CO-03, CO-04, CO-07, None |

---

## CO-06 — FALSE POSITIVE Governance

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-06 | `docs/business-operations/BO_FALSE_POSITIVE_DESIGN_REVIEW_CHECKLIST.md` | CREATE | Low | None | Platform | None |
| CO-06 | `docs/business-operations/STAGE_1_SHARED_ALIGNMENT_IMPLEMENTATION_STRATEGY.md` | DOC | Low | None | Platform | None |
| CO-06 | `memory-bank/progress.md` | DOC | Low | None | Platform | None |

---

## CO-05 — Identity Trust Hardening

### Prisma

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-05 | `prisma/modules/hr/core.prisma` | DOC | Low | None | HR | CO-04 |
| CO-05 | `prisma/modules/org-chart/core.prisma` | DOC | Low | None | Shared | None |

### Server

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-05 | `server/src/controllers/hrController.ts` | MODIFY | High | New tests | HR | None |
| CO-05 | `server/src/services/employeeManagementService.ts` | MODIFY | High | New tests | Shared | None |
| CO-05 | `server/src/routes/hr.ts` | MODIFY | Medium | Integration | HR | None |
| CO-05 | `server/src/routes/org-chart.ts` | MODIFY | Medium | Integration | Shared | None |
| CO-05 | `server/src/services/hrAttendanceService.ts` | MODIFY | Medium | Extend | HR | CO-04 |

### Web

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-05 | `web/src/components/org-chart/EmployeeManager.tsx` | MODIFY | Medium | Manual | Shared | None |
| CO-05 | `web/src/api/org-chart.ts` | MODIFY | Low | None | Shared | None |

### Tests

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-05 | `server/src/services/__tests__/employeeManagementService.identity.test.ts` | CREATE | Medium | New suite | HR | None |
| CO-05 | `server/src/controllers/__tests__/hrController.import.test.ts` | CREATE | High | New suite | HR | None |
| CO-05 | `server/src/__tests__/scheduling-tenant-scope.integration.test.ts` | MODIFY | Low | Extend | Scheduling | None |

### Docs

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-05 | `docs/business-operations/CO05_IDENTITY_ENGINEERING_BLUEPRINT.md` | DOC | Low | None | Platform | None |

---

## CO-01 — Activity Standardization

### Server

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-01 | `server/src/services/schedulingActivityService.ts` | CREATE | Medium | New suite | Scheduling | None |
| CO-01 | `server/src/services/hrActivityService.ts` | CREATE | Medium | New suite | HR | None |
| CO-01 | `server/src/services/moduleActivityService.ts` | DOC | Low | None | Platform | None |
| CO-01 | `server/src/controllers/scheduling/schedulingAdminController.ts` | MODIFY | Medium | Integration | Scheduling | None |
| CO-01 | `server/src/controllers/scheduling/schedulingTeamController.ts` | MODIFY | Medium | Integration | Scheduling | None |
| CO-01 | `server/src/controllers/scheduling/schedulingEmployeeController.ts` | MODIFY | Medium | Integration | Scheduling | None |
| CO-01 | `server/src/controllers/hrController.ts` | MODIFY | Medium | Integration | HR | CO-05 |
| CO-01 | `server/src/services/hrOnboardingService.ts` | MODIFY | Low | Unit | HR | None |
| CO-01 | `server/src/services/employeeManagementService.ts` | MODIFY | Low | Extend | Shared | CO-05 |

### Tests

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-01 | `server/src/services/__tests__/schedulingActivityService.test.ts` | CREATE | Low | New suite | Scheduling | None |
| CO-01 | `server/src/services/__tests__/hrActivityService.test.ts` | CREATE | Low | New suite | HR | None |

### Docs

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-01 | `docs/business-operations/CO01_ACTIVITY_ENGINEERING_BLUEPRINT.md` | DOC | Low | None | Platform | None |

---

## CO-02 — Notification Standardization

### Server

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-02 | `server/src/services/schedulingNotificationService.ts` | CREATE | Medium | New suite | Scheduling | None |
| CO-02 | `server/src/startup/builtInModuleManifests.ts` | MODIFY | Medium | Reconcile test | Platform | None |
| CO-02 | `server/src/startup/registerBuiltInModules.ts` | MODIFY | Low | Startup | Platform | None |
| CO-02 | `server/src/services/notificationGroupingService.ts` | MODIFY | Medium | Unit | Platform | None |
| CO-02 | `server/src/services/notificationService.ts` | DOC | Low | None | Platform | None |
| CO-02 | `server/src/controllers/scheduling/schedulingAdminController.ts` | MODIFY | Medium | Integration | Scheduling | CO-01 |
| CO-02 | `server/src/controllers/scheduling/schedulingTeamController.ts` | MODIFY | Medium | Integration | Scheduling | CO-01 |
| CO-02 | `server/src/controllers/scheduling/schedulingEmployeeController.ts` | MODIFY | Medium | Integration | Scheduling | None |
| CO-02 | `server/src/services/hrAttendanceService.ts` | MODIFY | Medium | Unit | HR | None |
| CO-02 | `server/src/services/hrOnboardingService.ts` | MODIFY | Low | Unit | HR | None |
| CO-02 | `server/src/controllers/hrController.ts` | MODIFY | Medium | Integration | HR | None |
| CO-02 | `scripts/ensure-builtin-modules.ts` | CONFIG | Low | Manual | Platform | None |

### Web

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-02 | `web/src/app/notifications/page.tsx` | MODIFY | Low | Manual | Platform | None |
| CO-02 | `web/src/api/notifications.ts` | MODIFY | Low | None | Platform | None |

### Tests

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-02 | `server/src/services/__tests__/schedulingNotificationService.test.ts` | CREATE | Low | New suite | Scheduling | None |
| CO-02 | `server/src/startup/__tests__/builtInModuleManifests.notifications.test.ts` | CREATE | Medium | New suite | Platform | None |

### Docs

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-02 | `docs/business-operations/CO02_NOTIFICATION_ENGINEERING_BLUEPRINT.md` | DOC | Low | None | Platform | None |
| CO-02 | `docs/business-operations/WORKFORCE_COMMUNICATIONS_ESTABLISHMENT_REQUIREMENTS.md` | DOC | Low | None | Workforce Communications | None |

---

## CO-03 — Policy Engine Adoption

### Server

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-03 | `server/src/auth/policyActions.ts` | MODIFY | High | Unit | Platform | None |
| CO-03 | `server/src/auth/schedulingPolicyDual.ts` | CREATE | High | New suite | Scheduling | None |
| CO-03 | `server/src/auth/hrPolicyDual.ts` | CREATE | High | New suite | HR | None |
| CO-03 | `server/src/services/policyEngine.ts` | MODIFY | Medium | Unit | Platform | None |
| CO-03 | `server/src/routes/scheduling.ts` | MODIFY | High | Integration | Scheduling | None |
| CO-03 | `server/src/routes/hr.ts` | MODIFY | High | Integration | HR | None |
| CO-03 | `server/src/middleware/schedulingPermissions.ts` | DOC | Low | Regression | Scheduling | None |
| CO-03 | `server/src/middleware/hrPermissions.ts` | DOC | Low | Regression | HR | None |

### Tests

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-03 | `server/src/auth/__tests__/schedulingPolicyDual.test.ts` | CREATE | Medium | New suite | Scheduling | None |
| CO-03 | `server/src/auth/__tests__/hrPolicyDual.test.ts` | CREATE | Medium | New suite | HR | None |

### Docs

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-03 | `docs/architecture/POLICY_ENGINE.md` | DOC | Low | None | Platform | None |
| CO-03 | `docs/business-operations/CO03_POLICY_ENGINE_ENGINEERING_BLUEPRINT.md` | DOC | Low | None | Platform | None |

---

## CO-04 — Global Trash Alignment

### Prisma

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-04 | `prisma/modules/scheduling/core.prisma` | MODIFY | High | Migration | Scheduling | None |
| CO-04 | `prisma/modules/hr/core.prisma` | MODIFY | High | Migration | HR | None |
| CO-04 | `prisma/migrations/YYYYMMDD_scheduling_trashed_at/migration.sql` | MIGRATE | High | DB test | Scheduling | None |
| CO-04 | `prisma/migrations/YYYYMMDD_hr_trashed_at/migration.sql` | MIGRATE | High | DB test | HR | CO-05 |

### Server

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-04 | `server/src/services/schedulingTrashService.ts` | CREATE | High | New suite | Scheduling | None |
| CO-04 | `server/src/services/hrTrashService.ts` | CREATE | High | New suite | HR | None |
| CO-04 | `server/src/startup/registerGlobalTrashHandlers.ts` | MODIFY | Medium | Integration | Platform | None |
| CO-04 | `server/src/services/globalTrashModuleRegistry.ts` | MODIFY | Low | Unit | Platform | None |
| CO-04 | `server/src/controllers/trashController.ts` | MODIFY | Medium | Integration | Platform | None |
| CO-04 | `server/src/controllers/scheduling/schedulingAdminController.ts` | MODIFY | High | Integration | Scheduling | CO-04 |
| CO-04 | `server/src/controllers/scheduling/schedulingTeamController.ts` | MODIFY | Medium | Integration | Scheduling | CO-04 |
| CO-04 | `server/src/controllers/hrController.ts` | MODIFY | High | Integration | HR | CO-05 |
| CO-04 | `server/src/index.ts` | CONFIG | Low | Startup | Platform | None |

### Web

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-04 | `web/src/components/GlobalTrashBin.tsx` | MODIFY | Medium | Manual | Platform | None |
| CO-04 | `web/src/contexts/GlobalTrashContext.tsx` | MODIFY | Medium | Manual | Platform | None |
| CO-04 | `web/src/utils/trashUtils.ts` | MODIFY | Low | None | Platform | None |

### Tests

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-04 | `server/src/services/__tests__/schedulingTrashService.test.ts` | CREATE | High | New suite | Scheduling | None |
| CO-04 | `server/src/services/__tests__/hrTrashService.test.ts` | CREATE | High | New suite | HR | None |
| CO-04 | `server/src/controllers/__tests__/trashController.scheduling.test.ts` | CREATE | Medium | New suite | Platform | None |
| CO-04 | `server/src/controllers/__tests__/trashController.hr.test.ts` | CREATE | Medium | New suite | Platform | None |

### Docs

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-04 | `docs/business-operations/CO04_GLOBAL_TRASH_ENGINEERING_BLUEPRINT.md` | DOC | Low | None | Platform | None |

---

## CO-07 — hrScheduleService Contract

### Server

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-07 | `server/src/services/hrScheduleService.ts` | MODIFY | Low | Contract test | Shared | None |
| CO-07 | `server/src/controllers/scheduling/schedulingAdminController.ts` | DOC | Low | None | Scheduling | None |
| CO-07 | `server/src/controllers/scheduling/schedulingTeamController.ts` | DOC | Low | None | Scheduling | None |
| CO-07 | `server/src/controllers/hrController.ts` | DOC | Low | None | HR | None |
| CO-07 | `server/src/services/hrAIActionService.ts` | DOC | Low | None | HR | None |
| CO-07 | `server/src/controllers/businessController.ts` | DOC | Low | None | Platform | None |

### Tests

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-07 | `server/src/services/__tests__/hrScheduleService.contract.test.ts` | CREATE | Low | New suite | Shared | CO-04 |

### Docs

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-07 | `docs/business-operations/HR_SCHEDULE_SERVICE_CONTRACT.md` | CREATE | Low | None | Shared | None |
| CO-07 | `docs/business-operations/CO07_HRSCHEDULESERVICE_ENGINEERING_BLUEPRINT.md` | DOC | Low | None | Platform | None |

---

## Cross-CO platform files (reference)

| CO | File | Change Type | Risk | Test Impact | Owner | Dependency |
|----|------|-------------|------|-------------|-------|------------|
| CO-01 | `server/src/services/chatActivityService.ts` | DOC | Low | None | Platform | None |
| CO-01 | `server/src/services/todoActivityService.ts` | DOC | Low | None | Platform | None |
| CO-03 | `server/src/auth/todoPolicyDual.ts` | DOC | Low | None | Platform | None |
| CO-04 | `server/src/services/calendarTrashService.ts` | DOC | Low | None | Platform | None |
| CO-06 | `docs/business-operations/STAGE_1_ENGINEERING_BLUEPRINT.md` | DOC | Low | None | Platform | None |

---

## Summary by change type

| Change Type | Count |
|-------------|-------|
| CREATE | 18 |
| MODIFY | 32 |
| MIGRATE | 2 |
| TEST | 14 |
| CONFIG | 2 |
| DOC | 19 |
| **Total rows** | **62** |

## Summary by owner

| Owner | Count |
|-------|-------|
| Platform | 22 |
| Scheduling | 14 |
| HR | 14 |
| Shared | 7 |
| Workforce Communications | 1 |

## Highest-risk file targets

| File | COs | Risk |
|------|-----|------|
| `hrController.ts` | CO-05, CO-01, CO-02, CO-04 | High |
| `schedulingAdminController.ts` | CO-01, CO-02, CO-04 | High |
| `employeeManagementService.ts` | CO-05, CO-01 | High |
| `prisma/modules/scheduling/core.prisma` | CO-04 | High |
| `prisma/modules/hr/core.prisma` | CO-04 | High |
| `policyActions.ts` + route files | CO-03 | High |
