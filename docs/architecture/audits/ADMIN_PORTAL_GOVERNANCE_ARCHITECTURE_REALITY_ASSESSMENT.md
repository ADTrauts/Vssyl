# Admin Portal — Governance Architecture Reality Assessment

**Program:** Stage 1B — Governance Architecture Blueprint  
**Date:** 2026-06-17  
**Constraint:** Planning only — no implementation, no certification award  
**Baseline:** Post-0E/0B/0D — **CONDITIONALLY READY** (~74% G1–G9); AI Administration **89.6%** (Stage 0D complete)

**Findings in scope:** AP-F-004, AP-F-013, AP-F-014, AP-F-016, AP-F-027, AP-F-030

---

## 1. Executive summary

Admin Portal governance architecture is **documented and partially hardened** (0E compliance, 0B boundaries, 0D AI control plane) but **not decomposed in code**. A single **4,691 LOC** `AdminService` class with **81 static methods** remains the dominant backend coupling surface. Route files total **~10,890 LOC** across the `admin-portal/` router tree with **143** HTTP handlers in four domain routers plus **7** on `adminSecurityRoutes`.

**Blocking certification:** **AP-F-004** alone. Stage 1B must extract domain services, normalize audit, adopt controller governance, and close test gaps before certification review.

---

## 2. Quantified inventory (repository evidence)

### 2.1 AdminService monolith

| Metric | Value | Source |
|--------|------:|--------|
| LOC | **4,691** | `server/src/services/adminService.ts` |
| Static methods | **81** | `rg "static async"` |
| `prisma.auditLog.create` calls | **17** | Inconsistent action strings |
| Policy Engine usage | **0** | No `policyEngine` / `requirePolicy` |
| Extracted contracts | **1 file** | `server/src/services/admin/adminServiceContracts.ts` (types only) |

**Method clusters (by domain):**

| Domain cluster | Methods (approx.) | Examples |
|----------------|------------------:|----------|
| Users & impersonation | 10 | `getUsers`, `startImpersonation`, `endImpersonation` |
| Moderation | 6 | `getReportedContent`, `bulkModerationAction` |
| Analytics & BI | 14 | `getAnalytics`, `getBusinessIntelligence`, `createABTest` |
| Billing | 3 | `getSubscriptions`, `getPayments`, `getDeveloperPayouts` |
| Security & compliance | 8 | `getSecurityEvents`, `getAuditLogs`, `resolveSecurityEvent` |
| System ops | 10 | `getSystemHealth`, `createBackup`, `setMaintenanceMode` |
| Module governance | 12 | `reviewModuleSubmission`, `promoteModuleVersion` |
| Support | 12 | `getSupportTickets`, `createKnowledgeArticle` |
| Performance | 8 | `getPerformanceMetrics`, `configurePerformanceAlert` |

### 2.2 Route / controller layer

| File | LOC | Handlers | `AdminService.*` refs | Inline `prisma.` |
|------|----:|---------:|------------------------:|-----------------:|
| `adminPortalRoutes.core.ts` | 1,295 | 16 | 2 | **47** |
| `adminPortalRoutes.platform.ts` | 1,882 | 38 | 31 | 13 |
| `adminPortalRoutes.analyticsOps.ts` | 1,368 | 44 | 33 | 10 |
| `adminPortalRoutes.aiPipeline.ts` | 1,322 | 45 | 0 | 3 |
| `adminPortalShared.ts` | 283 | — | — | 4 |
| `adminSecurityRoutes.ts` | — | 7 | **0** | unknown |
| **Total (4 routers)** | **~6,867** | **143** | **66** | **73** |

**Canonical operations (matrix):** **151** on `/api/admin-portal` + `/security` — [`ADMIN_PORTAL_OPERATION_MATRIX.md`](./ADMIN_PORTAL_OPERATION_MATRIX.md).

**Coupling pattern:**

- **core** routes are **fat controllers** — impersonation seed alone is hundreds of LOC inline Prisma (AP-F-004 evidence).
- **platform** and **analyticsOps** are **thin-ish wrappers** over `AdminService` but still 1,300–1,900 LOC files.
- **aiPipeline** is the **reference pattern** — delegates to `server/src/ai/pipeline/*` services; minimal inline Prisma.

### 2.3 Service boundary count

| Category | Count |
|----------|------:|
| Platform admin domain services (target) | **0** extracted (monolith only) |
| AI Pipeline domain services | **~15+** under `server/src/ai/pipeline/` |
| Provider admin services | **2** (`openAIAdminService`, `anthropicAdminService`) |
| Shared audit helper | **1** (`auditService.ts` — Block ID focused, not admin taxonomy) |
| HR audit pattern (reference) | `logEmployeeAudit` in `hrServiceShared.ts` |

### 2.4 Audit flows (current)

| Surface | Audit mechanism | Normalized taxonomy |
|---------|-----------------|---------------------|
| Impersonation | `prisma.auditLog` in `adminPortalRoutes.core.ts`, `adminPortalShared.ts` | Partial — `USER_IMPERSONATION_*` strings |
| Knowledge articles | `AdminService.updateKnowledgeArticle` → `auditLog` | Ad hoc `KNOWLEDGE_ARTICLE_UPDATED` |
| AI Pipeline policies | `writePipelinePolicyAudit` → `aIPipelinePolicyAuditLog` | **Yes** — dedicated table + entity types |
| HR (reference) | `logEmployeeAudit` → `auditLog` with `resourceType: HR_EMPLOYEE` | Domain-scoped |
| Module activity | `emitModuleActivityEvent` | **Zero** in admin-portal routes |

**AP-F-013 verdict:** Major gap — no platform-wide admin audit taxonomy or single emission service.

### 2.5 Test coverage

| Layer | Files | Approx. test cases |
|-------|------:|-------------------:|
| Server admin route/integration | **17** | **~120+** (incl. `it.each`) |
| Web admin hygiene (static) | **10** | **~32** |
| Web admin UI/component | **0** | **0** |
| AI Pipeline HTTP smoke | **1** | **8** (of **45** handlers) |

**Domains with HTTP integration evidence:**

| Domain | Test file | Status |
|--------|-----------|--------|
| User management | `admin-user-management.integration.test.ts` | Partial |
| Impersonation | `admin-portal-impersonation.test.ts` | Partial |
| Moderation | `admin-moderation.integration.test.ts` | Partial |
| Dashboard/health | `admin-portal-dashboard-stats-health.test.ts` | Partial |
| Dangerous ops | `admin-portal-dangerous-migration-ops.test.ts` | Gated ops |
| AI Pipeline | `admin-portal-ai-pipeline.test.ts` | **Smoke only (18%)** |
| Analytics | `admin-analytics.integration.test.ts` | Partial |
| Security sub-router | `admin-portal-security-events-route.test.ts` | Partial |
| Billing HTTP | — | **Missing** |
| Support HTTP | — | **Missing** |
| Performance HTTP | — | **Missing** |
| ai-provider-usage HTTP | — | **Missing** |

---

## 3. Finding-specific assessment

### AP-F-004 — AdminService monolith and fat route files (BLOCKING)

| Dimension | Assessment |
|-----------|------------|
| Severity | **blocking** — sole remaining blocker for certification review |
| LOC risk | 4,691 + 6,867 route LOC = **~11.5K** governance-tangled code |
| Testability | Unit tests impractical on monolith; integration tests mask domain boundaries |
| Extraction readiness | `adminServiceContracts.ts` exists; AI Pipeline proves target pattern |
| Highest-risk fat route | `adminPortalRoutes.core.ts` impersonation seed — inline Prisma, not service-owned |

**Closure requires:** Phased service extraction + route thinning to **<500 LOC per file** target.

### AP-F-013 — No admin audit event taxonomy (MAJOR)

| Dimension | Assessment |
|-----------|------------|
| Evidence | 17 ad hoc `auditLog` writes in AdminService; sparse route writes; pipeline has separate audit table |
| Gap | No `admin_audit_*` taxonomy; no immutable envelope; no query API for operators |
| Reference | HR `logEmployeeAudit`; pipeline `writePipelinePolicyAudit`; WC activity model (product — adapt selectively) |

**Closure requires:** `adminAuditService` + taxonomy doc + emit on all governance mutations.

### AP-F-014 — Backend test gaps (MAJOR)

| Dimension | Assessment |
|-----------|------------|
| Evidence | 17 server test files but large domains untested at HTTP layer |
| Risk | High-privilege paths (billing, support, performance, security router) lack integration proof |
| Partial wins | 0E dangerous-ops tests; 0D pipeline smoke |

**Closure requires:** Per-domain integration suites mapped to operation matrix rows.

### AP-F-016 — No Policy Engine on admin mutations (MAJOR)

| Dimension | Assessment |
|-----------|------------|
| Evidence | Zero Policy Engine in `admin-portal/` routes or `adminService.ts` |
| Current model | `requireAdmin` role gate only |
| Pipeline contrast | Pipeline policies are **domain config**, not PE authorization |

**Closure requires:** Either (a) admin PE action catalog + enforcement on dangerous mutations, or (b) documented **control-plane waiver** with compensating audit + role matrix — pass/fail criteria in controller governance standard.

### AP-F-027 — No frontend admin tests (MAJOR)

| Dimension | Assessment |
|-----------|------------|
| Evidence | 10 web hygiene files — **static source analysis only**; zero page/component vitest |
| Risk | Operator UX regressions undetected (redirects, launcher, forms) |

**Closure requires:** Targeted page smoke tests for governance mutations + critical flows (not broad UI initiative).

### AP-F-030 — AI Pipeline HTTP tests partial (MAJOR)

| Dimension | Assessment |
|-----------|------------|
| Evidence | 8/45 handlers tested (catalog, registry, diagnostics, quality, retention, suggestions, authZ) |
| Gap | Policies CRUD, test-lab POST, context-providers, compliance routes |
| Status | **Partial** per 0D-G — not downgraded |

**Closure requires:** Full pipeline handler matrix tests in 1B-D.

---

## 4. Coupling and risk matrix

| Risk | Severity | Evidence |
|------|----------|----------|
| Monolith change blast radius | **High** | Any AdminService edit affects 66 route call sites |
| Inline Prisma in routes | **High** | 73 direct DB calls bypass service layer |
| Audit inconsistency | **Medium** | Operators cannot trace privileged actions uniformly |
| Test false confidence | **Medium** | Hygiene tests pass while HTTP domains untested |
| AI Pipeline regression | **Low–Med** | Best-tested subdomain; still 82% handlers uncovered |

---

## 5. Ownership summary

| Layer | Current owner | Target owner (1B) |
|-------|---------------|-------------------|
| User/admin CRUD | AdminService + core routes | `adminUserService` |
| Impersonation | core routes (inline) | `adminImpersonationService` |
| Moderation | AdminService | `adminModerationService` |
| Billing | AdminService | `adminBillingService` |
| Security events | AdminService + security router | `adminSecurityService` |
| Support | AdminService | `adminSupportService` |
| Module governance | AdminService + controllers | `adminModuleGovernanceService` |
| Analytics/BI/performance | AdminService | `adminAnalyticsService`, `adminPerformanceService` |
| System ops | AdminService | `adminSystemOpsService` |
| Audit emission | Ad hoc | `adminAuditService` |
| AI Pipeline | `server/src/ai/pipeline/*` | **Preserve** (reference) |

---

## 6. Readiness position entering 1B

| Metric | Value |
|--------|------:|
| Overall portal (G1–G9) | **~74%** CONDITIONALLY READY |
| AI Administration | **89.6%** READY FOR REVIEW |
| Blocking findings | **1** (AP-F-004) |
| 1B-owned major findings | **5** |

**Conclusion:** Repository evidence confirms AP-F-004 is the certification gate. Subsystem maturity (AI Pipeline, module cert gate, user management) cannot compensate for monolith architecture. Stage 1B blueprint must define extraction, audit, controller, and test architectures before any implementation.

---

## References

- [`ADMIN_PORTAL_FINDINGS_REGISTER.md`](./ADMIN_PORTAL_FINDINGS_REGISTER.md)
- [`ADMIN_PORTAL_POST_0B_READINESS_UPDATE.md`](./ADMIN_PORTAL_POST_0B_READINESS_UPDATE.md)
- [`ADMIN_PORTAL_OPERATION_MATRIX.md`](./ADMIN_PORTAL_OPERATION_MATRIX.md)
- [`ADMIN_PORTAL_AI_ADMIN_PROGRAM_CLOSEOUT.md`](./ADMIN_PORTAL_AI_ADMIN_PROGRAM_CLOSEOUT.md)
