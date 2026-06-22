# Analytics Capability — Operation Matrix

**Program:** Analytics Capability Phase 1 — Federated L2 Trust & Service Boundary  
**Date:** 2026-06-22  
**Status:** Phase 1 enforcement record

**Related:** [ANALYTICS_OWNERSHIP_MODEL.md](./ANALYTICS_OWNERSHIP_MODEL.md), [ANALYTICS_PHASE1_IMPLEMENTATION_REPORT.md](./ANALYTICS_PHASE1_IMPLEMENTATION_REPORT.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — constitutional requirement met |
| **P** | Partial — works; gaps remain in adjacent phases |
| **N** | Non-compliant or missing |
| **—** | Not applicable |

**Req columns:** Constitutional **requirement** (R) vs **today** (T) after Phase 1

---

## Summary (Phase 1 closeout)

| Metric | Count |
|--------|------:|
| Canonical capability operations | **4** |
| PE required (canonical) | **4** |
| PE compliant (canonical) | **4** |
| Activity required (canonical reads) | **4** |
| Activity compliant (canonical) | **4** |
| Federated rollup contracts | **2** (Chat, Todo) |

---

## A. Platform Analytics Capability (canonical)

| ID | Operation | Class | Actor | Owner | Service | Route | PE R/T | Act R/T | Status |
|----|-----------|-------|-------|-------|---------|-------|--------|---------|--------|
| AC-01 | Dashboard summary read | Read | User | Platform Analytics Capability | `analyticsCapabilityService.getDashboardSummaryCapability` → `analyticsDashboardSummaryService` | `GET /api/analytics/dashboard-summary` | Yes / **Yes** | Yes / **Yes** | **C** |
| AC-02 | Personal analytics read | Read | User | Platform Analytics Capability | `analyticsCapabilityService.getPersonalAnalyticsCapability` | `GET /api/analytics/personal` | Yes / **Yes** | Yes / **Yes** | **C** |
| AC-03 | Module analytics read | Read | User | Platform Analytics Capability | `analyticsCapabilityService.getModuleAnalyticsCapability` | `GET /api/analytics/modules/:moduleId` | Yes / **Yes** | Yes / **Yes** | **C** |
| AC-04 | Analytics export | Execute | User | Platform Analytics Capability | `analyticsCapabilityService.exportAnalyticsCapability` | `GET /api/analytics/export` | Yes / **Yes** | Yes / **Yes** | **C** |

**Policy actions:** `analytics:read` (AC-01–AC-04), `analytics:admin` (future operator paths; wired in PE).

**Enforcement path:** Controller → `analyticsCapabilityService` → `evaluateAnalyticsPolicyDual` → `authorize()`.

---

## B. Federated module rollup contracts (L2 federation)

| ID | Operation | Class | Owner module | Rollup API | Consumer | Direct Prisma in analytics layer | Status |
|----|-----------|-------|--------------|------------|----------|----------------------------------|--------|
| FR-01 | Unread messages rollup | Read | Chat | `chatAnalyticsService.countUnreadMessagesForDashboardRollup` | `analyticsDashboardSummaryService` | **Removed** | **C** |
| FR-02 | Pending tasks rollup | Read | Todo | `todoAnalyticsRollupService.countPendingTasksForDashboardRollup` | `analyticsDashboardSummaryService` | **Removed** | **C** |

Calendar, Drive, Notifications remain module-owned reads invoked by dashboard summary service (pre-existing pattern; not cross-module Prisma violations in analytics capability layer).

---

## C. Consumers (must not bypass capability)

| ID | Surface | Owner | Contract | Mock data | Status |
|----|---------|-------|----------|-----------|--------|
| CS-01 | Dashboard analytics facade | Dashboard Module | `fetchDashboardAnalyticsSummary` → AC-01 | No | **C** |
| CS-02 | Executive analytics panel | Dashboard enterprise UI | Facade enterprise projection | **Removed** | **C** |
| CS-03 | Cross-module analytics panel | Dashboard enterprise UI | Facade + empty states for unimplemented tabs | **Removed** | **C** |
| CS-04 | Business workspace analytics | Business workspace shell | `businessAnalyticsService` via business API | **Removed** | **C** |

---

## D. Satellites (out of Phase 1 canonical scope)

| ID | Surface | Owner | PE in Phase 1 | Notes |
|----|---------|-------|---------------|-------|
| SA-01 | Admin Portal analytics | Admin Portal | Partial | L3 CwF via Admin program |
| SA-02 | Chat module analytics | Chat | Module-scoped | `GET /api/chat/analytics` |
| SA-03 | HR admin analytics | HR | Module-scoped | Domain analytics |
| SA-04 | Business profile analytics | Business | Business auth | Separate from AC canonical API |

---

## E. Retired / removed (Phase 1)

| ID | Item | Action | Status |
|----|------|--------|--------|
| RT-01 | `analyticsDomainEventSubscriber` placeholder | Deleted + unregistered | **C** |
| RT-02 | `BusinessAnalyticsDashboard.tsx` orphan | Deleted | **C** |
| RT-03 | `ChatAnalytics.tsx` orphan | Deleted | **C** |

---

## F. Deferred (explicitly out of Phase 1)

| ID | Capability | Target phase |
|----|------------|--------------|
| DF-01 | Event pipeline ingestion | Phase 2 (2027) |
| DF-02 | Warehouse / historical rollups | Phase 3 (2028) |
| DF-03 | User journey / compliance enterprise tabs | Phase 3 |
| DF-04 | Authoritative cache layer | Optional K1-05 — not implemented |

---

**Last updated:** 2026-06-22 — Phase 1 closeout
