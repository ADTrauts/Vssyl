# CG-1A — Bundle Resolution Report

**Program:** Vssyl Context Graph  
**Phase:** 1A  
**Date:** 2026-06-18

---

## Overview

`resolveBundle()` in `server/src/context-graph/bundleResolver.ts` is the federation composition engine. The orchestrator (`contextGraphOrchestrator.ts`) wraps it for:

- `resolveVLinkBundle` — V_Link container root via `GET /vlinks/:id/bundle`
- `resolveContextBundle` — arbitrary entity/container root via `POST /bundle/resolve`

---

## Inputs

| Field | Type | Notes |
|-------|------|-------|
| `root` | `RootRef` | `EntityRef` or `VLinkContainerRef` |
| `ctx` | `AdapterContext` | `userId` + optional tenant ids |
| `tenantScope` | `TenantScope` | `dashboardId`, `scope`, optional `businessId` / `householdId` |
| `options` | `BundleResolveOptions` | `depth`, `nodeBudget`, `edgeBudget`, `kind`, `consumer` |

**Defaults:** depth `1`, node/edge budget `50`, max depth `2`.

---

## Outputs

Ratified `ContextBundleDescriptor` (`contextGraphTypes.ts`):

- `bundleId`, `kind`, `version` (`1.0`), `createdAt`
- `root`, `tenantScope`
- `composition` — depth/budget usage, truncation, `nodesOmitted`
- `nodes[]` — trimmed descriptors with `role` (`root` | `attachment` | `neighbor`)
- `edges[]` — `NeighborEdge` with optional display label
- `summaries` — human/ai text + stats
- `provenance` — per-adapter read/used counts
- `permissionOutcome` — `overall`, `gatesApplied`, `restrictedNodes`, `omittedNodes`

---

## Traversal algorithm

### V_Link container root

1. `resolveVLinkContainer` — PE gate + container node
2. If `depth >= 1`: `listVLinkAttachmentEdges`
3. For each attachment edge with mappable `EntityRef`:
   - Resolve target adapter
   - `adapter.getNode` — permission evaluated at hop
   - `addGraphNode` — dedupe + omit denied

### Entity root

1. `getAdapterForEntity` + `adapter.getNode`
2. If `depth >= 1`: `adapter.getNeighbors`
3. For each neighbor `EntityRef`: hydrate via target adapter

### Depth limits

- `depthRequested` capped at `MAX_DEPTH` (2)
- CG-1A traversal uses depth 0–1 in practice (root only or root + 1 hop)
- No N-hop social traversal

---

## Deduplication

Nodes keyed by `entityRefKey` → `moduleId:entityType:entityId`. Duplicate encounters are skipped silently.

---

## Budget truncation

| Limit | Behavior |
|-------|----------|
| `nodeBudget` | Stop adding nodes; set `truncated: true`, `truncationReason: 'node_budget'` |
| `edgeBudget` | Stop adding edges; same truncation flag |

---

## Cross-adapter traversal

Supported paths in 1A:

```
vlink:container → drive:file|folder
vlink:container → calendar:event
vlink:container → todo:task
entity root → vlink attachment edges (via getNeighbors)
```

Bundle resolver tests verify V_Link → Drive attachment hydration and entity-root neighbor edges.

---

## API integration

| Endpoint | Orchestrator entry |
|----------|-------------------|
| `GET /api/context-graph/vlinks/:id/bundle` | `resolveVLinkBundle` |
| `POST /api/context-graph/bundle/resolve` | `resolveContextBundle` |

POST body parsing (`parseTenantScope`, `parseEntityRoot`, `parseContainerRoot`) validates descriptor shape; missing tenant scope returns `400 CG_INVALID_DESCRIPTOR`.

---

## Tests

`bundleResolver.test.ts` (3 tests):

1. V_Link bundle with attachments — 2 nodes, 1 edge, deduped
2. Denied attachment omitted — `nodesOmitted: 1`
3. Entity root with neighbors — root role + edge count

**Last updated:** 2026-06-18
