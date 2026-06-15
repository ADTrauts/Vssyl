# Graph Traversal and Hydration Model

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-2 — Graph visualization constitutional architecture  
**Status:** Canonical traversal rules  
**Date:** 2026-06-14  
**Patterns:** [RELATIONSHIP_HYDRATION_PATTERNS.md](./RELATIONSHIP_HYDRATION_PATTERNS.md)  
**Adapters:** [RELATIONSHIP_READ_ADAPTER_CATALOG.md](./RELATIONSHIP_READ_ADAPTER_CATALOG.md)

> **Scope:** Traversal depth, hydration boundaries, performance limits, and retrieval flow for graph projections. **No** graph query engine implementation.

---

## Purpose

Unbounded graph traversal causes **permission leaks**, **performance collapse**, and **semantic collapse** (everything looks related). This document caps expansion and mandates **adapter-first** retrieval.

**Traversal = controlled adapter fan-out** — not recursive SQL or graph DB walk.

---

## Retrieval flow (canonical)

```
User opens graph surface with anchor (entity, container, or module slice)
  → Graph builder loads tenant context
  → Select graph provider (K7) + adapter set for surface
  → STEP 1: Fetch anchor node (Pattern A)
  → STEP 2: List edges from anchor (adapter.read.edges.*)
  → STEP 3: For each edge target ref (Pattern C hydrate)
         → target visibility service / vlink.resolver
         → GraphNode full | restricted | omit
  → STEP 4: If depth > 0 and budget remains, repeat from new nodes
  → STEP 5: Merge DTOs → GraphNode[] + GraphEdge[]
  → STEP 6: Apply caps — truncate with "show more" token (future UX)
```

**Authority at every step:** read adapter + visibility gate — never projection cache as SoR.

---

## Traversal depth

| Depth | Name | Typical use |
|-------|------|-------------|
| **0-hop** | Anchor only | Entity detail card |
| **1-hop** | Direct neighbors | V_Link attachments, notebook links, task deps |
| **2-hop** | Neighbor of neighbor | Federated explorer (controlled) |
| **N-hop** | **Forbidden by default** | Requires certified graph provider + hard caps |

### Default depth by surface

| Surface | Max depth | Max nodes |
|---------|-----------|-----------|
| V_Link hub attachments | 1 | 100 attachments |
| Notebook link rail | 1 | 50 links |
| Place Main Street | 1 (layout) | User's graph size cap |
| Task dependency mini-graph | 2 | 30 tasks |
| Federated explorer (future) | 2 | 200 nodes |
| AI graph summary input | 1 | 50 nodes |

---

## 1-hop traversal

**Definition:** Edges where **anchor is endpoint** and target hydrate runs once.

### Flow

```
anchorId
  → adapter.listEdgesFrom(anchor) OR listEdgesTo(anchor)
  → RelationshipReadDTO[]
  → hydrate each target (batch preferred)
  → append nodes + edges
```

### Allowed adapters

- `vlink.resolver` — attachments from container  
- `notebook.links` — page operational links  
- `todo.visibility` — dependencies, file links  
- `drive.visibility` — folder children (containment as nodes)  
- `chat.visibility` — participants (membership)  

### Rules

- Each target independent PE check  
- Denied targets: omit or redact per [GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md](./GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md)  
- No automatic reverse expansion from denied node  

---

## 2-hop traversal

**Definition:** Expand one level from **1-hop nodes** that pass visibility and **expansion policy**.

### Expansion policy

| Node type | Expand 2-hop? |
|-----------|---------------|
| V_Link container | ❌ Attachments only — no attach-of-attach |
| Task | ⚠️ Dependencies only — not all V_Links on deps |
| File | ❌ No share graph |
| User | ❌ No social graph crawl |
| Place listing | ⚠️ Follow edges only in Place surface |
| Notebook page | ✅ One more NotebookLink hop max |

### Budget

- **Remaining node budget** decrements per hydrated node  
- Stop when budget = 0 — return `truncated: true` metadata  

---

## N-hop restrictions

| Rule | Statement |
|------|-----------|
| N1 | **N > 2 prohibited** for user-facing graphs unless ADMIN diagnostic tool |
| N2 | No BFS across entire business tenant |
| N3 | No "degrees of separation" product feature without explicit Phase + privacy review |
| N4 | AI graph summary **max depth 1** unless user pins anchor expansion |

**Rationale:** Federation ADR rejected graph-first SoR — deep traversal mimics graph DB abuse.

---

## Hydration boundaries

| Boundary | Rule |
|----------|------|
| **Module boundary** | Target hydrate calls **target module** adapter only |
| **V_Link boundary** | Resolver batch — no title without `*VlinkAccessService` |
| **Tag boundary** | Tags come with entity hydrate — no tag-only expansion |
| **Search boundary** | Search hits may **seed anchor** — expansion still adapter-only |
| **Event boundary** | Events trigger refresh — not traversal input |
| **Inference boundary** | `entityLinking` may add dashed edges — **no hydrate skip** if user accepts |

### Hydrate batching (implementation guideline)

- Prefer `resolveEntitiesBatch(userId, refs[])` per module where available  
- Max batch 25 refs per request  
- Sequential fallback max 10 — then truncate  

---

## Performance limits

| Limit | Default | Owner |
|-------|---------|-------|
| `maxNodes` | 200 | Graph provider |
| `maxEdges` | 500 | Graph provider |
| `maxDepth` | 2 | Graph provider |
| `adapterTimeoutMs` | 3000 per adapter | Orchestrator |
| `totalRequestMs` | 8000 p95 target | Orchestrator |
| `parallelAdapters` | 6 max | Orchestrator |

### Graph explosion prevention

| Technique | Detail |
|-----------|--------|
| **Degree cap** | Max edges per node (e.g. 50) — sort by recency |
| **Class filter** | User selects edge types in legend |
| **Anchor required** | No whole-tenant graph |
| **Pagination** | "Load more attachments" — next adapter page |
| **Dedupe** | Collapse duplicate `(class, source, target)` |

---

## Parallel fan-out (federated explorer)

Pattern E composition for anchor entity "what connects here?":

```
Promise.allSettled([
  vlink.resolver.reverseLookup(anchor),
  notebook.links.byTarget(anchor),
  todo.visibility.links(anchor),
  // module-specific reverse adapters
])
→ merge edges
→ hydrate targets (batched)
→ apply global maxNodes
```

**Forbidden:** Single SQL joining all link tables.

---

## Stale projection handling

| Trigger | Action |
|---------|--------|
| User refresh | Full re-fetch |
| Domain event (client subscribed) | Invalidate session cache |
| Navigate away | Drop projection |
| Entity open from graph | Live module UI — not graph SoR |

Pattern E: events **invalidate** — traversal always re-reads adapters on rebuild.

---

## Traversal vs search vs AI

| Consumer | Depth | Pattern |
|----------|-------|---------|
| Graph UI | 1–2 | A + C |
| Global search | 0 (entity hit) | B |
| AI summary of graph | 1 | A + C → text |
| AI twin grounding | N/A | Providers + V_Link pipeline — not full graph walk |

---

## Anti-patterns

| Anti-pattern | Prevention |
|--------------|------------|
| Load entire V_Link transitive closure | Depth 1 on attachments |
| Follow all shares from file | Not in default graph |
| Graph DB shortest path | Adapter depth cap |
| Cache graph as SoR | Session TTL only |
| Skip hydrate on cached graph node | Re-verify on expand |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md](./RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md) | Graph purpose |
| [AI_GRAPH_INTERACTION_MODEL.md](./AI_GRAPH_INTERACTION_MODEL.md) | AI depth limits |

**Last updated:** 2026-06-14
