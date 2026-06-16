# HR Architecture Audit

**Module id:** `hr`  
**Phase:** Business Operations Phase 0B — Discovery only  
**Status:** Reality assessment (not certified)  
**Last updated:** 2026-06-14  
**References:** Drive L4, Chat L3, Calendar L3 — comparison only  
**Related:** [HR_OPERATION_MATRIX.md](./HR_OPERATION_MATRIX.md), [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md)

---

## Executive summary

HR is a **partially implemented standalone module** with real persistence for employee HR profiles, PTO, attendance, onboarding, analytics, and AI — built on org-chart `EmployeePosition`. It **does not meet** reference patterns for service boundaries, Policy Engine, normalized activity, Global Trash, or V_Link. Notifications are **partially implemented** (8 types sent; manifest gaps).

**Overall:** Functional HR framework with **constitutional debt** and **monolithic controller** risk.

---

## Status legend

| Status | Meaning |
|--------|---------|
| **PASS** | Meets reference pattern |
| **PASS WITH FINDINGS** | Largely present; documented gaps |
| **FAIL** | Material gap |
| **NOT PRESENT** | No implementation |
| **UNKNOWN** | Insufficient evidence |

---

## Dimension audit

| Dimension | Status | Findings | Evidence |
|-----------|--------|----------|----------|
| **Models** | PASS WITH FINDINGS | 3 prisma files; `EmployeeHRProfile` extends `EmployeePosition`; `deletedAt` not Global Trash; enterprise models absent; `ManagerApprovalHierarchy` unused | `prisma/modules/hr/` |
| **Controllers** | FAIL | Monolithic `hrController.ts` (~50 handlers, ~77 `prisma.` calls); `hrAIContextController` separate | `server/src/controllers/hrController.ts` |
| **Routes** | PASS WITH FINDINGS | ~45 routed endpoints; enterprise stubs return 200 JSON; route comments mislabel some implemented paths as "stub" | `server/src/routes/hr.ts` |
| **Services** | PASS WITH FINDINGS | 5 HR services; attendance shift template methods unrouted | `server/src/services/hr*.ts` |
| **API clients** | FAIL | No general `web/src/api/hr.ts`; inline `fetch` in pages | `hrOnboarding.ts`, `hrAnalytics.ts` only |
| **Frontend** | PASS WITH FINDINGS | 25 components; `HRLayout` hub; some "Coming Soon" views | `web/src/components/hr/` |
| **Permissions / RBAC** | PASS WITH FINDINGS | `hrPermissions.ts`: admin (ADMIN/MANAGER), manager (direct reports), employee; `hr:admin` org permission TODO | `server/src/middleware/hrPermissions.ts` |
| **Policy Engine** | NOT PRESENT | Custom middleware + tier gating only | Grep: no PE in HR |
| **Events / domain events** | NOT PRESENT | No domain event emissions | |
| **Realtime** | NOT PRESENT | No HR-specific socket layer | |
| **Notifications** | PASS WITH FINDINGS | 8 types sent via `NotificationService`; seed manifest lacks `notifications` block; grouping map incomplete; 3 attendance types documented not sent | `hrController`, `hrOnboardingService`, `hrAttendanceService` |
| **V_Link** | NOT PRESENT | `V_LINK.md` — hr not integrated | |
| **Trash / lifecycle** | FAIL | `EmployeeHRProfile.deletedAt` soft delete; onboarding template `archivedAt`; not Global Trash | No `trashedAt`; not in `trashController` |
| **Activity / audit** | NOT PRESENT | `prisma.auditLog` for employee CRUD only — not `emitModuleActivityEvent` | Platform matrix: hr globalActivity ❌ |
| **AI** | PASS WITH FINDINGS | 3 providers; 4 actions in `ActionExecutor` (time-off, clock in/out) | `registerBuiltInModules.ts`, `hrAIActionService.ts` |
| **Analytics** | PASS WITH FINDINGS | `hrAnalyticsService` + 3 admin routes + dashboards | `hrAnalyticsService.ts` |
| **Tests** | FAIL | No dedicated HR route/controller tests | Only tangential AI health check mock |
| **Documentation** | PASS WITH FINDINGS | `hrProductContext.md` overstates; `prisma/modules/hr/README.md` partially stale | |

---

## Platform capability matrix (HR row)

Per [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §19:

| Capability | Standard | HR reality | Status |
|------------|----------|------------|--------|
| ai | Expected | 3 providers + 4 actions | PASS WITH FINDINGS |
| vlink | Expected | Not integrated | NOT PRESENT |
| trash | Global Trash | `deletedAt` soft delete | FAIL |
| realtime | Scoped | None evidenced | NOT PRESENT |
| notifications | Manifest + emitters | 8 types sent; manifest gap | PASS WITH FINDINGS |
| businessWorkspace | Hub | `HRLayout` switch-mounted | PASS |
| globalActivity | Normalized activity | None | NOT PRESENT |

---

## Reference pattern comparison

### vs Drive (L4)

| Pattern | HR delta |
|---------|----------|
| Canonical services | Monolithic controller + mixed service usage — **FAIL** |
| Policy Engine | **NOT PRESENT** |
| Global Trash | **FAIL** |
| Module activity | **NOT PRESENT** |
| V_Link | **NOT PRESENT** |

### vs Chat (L3)

| Pattern | HR delta |
|---------|----------|
| Service extraction | Single mega-controller — **FAIL** |
| Notification metadata in manifest | Missing in seed — **FAIL** |
| Activity + realtime | Neither — **NOT PRESENT** |

### vs Calendar (L3)

| Pattern | HR delta |
|---------|----------|
| Dedicated domain services | Partial (`hrAttendanceService` etc.) — **PASS WITH FINDINGS** |
| Calendar bridge | `hrScheduleService` in HR package, scheduling callers — **Shared** |

### vs Business Workspace (WS-L1)

| Pattern | HR | Status |
|---------|-----|--------|
| Hub switch | `case 'hr': HRLayout` | PASS |
| Registry | `businessWorkspaceContracts.ts` | PASS |
| `HRWorkspaceLanding` naming | Uses `HRLayout` | PASS WITH FINDINGS |

---

## Module interoperability checklist

| Item | Status |
|------|--------|
| Permission blocks in manifest | PASS WITH FINDINGS |
| Tenant scoping | PASS WITH FINDINGS — `businessId` on models |
| Activity events | FAIL |
| Realtime scope | NOT PRESENT |
| Notification metadata | FAIL — seed gap |
| AI context providers | PASS |
| Activity vs analytics separation | FAIL — analytics exist; no activity layer |

---

## Stub inventory

| Surface | Pattern | Impact |
|---------|---------|--------|
| Enterprise dashboards | 200 JSON | Misleading API maturity |
| `PUT /admin/settings` | Stub in controller | Settings not persisted |
| `PUT /me` | Stub | Self-service profile update blocked |
| `GET /me/pay-stubs` | 200 JSON stub | |
| Attendance shift templates | Service only | No REST surface |
| `ManagerApprovalHierarchy` | Schema only | Approval routing uses org chart |

---

## Confirmed facts vs recommendations

### Confirmed facts

- HR is registered built-in module extending org-chart identity.
- Core workflows (employees, PTO, attendance, onboarding) persist to Prisma.
- Constitutional gaps match platform standards documentation.
- `hrScheduleService` is shared calendar bridge (Phase 0A).

### Recommendations (discovery only)

- Decompose `hrController.ts` before certification pursuit.
- Align notification manifest with emitted types.
- Resolve org-chart write-path duplication before feature expansion.

---

## Evidence index

See [HR_OPERATION_MATRIX.md](./HR_OPERATION_MATRIX.md) § Evidence table.
