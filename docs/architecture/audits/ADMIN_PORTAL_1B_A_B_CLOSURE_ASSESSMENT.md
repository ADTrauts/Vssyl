# Admin Portal Stage 1B-A / 1B-B Closure Assessment

**Program:** Admin Portal Modernization — Governance Architecture  
**Date:** 2026-06-17  
**Mode:** Assessment only — no code, schema, or runtime changes  
**Packages assessed:** 1B-A.1–1B-A.5 (service extraction), 1B-B (audit taxonomy)

**Findings in scope:** AP-F-004, AP-F-013

---

## 1. Closure Assessment

| Finding | Verdict | Evidence | Remaining Notes |
|---------|---------|----------|-----------------|
| **AP-F-004** — AdminService monolith / route-service boundary failure | **PARTIAL** | See §2 Service Boundary Evidence | **Monolith objective met:** `adminService.ts` is facade-only (706 LOC, 80 `static async` delegates, 0 `prisma.`, 0 `auditLog.create`). Ten domain services under `server/src/services/admin/`. All `admin-portal` route modules import domain services directly — zero `AdminService` imports in `server/src/routes/admin-portal/*`. `adminPortalRoutes.core.ts` has 0 inline Prisma (impersonation seed moved to `adminImpersonationService`). `adminPortalRoutes.analyticsOps.ts` has 0 inline Prisma. Tests: `adminServiceFacade.test.ts` asserts no direct Prisma/audit in facade. | **Residual scope:** Route files remain large (1,293–1,778 LOC). **12** `prisma.` calls remain in 3 admin-portal files (dangerous migration ops, AI pipeline diagnostics, impersonation pre-check in `adminPortalShared.ts`). `contentReportController.ts` still calls `AdminService` facade (non–admin-portal consumer). Controller thinning / route Prisma extraction deferred to **1B-C**. |
| **AP-F-013** — Admin Portal audit taxonomy / audit architecture | **CLOSED** | See §3 Audit Taxonomy Evidence | Historical `AuditLog` rows may still use legacy action strings; no backfill required by 1B-B scope. `adminUserService` has no audit emitters (user mutations audit not in 1B-B scope). Platform `emitModuleActivityEvent` remains N/A for control-plane (documented in taxonomy). |

---

## 2. Service Boundary Evidence

### 2.1 AdminService posture

| Metric | Pre-1B-A (discovery) | Post-1B-A.5 / 1B-B |
|--------|----------------------|---------------------|
| **LOC** | ~4,658 | **706** |
| **Role** | Monolith with inline Prisma + audit | **Compatibility facade** — delegates to `admin/*Service` |
| **`prisma.` count** | Many | **0** |
| **`auditLog.create` count** | Present | **0** |
| **Facade methods** | N/A | **80** `static async` delegates |
| **Business logic** | Owned by AdminService | **Owned by domain services** |

**Facade imports (evidence):** `adminService.ts` L1–10 imports ten domain service modules; methods L385–706 are one-line delegates.

### 2.2 Extracted domain services

| # | Service | Package |
|---|---------|---------|
| 1 | `adminImpersonationService.ts` | 1B-A.1 |
| 2 | `adminUserService.ts` | 1B-A.1 |
| 3 | `adminAuditService.ts` | 1B-A.1 / 1B-B |
| 4 | `adminModerationService.ts` | 1B-A.2 |
| 5 | `adminModuleGovernanceService.ts` | 1B-A.2 / 1B-A.5 |
| 6 | `adminSecurityService.ts` | 1B-A.2 |
| 7 | `adminBillingService.ts` | 1B-A.3 |
| 8 | `adminSupportService.ts` | 1B-A.3 |
| 9 | `adminAnalyticsService.ts` | 1B-A.3 |
| 10 | `adminSystemOpsService.ts` | 1B-A.4 |
| 11 | `adminPerformanceService.ts` | 1B-A.4 |

**Taxonomy module:** `adminAuditTaxonomy.ts` (1B-B) — constants only, no Prisma.

### 2.3 Route delegation evidence

| Route module | LOC | `prisma.` | Delegation pattern |
|--------------|-----|-----------|-------------------|
| `adminPortalRoutes.core.ts` | 472 | **0** | `adminImpersonationService`, `adminUserService`, `adminModerationService`, `adminAnalyticsService` |
| `adminPortalRoutes.analyticsOps.ts` | 1,293 | **0** | `adminModerationService`, `adminModuleGovernanceService`, `adminSecurityService`, `adminBillingService`, `adminAnalyticsService`, `adminSystemOpsService` |
| `adminPortalRoutes.platform.ts` | 1,778 | **8** | `adminAnalyticsService`, `adminSupportService`, `adminSystemOpsService`, `adminPerformanceService`; migration delete/reset retains controlled `$queryRaw`/`$executeRaw` |
| `adminPortalRoutes.aiPipeline.ts` | 1,322 | **3** | AI pipeline diagnostics/history reads (out of 1B-A extraction scope) |
| `adminPortalShared.ts` | 213 | **1** | Impersonation target pre-check `prisma.user.findUnique` |
| `adminSecurityRoutes.ts` | 297 | **0** | Separate security sub-router; no AdminService import |

**Admin-portal route tree:** No `import { AdminService }` in any file under `server/src/routes/admin-portal/`.

**Legacy facade consumers (outside admin-portal):**

- `server/src/controllers/contentReportController.ts` — `AdminService.createContentReport` (delegates to `adminModerationService`)
- Certification tests: `moduleApprovalCertificationGate.test.ts`, `moduleVersionPromotionCertification.test.ts`

### 2.4 Test evidence (1B-A / 1B-A.5)

| Test file | Assertion |
|-----------|-----------|
| `adminServiceFacade.test.ts` | No `prisma.` / `auditLog.create` in `adminService.ts`; module-governance delegates |
| `admin-portal-billing-analytics-route.test.ts` | Route source does not call `AdminService.getModuleAnalytics` |
| `admin-portal-system-ops-performance-route.test.ts` | Route source does not call `AdminService.getPerformance` |
| Per-domain service tests | 10 service unit test files under `server/src/services/__tests__/admin*.test.ts` |

---

## 3. Audit Taxonomy Evidence

| Metric | Value |
|--------|-------|
| **Taxonomy document** | [`ADMIN_PORTAL_AUDIT_TAXONOMY.md`](./ADMIN_PORTAL_AUDIT_TAXONOMY.md) |
| **Constants module** | `server/src/services/admin/adminAuditTaxonomy.ts` |
| **Canonical actions** | **30** (`ADMIN_AUDIT_ACTIONS`) |
| **Canonical resource types** | **20** (`ADMIN_AUDIT_RESOURCE_TYPES`) |
| **Single write path** | `createAdminAuditEntry` in `adminAuditService.ts` — sole `prisma.auditLog.create` in `admin/*Service` |
| **Direct writes outside write path** | **0** in `admin/*Service` (excluding `adminAuditService.ts`) |
| **Conformance tests** | `adminAuditService.test.ts` (12), `adminAuditTaxonomy.test.ts` (6) — **18 tests, all passing** (2026-06-17) |
| **Route integration** | Impersonation + dangerous-migration route tests updated for `ADMIN_IMPERSONATION_*` and `ADMIN_DANGEROUS_MIGRATION_*` |

**Helper coverage:** Impersonation, moderation (single + bulk), module governance, security resolve, analytics, support, system ops, performance, dangerous migration denied/executed.

**Metadata rules enforced:** `sourcePackage`, `targetUserId`, `denyReason`; dangerous-op tests assert no raw SQL/secrets in audit details.

---

## 4. AP-F-004 Closure Rationale

**Why PARTIAL (not OPEN):** The blocking remediation target — *AdminService owns business logic and performs direct persistence* — is fully reversed. Repository evidence satisfies every measurable 1B-A exit criterion from the service decomposition blueprint.

**Why not CLOSED:** Original finding text also cited *fat route files* and *inline Prisma in routes*. File sizes are unchanged in aggregate (5,424 LOC across admin-portal route modules). Twelve intentional `prisma.` calls remain. Controller governance standard (1B-C) was designed to address this residual layer.

**Recommendation:** Downgrade AP-F-004 from **blocking** to **major (residual)** in the findings register; track route thinning under **1B-C** rather than blocking certification prep on monolith grounds alone.

---

## 5. AP-F-013 Closure Rationale

**Why CLOSED:** All 1B-B deliverables are present and verified:

1. Taxonomy documented and implemented as typed constants  
2. All admin control-plane audit emitters normalized to `ADMIN_*` / `lower_snake_case`  
3. Conformance tests enforce single write path and canonical values  
4. No schema or API contract changes required  

**Explicit non-goals (documented, not blockers):** Historical audit rows; `adminUserService` audit coverage; module activity envelope (`emitModuleActivityEvent`) for control-plane.

---

## 6. Verification commands (2026-06-17)

```bash
# AdminService monolith checks
rg "prisma\.|auditLog\.create" server/src/services/adminService.ts   # 0 matches

# Single audit write path in admin services
rg "auditLog\.create" server/src/services/admin/                      # adminAuditService.ts only

# Route Prisma residual
rg -c "prisma\." server/src/routes/admin-portal/*.ts

# AdminService in admin-portal routes
rg "AdminService|adminService" server/src/routes/admin-portal/        # comment only (L672 platform)

# Tests (representative)
pnpm vitest run server/src/services/__tests__/adminAuditTaxonomy.test.ts
pnpm vitest run server/src/services/__tests__/adminServiceFacade.test.ts
```

---

## 7. Cross-references

- Readiness update: [`ADMIN_PORTAL_POST_AUDIT_TAXONOMY_READINESS_UPDATE.md`](./ADMIN_PORTAL_POST_AUDIT_TAXONOMY_READINESS_UPDATE.md)
- Remaining gaps: [`ADMIN_PORTAL_GOVERNANCE_REMAINING_GAPS.md`](./ADMIN_PORTAL_GOVERNANCE_REMAINING_GAPS.md)
- Taxonomy: [`ADMIN_PORTAL_AUDIT_TAXONOMY.md`](./ADMIN_PORTAL_AUDIT_TAXONOMY.md)
- Findings: [`ADMIN_PORTAL_FINDINGS_REGISTER.md`](./ADMIN_PORTAL_FINDINGS_REGISTER.md)

**Assessment close:** AP-F-013 **CLOSED**. AP-F-004 **PARTIAL** (monolith closed; route/controller residual open).
