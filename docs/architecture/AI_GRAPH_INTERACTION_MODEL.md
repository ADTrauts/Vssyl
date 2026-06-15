# AI Graph Interaction Model

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-2 — Graph visualization constitutional architecture  
**Status:** Canonical AI + graph rules  
**Date:** 2026-06-14  
**Retrieval:** [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](./AI_RELATIONSHIP_RETRIEVAL_MODEL.md)  
**Automation:** [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md)

> **Scope:** How AI **may and may not** use graph projections. **No** AI pipeline changes in this phase.

---

## Purpose

Graph projections are **explainability and suggestion aids** for AI — not a parallel relationship store or permission bypass. This document aligns graph AI behavior with retrieval precedence and automation boundaries.

---

## Core principle

**AI reads the same visible subgraph a user could build** — then may summarize or suggest. AI **never** treats graph layout, dashed edges, or projection cache as SoR.

---

## AI may

### Inspect graph views

| Action | Rule |
|--------|------|
| Receive visible `GraphNode[]` / `GraphEdge[]` as prompt context | Max 50 nodes, depth 1 — [GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](./GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md) |
| Describe structure in natural language | Only `provenance: sor` edges as facts |
| Reference taxonomy class names | Educational — "this is an Association via V_Link" |
| Compare Place layout vs V_Link hub | Disclose different semantics |

### Summarize graph structures

| Action | Rule |
|--------|------|
| Summarize user's V_Link attachments | Visible labels only |
| Summarize task dependency chain | Visible tasks only |
| Explain why item is restricted | Generic — no title leak |
| Count visible vs restricted | Allowed aggregate |

### Suggest connections

| Action | Rule |
|--------|------|
| Propose V_Link attach | Creates **pending** suggestion — dashed edge |
| Propose NotebookLink | User confirms via notebook API |
| Propose share | User confirms via Drive/Notes |
| Propose tag on entity | User confirms on entity update |

Aligns with [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md) — suggest only.

---

## AI may not

| Forbidden | Reason |
|-----------|--------|
| Create relationships automatically from graph analysis | C4 automation / PE |
| Infer permissions from graph topology | Membership ≠ access |
| Bypass visibility to complete graph | Fail-closed |
| Treat suggestions/inference as real edges in grounding | `provenance` check |
| Persist graph summary as UserMemoryFact without user confirm | Memory SoR |
| Deep traverse (N>1) to "discover" hidden links | Enumeration risk |
| Write to graph layout to store semantic edges | Preference vs association |
| Use graph projection instead of V_Link pipeline for twin | Precedence violation |

---

## Federation ordering (graph in stack)

Graph input sits **below** persisted V_Link and module providers:

```
1. UserMemoryFact
2. Persisted V_Link (vlinkPipelineContextService + resolver)
3. Module AI context providers
4. Visible graph projection (optional explain block)
5. Search hydrate (tool)
6. Domain event → re-fetch signal
7. Inference (dashed edges — disclose)
```

**Graph is layer 4 optional** — never overrides layers 1–3 for cross-module truth.

---

## Graph payload to AI (conceptual)

| Field | Include? |
|-------|----------|
| Node labels (authorized) | ✅ |
| Edge class + provenance | ✅ |
| Restricted placeholders | ✅ as "restricted" — no title |
| Tag overlays | ✅ |
| Deep links | ✅ |
| Raw adapter DTOs | ❌ — use normalized projection |
| Cross-user subgraph | ❌ |
| Full graph DB export | ❌ |

Block header example: `## Visible relationship graph (session projection, not authoritative)`

---

## Suggestions vs solid edges

| provenance | AI may state as fact? | UI |
|------------|----------------------|-----|
| `sor` | ✅ | Solid edge |
| `suggestion` | ❌ — "you might link…" | Dashed |
| `inference` | ❌ — "possibly related" | Dashed |

Accept path: user action → module API → adapter re-fetch → next request shows `sor`.

---

## V_Link on graph

| Rule | Detail |
|------|--------|
| AI uses pipeline for grounding | Primary path |
| Graph is supplemental diagram | Explain membership vs attachment |
| Restricted attachments | AI says "N restricted items" — not filenames |
| Pending suggestions | Excluded from grounding |

---

## Tag on graph

| Rule | Detail |
|------|--------|
| Tags visible on nodes AI already sees | ✅ |
| Tag co-occurrence → link suggestion | Allowed as suggestion — not auto-link |
| Global tag graph | ❌ |

---

## Search interaction

| Scenario | Behavior |
|----------|----------|
| User search then "show graph" | Search seeds anchor — graph uses adapters |
| AI tool search + graph | Both PE-checked — graph does not add access |
| AI skips search and uses stale graph | ❌ — refresh adapters |

---

## Event-driven graph context

Domain events **do not** push graph JSON to AI. Events schedule **re-fetch** of layers 2–3 (and optional graph rebuild at depth 1).

---

## Multi-user / business context

| Context | Graph AI |
|---------|----------|
| Personal twin | User's visible subgraph |
| Business workspace | Business-scoped adapters only |
| Shared V_Link | Intersection of member visibility |
| Admin diagnostic | Admin role — audit logged — not default twin |

---

## Diagnostics

Pipeline explain drawer may show:

- Graph node/edge count supplied  
- Whether projection was truncated  
- Provenance mix (sor vs suggestion)  

Must not imply graph is SoR.

---

## Anti-patterns

| Anti-pattern | Correct |
|--------------|---------|
| "Because graph connects A→B, share A with user" | PE + user share action |
| Graph walk replaces entityLinking persisted VLinks | Pipeline first |
| AI adds solid edge in prompt-only | Forbidden |
| Graph cache in prompt across users | Forbidden |

---

## Alignment checklist

- [ ] [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](./AI_RELATIONSHIP_RETRIEVAL_MODEL.md) precedence  
- [ ] [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md) no silent exec  
- [ ] [GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md](./GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md) fail-closed  
- [ ] [TAG_STRATEGY.md](./TAG_STRATEGY.md) tag overlays  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md](./RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md) | Graph contract |
| [AI_CONTEXT_ASSEMBLY.md](./AI_CONTEXT_ASSEMBLY.md) | Assembler |

**Last updated:** 2026-06-14
