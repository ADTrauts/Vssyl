# Admin Portal Analytics Reality Assessment

**Program:** Stage 0C — Analytics Ownership Rationalization  
**Finding:** AP-F-007  
**Date:** 2026-06-18  
**Status:** Assessment complete — convergence implemented

---

## 1. Executive summary

Admin Portal previously exposed **three operator surfaces** that duplicated platform user/revenue/growth analytics: Platform Analytics, Business Intelligence, and AI System trend charts. Stage 0C consolidates to a **single canonical UI** (`/admin-portal/analytics`) with an **insights tab** for strategic BI content. AI System is reduced to an **AI launcher** with a delegation card to Platform Analytics.

---

## 2. Analytics systems inventory

| # | System | Type | Path / mount | Role (post-0C) |
|---|--------|------|--------------|----------------|
| 1 | **Platform Analytics** | Admin UI | `/admin-portal/analytics` | **Canonical** |
| 2 | **Business Intelligence (legacy page)** | Admin UI | `/admin-portal/business-intelligence` | **Retired** → redirect |
| 3 | **AI System hub** | Admin UI | `/admin-portal/ai-system` | **Satellite** (launcher only) |
| 4 | **Performance & Scalability** | Admin UI | `/admin-portal/performance` | **Satellite** (infra/ops) |
| 5 | **Admin Dashboard** | Admin UI | `/admin-portal/dashboard` | **Satellite** (summary stats) |
| 6 | **adminAnalyticsService** | Backend service | `/api/admin-portal/analytics/*`, `/business-intelligence/*` | **Canonical data owner** |
| 7 | **adminPerformanceService** | Backend service | `/api/admin-portal/performance/*` | **Satellite** |
| 8 | **AI Pipeline metrics** | Admin UI + routes | `/admin-portal/ai-pipeline` | **Satellite** (control plane) |
| 9 | **Support analytics** | Domain API | `/api/admin-portal/support/analytics` | **Satellite** |
| 10 | **Module analytics** | Domain API | `/api/admin-portal/modules/analytics` | **Satellite** |
| 11 | **RealTimeAnalyticsEngine** | AI subsystem | `server/src/ai/analytics/` | **Satellite** (AI runtime) |
| 12 | **Workspace `analytics` module** | Product module | Business workspace | **Out of scope** (tenant product) |

**Count:** **12 distinct analytics-related systems** in repo scope; **1 canonical operator destination** for platform/business metrics.

---

## 3. Triplication evidence (pre-0C)

| Surface | Duplicate behavior | Evidence |
|---------|-------------------|----------|
| Platform Analytics | Deferred business metrics to BI | `analytics/page.tsx` alert linked to BI |
| Business Intelligence | User/MRR/active-user overview cards | `business-intelligence/page.tsx` L312–387 |
| AI System | `getAnalytics` + `getBusinessIntelligence` + unified trend charts | `ai-system/page.tsx` (pre-0C) |

Performance overlap was **partial** (system uptime/response time) — scoped as infra satellite, not duplicate business analytics.

---

## 4. Backend reality

| Service | Methods | Routes |
|---------|---------|--------|
| `adminAnalyticsService.ts` | `getAnalytics`, `getBusinessIntelligence`, `getDashboardStats`, AB tests, segments, exports | `adminPortalRoutes.analyticsOps.ts`, `adminPortalRoutes.platform.ts` |
| `adminPerformanceService.ts` | Infra/ops metrics | `adminPortalRoutes.analyticsOps.ts` (performance prefix) |

BI API routes **remain** as satellite endpoints consumed by the canonical insights tab — no schema redesign.

---

## 5. Navigation reality (post-0C)

| Location | Analytics entries |
|----------|-------------------|
| Sidebar Platform section | **1** — Platform Analytics |
| Sidebar AI section | **0** analytics duplicates (BI removed) |
| AI System launcher | Link card → Platform Analytics |

---

## 6. Maturity

| Dimension | Pre-0C | Post-0C |
|-----------|--------|---------|
| Ownership clarity | Low — three UIs | High — registry + single canonical path |
| Duplicate API calls on AI System | Yes | No |
| Operator confusion risk | Major | Mitigated |
| BI strategic features | Orphan page | Insights tab under canonical |

---

## 7. Related documents

- [ADMIN_PORTAL_ANALYTICS_OWNERSHIP_MODEL.md](./ADMIN_PORTAL_ANALYTICS_OWNERSHIP_MODEL.md)
- [ADMIN_PORTAL_AI_AND_ANALYTICS_BOUNDARY_REVIEW.md](./ADMIN_PORTAL_AI_AND_ANALYTICS_BOUNDARY_REVIEW.md)
- `web/src/lib/adminAnalyticsOwnership.ts`

**Last updated:** 2026-06-18
