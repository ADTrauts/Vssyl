# Admin Portal — Certification Evaluation

**Program:** Admin Portal Certification Evaluation  
**Date:** 2026-06-18  
**Framework:** Adapted Platform Control Plane Certification (G1–G9)  
**Baseline:** Modernization complete (0E, 0B, 0D, 1B); readiness gate **READY FOR CERTIFICATION REVIEW** (~89%)

**Constraint:** Evaluation only — **no certification awarded** in this document; **no** `CERTIFICATION_LEDGER.md` update.

---

## Evaluation outcome

| Decision | Result |
|----------|--------|
| **Certification status (recommended)** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Adapted framework** | Platform Control Plane (not module L3 matrix) |
| **Blocking findings at evaluation** | **0** |
| **Evaluator confidence** | High — repository evidence confirms 1B-E gate assertions |

---

## 1. Scope

This evaluation assesses whether the Admin Portal — a **hybrid platform control plane** (not a workspace module) — qualifies for adapted **Level 3** certification comparable in rigor to File Hub, Chat, Calendar, HR, Scheduling, and Workforce Communications reviews, using the control-plane gate set defined in [ADMIN_PORTAL_CERTIFICATION_READINESS.md](./ADMIN_PORTAL_CERTIFICATION_READINESS.md).

**In scope:** Authorization, audit, service boundaries, API coherence, ownership, test evidence, documentation, production safety, UX shell (advisory).

**Out of scope (N/A per framework):** `dashboardId` scoping, module manifest, workspace landing, global trash, module PE duals, V-Link portal-wide.

---

## 2. Gate evaluation

### G1 Authorization — **PASS**

| Evidence | Status |
|----------|--------|
| `POST /support/tickets/customer` — `authenticateJWT` + `requireAdmin` (platform.ts L653) | Verified |
| `enforceDangerousMigrationOpGate` on migration delete/reset (platform.ts L1199+) | Verified |
| Canonical `requireAdmin` + [ADMIN_PORTAL_AUTH_MATRIX.md](./ADMIN_PORTAL_AUTH_MATRIX.md) | Documented |
| Tests: `admin-portal-support-customer-auth.test.ts`, `admin-portal-dangerous-migration-ops.test.ts`, `admin-portal-auth-consolidation.test.ts` | Present |

**Finding impact:** AP-F-001, AP-F-002, AP-F-011 closed.

---

### G2 Audit trail — **PASS**

| Evidence | Status |
|----------|--------|
| [ADMIN_PORTAL_AUDIT_TAXONOMY.md](./ADMIN_PORTAL_AUDIT_TAXONOMY.md) — 30 actions, 20 resource types | Live |
| Single `auditLog.create` in `adminAuditService.ts` only (grep admin services) | Verified |
| Domain helpers (`logSystemOpsAudit`, `logImpersonationDeniedAudit`, etc.) | Implemented |
| Tests: `adminAuditTaxonomy.test.ts`, `adminAuditService.test.ts`, domain contract audit samples | Present |

**Residual (documented partial):** Not every operation-matrix mutation row has dedicated integration audit assertion; P0 paths and taxonomy conformance are covered. Acceptable for L3 with findings (matches Chat/Calendar partial posture).

**Finding impact:** AP-F-013 closed.

---

### G3 Service boundaries — **PASS**

| Evidence | Status |
|----------|--------|
| **0** `prisma.` in `server/src/routes/admin-portal/` | Verified (grep) |
| **0** `prisma.` in `adminService.ts` (706 LOC facade) | Verified |
| 13+ `admin/*Service` domain owners per [ADMIN_PORTAL_OWNERSHIP_ENFORCEMENT_MODEL.md](./ADMIN_PORTAL_OWNERSHIP_ENFORCEMENT_MODEL.md) | Documented |
| Tests: `admin-portal-route-architecture.test.ts`, `adminPortalServiceBoundary.contract.test.ts` | Present |

**Advisory residual:** Large route LOC (`platform.ts` ~1,588; `aiPipeline.ts` ~1,203) — services extracted; file size not a safety blocker.

**Finding impact:** AP-F-004 closed.

---

### G4 API coherence — **PASS**

| Evidence | Status |
|----------|--------|
| [ADMIN_PORTAL_OPERATION_MATRIX.md](./ADMIN_PORTAL_OPERATION_MATRIX.md) | Published |
| [ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md](./ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md) | Published |
| Single `GET /security/events` (analyticsOps.ts) | Verified |
| Registry / duplicate route cleanup (AP-F-009, AP-F-010, AP-F-015) | Closed |

**Advisory residual:** Satellite mount fragmentation documented; consolidation optional.

**Finding impact:** AP-F-003, AP-F-006, AP-F-015 closed.

---

### G5 Ownership — **PASS**

| Evidence | Status |
|----------|--------|
| [ADMIN_PORTAL_OWNERSHIP_BOUNDARY_ANALYSIS.md](./ADMIN_PORTAL_OWNERSHIP_BOUNDARY_ANALYSIS.md) | Complete |
| AI Pipeline canonical under `/api/admin-portal/ai-pipeline/*` | Verified |
| Diagnostics ownership via `adminAiPipelineDiagnosticsService` | Extracted (1B-C) |
| centralized-ai 410 fence; `aiCentralizedAdminFence.test.ts` | Verified |

**Finding impact:** AP-F-008, AP-F-029, AP-F-010 closed.

---

### G6 Test evidence — **PASS**

| Evidence | Status |
|----------|--------|
| **18** admin-portal route integration test files | Verified |
| AI Pipeline **45/45** HTTP coverage | Verified |
| Domain contracts (11 domains) + governance static tests | 1B-D |
| **11** web hygiene/manifest tests | Present |
| **15+** admin domain service unit tests | Present |

**Advisory residual:** No web page render smoke tests; server contracts sufficient for control-plane L3.

**Finding impact:** AP-F-014, AP-F-027, AP-F-030 closed.

---

### G7 Documentation — **PASS**

| Evidence | Status |
|----------|--------|
| Operation matrix, mount map, audit taxonomy, route standard | Complete |
| Controller governance, test coverage, AI pipeline HTTP coverage reports | 1B-D/E |
| Impersonation policy, readiness gate, 1B closeout | Complete |
| Program closeouts (0E, 0B, 0D, 1B) | Complete |

**Finding impact:** AP-F-003, AP-F-028 closed.

---

### G8 Production safety — **PASS**

| Evidence | Status |
|----------|--------|
| No mock-fallback markers in `web/src/app/admin-portal/**` | Verified (grep) |
| Dangerous migration ops env-gated + confirmation | Verified |
| Debug/testing surfaces gated (`adminPortalDebugGate`) | Verified + tested |
| Impersonation deny policy + audit on denied self-target | Tested |

**Finding impact:** AP-F-002, AP-F-005, AP-F-012, AP-F-020, AP-F-021 closed.

---

### G9 UX shell — **FAIL**

| Evidence | Status |
|----------|--------|
| Widespread `gray-*` tokens across admin-portal pages | Present |
| No shared `EmptyState` component usage | Verified |
| Custom confirm modal (impersonate only); `window.confirm` on seed-modules (L33) | Verified |
| AI Pipeline sub-shell mature; portal-wide shell inconsistent | Observed |

**Finding impact:** AP-F-023, AP-F-024, AP-F-025, AP-F-026 **open** (1A). **Advisory for control-plane L3** — does not block certification under adapted framework §1.2.

---

## 3. Weighted score

| Gate | Points (max 3) | Score |
|------|----------------|------:|
| G1 | 3 | 3 |
| G2 | 3 | 3 |
| G3 | 3 | 3 |
| G4 | 3 | 3 |
| G5 | 3 | 3 |
| G6 | 3 | 3 |
| G7 | 3 | 3 |
| G8 | 3 | 3 |
| G9 | 3 | 0 |
| **Total** | **27** | **24 (~89%)** |

---

## 4. Certification status decision

### Selected: **LEVEL 3 CERTIFIED WITH FINDINGS**

| Option | Applies? | Rationale |
|--------|----------|-----------|
| NOT CERTIFIED | No | Zero blocking findings; G1–G8 PASS |
| CERTIFIED WITH FINDINGS | Partial | Too vague without level |
| LEVEL 3 CERTIFIED | No | G9 FAIL + open major AP-F-007 + 4 advisory UX findings |
| **LEVEL 3 CERTIFIED WITH FINDINGS** | **Yes** | Control-plane core meets L3 bar; documented open findings |

**Conditions of certification (findings):**

1. **AP-F-007** — Analytics triplication remains open; waive for control-plane scope or close in 0C before promotion to plain L3.
2. **AP-F-023–026** — UX shell gaps; close in 1A for G9 PASS and optional Reference UX track.
3. **Advisory tails** — Fat route LOC, ai-context-debug API merge, web render smoke — track in hygiene backlog.

**Council action required for ledger:** Separate governance step; this evaluation does not update `CERTIFICATION_LEDGER.md`.

---

## 5. Reference candidate

**Control Plane Reference Candidate: YES (partial — Strong Candidate)**

Qualifying areas:

| Area | Rationale |
|------|-----------|
| **AI Pipeline admin control plane** | 45 handlers, policy governance, diagnostics, retention/compliance — most mature subsystem |
| **Admin audit taxonomy** | Reusable pattern for platform privileged-mutation audit |
| **Route/service governance** | 0 route Prisma; facade deprecation; enforceable via tests |
| **Dangerous-op gating** | Env + confirmation + audit deny pattern |

**Not qualifying (yet):** Full portal UX shell, analytics ownership, satellite mount consolidation, Level 4 Reference Implementation.

---

## 6. Comparison to certified references

| Dimension | Chat L3 | HR L3 | Admin Portal (evaluated) |
|-----------|---------|-------|--------------------------|
| Service extraction | Complete | Complete | **PASS** — domain services |
| Operation matrix | Yes | Yes | **Yes** |
| Test evidence | High | ~80 cases | **High** — 18 route suites + 45/45 AI |
| Constitutional audit | Yes | Yes | **Yes** — full program |
| PE / authZ | Module PE | Partial PE | Role gate + documented waiver |
| UX reference | Reference UX | Module UX | **Below** — G9 FAIL |
| Ledger row | Yes | Yes | **Not yet** — recommend platform row |

---

## 7. Deliverable question answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Is Admin Portal certifiable today? | **Yes** — adapted control-plane L3 |
| 2 | What level? | **Level 3 Certified with Findings** |
| 3 | Which findings remain? | AP-F-007 (major); AP-F-023–026 (advisory) |
| 4 | Do remaining findings block certification? | **No** for adapted L3 with findings |
| 5 | Reference candidate? | **Yes (partial)** — AI Pipeline + audit + governance patterns |
| 6 | Future work? | 0C Analytics, 1A UX Shell, optional reference council, ledger row |
| 7 | Next initiative? | **Ledger row + reference designation council** (governance); parallel 0C/1A |

---

## References

- [ADMIN_PORTAL_CERTIFICATION_SCORECARD.md](./ADMIN_PORTAL_CERTIFICATION_SCORECARD.md)
- [ADMIN_PORTAL_CERTIFICATION_FINDINGS_REVIEW.md](./ADMIN_PORTAL_CERTIFICATION_FINDINGS_REVIEW.md)
- [ADMIN_PORTAL_CONTROL_PLANE_REFERENCE_ASSESSMENT.md](./ADMIN_PORTAL_CONTROL_PLANE_REFERENCE_ASSESSMENT.md)
- [ADMIN_PORTAL_CERTIFICATION_EXECUTIVE_SUMMARY.md](./ADMIN_PORTAL_CERTIFICATION_EXECUTIVE_SUMMARY.md)
- [ADMIN_PORTAL_CERTIFICATION_READINESS_GATE.md](./ADMIN_PORTAL_CERTIFICATION_READINESS_GATE.md)
