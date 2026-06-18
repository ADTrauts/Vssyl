# Business Administration Certification Scorecard

**Program:** BA-2 — Certification Review  
**Evaluation date:** 2026-06-18  
**Evaluator:** Platform Architecture (BA-2 review program)  
**Framework:** G1–G9 Platform Subdomain Adaptation  
**Constraint:** Assessment only — no certification awarded; no ledger updates

**Baseline:** Phase 0A NOT READY — **13/27 (~48%)**  
**Post BA-1A–1E (claimed):** ~23/27 (~85%)  
**BA-2 validated score:** **22/27 (~81%)**

---

## Gate scorecard

| # | Gate | Phase 0A | Post BA-1 (validated) | Max | Status | Evidence |
|---|------|----------|-------------------------|-----|--------|----------|
| G1 | Authorization | 2 | **2** | 3 | **PARTIAL** | Core `/api/business` 8/8 + `/api/org-chart` 18/18 PE dual ([BA_1C](./BA_1C_IMPLEMENTATION_REPORT.md)); integration mounts (~14 writes) lack PE ([BA_1C](./BA_1C_IMPLEMENTATION_REPORT.md) §Out of scope) |
| G2 | Auditability | 0 | **3** | 3 | **PASS** | 26 mutations wired; activity + domain events ([BA_1A](./BA_1A_IMPLEMENTATION_REPORT.md)); deny-before-activity tests ([BA_1D](./BA_1D_TEST_COVERAGE_REPORT.md)) |
| G3 | Service boundaries | 1 | **3** | 3 | **PASS** | `businessController` 0 Prisma ([BA_1B](./BA_1B_IMPLEMENTATION_REPORT.md)); boundary contract tests ([BA_1D](./BA_1D_TEST_COVERAGE_REPORT.md)) |
| G4 | API coherence | 2 | **2** | 3 | **PARTIAL** | 7-mount cluster documented ([REALITY](./BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md)); no facade; BA-F-008 open |
| G5 | Ownership | 2 | **2** | 3 | **PARTIAL** | BA/BO/AP docs exist; cross-domain widgets (BA-F-009); IA split (BA-F-010) |
| G6 | Test evidence | 1 | **3** | 3 | **PASS** | 57 tests PASS ([BA_1D](./BA_1D_TEST_COVERAGE_REPORT.md)); UX shell +7 ([BA_1E](./BA_1E_IMPLEMENTATION_REPORT.md)) |
| G7 | Documentation | 2 | **2** | 3 | **PARTIAL** | Rich `docs/business-administration/`; operation matrix **not** in `docs/architecture/audits/` (BA-F-011) |
| G8 | Production safety | 2 | **2** | 3 | **PARTIAL** | Config sync closed ([BA_1A](./BA_1A_CONFIG_SYNC_CONTRACT.md), [BA_1D](./BA_1D_CERTIFICATION_EVIDENCE.md)); `ManagerApprovalHierarchy` unwired (BA-F-005) |
| G9 | UX consistency | 1 | **3** | 3 | **PASS** | 0 native confirm in BA tree; EmptyState 10+; v-* dominant ([BA_1E](./BA_1E_UX_SHELL_AUDIT.md)); 97 residual `gray-*` advisory |
| | **Total** | **13** | **22** | **27** | **~81%** | |

---

## Scoring rationale (validated adjustments)

### G1 — scored 2, not 3

BA-1C closed PE on **core** mounts only. Certification framework §4.5 documents ~14 integration-mount writes (SSO, webhooks, modules, business-front, business-ai) without PE dual. This is not a blocking regression but prevents full G1 PASS per framework criterion: *"All BA mutation routes."*

### G8 — scored 2, not 3

BA-F-006 is **closed** for config realtime (producer contract, consumer listener, contract tests, polling fallback). BA-F-005 remains a **governance production-safety gap**: schema + org-chart relations exist with zero server runtime. Model is not exposed as broken UI, but the gate criterion includes approval-boundary truthfulness.

### G9 — scored 3

BA-1E meets all three G9 criteria for in-scope BA surfaces. Residual token drift (97 `gray-*`) is documented PASS WITH FINDINGS per [BA_1E_UX_SHELL_AUDIT](./BA_1E_UX_SHELL_AUDIT.md) — does not reduce gate score below PASS on 0–3 scale (Admin Portal precedent).

### Score vs BA-1E estimate (23/27)

The 1-point delta is **G1**: BA-1C report scored G1 PASS for core mounts; BA-2 applies full 7-mount cluster criterion from [CERTIFICATION_FRAMEWORK](./BUSINESS_ADMINISTRATION_CERTIFICATION_FRAMEWORK.md) §2.

---

## Threshold evaluation

| Threshold | Requirement | BA-2 result |
|-----------|-------------|-------------|
| NOT READY | &lt;70% or G2/G3/G6 FAIL or blocking finding | **Not met** — 81%, G2/G3/G6 PASS, blocking closed |
| CONDITIONALLY READY | ≥70%, zero blocking, majors tracked | **Met** |
| READY FOR REVIEW | ≥85%, G2≥2, G3≥2, G9≥2 | **Borderline** — 81% (below 85%); G2/G3/G9 exceed minimum |
| L3 WITH FINDINGS | Review pass + ≤3 open majors | **Eligible** — 1 open major (BA-F-005) |
| L3 CERTIFIED | Review pass + zero majors | **Not eligible** — BA-F-005 open |
| REFERENCE CANDIDATE | L3 + council + teaching value | **Eligible for vote** — see [REFERENCE_REVIEW](./BUSINESS_ADMINISTRATION_REFERENCE_REVIEW.md) |

---

## Peer comparison (post BA-1)

| Program | G1–G9 | Posture |
|---------|-------|---------|
| Admin Portal (post-modernization) | 27/27 | L3 Certified |
| Business Administration (BA-2) | **22/27** | L3 WITH FINDINGS eligible |
| Business Operations (Phase 0B) | ~17/27 | NOT READY |

---

## Related

- [BUSINESS_ADMINISTRATION_CERTIFICATION_EVALUATION.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_EVALUATION.md)
- [BUSINESS_ADMINISTRATION_FINDINGS_REVIEW.md](./BUSINESS_ADMINISTRATION_FINDINGS_REVIEW.md)
