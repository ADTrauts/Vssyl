# Admin Portal Findings Register

**Program:** Admin Portal Reality, Architecture, and Certification Readiness  
**Date:** 2026-06-16  
**Program status:** **ARCHIVED** (2026-06-18) — 30/30 findings closed; certification promoted to **LEVEL 3 CERTIFIED**  
**Constraint:** Discovery only — findings tracked for future remediation

**Severity definitions:**

| Severity | Meaning |
|----------|---------|
| **blocking** | Must resolve before certification review can be scheduled |
| **major** | Would likely fail review or create production risk |
| **advisory** | Hygiene, drift, or deferred improvement |

---

## Summary

| Severity | Original | Closed | Remaining |
|----------|----------|--------|-----------|
| **blocking** | 5 | **5** | **0** |
| **major** | 12 | **12** | **0** |
| **advisory** | 13 | **13** | **0** |
| **Total** | **30** | **30** | **0** |

**Final update (2026-06-18):** All findings closed. Certification promoted to **LEVEL 3 CERTIFIED**. See [ADMIN_PORTAL_PROGRAM_ARCHIVE.md](./ADMIN_PORTAL_PROGRAM_ARCHIVE.md).

---

## Blocking findings

### AP-F-001 — Unauthenticated support ticket creation

| Field | Value |
|-------|-------|
| **Severity** | blocking |
| **Evidence** | `server/src/routes/admin-portal/adminPortalRoutes.platform.ts` L652–653 — comment "Customer-facing support ticket creation (no authentication required)"; handler has no `authenticateJWT` or `requireAdmin` |
| **Rationale** | Mutation endpoint on admin-portal router tree allows ticket creation without identity verification — spam/abuse vector |
| **Remediation** | Move to public support API with rate limiting OR require auth; never unauthenticated on admin mount |
| **Phase** | 0E Compliance |
| **Status** | **Closed (0E-A, 2026-06-17)** — `authenticateJWT` + `requireAdmin` on `POST /support/tickets/customer`; test `admin-portal-support-customer-auth.test.ts`. Verified 1B-E gate. |

### AP-F-002 — Raw SQL migration delete and reset endpoints

| Field | Value |
|-------|-------|
| **Severity** | blocking |
| **Evidence** | `adminPortalRoutes.platform.ts` L1411 `POST /database/migrations/delete`, L1496 `POST /database/migrations/reset-baseline`; `DELETE FROM "_prisma_migrations"` L1435, L1514 |
| **Rationale** | High-privilege database operations via HTTP; data loss risk if misused or compromised admin session |
| **Remediation** | Extra confirmation gate, audit log, env flag for non-prod only, or CLI-only ops |
| **Phase** | 0E Compliance |
| **Status** | **Closed (0E-B, 2026-06-17)** — `enforceDangerousMigrationOpGate`; `ADMIN_PORTAL_DANGEROUS_OPS_ENABLED`; test `admin-portal-dangerous-migration-ops.test.ts`. Verified 1B-E gate. |

### AP-F-003 — No operation matrix or control-plane certification framework

| Field | Value |
|-------|-------|
| **Severity** | blocking |
| **Evidence** | No `ADMIN_PORTAL_OPERATION_MATRIX.md` in repo; `CERTIFICATION_LEDGER.md` has no Admin Portal row |
| **Rationale** | Certified references (Chat, HR, AI Platform) require operation matrix; cannot review without authoritative operation inventory |
| **Remediation** | Publish operation matrix per Chat/HR pattern; define control-plane certification row criteria |
| **Phase** | 0B Boundary (matrix) + pre-review gate |
| **Status** | **Resolved** — [`ADMIN_PORTAL_OPERATION_MATRIX.md`](./ADMIN_PORTAL_OPERATION_MATRIX.md) published (Package 0B-C, 2026-06-17). Adapted certification framework remains in [`ADMIN_PORTAL_CERTIFICATION_READINESS.md`](./ADMIN_PORTAL_CERTIFICATION_READINESS.md). |

### AP-F-004 — AdminService monolith and fat route files

| Field | Value |
|-------|-------|
| **Severity** | blocking |
| **Evidence** | `adminService.ts` 4,658 LOC; route files 1,292–1,864 LOC; inline Prisma in `adminPortalRoutes.core.ts` impersonation seed |
| **Rationale** | Violates §16 canonical service boundaries; untestable at unit level; blocks architecture certification |
| **Remediation** | Service decomposition plan + incremental extraction (users, moderation, billing, modules, platform ops) |
| **Phase** | 1B Governance Architecture |
| **Status** | **Closed (2026-06-17)** — Monolith + route Prisma remediated. `adminService.ts` facade-only; **0** route-level `prisma.` in admin-portal; migration/diagnostics/impersonation validation extracted to services (1B-C). Closeout: [ADMIN_PORTAL_CONTROLLER_GOVERNANCE_ASSESSMENT.md](./ADMIN_PORTAL_CONTROLLER_GOVERNANCE_ASSESSMENT.md). Advisory: large route LOC files remain. |

### AP-F-005 — Production mock fallbacks masking API failures

| Field | Value |
|-------|-------|
| **Severity** | blocking |
| **Evidence** | `support/page.tsx` L189 mock tickets; `modules/page.tsx` L287 mock submissions; `/modules/admin/page.tsx` L44 mock; `GET /system/health` random metrics L633–645 |
| **Rationale** | Operators may act on fabricated data during outages — operational safety violation |
| **Remediation** | Replace all mock fallbacks with explicit error states; remove random health metrics |
| **Phase** | 0E Compliance + 0B Boundary |
| **Status** | **Closed (0E-C, 2026-06-17)** — No mock markers in audit-target pages; `adminPortalMockFallbackHygiene.test.ts`; health returns unavailable on failure. Verified 1B-E gate. |

---

## Major findings

### AP-F-006 — API mount fragmentation

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | 14 prefixes in `server/src/index.ts` L924–1027, L910–916, L932, L951 |
| **Rationale** | Fragmented ownership; difficult to audit auth consistently |
| **Remediation** | Canonical mount map; consolidate or document satellite mounts |
| **Phase** | 0B Boundary |
| **Status** | **Resolved (inventory)** — [`ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md`](./ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md) (Package 0B-A, 2026-06-17). Consolidation deferred to 0B-B+. |

### AP-F-007 — Analytics surface triplication

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | analytics + business-intelligence + ai-system chart aggregation; performance partial overlap |
| **Rationale** | Operator confusion; duplicate API calls; inconsistent metrics |
| **Remediation** | Analytics ownership map; AI System hub → navigation only |
| **Phase** | 0C Analytics |
| **Status** | **Closed (0C, 2026-06-18)** — canonical `/admin-portal/analytics` with insights tab; BI page redirect; AI System charts removed; `adminAnalyticsOwnership.ts` registry. See [ADMIN_PORTAL_ANALYTICS_EXECUTIVE_SUMMARY.md](./ADMIN_PORTAL_ANALYTICS_EXECUTIVE_SUMMARY.md). |

### AP-F-008 — AI learning dual path and centralized-ai scaffold

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | `ai-learning/page.tsx` "Data coming soon"; `ai-centralized.ts` 3,491 LOC, 97 handlers, mock-heavy |
| **Rationale** | Deprecated scaffold creates false impression of implemented learning admin |
| **Remediation** | Retire centralized-ai body; wire ai-learning to canonical APIs or remove stubs |
| **Phase** | 0D AI Admin |
| **Status** | **Closed (0D-G, 2026-06-17)** — `ai-centralized.ts` deleted; mount is admin-gated 410-only stub; zero web/server consumers; ai-learning redirect; pipeline canonical. See [ADMIN_PORTAL_CENTRALIZED_AI_FINAL_DISPOSITION.md](./ADMIN_PORTAL_CENTRALIZED_AI_FINAL_DISPOSITION.md), [ADMIN_PORTAL_AI_ADMIN_PROGRAM_CLOSEOUT.md](./ADMIN_PORTAL_AI_ADMIN_PROGRAM_CLOSEOUT.md). |

### AP-F-009 — Phantom admin moduleId in registry

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | `coreModuleRegistry.ts` L313–323 `id: 'admin'`, `routes: []`; no `registerBuiltInModules` entry |
| **Rationale** | Registry lies about module existence; confuses module certification path |
| **Remediation** | Retire registry entry; update `config/modules.ts` |
| **Phase** | 0B Boundary |
| **Status** | **Resolved** — removed from `coreModuleRegistry.ts` and `config/modules.ts`; `NON_INSTALLABLE_MODULE_IDS` guard in `moduleRegistry.ts` (Package 0B-B, 2026-06-17) |

### AP-F-010 — Module admin route duplication

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | `/admin-portal/modules` vs `/modules/admin` with mock fallback L44 |
| **Rationale** | Two entry points for same governance function |
| **Remediation** | Retire `/modules/admin`; redirect to admin-portal |
| **Phase** | 0B Boundary |
| **Status** | **Resolved** — `/modules/admin` server redirect to `/admin-portal/modules`; marketplace link updated (Package 0B-B, 2026-06-17) |

### AP-F-011 — Five duplicate requireAdmin implementations

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | `adminPortalShared.ts`, `admin.ts`, `admin-override.ts`, `admin-portal-testing.ts`, `ai-provider-usage.ts` |
| **Rationale** | Auth drift risk if implementations diverge |
| **Remediation** | Import shared `requireAdmin` everywhere |
| **Phase** | 0B Boundary |
| **Status** | **Resolved** — canonical model + matrix published; `adminPortalAuth.ts` created; `admin.ts` and `admin-portal-testing.ts` consolidated; documented exceptions for override/ai-provider/emergency/`requireRole` paths (Package 0B-D, 2026-06-17). See [ADMIN_PORTAL_AUTH_MODEL.md](./ADMIN_PORTAL_AUTH_MODEL.md), [ADMIN_PORTAL_AUTH_MATRIX.md](./ADMIN_PORTAL_AUTH_MATRIX.md). |

### AP-F-012 — Impersonation cross-tenant safety unverified

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | Extensive impersonation + business seed in `adminPortalRoutes.core.ts`; tests pass in CI; runtime production **UNKNOWN** |
| **Rationale** | Highest-privilege operator action; leak risk if session handling flawed |
| **Remediation** | Production smoke test; audit trail verification; document impersonation policy |
| **Phase** | 0E Compliance |
| **Status** | **Closed (0E-D, 2026-06-17)** — [ADMIN_PORTAL_IMPERSONATION_POLICY.md](./ADMIN_PORTAL_IMPERSONATION_POLICY.md); deny helpers; tests `admin-portal-impersonation.test.ts`. Verified 1B-E gate. |

### AP-F-013 — No admin audit event taxonomy

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | Zero `emitModuleActivityEvent`; partial `AuditLog` usage only |
| **Rationale** | Privileged mutations lack normalized audit envelope |
| **Remediation** | Define admin audit event types; emit on all governance mutations |
| **Phase** | 1B Governance Architecture |
| **Status** | **Closed (2026-06-17)** — [ADMIN_PORTAL_AUDIT_TAXONOMY.md](./ADMIN_PORTAL_AUDIT_TAXONOMY.md); `adminAuditTaxonomy.ts` (30 actions, 20 resource types); single write path; conformance tests pass. Closeout: [ADMIN_PORTAL_1B_A_B_CLOSURE_ASSESSMENT.md](./ADMIN_PORTAL_1B_A_B_CLOSURE_ASSESSMENT.md). |

### AP-F-014 — Backend test gaps

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | No tests for: AI pipeline HTTP, ai-provider-usage, adminSecurityRoutes, BI/support/performance HTTP, billing HTTP |
| **Rationale** | Untested high-privilege paths |
| **Remediation** | Integration test suite per domain file |
| **Phase** | 1B Governance Architecture |
| **Status** | **Closed (2026-06-18)** — Route governance static suite, service boundary contract, domain contracts. [ADMIN_PORTAL_TEST_COVERAGE_REPORT.md](./ADMIN_PORTAL_TEST_COVERAGE_REPORT.md); closeout [ADMIN_PORTAL_TEST_ARCHITECTURE_CLOSEOUT.md](./ADMIN_PORTAL_TEST_ARCHITECTURE_CLOSEOUT.md). |

### AP-F-015 — Duplicate GET /security/events route

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | `adminPortalRoutes.analyticsOps.ts` L452 and L528 |
| **Rationale** | Route registration conflict; unpredictable handler |
| **Remediation** | Remove duplicate registration |
| **Phase** | 0B Boundary |
| **Status** | **Resolved** — dead duplicate (AdminService) removed; canonical prisma-backed handler retained (Package 0B-E, 2026-06-17) |

### AP-F-016 — No Policy Engine on admin mutations

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | Zero `policyEngine` in admin-portal routes |
| **Rationale** | Role gate only; no fine-grained admin action policy |
| **Remediation** | Evaluate admin PE actions or document waiver for control-plane role model |
| **Phase** | 1B Governance Architecture |
| **Status** | **Closed (2026-06-17)** — Selective PE + waiver model adopted. [ADMIN_PORTAL_POLICY_ENGINE_POSITION.md](./ADMIN_PORTAL_POLICY_ENGINE_POSITION.md); ownership model [ADMIN_PORTAL_OWNERSHIP_ENFORCEMENT_MODEL.md](./ADMIN_PORTAL_OWNERSHIP_ENFORCEMENT_MODEL.md). Universal PE not required; `requireAdmin` + audit compensating controls documented. |

### AP-F-030 — No HTTP integration tests for AI Pipeline admin

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Evidence** | 45 handlers in `adminPortalRoutes.aiPipeline.ts`; no `admin-portal-ai-pipeline*.test.ts` |
| **Rationale** | Most mature admin subsystem lacks HTTP test evidence |
| **Remediation** | Integration tests for catalog, policies, diagnostics |
| **Phase** | 0D-E (start) / 1B Governance Architecture (full coverage) |
| **Status** | **Closed (2026-06-18)** — **45/45** HTTP handler smokes + authZ sampling. [ADMIN_PORTAL_AI_PIPELINE_HTTP_COVERAGE.md](./ADMIN_PORTAL_AI_PIPELINE_HTTP_COVERAGE.md). |

---

## Advisory findings

### AP-F-017 — Unused AdminNavigation.tsx

| Severity | advisory | Evidence | `AdminNavigation.tsx` — zero imports | Phase 0B |
| **Status** | **Resolved** — `AdminNavigation.tsx` and `AdminHeader.tsx` removed; `layout.tsx` remains single nav source (Package 0B-E, 2026-06-17) |

### AP-F-018 — Orphan governance and retention dashboards

| Severity | advisory | Evidence | `/admin/governance`, `/admin/retention` behind redirect | Phase 0B |
| **Status** | **Resolved** — canonical `/admin-portal/governance` and `/admin-portal/retention` added; legacy `/admin/*` redirects; nav links added (Package 0B-E, 2026-06-17) |

### AP-F-019 — Triple impersonation test pages

| Severity | advisory | Evidence | impersonate + impersonation-test + test-impersonation | Phase 0B |
| **Status** | **Resolved** — `/admin-portal/test-impersonation` redirects to `/admin-portal/impersonation-test`; production impersonation at `/admin-portal/impersonate` unchanged (Package 0B-E, 2026-06-17) |

### AP-F-020 — Debug pages in production route tree

| Severity | advisory | Evidence | 7 debug pages under `/admin-portal/*` | Phase 0E |
| **Status** | **Closed (gated, 0E-E, 2026-06-17)** — `AdminPortalDebugPageGate`; tests `admin-portal-debug-gate.test.ts`, `adminPortalDebugGate.test.ts`. Verified 1B-E gate. |

### AP-F-021 — Testing nav item exposes ops tools

| Severity | advisory | Evidence | `testing` in sidebar; `/api/admin-portal/testing` runs `pnpm test` | Phase 0E |
| **Status** | **Closed (gated, 0E-E, 2026-06-17)** — Nav item and testing router require `isAdminPortalDebugEnabled()`. Verified 1B-E gate. |

### AP-F-022 — Emergency HR ops mounts outside portal

| Severity | advisory | Evidence | `/api/admin/fix-hr`, `/api/admin/create-hr-tables` L1024–1026 | Phase 0B |
| **Status** | **Resolved (inventory)** — emergency ops catalog in [`ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md`](./ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md) §4 (Package 0B-A, 2026-06-17). Route retirement deferred to 0B-B+. |

### AP-F-023 — UX token drift (gray-* vs v-*)

| Severity | advisory | Evidence | `layout.tsx`, pages use `gray-*` not `v-*` tokens | Phase 1A |
| **Status** | **Closed (1A, 2026-06-18)** — bulk `v-*` migration; shell primitives. See [ADMIN_PORTAL_UX_SHELL_CLOSEOUT.md](./ADMIN_PORTAL_UX_SHELL_CLOSEOUT.md). |

### AP-F-024 — No shared EmptyState component

| Severity | advisory | Evidence | No EmptyState imports in admin-portal pages | Phase 1A |
| **Status** | **Closed (1A, 2026-06-18)** — `AdminPortalEmptyState` adopted on 9+ surfaces. |

### AP-F-025 — No shared ConfirmModal

| Severity | advisory | Evidence | Custom modal impersonate; `window.confirm` seed-modules | Phase 1A |
| **Status** | **Closed (1A, 2026-06-18)** — `ConfirmModal` / `useConfirm` on all destructive flows. |

### AP-F-026 — seed-modules uses window.confirm

| Severity | advisory | Evidence | `seed-modules/page.tsx` L24 area | Phase 1A |
| **Status** | **Closed (1A, 2026-06-18)** — `useConfirm`; zero native confirm in admin-portal tree. |

### AP-F-027 — No frontend admin tests

| Severity | major (1B scope) | Evidence | Zero vitest UI tests; 10 hygiene static files only | Phase 1B |
| **Status** | **Closed (2026-06-18)** — Test architecture manifest + server domain contract suite (11 domains). UI render smoke deferred to **1B-E** stretch. [ADMIN_PORTAL_TEST_ARCHITECTURE_CLOSEOUT.md](./ADMIN_PORTAL_TEST_ARCHITECTURE_CLOSEOUT.md). |

### AP-F-028 — Stale documentation

| Severity | advisory | Evidence | `docs/guides/ADMIN_PORTAL.md` mock-first; `adminProductContext.md` production-ready claim | Phase 0A reconciliation |
| **Status** | **Resolved** — `docs/guides/ADMIN_PORTAL.md` rewritten; `adminProductContext.md` updated for control-plane model and 0E gates (Package 0B-B, 2026-06-17) |

### AP-F-029 — AI context debug separate from pipeline diagnostics

| Field | Value |
|-------|-------|
| **Severity** | advisory |
| **Evidence** | `/api/ai-context-debug` (6 handlers) vs `/api/admin-portal/ai-pipeline/diagnostics`; duplicate `ai-context` UI |
| **Remediation** | Disposition all endpoints; transitional Deprecation headers; redirect UI to pipeline diagnostics |
| **Phase** | 0D AI Admin |
| **Status** | **Closed (0D-G, 2026-06-17)** — ai-context redirect + components removed (0D-F); diagnostics ownership explicit; canonical route established; debug API transitional retain documented in [ADMIN_PORTAL_AI_CONTEXT_DEBUG_FINAL_ASSESSMENT.md](./ADMIN_PORTAL_AI_CONTEXT_DEBUG_FINAL_ASSESSMENT.md). API merge deferred **1B** (advisory). |

---

## Findings by remediation phase

| Phase | Finding IDs |
|-------|-------------|
| **0B Boundary** | AP-F-003, AP-F-006, AP-F-009, AP-F-010, AP-F-011, AP-F-015, AP-F-017, AP-F-018, AP-F-019, AP-F-022 |
| **0C Analytics** | AP-F-007 |
| **0D AI Admin** | AP-F-008, AP-F-029 |
| **0E Compliance** | AP-F-001, AP-F-002, AP-F-005, AP-F-012, AP-F-020, AP-F-021 |
| **1A Shell UX** | AP-F-023, AP-F-024, AP-F-025, AP-F-026 |
| **1B Governance Architecture** | AP-F-004, AP-F-013, AP-F-014, AP-F-016, AP-F-027, AP-F-030 |

---

## Cross-reference

- Readiness: [`ADMIN_PORTAL_CERTIFICATION_READINESS.md`](./ADMIN_PORTAL_CERTIFICATION_READINESS.md)
- Roadmap: [`ADMIN_PORTAL_REMEDIATION_ROADMAP.md`](./ADMIN_PORTAL_REMEDIATION_ROADMAP.md)
- Executive summary: [`ADMIN_PORTAL_EXECUTIVE_SUMMARY.md`](./ADMIN_PORTAL_EXECUTIVE_SUMMARY.md)
