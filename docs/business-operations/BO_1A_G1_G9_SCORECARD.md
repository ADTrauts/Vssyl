# BO-1A G1–G9 Scorecard

**Program:** Business Operations — Council Checkpoint (post BO-1A)  
**Date:** 2026-06-19  
**Authority:** [BUSINESS_OPERATIONS_CERTIFICATION_FRAMEWORK.md](./BUSINESS_OPERATIONS_CERTIFICATION_FRAMEWORK.md)  
**Baseline:** Phase 0B scores (2026-06-18)  
**Constraint:** Governance reassessment only — no runtime verification performed in this checkpoint

---

## Scoring legend

| Score | Meaning |
|-------|---------|
| **3** | PASS — meets gate with high-confidence evidence |
| **2** | PARTIAL / PASS WITH FINDINGS — substantial progress; tracked advisories |
| **1** | FAIL — material violation |
| **0** | Critical failure |

Max per gate: **3** · Domain max: **27**

---

## Scorecard

| Gate | Previous (0B) | Current (post BO-1A) | Δ | Rationale |
|------|---------------|----------------------|---|-----------|
| **G1 Authorization** | 2 | **2** | +0 | HR ~98% PE; WC 100%; scheduling critical/aux paths closed (BO-1A). ~40% scheduling team/employee read routes still legacy-middleware-only (advisory). |
| **G2 Auditability** | 2 | **3** | **+1** | F-SCH-007 closed — claim path emits activity + domain event. Advisory: F-SCH-011 (no module audit trail), F-HR-008 (partial employee audit). |
| **G3 Service boundaries** | 2 | **3** | **+1** | F-SCH-004, F-HR-003 closed — AI context Prisma moved to constitutional services. Advisory: F-SCH-008 dashboard reads. |
| **G4 API coherence** | 2 | **3** | **+1** | BO-F-D02 closed — HR↔WC bridge integration service + admin routes. Advisory: `hrScheduleService` cross-package (BO-F-D04). |
| **G5 Ownership** | 3 | **3** | +0 | Boundary docs + ownership model unchanged; bridge contract documented in BO-1A architecture docs. |
| **G6 Test evidence** | 2 | **2** | +0 | BO-1A added 19 passing unit tests (activity, domain events, manifest, PE dual). No new cross-module HTTP integration suite. |
| **G7 Documentation** | 2 | **3** | **+1** | BO-F-D01 closed — trio + domain annex in `docs/architecture/audits/`. BO-1A deliverable set complete. Advisory: BO-F-D06 identity doc scatter. |
| **G8 Production safety** | 1 | **2** | **+1** | BO-F-D03 closed — 8/8 scheduling AI actions implemented. Advisory: analytics 501 trio (F-SCH-009), enterprise HR stubs (F-HR-009). |
| **G9 UX consistency** | 1 | **1** | +0 | **No BO-1A UX work.** Scheduling still has 9+ native `confirm()`/`prompt()` calls; BO-F-D05 open. WC partial ConfirmModal; HR no native dialogs but inconsistent shell naming. |
| **Total** | **17 / 27 (~63%)** | **22 / 27 (~81%)** | **+5** | |

---

## Threshold evaluation (framework §3.2)

| Threshold | Requirement | Post BO-1A |
|-----------|-------------|------------|
| NOT READY | &lt;70% OR blocking OR G8/G9 FAIL | **G9 still FAIL** — domain review bar not met |
| CONDITIONALLY READY | ≥70%, zero blocking, ≤3 domain majors | **Met** (0 majors; ~81%) |
| READY FOR DOMAIN REVIEW | ≥85%, zero blocking, **G9 ≥2** | **Not met** — score ~81%; G9 = 1 |
| Domain Reference Candidate | ≥85%, zero domain majors, council vote | Majors closed; G9 blocks |

---

## Gate-by-gate evidence pointers

| Gate | Primary evidence (post BO-1A) |
|------|-------------------------------|
| G1 | [BO_1A_POLICY_ENGINE_COVERAGE_REPORT.md](./BO_1A_POLICY_ENGINE_COVERAGE_REPORT.md) |
| G2 | [BO_1A_ACTIVITY_AND_EVENT_MODEL.md](./BO_1A_ACTIVITY_AND_EVENT_MODEL.md) |
| G3 | [BO_1A_AI_OWNERSHIP_ALIGNMENT.md](./BO_1A_AI_OWNERSHIP_ALIGNMENT.md) |
| G4 | [BO_1A_DOMAIN_INTEGRATION_ARCHITECTURE.md](./BO_1A_DOMAIN_INTEGRATION_ARCHITECTURE.md) |
| G5 | [BUSINESS_OPERATIONS_OWNERSHIP_MODEL.md](./BUSINESS_OPERATIONS_OWNERSHIP_MODEL.md) |
| G6 | BO-1A test run (19 passed); module test inventory in Phase 0B reality assessment |
| G7 | [BO_1A_OPERATION_MATRIX_PUBLICATION_REPORT.md](./BO_1A_OPERATION_MATRIX_PUBLICATION_REPORT.md) |
| G8 | BO-1A AI manifest alignment; open 501 analytics documented as advisory |
| G9 | Scheduling UX grep (`confirm`/`prompt` in 7 component files); BO-F-D05 |

---

## Council note

BO-1A improved constitutional and integration gates (+5 points) but **did not address G9**. Per framework rules, **G9 FAIL prevents READY FOR DOMAIN REVIEW** regardless of overall percentage gain.
