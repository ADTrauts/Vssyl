# Admin Portal Operation Matrix

**Program:** Admin Portal Modernization — Stage 0B Package 0B-C  
**Date:** 2026-06-17  
**Finding addressed:** AP-F-003 (missing operation matrix)  
**Status:** Authoritative control-plane operation inventory — **no certification awarded**

**Related:** [Certification Readiness](./ADMIN_PORTAL_CERTIFICATION_READINESS.md) · [Satellite Mount Map](./ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md) · [Surface Inventory](./ADMIN_PORTAL_SURFACE_INVENTORY.md) · [Ownership Boundary Analysis](./ADMIN_PORTAL_OWNERSHIP_BOUNDARY_ANALYSIS.md) · [Control Plane Architecture](./ADMIN_PORTAL_CONTROL_PLANE_ARCHITECTURE.md)

> **Blueprint note:** `ADMIN_PORTAL_OPERATION_MATRIX_BLUEPRINT.md` is not present in the repository. Structure follows certified reference matrices (`CHAT_OPERATION_MATRIX.md`, `HR_OPERATION_MATRIX.md`) and control-plane gates in `ADMIN_PORTAL_CERTIFICATION_READINESS.md` §1.

---

## 1. Executive Summary

This document is the **canonical Admin Portal operation matrix** required for adapted control-plane certification readiness (G7). It inventories **151 canonical** `/api/admin-portal` HTTP operations plus **satellite**, **emergency**, **debug/test**, and **legacy** admin-adjacent surfaces at summary level.

| Metric | Count |
|--------|------:|
| **Canonical operations** (`/api/admin-portal`, `/api/admin-portal/security`) | **151** |
| **Satellite mount prefixes** (summary rows) | **12** |
| **Emergency ops routes** (summary) | **18** |
| **Debug/test routes** (summary) | **13** |
| **Legacy/deprecated** (`/api/centralized-ai` scaffold) | **~97** (deferred 0D) |

**Post-0E/0B state reflected:** mock fallbacks removed on support/modules/dashboard (0E-C); dangerous migration ops gated (0E-B); debug/testing gated (0E-E); phantom `admin` module removed (0B-B); satellite mounts documented (0B-A).

**Not certified:** This matrix enables review preparation only. Remaining blockers include AP-F-004 (AdminService monolith), AP-F-011 (auth consolidation), AP-F-015 (duplicate security/events), and incomplete HTTP test evidence (AP-F-014, AP-F-030).

---

## 2. Scope and Method

### 2.1 In scope

- All handlers registered on `server/src/routes/admin-portal.ts` and sub-routers:
  - `adminPortalRoutes.core.ts`
  - `adminPortalRoutes.analyticsOps.ts`
  - `adminPortalRoutes.platform.ts`
  - `adminPortalRoutes.aiPipeline.ts`
  - `adminSecurityRoutes.ts` (mounted at `/security`)
- Satellite, emergency, debug, and legacy mounts cross-referenced from [`ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md`](./ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md)

### 2.2 Out of scope (this package)

- Route behavior changes, auth consolidation, duplicate route removal
- Per-operation Policy Engine / audit envelope compliance (deferred 1B)
- Frontend page-level operation mapping (see Surface Inventory)

### 2.3 Method (2026-06-17)

1. Static extraction: `router.(get|post|put|patch|delete)(` from route files (including multiline registrations)
2. Classification by domain, maturity, and certification relevance using audit evidence + 0E/0B completion status
3. Verification grep against `server/src/index.ts` satellite mounts
4. Regeneration helper: `scripts/generate-admin-portal-operation-matrix-appendix.js` (read-only)

### 2.4 Column definitions

| Column | Meaning |
|--------|---------|
| **Operation ID** | Stable row id `AP-OP-###` for review references |
| **Surface** | `canonical` \| `satellite` \| `emergency` \| `debug` \| `legacy` |
| **Maturity** | `implemented`, `partial`, `mock removed`, `gated`, `debug gated`, `deprecated`, `emergency`, `unknown` |
| **Certification Relevance** | `Required` (G1/G7/G8 evidence), `Advisory`, `Out of Scope`, `Deferred` |

---

## 3. Operation Matrix

### 3.1 Canonical `/api/admin-portal` operations (151)

Mount: `app.use('/api/admin-portal', adminPortalRouter)` — per-route `authenticateJWT` + `requireAdmin` from `adminPortalShared.ts`, except where noted.

### User Management (4)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-011 | User Management | canonical | GET | `/api/admin-portal/users` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-012 | User Management | canonical | GET | `/api/admin-portal/users/:userId` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-013 | User Management | canonical | PATCH | `/api/admin-portal/users/:userId/status` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-014 | User Management | canonical | POST | `/api/admin-portal/users/:userId/reset-password` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |

### Impersonation (7)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-004 | Impersonation | canonical | POST | `/api/admin-portal/users/:userId/impersonate` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-005 | Impersonation | canonical | POST | `/api/admin-portal/impersonation/end` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-006 | Impersonation | canonical | GET | `/api/admin-portal/impersonation/current` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-007 | Impersonation | canonical | GET | `/api/admin-portal/impersonation/businesses` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-008 | Impersonation | canonical | GET | `/api/admin-portal/impersonation/businesses/:businessId/members` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-009 | Impersonation | canonical | POST | `/api/admin-portal/impersonation/businesses/:businessId/seed` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-010 | Impersonation | canonical | GET | `/api/admin-portal/impersonation/history` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |

### Support (12)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-072 | Support | canonical | GET | `/api/admin-portal/support/tickets` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-073 | Support | canonical | GET | `/api/admin-portal/support/stats` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-074 | Support | canonical | PATCH | `/api/admin-portal/support/tickets/:ticketId` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-075 | Support | canonical | GET | `/api/admin-portal/support/knowledge-base` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-076 | Support | canonical | PATCH | `/api/admin-portal/support/knowledge-base/:articleId` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-077 | Support | canonical | GET | `/api/admin-portal/support/live-chats` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-078 | Support | canonical | POST | `/api/admin-portal/support/live-chats/:chatId/join` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-079 | Support | canonical | GET | `/api/admin-portal/support/analytics` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-080 | Support | canonical | POST | `/api/admin-portal/support/tickets` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-081 | Support | canonical | POST | `/api/admin-portal/support/tickets/customer` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-082 | Support | canonical | POST | `/api/admin-portal/support/knowledge-base` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-083 | Support | canonical | GET | `/api/admin-portal/support/export` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |

### Billing (8)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-023 | Billing | canonical | GET | `/api/admin-portal/billing/subscriptions` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-024 | Billing | canonical | GET | `/api/admin-portal/billing/payments` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-025 | Billing | canonical | GET | `/api/admin-portal/billing/payouts` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-026 | Billing | canonical | POST | `/api/admin-portal/billing/subscriptions/:id/sync` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-027 | Billing | canonical | POST | `/api/admin-portal/billing/invoices/:id/sync` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-028 | Billing | canonical | POST | `/api/admin-portal/billing/subscriptions/sync-all` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-029 | Billing | canonical | GET | `/api/admin-portal/billing/subscriptions/:id/enhanced` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-030 | Billing | canonical | GET | `/api/admin-portal/billing/invoices/:id/enhanced` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |

### Module Governance (12)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-050 | Module Governance | canonical | GET | `/api/admin-portal/modules/submissions` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-051 | Module Governance | canonical | GET | `/api/admin-portal/modules/stats` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-052 | Module Governance | canonical | POST | `/api/admin-portal/modules/submissions/:submissionId/review` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-053 | Module Governance | canonical | POST | `/api/admin-portal/modules/bulk-action` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-054 | Module Governance | canonical | GET | `/api/admin-portal/modules/:moduleId/versions` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-055 | Module Governance | canonical | POST | `/api/admin-portal/modules/:moduleId/versions/promote-previous` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-056 | Module Governance | canonical | POST | `/api/admin-portal/modules/:moduleId/versions/:version/promote` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-057 | Module Governance | canonical | GET | `/api/admin-portal/modules/analytics` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-058 | Module Governance | canonical | GET | `/api/admin-portal/modules/developers/stats` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-059 | Module Governance | canonical | PATCH | `/api/admin-portal/modules/:moduleId/status` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-060 | Module Governance | canonical | GET | `/api/admin-portal/modules/:moduleId/revenue` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-061 | Module Governance | canonical | GET | `/api/admin-portal/modules/export` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |

### Moderation (7)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-015 | Moderation | canonical | GET | `/api/admin-portal/moderation/reported` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-016 | Moderation | canonical | PATCH | `/api/admin-portal/moderation/reports/:reportId` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-041 | Moderation | canonical | GET | `/api/admin-portal/moderation/stats` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-042 | Moderation | canonical | GET | `/api/admin-portal/moderation/rules` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-043 | Moderation | canonical | POST | `/api/admin-portal/moderation/bulk-action` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-044 | Moderation | canonical | POST | `/api/admin-portal/moderation/reports` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-045 | Moderation | canonical | PUT | `/api/admin-portal/moderation/reports/:reportId` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |

### System Operations (19)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-002 | System Operations | canonical | GET | `/api/admin-portal/dashboard/stats` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-003 | System Operations | canonical | GET | `/api/admin-portal/dashboard/activity` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-038 | System Operations | canonical | GET | `/api/admin-portal/system/health` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-039 | System Operations | canonical | GET | `/api/admin-portal/system/config` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-040 | System Operations | canonical | PATCH | `/api/admin-portal/system/config/:configKey` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-046 | System Operations | canonical | GET | `/api/admin-portal/system/backup` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-047 | System Operations | canonical | POST | `/api/admin-portal/system/backup` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-048 | System Operations | canonical | GET | `/api/admin-portal/system/maintenance` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-049 | System Operations | canonical | POST | `/api/admin-portal/system/maintenance` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | mock removed | Admin Portal | Required | — |
| AP-OP-084 | System Operations | canonical | GET | `/api/admin-portal/performance/metrics` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Advisory | — |
| AP-OP-085 | System Operations | canonical | GET | `/api/admin-portal/performance/scalability` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Advisory | — |
| AP-OP-086 | System Operations | canonical | GET | `/api/admin-portal/performance/optimization` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Advisory | — |
| AP-OP-087 | System Operations | canonical | PATCH | `/api/admin-portal/performance/optimization/:recommendationId` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Advisory | — |
| AP-OP-088 | System Operations | canonical | GET | `/api/admin-portal/performance/alerts` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Advisory | — |
| AP-OP-089 | System Operations | canonical | PATCH | `/api/admin-portal/performance/alerts/:alertId` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Advisory | — |
| AP-OP-090 | System Operations | canonical | GET | `/api/admin-portal/performance/analytics` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Advisory | — |
| AP-OP-091 | System Operations | canonical | POST | `/api/admin-portal/performance/alerts/configure` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Advisory | — |
| AP-OP-098 | System Operations | canonical | GET | `/api/admin-portal/performance/export` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Advisory | — |
| AP-OP-099 | System Operations | canonical | GET | `/api/admin-portal/integrations/status` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | partial | Admin Portal | Advisory | — |

### Database Operations (6)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-092 | Database Operations | canonical | GET | `/api/admin-portal/database/schema-check` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-093 | Database Operations | canonical | POST | `/api/admin-portal/database/run-migrations` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-094 | Database Operations | canonical | GET | `/api/admin-portal/database/migrations` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-095 | Database Operations | canonical | POST | `/api/admin-portal/database/migrations/fix-failed` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-096 | Database Operations | canonical | POST | `/api/admin-portal/database/migrations/delete` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | gated | Admin Portal | Required | ADMIN_PORTAL_DANGEROUS_OPS_ENABLED |
| AP-OP-097 | Database Operations | canonical | POST | `/api/admin-portal/database/migrations/reset-baseline` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | gated | Admin Portal | Required | ADMIN_PORTAL_DANGEROUS_OPS_ENABLED |

### Security / Compliance (14)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-031 | Security / Compliance | canonical | GET | `/api/admin-portal/security/events` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | Duplicate handler AP-F-015 |
| AP-OP-032 | Security / Compliance | canonical | GET | `/api/admin-portal/security/audit-logs` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-033 | Security / Compliance | canonical | GET | `/api/admin-portal/security/events` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | Duplicate handler AP-F-015 |
| AP-OP-034 | Security / Compliance | canonical | GET | `/api/admin-portal/security/metrics` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-035 | Security / Compliance | canonical | GET | `/api/admin-portal/security/compliance` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-036 | Security / Compliance | canonical | POST | `/api/admin-portal/security/events/:eventId/resolve` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-037 | Security / Compliance | canonical | POST | `/api/admin-portal/security/export` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-145 | Security / Compliance | canonical | GET | `/api/admin-portal/security/metrics` | `adminSecurityRoutes.ts` | JWT+admin (parent); handler-local auth absent | partial | Admin Portal | Advisory | — |
| AP-OP-146 | Security / Compliance | canonical | GET | `/api/admin-portal/security/alerts` | `adminSecurityRoutes.ts` | JWT+admin (parent); handler-local auth absent | partial | Admin Portal | Advisory | — |
| AP-OP-147 | Security / Compliance | canonical | GET | `/api/admin-portal/security/monitoring` | `adminSecurityRoutes.ts` | JWT+admin (parent); handler-local auth absent | partial | Admin Portal | Advisory | — |
| AP-OP-148 | Security / Compliance | canonical | POST | `/api/admin-portal/security/monitoring/:moduleId/start` | `adminSecurityRoutes.ts` | JWT+admin (parent); handler-local auth absent | partial | Admin Portal | Advisory | — |
| AP-OP-149 | Security / Compliance | canonical | POST | `/api/admin-portal/security/monitoring/:moduleId/stop` | `adminSecurityRoutes.ts` | JWT+admin (parent); handler-local auth absent | partial | Admin Portal | Advisory | — |
| AP-OP-150 | Security / Compliance | canonical | POST | `/api/admin-portal/security/test/:moduleId` | `adminSecurityRoutes.ts` | JWT+admin (parent); handler-local auth absent | partial | Admin Portal | Advisory | — |
| AP-OP-151 | Security / Compliance | canonical | GET | `/api/admin-portal/security/policies` | `adminSecurityRoutes.ts` | JWT+admin (parent); handler-local auth absent | partial | Admin Portal | Advisory | — |

### Analytics / BI (16)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-017 | Analytics / BI | canonical | GET | `/api/admin-portal/analytics/system` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-018 | Analytics / BI | canonical | GET | `/api/admin-portal/analytics/users` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-019 | Analytics / BI | canonical | GET | `/api/admin-portal/analytics` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-020 | Analytics / BI | canonical | POST | `/api/admin-portal/analytics/export` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-021 | Analytics / BI | canonical | GET | `/api/admin-portal/analytics/realtime` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-022 | Analytics / BI | canonical | POST | `/api/admin-portal/analytics/custom-report` | `adminPortalRoutes.analyticsOps.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-062 | Analytics / BI | canonical | GET | `/api/admin-portal/business-intelligence` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-063 | Analytics / BI | canonical | GET | `/api/admin-portal/business-intelligence/export` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-064 | Analytics / BI | canonical | POST | `/api/admin-portal/business-intelligence/ab-tests` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-065 | Analytics / BI | canonical | GET | `/api/admin-portal/business-intelligence/ab-tests/:testId/results` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-066 | Analytics / BI | canonical | PATCH | `/api/admin-portal/business-intelligence/ab-tests/:testId` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-067 | Analytics / BI | canonical | GET | `/api/admin-portal/business-intelligence/user-segments` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-068 | Analytics / BI | canonical | POST | `/api/admin-portal/business-intelligence/user-segments` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-069 | Analytics / BI | canonical | GET | `/api/admin-portal/business-intelligence/predictive-insights` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-070 | Analytics / BI | canonical | GET | `/api/admin-portal/business-intelligence/competitive-analysis` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-071 | Analytics / BI | canonical | POST | `/api/admin-portal/business-intelligence/custom-report` | `adminPortalRoutes.platform.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |

### AI Pipeline (45)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-100 | AI Pipeline | canonical | GET | `/api/admin-portal/ai-pipeline/catalog` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-101 | AI Pipeline | canonical | GET | `/api/admin-portal/ai-pipeline/registry/graph` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-102 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/registry/validate` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-103 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/intents` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-104 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/intents/:intentId/duplicate` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-105 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/intents/:intentId/archive` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-106 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/intents/:intentId/restore` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-107 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/intents/:intentId/enable` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-108 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/intents/:intentId/disable` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-109 | AI Pipeline | canonical | PUT | `/api/admin-portal/ai-pipeline/policies/intents/:intentId` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-110 | AI Pipeline | canonical | PUT | `/api/admin-portal/ai-pipeline/policies/grounding/:intentId` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-111 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/grounding` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-112 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/grounding/:intentId/duplicate` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-113 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/grounding/:intentId/archive` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-114 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/grounding/:intentId/restore` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-115 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/grounding/:intentId/enable` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-116 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/grounding/:intentId/disable` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-117 | AI Pipeline | canonical | PUT | `/api/admin-portal/ai-pipeline/policies/sources/:sourceId` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-118 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/sources` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-119 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/sources/:sourceId/duplicate` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-120 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/sources/:sourceId/archive` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-121 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/sources/:sourceId/restore` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-122 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/sources/:sourceId/enable` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-123 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/sources/:sourceId/disable` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-124 | AI Pipeline | canonical | PUT | `/api/admin-portal/ai-pipeline/policies/tools/:toolId` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-125 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/tools` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-126 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/tools/:toolId/duplicate` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-127 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/tools/:toolId/archive` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-128 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/tools/:toolId/restore` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-129 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/tools/:toolId/enable` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-130 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/policies/tools/:toolId/disable` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-131 | AI Pipeline | canonical | PUT | `/api/admin-portal/ai-pipeline/policies/settings` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-132 | AI Pipeline | canonical | GET | `/api/admin-portal/ai-pipeline/audit` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-133 | AI Pipeline | canonical | GET | `/api/admin-portal/ai-pipeline/quality/stats` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-134 | AI Pipeline | canonical | GET | `/api/admin-portal/ai-pipeline/diagnostics` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-135 | AI Pipeline | canonical | GET | `/api/admin-portal/ai-pipeline/diagnostics/:traceId` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-136 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/test-lab` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-137 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/context-providers/health` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-138 | AI Pipeline | canonical | GET | `/api/admin-portal/ai-pipeline/retention` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-139 | AI Pipeline | canonical | PUT | `/api/admin-portal/ai-pipeline/retention` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-140 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/retention/purge` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-141 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/diagnostics/export` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-142 | AI Pipeline | canonical | GET | `/api/admin-portal/ai-pipeline/diagnostics/:traceId/evidence` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-143 | AI Pipeline | canonical | GET | `/api/admin-portal/ai-pipeline/suggestions/metrics` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |
| AP-OP-144 | AI Pipeline | canonical | POST | `/api/admin-portal/ai-pipeline/suggestions/dry-run` | `adminPortalRoutes.aiPipeline.ts` | JWT + requireAdmin | implemented | Admin Portal | Required | — |

### Developer / Testing (1)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-OP-001 | Developer / Testing | canonical | GET | `/api/admin-portal/test` | `adminPortalRoutes.core.ts` | JWT + requireAdmin | debug gated | Admin Portal | Advisory | ADMIN_PORTAL_DEBUG_ENABLED |


### 3.2 Satellite admin operations (summary)

Full mount detail: [`ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md`](./ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md). Each prefix summarized below; individual handlers not expanded (fragmentation tracked AP-F-006).

| Operation ID | Domain | Surface | Method | Route prefix | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|--------------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-SAT-001 | User Management | satellite | * | `/api/admin` | `admin.ts` | JWT + inline requireAdmin | implemented | Platform Satellite | Advisory | Block ID / audit — migrate to canonical |
| AP-SAT-002 | Module Governance | satellite | * | `/api/admin/modules/ai/*` | `moduleAIContext.ts` | JWT + requireRole(ADMIN) | implemented | Platform Satellite | Required | 9 admin AI context ops |
| AP-SAT-003 | System Operations | satellite | * | `/api/admin/logs` | `admin-logs.ts` | JWT + requireRole(ADMIN) | implemented | Platform Satellite | Required | `/client` authed non-admin |
| AP-SAT-004 | Platform Overrides | satellite | * | `/api/admin-override` | `admin-override.ts` | JWT + inline requireAdmin | implemented | Platform Satellite | Required | Tier/role overrides |
| AP-SAT-005 | AI Admin Satellites | satellite | * | `/api/admin/ai-providers` | `ai-provider-usage.ts` | JWT + inline requireAdmin | implemented | AI Admin Satellite | Deferred | 8 provider usage/expense handlers |
| AP-SAT-006 | AI Admin Satellites | satellite | * | `/api/admin/business-ai` | `adminBusinessAI.ts` | JWT + inline ADMIN check | implemented | AI Admin Satellite | Deferred | 5 handlers; 0D retirement |
| AP-SAT-007 | AI Admin Satellites | satellite | * | `/api/ai-context-debug` | `ai-context-debug.ts` | JWT + requireRole(ADMIN) | debug | Developer/Test | Advisory | Recommend debug env gate |
| AP-SAT-008 | AI Admin Satellites | satellite | * | `/api/centralized-ai` | `ai-centralized.ts` | JWT + requireAdmin + 410 fence | deprecated | Legacy | Deferred | ~97 mock-heavy handlers; 0D |
| AP-SAT-009 | Developer / Testing | satellite | * | `/api/admin-portal/testing` | `admin-portal-testing.ts` | debug gate + JWT + admin | debug gated | Developer/Test | Out of Scope | Shell exec; 4 handlers |
| AP-SAT-010 | Developer / Testing | satellite | * | `/api/debug`, `/api/debug/database` | `debug-*.ts` | **None** (env-gated mount) | debug | Developer/Test | Out of Scope | 4 handlers; no prod default |
| AP-SAT-011 | Developer / Testing | satellite | * | `/api/debug/business-tier` | `debug-business-tier.ts` | JWT + ADMIN (env-gated) | debug | Developer/Test | Out of Scope | 2 handlers |
| AP-SAT-012 | Business Admin | satellite | * | `/api/business-ai` | `businessAI.ts` | Business-scoped | implemented | Business Admin Surface | Out of Scope | Not platform admin portal |

### 3.3 Emergency operations (summary)

| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |
|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|
| AP-EMG-001 | Emergency Ops | emergency | POST | `/api/admin-setup/*` (6 routes) | `admin-setup.ts` | Shared secret; conditional mount | emergency | Emergency Ops | Out of Scope | Bootstrap only |
| AP-EMG-002 | Emergency Ops | emergency | POST/GET | `/api/admin/hr-setup/*` (2) | `admin-hr-setup.ts` | JWT + inline ADMIN | emergency | Emergency Ops | Out of Scope | HR seed/diagnostics |
| AP-EMG-003 | Emergency Ops | emergency | POST/GET | `/api/admin/fix-hr/*` (3) | `admin-fix-hr.ts` | JWT + inline ADMIN | emergency | Emergency Ops | Out of Scope | execSync migrations |
| AP-EMG-004 | Emergency Ops | emergency | POST | `/api/admin/create-hr-tables` | `admin-create-hr-tables.ts` | JWT + inline ADMIN | emergency | Emergency Ops | Out of Scope | Raw SQL DDL |
| AP-EMG-005 | Emergency Ops | emergency | POST/GET | `/api/admin/fix-subscriptions/*` (2) | `admin-fix-subscriptions.ts` | JWT + inline ADMIN | emergency | Emergency Ops | Out of Scope | Raw SQL ALTER |
| AP-EMG-006 | Emergency Ops | emergency | POST | `/api/admin/seed/seed-core-modules` | `admin-seed-modules.ts` | JWT + inline ADMIN | emergency | Emergency Ops | Out of Scope | Mass module install |
| AP-EMG-007 | Database Operations | canonical | POST | `/api/admin-portal/database/migrations/delete` | `adminPortalRoutes.platform.ts` | JWT + admin + dangerous-ops gate | gated | Admin Portal | Required | 0E-B |
| AP-EMG-008 | Database Operations | canonical | POST | `/api/admin-portal/database/migrations/reset-baseline` | `adminPortalRoutes.platform.ts` | JWT + admin + dangerous-ops gate | gated | Admin Portal | Required | 0E-B |

---

## 4. Domain Summary

| Domain | Canonical ops | Primary UI | Owner | Maturity snapshot |
|--------|--------------:|------------|-------|-------------------|
| User Management | 4 | `/admin-portal/users` | Admin Portal | implemented |
| Impersonation | 7 | `/admin-portal/impersonate` | Admin Portal | implemented (policy 0E-D) |
| Support | 12 | `/admin-portal/support` | Admin Portal | mock removed |
| Billing | 8 | `/admin-portal/billing` | Admin Portal | implemented |
| Module Governance | 12 | `/admin-portal/modules` | Admin Portal | mock removed |
| Moderation | 7 | `/admin-portal/moderation` | Admin Portal | implemented |
| System Operations | 19 | dashboard, system, performance | Admin Portal | mock removed / partial |
| Database Operations | 6 | `/admin-portal/system` | Admin Portal | gated dangerous writes |
| Security / Compliance | 14 | `/admin-portal/security` | Admin Portal | partial; duplicate events |
| Analytics / BI | 16 | analytics, business-intelligence | Admin Portal | implemented; triplication AP-F-007 |
| AI Pipeline | 45 | `/admin-portal/ai-pipeline` | Admin Portal | implemented; test gaps AP-F-030 |
| Developer / Testing | 1 | debug pages | Admin Portal | debug gated |

---

## 5. Satellite Mount Summary

See §3.2 and [`ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md`](./ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md). **21 mount prefixes** inventoried; **12** summarized in this matrix as admin-adjacent control-plane satellites (excluding pure business `/api/business-ai` from certification scope).

**Canonical vs fragmented:** 151 operations on one mount vs ~150+ additional handlers across satellites and legacy scaffold. Consolidation deferred to 0B-D+ / 0D / 1B per mount map disposition.

---

## 6. Certification Readiness Mapping

Adapted framework: [`ADMIN_PORTAL_CERTIFICATION_READINESS.md`](./ADMIN_PORTAL_CERTIFICATION_READINESS.md) §1.

| Gate | Matrix contribution | Status after 0B-C |
|------|---------------------|-------------------|
| **G1 Authorization depth** | Every canonical row documents auth pattern; satellites flagged for drift | **Partial** — matrix complete; AP-F-011 resolved (0B-D); documented exceptions remain |
| **G2 Audit trail** | High-privilege ops identified (impersonation, migrations, overrides) | **Partial** — taxonomy deferred 1B |
| **G3 Service boundaries** | Handler file per row exposes monolith concentration | **Documented** — AP-F-004 open |
| **G4 API coherence** | Canonical vs satellite explicit; mount map cross-link | **Improved** — matrix + mount map |
| **G5 Ownership clarity** | Owner column + boundary analysis link | **Improved** |
| **G6 Test evidence** | Required ops flagged; gaps reference AP-F-014/030 | **Unchanged** |
| **G7 Documentation** | **This document** | **Met** for operation matrix deliverable |
| **G8 Production safety** | Gated/debug/emergency rows marked | **Improved** post-0E |
| **G9 UX shell** | Out of Scope for matrix | Advisory |

**Readiness movement:** AP-F-003 blocking finding on missing matrix is **resolved**. Overall certification outcome remains **NOT READY** until AP-F-004 and remaining blockers clear (see Certification Readiness §2).

---

## 7. Gaps and Follow-up Findings

| ID | Gap | Matrix evidence | Phase |
|----|-----|-----------------|-------|
| AP-F-011 | Five `requireAdmin` implementations | Satellite auth column drift | **Resolved** (0B-D) — see AUTH_MODEL / AUTH_MATRIX |
| AP-F-015 | Duplicate `GET /security/events` | AP-OP-031 / AP-OP-033 | 0B-D |
| AP-F-007 | Analytics triplication | 16 Analytics/BI + overlapping performance/system | 0C |
| AP-F-008 | centralized-ai legacy scaffold | AP-SAT-008 (~97 handlers) | 0D |
| AP-F-014 | Missing HTTP tests (billing, security, BI) | Required rows without test refs | 1B |
| AP-F-030 | No AI pipeline HTTP integration tests | 45 AI Pipeline rows | 1B |
| AP-F-004 | AdminService monolith | All canonical rows → few files | 1B |
| AP-F-013 | No admin audit event taxonomy | Impersonation/migration rows | 1B |

**Unknowns marked explicitly:** `integrations/status` maturity partial; `adminSecurityRoutes` handler-local auth absent; full centralized-ai handler list deferred to 0D retirement pass.

---

## 8. Maintenance Guidance

1. **When adding a canonical admin-portal route:** add a row to §3.1 (regenerate appendix via script), update domain summary counts, and note certification relevance.
2. **When adding a satellite mount:** update [`ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md`](./ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md) first, then add a summary row to §3.2.
3. **Regenerate canonical tables:**

```bash
node scripts/generate-admin-portal-operation-matrix-appendix.js
```

4. **Verify route coverage:**

```bash
rg "router\.(get|post|put|patch|delete)\(" server/src/routes/admin-portal server/src/routes/adminSecurityRoutes.ts
rg "app.use\('/api/admin" server/src/index.ts
```

5. **Do not use this matrix as certification proof** until Certification Readiness blockers are closed and council review scheduled.

---

## Finding status

| Finding | Status |
|---------|--------|
| **AP-F-003** — Missing Admin Portal operation matrix | **Resolved** — this document |

**Last updated:** 2026-06-17 (Package 0B-C)
