# Admin Portal — Test Architecture

**Program:** Stage 1B — Governance Architecture Blueprint  
**Date:** 2026-06-17  
**Findings addressed:** AP-F-027, AP-F-030  
**Constraint:** Architecture design only — no new test implementation in blueprint program

---

## 1. Current testing inventory

### 1.1 Server — route integration tests

| File | Domain | Est. cases | Type |
|------|--------|----------:|------|
| `admin-portal.test.ts` | General | ~15 | HTTP |
| `admin-portal-auth-consolidation.test.ts` | Auth | ~8 | Static + HTTP |
| `admin-portal-user-management.test.ts` | Users | ~10 | HTTP |
| `admin-user-management.integration.test.ts` | Users | ~12 | HTTP |
| `admin-portal-impersonation.test.ts` | Impersonation | ~10 | HTTP |
| `admin-moderation.integration.test.ts` | Moderation | ~8 | HTTP |
| `admin-portal-moderation.test.ts` | Moderation | ~6 | HTTP |
| `admin-portal-dashboard-stats-health.test.ts` | Dashboard | ~6 | HTTP |
| `admin-portal-system-health.test.ts` | System | ~5 | HTTP |
| `admin-portal-dangerous-migration-ops.test.ts` | Dangerous ops | ~8 | HTTP |
| `admin-portal-debug-gate.test.ts` | Debug gate | ~6 | HTTP |
| `admin-portal-support-customer-auth.test.ts` | Support auth | ~4 | HTTP |
| `admin-portal-security-events-route.test.ts` | Security | ~5 | HTTP |
| `admin-analytics.integration.test.ts` | Analytics | ~8 | HTTP |
| `admin-portal-ai-pipeline.test.ts` | AI Pipeline | **8** | HTTP smoke |
| `aiContextDebugTransitional.test.ts` | Debug API | 9 | HTTP |
| `aiCentralizedAdminFence.test.ts` | Retired mount | ~28 | HTTP |

**Server total:** ~17 files, **~150+** cases (including `it.each` expansions).

### 1.2 Web — hygiene tests (static analysis)

| File | Cases | Type |
|------|------:|------|
| `adminPortalCentralizedAiRetirement.test.ts` | 7 | Source grep |
| `adminPortalAiControlPlaneUx.test.ts` | 7 | Source grep |
| `adminPortalDiagnosticsOwnership.test.ts` | 6 | Source grep |
| `adminPortalAiPipelineConsolidation.test.ts` | 5 | Source grep |
| `adminPortalProviderGovernance.test.ts` | 5 | Source grep |
| `adminPortalBoundaryCleanup.test.ts` | varies | Source grep |
| `adminPortalRegistryCleanup.test.ts` | varies | Source grep |
| `adminPortalMockFallbackHygiene.test.ts` | varies | Source grep |
| `adminPortalDebugGate.test.ts` | varies | Source grep |
| `adminPortalDashboard.test.ts` | varies | Source grep |

**Web total:** ~10 files, **~32+** explicit cases — **zero UI render tests**.

### 1.3 Service unit tests

| File | Domain |
|------|--------|
| `adminServiceMockFallback.test.ts` | AdminService mock hygiene |
| `moduleApprovalCertificationGate.test.ts` | Module cert |
| `moduleVersionPromotionCertification.test.ts` | Module version |

**Gap:** No unit tests on extracted admin domain services (none exist yet).

---

## 2. Coverage analysis

### 2.1 Canonical operations (151)

| Coverage type | Estimated % | Notes |
|---------------|------------:|-------|
| HTTP integration (any test) | **~35%** | Strong on users/impersonation/moderation; weak on billing/support/performance |
| HTTP integration (mutation + authZ) | **~25%** | |
| Audit assertion | **~5%** | Impersonation tests partial |
| Policy Engine | **0%** | N/A until 1B-C decision |

### 2.2 AI Pipeline (45 handlers) — AP-F-030

| Tested | Untested (examples) |
|--------|---------------------|
| catalog, registry/graph, diagnostics, quality/stats, retention, suggestions/metrics | policy CRUD, test-lab POST, context-providers/health, compliance routes, experiments |

**Coverage:** **8/45 = 18%** — **PARTIAL**.

### 2.3 Frontend — AP-F-027

| Surface | Test type | Status |
|---------|-----------|--------|
| Admin pages (39) | Component/render | **0** |
| Redirect stubs | Static grep | ✅ |
| Launcher integrity | Static grep | ✅ |
| Form mutations (support, modules) | E2E/component | **Missing** |

---

## 3. Target test architecture

### 3.1 Pyramid

```
                    ┌─────────────┐
                    │  E2E smoke  │  (5–10 critical flows)
                   ┌┴─────────────┴┐
                   │  HTTP integration │  (per domain, per mutation)
                  ┌┴─────────────────┴┐
                  │  Service unit tests  │  (extracted admin services)
                 ┌┴────────────────────┴┐
                 │  Hygiene / static guards  │  (existing — keep)
                 └──────────────────────────┘
```

### 3.2 Test categories

| Category | Scope | Target |
|----------|-------|--------|
| **Route integration** | `supertest` + `createTestApp()` | Every domain router file |
| **Authorization** | Admin vs non-admin vs unauthenticated | 100% mutation routes |
| **Policy tests** | If PE adopted | All `admin_*` actions |
| **AI Pipeline tests** | All 45 handlers | 100% smoke; 80% mutation depth |
| **Dangerous operation tests** | Env-gated ops | Existing + audit assertion |
| **Audit tests** | `ADMIN_*` emission | P0 mutations 100% |
| **Frontend smoke** | Critical pages load + redirect | 10 pages minimum |

### 3.3 File naming convention

```
server/src/routes/__tests__/admin-portal-{domain}.integration.test.ts
server/src/services/admin/__tests__/admin{Domain}Service.test.ts
web/src/app/admin-portal/__tests__/{page}.smoke.test.tsx  (minimal)
```

### 3.4 CI gates (post-1B-D)

| Gate | Threshold |
|------|-----------|
| Domain integration | Each extracted service domain has ≥1 test file |
| Pipeline handlers | ≥40/45 HTTP cases |
| Mutation authZ | 100% deny test for non-admin |
| Audit P0 | 100% impersonation + dangerous ops assert audit |
| Frontend | ≥5 page smoke tests |

---

## 4. Coverage gaps (priority)

| Priority | Gap | Finding |
|----------|-----|---------|
| **P0** | AI Pipeline 37 untested handlers | AP-F-030 |
| **P0** | Impersonation audit assertions incomplete | AP-F-013 |
| **P1** | Billing HTTP tests | AP-F-014 |
| **P1** | Support HTTP tests | AP-F-014 |
| **P1** | Performance HTTP tests | AP-F-014 |
| **P1** | `adminSecurityRoutes` full matrix | AP-F-014 |
| **P2** | ai-provider-usage HTTP | AP-F-014 |
| **P2** | Frontend page smoke | AP-F-027 |
| **P3** | Service unit tests post-extraction | AP-F-004 helper |

---

## 5. Required coverage (1B exit)

| Domain | Min HTTP cases | AuthZ deny | Audit assert |
|--------|---------------:|:----------:|:------------:|
| Users | 8 | ✅ | ✅ |
| Impersonation | 12 | ✅ | ✅ |
| Moderation | 8 | ✅ | ✅ |
| Modules | 10 | ✅ | ✅ |
| Billing | 6 | ✅ | ✅ |
| Support | 8 | ✅ | partial |
| Security | 7 | ✅ | ✅ |
| System/dangerous | 10 | ✅ | ✅ |
| Analytics | 8 | ✅ | — |
| Performance | 6 | ✅ | — |
| AI Pipeline | **45** | ✅ | policy writes |
| **Frontend smoke** | **5** | n/a | n/a |

**Total target:** **~130+** new/expanded HTTP cases + **5** frontend smoke.

---

## 6. AP-F-027 / AP-F-030 closure criteria

| Finding | Close when |
|---------|------------|
| **AP-F-030** | ≥40/45 pipeline handlers have HTTP tests; test-lab POST covered |
| **AP-F-027** | ≥5 admin page smoke tests; critical mutation pages (impersonate, modules review) covered |

**Do not downgrade AP-F-030** until pipeline matrix ≥80%.

---

## References

- [`ADMIN_PORTAL_AI_ADMIN_TEST_MATRIX.md`](./ADMIN_PORTAL_AI_ADMIN_TEST_MATRIX.md)
- [`ADMIN_PORTAL_OPERATION_MATRIX.md`](./ADMIN_PORTAL_OPERATION_MATRIX.md)
