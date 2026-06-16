# Stage 2 File Target Matrix

**Program:** Business Operations Stage 2 Engineering Blueprint  
**Status:** Authoritative file-level scope — no implementation  
**Last updated:** 2026-06-15  
**Row count:** 68  
**Blueprint:** [STAGE_2_ENGINEERING_BLUEPRINT.md](./STAGE_2_ENGINEERING_BLUEPRINT.md)

---

## Legend

| Column | Values |
|--------|--------|
| **Change Type** | CREATE, MODIFY, DELETE, TEST, MIGRATE, DOC |
| **Risk** | Low, Medium, High |
| **Test Impact** | None, Extend, New suite, Manual |

---

## Package 5A — CO-08 / G08: Shift-template collision resolution

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5A | `docs/business-operations/CO08_SHIFT_TEMPLATE_DECISION.md` | CREATE | Low | None |
| 5A | `docs/business-operations/HR_SCHEDULING_BOUNDARY_REVIEW.md` | DOC | Low | None |
| 5A | `docs/business-operations/BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md` | DOC | Low | None |
| 5A | `prisma/modules/hr/attendance.prisma` | DOC | Low | None |
| 5A | `prisma/modules/scheduling/core.prisma` | DOC | Low | None |
| 5A | `server/src/services/hrAttendanceService.ts` | DOC | Low | None |
| 5A | `web/src/api/scheduling.ts` | MODIFY | Low | None |
| 5A | `web/src/hooks/useScheduling.ts` | MODIFY | Low | Manual |
| 5A | `web/src/components/scheduling/SchedulingAdminContent.tsx` | MODIFY | Low | Manual |
| 5A | `prisma/modules/hr/attendance.prisma` | MIGRATE | High | Extend |
| 5A | `prisma/schema.prisma` | MIGRATE | High | Extend |
| 5A | `prisma/modules/business/business.prisma` | MODIFY | Medium | Extend |
| 5A | `server/src/services/__tests__/co08-template-naming.contract.test.ts` | TEST | Low | New suite |

**Note:** Rows with `MIGRATE` are **Tier B optional** per blueprint; default 5A is DOC + MODIFY only.

---

## Package 5B — G09: Scheduling manager API completion

### Server — controllers

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5B | `server/src/controllers/scheduling/schedulingTeamController.ts` | MODIFY | High | New suite |
| 5B | `server/src/controllers/scheduling/schedulingAdminController.ts` | MODIFY | High | New suite |
| 5B | `server/src/controllers/scheduling/schedulingShared.ts` | MODIFY | Medium | Extend |

### Server — services (emit / bridge)

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5B | `server/src/services/schedulingNotificationService.ts` | MODIFY | Medium | Extend |
| 5B | `server/src/services/schedulingActivityService.ts` | MODIFY | Medium | Extend |
| 5B | `server/src/services/hrScheduleService.ts` | MODIFY | Medium | Extend |
| 5B | `server/src/auth/policyActions.ts` | MODIFY | Medium | Extend |
| 5B | `server/src/auth/schedulingPolicyDual.ts` | MODIFY | Low | Extend |

### Server — routes

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5B | `server/src/routes/scheduling.ts` | MODIFY | Medium | Integration |

### Web

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5B | `web/src/api/scheduling.ts` | MODIFY | Medium | Manual |
| 5B | `web/src/hooks/useScheduling.ts` | MODIFY | Medium | Manual |
| 5B | `web/src/components/scheduling/ScheduleBuilderVisual.tsx` | MODIFY | Medium | Manual |
| 5B | `web/src/components/scheduling/AvailabilityManagement.tsx` | MODIFY | Medium | Manual |

### Tests

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5B | `server/src/controllers/scheduling/__tests__/schedulingTeamController.g09.test.ts` | TEST | High | New suite |
| 5B | `server/src/controllers/scheduling/__tests__/schedulingAdminController.templates.test.ts` | TEST | High | New suite |
| 5B | `server/src/routes/__tests__/scheduling-tenant-scope.integration.test.ts` | TEST | Medium | Extend |
| 5B | `server/src/services/__tests__/schedulingNotificationService.test.ts` | TEST | Medium | Extend |
| 5B | `server/src/services/__tests__/hrScheduleService.contract.test.ts` | TEST | Medium | Extend |

---

## Package 5C — CO-10 / G10: Scheduling service extraction

### Server — new services

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5C | `server/src/services/schedulingTemplateService.ts` | CREATE | High | New suite |
| 5C | `server/src/services/schedulingAvailabilityService.ts` | CREATE | High | New suite |
| 5C | `server/src/services/schedulingSwapService.ts` | CREATE | High | New suite |
| 5C | `server/src/services/schedulingShiftService.ts` | CREATE | High | New suite |
| 5C | `server/src/services/schedulingScheduleService.ts` | CREATE | High | New suite |

### Server — thin controllers

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5C | `server/src/controllers/scheduling/schedulingAdminController.ts` | MODIFY | High | Extend |
| 5C | `server/src/controllers/scheduling/schedulingTeamController.ts` | MODIFY | High | Extend |
| 5C | `server/src/controllers/scheduling/schedulingEmployeeController.ts` | MODIFY | Medium | Extend |
| 5C | `server/src/controllers/scheduling/schedulingAdminToolsController.ts` | MODIFY | Medium | Extend |
| 5C | `server/src/controllers/scheduling/schedulingDashboardController.ts` | MODIFY | Low | Extend |
| 5C | `server/src/controllers/scheduling/schedulingAiContextController.ts` | MODIFY | Low | Extend |

### Tests

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5C | `server/src/services/__tests__/schedulingTemplateService.test.ts` | TEST | High | New suite |
| 5C | `server/src/services/__tests__/schedulingAvailabilityService.test.ts` | TEST | High | New suite |
| 5C | `server/src/services/__tests__/schedulingSwapService.test.ts` | TEST | High | New suite |
| 5C | `server/src/services/__tests__/schedulingShiftService.test.ts` | TEST | High | New suite |
| 5C | `server/src/services/__tests__/schedulingScheduleService.test.ts` | TEST | High | New suite |
| 5C | `server/src/services/__tests__/schedulingActivityService.test.ts` | TEST | Medium | Extend |
| 5C | `server/src/routes/__tests__/scheduling-tenant-scope.integration.test.ts` | TEST | Medium | Extend |

---

## Package 5D — CO-09 / G13: Scheduling V-Link integration

### Prisma / platform

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5D | `prisma/modules/platform/vlink.prisma` | MIGRATE | Medium | New suite |
| 5D | `prisma/schema.prisma` | MIGRATE | Medium | New suite |
| 5D | `server/src/platform/platformEntityRegistry.ts` | MODIFY | Medium | New suite |
| 5D | `server/src/startup/registerPlatformEntities.ts` | MODIFY | Low | Extend |

### Server — V-Link services

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5D | `server/src/services/schedulingVlinkAccessService.ts` | CREATE | High | New suite |
| 5D | `server/src/services/schedulingVlinkLifecycleService.ts` | CREATE | High | New suite |
| 5D | `server/src/services/vlinkEntityResolverService.ts` | MODIFY | High | New suite |
| 5D | `server/src/services/schedulingTrashService.ts` | MODIFY | Medium | Extend |

### Startup / manifest

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5D | `server/src/startup/builtInModuleManifests.ts` | MODIFY | Medium | New suite |
| 5D | `server/src/startup/registerBuiltInModules.ts` | MODIFY | Low | Extend |

### Tests

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 5D | `server/src/services/__tests__/schedulingVlinkAccessService.test.ts` | TEST | High | New suite |
| 5D | `server/src/services/__tests__/schedulingVlinkLifecycleService.test.ts` | TEST | High | New suite |
| 5D | `server/src/services/__tests__/vlinkEntityResolverService.scheduling.test.ts` | TEST | High | New suite |
| 5D | `server/src/platform/__tests__/platformEntityRegistry.scheduling.test.ts` | TEST | Medium | New suite |
| 5D | `server/src/startup/__tests__/builtInModuleManifests.scheduling.test.ts` | TEST | Low | New suite |

---

## Package 6A — CO-10 / G11: HR controller decomposition

### Server — new services

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 6A | `server/src/services/hrEmployeeService.ts` | CREATE | High | New suite |
| 6A | `server/src/services/hrPtoService.ts` | CREATE | High | New suite |
| 6A | `server/src/services/hrSettingsService.ts` | CREATE | Medium | New suite |

### Server — thin controller + existing services

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 6A | `server/src/controllers/hrController.ts` | MODIFY | High | Extend |
| 6A | `server/src/services/hrAttendanceService.ts` | MODIFY | Medium | Extend |
| 6A | `server/src/services/hrOnboardingService.ts` | MODIFY | Low | Extend |
| 6A | `server/src/services/hrTrashService.ts` | MODIFY | Low | Extend |
| 6A | `server/src/routes/hr.ts` | MODIFY | Medium | Integration |

### Tests

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 6A | `server/src/services/__tests__/hrEmployeeService.test.ts` | TEST | High | New suite |
| 6A | `server/src/services/__tests__/hrPtoService.test.ts` | TEST | High | New suite |
| 6A | `server/src/services/__tests__/hrSettingsService.test.ts` | TEST | Medium | New suite |
| 6A | `server/src/controllers/__tests__/hrController.import.test.ts` | TEST | High | Extend |
| 6A | `server/src/services/__tests__/hrTrashService.test.ts` | TEST | Medium | Extend |

---

## Package 6B — G12 remainder: HR notification cleanup + API consolidation

### Web — API client

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 6B | `web/src/api/hr.ts` | CREATE | Medium | Manual |
| 6B | `web/src/api/hrOnboarding.ts` | MODIFY | Low | Manual |
| 6B | `web/src/api/hrAnalytics.ts` | MODIFY | Low | Manual |
| 6B | `web/src/api/notifications.ts` | MODIFY | Low | None |

### Web — page migration (inline fetch → client)

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 6B | `web/src/app/business/[id]/admin/hr/employees/page.tsx` | MODIFY | Medium | Manual |
| 6B | `web/src/app/business/[id]/workspace/hr/me/page.tsx` | MODIFY | Medium | Manual |
| 6B | `web/src/app/business/[id]/workspace/hr/team/page.tsx` | MODIFY | Medium | Manual |
| 6B | `web/src/app/notifications/page.tsx` | MODIFY | Low | Manual |

### Server — manifest / notifications

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 6B | `server/src/startup/builtInModuleManifests.ts` | MODIFY | Low | New suite |
| 6B | `server/src/services/notificationGroupingService.ts` | MODIFY | Low | Extend |

### Tests

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 6B | `server/src/services/__tests__/hrNotificationCompleteness.test.ts` | TEST | Medium | Extend |
| 6B | `server/src/startup/__tests__/builtInModuleManifests.hr.test.ts` | TEST | Low | New suite |

---

## Package 6C — CO-09 / G13: HR V-Link integration

### Prisma / platform

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 6C | `prisma/modules/platform/vlink.prisma` | MIGRATE | Medium | Extend |
| 6C | `server/src/platform/platformEntityRegistry.ts` | MODIFY | Medium | New suite |
| 6C | `server/src/startup/registerPlatformEntities.ts` | MODIFY | Low | Extend |

### Server — V-Link services

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 6C | `server/src/services/hrVlinkAccessService.ts` | CREATE | High | New suite |
| 6C | `server/src/services/hrVlinkLifecycleService.ts` | CREATE | High | New suite |
| 6C | `server/src/services/vlinkEntityResolverService.ts` | MODIFY | High | New suite |
| 6C | `server/src/services/hrTrashService.ts` | MODIFY | Medium | Extend |

### Startup / manifest

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 6C | `server/src/startup/builtInModuleManifests.ts` | MODIFY | Medium | Extend |
| 6C | `server/src/startup/registerBuiltInModules.ts` | MODIFY | Low | Extend |

### Tests

| Package | File | Change Type | Risk | Test Impact |
|---------|------|-------------|------|-------------|
| 6C | `server/src/services/__tests__/hrVlinkAccessService.test.ts` | TEST | High | New suite |
| 6C | `server/src/services/__tests__/hrVlinkLifecycleService.test.ts` | TEST | High | New suite |
| 6C | `server/src/services/__tests__/vlinkEntityResolverService.hr.test.ts` | TEST | High | New suite |
| 6C | `server/src/platform/__tests__/platformEntityRegistry.hr.test.ts` | TEST | Medium | New suite |

---

## Row summary by package

| Package | Rows | CREATE | MODIFY | MIGRATE | TEST | DOC |
|---------|------|--------|--------|---------|------|-----|
| 5A | 13 | 1 | 3 | 3 | 1 | 5 |
| 5B | 16 | 0 | 11 | 0 | 5 | 0 |
| 5C | 18 | 5 | 6 | 0 | 7 | 0 |
| 5D | 14 | 2 | 7 | 2 | 5 | 0 |
| 6A | 12 | 3 | 5 | 0 | 5 | 0 |
| 6B | 11 | 1 | 8 | 0 | 2 | 0 |
| 6C | 12 | 2 | 6 | 1 | 4 | 0 |
| **Total** | **68** | **14** | **46** | **6** | **29** | **5** |

---

## Cross-package shared files

These files appear in multiple packages — implement in dependency order:

| File | Packages | Order |
|------|----------|-------|
| `server/src/controllers/scheduling/schedulingAdminController.ts` | 5B → 5C | Implement G09 first; then thin |
| `server/src/controllers/scheduling/schedulingTeamController.ts` | 5B → 5C | Same |
| `server/src/services/vlinkEntityResolverService.ts` | 5D, 6C | Can merge in one PR or sequential |
| `prisma/modules/platform/vlink.prisma` | 5D, 6C | Single migration for all new enum values |
| `server/src/startup/builtInModuleManifests.ts` | 5D, 6B, 6C | Scheduling entities first; HR entities + notif reconciliation |
| `server/src/platform/platformEntityRegistry.ts` | 5D, 6C | Add `registerSchedulingPlatformEntities` + `registerHRPlatformEntities` |

---

## Certification statement

**No certification awarded.** File target matrix only — no code or schema changes in this program.
