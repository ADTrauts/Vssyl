# HR Constitutional Compliance Assessment

**Program:** Business Operations Stage 2 Closeout  
**Module:** HR (`hr`)  
**Assessment date:** 2026-06-16  
**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md), [memory-bank/moduleSpecs.md](../../memory-bank/moduleSpecs.md)

---

## Assessment scope

Repository verification of HR against the constitutional module contract, Stage 1 identity rules (CO-05), org-chart lifecycle symmetry, and File Hub reference patterns.

**Reference modules:** File Hub (Level 4), Chat (Level 3), Calendar (Level 3).

---

## Constitutional checklist

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | **Runtime Kernel extension** | **PASS** | Uses platform NotificationService, activity emitter, Global Trash, V-Link — no parallel stacks |
| 2 | **Order of operations** | **PASS** | Services emit activity/notifications after successful mutations; trash does not emit on forbidden paths |
| 3 | **Tenant scoping** — `businessId` + position context | **PASS** | `hrEmployeeService`, `hrPtoService`, `hrTrashService`, `hrVlinkAccessService` scope by `businessId` |
| 4 | **Thin controller** | **PARTIAL** | 0 Prisma in `hrController.ts` (2,242 LOC); validation/orchestration still heavy; `hrAIContextController` has 15 Prisma calls |
| 5 | **Canonical domain services** | **PASS** | `hrEmployeeService`, `hrPtoService`, `hrSettingsService`, `hrAnalyticsSupportService`, extended `hrAttendanceService`, `hrOnboardingService` |
| 6 | **Policy Engine dual enforcement** | **PARTIAL** | `hrPolicyDual.ts`; ~25/59 routes use `checkHRPolicy` (~42%); analytics, me reads, AI routes largely legacy-only |
| 7 | **Normalized module activity** | **PASS** | `hrActivityService` — 14 `record*` exports; `businessOperationsActivity.contract.test.ts` |
| 8 | **Notification manifest + emitters** | **PASS** | 12 `hr_*` types in manifest; PTO/onboarding/attendance services emit; `hrNotificationCompleteness.test.ts` |
| 9 | **Global Trash** | **PASS** (scoped) | `hrTrashService` — `employee_profile` only; handler in `registerGlobalTrashHandlers`; `trashedAt` migration |
| 10 | **V_Link registration** | **PASS** | 4 entities; `hrVlinkAccessService` + lifecycle; resolver; manifest; purge unlink tested |
| 11 | **Org-chart identity / lifecycle symmetry** | **PASS** | Import → `employeeManagementService.importEmployeesFromCSV`; terminate/delete → `deactivateEmployeePositionById` / `softTrashEmployeeProfile` |
| 12 | **AI context providers** | **PASS** | 3 providers in `hrAIContextController`; registered in `registerBuiltInModules.ts` |
| 13 | **AI controller decomposition** | **FAIL** | `hrAIContextController` retains direct Prisma (deferred from 6A) |
| 14 | **Business workspace hub** | **PASS** | `BusinessWorkspaceContent.tsx` case `hr`; `HRLayout` / team / me routes |
| 15 | **Manifest capability truthfulness** | **PASS** | `vlink: true`, `trash: true`, `notifications: true` post-6C |
| 16 | **Tests evidence** | **PASS** | ~80 HR-focused cases across 21 files |
| 17 | **Search / indexing** | **DEFERRED** | `supportsSearch: false` for all HR entities |
| 18 | **Audit trail** | **PARTIAL** | `logEmployeeAudit` in `hrServiceShared` for employee create/update/terminate — not full module audit |
| 19 | **hrScheduleService bridge (CO-07)** | **PASS** | `hrScheduleService.contract.test.ts` (6 cases); PTO sync in `hrPtoService` |
| 20 | **6B API consolidation** | **FAIL** | `web/src/api/hr.ts` missing; inline `fetch` in HR pages |

---

## Package-specific compliance

### 6A — CO-10 / G11

| Criterion | Status |
|-----------|--------|
| `hrController.ts` Prisma = 0 | **PASS** — verified; delegation test |
| Domain services extracted | **PASS** — 7+ files |
| Activity/notifications preserved | **PASS** |
| Policy Dual preserved | **PASS** — in services + partial routes |
| Trash/org-chart preserved | **PASS** |
| `hrControllerUtils` wired | **FAIL** — `mapHrServiceError` unused |
| Settings stubs | **ACKNOWLEDGED** — framework placeholders |

### 6C — CO-09 / G13

| Criterion | Status |
|-----------|--------|
| 4 HR V-Link entities registered | **PASS** |
| Access respects ownership + PE | **PASS** — org-chart scope + `hrPolicyDual` |
| Trashed profile fail-closed | **PASS** — `hrVlinkAccessService.test.ts` |
| Permanent delete unlinks V-Links | **PASS** — `hrTrashService` + test |
| Migration | **PASS** — `20260616000000_hr_vlink_entity_types` |

### 6B — G12 (not executed)

| Criterion | Status |
|-----------|--------|
| `web/src/api/hr.ts` | **NOT DONE** |
| Page migration off inline fetch | **NOT DONE** |
| Notification manifest hygiene | **PASS** — server-side complete |

---

## Identity trust inheritance (CO-05)

| Path | Implementation | Test |
|------|----------------|------|
| CSV import | `hrEmployeeService` → `employeeManagementService.importEmployeesFromCSV` | `hrController.import.test.ts`, `hrEmployeeService.test.ts` |
| Terminate | `deactivateEmployeePositionById` | `hrEmployeeService.test.ts` |
| Delete (soft trash) | `softTrashEmployeeProfile` + position vacate | `hrTrashService.test.ts`, import symmetry test |
| V-Link employee profile | Resolves via `employeePosition` ownership | `hrVlinkAccessService.test.ts` |

---

## Reference module comparison

| Pattern (File Hub) | HR status |
|--------------------|-----------|
| Domain `*Service.ts` layer | **Aligned** |
| Controller Prisma-free | **Aligned** (main controller); AI controller exception |
| `*VlinkAccessService` + lifecycle | **Aligned** |
| `*TrashService` + handler | **Aligned** (single entity type) |
| Notification adapter pattern | **Aligned** — inline in domain services |
| `*PolicyDual.ts` | **Aligned** — incomplete route coverage |
| Consolidated web API | **Behind** — 6B not done; Chat/Calendar have dedicated clients |

---

## Route protection summary

**File:** `server/src/routes/hr.ts`

- Global: `authenticateJWT`, `checkBusinessAdvancedOrHigher`, `checkHRModuleInstalled`
- Tier: `checkHRAdmin`, `checkManagerAccess`, `checkEmployeeAccess`
- Policy: `checkHRPolicy` on ~42% of handlers
- **Gap:** `/admin/analytics/*`, `/team/*` reads, `/me/*` reads, `/ai/*` lack consistent PE middleware

---

## Overall constitutional verdict

| Verdict | **SUBSTANTIALLY COMPLIANT — WITH DOCUMENTED GAPS** |
|---------|-----------------------------------------------------|

HR meets Stage 2 intent for service decomposition, activity, notifications, trash (employee profile), V-Link, and org-chart lifecycle symmetry. Gaps are **6B web consolidation**, **partial Policy Dual**, **AI controller Prisma**, and **controller size** — not absent platform foundations.

**Not ready for unconditional certification.** Suitable for **formal certification review** with expected P1 findings.

---

## Related documents

- [HR_CERTIFICATION_READINESS.md](./HR_CERTIFICATION_READINESS.md)
- [STAGE_2_GAP_REGISTER.md](./STAGE_2_GAP_REGISTER.md)
- [BUSINESS_OPERATIONS_PLATFORM_ADOPTION_REPORT.md](./BUSINESS_OPERATIONS_PLATFORM_ADOPTION_REPORT.md)
