# Business Administration Certification Evaluation

**Program:** BA-2 — Certification Review  
**Date:** 2026-06-18  
**Subdomain:** Business Administration (Org Chart, Permissions, Configuration, Approval Boundaries)  
**Constraint:** Evaluation only — no code, no ledger, no certification award

**Inputs consumed:**

- [BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md](./BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md)
- [BUSINESS_ADMINISTRATION_CERTIFICATION_FRAMEWORK.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_FRAMEWORK.md)
- [BUSINESS_ADMINISTRATION_FINDINGS_REGISTER.md](./BUSINESS_ADMINISTRATION_FINDINGS_REGISTER.md)
- [BUSINESS_ADMINISTRATION_EXECUTIVE_SUMMARY_PHASE_0B.md](./BUSINESS_ADMINISTRATION_EXECUTIVE_SUMMARY_PHASE_0B.md)
- [BA_1A_IMPLEMENTATION_REPORT.md](./BA_1A_IMPLEMENTATION_REPORT.md)
- [BA_1B_IMPLEMENTATION_REPORT.md](./BA_1B_IMPLEMENTATION_REPORT.md)
- [BA_1C_IMPLEMENTATION_REPORT.md](./BA_1C_IMPLEMENTATION_REPORT.md)
- [BA_1D_TEST_COVERAGE_REPORT.md](./BA_1D_TEST_COVERAGE_REPORT.md)
- [BA_1D_CERTIFICATION_EVIDENCE.md](./BA_1D_CERTIFICATION_EVIDENCE.md)
- [BA_1E_IMPLEMENTATION_REPORT.md](./BA_1E_IMPLEMENTATION_REPORT.md)
- [BA_1E_UX_SHELL_AUDIT.md](./BA_1E_UX_SHELL_AUDIT.md)

---

## 1. Executive determination

| Decision | Outcome |
|----------|---------|
| **Certification recommendation** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Validated score** | **22/27 (~81%)** |
| **Review readiness** | **CONDITIONALLY READY** (borderline on 85% threshold) |
| **Blocking findings** | **0 open** |
| **Open major findings** | **1** (BA-F-005) |

**Rationale:** BA-1A through BA-1E closed all blocking findings (BA-F-001, BA-F-002) and the majority of majors. Constitutional gates G2, G3, G6, and G9 are at PASS. G1, G4, G5, G7, and G8 remain PARTIAL. BA-F-005 (approval hierarchy schema without runtime) prevents plain L3 CERTIFIED but is waiver-eligible under L3 WITH FINDINGS per framework §6. Score 22/27 is below the 85% READY FOR REVIEW ideal but above 70% CONDITIONALLY READY with zero blockers — consistent with Admin Portal L3 WITH FINDINGS precedent before final closeout.

**Not recommended:** NOT CERTIFIED (blockers closed, score &gt;70%, core constitutional compliance achieved).  
**Not recommended:** LEVEL 3 CERTIFIED (BA-F-005 major open; G1 not full PASS on 7-mount cluster).

---

## 2. Program trajectory

| Phase | Score | Posture |
|-------|-------|---------|
| Phase 0A (pre-BA-1) | 13/27 (~48%) | NOT READY |
| Post BA-1A | ~17/27 | CONDITIONALLY READY |
| Post BA-1B | ~19/27 | CONDITIONALLY READY |
| Post BA-1C | ~21/27 | CONDITIONALLY READY |
| Post BA-1D | ~21/27 | READY FOR REVIEW (G6 PASS) |
| Post BA-1E | ~23/27 (claimed) | READY FOR REVIEW (G9 PASS) |
| **BA-2 validated** | **22/27 (~81%)** | **L3 WITH FINDINGS eligible** |

---

## 3. Gate-by-gate evaluation (G1–G9)

### G1 — Authorization

**Score: 2 / 3 — PARTIAL**

| Criterion | Evidence | Result |
|-----------|----------|--------|
| Core `/api/business` mutations PE dual | [BA_1C](./BA_1C_IMPLEMENTATION_REPORT.md): 8/8 writes; `businessAdminPolicyDual.ts`; 16 tests PASS | **PASS** |
| `/api/org-chart` mutations PE dual | [BA_1C](./BA_1C_IMPLEMENTATION_REPORT.md): 18/18 writes; `orgChartPolicyDual.ts` | **PASS** |
| `business:create` bootstrap PE | [BA_1C](./BA_1C_IMPLEMENTATION_REPORT.md): `business:create` action | **PASS** |
| Integration mounts (SSO, webhooks, modules, business-front, business-ai) | [BA_1C](./BA_1C_IMPLEMENTATION_REPORT.md) §Out of scope; [REALITY](./BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md) §1.1 | **FAIL** (partial cluster) |
| Membership / invite authZ | [BA_1D](./BA_1D_CERTIFICATION_EVIDENCE.md): integration tests | **PASS** |

**Disposition:** Core BA authorization is constitutional. Integration-mount PE gaps tracked as BA-F-003-R1 advisory — not blocking but prevents G1=3.

---

### G2 — Auditability

**Score: 3 / 3 — PASS**

| Criterion | Evidence | Result |
|-----------|----------|--------|
| Normalized activity on mutations | [BA_1A](./BA_1A_IMPLEMENTATION_REPORT.md): 26 wired mutations | **PASS** |
| Domain events fan-out | [BA_1A](./BA_1A_IMPLEMENTATION_REPORT.md): `businessAdminDomainEvents.ts` | **PASS** |
| Deny-before-activity | [BA_1D](./BA_1D_TEST_COVERAGE_REPORT.md): org-chart-policy-activity integration | **PASS** |
| Activity vs analytics separation | [BA_1A](./BA_1A_IMPLEMENTATION_REPORT.md): module activity envelope | **PASS** |

**Disposition:** BA-F-001 closed. G2 was FAIL at Phase 0A — now canonical PASS.

---

### G3 — Service boundaries

**Score: 3 / 3 — PASS**

| Criterion | Evidence | Result |
|-----------|----------|--------|
| Thin controllers | [BA_1B](./BA_1B_IMPLEMENTATION_REPORT.md): `businessController` 0 Prisma | **PASS** |
| Named services | [BA_1B](./BA_1B_IMPLEMENTATION_REPORT.md): 7 extracted services | **PASS** |
| Boundary contract tests | [BA_1D](./BA_1D_TEST_COVERAGE_REPORT.md): `businessAdministrationBoundary.contract.test.ts` 9/9 | **PASS** |
| Org-chart service decomposition | [REALITY](./BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md): pre-existing thin routes | **PASS** |

**Disposition:** BA-F-002 closed. G3 was FAIL at Phase 0A — now canonical PASS.

---

### G4 — API coherence

**Score: 2 / 3 — PARTIAL**

| Criterion | Evidence | Result |
|-----------|----------|--------|
| Mount inventory documented | [REALITY](./BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md) §1.1: 7 mounts | **PASS** |
| Consistent error shapes | [BA_1D](./BA_1D_CERTIFICATION_EVIDENCE.md): integration assertions | **PASS** |
| Unified facade / gateway | None; BA-F-008 open | **FAIL** |
| Route naming standard | Mixed legacy (`/api/business-front`) vs canonical | **PARTIAL** |

**Disposition:** Coherent cluster map exists; fragmentation acceptable for L3 WITH FINDINGS. BA-F-008 deferred.

---

### G5 — Ownership

**Score: 2 / 3 — PARTIAL**

| Criterion | Evidence | Result |
|-----------|----------|--------|
| BA vs BO vs AP boundary docs | [REALITY](./BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md); [REFERENCE](./BUSINESS_ADMINISTRATION_REFERENCE_ASSESSMENT.md) §5 | **PASS** |
| Cross-domain widget ownership | `StationsAndPositionsEditor` — BA-F-009 | **PARTIAL** |
| IA ownership (`/admin/hr` vs workspace) | BA-F-010 | **PARTIAL** |
| Org-chart + permissions ownership | Clear BA subdomain | **PASS** |

**Disposition:** Teaching ownership is clear for core subdomain; peripheral surfaces remain ambiguous.

---

### G6 — Test evidence

**Score: 3 / 3 — PASS**

| Criterion | Evidence | Result |
|-----------|----------|--------|
| `/api/business` integration tests | [BA_1D](./BA_1D_TEST_COVERAGE_REPORT.md): 12 tests | **PASS** |
| Org-chart PE + activity integration | [BA_1D](./BA_1D_TEST_COVERAGE_REPORT.md): 8 tests | **PASS** |
| PE unit tests | [BA_1C](./BA_1C_IMPLEMENTATION_REPORT.md): 16 tests | **PASS** |
| Service boundary contracts | [BA_1D](./BA_1D_TEST_COVERAGE_REPORT.md): 9 tests | **PASS** |
| Client config context | [BA_1D](./BA_1D_TEST_COVERAGE_REPORT.md): 6 tests | **PASS** |
| UX shell regression | [BA_1E](./BA_1E_IMPLEMENTATION_REPORT.md): 7 tests | **PASS** |
| **Total evidence suite** | **57/57 PASS** (server + web) | **PASS** |

**Disposition:** BA-F-004 closed. G6 was FAIL at Phase 0A — now canonical PASS.

---

### G7 — Documentation

**Score: 2 / 3 — PARTIAL**

| Criterion | Evidence | Result |
|-----------|----------|--------|
| `docs/business-administration/` corpus | BA-1A..1E reports, framework, reality, findings | **PASS** |
| Operation matrix in `docs/architecture/audits/` | BA-F-011: not present | **FAIL** |
| Config sync contract | [BA_1A_CONFIG_SYNC_CONTRACT](./BA_1A_CONFIG_SYNC_CONTRACT.md) | **PASS** |
| Certification framework | [CERTIFICATION_FRAMEWORK](./BUSINESS_ADMINISTRATION_CERTIFICATION_FRAMEWORK.md) | **PASS** |

**Disposition:** Rich subdomain docs; audits-path matrix gap prevents G7=3.

---

### G8 — Production safety

**Score: 2 / 3 — PARTIAL**

| Criterion | Evidence | Result |
|-----------|----------|--------|
| Config realtime sync | [BA_1A](./BA_1A_CONFIG_SYNC_CONTRACT.md); [BA_1D](./BA_1D_CERTIFICATION_EVIDENCE.md) | **PASS** |
| Polling fallback | [BA_1D](./BA_1D_CERTIFICATION_EVIDENCE.md): client tests | **PASS** |
| Approval hierarchy truthfulness | BA-F-005: schema only, no runtime | **FAIL** |
| Dangerous migration ops | Out of BA subdomain scope | N/A |

**Disposition:** BA-F-006 closed. BA-F-005 keeps G8 at PARTIAL — model exists but is not operable; no user-facing broken UI, but governance gap remains.

---

### G9 — UX consistency

**Score: 3 / 3 — PASS**

| Criterion | Evidence | Result |
|-----------|----------|--------|
| No native confirm/prompt in BA tree | [BA_1E](./BA_1E_UX_SHELL_AUDIT.md): 11 → 0 | **PASS** |
| EmptyState on list surfaces | [BA_1E](./BA_1E_IMPLEMENTATION_REPORT.md): 10+ surfaces | **PASS** |
| Design token alignment | [BA_1E](./BA_1E_UX_STANDARDIZATION_MATRIX.md): 1,187 migrated; 97 residual advisory | **PASS** |
| Modal/confirm shell pattern | `useConfirm` / `ConfirmModal` / `Modal` | **PASS** |

**Disposition:** BA-F-007 closed. G9 was FAIL at Phase 0A — now canonical PASS. Residual tokens (BA-F-013 downgraded) do not reduce gate score.

---

## 4. Findings disposition summary

See [BUSINESS_ADMINISTRATION_FINDINGS_REVIEW.md](./BUSINESS_ADMINISTRATION_FINDINGS_REVIEW.md).

| Status | IDs |
|--------|-----|
| **CLOSED** | BA-F-001, BA-F-002, BA-F-003 (core), BA-F-004, BA-F-006, BA-F-007, BA-F-014, BA-F-015 |
| **OPEN (major)** | BA-F-005 |
| **OPEN (advisory)** | BA-F-008, BA-F-009, BA-F-010, BA-F-011, BA-F-012, BA-F-003-R1 |
| **DOWNGRADED** | BA-F-003 (integration residual), BA-F-013 (token hygiene) |

---

## 5. Decision matrix

### 5.1 Certification recommendation

| Option | Fit | Verdict |
|--------|-----|---------|
| NOT CERTIFIED | Blockers closed; G2/G3/G6 PASS; 81% | **Reject** |
| LEVEL 3 CERTIFIED WITH FINDINGS | 1 major open; ≤3 majors; constitutional gates pass | **Recommend** |
| LEVEL 3 CERTIFIED | Requires zero majors | **Reject** (BA-F-005) |

### 5.2 BA-F-005 — approval hierarchy impact

| Question | Answer |
|----------|--------|
| Blocks certification entirely? | **No** — no runtime exposure; HR uses ad-hoc manager routes |
| Blocks plain L3? | **Yes** |
| Acceptable as finding on L3 WITH FINDINGS? | **Yes** — with council waiver and marketing guardrails |
| Reference impact? | **Blocks #OC-3 Approval Boundaries** until implemented |

### 5.3 BA-F-006 — realtime config sync impact

| Question | Answer |
|----------|--------|
| Status | **CLOSED** |
| Evidence | Producer `broadcastBusinessConfigUpdated`; consumer listener; contract + integration tests; polling fallback |
| Residual | No live browser WebSocket E2E — **advisory only**, not reopening |

### 5.4 Reference status

See [BUSINESS_ADMINISTRATION_REFERENCE_REVIEW.md](./BUSINESS_ADMINISTRATION_REFERENCE_REVIEW.md).

| Designation | Recommendation |
|-------------|----------------|
| Reference Implementation (L4) | **Not eligible** — File Hub only |
| Reference Module | **Not eligible** — not a module |
| Reference Domain | **Not eligible** — BO program scope |
| **Reference Platform Capability (candidate)** | **#OC-1 Org Chart + #OC-2 Permissions** — council vote after L3 WITH FINDINGS ratification |
| Reference Candidate (subset) | **Yes** — conditional on council |

### 5.5 Next initiative

| Option | Priority | Rationale |
|--------|----------|-----------|
| **Council Ratification** | **1 (recommended)** | L3 WITH FINDINGS + reference capability vote is the natural BA-2 closeout |
| BA-F-005 implementation | 2 | Major open finding; unlocks #OC-3 and G8=3 |
| Business Operations BO-1A | 3 | Parallel domain program; does not block BA cert |
| Context Graph Platform | 4 | Cross-cutting; not BA-blocking |
| BA-F-003-R1 integration PE | 5 | Advisory; G1 uplift |

---

## 6. Certification award preconditions (for council — not executed in BA-2)

If council ratifies **LEVEL 3 CERTIFIED WITH FINDINGS**:

1. Record promotion in certification ledger (post-ratification only — **not done in BA-2**)
2. Publish BA operation matrix to `docs/architecture/audits/` (BA-F-011)
3. Issue BA-F-005 waiver with implementation target date
4. Schedule reference capability vote for #OC-1 and #OC-2
5. Do not market approval chains as shipped until BA-F-005 closes

---

## 7. Evidence index

| Artifact | Path |
|----------|------|
| Activity architecture | `server/src/services/businessAdminActivityService.ts`, `businessAdminDomainEvents.ts` |
| Service extraction | `server/src/services/businessAdmin*.ts` (7 services) |
| PE dual | `server/src/auth/businessAdminPolicyDual.ts`, `orgChartPolicyDual.ts` |
| Integration tests | `server/src/routes/__tests__/business-administration.integration.test.ts` |
| Config sync | `server/src/services/businessConfigRealtimeService.ts` |
| UX shell | `web/src/components/business/BusinessAdminEmptyState.tsx` |
| UX tests | `web/src/lib/__tests__/businessAdministrationUxShell.test.ts` |

---

## Related

- [BUSINESS_ADMINISTRATION_CERTIFICATION_SCORECARD.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_SCORECARD.md)
- [BUSINESS_ADMINISTRATION_CERTIFICATION_EXECUTIVE_SUMMARY.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_EXECUTIVE_SUMMARY.md)
