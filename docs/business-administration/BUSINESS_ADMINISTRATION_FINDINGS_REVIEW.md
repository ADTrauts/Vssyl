# Business Administration Findings Review

**Program:** BA-2 — Certification Review  
**Date:** 2026-06-18  
**Authority:** Post-remediation disposition of BA-F-001..015  
**Constraint:** No forced closure without evidence

---

## Summary

| Disposition | Count |
|-------------|-------|
| **CLOSED** | 9 |
| **OPEN (major)** | 1 |
| **OPEN (advisory)** | 4 |
| **DOWNGRADED** | 2 |

**Blocking findings:** **0 open** (BA-F-001, BA-F-002 closed)  
**Major findings open:** **1** (BA-F-005)

---

## Blocking findings

| ID | Title | Disposition | Evidence | Gate impact |
|----|-------|-------------|----------|-------------|
| **BA-F-001** | No normalized activity emission | **CLOSED** | [BA_1A](./BA_1A_IMPLEMENTATION_REPORT.md): 26 mutations, activity services, domain events, integration tests | G2: 0 → 3 |
| **BA-F-002** | Fat `businessController` | **CLOSED** | [BA_1B](./BA_1B_IMPLEMENTATION_REPORT.md): 0 Prisma in controller; 7 services; contract test | G3: 1 → 3 |

---

## Major findings

| ID | Title | Disposition | Evidence | Notes |
|----|-------|-------------|----------|-------|
| **BA-F-003** | Policy Engine coverage gaps | **CLOSED** (core) / **DOWNGRADED** (integration residual) | [BA_1C](./BA_1C_IMPLEMENTATION_REPORT.md): 18/18 org-chart + 8/8 core business PE dual; tests PASS | Residual: ~14 integration-mount writes without PE — track as **BA-F-003-R1** advisory; does not reopen major |
| **BA-F-004** | No `/api/business` integration tests | **CLOSED** | [BA_1D](./BA_1D_TEST_COVERAGE_REPORT.md): 12 integration tests + 57 total evidence tests | G6: 1 → 3 |
| **BA-F-005** | `ManagerApprovalHierarchy` unwired | **OPEN** | [REALITY](./BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md); no server routes/UI; schema in `hr/core.prisma` | **Blocks L3 plain**; acceptable on L3 WITH FINDINGS with council waiver |
| **BA-F-006** | Config realtime sync incomplete | **CLOSED** | [BA_1A_CONFIG_SYNC_CONTRACT](./BA_1A_CONFIG_SYNC_CONTRACT.md); `broadcastBusinessConfigUpdated`; client `business:config:updated` listener; [BA_1D](./BA_1D_CERTIFICATION_EVIDENCE.md) tests; polling fallback intact | Live browser E2E deferred — not required for closure |
| **BA-F-007** | Native confirm/prompt UX debt | **CLOSED** | [BA_1E](./BA_1E_IMPLEMENTATION_REPORT.md): 11 → 0 native dialogs; UX shell tests 7/7 PASS | HR pages under `/admin/hr` out of scope |

---

## Advisory findings

| ID | Title | Disposition | Evidence | BA-2 action |
|----|-------|-------------|----------|-------------|
| **BA-F-008** | 7 API mounts fragmentation | **OPEN** | [REALITY](./BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md) §1.1 | Document cluster map; defer facade |
| **BA-F-009** | `StationsAndPositionsEditor` cross-domain | **OPEN** | BO overlap; in BA components, scheduling API | Defer to BO-1B or document boundary |
| **BA-F-010** | Legacy `/admin/hr` vs workspace IA | **OPEN** | [UX_AUDIT](./BUSINESS_ADMINISTRATION_UX_AUDIT.md) | Redirect map in BO/BA-2+ |
| **BA-F-011** | Operation matrix not in audits path | **OPEN** | No file in `docs/architecture/audits/` for BA | Symlink/copy on council ratification |
| **BA-F-012** | No Global Trash for org entities | **OPEN** | Hard delete on position/department | BA-2+ or BO program |
| **BA-F-013** | Token drift | **DOWNGRADED** | [BA_1E](./BA_1E_UX_STANDARDIZATION_MATRIX.md): 1,187 removed; 97 residual | Was major pre-1E; now advisory hygiene |
| **BA-F-014** | Zero EmptyState | **CLOSED** | [BA_1E](./BA_1E_IMPLEMENTATION_REPORT.md): 10+ surfaces | — |
| **BA-F-015** | `createBusiness` lacks PE | **CLOSED** | [BA_1C](./BA_1C_IMPLEMENTATION_REPORT.md): `business:create` dual | Bootstrap documented |

---

## New tracking item (residual from BA-F-003)

| ID | Title | Severity | Disposition |
|----|-------|----------|-------------|
| **BA-F-003-R1** | Integration-mount PE gaps (SSO, webhooks, modules, business-front, business-ai) | Advisory | **OPEN** — deferred post BA-1C scope |

---

## Certification impact matrix

| Finding | Blocks review? | Required for L3 WITH FINDINGS? | Required for L3 plain? |
|---------|---------------|-------------------------------|----------------------|
| BA-F-001 | Was yes | Closed | Closed |
| BA-F-002 | Was yes | Closed | Closed |
| BA-F-003 | No | Closed (core) | Closed (core); 003-R1 advisory |
| BA-F-004 | No | Closed | Closed |
| BA-F-005 | No | **Waiver acceptable** | **Yes — must close or implement** |
| BA-F-006 | No | Closed | Closed |
| BA-F-007 | No | Closed | Closed |
| BA-F-008..012 | No | Track | Track |
| BA-F-013-R | No | Track | Track |
| BA-F-014, 015 | No | Closed | Closed |

---

## Waiver recommendation (BA-F-005)

**Recommend council waiver** for L3 WITH FINDINGS with conditions:

1. Do not expose approval hierarchy UI until `BusinessApprovalService` ships
2. Document HR ad-hoc manager routes as interim pattern in BO program
3. Target implementation in joint BA/HR program post-certification (not BA-2 scope)

**Do not waive** if product marketing claims "approval chains" as shipped BA capability.

---

## Related

- [BUSINESS_ADMINISTRATION_FINDINGS_REGISTER.md](./BUSINESS_ADMINISTRATION_FINDINGS_REGISTER.md) (Phase 0B register — superseded for disposition by this review)
- [BUSINESS_ADMINISTRATION_CERTIFICATION_EVALUATION.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_EVALUATION.md)
