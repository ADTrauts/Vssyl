# Context Graph — Strategic Positioning

**Program:** Context Graph Phase 0A  
**Date:** 2026-06-23  
**Status:** Strategic recommendation

---

## Strategic question

Should V_Graph be:

| Option | Description |
|--------|-------------|
| **A** | Relationship layer above existing entities |
| **B** | Extension of V_Link |
| **C** | Dedicated graph capability |
| **D** | Hybrid |

---

## Option analysis

### A — Relationship layer above existing entities

**Pros:** Matches constitutional "no god object" rule; modules keep SoR; federation already designed this way.  
**Cons:** Without V_Link emphasis, cross-module association story is weak.  
**Fit:** **High** — this is the federation orchestrator role.

### B — Extension of V_Link

**Pros:** User-facing brand; association SoR exists; 23 API endpoints; AI pipeline integration.  
**Cons:** V_Link is association-only — cannot subsume ownership, access grants, containment.  
**Fit:** **Partial** — V_Link is one substrate, not the whole graph.

### C — Dedicated graph capability

**Pros:** Clear product boundary; matches certified Context Graph program.  
**Cons:** Risk of parallel "graph DB" thinking; already shipped as federation not store.  
**Fit:** **High** — as **read federation**, not new persistence.

### D — Hybrid

**Pros:** Accurate to as-built system; preserves investments; clear layering.  
**Cons:** Requires disciplined naming (V_Link vs Context Graph vs V_Graph).  
**Fit:** **Highest**

---

## Recommendation: **D — Hybrid**

### Rationale

1. **Vssyl already implemented the hybrid.** Context Graph (L3 certified) federates module entities with V_Link as association SoR. This is not greenfield.

2. **V_Link cannot absorb the full taxonomy.** Ownership, access grants, containment, and participation remain module-native. V_Link covers **Association** and container **Membership** only.

3. **A dedicated capability is needed for orchestration** — bundle resolution, adapter registry, permission resolver, tag index — but it must remain **derived/read-only** at the graph projection layer.

4. **AI Retrieval adoption proves the gap is consumption, not storage.** Five consumers reconstruct cross-module context via search. The hybrid model adds retrieval evidence as a **fourth input** to federation without new tables.

### Target naming

| Name | Meaning |
|------|---------|
| **V_Link** | User-facing association product + SoR |
| **Context Graph** | Certified platform federation capability (internal) |
| **V_Graph** | Optional product shorthand for "relationship-aware context" — **alias for federated consumption**, not a second store |

Avoid introducing V_Graph as a competing persistence layer. Use it to mean **the composed relationship view** across existing systems.

---

## Layered model (recommended)

```
L5  Consumers     AI Twin · Hub UI · Analytics · Automation
L4  Discovery     Unified Search · AI Retrieval (inference)
L3  Projection    Context Graph bundles · GraphNode/GraphEdge DTOs
L2  Association   V_Link (cross-module)
L1  Module edges  FKs, shares, refs, containment
L0  Entities      Platform entity registry + module SoR
```

---

## What not to build (Phase 0A scope boundary)

| Excluded | Reason |
|----------|--------|
| Graph database tables | Constitutional — no universal relationship store |
| V_Link redesign | Association SoR is stable |
| Traversal APIs (public) | Phase 1B+ after bundle hardening |
| Recommendation auto-persist | AI boundary — suggestions only |
| Search replacement | Discovery layer stays separate |

---

## Competitive positioning

Vssyl's graph is **federated and permission-first**, not a social graph or knowledge graph bolt-on:

| Differentiator | Vssyl approach |
|----------------|----------------|
| Truth | Module SoR + V_Link — not index |
| AI safety | Adapter hydrate + PE every hop |
| User control | Suggestions require accept |
| Multi-tenant | dashboardId / businessId scope |

---

## Success criteria (Phase 1)

| Criterion | Measure | Status |
|-----------|---------|--------|
| Retrieval enriches bundles | Evidence mapped to inference edges | ✅ Phase 1A |
| No duplicate grounding | Reconcile vlink + graph_bundle + retrieval | ✅ Phase 1B (pilot) |
| project_assistant quality | Cross-module bundle without keyword-only search | ✅ Pilot validated (1C) |
| Maturity | Level 3.5 → **4** (Graph Ready) | **L4 CwF certified** (RD-CG-L4-001) |

---

## Phase 1C outcome (2026-06-23)

Project Assistant pilot stack validated under explicit flags; production defaults unchanged. See [CONTEXT_GRAPH_PHASE_1C_CLOSEOUT.md](./CONTEXT_GRAPH_PHASE_1C_CLOSEOUT.md).

---

## Phase 1D / L4 outcome (2026-06-23)

**LEVEL 4 CERTIFIED WITH FINDINGS** (RD-CG-L4-001). Production pilot gated by L4-F01. See [CONTEXT_GRAPH_L4_EXECUTIVE_SUMMARY.md](./CONTEXT_GRAPH_L4_EXECUTIVE_SUMMARY.md).

---

## Phase 1B outcome (2026-06-23)

Grounding reconcile dedup ships for `project_assistant` — authoritative V_Link and federation SoR outrank inference and retrieval evidence. See [CONTEXT_GRAPH_PHASE_1B_CLOSEOUT.md](./CONTEXT_GRAPH_PHASE_1B_CLOSEOUT.md).

---

## Phase 1A outcome (2026-06-23)

Hybrid model validated: **Retrieval → Bundle inference bridge** ships as additive consumption layer. Federation SoR unchanged. See [CONTEXT_GRAPH_PHASE_1A_CLOSEOUT.md](./CONTEXT_GRAPH_PHASE_1A_CLOSEOUT.md).

---

## References

- [CONTEXT_GRAPH_REALITY_ASSESSMENT.md](./CONTEXT_GRAPH_REALITY_ASSESSMENT.md)
- [CONTEXT_GRAPH_ARCHITECTURE_AUDIT.md](./CONTEXT_GRAPH_ARCHITECTURE_AUDIT.md)
- [CONTEXT_GRAPH_CERTIFICATION_PROMOTION_RECORD.md](./CONTEXT_GRAPH_CERTIFICATION_PROMOTION_RECORD.md)

- [CONTEXT_GRAPH_RETRIEVAL_BRIDGE.md](./CONTEXT_GRAPH_RETRIEVAL_BRIDGE.md)
- [CONTEXT_GRAPH_PHASE_1A_CLOSEOUT.md](./CONTEXT_GRAPH_PHASE_1A_CLOSEOUT.md)

- [CONTEXT_GRAPH_GROUNDING_RECONCILE.md](./CONTEXT_GRAPH_GROUNDING_RECONCILE.md)
- [CONTEXT_GRAPH_PHASE_1B_CLOSEOUT.md](./CONTEXT_GRAPH_PHASE_1B_CLOSEOUT.md)

- [CONTEXT_GRAPH_PROJECT_ASSISTANT_PILOT_VALIDATION.md](./CONTEXT_GRAPH_PROJECT_ASSISTANT_PILOT_VALIDATION.md)
- [CONTEXT_GRAPH_PHASE_1C_CLOSEOUT.md](./CONTEXT_GRAPH_PHASE_1C_CLOSEOUT.md)
- [CONTEXT_GRAPH_CERTIFICATION_READINESS_REVIEW.md](./CONTEXT_GRAPH_CERTIFICATION_READINESS_REVIEW.md)
- [CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md](./CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md)
- [CONTEXT_GRAPH_L4_EXECUTIVE_SUMMARY.md](./CONTEXT_GRAPH_L4_EXECUTIVE_SUMMARY.md)

**Last updated:** 2026-06-23 (L4 certification)
