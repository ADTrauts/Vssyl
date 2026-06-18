# Business Administration Promotion Review

**Program:** BA-5 — Post-Remediation Promotion Review  
**Date:** 2026-06-18  
**Type:** Governance review only — no code, ledger, or certification award  
**Authority:** Platform Architecture Governance (promotion session)  
**Precedent:** [ADMIN_PORTAL_PROMOTION_REVIEW.md](../architecture/audits/ADMIN_PORTAL_PROMOTION_REVIEW.md)

---

## 1. Purpose

Evaluate whether Business Administration should be **promoted** from ratified **LEVEL 3 CERTIFIED WITH FINDINGS** (BA-3, 2026-06-18) given **BA-4** closure of the sole ratification-time open major finding **BA-F-005**.

---

## 2. Prior ratified state (BA-3)

| Field | Value |
|-------|-------|
| Certification | **LEVEL 3 CERTIFIED WITH FINDINGS** (RD-BA-001) |
| Reference | **#OC-1, #OC-2** Reference Platform Capability **Candidates** (RD-BA-003) |
| #OC-3 | **Deferred** until approval hierarchy runtime |
| Validated score | **22/27 (~81%)** |
| Open major at ratification | **BA-F-005** (waiver ratified) |
| Open advisories at ratification | BA-F-008, BA-F-009, BA-F-010, BA-F-011, BA-F-012, BA-F-003-R1; BA-F-013 downgraded |
| Blocking findings | **0** |
| Ledger | Recommended — **not executed** (RD-BA-004) |

---

## 3. Repository verification (promotion review)

| # | Check | Expected | Verified | Evidence |
|---|-------|----------|----------|----------|
| 1 | BA-F-005 closed | Yes | **Yes** | [BA_4_APPROVAL_HIERARCHY_IMPLEMENTATION_REPORT.md](./BA_4_APPROVAL_HIERARCHY_IMPLEMENTATION_REPORT.md) §11 |
| 2 | Open major findings | 0 | **0** | BA-F-005 closed; no other majors reopened |
| 3 | Open blocking findings | 0 | **0** | BA-F-001, BA-F-002 remain closed |
| 4 | Approval hierarchy runtime | Present | **Yes** | `approvalHierarchyService.ts`; 10 `/api/org-chart/approval-hierarchy/*` routes |
| 5 | PE on approval hierarchy | Present | **Yes** | `orgchart:approval_hierarchy.read/write`; 11 policy tests PASS |
| 6 | Activity + domain events | Present | **Yes** | 5 activity actions; 5 domain event types |
| 7 | BA-4 tests | PASS | **Yes** | 11/11 PASS |
| 8 | Type-check | PASS | **Yes** | `pnpm type-check` per BA-4 report |

### BA-F-005 closure evidence

| Criterion | BA-4 status |
|-----------|-------------|
| CRUD | Implemented |
| Assignment (employee/position/department) | Implemented |
| Chain resolution | Implemented |
| Integrity validation | Implemented |
| PE dual | Implemented |
| Activity + domain events | Implemented |
| Integration tests | 11/11 PASS |
| Workflow engine | Intentionally deferred (out of BA-F-005 scope) |

**BA-F-005: CLOSED** — confirmed for promotion review.

---

## 4. Findings register — post BA-4

| Severity | At BA-3 ratification | Post BA-4 | Delta |
|----------|----------------------|-----------|-------|
| **Blocking** | 0 | **0** | — |
| **Major** | 1 (BA-F-005) | **0** | **−1** |
| **Advisory** | 6 + BA-F-013 downgraded | **6 open** + BA-F-013 downgraded | Unchanged |
| **Downgraded** | BA-F-013, BA-F-003 residual | Same | — |

### Open advisories (do not block plain L3)

| ID | Title | Status |
|----|-------|--------|
| BA-F-003-R1 | Integration-mount PE gaps | OPEN |
| BA-F-008 | 7 API mounts fragmentation | OPEN |
| BA-F-009 | `StationsAndPositionsEditor` cross-domain | OPEN |
| BA-F-010 | Legacy `/admin/hr` vs workspace IA | OPEN |
| BA-F-011 | Operation matrix not in `docs/architecture/audits/` | OPEN |
| BA-F-012 | No Global Trash for org entities | OPEN |
| BA-F-013 | Token drift (97 residual `gray-*`) | DOWNGRADED — OPEN hygiene |

**Remaining findings count:** **0 blocking · 0 major · 6 advisory (+ 1 downgraded hygiene)**

---

## 5. Gate re-evaluation (G1–G9) — post BA-4

| Gate | BA-3 / BA-2 | Post BA-4 | Promotion review | Evidence |
|------|-------------|-----------|------------------|----------|
| G1 Authorization | 2 PARTIAL | **2** | **PARTIAL** | Core + org-chart + approval-hierarchy PE; integration mounts (~14 writes) still without PE (BA-F-003-R1) |
| G2 Auditability | 3 PASS | **3** | **PASS** | BA-1A + BA-4 activity on hierarchy mutations |
| G3 Service boundaries | 3 PASS | **3** | **PASS** | Thin routes; `approvalHierarchyService` canonical |
| G4 API coherence | 2 PARTIAL | **2** | **PARTIAL** | 7-mount cluster + new approval routes; no facade (BA-F-008) |
| G5 Ownership | 2 PARTIAL | **2** | **PARTIAL** | Cross-domain widgets + IA split (BA-F-009, BA-F-010) |
| G6 Test evidence | 3 PASS | **3** | **PASS** | 57 (BA-1D) + 11 (BA-4) = **68** evidence tests PASS |
| G7 Documentation | 2 PARTIAL | **2** | **PARTIAL** | Rich `docs/business-administration/` + BA-4 docs; matrix not in audits path (BA-F-011) |
| G8 Production safety | 2 PARTIAL | **3** | **PASS** | BA-F-005 closed; config sync remains closed (BA-F-006) |
| G9 UX consistency | 3 PASS | **3** | **PASS** | BA-1E closeout unchanged |

**Validated score post BA-4:** **23/27 (~85%)** (+1 from G8)

| Metric | BA-3 | Post BA-4 |
|--------|------|-----------|
| Score | 22/27 (~81%) | **23/27 (~85%)** |
| Gates at PASS (3) | G2, G3, G6, G9 | **G2, G3, G6, G8, G9** |
| Gates PARTIAL (2) | G1, G4, G5, G7, G8 | **G1, G4, G5, G7** |

**Note:** BA-4 estimated ~24/27 (~89%). Promotion review validates **23/27** — G1/G4/G5/G7 advisories prevent full 27/27 without advisory cleanup program.

---

## 6. Capability eligibility verification

| Capability | BA-3 status | Post BA-4 eligibility |
|------------|-------------|----------------------|
| **#OC-1** Org Chart Identity & Structure | Candidate (ratified) | **Eligible for Reference Platform Capability With Findings** |
| **#OC-2** Permission Sets & Module Access | Candidate (ratified) | **Eligible for Reference Platform Capability With Findings** |
| **#OC-3** Approval Boundaries | Deferred | **Eligible for Reference Platform Capability With Findings** — runtime API shipped; admin UI absent (advisory) |

---

## 7. Historical consistency

| Program | Pattern | Business Administration post BA-4 |
|---------|---------|-----------------------------------|
| **Workforce Communications** | Plain L3 at ratification; advisories only | **Closest precedent** — 0 majors; advisories tracked |
| **Admin Portal** | WITH FINDINGS → plain L3 after **all** findings closed | BA has **open advisories** — does not meet AP zero-finding bar |
| **HR / Scheduling** | WITH FINDINGS while majors open | BA **exceeds** — zero majors |
| **BA-3 ratification** | WITH FINDINGS for BA-F-005 waiver | Major closed — notation **obsolete** |

**Conclusion:** Promotion to **plain LEVEL 3 CERTIFIED** is **consistent** with Workforce Communications (zero majors/blockers; advisories do not require WITH FINDINGS notation). Retaining WITH FINDINGS would **misrepresent** state after BA-F-005 closure.

---

## 8. Promotion recommendation summary

| Decision area | Recommendation |
|---------------|----------------|
| Certification level | **Promote to LEVEL 3 CERTIFIED** |
| WITH FINDINGS notation | **Remove** |
| Reference #OC-1 / #OC-2 | **Promote to Reference Platform Capability With Findings** |
| Reference #OC-3 | **Promote to Reference Platform Capability With Findings** (API runtime; UI advisory) |
| Ledger | **Update row** (separate PR — not in BA-5) |
| Modernization program | **Complete** — optional advisory hygiene only |
| Required remediation | **None** |

---

## 9. Out of scope (honored)

- No code changes
- No `CERTIFICATION_LEDGER.md` modification
- No automatic certification award
- No program archive execution
- No council ratification execution

---

## Related

- [BUSINESS_ADMINISTRATION_FINAL_CERTIFICATION_RECOMMENDATION.md](./BUSINESS_ADMINISTRATION_FINAL_CERTIFICATION_RECOMMENDATION.md)
- [BUSINESS_ADMINISTRATION_REFERENCE_STATUS_REVIEW.md](./BUSINESS_ADMINISTRATION_REFERENCE_STATUS_REVIEW.md)
- [BUSINESS_ADMINISTRATION_PROGRAM_CLOSEOUT_RECOMMENDATION.md](./BUSINESS_ADMINISTRATION_PROGRAM_CLOSEOUT_RECOMMENDATION.md)

**Last updated:** 2026-06-18
