# Admin Portal Ownership Enforcement Model

**Program:** Stage 1B-C — Controller Governance  
**Date:** 2026-06-17  
**Finding addressed:** AP-F-016 (ownership architecture component)

---

## 1. Principles

1. **One canonical owner** per control-plane domain owns persistence, business rules, and audit emission.
2. **Routes orchestrate only** — validate, authorize, call owner service, map HTTP response.
3. **Cross-domain reads** go through the owning service or an explicit composed API — never ad hoc Prisma in routes.
4. **Audit writes** flow through `adminAuditService` only (Stage 1B-B).
5. **AI Pipeline** domain logic stays in `server/src/ai/pipeline/*`; admin routes mount orchestration endpoints.

---

## 2. Canonical owners

| Domain | Owner Service | Route Module(s) | Audit Owner |
|--------|---------------|-----------------|-------------|
| **User Management** | `adminUserService` | `adminPortalRoutes.core.ts` | Future `ADMIN_USER_*` (not yet emitted) |
| **Impersonation** | `adminImpersonationService` | `adminPortalRoutes.core.ts` | `adminAuditService` (`ADMIN_IMPERSONATION_*`) |
| **Moderation** | `adminModerationService` | `core.ts`, `analyticsOps.ts` | `adminAuditService` (`ADMIN_CONTENT_MODERATION_*`) |
| **Module Governance** | `adminModuleGovernanceService` | `analyticsOps.ts` | `adminAuditService` (`ADMIN_MODULE_*`) |
| **Security** | `adminSecurityService` | `analyticsOps.ts` | `adminAuditService` (`ADMIN_SECURITY_EVENT_RESOLVE`) |
| **Billing** | `adminBillingService` | `analyticsOps.ts` | None (read-heavy; mutations via billing platform) |
| **Analytics (admin)** | `adminAnalyticsService` | `core.ts`, `analyticsOps.ts`, `platform.ts` | `adminAuditService` (`ADMIN_AB_TEST_*`, etc.) |
| **Support** | `adminSupportService` | `platform.ts` | `adminAuditService` (`ADMIN_SUPPORT_TICKET_*`, etc.) |
| **System Ops** | `adminSystemOpsService` | `analyticsOps.ts`, `platform.ts` | `adminAuditService` (`ADMIN_SYSTEM_*`, dangerous migration) |
| **Performance** | `adminPerformanceService` | `platform.ts` | `adminAuditService` (`ADMIN_PERFORMANCE_*`) |
| **AI Pipeline (admin surface)** | `ai/pipeline/*` + `adminAiPipelineDiagnosticsService` | `adminPortalRoutes.aiPipeline.ts` | Pipeline policy audit via `listPipelinePolicyAudit` |

**Shared infrastructure (not domain owners):**

| Component | Role |
|-----------|------|
| `adminPortalShared.ts` | Auth gates, dangerous-op confirmation, audit context helpers |
| `adminPortalAuth.ts` | Canonical `requireAdmin` export |
| `adminAuditService` / `adminAuditTaxonomy` | Single audit write path + constants |
| `AdminService` (facade) | Legacy compatibility only — **not** admin-portal route owner |

---

## 3. Forbidden cross-domain patterns

| Pattern | Violation | Correct approach |
|---------|-----------|------------------|
| `prisma.*` in route handler | Route owns persistence | Call domain `admin*Service` |
| `auditLog.create` outside `adminAuditService` | Audit bypass | Use `log*Audit` helpers |
| Route imports another route file for business logic | Hidden coupling | Import service layer |
| Admin route duplicates `ai/pipeline` mutation logic | AI boundary breach | Call `pipelineCatalogService` / `pipelineRegistryService` |
| `AdminService` in admin-portal routes | Facade indirection | Import `admin/*Service` directly |
| Moderation handler calls `adminUserService` for writes | Cross-domain write | Compose in moderation service if needed |
| Satellite mount (`/api/admin/ai-providers`) merged without program | Ownership drift | Document in mount map; merge only via explicit program |

---

## 4. Enforcement mechanisms (1B-C)

| Mechanism | Location |
|-----------|----------|
| Static route governance tests | `admin-portal-route-governance.test.ts` |
| Facade purity test | `adminServiceFacade.test.ts` |
| Audit taxonomy conformance | `adminAuditTaxonomy.test.ts` |
| Route source assertions | `admin-portal-system-ops-performance-route.test.ts` |

---

## 5. Legacy consumers (documented exceptions)

| Consumer | Current | Target |
|----------|---------|--------|
| `contentReportController.ts` | `AdminService.createContentReport` | Optional: `adminModerationService` direct import |
| Certification tests | `AdminService` facade | Acceptable for backward-compat contract tests |

---

## 6. Cross-references

- [Route Architecture Standard](./ADMIN_PORTAL_ROUTE_ARCHITECTURE_STANDARD.md)
- [Controller Governance Assessment](./ADMIN_PORTAL_CONTROLLER_GOVERNANCE_ASSESSMENT.md)
- [Audit Taxonomy](./ADMIN_PORTAL_AUDIT_TAXONOMY.md)
- [Controller Governance Standard](./ADMIN_PORTAL_CONTROLLER_GOVERNANCE_STANDARD.md) (blueprint)

**Model close:** Ownership map authoritative for Stage 1B-C. Physical route file splits are advisory follow-up.
