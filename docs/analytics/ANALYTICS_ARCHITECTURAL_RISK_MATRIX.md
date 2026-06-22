# Analytics Capability — Architectural Risk Matrix

**Program:** Analytics Capability Phase 0A — Constitutional Discovery Audit  
**Date:** 2026-06-22  
**Status:** Discovery only — **no implementation, no certification, no ledger changes**

**Cross-reference:** [ANALYTICS_REALITY_ASSESSMENT.md](./ANALYTICS_REALITY_ASSESSMENT.md), [ANALYTICS_PERMISSION_MODEL.md](../architecture/ANALYTICS_PERMISSION_MODEL.md), [RELATIONSHIP_ANALYTICS_MODEL.md](../architecture/RELATIONSHIP_ANALYTICS_MODEL.md)

---

## 1. Architectural assessment summary

| Dimension | Finding |
|-----------|---------|
| **Analytics SoR** | **None** — analytics has no owned entities; all metrics are derived from module/platform SoR |
| **Projection sources** | On-demand Prisma queries + module service calls (chat, calendar, drive visibility, business counts) |
| **Aggregation paths** | Synchronous request-time federation in `analyticsDashboardSummaryService`; no batch/materialized path |
| **Event dependencies** | Placeholder subscriber only — **no event-derived rollups** |
| **Cross-module reads** | Capability service directly imports 5+ module concerns |
| **Coupling violations** | Moderate — capability layer reaches into module Prisma/models |
| **Service boundaries** | Weak — no unified analytics facade; controller-level Prisma for legacy routes |

---

## 2. Systems of record (SoR) analysis

### 2.1 What is authoritative

| Data | SoR owner | Analytics role |
|------|-----------|----------------|
| Messages, conversations | Chat module | Count unread via Prisma in capability service |
| Tasks | Todo module | Count pending via Prisma in capability service |
| Calendar events | Calendar module | Count today via `listEventsInRange` visibility service |
| Files / storage | Drive module | Storage % via `aggregateAccessibleDriveStorageForAIContext` |
| Notifications | Notifications platform | Unread count via `NotificationService` |
| Business members, files | Business domain | Enterprise projection via `getBusinessAnalytics` |
| User activity | Platform Activity (`Activity` model) | Personal analytics inline in controller |
| System uptime, response time | Platform Ops (`SystemMetrics`) | Admin portal only |
| Module installs | Module platform | Personal/module analytics |
| HR records | HR module | HR analytics services |
| Domain events | Platform Events | **Not consumed** for analytics (placeholder) |

### 2.2 What analytics must never become SoR for

- Authoritative relationship edges (V_Link, shares, memberships)
- Activity log entries (immutable events — analytics reads, never writes back)
- Module domain state (tasks, messages, HR records)
- Permission grants (AP5: analytics never grants access)

---

## 3. Projection and aggregation paths

### 3.1 Dashboard summary path (canonical — post Package 3)

```
Client (QuickStats, useDashboardStats, AI quick-stats)
    │
    ▼
dashboardAnalyticsFacade.fetchDashboardAnalyticsSummary()
    │
    ▼
GET /api/analytics/dashboard-summary?dashboardId=
    │
    ▼
analyticsController.getDashboardSummary
    │
    ▼
analyticsDashboardSummaryService.getDashboardAnalyticsSummary()
    │
    ├── evaluateDashboardPolicyDual(DASHBOARD_READ)     ← PE gate
    ├── countUnreadMessagesForDashboard()               ← Chat Prisma
    ├── countPendingTasksForDashboard()                 ← Todo Prisma
    ├── countTodayEventsForDashboard()                  ← Calendar visibility
    ├── resolveStorageUsedPercent()                     ← Drive visibility
    ├── NotificationService.getUnreadCount()            ← Notifications
    └── buildEnterpriseProjection()                     ← businessAnalyticsService
            │
            ▼
    DashboardAnalyticsSummary DTO (degraded flags per source)
```

**Characteristics:**
- **Synchronous** — no cache, no materialized view
- **Per-request federation** — 5–6 downstream calls
- **Degraded mode** — per-source status + enterprise `degraded` flag
- **PE at entry** — dashboard policy dual on read

### 3.2 Legacy tenant analytics path

```
GET /api/analytics/personal | /modules/:id | /export
    │
    ▼
analyticsController (inline Prisma)
    │
    ├── prisma.activity.findMany
    ├── prisma.moduleInstallation.findMany
    └── prisma.file.findMany
```

**Characteristics:**
- **No service layer** — violates platform service boundary pattern
- **No ANALYTICS_PERMISSION_MODEL enforcement** beyond auth
- **Activity conflation risk** — reads activity directly for "analytics"

### 3.3 Operator analytics path

```
Admin Portal UI → adminApiService → /api/admin-portal/analytics*
    │
    ▼
adminAnalyticsService (unified operator layer)
    │
    ├── User/subscription aggregates
    ├── SystemMetrics time series
    ├── SupportAnalytics rollups
    └── BI insights (segments, AB tests, predictive)
```

**Characteristics:**
- **Mature relative to tenant capability** — L3 CwF via Admin Portal
- **Cross-tenant by design** — operator scope with admin role gate
- **Separate from tenant analytics** — correct boundary

### 3.4 Module domain paths (reference pattern)

```
Module UI → module API → module analytics service → module SoR only
```

Examples: `chatAnalyticsService`, `hrAnalyticsService`, `placeVisibilityService.getPersonalAnalytics`.

**This is the correct federation pattern** — domain owns computation; capability composes at presentation layer.

---

## 4. Event dependencies

| Event source | Subscriber | Effect today | Target state |
|--------------|------------|--------------|--------------|
| All domain events | `placeholderAnalyticsDomainEventConsumer` | Debug log only | Rollup invalidation or warehouse ingest |
| Module activity | None dedicated | — | Optional secondary input per RELATIONSHIP_ANALYTICS_MODEL |
| AI events | `AIEventConsumer` | Learning only | Separate from tenant analytics |

**Risk:** Placeholder registered on **every** domain event — operational noise, false impression of pipeline maturity.

**Constitutional guidance** (`RELATIONSHIP_ANALYTICS_MODEL.md`): Event-derived analytics is **primary** preferred path; adapter-derived secondary; graph-derived tertiary. **None implemented** for platform capability.

---

## 5. Cross-module read coupling

### 5.1 Coupling matrix (`analyticsDashboardSummaryService`)

| Dependency | Import / call | Coupling type | Acceptable? |
|------------|---------------|---------------|-------------|
| Chat | Direct Prisma on `conversation`, `message` | **Tight** — bypasses `chatAnalyticsService` | ⚠️ Violation — should call module rollup API |
| Todo | Direct Prisma on `task` | **Tight** | ⚠️ Violation |
| Calendar | `listEventsInRange` visibility service | **Loose** — uses module boundary | ✅ Acceptable |
| Drive | `aggregateAccessibleDriveStorageForAIContext` | **Loose** — visibility adapter | ✅ Acceptable |
| Notifications | `NotificationService.getUnreadCount` | **Loose** — service API | ✅ Acceptable |
| Business | `getBusinessAnalytics` | **Loose** — domain service | ✅ Acceptable |
| Auth | `evaluateDashboardPolicyDual` | **Loose** — PE | ✅ Required |

### 5.2 Federation anti-patterns observed

| Pattern | Location | Risk |
|---------|----------|------|
| God-controller Prisma | `analyticsController` personal/export | Unmaintainable; no PE parity |
| Duplicate business analytics | `businessAnalyticsService` + admin aggregates | Inconsistent numbers across surfaces |
| Two `PersonalAnalytics` types | Platform vs Place APIs | Client confusion, type collision |
| Mock UI with live APIs elsewhere | Workspace page vs profile page | User trust erosion |
| Unwired AI analytics Prisma models | `Forecast`, `Anomaly`, etc. | Schema drift without behavior |

---

## 6. Service boundary violations

| ID | Violation | Severity | Evidence |
|----|-----------|----------|----------|
| **AR-01** | Capability bypasses module analytics services for chat/todo | **High** | Direct Prisma in `analyticsDashboardSummaryService` |
| **AR-02** | No unified analytics service for `/api/analytics/personal` | **High** | Controller inline Prisma |
| **AR-03** | Placeholder event subscriber on all events | **High** | False pipeline signal |
| **AR-04** | 12+ unwired Prisma analytics models | **Medium** | `ai/analytics` scaffold |
| **AR-05** | `PlaceAnalyticsSnapshot` schema with zero writes | **Medium** | Dead model |
| **AR-06** | AP1–AP5 not enforced on all rollup paths | **High** | Permission model spec-only |
| **AR-07** | No scheduled rollup / cache invalidation | **Medium** | Performance at scale |
| **AR-08** | Enterprise panels partially mock in UI | **Low** | `CrossModuleAnalyticsPanel` placeholders |
| **AR-09** | Orphan components calling live APIs | **Low** | Dead code paths |
| **AR-10** | Ledger classifies analytics as L1 product module | **Governance** | Misaligned with capability reality |

---

## 7. Risk matrix

| ID | Risk | Likelihood | Impact | Score | Mitigation direction |
|----|------|------------|--------|-------|---------------------|
| **R-01** | Cross-module Prisma coupling causes trust boundary leaks | Medium | Critical | **Critical** | Module rollup APIs; capability composes only |
| **R-02** | Permission model not enforced — aggregate enumeration | Medium | High | **High** | AP1–AP5 audit on every rollup path |
| **R-03** | Mock business analytics page ships to users | High | High | **High** | Wire capability or hide segment |
| **R-04** | Placeholder event subscriber never replaced | High | Medium | **High** | Phase 0B charter: activate or delete |
| **R-05** | On-demand federation performance at scale | Medium | Medium | **Medium** | Optional materialized rollups + cache |
| **R-06** | Unwired AI analytics schema drift | Medium | Medium | **Medium** | Delete or wire with AI Platform charter |
| **R-07** | Inconsistent metrics across admin/business/dashboard | Medium | Medium | **Medium** | Single DTO contracts per metric family |
| **R-08** | Activity log used as analytics warehouse substitute | Low | High | **Medium** | Enforce activity vs analytics separation |
| **R-09** | Certification attempted as L3 product module | Low | High | **Medium** | Capability L2 charter first |
| **R-10** | Dual PersonalAnalytics type collision | Medium | Low | **Low** | Rename/namespace DTOs |

---

## 8. Warehouse-like behavior assessment

| Capability | Exists? | Notes |
|------------|---------|-------|
| Materialized rollup tables | ❌ | On-demand only |
| Snapshot jobs | ❌ | `PlaceAnalyticsSnapshot` unused |
| Stream processors | ❌ | `StreamProcessor` model unwired |
| Time-series store | **Partial** | `SystemMetrics` for ops only |
| Event-sourced analytics | ❌ | Placeholder subscriber |
| Cache layer | ❌ | No Redis/cache for dashboard summary |
| Export pipeline | **Partial** | L1 tenant export; admin export L3 |

**Verdict:** Vssyl has **no analytics warehouse**. Federation is **request-time composition** — acceptable for L2 capability at low scale; insufficient for L3+ without materialization strategy.

---

## 9. Dependency on other platform programs

| Program | Dependency | Blocking? |
|---------|--------------|-----------|
| Dashboard Wave 3 | **Complete** — facade contract exists | No |
| Platform Activity migration | Honest activity vs analytics separation | Soft — improves R-08 |
| Domain Events taxonomy | Event-derived rollups | Soft — future L2+ |
| Policy Engine read-path parity | AP2 enforcement | Soft — improves R-02 |
| AI Platform stub policy | Unwired `ai/analytics` engines | Soft — R-06 |
| Relationship Analytics Phase 2B | Cross-module relationship metrics | Deferred |

---

## 10. Largest architectural risks (ranked)

1. **Capability-layer Prisma coupling to Chat/Todo** — bypasses module boundaries; highest trust risk.
2. **Permission model spec without systematic enforcement** — AP1–AP5 fail-closed rules not wired.
3. **Fictional event pipeline** — placeholder subscriber creates governance false confidence.
4. **Mock product surface in business workspace** — constitutional leak post Dashboard P3 honesty work.
5. **No service layer for legacy `/api/analytics/*`** — blocks certification and operation matrix.

---

**Last updated:** 2026-06-22
