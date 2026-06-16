# Scheduling Architecture Audit

**Module id:** `scheduling`  
**Phase:** Business Operations Phase 0A — Discovery only  
**Status:** Reality assessment (not certified)  
**Last updated:** 2026-06-14  
**References:** Drive (File Hub L4), Chat (L3), Calendar (L3) — comparison only, no certification awarded  
**Related:** [SCHEDULING_OPERATION_MATRIX.md](./SCHEDULING_OPERATION_MATRIX.md), [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md)

---

## Executive summary

Scheduling is a **substantial standalone module** with complete Prisma models, broad REST API, rich React UI, AI context/actions, and WebSocket realtime. It **does not meet** Drive/Chat/Calendar reference patterns for service boundaries, Policy Engine, normalized activity, notifications, Global Trash, V_Link, or thin controllers.

**Overall architectural posture:** Functional product module with **significant constitutional debt** relative to platform standards.

---

## Status legend

| Status | Meaning |
|--------|---------|
| **PASS** | Meets reference pattern for this dimension |
| **PASS WITH FINDINGS** | Largely present; documented gaps or partial compliance |
| **FAIL** | Material gap vs reference or platform contract |
| **NOT PRESENT** | No implementation found |
| **UNKNOWN** | Insufficient evidence to assess |

---

## Dimension audit

| Dimension | Status | Findings | Evidence |
|-----------|--------|----------|----------|
| **Models** | PASS WITH FINDINGS | 7 scheduling models + enums; tenant-scoped via `businessId`; no `trashedAt`; `ARCHIVED` status only | `prisma/modules/scheduling/core.prisma` |
| **Controllers** | FAIL | ~144 direct `prisma.` calls across 6 controllers; mixed real impl + 501 stubs; no canonical `schedulingService` | `server/src/controllers/scheduling/*.ts` |
| **Routes** | PASS WITH FINDINGS | ~50 routed endpoints; analytics/clone unrouted; validation middleware present | `server/src/routes/scheduling.ts` |
| **Services** | FAIL | Only `schedulingAIActionService`, `schedulingPhilosophyService`, `schedulingRecommendationService`; no trash/notification/activity/visibility services | `server/src/services/scheduling*.ts` |
| **API clients** | PASS WITH FINDINGS | Comprehensive typed client (~1100 lines); uses `/api/scheduling` proxy paths | `web/src/api/scheduling.ts` |
| **Frontend pages/components** | PASS WITH FINDINGS | 18 components; hub `SchedulingLayout` (not `SchedulingWorkspaceLanding`); admin/me/team views | `web/src/components/scheduling/` |
| **Permissions / RBAC** | PASS WITH FINDINGS | Custom `schedulingPermissions.ts`: admin, manager (direct reports), employee, self | `server/src/middleware/schedulingPermissions.ts` |
| **Policy Engine** | NOT PRESENT | No scheduling actions in `policyEngine.ts`; routes use legacy middleware only | Grep: no scheduling in PE |
| **Events / domain events** | NOT PRESENT | No domain event emissions in scheduling code | Grep: no emit in scheduling controllers |
| **Realtime / sockets** | PASS WITH FINDINGS | `join_schedule` with membership check; shift CRUD + publish broadcasts | `server/src/services/chatSocketService.ts` |
| **Notifications** | NOT PRESENT | No `scheduling_*` types; no `NotificationService.createNotification` | Grep across `server/src` |
| **V_Link integration** | NOT PRESENT | Explicitly not integrated per platform doc | `docs/architecture/V_LINK.md` |
| **Trash / lifecycle** | FAIL | Hard delete; `ScheduleStatus.ARCHIVED`; no Global Trash handler; client-only `scheduleTrashed` event | `GlobalTrashBin.tsx`; no `trashedAt` on models |
| **Activity logging / audit** | NOT PRESENT | No `emitModuleActivityEvent` | Platform standards L514: scheduling activity ❌ |
| **AI access / action readiness** | PASS WITH FINDINGS | 3 context providers + 2 write actions registered; limited write surface vs manifest actions | `registerBuiltInModules.ts`, `ActionExecutor.ts` |
| **Analytics hooks** | FAIL | `getLaborCostAnalytics`, `getCoverageAnalytics`, `getComplianceReports` return 501; not routed | `schedulingAdminController.ts` L1998–2007 |
| **Tests** | FAIL | 1 integration test (tenant scope); no controller/unit/E2E for swaps, publish, availability | `scheduling-tenant-scope.integration.test.ts` |
| **Documentation** | PASS WITH FINDINGS | Strong `schedulingProductContext.md`; stale refs to `SchedulingWorkspaceLanding`; docs drift on integration TODO vs implemented publish sync | `memory-bank/schedulingProductContext.md` |

---

## Reference pattern comparison

### vs Drive (File Hub — L4 Reference)

| Pattern | Drive | Scheduling | Delta |
|---------|-------|------------|-------|
| Canonical service layer | `driveService`, trash, visibility | Inline Prisma in controllers | **FAIL** |
| Policy Engine | `drivePolicyDual` | Custom middleware | **NOT PRESENT** |
| Global Trash | `trashedAt` + handler | Hard delete | **FAIL** |
| Module activity | Normalized writes | None | **NOT PRESENT** |
| V_Link | Full resolver + lifecycle | Not integrated | **NOT PRESENT** |
| Notifications | Manifest + emitters | Icon bucket only | **NOT PRESENT** |
| Thin controllers | Zero Prisma target | ~144 Prisma calls | **FAIL** |

### vs Chat (L3 Reference)

| Pattern | Chat | Scheduling | Delta |
|---------|------|------------|-------|
| `chatPolicyDual` | Present | N/A custom RBAC | **NOT PRESENT** |
| Activity + realtime | Both | Realtime only | **PARTIAL** |
| Service extraction plan | Completed waves | No extraction plan | **FAIL** |
| Notification metadata | Manifest | Missing from seed manifest | **NOT PRESENT** |

### vs Calendar (L3 Reference)

| Pattern | Calendar | Scheduling | Delta |
|---------|----------|------------|-------|
| Event service ownership | `calendarEventService` | No `schedulingShiftService` | **FAIL** |
| Trash service | `calendarTrashService` | None | **NOT PRESENT** |
| Scheduler ownership | `calendarSchedulerService` | N/A (scheduling is not calendar) | — |
| V_Link access service | `calendarVlinkAccessService` | None | **NOT PRESENT** |
| ICS / recurrence | Service-owned | Calendar-owned for synced events | **Shared via hrScheduleService** |

### vs Business Workspace (WS-L1)

| Pattern | Requirement | Scheduling | Status |
|---------|-------------|------------|--------|
| Hub resolves module | `BusinessWorkspaceContent` switch | `case 'scheduling': SchedulingLayout` | **PASS** |
| Registry contract | `businessWorkspaceContracts.ts` | `segment-page`, switchMounted | **PASS** |
| Module icon/name | `moduleIcons.ts`, display names | `scheduling: CalendarIcon` | **PASS WITH FINDINGS** — uses Calendar icon |
| `[Module]WorkspaceLanding` naming | `module-development.mdc` convention | Uses `SchedulingLayout` not `SchedulingWorkspaceLanding` | **PASS WITH FINDINGS** — functional hub exists |

---

## Platform capability matrix (scheduling row)

Per [`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §19:

| Capability | Platform standard | Scheduling reality | Status |
|------------|-------------------|-------------------|--------|
| ai | Expected | 3 providers + 2 actions | PASS WITH FINDINGS |
| vlink | Expected for linked entities | Not integrated | NOT PRESENT |
| trash | `trashedAt` + Global Trash API | Hard delete; ARCHIVED enum | FAIL |
| realtime | Scoped broadcasts | `chatSocketService` with membership | PASS WITH FINDINGS |
| notifications | Manifest + emitters | None | NOT PRESENT |
| businessWorkspace | Hub integration | WS-L1 switch-mounted | PASS |
| globalActivity | Normalized activity | None | NOT PRESENT |

---

## Module interoperability checklist

Per [`memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md) (7 must-pass items):

| Item | Status | Notes |
|------|--------|-------|
| Permission blocks in manifest | PASS WITH FINDINGS | Seed manifest partial vs `registerBuiltInModules` |
| Tenant scoping | PASS WITH FINDINGS | `businessId` on queries; 1 integration test |
| Activity events on key actions | FAIL | Not emitted |
| Realtime scope / membership | PASS WITH FINDINGS | Schedule room join checks `businessMember` |
| Notification metadata | FAIL | Not in seed manifest |
| AI context providers | PASS | 3 providers registered |
| Activity vs analytics separation | FAIL | No activity layer |

---

## Stub inventory (architectural risk)

| Handler | HTTP | Impact |
|---------|------|--------|
| `publishTeamSchedule` | 501 | Manager cannot publish |
| `getOpenShiftsForTeam` | 501 | Manager open-shift management blocked |
| `assignEmployeeToShift` | 501 | Manager assignment blocked |
| `getTeamAvailability` | 501 | Manager availability view blocked |
| Shift template CRUD | 501 / empty list | Template reuse broken |
| `getAllShiftSwapRequests` | Empty stub | Admin swap inbox broken |
| `updateEmployeeAvailabilityAdmin` | 501 | Admin availability edit blocked |
| Analytics trio | 501, not routed | Server analytics absent |

---

## AI architecture

| Component | Status | Evidence |
|-----------|--------|----------|
| Context providers | PASS WITH FINDINGS | `scheduling_overview`, `coverage_status`, `scheduling_conflicts` |
| Write actions | PASS WITH FINDINGS | `generate_schedule`, `suggest_assignments` via `schedulingAIActionService` |
| Philosophy engine | PASS WITH FINDINGS | `schedulingPhilosophyService` — strategy/mode assignment |
| Autonomy level | PASS WITH FINDINGS | Platform `scheduling` autonomy field in AI models |
| HR AI separation | PASS | Time-off context under `/api/hr/ai/context/time-off` |

---

## Seeds and registration

| Artifact | Path | Notes |
|----------|------|-------|
| DB seed | `server/src/startup/seedSchedulingModule.ts` | Creates `Module` row on startup |
| Built-in registration | `server/src/startup/registerBuiltInModules.ts` | Full `aiContext` |
| Built-in IDs | `server/src/constants/builtInModuleIds.ts` | Includes `scheduling` |
| CLI seed | `scripts/ensure-builtin-modules.ts` | Duplicate registration risk (platform drift item) |

---

## Confirmed facts vs recommendations

### Confirmed facts

- Scheduling is a registered built-in module with isolated schema and API.
- Constitutional gaps (activity, notifications, PE, V_Link, trash) are documented in platform standards.
- Realtime exists with membership-proven schedule room join.
- Multiple manager and admin endpoints are stubs despite routed paths.

### Recommendations (discovery only)

- Any future modernization should prioritize service extraction and stub completion before certification pursuit.
- `hrScheduleService` ownership should be resolved in Workforce Domain Boundary Analysis (shared bridge).
- Do not pursue L3 certification until interoperability checklist gaps are in program scope.

---

## Evidence index

See [SCHEDULING_OPERATION_MATRIX.md](./SCHEDULING_OPERATION_MATRIX.md) § Evidence table.
