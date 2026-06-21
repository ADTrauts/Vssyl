# CG-1A — Council Checkpoint

**Program:** Vssyl Context Graph  
**Session:** CG-1A Council Checkpoint & CG-1B Authorization Review  
**Date:** 2026-06-18  
**Authority:** Platform Architecture Governance  
**Status:** **GOVERNANCE RECORD ONLY** — no implementation authorized by this document alone

**Inputs:**

- CG-0C ratification: [CONTEXT_GRAPH_COUNCIL_RATIFICATION.md](./CONTEXT_GRAPH_COUNCIL_RATIFICATION.md)
- CG-1A implementation: [CG_1A_IMPLEMENTATION_REPORT.md](./CG_1A_IMPLEMENTATION_REPORT.md)
- Constitutional compliance: [CG_1A_CONSTITUTIONAL_COMPLIANCE_REVIEW.md](./CG_1A_CONSTITUTIONAL_COMPLIANCE_REVIEW.md)
- CG-1B recommendation: [CG_1B_AUTHORIZATION_RECOMMENDATION.md](./CG_1B_AUTHORIZATION_RECOMMENDATION.md)

**Constraint:** No runtime code, schema, API, UI, adapter, or ledger changes in this session.

---

## 1. Checkpoint purpose

Council reviews CG-1A delivery against ratified federation architecture and decides whether to authorize **CG-1B — P1 Adapter Expansion** (read adapters only).

CG-1A is **complete**. This checkpoint does **not** reopen CG-0C architecture votes (RD-CG-001 through RD-CG-009).

---

## 2. CG-1A delivery summary

| Deliverable | Status | Evidence |
|-------------|--------|----------|
| Adapter registry | ✅ | `server/src/context-graph/adapterRegistry.ts` |
| `ContextGraphAdapter` contract | ✅ | `contextGraphTypes.ts` |
| Orchestrator | ✅ | `contextGraphOrchestrator.ts` |
| Bundle resolver | ✅ | `bundleResolver.ts` |
| Permission resolver | ✅ | `permissionResolver.ts` |
| P0 adapters (4) | ✅ | vlink, drive, calendar, todo |
| Read APIs (2) | ✅ | `GET .../vlinks/:id/bundle`, `POST .../bundle/resolve` |
| Tests | ✅ | 17/17 passing |
| CG-F-001 | ✅ Closed | Orchestrator + bundle resolver |
| CG-F-002 | ⚠️ Partially closed | Core bundle endpoints only |
| CG-F-003 | ✅ Closed | Registry + formal interface |

---

## 3. Required review questions — council answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Did CG-1A comply with the federated architecture? | **Yes** — read-only orchestrator composes module adapters; no universal SoR |
| 2 | Did CG-1A preserve V_Link as the association substrate? | **Yes** — attachment edges from V_Link SoR; no parallel relationship store |
| 3 | Did CG-1A avoid prohibited architecture? | **Yes** — no graph DB, ContextNode table, tag index, write APIs, graph UI, AI memory graph, N-hop social traversal |
| 4 | Were permissions enforced at every hop? | **Yes** — adapters delegate to module PE/access services; `shouldOmitNode` at bundle assembly |
| 5 | Are denied nodes omitted rather than leaked? | **Yes** — `denied` / `canRead: false` excluded from `nodes[]`; restricted nodes flagged |
| 6 | Are CG-F-001, CG-F-002, CG-F-003 properly closed? | **001 ✅ · 003 ✅ · 002 ⚠️ partial** — blockers closed for 1A scope; full Phase 1 read contract not yet implemented |
| 7 | Is the current read API sufficient for adapter expansion? | **Yes** — `POST /bundle/resolve` accepts any registered `moduleId:entityType`; registry extension is sufficient for 1B |
| 8 | Should CG-1B be authorized? | **Yes — APPROVE** (see authorization record) |
| 9 | Which adapters should CG-1B include? | **Notes, Notebook, Chat** (required); **Place** (conditional approve) |
| 10 | Which adapters should remain deferred? | HR, Scheduling, Workforce Communications, BA, Admin Portal, AI Memory, Tag Index, Graph UI |

---

## 4. Required council decisions

### A. CG-1A compliance

| Decision | **PARTIAL → PASS on constitutional axis** |
|----------|---------------------------------------------|
| **Verdict** | **PASS (constitutional) / PARTIAL (certification readiness)** |

**Rationale:**

- **PASS** on ratified federation constraints (RD-CG-002, RD-CG-003, RD-CG-004, RD-CG-005): all non-negotiables preserved.
- **PARTIAL** on full Phase 1 program completeness: CG-F-007 (traversal permission matrix) open; read API contract ~35% implemented; G6 test bar not yet at score 3.

Council does **not** fail CG-1A — blockers CG-F-001 and CG-F-003 are properly closed; CG-F-002 closed for 1A charter scope with documented residual for neighborhood/projection routes.

---

### B. CG-1B authorization

| Decision | **APPROVE** |
|----------|-------------|
| **Package** | CG-1B — P1 Adapter Expansion (read-only) |
| **Effective** | Upon council sign-off of [CG_1B_AUTHORIZATION_RECOMMENDATION.md](./CG_1B_AUTHORIZATION_RECOMMENDATION.md) |
| **Not authorized** | Projection API, graph UI, tag index, AI memory, business-domain adapters |

**Scope realignment note:** Post-ratification roadmap labeled "Phase 1B" as Graph Projection API. Council **reframes CG-1B** as adapter expansion first; projection API and entity neighborhood routes move to **CG-1B-prime** (or overlap track with 1C) — see authorization recommendation.

---

### C. Adapter scope (approved list)

| Priority | Module | Entity types | Condition |
|----------|--------|--------------|-----------|
| **P1 — Required** | Notes | `page` | Requires `notesVlinkAccessService` (CG-F-004) before or as first 1B deliverable |
| **P1 — Required** | Notebook | `page` (notebook) | Operational `NotebookLink` edges read-only |
| **P1 — Required** | Chat | `conversation` | `CHAT_THREAD` remains deferred (CG-F-009) |
| **P1 — Conditional** | Place | `listing`, `meeting` | Approve if Notes adapter lands first; otherwise defer to CG-1B-close |

**Deferred (explicit):** HR, Scheduling, Workforce Communications, Business Administration, Admin Portal, AI Memory, Tag Index.

---

### D. Certification readiness impact

| Milestone | G1–G9 (projected) | Certifiable? |
|-----------|-------------------|--------------|
| CG-0C (ratification) | 12/27 (~44%) | No |
| **CG-1A complete (now)** | **~19/27 (~70%)** | No |
| CG-1B complete (projected) | ~20/27 (~74%) | No |
| CG-1A–1C complete (prior target) | ~22/27 (~81%) | L3 WITH FINDINGS at CG-2 |

**Gate movement after CG-1A:**

| Gate | Pre-1A | Post-1A | Notes |
|------|--------|---------|-------|
| G2 | 2 | **3** | Read-only orchestrator; no universal SoR |
| G3 | 1 | **3** | Registry + interface + 4 P0 adapters |
| G4 | 0 | **2** | Core bundle endpoints; contract partial |
| G6 | 1 | **2** | 17 tests; matrix incomplete |
| G8 | 1 | **2** | Depth/budget caps in runtime |

CG-2 evaluation remains **blocked** until CG-1C (AI bundle formalization) and CG-F-007 closure.

---

### E. Risk changes

| Risk | Pre-1A | Post-1A / 1B |
|------|--------|--------------|
| Universal graph table creep | High (speculative) | **Reduced** — runtime proves federation without SoR duplication |
| V_Link bypass | Medium | **Reduced** — orchestrator routes through V_Link adapter |
| Permission traversal leak | High | **Reduced** — omit-denied model shipped; **residual** until CG-F-007 matrix |
| NOTE inline resolver debt | High (CG-F-004) | **Unchanged** — blocks Notes adapter quality until 1D/1B prerequisite |
| Tag = edge semantic collapse | Medium | **Unchanged** — no tag index; metadata model preserved |
| Adapter sprawl (business domains) | Medium | **New mitigation** — 1B scope capped to P1 modules only |
| Read API contract drift | Medium | **Reduced** for bundle paths; **residual** for unimplemented neighborhood/projection routes |
| AI pipeline bundle gap (CG-F-006) | High | **Unchanged** — deferred to CG-1C |

---

## 5. Council motions (this session)

| Motion | Vote | Outcome |
|--------|------|---------|
| **H. CG-1A constitutional compliance** | Pass / Partial / Fail | **PASS** (constitutional) |
| **I. CG-1A program acceptance** | Accept / Accept with findings / Reject | **ACCEPT WITH FINDINGS** |
| **J. CG-1B authorization** | Approve / Reject | **APPROVE** (P1 adapter expansion only) |
| **K. Ledger update** | Authorize / Defer | **DEFER** (per RD-CG-009) |

---

## 6. Stop condition

This checkpoint **stops here**. No CG-1B implementation, adapter work, runtime changes, schema changes, or UI until a separate **ACT** authorization with implementation charter is issued.

---

## Related documents

| Document | Purpose |
|----------|---------|
| [CG_1A_CONSTITUTIONAL_COMPLIANCE_REVIEW.md](./CG_1A_CONSTITUTIONAL_COMPLIANCE_REVIEW.md) | Constraint-by-constraint audit |
| [CG_1B_AUTHORIZATION_RECOMMENDATION.md](./CG_1B_AUTHORIZATION_RECOMMENDATION.md) | Formal 1B authorization record |
| [CG_1B_ADAPTER_EXPANSION_SCOPE.md](./CG_1B_ADAPTER_EXPANSION_SCOPE.md) | Adapter deliverable scope |
| [CG_1A_EXECUTIVE_SUMMARY.md](./CG_1A_EXECUTIVE_SUMMARY.md) | Executive brief |

**Last updated:** 2026-06-18
