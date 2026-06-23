# ACT-R1 Remaining Consumers Report

**Program:** Platform Kernel — ACT-R1 Read Migration  
**Package:** PK-W3-IMP-3 closure inventory  
**Date:** 2026-06-23  
**Status:** P0 + P1 **complete**; P3+ items documented

---

## 1. Inventory summary (post IMP-3)

| Classification | Count | IDs |
|----------------|------:|-----|
| **Migrated** | 8 | C-01, C-02, C-03, C-04, C-05, C-06, C-07, C-08 |
| **Compliant (no migration required)** | 3 | C-09, C-10, C-11 |
| **Deferred (write / retirement)** | 1 | C-12 |
| **Exempt (non-kernel)** | 3+ | V-Link activity, AI conversation history engines, admin signup metrics |

*Note: C-01–C-03 migrated in PK-W3-IMP-1; C-04–C-08 in PK-W3-IMP-3.*

---

## 2. Migrated consumers

| ID | Consumer | Service operation | Package |
|----|----------|-------------------|---------|
| C-01 | `activityFeedController` | `getFeedForUser` | IMP-1 |
| C-02 | `analyticsCapabilityService` (personal) | `getRecentActivity` | IMP-1 |
| C-03 | `analyticsCapabilityService` (module) | `getModuleActivity` | IMP-1 |
| C-04 | `CrossModuleContextEngine` | `getFeedForUser` | IMP-3 |
| C-05 | `DigitalLifeTwinService` | `getFeedForUser` | IMP-3 |
| C-06 | `fileController.getItemActivity` | `getActivityForEntity` | IMP-3 |
| C-07 | `folderController.getRecentActivity` | `getRecentActivity` | IMP-3 |
| C-08 | `ai-context-debug.ts` | `getFeedForUser` | IMP-3 |

---

## 3. Compliant — delegate refactor deferred (P3)

| ID | Consumer | Current pattern | Recommended |
|----|----------|-----------------|-------------|
| C-09 | `placeVisibilityService` (feed) | Direct `Log` `module_activity_event` | Delegate to `getModuleActivity` |
| C-10 | `workforceReportingService` | `Log.count` scoped | Delegate to `countModuleActivity` |
| C-11 | `placeVisibilityService` (export) | `Log.count` | Delegate to `countModuleActivity` |

These are **not violations** — they already read normalized activity. Refactor reduces drift risk only.

---

## 4. Deferred

| ID | Consumer | Pattern | Reason | Target |
|----|----------|---------|--------|--------|
| C-12 | `driveDeleteService` | `prisma.activity.deleteMany` | Write-path cleanup of legacy table | PK-W4 after Activity table retirement |

---

## 5. Remaining `prisma.activity` references (repo scan)

| Location | Type | Disposition |
|----------|------|-------------|
| `driveDeleteService.ts` | `deleteMany` | **Deferred** C-12 |
| `ai.ts` | Commented `findMany` | **Benign** |
| `fileController.ts` | Comment (FH-6) | **Benign** |
| Test files | Mocks for legacy writes | **Test-only** |

**Production read sites:** **0**

---

## 6. ACT-R1 closure assessment

| Gate | Status |
|------|--------|
| All P0/P1 violation reads migrated | ✅ |
| Canonical query service adopted by major consumers | ✅ |
| Remaining items documented | ✅ |
| Legacy table retired | ❌ (future PK-W4) |
| ESLint `prisma.activity` ban | ❌ (future) |

**Verdict:** ACT-R1 **read migration closed** for authorized scope. Program tail = table retirement + compliant-consumer delegate + write cleanup.

---

**Last updated:** 2026-06-23
