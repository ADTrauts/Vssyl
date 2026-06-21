# Context Graph — Findings Review (CG-2)

**Program:** CG-2 — Certification Evaluation  
**Date:** 2026-06-19  
**Register authority:** [CONTEXT_GRAPH_FINDINGS_REGISTER.md](./CONTEXT_GRAPH_FINDINGS_REGISTER.md)

---

## Summary disposition

| Classification | Count |
|----------------|------:|
| **Closed** | 6 |
| **Open** | 2 |
| **Downgraded** | 1 |
| **Waivable (open)** | 2 |
| **Partial / advisory open** | 6 |

| Severity | Open at CG-2 | Closed at CG-2 |
|----------|-------------:|---------------:|
| Blocking | **0** | **2** |
| Major | **2** | **3** (+ CG-F-004 graph-path) |
| Advisory | **6** | 0 (+ CG-F-010 partial) |

---

## Full findings register (CG-F-001 through CG-F-015)

| ID | Severity | CG-2 status | Classification | CG-2 notes |
|----|----------|-------------|----------------|------------|
| **CG-F-001** | Blocking | **Closed** | Closed | Orchestrator + bundle resolver shipped (CG-1A) |
| **CG-F-002** | Blocking | **Closed** | Closed | Core read bundle APIs live; full contract partial — acceptable for L3 WF |
| **CG-F-003** | Major | **Closed** | Closed | Registry + 8 adapters (CG-1A/1B) |
| **CG-F-004** | Major | **Closed (graph path)** | Closed + **Downgraded residual** | Access service + adapter complete; lifecycle unlink + manifest → **advisory residual** (not blocking) |
| **CG-F-005** | Major | **Open** | **Waivable** | Tag index Phase 2A — metadata model preserved; defer acceptable at L3 WF |
| **CG-F-006** | Major | **Open** | **Waivable** | AI pipeline not on `ContextBundleDescriptor`; bundle runtime exists — CG-1D track |
| **CG-F-007** | Major | **Closed** | Closed | 13-scenario matrix (CG-1C) |
| **CG-F-008** | Advisory | **Open** | Open | Projection API deferred (CG-1B-prime) |
| **CG-F-009** | Advisory | **Open** | Open | CHAT_THREAD enum unresolved |
| **CG-F-010** | Advisory | **Partial → Closed** | **Downgraded to closed** | NotebookLink edges via notebook/notes adapters (CG-1B) |
| **CG-F-011** | Advisory | **Open** | Open | BA adapters intentionally out of Tier 0 scope |
| **CG-F-012** | Advisory | **Open** | Open | Pull-based; no graph cache invalidation |
| **CG-F-013** | Advisory | **Open** | Open | VLinkActivity not normalized module envelope |
| **CG-F-014** | Advisory | **Open** | Open | PLATFORM_ENTITY_MODEL doc drift |
| **CG-F-015** | Advisory | **Open** | Open | Admin diagnostic route + impersonation policy (projection dependent) |

---

## Closed findings — closure evidence

### CG-F-001 — Federation orchestrator

| Field | Value |
|-------|-------|
| Closed | CG-1A (2026-06-18) |
| Evidence | `contextGraphOrchestrator.ts`, `bundleResolver.ts` |

### CG-F-002 — Read API

| Field | Value |
|-------|-------|
| Closed | CG-1A (2026-06-18) |
| Evidence | `GET /vlinks/:id/bundle`, `POST /bundle/resolve` |
| Residual | Neighborhood/projection routes — advisory via CG-F-008 |

### CG-F-003 — Adapter contracts

| Field | Value |
|-------|-------|
| Closed | CG-1A (2026-06-18) |
| Evidence | `ContextGraphAdapter`; registry 8 adapters |

### CG-F-004 — NOTE resolver

| Field | Value |
|-------|-------|
| Closed | CG-1B graph access path |
| Evidence | `notesVlinkAccessService.ts`; `notesAdapter.ts` |
| Downgraded residual | Lifecycle unlink, manifest declaration → track under CG-F-014 hygiene |

### CG-F-007 — Permission contract tests

| Field | Value |
|-------|-------|
| Closed | CG-1C (2026-06-19) |
| Evidence | `traversalPermissionMatrix.test.ts`; [CG_1C_PERMISSION_TRAVERSAL_MATRIX.md](./CG_1C_PERMISSION_TRAVERSAL_MATRIX.md) |

### CG-F-010 — NotebookLink federation

| Field | Value |
|-------|-------|
| Closed | CG-1B (2026-06-19) |
| Evidence | `notebookAdapter.ts`, `notebook.link` edges in notes adapter |

---

## Open major findings — waivable analysis

### CG-F-005 — No Tag Index

| Field | Value |
|-------|-------|
| Waivable at L3 WF? | **Yes** |
| Rationale | Ratified tag model is metadata-only; Phase 2A authorized separately; no constitutional violation |
| Blocks plain L3? | **Yes** — until closed or accepted as permanent deferral at promotion review |

### CG-F-006 — No formal AI bundle format (pipeline)

| Field | Value |
|-------|-------|
| Waivable at L3 WF? | **Yes** |
| Rationale | Runtime `ContextBundleDescriptor` shipped; pipeline migration is CG-1D; AI remains consumer not owner |
| Blocks plain L3? | **Yes** — G5 score 2 |

---

## Findings preventing plain LEVEL 3 CERTIFIED

| Finding / gate | Blocks plain L3? |
|----------------|------------------|
| CG-F-005 (tag index) | Yes — open major |
| CG-F-006 (AI pipeline bundle) | Yes — open major |
| G4 partial (API contract) | Contributes — not a finding ID |
| G8 partial (rate limits) | Contributes |
| G9 partial (UX/onboarding) | Contributes |
| Advisory backlog (6) | No — acceptable at L3 WF |

**Plain L3 path:** Close or waive CG-F-005/CG-F-006 at promotion review; optional CG-1B-prime + CG-1D; close advisories at CG-5.

---

## CG-2 findings register update (recommended at CG-3)

| Action | Finding |
|--------|---------|
| Mark closed | CG-F-010 |
| Mark waivable | CG-F-005, CG-F-006 |
| Downgrade residual | CG-F-004 lifecycle/manifest → advisory sub-item under CG-F-014 |

**This document does not modify the canonical register** — CG-3 council session should apply updates upon certification award.

**Last updated:** 2026-06-19
