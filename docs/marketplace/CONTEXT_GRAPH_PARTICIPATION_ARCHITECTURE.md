# Context Graph Participation — Architecture

**Program:** Marketplace & Module Ecosystem — Phase 1A  
**Date:** 2026-06-23  
**Status:** Architecture recommendation — **no implementation**  
**Authority:** [CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md](../context-graph/CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md), [CONTEXT_GRAPH_RETRIEVAL_BRIDGE.md](../context-graph/CONTEXT_GRAPH_RETRIEVAL_BRIDGE.md)

---

## 1. Participation readiness

| Mode | Level | Partner today? |
|------|-------|----------------|
| **Graph federation (SoR adapters)** | **1 — First Party Only** | ❌ |
| **Graph bundles (read consumption)** | **1 — First Party Only** | ❌ Indirect via first-party only |
| **Relationship inference (retrieval bridge)** | **2 — Architecturally Ready** | ❌ Blocked by Search M-02 |
| **Bundle enrichment from partner evidence** | **2 — Architecturally Ready** | ❌ Same blocker |

**Blocker register:** L5-B03 — Marketplace partner graph conformance untested.

---

## 2. Current state

### Adapter registry (compile-time)

`server/src/context-graph/adapterRegistry.ts` — 8 adapters:

| moduleId | Entity types |
|----------|--------------|
| vlink | V_Link containers |
| drive | files, folders |
| calendar | events |
| todo | tasks |
| notes | pages |
| notebook | notebooks |
| chat | conversations |
| place | listings |

Each adapter implements `ContextGraphAdapter`:

```typescript
interface ContextGraphAdapter {
  readonly moduleId: string;
  readonly supportedEntityTypes: readonly string[];
  hydrateNode(ref, context): Promise<ContextGraphNode | null>;
  listNeighbors(ref, context, options): Promise<NeighborEdge[]>;
}
```

**No dynamic registration at runtime** despite `registerContextGraphAdapter()` helper — only used at init for static list.

### Orchestrator

`contextGraphOrchestrator.ts` — federated read, budget limits (50 nodes/edges), PE on reads.

### Retrieval inference bridge

When enabled, search/retrieval evidence adds **inference-only** nodes/edges:

- Provenance: `inference`, source: `ai_retrieval`
- Never overrides SoR federation edges
- Min confidence 0.2; dedup by entity key

Partners participate **indirectly** only if search delegate returns evidence that maps to graph inference.

---

## 3. Participation modes (recommended)

### Mode A — Inference-only (Phase 1C — low effort)

**No partner adapter required.**

Partner search hits → retrieval evidence → `enrichGraphBundlesFromRetrieval` → inference nodes.

| Requirement | Notes |
|-------------|-------|
| Search delegate (M-02) | Prerequisite |
| Entity keys in SearchResult metadata | `entityType`, `entityId` for dedup |
| Provenance tagging | Automatic via bridge |

**Limitation:** No authoritative neighbor edges from partner SoR. Relationship inference only.

**Readiness after M-02:** Level 2 → partial Level 3 for inference path.

---

### Mode B — HTTP Graph Delegate (Phase 2 — recommended target)

Partner exposes read-only graph API; platform wraps as dynamic adapter.

#### Manifest extension (proposed)

```json
{
  "capabilities": { "contextGraph": true },
  "contextGraphDelegate": {
    "url": "https://partner.example.com/vssyl/graph",
    "version": "1",
    "entityTypes": ["crm_contact", "crm_deal"],
    "maxDepth": 1,
    "timeoutMs": 5000
  }
}
```

#### Operations

| Operation | Request | Response |
|-----------|---------|----------|
| `hydrateNode` | `{ entityRef, context }` | `ContextGraphNode` |
| `listNeighbors` | `{ entityRef, context, budget }` | `NeighborEdge[]` |

**Auth:** Platform JWT (same family as search/context providers).

#### Platform wrapper

```typescript
class PartnerGraphAdapter implements ContextGraphAdapter {
  moduleId = manifest.id;
  supportedEntityTypes = manifest.contextGraphDelegate.entityTypes;
  // hydrateNode / listNeighbors → HTTP POST to delegate
}
```

Registered in dynamic registry at `ModuleRegistrySyncService.syncModule`.

---

### Mode C — Integrated Partner shim (strategic verticals)

Platform co-builds thin in-process adapter for approved partners only — **exception tier**, not default.

Use when latency/compliance requires it (e.g., healthcare). Requires council approval per module.

**Contradicts default no-in-process rule** — Integrated Partner tier only.

---

## 4. What partners cannot do today

| Capability | Status |
|------------|--------|
| Register graph adapter | ❌ |
| Contribute SoR nodes/edges | ❌ |
| Enrich bundles via own relationships | ❌ (except inference after M-02) |
| Write to graph | ❌ By design — read-only federation |
| Override V_Link edges | ❌ Governance rule |

---

## 5. Entity requirements

Partner entities in graph participation must declare in manifest:

```json
{
  "entities": [{
    "type": "inventory_item",
    "displayName": "Inventory Item",
    "supportsSearch": true,
    "supportsContextGraph": true,
    "primaryKeyField": "id"
  }]
}
```

| Field | Purpose |
|-------|---------|
| `type` | Stable entity type string (namespaced: `partnerId_entity`) |
| `supportsContextGraph` | Certification parity |
| `supportsSearch` | Search delegate parity |
| `primaryKeyField` | Dedup in inference bridge |

**Naming convention:** `{moduleId}_{entity}` e.g. `acme_crm_contact` — prevents cross-module collisions.

---

## 6. Provenance requirements

| Edge class | Provenance | Partner allowed? |
|------------|------------|------------------|
| **Federation (SoR)** | `moduleId` adapter | Mode B delegate |
| **Inference** | `inference` / `ai_retrieval` | Mode A via search |
| **V_Link** | `vlink` platform | Separate track — see V_Link doc |

All partner-contributed nodes must include:

```typescript
metadata: {
  sourceModuleId: string;
  delegateVersion: string;
  hydratedAt: ISO8601;
}
```

Inference nodes **must not** claim `permissions.access: 'full'` unless delegate verified read.

---

## 7. Certification requirements

| # | Requirement |
|---|-------------|
| **CG-P01** | Declare `capabilities.contextGraph` only with delegate OR inference-only via search |
| **CG-P02** | Entity types in manifest match delegate |
| **CG-P03** | Read-only responses — no mutation endpoints |
| **CG-P04** | Tenant scoping on every hydrate/neighbor call |
| **CG-P05** | Budget honored (`maxDepth`, node/edge caps) |
| **CG-P06** | No fabricated neighbor edges to platform entities without resolver |
| **CG-P07** | Pass graph conformance test suite (Phase 2) |
| **CG-P08** | L5-B03 closed in blocker register before Level 4 claim |

---

## 8. Security boundaries

| Threat | Control |
|--------|---------|
| Graph pollution (fake nodes) | APPROVED module only; adapter whitelist |
| Cross-tenant neighbor leakage | JWT context + partner enforcement |
| Edge injection to platform entities | Validate target refs; deny unknown platform entity types |
| DoS via deep neighbor expansion | Budget caps; timeout |
| Inference overfitting | Min confidence; inference-only label in UI/AI |

---

## 9. Dependency order

```
Phase 1B: Search delegate (M-02)
    ↓
Phase 1C: Inference-only partner participation (Mode A)
    ↓
Phase 2:  HTTP Graph Delegate (Mode B)
    ↓
Phase 3:  Integrated Partner shims (Mode C — selective)
```

**Do not implement Mode B before Search M-02** — inference path validates pipeline with lower risk.

---

## 10. Recommendation

| Question | Answer |
|----------|--------|
| Can partners federate graph today? | **No** |
| Shortest path to participation? | Search → retrieval bridge → inference nodes |
| Full federation? | HTTP Graph Delegate in Phase 2 |
| Rebuild Context Graph? | **No** — extend adapter registry pattern |
| Target readiness | **Level 3** inference (1C); **Level 3** federation (Phase 2) |

---

**Last updated:** 2026-06-23
