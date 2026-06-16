# Stage 1 Engineering Blueprint

**Program:** Business Operations Stage 1 Engineering Blueprint  
**Status:** Master implementation blueprint — no code, no implementation  
**Last updated:** 2026-06-14  
**Planning source:** [STAGE_1_SHARED_ALIGNMENT_IMPLEMENTATION_STRATEGY.md](./STAGE_1_SHARED_ALIGNMENT_IMPLEMENTATION_STRATEGY.md)  
**File matrix:** [STAGE_1_FILE_TARGET_MATRIX.md](./STAGE_1_FILE_TARGET_MATRIX.md)  
**Readiness:** [STAGE_1_EXECUTION_READINESS_REPORT.md](./STAGE_1_EXECUTION_READINESS_REPORT.md)

---

## Purpose

Translate approved Stage 1 implementation plans into **concrete engineering scope**: files, services, routes, schemas, tests, migrations, and platform contracts to modify. Repository inspection authorized; no redesign of Stage 1 decisions.

**Primary question answered:** Exactly what must change in the codebase to execute CO-06, CO-05, CO-01, CO-02, CO-03, CO-04, CO-07?

---

## Execution order

Aligned with [STAGE_1_IMPLEMENTATION_SEQUENCE.md](./STAGE_1_IMPLEMENTATION_SEQUENCE.md):

| Track | COs | Engineering focus |
|-------|-----|-------------------|
| **First** | CO-06 + CO-05 (parallel) | Governance doc; identity code paths |
| **Second** | CO-01 | Activity services + emit wiring |
| **Third** | CO-02 + CO-03 + CO-04 + CO-07 (parallel) | Notifications, PE, trash, bridge contract |
| **Fourth** | Verification | Integration tests; matrix audit |
| **Fifth** | Handoff | Stage 2 readiness package |

---

## Repositories / monorepo areas touched

| Area | Path | COs |
|------|------|-----|
| **Prisma** | `prisma/modules/scheduling/`, `prisma/modules/hr/`, `prisma/migrations/` | CO-04, CO-05 |
| **Server — controllers** | `server/src/controllers/hrController.ts`, `server/src/controllers/scheduling/*.ts` | CO-01, CO-02, CO-04, CO-05 |
| **Server — services** | `server/src/services/`, `server/src/auth/` | CO-01–CO-04, CO-07 |
| **Server — routes** | `server/src/routes/hr.ts`, `server/src/routes/scheduling.ts`, `server/src/routes/org-chart.ts` | CO-03, CO-05 |
| **Server — startup** | `builtInModuleManifests.ts`, `registerBuiltInModules.ts`, `registerGlobalTrashHandlers.ts`, seeds | CO-02, CO-04 |
| **Server — middleware** | `schedulingPermissions.ts`, `hrPermissions.ts` | CO-03 |
| **Web** | `web/src/app/notifications/`, `web/src/components/GlobalTrashBin.tsx`, org-chart UI | CO-02, CO-04, CO-05 |
| **Docs** | `docs/business-operations/`, `docs/guides/` cross-links | CO-06, CO-07 |
| **Tests** | `server/src/**/__tests__/` | All COs |

---

## Domains touched

| Domain | Role in Stage 1 | COs |
|--------|-----------------|-----|
| **Org Chart** | Identity authority — EP write path | CO-05 |
| **HR** | Primary identity remediation; activity/notif/PE/trash consumer | CO-01–CO-05, CO-07 |
| **Scheduling** | Activity/notif/PE/trash consumer; bridge caller | CO-01–CO-04, CO-07 |
| **Calendar** | Event storage via bridge (read-only contract) | CO-07 |
| **Platform** | Activity, Notifications, PE, Global Trash infrastructure | CO-01–CO-04 |
| **Workforce Communications** | Future hooks only (`workforce_*` taxonomy) | CO-02 |
| **Business / Front Page** | Governance classification only | CO-06 |

---

## Services touched

### Platform services (modify or extend)

| Service | Path | CO |
|---------|------|-----|
| Module activity | `moduleActivityService.ts` | CO-01 (consume) |
| Notification | `NotificationService`, `notificationGroupingService.ts` | CO-02 |
| Policy Engine | `policyEngine.ts`, `policyActions.ts` | CO-03 |
| Global Trash registry | `globalTrashModuleRegistry.ts`, `registerGlobalTrashHandlers.ts` | CO-04 |
| Trash controller | `trashController.ts` | CO-04 |

### New services (CREATE)

| Service | CO | Pattern reference |
|---------|-----|-------------------|
| `schedulingActivityService.ts` | CO-01 | `chatActivityService.ts` |
| `hrActivityService.ts` | CO-01 | `todoActivityService.ts` |
| `schedulingNotificationService.ts` | CO-02 | `placeNotificationService.ts` |
| `schedulingPolicyDual.ts` | CO-03 | `todoPolicyDual.ts` |
| `hrPolicyDual.ts` | CO-03 | `calendarPolicyDual.ts` |
| `schedulingTrashService.ts` | CO-04 | `calendarTrashService.ts` |
| `hrTrashService.ts` | CO-04 | `todoTrashService.ts` |

### Existing services (MODIFY)

| Service | CO | Change |
|---------|-----|--------|
| `employeeManagementService.ts` | CO-05 | Lifecycle symmetry; import delegation |
| `hrAttendanceService.ts` | CO-02 | 3 attendance notification emitters |
| `hrOnboardingService.ts` | CO-01, CO-02 | Activity + manifest alignment |
| `hrScheduleService.ts` | CO-07 | Contract header; export documentation |
| `hrAIActionService.ts` | CO-07 | Caller doc alignment |

---

## Migration scope

| Migration | Models | CO | Risk |
|-----------|--------|-----|------|
| **M1 — Scheduling trash** | `Schedule`, `ScheduleShift`, `ScheduleTemplate`, `EmployeeAvailability` (add `trashedAt`) | CO-04 | High |
| **M2 — HR trash** | `EmployeeHRProfile` (`deletedAt` → `trashedAt` or alias); onboarding templates | CO-04 | High |
| **M3 — ARCHIVED disposition** | `ScheduleStatus.ARCHIVED` mapping decision | CO-04 | Medium |
| **None** | Identity, Activity, Notifications, PE, Bridge contract | CO-05, CO-01, CO-02, CO-03, CO-07 | — |

**Note:** Migration files are **planned** in blueprint only — not created in this program.

---

## Testing scope

| CO | New tests (planned) | Type |
|----|---------------------|------|
| CO-05 | `employeeManagementService.identity.test.ts`, `hrController.import.test.ts` | Unit + integration |
| CO-01 | `schedulingActivityService.test.ts`, `hrActivityService.test.ts` | Unit |
| CO-02 | `schedulingNotificationService.test.ts`, manifest reconciliation test | Unit |
| CO-03 | `schedulingPolicyDual.test.ts`, `hrPolicyDual.test.ts` | Unit (pattern: `todoPolicyDual.test.ts`) |
| CO-04 | `schedulingTrashService.test.ts`, `hrTrashService.test.ts`, `trashController.scheduling.test.ts`, `trashController.hr.test.ts` | Unit + integration |
| CO-07 | `hrScheduleService.contract.test.ts` (sync scenario mocks) | Integration |
| Cross-CO | Extend `scheduling-tenant-scope.integration.test.ts` | Integration |

**Target:** 12–18 new test files; extend 1 existing integration test.

---

## Rollout sequence (engineering packages)

| Package | COs | Contents |
|---------|-----|----------|
| **P0** | CO-06, CO-05 | Governance checklist doc; CSV import + lifecycle code |
| **P1** | CO-01 | Activity services; P1 emit wiring in controllers |
| **P2a** | CO-02, CO-07 | Manifest blocks; grouping map; contract doc |
| **P2b** | CO-03 | `policyActions` expansion; dual evaluators; route middleware |
| **P3** | CO-04 | Prisma migrations; trash services; handler registration |
| **P4** | Verification | Full matrix audit; integration test pass |

---

## CO engineering blueprint index

| CO | Gap | Blueprint |
|----|-----|-----------|
| CO-06 | G01 | Master + file matrix (DOC only) |
| CO-05 | G02 | [CO05_IDENTITY_ENGINEERING_BLUEPRINT.md](./CO05_IDENTITY_ENGINEERING_BLUEPRINT.md) |
| CO-01 | G03 | [CO01_ACTIVITY_ENGINEERING_BLUEPRINT.md](./CO01_ACTIVITY_ENGINEERING_BLUEPRINT.md) |
| CO-02 | G04 | [CO02_NOTIFICATION_ENGINEERING_BLUEPRINT.md](./CO02_NOTIFICATION_ENGINEERING_BLUEPRINT.md) |
| CO-03 | G05 | [CO03_POLICY_ENGINE_ENGINEERING_BLUEPRINT.md](./CO03_POLICY_ENGINE_ENGINEERING_BLUEPRINT.md) |
| CO-04 | G06 | [CO04_GLOBAL_TRASH_ENGINEERING_BLUEPRINT.md](./CO04_GLOBAL_TRASH_ENGINEERING_BLUEPRINT.md) |
| CO-07 | G07 | [CO07_HRSCHEDULESERVICE_ENGINEERING_BLUEPRINT.md](./CO07_HRSCHEDULESERVICE_ENGINEERING_BLUEPRINT.md) |

---

## Estimated scope summary

| Metric | Estimate |
|--------|----------|
| **Files touched** | 58 (see file matrix) |
| **New files** | 14 |
| **Modified files** | 38 |
| **Migrations** | 2–3 |
| **New tests** | 14–18 |
| **Docs** | 2 |

---

## Platform contracts modified

| Contract | Mechanism | CO |
|----------|-----------|-----|
| Module activity envelope | `emitModuleActivityEvent` | CO-01 |
| Notification manifest | `builtInModuleManifests.ts` → DB `Module.manifest` | CO-02 |
| PE actions | `policyActions.ts` + `authorize()` | CO-03 |
| Global Trash handler | `registerGlobalTrashModuleHandler` | CO-04 |
| Bridge API | `hrScheduleService` exports documented | CO-07 |
| FALSE POSITIVE governance | Design review checklist | CO-06 |

---

## Certification statement

**No certification awarded.** Engineering blueprint only — no code or schema changes in this program.
