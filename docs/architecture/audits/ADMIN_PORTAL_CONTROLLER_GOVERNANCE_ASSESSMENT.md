# Admin Portal Controller Governance Assessment

**Program:** Stage 1B-C — Controller Governance & Route Architecture  
**Date:** 2026-06-17  
**Prior state:** [1B-A/B Closure Assessment](./ADMIN_PORTAL_1B_A_B_CLOSURE_ASSESSMENT.md) — 12 route-level `prisma.` calls  
**Post-1B-C:** **0** route-level `prisma.` calls in `server/src/routes/admin-portal/`

---

## 1. Executive summary

Stage 1B-C eliminated all direct persistence from admin-portal route modules. Migration mutations, impersonation target validation, and AI pipeline diagnostics legacy reads were extracted into domain services. Route files remain large by LOC (orchestration + error mapping), but no longer own Prisma writes or business rules for remediated paths.

**Top offenders (pre-1B-C):** `adminPortalRoutes.platform.ts` (8 Prisma), `adminPortalRoutes.aiPipeline.ts` (3), `adminPortalShared.ts` (1).

**Post-1B-C:** All three remediated to **0** direct `prisma.` calls.

---

## 2. Route file scorecard

| Route File | LOC | Handlers | Prisma Calls (post) | Service Delegation % | Risk |
|------------|-----|----------|---------------------|----------------------|------|
| `adminPortalRoutes.core.ts` | 472 | 16 | **0** | ~100% (`adminImpersonationService`, `adminUserService`, `adminModerationService`, `adminAnalyticsService`) | **Low** — thin orchestration |
| `adminPortalRoutes.analyticsOps.ts` | 1,289 | 44 | **0** | ~93% (41 service calls / 44 handlers) | **Medium** — large file; handlers delegate |
| `adminPortalRoutes.platform.ts` | 1,588 | 38 | **0** | ~100% (support, analytics, performance, system ops services) | **Medium** — large file; migration ops now in `adminSystemOpsService` |
| `adminPortalRoutes.aiPipeline.ts` | 1,203 | 45 | **0** | ~95% (`ai/pipeline/*` domain + `adminAiPipelineDiagnosticsService` for diagnostics reads) | **Medium** — AI domain services; not `admin/*` for catalog/registry |
| `adminPortalShared.ts` | 147 | 0 | **0** | N/A (auth/gate helpers only) | **Low** — no persistence |
| `adminPortalAuth.ts` | 30 | 0 | **0** | N/A | **Low** |
| `adminPortalDebugGate.ts` | 19 | 0 | **0** | N/A | **Low** |

**Delegation % methodology:** Count of `admin*Service.*` (and `adminAiPipelineDiagnosticsService.*`) invocations divided by HTTP handler count. AI Pipeline routes additionally call `ai/pipeline/*` services per ownership model (see [Ownership Enforcement Model](./ADMIN_PORTAL_OWNERSHIP_ENFORCEMENT_MODEL.md)).

---

## 3. Extractions performed (1B-C.4)

| Source | Extracted to | Operations |
|--------|--------------|------------|
| `adminPortalShared.ts` | `adminImpersonationService.ts` | `validateImpersonationTarget` (user lookup + deny rules) |
| `adminPortalRoutes.platform.ts` | `adminSystemOpsService.ts` | `fixFailedMigrations`, `deleteMigrationRecords`, `resetMigrationBaseline`, `runMigrationsManually` |
| `adminPortalRoutes.aiPipeline.ts` | `adminAiPipelineDiagnosticsService.ts` | `listAdminPipelineDiagnostics`, `getAdminPipelineDiagnosticByTraceId` |
| `adminPortalRoutes.analyticsOps.ts` | — | Removed dead `prisma` / `crypto` / `bcrypt` imports (no calls) |

---

## 4. Remaining architectural residue (advisory)

| Item | Severity | Notes |
|------|----------|-------|
| Route file LOC >500 | advisory | `platform`, `analyticsOps`, `aiPipeline` exceed controller standard LOC targets; splitting deferred (no API contract change in 1B-C) |
| `contentReportController` uses `AdminService` facade | advisory | Non–admin-portal consumer; optional direct `adminModerationService` import |
| AI Pipeline routes call `ai/pipeline/*` in-process | by design | S4 in controller standard — admin routes orchestrate, AI domain owns pipeline logic |

---

## 5. Test evidence

| Test | Assertion |
|------|-----------|
| `admin-portal-route-governance.test.ts` | Zero `prisma.` in core, analyticsOps, platform, shared; migration + diagnostics delegation |
| `admin-portal-system-ops-performance-route.test.ts` | Platform migration routes delegate; no `$queryRaw`/`$executeRaw` in route source |
| `admin-portal-dangerous-migration-ops.test.ts` | HTTP gates + no SQL exposure (integration) |
| `adminImpersonationService.test.ts` | Validation via service; no `adminPortalShared` mock |

---

## 6. AP-F-004 reassessment

| Criterion | Post-1B-C |
|-----------|-----------|
| Route-level Prisma | **0** across admin-portal tree |
| Business logic in routes (remediated paths) | **Extracted** |
| Service ownership | **Enforced** for impersonation, system ops migrations, pipeline diagnostics |
| Fat route LOC | **Advisory residue** — file split not required for closure |

**Verdict:** **CLOSED** for route/controller persistence and boundary criteria. LOC split tracked as advisory hygiene.

---

## 7. Cross-references

- [Route Architecture Standard](./ADMIN_PORTAL_ROUTE_ARCHITECTURE_STANDARD.md)
- [Ownership Enforcement Model](./ADMIN_PORTAL_OWNERSHIP_ENFORCEMENT_MODEL.md)
- [Policy Engine Position](./ADMIN_PORTAL_POLICY_ENGINE_POSITION.md)

**Assessment close:** Controller governance remediation complete for in-scope route Prisma and business logic.
