# Admin Portal — Certification Readiness Gate (G1–G9)

**Package:** 1B-E — Certification Readiness Gate  
**Date:** 2026-06-18  
**Authority:** Adapted Platform Control Plane framework ([ADMIN_PORTAL_CERTIFICATION_READINESS.md](./ADMIN_PORTAL_CERTIFICATION_READINESS.md))  
**Constraint:** Gate assessment only — **no certification awarded**; no `CERTIFICATION_LEDGER.md` updates

---

## Readiness outcome

# READY FOR CERTIFICATION REVIEW

Admin Portal meets the adapted control-plane threshold for scheduling a **formal certification evaluation program**:

- **Zero blocking findings**
- **Weighted gate score ~89% (24/27)** — above the ≥85% review threshold
- **G1–G8 PASS** on repository-verified evidence
- **G9 FAIL** — expected; UX shell is **1A scope** and does not block control-plane certification per framework §1.2

**One major finding remains (AP-F-007)** — analytics surface triplication (0C). Recommend **documented waiver** for control-plane certification or complete 0C before evaluation if analytics consolidation is in scope for reviewers.

---

## Gate scorecard

| Gate | Status | Evidence | Finding impact |
|------|--------|----------|----------------|
| **G1 Authorization** | **PASS** | `POST /support/tickets/customer` requires `authenticateJWT` + `requireAdmin` (`adminPortalRoutes.platform.ts` L653); canonical `requireAdmin` in `adminPortalShared.ts`; auth matrix [ADMIN_PORTAL_AUTH_MATRIX.md](./ADMIN_PORTAL_AUTH_MATRIX.md); tests `admin-portal-support-customer-auth.test.ts`, `admin-portal-auth-consolidation.test.ts` | AP-F-001 **Closed** (0E-A); AP-F-011 **Closed** (0B-D) |
| **G2 Audit trail** | **PASS** | `adminAuditTaxonomy.ts` (30 actions, 20 resource types); single `auditLog.create` in `adminAuditService.ts`; domain helpers (`logSystemOpsAudit`, `logImpersonationDeniedAudit`, etc.); tests `adminAuditTaxonomy.test.ts`, `adminAuditService.test.ts`, domain contract audit samples | AP-F-013 **Closed** (1B-B) |
| **G3 Service boundaries** | **PASS** | **0** `prisma.` in `server/src/routes/admin-portal/` (grep 2026-06-18); **0** `prisma.` in `adminService.ts` (706 LOC facade); 13 extracted `admin/*Service` modules; tests `admin-portal-route-architecture.test.ts`, `adminPortalServiceBoundary.contract.test.ts` | AP-F-004 **Closed** (1B-C); advisory: large route LOC files remain |
| **G4 API coherence** | **PASS** | [ADMIN_PORTAL_OPERATION_MATRIX.md](./ADMIN_PORTAL_OPERATION_MATRIX.md); [ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md](./ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md); single `GET /security/events` registration (`analyticsOps.ts` L412); registry cleanup (AP-F-009) | AP-F-003 **Closed**; AP-F-006 **Resolved** (inventory); AP-F-015 **Closed** |
| **G5 Ownership** | **PASS** | [ADMIN_PORTAL_OWNERSHIP_BOUNDARY_ANALYSIS.md](./ADMIN_PORTAL_OWNERSHIP_BOUNDARY_ANALYSIS.md); AI Pipeline canonical; diagnostics ownership; centralized-ai 410 fence; provider satellite documented | AP-F-008 **Closed** (0D); AP-F-029 **Closed** (0D); AP-F-010 **Closed** (0B) |
| **G6 Test evidence** | **PASS** | **18** admin-portal route test files; **45/45** AI Pipeline HTTP (`admin-portal-ai-pipeline-coverage.test.ts`); domain contracts (11 domains); **11** web hygiene/manifest tests; **15+** admin domain service unit tests | AP-F-014 **Closed** (1B-D); AP-F-027 **Closed** (1B-D); AP-F-030 **Closed** (1B-D) |
| **G7 Documentation** | **PASS** | Operation matrix, audit taxonomy, route standard, controller governance, test coverage reports, impersonation policy, mount map, AI admin closeout | AP-F-003 **Closed**; AP-F-028 **Closed** (0B) |
| **G8 Production safety** | **PASS** | No mock-fallback markers in `web/src/app/admin-portal/**` (grep); `enforceDangerousMigrationOpGate` on migration delete/reset (`platform.ts` L1199+); `adminPortalDebugGate` + `requireAdminPortalDebugEnabled` on testing router; tests `admin-portal-dangerous-migration-ops.test.ts`, `admin-portal-debug-gate.test.ts`, `adminPortalMockFallbackHygiene.test.ts` | AP-F-002 **Closed** (0E-B); AP-F-005 **Closed** (0E-C); AP-F-020/021 **Closed (gated)** (0E-E) |
| **G9 UX shell** | **FAIL** | Widespread `gray-*` tokens (28 admin-portal pages); no shared `EmptyState` imports; custom confirm modal on impersonate only; `window.confirm` on seed-modules | AP-F-023–026 **Open** (1A); **does not block** control-plane review |

---

## Weighted score

| Milestone | Score | Notes |
|-----------|------:|-------|
| Pre-0E/0B (2026-06-16) | ~43% (9/21) | Original readiness assessment |
| Post-0E/0B | ~74% (20/27) | P0 compliance + boundary inventory |
| Post-1B (2026-06-18) | **~89% (24/27)** | G2, G3, G6 upgraded; G8 PASS on gated controls |

**Calculation:** 8 gates × 3 points = 24; G9 advisory = 0–1 point (scored 0 for strict threshold; advisory waiver documented).

---

## Repository verification (2026-06-18)

| Check | Result |
|-------|--------|
| `prisma.` in `server/src/routes/admin-portal/` | **0 matches** |
| `prisma.` in `server/src/services/adminService.ts` | **0 matches** |
| `auditLog.create` in `server/src/services/admin/` | **1 file** (`adminAuditService.ts`) |
| Mock fallback markers in `web/.../admin-portal/` | **0 matches** |
| `POST /support/tickets/customer` auth | `authenticateJWT, requireAdmin` |
| Dangerous migration gate | `enforceDangerousMigrationOpGate` present |
| AI Pipeline HTTP registry | **45** handlers |
| Admin-portal route test files | **18** |
| `pnpm type-check` | Not re-run (docs-only package) |

---

## Allowed outcomes

| Outcome | Applies? |
|---------|----------|
| NOT READY | No |
| CONDITIONALLY READY | Superseded — score exceeds threshold |
| **READY FOR CERTIFICATION REVIEW** | **Yes** |
| Certified (any level) | **Not awarded** — evaluation program is next step |

---

## References

- [ADMIN_PORTAL_POST_1B_CERTIFICATION_PATH.md](./ADMIN_PORTAL_POST_1B_CERTIFICATION_PATH.md)
- [ADMIN_PORTAL_TEST_ARCHITECTURE_CLOSEOUT.md](./ADMIN_PORTAL_TEST_ARCHITECTURE_CLOSEOUT.md)
- [ADMIN_PORTAL_STAGE_0E_0B_CLOSEOUT.md](./ADMIN_PORTAL_STAGE_0E_0B_CLOSEOUT.md)
- [ADMIN_PORTAL_TEST_COVERAGE_REPORT.md](./ADMIN_PORTAL_TEST_COVERAGE_REPORT.md)
- [ADMIN_PORTAL_AI_PIPELINE_HTTP_COVERAGE.md](./ADMIN_PORTAL_AI_PIPELINE_HTTP_COVERAGE.md)
