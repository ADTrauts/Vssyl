# CG-1B — Authorization Recommendation

**Program:** Vssyl Context Graph  
**Session:** CG-1A Council Checkpoint  
**Date:** 2026-06-18  
**Authority:** Platform Architecture Governance  
**Status:** **RECOMMENDATION — APPROVE CG-1B** (governance only; no implementation in this document)

**Prerequisites met:**

- CG-1A complete — [CG_1A_IMPLEMENTATION_REPORT.md](./CG_1A_IMPLEMENTATION_REPORT.md)
- Constitutional compliance PASS — [CG_1A_CONSTITUTIONAL_COMPLIANCE_REVIEW.md](./CG_1A_CONSTITUTIONAL_COMPLIANCE_REVIEW.md)
- CG-F-001, CG-F-003 closed; CG-F-002 closed for 1A bundle scope

---

## 1. Recommendation summary

| Decision | **APPROVE** |
|----------|-------------|
| **Package** | **CG-1B — P1 Adapter Expansion** |
| **Mode** | Read-only federation adapters |
| **Duration (estimated)** | 3–5 weeks |
| **Parallel track** | CG-1B-prime (projection API + CG-F-007) — **NOT authorized in this motion** |

Council **authorizes CG-1B** to expand the adapter registry with P1 modules. Council **does not authorize** business-domain adapters, AI memory, tag index, graph UI, or write APIs.

---

## 2. Rationale for approval

1. **Foundation proven** — registry, orchestrator, bundle resolver, and permission model support new adapters without schema changes.
2. **User-facing gap** — V_Link attachments include NOTE, CHAT, and notebook-linked entities that currently skip hydration at federation layer.
3. **Constitutional safety** — P1 modules have existing `*VlinkAccessService` patterns (except Notes — see prerequisite).
4. **Scope discipline** — deferring HR/Scheduling/BA prevents business-domain ownership bleed into Tier 0 graph.
5. **Read API adequate** — `POST /bundle/resolve` supports new entity types via registry extension alone.

---

## 3. Scope realignment (roadmap note)

[CONTEXT_GRAPH_POST_RATIFICATION_ROADMAP.md](./CONTEXT_GRAPH_POST_RATIFICATION_ROADMAP.md) §Phase 1B labeled **Graph Projection API**. Council **resequences**:

| Track | Content | Authorization |
|-------|---------|---------------|
| **CG-1B** (this motion) | P1 read adapters: Notes, Notebook, Chat (+ Place conditional) | **APPROVE** |
| **CG-1B-prime** (future) | Projection API, entity neighborhood routes, CG-F-007 matrix, admin diagnostic | **NOT AUTHORIZED** |
| **CG-1C** (future) | AI bundle formalization, pipeline migration | **NOT AUTHORIZED** |

This preserves the user's directive: **1B expands read adapters only**, not business-domain or AI ownership.

---

## 4. Authorized deliverables (CG-1B)

| # | Deliverable | Owner | Finding impact |
|---|-------------|-------|----------------|
| 4.1 | `notesVlinkAccessService` + Notes adapter | Platform + Notes | CG-F-004 (partial → close) |
| 4.2 | Notebook adapter (`NotebookLink` read edges) | Platform + Notebook | CG-F-010 (partial) |
| 4.3 | Chat adapter (`conversation`; thread deferred) | Platform + Chat | CG-F-009 (partial) |
| 4.4 | Place adapter (`listing`, `meeting`) — conditional | Platform + Place | — |
| 4.5 | V_Link entity type map extensions | Platform | — |
| 4.6 | Adapter + cross-module traversal tests | Platform | CG-F-007 (partial) |
| 4.7 | CG-1B implementation report | Platform | — |

**Explicitly out of scope:**

- `GET /api/context-graph/projection`
- Graph visualization UI
- Tag index (Phase 2A)
- AI memory / grounding bundle (Phase 1C)
- HR, Scheduling, Workforce Communications, BA, Admin Portal adapters
- Prisma schema changes for graph
- Write/mutation endpoints
- Ledger updates

---

## 5. Prerequisites and conditions

### 5.1 Notes adapter gate (CG-F-004)

Notes adapter **must not ship** on inline Prisma resolver alone. First 1B deliverable:

- `notesVlinkAccessService` with PE parity
- NOTE lifecycle unlink alignment
- Manifest `vlink` declaration

Council accepts **parallel 1D/1B** execution — 1D NOTE resolver work is absorbed as 1B prerequisite, not a separate authorization.

### 5.2 Chat thread deferral (CG-F-009)

`CHAT_THREAD` / `conversation` thread variant: register **conversation** only. Thread enum cleanup remains advisory — no blocking stub.

### 5.3 Place conditional approval

Place adapter approved **if**:

- Notes adapter lands first (validates partial-readiness pattern), **or**
- Council waives at 1B kickoff with explicit Place-only spike

Otherwise defer Place to CG-1B closeout sprint.

---

## 6. Exit criteria (CG-1B)

| Criterion | Target |
|-----------|--------|
| Operational adapters | ≥3 P1 (Notes, Notebook, Chat); Place optional |
| Registry entity types | ≥8 total (5 P0 + ≥3 P1) |
| V_Link NOTE/CHAT attachments hydrate in bundle | Integration test PASS |
| No new Prisma graph models | Verified |
| CG-F-004 | **Closed** (Notes access service) |
| Tests | ≥8 new adapter/traversal tests; cumulative ≥25 |
| Constitutional compliance | Re-audit PASS |

---

## 7. Required questions — authorization answers

| # | Question | Answer |
|---|----------|--------|
| 8 | Should CG-1B be authorized? | **Yes — APPROVE** |
| 9 | Which adapters include? | Notes, Notebook, Chat; Place conditional |
| 10 | Which remain deferred? | HR, Scheduling, WF Comms, BA, Admin Portal, AI Memory, Tag Index, Graph UI |

---

## 8. Council motion record

| Field | Value |
|-------|-------|
| **Motion** | Authorize CG-1B — P1 Adapter Expansion (read-only) |
| **Vote** | **APPROVE** |
| **Dissent** | None recorded |
| **Conditions** | Notes prerequisite (CG-F-004); no business-domain adapters |
| **Implementation start** | Separate ACT charter — **not started by this document** |
| **Ledger** | **DEFER** (RD-CG-009 unchanged) |

---

## 9. What remains unauthorized

| Package | Status |
|---------|--------|
| CG-1B-prime (projection API) | NOT AUTHORIZED |
| CG-1C (AI bundle) | NOT AUTHORIZED |
| CG-2 (certification evaluation) | NOT AUTHORIZED |
| Phase 2A (tag index) | NOT AUTHORIZED |
| Phase 2B (graph UI) | NOT AUTHORIZED |
| Ledger row insert | NOT AUTHORIZED |

---

**Last updated:** 2026-06-18
