# Scheduling Constitutional Compliance Assessment

**Program:** Business Operations Stage 2 Closeout  
**Module:** Scheduling (`scheduling`)  
**Assessment date:** 2026-06-16  
**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md), [memory-bank/moduleSpecs.md](../../memory-bank/moduleSpecs.md)

---

## Assessment scope

Repository verification of Scheduling against the constitutional module contract: `authorize → execute → emit normalized activity → notify/realtime` (as applicable), tenant scoping, service boundaries, platform registration, and File Hub reference patterns.

**Reference modules:** File Hub (Level 4), Chat (Level 3), Calendar (Level 3).

---

## Constitutional checklist

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | **Runtime Kernel extension** — module does not replace platform systems | **PASS** | Uses `NotificationService`, `emitModuleActivityEvent`, Global Trash handlers, V-Link resolver — no parallel notification or trash stacks |
| 2 | **Order of operations** — no activity/notification on failed/unauthorized actions | **PASS** | `schedulingManagerService.g09.test.ts` asserts emit after successful assign/publish; services gate before emit |
| 3 | **Tenant scoping** — `businessId` on all persisted paths | **PASS** | `schedulingScheduleService`, `schedulingShiftService`, `schedulingTrashService` scope by `businessId`; `scheduling-tenant-scope.integration.test.ts` (3 cases) |
| 4 | **Thin controllers (primary surfaces)** | **PARTIAL** | Admin/employee/team controllers: 0 Prisma; `schedulingAdminToolsController` (32), `schedulingAiContextController` (16), `schedulingDashboardController` (3) retain Prisma |
| 5 | **Canonical services for mutations** | **PASS** | `schedulingScheduleService`, `schedulingShiftService`, `schedulingTemplateService`, `schedulingAvailabilityService`, `schedulingSwapService`, `schedulingPublishService` |
| 6 | **Policy Engine dual enforcement** | **PARTIAL** | `schedulingPolicyDual.ts`; `checkSchedulingPolicy` on high-risk writes; gaps on some admin reads/writes (availability admin, template list, swap list) |
| 7 | **Normalized module activity** | **PASS** | `schedulingActivityService.ts` — 20 `record*` functions; `businessOperationsActivity.contract.test.ts` |
| 8 | **Notification manifest + emitters** | **PASS** | 6 types in `builtInModuleManifests.ts`; `schedulingNotificationService.ts`; grouping test |
| 9 | **Global Trash** | **PASS** | `schedulingTrashService.ts`; `registerGlobalTrashHandlers` scheduling block; `trashedAt` migration; V-Link unlink on permanent delete |
| 10 | **V_Link registration** | **PASS** | `registerSchedulingPlatformEntities()`; `schedulingVlinkAccessService` + lifecycle; resolver cases; manifest `entities[]` |
| 11 | **AI context providers** | **PASS** | 3 providers in `schedulingAiContextController`; manifest `ai: true`; routes `/ai/context/*` |
| 12 | **AI writes via executors** | **PASS** | `schedulingAIActionService`; governed action routes |
| 13 | **Business workspace hub** | **PASS** | `BusinessWorkspaceContent.tsx` case `scheduling`; `SchedulingLayout` / admin content |
| 14 | **Manifest capability truthfulness** | **PASS** | `vlink: true`, `trash: true`, `globalActivity: true`, `notifications: true` match implementation |
| 15 | **Tests evidence** | **PARTIAL** | ~74 cases; service-layer G09 tests; missing `schedulingTeamController.g09.test.ts` per matrix |
| 16 | **Search / indexing** | **DEFERRED** | All entities `supportsSearch: false` — blueprint Phase 1 scope |
| 17 | **Audit trail** | **NOT IMPLEMENTED** | No scheduling-specific audit service (not Stage 2 scope) |

---

## Package-specific compliance

### 5A — CO-08 / G08

| Criterion | Status |
|-----------|--------|
| Three template concepts documented | **PASS** — `SHIFT_TEMPLATE_DOMAIN_DECISION.md` |
| Blueprint filename | **FAIL** — `CO08_SHIFT_TEMPLATE_DECISION.md` not found |
| UX disambiguation | **PASS** — `workforceTemplateTerminology.ts`, `SchedulingAdminContent.tsx` |
| No cross-module schema merge | **PASS** |
| Prisma model comments (Tier A) | **FAIL** — not added to model blocks |

### 5B — G09

| Criterion | Status |
|-----------|--------|
| Manager 501 stubs removed | **PASS** |
| Template CRUD | **PASS** — `schedulingTemplateService` |
| Publish / assign / availability | **PASS** |
| Activity + notification on G09 flows | **PASS** — tested |
| G18 analytics 501 | **OUT OF SCOPE** — remains in `schedulingAdminController` |

### 5C — CO-10 / G10

| Criterion | Status |
|-----------|--------|
| Target controllers Prisma-free | **PASS** — 0/0/0 |
| Domain services created | **PASS** — 9 service files |
| Full controller tree Prisma-free | **FAIL** — 51 deferred calls |
| Extraction tests | **PASS** — `schedulingServiceExtraction.5c.test.ts` (10 cases) |

### 5D — CO-09 / G13

| Criterion | Status |
|-----------|--------|
| Platform entity registry | **PASS** — schedule, shift, swap_request |
| Access service + policy | **PASS** — membership + legacy read + `schedulingPolicyDual` |
| Lifecycle on permanent delete | **PASS** |
| Trashed fail-closed | **PASS** — tested |
| Migration | **PASS** — `20260614000000_scheduling_vlink_entity_types` |

---

## Reference module comparison

| Pattern (File Hub) | Scheduling status |
|--------------------|-------------------|
| `*Service.ts` domain layer | **Aligned** — scheduling*Service family |
| Thin controllers | **Partial** — primary yes; tools/AI/dashboard no |
| `*VlinkAccessService` + lifecycle | **Aligned** |
| `*TrashService` + handler registration | **Aligned** |
| `*NotificationService` adapter | **Aligned** |
| `*PolicyDual.ts` | **Aligned** — coverage incomplete |
| Manifest `entities[]` | **Aligned** |
| Consolidated web API client | **N/A** — scheduling uses `web/src/api/scheduling.ts` (exists) |

---

## Route protection summary

**File:** `server/src/routes/scheduling.ts`

- Global: `authenticateJWT`, `checkSchedulingModuleInstalled`
- Role: `checkSchedulingAdmin`, `checkSchedulingManagerAccess`, `checkSchedulingEmployeeAccess`, `checkSchedulingSelfAccess`
- Policy: `checkSchedulingPolicy` on schedule/shift/template/publish/assign/swap writes
- **Gap:** Some admin list/update routes rely on legacy role middleware only

---

## Overall constitutional verdict

| Verdict | **SUBSTANTIALLY COMPLIANT — WITH DOCUMENTED GAPS** |
|---------|-----------------------------------------------------|

Scheduling meets Stage 2 constitutional intent for activity, notifications, trash, V-Link, tenant isolation, and primary service extraction. Gaps are **partial PE coverage**, **deferred controller Prisma**, and **doc/process hygiene (5A)** — not missing platform adoption.

**Not ready for unconditional certification.** Suitable for **formal certification review** with expected P1 findings.

---

## Related documents

- [SCHEDULING_CERTIFICATION_READINESS.md](./SCHEDULING_CERTIFICATION_READINESS.md)
- [STAGE_2_GAP_REGISTER.md](./STAGE_2_GAP_REGISTER.md)
- [BUSINESS_OPERATIONS_PLATFORM_ADOPTION_REPORT.md](./BUSINESS_OPERATIONS_PLATFORM_ADOPTION_REPORT.md)
