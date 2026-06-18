# Business Administration Certification Readiness

**Program:** Business Administration Discovery — Phase 0A  
**Date:** 2026-06-18  
**Authority:** Adapted G1–G9 framework (Admin Portal + Business Operations precedent)  
**Constraint:** Assessment only — no certification awarded; no ledger updates

**This document assesses readiness only.**

---

## Readiness outcome

# NOT READY

Business Administration does not meet the minimum bar for a formal **Platform Subdomain Level 3** certification review. The domain is operationally functional but lacks constitutional alignment (activity, trash, PE coverage), service boundary discipline on `businessController`, documentation in the audit trail, and UX reference compliance.

---

## 1. Adapted certification framework

Business Administration is **not** a `CERTIFICATION_LEDGER` module row. Evaluation uses **Platform Subdomain adaptation** — similar to Admin Portal control-plane gates, but **tenant-scoped** and **business-member authorized**.

### 1.1 Gates that apply

| # | Requirement | Rationale |
|---|-------------|-----------|
| G1 | Authorization depth | All configuration routes consistently business-scoped + role/PE gated |
| G2 | Auditability | Activity/audit for structure and permission mutations |
| G3 | Service boundaries | Named domain services; no Prisma in controllers |
| G4 | API coherence | Canonical mount strategy for BA cluster |
| G5 | Ownership clarity | BA vs BO vs AP surfaces bounded |
| G6 | Test evidence | Integration tests for org-chart and business mutations |
| G7 | Documentation | Operation matrix + ownership docs in audit trail |
| G8 | Production safety | No unwired models exposed as UI; config sync truthful |
| G9 | UX consistency | ConfirmModal/EmptyState; workspace settings coherence |

### 1.2 Gates marked N/A

| Gate | N/A rationale |
|------|---------------|
| Module manifest / workspace landing (module L3) | Platform subdomain — not a marketplace module |
| `dashboardId` personal scoping | Business-scoped by design |
| Admin Portal role gate | Uses business member auth |
| Module AI write executors (full set) | Business AI is separate enterprise layer |
| Global Trash (portal-wide) | Applies when handlers registered per entity |

---

## 2. Certification readiness table

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **G1 Authorization depth** | **PARTIAL** | Org-chart `requireOrgChartAccess` middleware; `BUSINESS_UPDATE` / `BUSINESS_MEMBER_*` PE on some paths; SSO/webhooks/org-chart writes lack full PE dual |
| **G2 Auditability** | **FAIL** | No `orgChartActivityService` or `businessActivityService`; `PermissionChange` model exists but no normalized activity envelope |
| **G3 Service boundaries** | **FAIL** | `businessController.ts` — **56** `prisma.` calls; org-chart routes thin via services |
| **G4 API coherence** | **PARTIAL** | 7 mounts for one domain; coherent per mount but fragmented cluster |
| **G5 Ownership clarity** | **PARTIAL** | BO ownership docs exist; BA-specific ownership model created in Phase 0A |
| **G6 Test evidence** | **FAIL** | 1 file: `org-chart.integration.test.ts`; zero business route tests; zero frontend tests |
| **G7 Documentation** | **PARTIAL** | Phase 0A docs created; not yet in `docs/architecture/audits/`; memory-bank partial |
| **G8 Production safety** | **PARTIAL** | `ManagerApprovalHierarchy` unwired; config WebSocket sync incomplete; no AI placeholder issue on BA routes |
| **G9 UX consistency** | **FAIL** | Native `confirm()`/`prompt()` in org-chart + business components (8+ sites); settings aggregation UX |

---

## 3. Readiness scoring

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| G1 Authorization | 2 | 3 | Custom middleware works; PE incomplete |
| G2 Auditability | 0 | 3 | No activity layer |
| G3 Service boundaries | 1 | 3 | Org-chart good; business controller fat |
| G4 API coherence | 2 | 3 | 7 mounts — moderate fragmentation |
| G5 Ownership | 2 | 3 | Documented in Phase 0A; not enforced in code |
| G6 Test evidence | 1 | 3 | Single integration file |
| G7 Documentation | 2 | 3 | Phase 0A complete; audits path pending |
| G8 Production safety | 2 | 3 | No mock fallbacks; sync gap |
| G9 UX (advisory weight) | 1 | 3 | Native confirm blockers |
| **Total** | **13** | **27** | **~48%** |

**Review threshold (planning):**

| Threshold | Requirement |
|-----------|-------------|
| NOT READY | &lt;70% or any G2/G3/G6 FAIL |
| CONDITIONALLY READY | ≥70%, zero blocking, majors tracked |
| READY FOR REVIEW | ≥85%, G2/G3 ≥2, G9 ≥2 |

**Current: NOT READY (~48%)**

---

## 4. Blocking and major findings (pre-register)

### Blocking (would prevent review)

| ID | Finding | Gate |
|----|---------|------|
| **BA-F-001** | No activity emission for org-chart or business profile mutations | G2 |
| **BA-F-002** | `businessController` — 56 direct Prisma calls | G3 |

### Major (likely review failure)

| ID | Finding | Gate |
|----|---------|------|
| **BA-F-003** | Org-chart write routes lack Policy Engine dual | G1 |
| **BA-F-004** | No integration tests for `/api/business` mutations | G6 |
| **BA-F-005** | `ManagerApprovalHierarchy` model with zero runtime implementation | G8 |
| **BA-F-006** | Business configuration real-time sync incomplete | G8 |
| **BA-F-007** | Native confirm/prompt in BA UI surfaces | G9 |

### Advisory

| ID | Finding | Gate |
|----|---------|------|
| BA-F-008 | 7 API mounts — consider consolidation plan | G4 |
| BA-F-009 | Stations editor in business components, scheduling API | G5 |
| BA-F-010 | Legacy `/admin/hr` path vs workspace IA | G9 |
| BA-F-011 | Operation matrix not in `docs/architecture/audits/` | G7 |
| BA-F-012 | No Global Trash for org entities | G2 |

---

## 5. Comparison to peer programs

| Program | G1–G9 (approx.) | Posture |
|---------|-----------------|---------|
| Admin Portal (post-modernization) | 27/27 PASS | L3 Certified |
| Business Operations domain | 17/27 (~63%) | NOT READY |
| **Business Administration** | **13/27 (~48%)** | **NOT READY** |
| File Hub (module L4) | Module L3+ | Reference Implementation |

Business Administration trails Business Operations because BO modules received constitutional remediation (activity, trash, V_Link, domain events) while BA platform surfaces did not.

---

## 6. Certification candidacy

| Question | Answer |
|----------|--------|
| Module L3 certification? | **No** — not a module |
| Platform subdomain certification? | **Candidate** — after modernization |
| Reference Domain? | **No** — BO is reference domain candidate first |
| Reference Module? | **Org chart permissions** could teach platform patterns post-remediation |
| Ledger row today? | **None** — do not add without Phase 0B program |

### 6.1 Likely certification path (planning)

1. Phase 0A assessment (complete)
2. Phase 0B — certification planning + findings register formalization
3. Modernization packages — service extraction, activity, PE, UX
4. Subdomain L3 WITH FINDINGS review
5. Optional: Org Chart Reference Platform Capability designation

---

## 7. Allowed outcomes (Phase 0A)

| Outcome | Applies? |
|---------|----------|
| **NOT READY** | **Yes** |
| CONDITIONALLY READY FOR REVIEW | No |
| READY FOR CERTIFICATION REVIEW | No |
| Certified (any level) | **Not awarded** |
| Ledger update | **Prohibited** |

---

## Related documents

- [BUSINESS_ADMINISTRATION_OPERATION_MATRIX.md](./BUSINESS_ADMINISTRATION_OPERATION_MATRIX.md)
- [BUSINESS_ADMINISTRATION_EXECUTIVE_SUMMARY.md](./BUSINESS_ADMINISTRATION_EXECUTIVE_SUMMARY.md)
- [BUSINESS_OPERATIONS_CERTIFICATION_FRAMEWORK.md](../business-operations/BUSINESS_OPERATIONS_CERTIFICATION_FRAMEWORK.md)
