# CG-1C — Authorization Recommendation

**Program:** Vssyl Context Graph  
**Session:** CG-1B Council Checkpoint  
**Date:** 2026-06-19  
**Authority:** Platform Architecture Governance  
**Status:** **RECOMMENDATION — APPROVE CG-1C** (governance only; no implementation in this document)

**Prerequisites met:**

- CG-1A complete — federation read foundation
- CG-1B complete — 8 adapters, 11 entity types, constitutional PASS
- CG-1B authorization scope fully delivered
- No permission leaks or ownership violations discovered

---

## 1. Recommendation summary

| Decision | **APPROVE** |
|----------|-------------|
| **Package** | **CG-1C — Test & Certification Evidence** |
| **Mode** | Tests, conformance validation, findings review, readiness scoring |
| **Duration (estimated)** | 2–4 weeks |
| **Explicit exclusion** | No new adapters, no APIs, no schema, no AI memory, no tag index, no graph UI |

Council **authorizes CG-1C** to produce certification-grade evidence for the existing 8-adapter federation runtime. Council **does not authorize** adapter expansion, projection/neighborhood APIs, or AI pipeline migration in this package.

---

## 2. Rationale for approval

1. **Runtime stable** — P0+P1 adapters operational; federation path proven across V_Link and NotebookLink.
2. **Evidence gap** — G6 score-3 requires ≥20 integration tests and traversal redaction matrix; current 30 tests include mocks — CG-1C closes the matrix gap.
3. **CG-2 prerequisite** — Certification evaluation requires documented test architecture, operation matrix validation, and updated G1–G9 scorecard.
4. **Scope discipline** — Adapter set declared **sufficient**; adding HR/BA adapters would expand Tier 0 scope without certification benefit.
5. **No constitutional blockers** — CG-1B PASS; remaining majors (CG-F-006, CG-F-007 partial) are addressable within test/cert track or waivable at CG-2.

---

## 3. Scope resequencing (roadmap note)

[CONTEXT_GRAPH_POST_RATIFICATION_ROADMAP.md](./CONTEXT_GRAPH_POST_RATIFICATION_ROADMAP.md) originally defined Phase 1C as **AI Context Bundle Formalization** (CG-F-006, pipeline migration, G5=3).

Council **resequences**:

| Track | Content | Authorization |
|-------|---------|---------------|
| **CG-1C** (this motion) | Test architecture, certification evidence, conformance matrices | **APPROVE** |
| **CG-1D** (future) | AI pipeline bundle formalization, CG-F-006, G5 elevation | **NOT AUTHORIZED** |
| **CG-1B-prime** (future) | Projection/neighborhood API, CG-F-008, rate limits | **NOT AUTHORIZED** |

This aligns with program directive: **CG-1C produces certification evidence without new adapters or AI ownership changes.**

---

## 4. Authorized deliverables (CG-1C)

See [CG_1C_TEST_AND_CERTIFICATION_SCOPE.md](./CG_1C_TEST_AND_CERTIFICATION_SCOPE.md) for full detail.

| # | Deliverable | Finding / gate impact |
|---|-------------|----------------------|
| 4.1 | Context Graph test architecture document | G6 |
| 4.2 | Adapter conformance test suite (all 8 adapters) | G3, G6 |
| 4.3 | Permission traversal matrix (≥10 scenarios) | CG-F-007, G1, G6 |
| 4.4 | Bundle consistency / descriptor contract tests | G4, G6 |
| 4.5 | Cross-adapter live-path integration tests (where feasible) | G6 |
| 4.6 | Operation matrix validation report | G7 |
| 4.7 | Findings register review + closure recommendations | CG-2 prep |
| 4.8 | Updated G1–G9 readiness scorecard | CG-2 prep |
| 4.9 | CG-1C implementation / closeout report | — |

---

## 5. Explicitly not authorized

| Item | Status |
|------|--------|
| New adapters (HR, Scheduling, WF, BA, Admin, AI Memory) | **NOT AUTHORIZED** |
| Tag index | **NOT AUTHORIZED** |
| Graph UI | **NOT AUTHORIZED** |
| Projection API (`GET /projection`) | **NOT AUTHORIZED** |
| Neighborhood API (`GET .../entities/.../context`) | **NOT AUTHORIZED** |
| AI memory graph / grounding bundle endpoint | **NOT AUTHORIZED** |
| Prisma schema / migrations | **NOT AUTHORIZED** |
| Ledger updates | **NOT AUTHORIZED** |
| CG-2 certification award | **NOT AUTHORIZED** (evaluation follows 1C) |

---

## 6. Exit criteria (CG-1C)

| Criterion | Target |
|-----------|--------|
| Adapter conformance tests | All 8 adapters covered |
| Permission traversal matrix | ≥10 integration scenarios PASS |
| Bundle descriptor contract tests | Contract version 1.0 validated |
| Cumulative context-graph tests | ≥40 |
| CG-F-007 | **Closed** or documented waivable residual |
| G6 score | **3** (projected) |
| G1–G9 total | **≥24/27 (~89%)** |
| CG-1C closeout report | Published |
| Constitutional re-audit | PASS (no runtime scope creep) |

---

## 7. Required questions — authorization answers

| # | Question | Answer |
|---|----------|--------|
| 11 | P0/P1 sufficient for CG-1C evidence? | **Yes** |
| 12 | Authorize CG-1C? | **Yes — APPROVE** |

---

## 8. Council motion record

| Field | Value |
|-------|-------|
| **Motion** | Authorize CG-1C — Test & Certification Evidence |
| **Vote** | **APPROVE** |
| **Conditions** | No new adapters; no API/schema/UI changes |
| **Implementation start** | Separate ACT charter — **not started by this document** |
| **Ledger** | **DEFER** (RD-CG-009) |

---

## 9. Post-CG-1C path

| Next step | Trigger |
|-----------|---------|
| **CG-2** certification evaluation | CG-1C exit criteria met |
| **CG-1D** AI bundle (optional) | Separate authorization if G5=3 required before CG-2 |
| **CG-1B-prime** projection API | Separate authorization |

**Last updated:** 2026-06-19
