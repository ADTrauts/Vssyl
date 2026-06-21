# Context Graph — Platform Architecture

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0A — Discovery  
**Date:** 2026-06-18  
**Status:** Target architecture — no implementation

---

## Vision

The **Vssyl Context Graph** is a **logical federation layer** that composes relationship-aware context from decentralized module systems of record — with **V_Link** as the primary cross-module association substrate and **AI Pipeline** as the flagship consumer.

It is **not** a graph database, **not** a marketplace module, and **not** a replacement for module schemas.

---

## Architectural position

```
┌──────────────────────────────────────────────────────────────┐
│                     TIER 0 — RUNTIME KERNEL                   │
│  Workspace · Policy Engine · Domain Events · Global Trash       │
├──────────────────────────────────────────────────────────────┤
│              CONTEXT GRAPH (Tier 0 capability)                │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ V_Link SoR │  │ Federation   │  │ Graph projection    │   │
│  │ (assoc.)   │  │ orchestrator │  │ (read adapters)     │   │
│  └────────────┘  └──────────────┘  └─────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│                    MODULE SoRs (Tier 1+)                      │
│  Drive · Chat · Calendar · Todo · Notes · Place · HR · …     │
├──────────────────────────────────────────────────────────────┤
│                      CONSUMERS                                │
│  AI Twin · Search · Analytics · Automation · Hub UI · Admin   │
└──────────────────────────────────────────────────────────────┘
```

**Classification:** **Platform capability (B) + Core platform layer (D)**

---

## Layer model

| Layer | Name | Responsibility | Mutable? |
|-------|------|----------------|----------|
| **L0** | Entity SoR | Module Prisma models | Module writes |
| **L1** | Platform association | V_Link, domain events | Platform writes |
| **L2** | Federation orchestrator | Compose reads across SoRs | Read-only |
| **L3** | Projection / adapters | GraphNode, GraphEdge DTOs | Derived |
| **L4** | Consumer views | AI bundles, search facets, viz | Derived |
| **L5** | Cache / index (future) | Event-invalidated mirrors | Derived |

Aligns with [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](../architecture/RELATIONSHIP_READ_FEDERATION_CONTRACT.md) principles F1–F7.

---

## V_Link evolution path

| Today | Target |
|-------|--------|
| User-facing "linking feature" | **Association registry** for cross-module context |
| Hub UI at `/vlink` | Context Graph explorer anchor surface |
| AI pipeline source `vlink` | Primary relationship grounding channel |
| 18 entity resolvers | Complete resolver coverage + NOTE service |
| Container-local activity | Optional federation into activity envelope |
| No graph API | Bounded graph read API (adapter-backed) |

**Brand:** Keep **V_Link** as user-facing name. Internal architecture may reference **Context Graph** for federation and AI.

---

## Federation orchestrator (logical — Phase 0B+)

Not a deployed service in 0A. Proposed responsibilities:

1. Accept anchor `(moduleId, entityType, entityId)` or `vlink:{id}`
2. Select adapter set per consumer (AI, search, graph UI)
3. Enforce Policy Engine at each hydrate hop
4. Apply traversal caps from [GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](../architecture/GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md)
5. Return composed `GraphProjection` DTO

**Existing building blocks:**

- `vlinkEntityResolverService` — attachment hydrate
- `vlinkPipelineContextService` — AI relationship slice
- `RELATIONSHIP_READ_ADAPTER_CATALOG.md` — adapter inventory
- Module `*VlinkAccessService` — visibility gates

---

## Context bundle architecture

| Bundle type | Anchor | Contents |
|-------------|--------|----------|
| **V_Link bundle** | `vlink:{id}` | Container metadata + resolved attachments |
| **Entity neighborhood** | Entity node | 1-hop edges via adapters |
| **AI session bundle** | User query + scope | Memory + vlinks + module providers |
| **Notebook context** | `notebook:page:{id}` | Operational links + hydrate |

Bundles are **views** — authoritative state remains in SoRs.

---

## Relationship to completed platform work

| Capability | Graph role |
|------------|------------|
| **Admin Portal L3** | Graph admin diagnostics, pipeline source config |
| **Business Administration L3** | Org chart hierarchy nodes; approval hierarchy edges |
| **Approval Hierarchy (#OC-3)** | Workflow routing edges — not V_Link replacement |
| **Org Chart (#OC-1)** | Business identity nodes |
| **Permission Sets (#OC-2)** | Access policy on nodes — not graph edges |
| **File Hub reference** | Entity node + access grant pattern |

---

## Non-goals (constitutional)

| Non-goal | Rationale |
|----------|-----------|
| Universal `relationships` table | Forbidden by Relationship Framework |
| Graph DB (Neo4j, etc.) | Federation over existing Postgres SoRs |
| Tag-as-node | Semantic collapse |
| V_Link grants entity access | Constitutional violation |
| N-hop social graph | Privacy + performance |

---

## Consumer contracts

| Consumer | Read path | Write path |
|----------|-----------|------------|
| **AI Twin** | Pipeline + orchestrator | None (reads only) |
| **V_Link Hub** | V_Link API + resolver | V_Link API |
| **Search** | Index + hydrate re-check | Module SoR |
| **Analytics** | Derived correlation views | None |
| **Automation** | Domain event triggers | Module actions |
| **Graph visualization** | Orchestrator projection | None |

---

## Phase 0A conclusion

| Decision | Value |
|----------|-------|
| Proceed with Context Graph program? | **Yes** |
| V_Link foundation adequate? | **Yes — with federation extension** |
| New core table required? | **No** |
| Next phase | **0B — Constitutional architecture package** |

See [CONTEXT_GRAPH_MODERNIZATION_ROADMAP.md](./CONTEXT_GRAPH_MODERNIZATION_ROADMAP.md).

**Last updated:** 2026-06-18
