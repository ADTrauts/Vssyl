# Admin Portal — Governance Implementation Plan

**Program:** Stage 1B — Governance Architecture Blueprint  
**Date:** 2026-06-17  
**Constraint:** Implementation packages defined only — **no execution**

---

## Program overview

| Field | Value |
|-------|-------|
| **Stage** | 1B — Governance Architecture |
| **Duration estimate** | 4–6 sprints |
| **Critical path** | 1B-A → 1B-B → 1B-D (parallel 1B-C) → 1B-E |
| **Findings owned** | AP-F-004, AP-F-013, AP-F-014, AP-F-016, AP-F-027, AP-F-030 |

---

## Package 1B-A — Service Boundary Extraction

| Field | Value |
|-------|-------|
| **Purpose** | Eliminate AdminService monolith; thin route files |
| **Findings** | **AP-F-004** (primary) |
| **Complexity** | **L** (3–4 sprints) |
| **Dependencies** | None — entry package |
| **Phases** | 1B-A.1 impersonation+users → 1B-A.2 governance → 1B-A.3 ops → 1B-A.4 analytics → 1B-A.5 route split |

### Exit criteria

- [ ] `adminService.ts` deleted or <200 LOC shim
- [ ] No route file >500 LOC
- [ ] Zero new inline `prisma` in routes (existing migrated)
- [ ] 10+ domain services under `server/src/services/admin/`
- [ ] `pnpm type-check` pass; existing integration tests pass

### Files likely affected

| Category | Paths |
|----------|-------|
| Delete/shrink | `server/src/services/adminService.ts` |
| Create | `server/src/services/admin/admin*Service.ts` (10–12 files) |
| Expand | `server/src/services/admin/adminServiceContracts.ts` |
| Refactor | `adminPortalRoutes.{core,platform,analyticsOps}.ts` → split files |
| Preserve | `adminPortalRoutes.aiPipeline.ts`, `server/src/ai/pipeline/*` |

---

## Package 1B-B — Audit Architecture

| Field | Value |
|-------|-------|
| **Purpose** | Normalized admin audit taxonomy and emission |
| **Findings** | **AP-F-013** |
| **Complexity** | **M** (1–2 sprints) |
| **Dependencies** | 1B-A.1 (impersonation service) minimum; ideal after 1B-A.2 |

### Exit criteria

- [ ] `adminAuditService` with `emitAdminAuditEvent` + `listAdminAuditEvents`
- [ ] Taxonomy enum matches [`ADMIN_PORTAL_AUDIT_ARCHITECTURE.md`](./ADMIN_PORTAL_AUDIT_ARCHITECTURE.md)
- [ ] ≥95% mutation operations emit `ADMIN_*` events
- [ ] Zero direct `auditLog.create` in routes
- [ ] `GET /api/admin-portal/audit/events` (paginated)
- [ ] Pipeline policy audit bridge reader

### Files likely affected

| Category | Paths |
|----------|-------|
| Create | `server/src/services/admin/adminAuditService.ts` |
| Create | `server/src/routes/admin-portal/adminPortalRoutes.audit.ts` (optional) |
| Refactor | All domain admin services — add emit calls |
| Refactor | `adminPortalRoutes.core.ts` impersonation handlers |
| UI (minimal) | Admin audit list page or security tab extension |

---

## Package 1B-C — Controller Governance

| Field | Value |
|-------|-------|
| **Purpose** | Enforce thin controller standard; PE decision |
| **Findings** | **AP-F-014**, **AP-F-016** |
| **Complexity** | **M** (ongoing through 1B-A; 0.5 sprint dedicated) |
| **Dependencies** | Parallel with 1B-A extractions |

### Exit criteria

- [ ] All route files ≤500 LOC
- [ ] Handler bodies ≤40 LOC average
- [ ] PE Path A **or** Path B waiver documented and approved
- [ ] If Path A: `admin_*` policy actions registered + tested
- [ ] Response envelope consistent across domains
- [ ] Pass/fail checklist in [`ADMIN_PORTAL_CONTROLLER_GOVERNANCE_STANDARD.md`](./ADMIN_PORTAL_CONTROLLER_GOVERNANCE_STANDARD.md) — all **Pass**

### Files likely affected

| Category | Paths |
|----------|-------|
| Refactor | All `adminPortalRoutes.*.ts` |
| Maybe | `server/src/auth/policyActions.ts` (Path A) |
| Create | `docs/architecture/audits/ADMIN_PORTAL_POLICY_ENGINE_WAIVER.md` (Path B) |

---

## Package 1B-D — Test Architecture

| Field | Value |
|-------|-------|
| **Purpose** | Close HTTP and frontend test gaps |
| **Findings** | **AP-F-027**, **AP-F-030** |
| **Complexity** | **L** (2–3 sprints) |
| **Dependencies** | 1B-A per domain (tests follow extraction) |

### Exit criteria

- [ ] AI Pipeline: ≥40/45 HTTP handler tests
- [ ] Billing, support, performance: integration files exist
- [ ] `adminSecurityRoutes`: full matrix tested
- [ ] Audit assertions on P0 mutations
- [ ] ≥5 frontend page smoke tests
- [ ] Test matrix doc updated to PASS for all 1B domains

### Files likely affected

| Category | Paths |
|----------|-------|
| Create | `admin-portal-billing.integration.test.ts` |
| Create | `admin-portal-support.integration.test.ts` |
| Create | `admin-portal-performance.integration.test.ts` |
| Expand | `admin-portal-ai-pipeline.test.ts` |
| Create | `web/src/app/admin-portal/**/__tests__/*.smoke.test.tsx` |

---

## Package 1B-E — Certification Readiness

| Field | Value |
|-------|-------|
| **Purpose** | Gate review; update readiness artifacts |
| **Findings** | All 1B findings verification |
| **Complexity** | **S** (0.5 sprint) |
| **Dependencies** | 1B-A through 1B-D exit criteria |

### Exit criteria

- [ ] AP-F-004, 013, 014, 016, 027, 030 marked **Closed** in findings register
- [ ] G3 Service boundaries → **PASS**
- [ ] G2 Audit trail → **PASS**
- [ ] G6 Test evidence → **PASS**
- [ ] Weighted readiness ≥85%
- [ ] Zero blocking findings
- [ ] [`ADMIN_PORTAL_POST_1B_CERTIFICATION_PATH.md`](./ADMIN_PORTAL_POST_1B_CERTIFICATION_PATH.md) verdict: eligible for certification review

### Files likely affected

| Category | Paths |
|----------|-------|
| Update | Findings register, operation matrix, certification readiness |
| Create | `ADMIN_PORTAL_POST_1B_READINESS_REPORT.md` |
| No ledger changes | Per program constraint |

---

## Sequence diagram

```
1B-A.1 Impersonation + Users + Audit emit v1
    ↓
1B-A.2–A.4 Domain extractions (parallel tracks possible)
    ↓
1B-A.5 Route file split
    ↓
1B-B Audit architecture complete
    ↓
1B-C Controller governance verification
    ↓
1B-D Test architecture (incremental per domain during A)
    ↓
1B-E Certification readiness gate
```

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Extraction breaks integration tests | Extract one domain at a time; keep facade |
| Audit volume performance | Pagination; retention tiers |
| 1B scope creep into 0C analytics | Freeze analytics extraction boundary in 1B-A.4 |
| PE adoption delays 1B | Default Path B waiver with audit compensating controls |

---

## References

- [`ADMIN_PORTAL_SERVICE_DECOMPOSITION_BLUEPRINT.md`](./ADMIN_PORTAL_SERVICE_DECOMPOSITION_BLUEPRINT.md)
- [`ADMIN_PORTAL_MODERNIZATION_SEQUENCE.md`](./ADMIN_PORTAL_MODERNIZATION_SEQUENCE.md)
