# Admin Portal Governance Remaining Gaps

**Program:** Admin Portal Modernization — Post 1B-A / 1B-B  
**Date:** 2026-06-17  
**Baseline closure:** [`ADMIN_PORTAL_1B_A_B_CLOSURE_ASSESSMENT.md`](./ADMIN_PORTAL_1B_A_B_CLOSURE_ASSESSMENT.md)  
**Readiness:** [`ADMIN_PORTAL_POST_AUDIT_TAXONOMY_READINESS_UPDATE.md`](./ADMIN_PORTAL_POST_AUDIT_TAXONOMY_READINESS_UPDATE.md) — CONDITIONALLY READY

**Constraint:** Inventory only — no implementation authorized by this document.

---

## 1. Summary

| Package | Open items | Severity mix |
|---------|------------|--------------|
| **1B-C** Controller Governance | 3 | 1 major (residual AP-F-004), 1 major (AP-F-016), route Prisma |
| **1B-D** Test Architecture | 3 | 2 major, 1 advisory |
| **1B-E** Certification Readiness | 1 | Gate review / ledger row |
| **0C** Analytics | 1 | 1 major |
| **1A** UX Shell | 4 | 4 advisory |
| **Advisory** | 3+ | Misc |

**Closed in 1B-A/B:** AP-F-013 (audit taxonomy); AP-F-004 monolith aspect (partial close).

---

## 2. Stage 1B-C — Controller Governance

**Blueprint:** [`ADMIN_PORTAL_CONTROLLER_GOVERNANCE_STANDARD.md`](./ADMIN_PORTAL_CONTROLLER_GOVERNANCE_STANDARD.md)  
**Findings:** AP-F-004 (residual), AP-F-016

| Gap | Severity | Evidence | Remediation |
|-----|----------|----------|-------------|
| Fat route modules | major (residual) | `adminPortalRoutes.platform.ts` 1,778 LOC; `adminPortalRoutes.aiPipeline.ts` 1,322 LOC; `adminPortalRoutes.analyticsOps.ts` 1,293 LOC | Extract thin controllers or route handlers per domain; reduce orchestration duplication |
| Route-level Prisma (12 calls) | major (residual) | `platform.ts` 8 (migration ops); `aiPipeline.ts` 3; `adminPortalShared.ts` 1 (impersonation pre-check) | Move reads to domain services; keep dangerous ops behind service boundary with audit |
| No Policy Engine on admin mutations | major | Zero `policyEngine` in admin-portal routes | Evaluate PE actions for privileged ops or document formal waiver |
| Legacy AdminService consumers | advisory | `contentReportController.ts` uses facade | Optional: import `adminModerationService` directly |

**Exit criteria (proposed):** Route modules ≤800 LOC target per domain file OR documented exception; route `prisma.` only in approved dangerous-op service; PE evaluation doc or implementation.

---

## 3. Stage 1B-D — Test Architecture

**Blueprint:** [`ADMIN_PORTAL_TEST_ARCHITECTURE.md`](./ADMIN_PORTAL_TEST_ARCHITECTURE.md)  
**Findings:** AP-F-014, AP-F-027, AP-F-030

| Gap | Severity | Evidence | Remediation |
|-----|----------|----------|-------------|
| AI pipeline HTTP coverage | major | 45 handlers in `adminPortalRoutes.aiPipeline.ts`; 8 smoke tests; ~37 handlers untested | Integration suite per handler group |
| `adminSecurityRoutes` HTTP tests | major | 297 LOC sub-router; no dedicated HTTP test file | Auth + handler smoke tests |
| Billing / BI / performance HTTP gaps | major | Partial route source tests; limited mutation HTTP coverage | Expand integration tests per `analyticsOps` / `platform` domains |
| `ai-provider-usage` admin paths | major | No admin-portal HTTP tests | Auth contract + usage endpoint tests |
| No frontend admin tests | advisory | Hygiene only; no page/component vitest | Smoke tests post-1A shell |

**Current test inventory (post-1B-A/B):** 31 `admin*.test.ts` files (server); 10 domain service unit tests; audit conformance 18 tests.

---

## 4. Stage 1B-E — Certification Readiness Gate

**Blueprint:** [`ADMIN_PORTAL_POST_1B_CERTIFICATION_PATH.md`](./ADMIN_PORTAL_POST_1B_CERTIFICATION_PATH.md)

| Gap | Notes |
|-----|-------|
| Formal gate re-score | Re-run G1–G9 after 1B-C/D |
| CERTIFICATION_LEDGER row | Recommend only after READY FOR CERTIFICATION REVIEW |
| Council review scheduling | Blocked until ≥85% gates + zero blocking + major 1B gaps closed |

---

## 5. Stage 0C — Analytics Rationalization

**Finding:** AP-F-007

| Gap | Severity | Evidence |
|-----|----------|----------|
| Analytics surface triplication | major | `analytics`, `business-intelligence`, `ai-system`, `performance` overlap |

**Note:** Independent of 1B-A/B; can run in parallel.

---

## 6. Stage 1A — Operator UX Shell

**Findings:** AP-F-023, AP-F-024, AP-F-025, AP-F-026

| Gap | Severity |
|-----|----------|
| UX token drift (`gray-*` vs `v-*`) | advisory |
| No shared EmptyState | advisory |
| No shared ConfirmModal | advisory |
| `seed-modules` uses `window.confirm` | advisory |

**Note:** G9 remains **FAIL** until 1A completes.

---

## 7. Advisory / Later

| Item | Notes |
|------|-------|
| Satellite mount HTTP consolidation | Documented; deferred |
| `admin-override` / `ai-provider-usage` auth align | Auth matrix documents exceptions |
| Historical audit row legacy actions | No backfill; new writes canonical only |
| `adminUserService` audit coverage | User status/password mutations lack dedicated `ADMIN_USER_*` audit actions (future enhancement) |
| AI context debug API merge | Transitional mount; 0D-G disposition |

---

## 8. Priority order (recommended)

| Priority | Package | Rationale |
|----------|---------|-----------|
| **P0** | **1B-C** | Closes AP-F-004 residual + AP-F-016; completes governance architecture layer |
| **P1** | **1B-D** | Closes AP-F-014, AP-F-030; strengthens G6 for certification path |
| **P2** | **1B-E** | Formal readiness gate + ledger recommendation |
| **P3** | **0C** / **1A** | Parallel tracks; G9 and analytics clarity |

---

## 9. Cross-references

- Findings register: [`ADMIN_PORTAL_FINDINGS_REGISTER.md`](./ADMIN_PORTAL_FINDINGS_REGISTER.md)
- Remaining register: [`ADMIN_PORTAL_REMAINING_FINDINGS_REGISTER.md`](./ADMIN_PORTAL_REMAINING_FINDINGS_REGISTER.md)
- Implementation plan: [`ADMIN_PORTAL_IMPLEMENTATION_PACKAGE_PLAN.md`](./ADMIN_PORTAL_IMPLEMENTATION_PACKAGE_PLAN.md)

**Register close:** 11 open findings across 5 future packages (down from 13 pre-1B-A/B).
