# Context Graph — Architecture Audit

**Program:** Context Graph Phase 0A  
**Date:** 2026-06-23  
**Status:** Federation alignment audit — no implementation

---

## Audit question

How would a future Context Graph (V_Graph) integrate with Unified Search, AI Retrieval, Platform Entities, Activity, and Domain Events **without replacing them**?

---

## Current architecture (as-built)

```
┌─────────────────────────────────────────────────────────────────┐
│ TIER 0 — Runtime Kernel (certified)                              │
│ Workspace · Policy Engine · Domain Events · Global Trash         │
├─────────────────────────────────────────────────────────────────┤
│ RELATIONSHIP LAYER                                               │
│  V_Link SoR          Context Graph (L3)         Tag Index (2A)   │
│  vlink.* prisma      context-graph/*            tagIndexService  │
├─────────────────────────────────────────────────────────────────┤
│ DISCOVERY LAYER                                                  │
│  Unified Search      AI Retrieval Adapter       Module providers │
│  searchCapability    aiRetrievalCapability      ContextProvider  │
├─────────────────────────────────────────────────────────────────┤
│ MODULE SoRs                                                      │
│  Drive · Chat · Calendar · Todo · Notes · Place · …              │
└─────────────────────────────────────────────────────────────────┘
```

**Certification:** Context Graph promoted to **LEVEL 3 CERTIFIED** (RD-CG-010, 2026-06-19).

---

## Integration matrix

| System | What it owns | What V_Graph must NOT do | Integration pattern |
|--------|--------------|--------------------------|-------------------|
| **Platform Entities** | Identity registry | Duplicate entity storage | Node keys from registry |
| **V_Link** | Association SoR | Replace attachments | Primary edge source |
| **Context Graph** | Bundle orchestration | Re-implement adapters | Extend composition inputs |
| **Unified Search** | Federated find | Become edge SoR | Discovery input layer |
| **AI Retrieval** | Pipeline evidence | Persist edges silently | Evidence → projection |
| **Activity** | Immutable audit | Derive authoritative edges | Temporal signals only |
| **Domain Events** | Fan-out signals | Store relationships | Invalidate projections |

---

## Search alignment

| Aspect | Current state | Target (Phase 1) |
|--------|---------------|------------------|
| Provider registry | Shipped | Unchanged |
| `search:read` gate | Shipped | Extend to all AI paths |
| Place triple path | Open (tool + provider + search) | Council review — not graph scope |
| Search → graph | **None** | Optional: search hits as inference nodes in bundle |
| Graph → search | Tag index by entity | Bidirectional discovery hints (advisory) |

**SC-M4 (Search convergence):** Not closed — retrieval adds fifth consumer but majority of AI paths remain parallel. Documented in retrieval closeouts.

---

## Retrieval alignment

| Aspect | Current state | Gap |
|--------|---------------|-----|
| Consumers wired | 5 intents | Bridge pilot: project_assistant only |
| Evidence shape | `AIRetrievalEvidence` | Mapped to inference edges (Phase 1A) |
| Diagnostics | consumer profiles | No `federationDepth` metric yet |
| V_Link coexistence | Separate pipeline sources | Dedup needed in grounding reconcile |

**Phase 1A bridge (shipped):**

```
Retrieval evidence (inference) ──┐
V_Link pipeline (sor) ──────────┼──► grounding reconcile ──► twin prompt
Graph bundle (sor + federation + inference) ─┘
```

See [CONTEXT_GRAPH_RETRIEVAL_BRIDGE.md](./CONTEXT_GRAPH_RETRIEVAL_BRIDGE.md).

---

## Activity alignment

| Use | Allowed | Forbidden |
|-----|---------|-----------|
| "User linked file to V_Link" audit | ✅ | — |
| Rebuild graph from activity alone | — | ❌ Activity ≠ SoR |
| Analytics on link patterns | ✅ (analytics module) | Conflate with graph SoR |

---

## Domain events alignment

| Event class | Graph role |
|-------------|------------|
| `file.deleted` | Invalidate file nodes; trigger V_Link unlink |
| `business.member.added` | Membership refresh — **not** auto V_Link |
| Module activity emitted | Optional subscriber refresh of tag index |

Per [AUTOMATION_CONSUMER_BOUNDARY.md](../architecture/AUTOMATION_CONSUMER_BOUNDARY.md): subscribers must not auto-create V_Link edges.

---

## Permission model audit

| Hop | Enforcer | Status |
|-----|----------|--------|
| V_Link container | `vlinkPermissionService` | ✅ |
| Attachment hydrate | Module `*VlinkAccessService` | ✅ |
| Graph bundle | `permissionResolver` | ✅ (CG-1C) |
| Retrieval search | `search:read` + provider PE | ✅ |
| Tag index | Read-only federated | ✅ (CG-2A) |

**Finding:** Permission model is mature. Phase 1 risk is **composition duplication**, not authZ holes.

---

## Code inventory (federation)

| Component | Path | Role |
|-----------|------|------|
| Orchestrator | `contextGraphOrchestrator.ts` | Bundle resolution |
| Adapters | `adapters/*.ts` | 8 module adapters |
| Bundle provider | `contextGraphBundleProvider.ts` | AI pipeline hook |
| Permission | `permissionResolver.ts` | Per-hop PE |
| Tag index | `tagIndexService.ts` | Federated tag overlay |
| V_Link adapter | `adapters/vlinkAdapter.ts` | Hub traversal |

---

## Duplication analysis

| Parallel path | Overlap | Resolution |
|---------------|---------|------------|
| `vlink` vs `graph_bundle` | Both ground on V_Link | Reconcile in `pipelineGroundingRuleReconcile` |
| Retrieval vs search tool | Same providers underneath | Retrieval is gated adapter |
| entityLinking vs retrieval | Both infer relatedness | Precedence: V_Link > retrieval > entityLinking |
| Tag index vs search tags | Discovery | Tag index is overlay; search is find |

---

## Blockers to Level 4 (Graph Ready)

| ID | Blocker | Owner | Status |
|----|---------|-------|--------|
| B-01 | Retrieval evidence not in bundle composer | AI + Context Graph | **Closed (1A)** |
| B-02 | project_assistant needs opt-in for validation | Ops | **Closed (1C)** |
| B-03 | NOTE entity V_Link gap | Notes module | Open |
| B-04 | No public graph read API for hub UI | Context Graph | Open |
| B-05 | HR/scheduling adapters missing | Module teams | Open |
| B-06 | Grounding reconcile dedup | AI pipeline | **Closed (1B)** |
| L4-B01 | Consumption stack council ratification | Council | Open (1D) |
| L4-B02 | Production staging soak | Ops | Open (1D) |
| L4-B03 | Single consumer pilot scope | AI platform | Open (1D) |

**Full register:** [CONTEXT_GRAPH_LEVEL_4_BLOCKER_REGISTER.md](./CONTEXT_GRAPH_LEVEL_4_BLOCKER_REGISTER.md)

**1D determination:** Superseded by **L4 CERTIFIED WITH FINDINGS** (RD-CG-L4-001). See [CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md](./CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md).

---

## References

- [CONTEXT_GRAPH_PLATFORM_ARCHITECTURE.md](./CONTEXT_GRAPH_PLATFORM_ARCHITECTURE.md)
- [CONTEXT_GRAPH_SECURITY_AND_PERMISSION_MODEL.md](./CONTEXT_GRAPH_SECURITY_AND_PERMISSION_MODEL.md)
- [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](../architecture/RELATIONSHIP_READ_FEDERATION_CONTRACT.md)
- [AI_RETRIEVAL_SEARCH_ALIGNMENT.md](../ai/retrieval/AI_RETRIEVAL_SEARCH_ALIGNMENT.md)

- [CONTEXT_GRAPH_RETRIEVAL_BRIDGE.md](./CONTEXT_GRAPH_RETRIEVAL_BRIDGE.md)
- [CONTEXT_GRAPH_PHASE_1A_CLOSEOUT.md](./CONTEXT_GRAPH_PHASE_1A_CLOSEOUT.md)

- [CONTEXT_GRAPH_GROUNDING_RECONCILE.md](./CONTEXT_GRAPH_GROUNDING_RECONCILE.md)
- [CONTEXT_GRAPH_PHASE_1B_CLOSEOUT.md](./CONTEXT_GRAPH_PHASE_1B_CLOSEOUT.md)

- [CONTEXT_GRAPH_PROJECT_ASSISTANT_PILOT_VALIDATION.md](./CONTEXT_GRAPH_PROJECT_ASSISTANT_PILOT_VALIDATION.md)
- [CONTEXT_GRAPH_PHASE_1C_CLOSEOUT.md](./CONTEXT_GRAPH_PHASE_1C_CLOSEOUT.md)
- [CONTEXT_GRAPH_CERTIFICATION_READINESS_REVIEW.md](./CONTEXT_GRAPH_CERTIFICATION_READINESS_REVIEW.md)
- [CONTEXT_GRAPH_PHASE_1D_EXECUTIVE_SUMMARY.md](./CONTEXT_GRAPH_PHASE_1D_EXECUTIVE_SUMMARY.md)

**Last updated:** 2026-06-23 (Phase 1D)
