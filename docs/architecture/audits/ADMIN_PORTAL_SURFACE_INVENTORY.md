# Admin Portal Surface Inventory

**Program:** Admin Portal Reality, Architecture, and Certification Readiness  
**Date:** 2026-06-16  
**Constraint:** Discovery only — no implementation

**Classification enum:** `implemented` | `partial` | `stub` | `mock` | `debug` | `legacy` | `duplicate` | `unknown`

---

## 1. Inventory summary

| Layer | Count | Notes |
|-------|-------|-------|
| Admin Portal pages (`/admin-portal/*`) | **39** | `find web/src/app/admin-portal -name 'page.tsx'` |
| Adjacent admin pages | **3** | `/admin/*` (2), `/modules/admin` (1) |
| `admin-portal` components | **43** | `find web/src/components/admin-portal -type f` |
| `admin` components | **3** | `find web/src/components/admin -type f` |
| `/api/admin-portal` handlers | **144** | `rg router.(get|post|put|patch|delete)` in `admin-portal/` |
| Satellite admin route handlers | **~119+** | centralized-ai 97, moduleAIContext 15, adminSecurity 7, etc. |
| Backend admin test files | **7** | `server/src/routes/__tests__/admin-*.ts` |
| Frontend admin tests | **0** | No vitest/jest files under `web/src` for admin-portal |
| API mount prefixes | **14** | From `server/src/index.ts` L924–1027 + related |

---

## 2. Frontend pages — `/admin-portal/*`

### 2.1 Sidebar-navigated (authoritative: `layout.tsx` L95–151)

| Path | File | Classification | API / notes |
|------|------|----------------|-------------|
| `/admin-portal` | `page.tsx` | **implemented** | Redirect → dashboard |
| `/admin-portal/dashboard` | `dashboard/page.tsx` | **implemented** | `getDashboardStats`, `getRecentActivity`; empty alerts on failure |
| `/admin-portal/users` | `users/page.tsx` | **implemented** | `/api/admin-portal/users/*` |
| `/admin-portal/moderation` | `moderation/page.tsx` | **implemented** | `/api/admin-portal/moderation/*` |
| `/admin-portal/support` | `support/page.tsx` | **partial** | **mock fallback** on error L189 |
| `/admin-portal/billing` | `billing/page.tsx` | **implemented** | Stripe sync endpoints |
| `/admin-portal/pricing` | `pricing/page.tsx` | **implemented** | `/api/pricing/*` (separate mount) |
| `/admin-portal/ai-system` | `ai-system/page.tsx` | **partial** | Hub; cross-links to orphan AI pages |
| `/admin-portal/ai-pipeline` | `ai-pipeline/page.tsx` | **implemented** | Hub wrapper |
| `/admin-portal/business-intelligence` | `business-intelligence/page.tsx` | **partial** | Empty-on-failure L146 |
| `/admin-portal/analytics` | `analytics/page.tsx` | **implemented** | Integration tests exist |
| `/admin-portal/performance` | `performance/page.tsx` | **partial** | Backend mock metrics; empty-on-failure L184 |
| `/admin-portal/security` | `security/page.tsx` | **implemented** | Embeds `ApplicationLogsViewer` |
| `/admin-portal/system-logs` | `system-logs/page.tsx` | **implemented** | `/api/admin/logs` |
| `/admin-portal/system` | `system/page.tsx` | **partial** | Config real; health mock backend |
| `/admin-portal/developers` | `developers/page.tsx` | **implemented** | Developer stats, payouts |
| `/admin-portal/modules` | `modules/page.tsx` | **partial** | **mock fallback** on error L287; certification panel |
| `/admin-portal/overrides` | `overrides/page.tsx` | **implemented** | `/api/admin-override/*` |
| `/admin-portal/testing` | `testing/page.tsx` | **debug** | Server-side test runner; in nav |
| `/admin-portal/impersonate` | `impersonate/page.tsx` | **implemented** | Full impersonation lab |

**Nav item count:** 19 items in 6 sections.

### 2.2 Orphan pages (not in sidebar; linked from hubs)

| Path | File | Classification | Notes |
|------|------|----------------|-------|
| `/admin-portal/ai-context` | `ai-context/page.tsx` | **debug** | 5-tab AI context inspector |
| `/admin-portal/ai-learning` | `ai-learning/page.tsx` | **partial** | "Data coming soon" L978–1011; centralized-ai API |
| `/admin-portal/business-ai` | `business-ai/page.tsx` | **implemented** | `BusinessAIGlobalDashboard` wrapper |

### 2.3 AI Pipeline subpages (hub-linked)

| Path | File | Classification |
|------|------|----------------|
| `/admin-portal/ai-pipeline/diagnostics` | `diagnostics/page.tsx` | **implemented** |
| `/admin-portal/ai-pipeline/test-lab` | `test-lab/page.tsx` | **debug** |
| `/admin-portal/ai-pipeline/intents` | `intents/page.tsx` | **implemented** |
| `/admin-portal/ai-pipeline/grounding` | `grounding/page.tsx` | **implemented** |
| `/admin-portal/ai-pipeline/sources` | `sources/page.tsx` | **implemented** |
| `/admin-portal/ai-pipeline/tools` | `tools/page.tsx` | **implemented** |
| `/admin-portal/ai-pipeline/quality` | `quality/page.tsx` | **implemented** |
| `/admin-portal/ai-pipeline/compliance` | `compliance/page.tsx` | **implemented** |
| `/admin-portal/ai-pipeline/audit` | `audit/page.tsx` | **implemented** |

### 2.4 Debug / test / ops pages (not in sidebar)

| Path | File | Classification |
|------|------|----------------|
| `/admin-portal/debug-auth` | `debug-auth/page.tsx` | **debug** |
| `/admin-portal/debug-session` | `debug-session/page.tsx` | **debug** |
| `/admin-portal/test-auth` | `test-auth/page.tsx` | **debug** |
| `/admin-portal/test-api` | `test-api/page.tsx` | **debug** |
| `/admin-portal/test-impersonation` | `test-impersonation/page.tsx` | **debug** / **mock** section L83 |
| `/admin-portal/impersonation-test` | `impersonation-test/page.tsx` | **debug** / **duplicate** |
| `/admin-portal/seed-modules` | `seed-modules/page.tsx` | **debug** / **ops** |

### 2.5 Maturity counts (pages)

| Classification | Count |
|----------------|-------|
| implemented | 22 |
| partial | 7 |
| debug | 9 |
| duplicate | 1 (impersonation-test vs test-impersonation) |

---

## 3. Adjacent frontend pages

| Path | File | Classification | Notes |
|------|------|----------------|-------|
| `/admin` | `admin/layout.tsx` | **legacy** | Always redirects to `/admin-portal` |
| `/admin/governance` | `admin/governance/page.tsx` | **legacy** / **implemented** component | Unreachable — blocked by layout redirect |
| `/admin/retention` | `admin/retention/page.tsx` | **legacy** / **implemented** component | Unreachable |
| `/modules/admin` | `modules/admin/page.tsx` | **duplicate** / **partial** | Mock fallback L44; superseded by `/admin-portal/modules` |

---

## 4. Frontend components

### 4.1 Shell and navigation

| File | Classification | Notes |
|------|----------------|-------|
| `web/src/app/admin-portal/layout.tsx` | **implemented** | Active shell + nav |
| `web/src/components/admin-portal/ImpersonationBanner.tsx` | **implemented** | |
| `web/src/components/admin-portal/AdminNavigation.tsx` | **legacy** | **No imports** in codebase — duplicate nav |
| `web/src/components/admin-portal/AdminHeader.tsx` | **legacy** | Unused extract |
| `web/src/middleware.ts` | **implemented** | `/admin-portal/*` protection |

### 4.2 AI Pipeline components (22 files under `ai-pipeline/`)

All classified **implemented** — policy editors, registry, trace table, quality dashboard, compliance panel, test lab, hooks (`usePipelineCatalog`, `usePipelineHubData`, `usePipelineRegistry`).

### 4.3 Shared admin components (`web/src/components/admin/`)

| File | Used by | Classification |
|------|---------|----------------|
| `ApplicationLogsViewer.tsx` | security page | **implemented** |
| `SecurityDashboard.tsx` | modules page modal | **implemented** |
| `ModuleCertificationReviewPanel.tsx` | modules page | **implemented** |

### 4.4 AI context debug components

| File | Classification |
|------|----------------|
| `UserContextInspector.tsx` | **debug** / **implemented** |
| `AIReasoningViewer.tsx` | **debug** / **implemented** |
| `ContextValidationTools.tsx` | **debug** / **implemented** |
| `CrossModuleContextMap.tsx` | **debug** / **implemented** |
| `RealTimeContextMonitor.tsx` | **debug** / **unknown** runtime |

### 4.5 Client API layer

| File | LOC | Classification | Mounts used |
|------|-----|----------------|-------------|
| `web/src/lib/adminApiService.ts` | 1,998 | **implemented** | `/api/admin-portal`, `/api/pricing`, `/api/admin`, `/api/centralized-ai` |

---

## 5. Config and registry

| File | Entry | Classification | Evidence |
|------|-------|----------------|----------|
| `web/src/config/modules.ts` | `admin` path `/admin` | **legacy** | Redirects to admin-portal |
| `web/src/runtime/modules/coreModuleRegistry.ts` | `id: 'admin'`, `routes: []` | **stub** | L313–323 — phantom moduleId |
| `server/src/startup/registerBuiltInModules.ts` | — | **NOT PRESENT** | No `admin` module registration |

---

## 6. Backend API mounts (`server/src/index.ts`)

| Mount prefix | Router file | Handlers (approx) | Classification |
|--------------|-------------|-------------------|----------------|
| `/api/admin-portal` | `admin-portal.ts` + 4 domain files | **144** | **implemented** (mixed internals) |
| `/api/admin-portal/security` | `adminSecurityRoutes.ts` (sub-mount) | **7** | **partial** |
| `/api/admin-portal/testing` | `admin-portal-testing.ts` | **4** | **debug** |
| `/api/admin` | `admin.ts` (201 LOC) | **4** | **implemented** |
| `/api/admin/ai-providers` | `ai-provider-usage.ts` (397 LOC) | **8** | **implemented** |
| `/api/admin/business-ai` | `adminBusinessAI.ts` | **5** | **implemented** |
| `/api/admin/seed` | `admin-seed-modules.ts` | **~3** | **ops** |
| `/api/admin/logs` | `admin-logs.ts` | **12** | **implemented** |
| `/api/admin-override` | `admin-override.ts` (319 LOC) | **6** | **implemented** |
| `/api/admin/hr-setup` | `admin-hr-setup.ts` | **~4** | **ops** |
| `/api/admin/fix-hr` | `admin-fix-hr.ts` | **~4** | **ops** / **legacy** |
| `/api/admin/create-hr-tables` | `admin-create-hr-tables.ts` | **~2** | **ops** / **legacy** |
| `/api/admin/fix-subscriptions` | `admin-fix-subscriptions.ts` | **~2** | **ops** |
| `/api/admin-setup` | `admin-setup.ts` | **~5** | **debug** (secret-gated) |
| `/api/centralized-ai` | `ai-centralized.ts` (3,491 LOC) | **97** | **deprecated** / **mock** |
| `/api/ai-context-debug` | `ai-context-debug.ts` (677 LOC) | **6** | **debug** |
| `/api/admin/modules/ai/*` | `moduleAIContext.ts` (791 LOC) | **9 admin** | **implemented** |

---

## 7. `/api/admin-portal` handler inventory by domain file

### 7.1 `adminPortalRoutes.core.ts` (16 handlers, 1,292 LOC)

| Method | Path | Classification |
|--------|------|----------------|
| GET | `/test` | **debug** |
| GET | `/dashboard/stats` | **partial** (mock `systemHealth: 99.9`) |
| GET | `/dashboard/activity` | **implemented** |
| POST | `/users/:userId/impersonate` | **implemented** |
| POST | `/impersonation/end` | **implemented** |
| GET | `/impersonation/current` | **implemented** |
| GET | `/impersonation/businesses` | **implemented** |
| GET | `/impersonation/businesses/:businessId/members` | **implemented** |
| POST | `/impersonation/businesses/:businessId/seed` | **implemented** |
| GET | `/impersonation/history` | **implemented** |
| GET | `/users` | **implemented** |
| GET | `/users/:userId` | **implemented** |
| PATCH | `/users/:userId/status` | **implemented** |
| POST | `/users/:userId/reset-password` | **implemented** |
| GET | `/moderation/reported` | **implemented** |
| PATCH | `/moderation/reports/:reportId` | **implemented** |

### 7.2 `adminPortalRoutes.analyticsOps.ts` (45 handlers, 1,383 LOC)

Key routes: analytics (6), billing (10), security (7 — **duplicate** `GET /security/events` L452 + L528), system (6 — health **mock** L633), moderation ops (5), modules governance (12).

### 7.3 `adminPortalRoutes.platform.ts` (38 handlers, 1,864 LOC)

Key routes: business-intelligence (9, **partial**), support (10, **partial**), performance (7, **partial**), database ops (8, **ops** — includes `DELETE FROM "_prisma_migrations"` L1435), integrations (1, **implemented**).

**Critical:** `POST /support/tickets/customer` L653 — **no authentication** (comment: "Customer-facing support ticket creation").

### 7.4 `adminPortalRoutes.aiPipeline.ts` (45 handlers, 1,322 LOC)

All routes: **implemented** — catalog, policies (intents/grounding/sources/tools), audit, quality, diagnostics, test-lab, retention, health.

---

## 8. Services

| File | LOC | Classification | Consumers |
|------|-----|----------------|-----------|
| `server/src/services/adminService.ts` | 4,658 | **partial** | core, analyticsOps, platform route files |
| `server/src/services/admin/adminServiceContracts.ts` | — | **implemented** | Type contracts |
| `openAIAdminService.ts` | — | **implemented** | ai-provider-usage |
| `anthropicAdminService.ts` | — | **implemented** | ai-provider-usage |
| `combinedProviderService.ts` | — | **implemented** | ai-provider-usage |
| `historicalDataService.ts` | — | **implemented** | ai-provider-usage |
| `moduleSecurityService.ts` | — | **partial** | adminSecurityRoutes |
| `behavioralMonitoringService.ts` | — | **partial** | adminSecurityRoutes |
| `securityPoliciesService.ts` | — | **partial** | adminSecurityRoutes |

**AdminService mock areas (confirmed grep):** dashboard `systemHealth: 99.9` L742; random performance metrics L4211–4232; mock backup L1705; mock A/B results L3100; mock churn/revenue L3397–3425; mock moderation auto-count L691.

---

## 9. Tests

| File | Coverage area | Classification |
|------|---------------|----------------|
| `admin-portal.test.ts` | Auth smoke, dashboard | **implemented** |
| `admin-portal-user-management.test.ts` | Users CRUD | **implemented** |
| `admin-user-management.integration.test.ts` | Full lifecycle + impersonation | **implemented** |
| `admin-portal-impersonation.test.ts` | Impersonate/end/current | **implemented** |
| `admin-portal-moderation.test.ts` | Reports, patch | **implemented** |
| `admin-moderation.integration.test.ts` | Bulk actions | **implemented** |
| `admin-analytics.integration.test.ts` | Analytics, export | **implemented** |
| `aiCentralizedAdminFence.test.ts` | Non-admin blocked from centralized-ai | **implemented** |
| `moduleApprovalCertificationGate.test.ts` | Service-level gate | **implemented** |
| `moduleVersionPromotionCertification.test.ts` | Version promote gate | **implemented** |

**Gaps (no dedicated tests):** AI pipeline HTTP routes, ai-provider-usage, ai-context-debug, adminSecurityRoutes, platform BI/support/performance HTTP, billing HTTP, emergency ops routes, **all frontend admin pages**.

---

## 10. Reproducible inventory commands

```bash
# Frontend
find web/src/app/admin-portal -name 'page.tsx' | wc -l          # 39
find web/src/components/admin-portal -type f | wc -l            # 43
find web/src/components/admin -type f | wc -l                 # 3

# Backend handlers
rg "router\.(get|post|put|patch|delete)\(" server/src/routes/admin-portal | wc -l  # 144

# LOC
wc -l server/src/services/adminService.ts web/src/lib/adminApiService.ts

# Constitutional gaps
rg "emitModuleActivityEvent|policyEngine|emitDomainEvent" server/src/routes/admin-portal  # 0 matches

# UX patterns
rg "PlatformShell|PageHeader|ConfirmModal|EmptyState" web/src/app/admin-portal  # custom modal only

# Mock markers
rg -i "mock|coming soon|fallback to mock" web/src/app/admin-portal
```

---

## 11. Cross-reference

- Reality summary: [`ADMIN_PORTAL_REALITY_ASSESSMENT.md`](./ADMIN_PORTAL_REALITY_ASSESSMENT.md)
- Ownership: [`ADMIN_PORTAL_OWNERSHIP_BOUNDARY_ANALYSIS.md`](./ADMIN_PORTAL_OWNERSHIP_BOUNDARY_ANALYSIS.md)
- Findings: [`ADMIN_PORTAL_FINDINGS_REGISTER.md`](./ADMIN_PORTAL_FINDINGS_REGISTER.md)
