# Admin Portal — Service Decomposition Blueprint

**Program:** Stage 1B — Governance Architecture Blueprint  
**Date:** 2026-06-17  
**Finding addressed:** AP-F-004 (primary)  
**Constraint:** Design only — no code changes

---

## 1. Target architecture

Admin Portal backend converges on **thin route handlers** → **domain admin services** → **Prisma / platform services**, mirroring the proven **AI Pipeline** pattern (`adminPortalRoutes.aiPipeline.ts` → `server/src/ai/pipeline/*`).

```
┌─────────────────────────────────────────────────────────┐
│  /api/admin-portal/*  (thin routers, <500 LOC each)      │
└───────────────────────────┬─────────────────────────────┘
                            │
    ┌───────────────────────┼───────────────────────┐
    ▼                       ▼                       ▼
 adminUserService    adminModerationService   adminAIPipelineService*
    │                       │                       │
    └───────────────────────┼───────────────────────┘
                            ▼
                   adminAuditService (cross-cutting)
                            ▼
                      prisma / shared platform
```

\* `adminAIPipelineService` = existing `server/src/ai/pipeline/*` — **rename conceptually**, do not duplicate.

---

## 2. Service candidates

### 2.1 adminUserService

| Field | Value |
|-------|-------|
| **Purpose** | Platform user directory and lifecycle for operators |
| **Responsibilities** | List/search users, user detail, status changes, password reset |
| **Dependencies** | `prisma`, `bcrypt`, `adminAuditService`, `logger` |
| **Routes owned** | `GET/PATCH /users`, `POST /users/:id/reset-password` |
| **Source methods** | `getUsers`, `getUserDetails`, `updateUserStatus`, `resetUserPassword` |
| **Migration complexity** | **M** |
| **Target files** | `server/src/services/admin/adminUserService.ts` |
| **Route file** | `adminPortalRoutes.core.ts` (thin) |

### 2.2 adminImpersonationService

| Field | Value |
|-------|-------|
| **Purpose** | Highest-privilege operator session switching |
| **Responsibilities** | Start/end impersonation, validation, business seed, history |
| **Dependencies** | `prisma`, `validateImpersonationTarget`, `adminAuditService`, `SecurityService` |
| **Routes owned** | `/impersonate`, `/impersonation/*` (9 handlers) |
| **Source** | `adminPortalRoutes.core.ts` inline Prisma (**priority extract**) + `AdminService` impersonation methods |
| **Migration complexity** | **L** — seed logic + audit critical |
| **Target files** | `server/src/services/admin/adminImpersonationService.ts` |

### 2.3 adminModerationService

| Field | Value |
|-------|-------|
| **Purpose** | Content report triage and moderation ops |
| **Responsibilities** | Reported content list, status updates, stats, rules, bulk actions |
| **Routes owned** | `/moderation/*` |
| **Source methods** | `getReportedContent`, `updateReportStatus`, `getModerationStats`, `getModerationRules`, `bulkModerationAction` |
| **Migration complexity** | **M** |
| **Target files** | `server/src/services/admin/adminModerationService.ts` |

### 2.4 adminBillingService

| Field | Value |
|-------|-------|
| **Purpose** | Subscription and payment operator views |
| **Responsibilities** | Subscriptions, payments, developer payouts |
| **Routes owned** | `/billing/*`, `/subscriptions`, `/payments`, `/developer-payouts` (per matrix) |
| **Source methods** | `getSubscriptions`, `getPayments`, `getDeveloperPayouts` |
| **Migration complexity** | **M** — financial data sensitivity |
| **Target files** | `server/src/services/admin/adminBillingService.ts` |

### 2.5 adminSecurityService

| Field | Value |
|-------|-------|
| **Purpose** | Security events, compliance posture, security metrics |
| **Responsibilities** | Events list/resolve, compliance status, security exports, `adminSecurityRoutes` delegation |
| **Routes owned** | `/security/*` (7 handlers), analytics security endpoints |
| **Source methods** | `getSecurityEvents`, `resolveSecurityEvent`, `getSecurityMetrics`, `getComplianceStatus`, `exportSecurityReport`, `logSecurityEvent` |
| **Migration complexity** | **M** |
| **Target files** | `server/src/services/admin/adminSecurityService.ts` |

### 2.6 adminSystemOpsService

| Field | Value |
|-------|-------|
| **Purpose** | Platform health, config, backup, maintenance |
| **Responsibilities** | Dashboard stats/health, system metrics, config CRUD, backup, maintenance mode |
| **Routes owned** | `/dashboard/*`, `/system/*`, `/config/*`, `/backup/*`, `/maintenance/*` |
| **Source methods** | `getDashboardStats`, `getSystemHealth`, `getSystemConfig`, `createBackup`, `setMaintenanceMode`, etc. |
| **Migration complexity** | **M** |
| **Target files** | `server/src/services/admin/adminSystemOpsService.ts` |

### 2.7 adminAnalyticsService

| Field | Value |
|-------|-------|
| **Purpose** | Platform analytics, BI exports, segments, A/B tests |
| **Responsibilities** | User analytics, real-time metrics, BI, predictive/competitive insights, custom reports |
| **Routes owned** | `/analytics/*`, `/business-intelligence/*`, `/ab-tests/*`, `/segments/*` |
| **Source methods** | 14 analytics/BI methods in AdminService |
| **Migration complexity** | **L** — large surface, overlaps AP-F-007 |
| **Target files** | `server/src/services/admin/adminAnalyticsService.ts` |
| **Note** | Coordinate with Stage 0C analytics ownership; do not duplicate chart logic |

### 2.8 adminPerformanceService

| Field | Value |
|-------|-------|
| **Purpose** | Performance monitoring and optimization recommendations |
| **Responsibilities** | Metrics, scalability, alerts, optimization CRUD |
| **Routes owned** | `/performance/*` |
| **Source methods** | 8 performance methods |
| **Migration complexity** | **M** |
| **Target files** | `server/src/services/admin/adminPerformanceService.ts` |

### 2.9 adminSupportService

| Field | Value |
|-------|-------|
| **Purpose** | Support tickets, knowledge base, live chat ops |
| **Responsibilities** | Ticket CRUD, KB articles, live chat join, support analytics |
| **Routes owned** | `/support/*`, `/knowledge/*`, `/live-chat/*` |
| **Source methods** | 12 support methods |
| **Dependencies** | `SupportTicketEmailService` |
| **Migration complexity** | **M** |
| **Target files** | `server/src/services/admin/adminSupportService.ts` |

### 2.10 adminModuleGovernanceService

| Field | Value |
|-------|-------|
| **Purpose** | Marketplace module submission review and certification ops |
| **Responsibilities** | Submissions, review, version promotion, module stats/revenue |
| **Routes owned** | `/modules/*` admin-portal handlers |
| **Source methods** | 12 module methods |
| **Dependencies** | Existing certification gate in `moduleSubmissionController` |
| **Migration complexity** | **M** |
| **Target files** | `server/src/services/admin/adminModuleGovernanceService.ts` |

### 2.11 adminAuditService

| Field | Value |
|-------|-------|
| **Purpose** | Cross-cutting privileged-action audit emission and query |
| **Responsibilities** | Taxonomy enforcement, `auditLog` writes, admin audit read API |
| **Routes owned** | `/audit/*` (new or consolidated) |
| **Dependencies** | `prisma.auditLog`; optional dedicated `AdminAuditEvent` table (1B-B decision) |
| **Migration complexity** | **M** |
| **Target files** | `server/src/services/admin/adminAuditService.ts` |
| **Maps to** | AP-F-013 |

### 2.12 adminAIPipelineService (preserve)

| Field | Value |
|-------|-------|
| **Purpose** | AI control plane — already decomposed |
| **Responsibilities** | Catalog, policies, diagnostics, test-lab, quality |
| **Routes owned** | 45 handlers in `adminPortalRoutes.aiPipeline.ts` |
| **Target files** | `server/src/ai/pipeline/*` (**no relocation**) |
| **Migration complexity** | **S** — thin route refactor only |
| **Action** | Use as **reference implementation** for other services |

---

## 3. AdminService retirement plan

| Phase | Action |
|-------|--------|
| **During 1B-A** | Extract services; AdminService becomes facade delegating to new services |
| **End 1B-A** | AdminService deleted or reduced to `<200 LOC` deprecated re-export shim |
| **Contracts** | Expand `admin/adminServiceContracts.ts` per domain DTOs |

---

## 4. Decomposition phases

### Phase 1 — Critical path (1B-A.1)

**Priority:** Highest privilege + highest inline-Prisma risk

| Extract | Rationale |
|---------|-----------|
| `adminImpersonationService` | Fat route inline Prisma; audit-critical |
| `adminUserService` | Core operator path; existing tests to anchor |
| `adminAuditService` (emit-only v1) | Enables audit on subsequent extractions |

**Exit:** Impersonation route file section **<150 LOC**; all impersonation mutations emit audit.

### Phase 2 — Governance domains (1B-A.2)

| Extract |
|---------|
| `adminModerationService` |
| `adminModuleGovernanceService` |
| `adminSecurityService` + fold `adminSecurityRoutes` handlers |

### Phase 3 — Operations domains (1B-A.3)

| Extract |
|---------|
| `adminSupportService` |
| `adminBillingService` |
| `adminSystemOpsService` |

### Phase 4 — Analytics & performance (1B-A.4)

| Extract |
|---------|
| `adminAnalyticsService` |
| `adminPerformanceService` |

**Coordinate with 0C** — analytics ownership map before merging BI endpoints.

### Phase 5 — Route file split (1B-A.5)

Split fat routers into domain-aligned files **<500 LOC**:

| Current file | Target split |
|--------------|--------------|
| `adminPortalRoutes.platform.ts` (1,882) | `platform.support.ts`, `platform.billing.ts`, `platform.modules.ts` |
| `adminPortalRoutes.analyticsOps.ts` (1,368) | `ops.analytics.ts`, `ops.performance.ts`, `ops.system.ts` |
| `adminPortalRoutes.core.ts` (1,295) | `core.dashboard.ts`, `core.users.ts`, `core.impersonation.ts`, `core.moderation.ts` |

---

## 5. Complexity summary

| Package | Complexity | Duration est. |
|---------|------------|---------------|
| 1B-A full extraction | **L** | 3–4 sprints |
| Per-phase extraction | **M** each | 0.5–1 sprint |

---

## 6. Non-goals (1B blueprint)

- Admin portal frontend decomposition (`adminApiService.ts` — separate 1A/1B tail)
- Satellite mount merge (`/api/admin/ai-providers` — documented, not moved)
- Schema migrations (unless audit table decision in 1B-B)

---

## References

- [`ADMIN_PORTAL_GOVERNANCE_ARCHITECTURE_REALITY_ASSESSMENT.md`](./ADMIN_PORTAL_GOVERNANCE_ARCHITECTURE_REALITY_ASSESSMENT.md)
- [`ADMIN_PORTAL_OPERATION_MATRIX.md`](./ADMIN_PORTAL_OPERATION_MATRIX.md)
