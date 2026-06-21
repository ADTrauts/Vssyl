# Context Graph — Read API Contract

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0B — Constitutional architecture  
**Date:** 2026-06-18  
**Status:** **SPECIFICATION ONLY** — no routes, controllers, or services implemented

---

## 1. Purpose

Define future HTTP APIs for Context Graph read operations. All endpoints are **read-only** — no mutation of module or V_Link SoR through these routes.

**Base path:** `/api/context-graph`

**Auth:** JWT required (`authenticateJWT`) on all routes.

**Proxy:** Next.js API proxy — browser clients use relative `/api/context-graph/*`.

---

## 2. Common request context

### Query parameters (shared)

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `dashboardId` | string | Yes* | Personal/business dashboard scope |
| `businessId` | string | No | Business workspace context |
| `householdId` | string | No | Household context |
| `depth` | integer | No | Traversal depth (default 1, max 2) |
| `nodeBudget` | integer | No | Max nodes (default 50) |
| `edgeBudget` | integer | No | Max edges (default 50) |
| `consumer` | enum | No | `ai_pipeline` \| `hub_ui` \| `api_client` \| `search` |

*Required unless inferable from session default dashboard.

### Common response envelope

```typescript
interface ContextGraphResponse<T> {
  success: boolean;
  data: T;
  meta: {
    truncated: boolean;
    depthUsed: number;
    nodesReturned: number;
    edgesReturned: number;
    nodesOmitted: number;
    requestId: string;
  };
  error?: { code: string; message: string };
}
```

### Error codes

| Code | HTTP | Meaning |
|------|------|---------|
| `CG_UNAUTHORIZED` | 401 | Missing/invalid JWT |
| `CG_FORBIDDEN` | 403 | PE denied anchor |
| `CG_NOT_FOUND` | 404 | Anchor not found or not visible |
| `CG_INVALID_DESCRIPTOR` | 400 | Malformed moduleId/entityType/entityId |
| `CG_BUDGET_EXCEEDED` | 200 | Truncated — not error; `meta.truncated: true` |
| `CG_DEPTH_EXCEEDED` | 400 | Requested depth > allowed for consumer |

---

## 3. Entity context

### `GET /api/context-graph/entities/:moduleId/:entityType/:entityId/context`

Returns **entity neighborhood** bundle — 1-hop edges and hydrated neighbors.

**Path parameters:**

| Param | Example |
|-------|---------|
| `moduleId` | `drive` |
| `entityType` | `file` |
| `entityId` | UUID |

**Response:** `ContextGraphResponse<ContextBundleDescriptor>` with `kind: 'entity_neighborhood'`.

**Behavior:**

1. Validate descriptor against platform entity registry
2. Hydrate anchor node via module adapter
3. List edges from anchor (adapters: vlink reverse lookup, notebook, todo deps)
4. Hydrate targets within budget
5. Apply permission redaction
6. Return bundle

**Does not:** Mutate V_Link, create suggestions, or grant access.

---

## 4. V_Link bundle

### `GET /api/context-graph/vlinks/:id/bundle`

Returns **V_Link container bundle** — container metadata + resolved attachments.

**Path parameters:**

| Param | Description |
|-------|-------------|
| `id` | V_Link UUID or `VL-########` public code |

**Query parameters:** Shared context + optional `includeNested: boolean` (default false).

**Response:** `ContextGraphResponse<ContextBundleDescriptor>` with `kind: 'vlink'`.

**Behavior:**

1. `vlinkPermissionService` — caller must be member
2. Load container + `VLinkEntity` rows
3. Batch hydrate via `vlinkEntityResolverService`
4. Redact restricted attachments
5. Exclude pending suggestions
6. Compose bundle per [CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md](./CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md)

**Relationship to existing API:** Composes data currently split across `GET /api/vlinks/:id`, `GET /api/vlinks/:id/entities`, and resolver — does not replace V_Link CRUD routes.

---

## 5. Bundle resolve

### `POST /api/context-graph/bundle/resolve`

Composes a bundle from an arbitrary **root descriptor** and **consumer profile**. Read-only composition — no writes.

**Request body:**

```typescript
interface BundleResolveRequest {
  root: PlatformEntityNodeDescriptor | VLinkContainerNodeDescriptor;
  kind?: 'entity_neighborhood' | 'vlink' | 'resolved';
  tenantScope: {
    dashboardId: string;
    businessId?: string | null;
    householdId?: string | null;
  };
  options?: {
    depth?: number;
    nodeBudget?: number;
    edgeBudget?: number;
    edgeTypes?: string[];       // filter — e.g. ['vlink.attachment']
    consumer?: 'ai_pipeline' | 'hub_ui' | 'api_client';
    includeEphemeral?: boolean; // default false
    maxTokenEstimate?: number;
  };
}
```

**Response:** `ContextGraphResponse<ContextBundleDescriptor>`.

**Behavior:**

1. Validate root descriptor
2. Select adapters per `edgeTypes` and anchor kind
3. Orchestrate read per federation contract
4. Return bundle with provenance + AI suitability flags

**Rate limit (future):** 60 req/min/user — composition is expensive.

---

## 6. Graph projection (Phase 1B — specified here for coherence)

### `GET /api/context-graph/projection`

**Query parameters:**

| Param | Description |
|-------|-------------|
| `anchorKind` | `entity` \| `container` |
| `moduleId` | Required if anchorKind=entity |
| `entityType` | Required if anchorKind=entity |
| `entityId` | Required if anchorKind=entity |
| `vlinkId` | Required if anchorKind=container |
| `depth`, `nodeBudget` | Shared |

**Response:**

```typescript
interface GraphProjectionDTO {
  nodes: GraphNodeDTO[];
  edges: GraphEdgeDescriptor[];
  anchor: PlatformEntityNodeDescriptor | VLinkContainerNodeDescriptor;
}
```

Lower-level than bundle — no summaries or AI suitability. For visualization surfaces.

---

## 7. Neighbors list (lightweight)

### `GET /api/context-graph/entities/:moduleId/:entityType/:entityId/neighbors`

Returns edge list **without full bundle composition** — for performant UI rails.

**Response:**

```typescript
interface NeighborsResponse {
  edges: GraphEdgeDescriptor[];
  hydratedTargets: GraphNodeDTO[];  // partial — titles only
}
```

---

## 8. Tag index lookup (Phase 2A — specified)

### `GET /api/context-graph/tags/search`

**Query:** `q`, `dashboardId`, `businessId`, `moduleId?`, `limit`

**Response:** Matching entity descriptors with tag metadata — **read-only mirror**.

**Does not:** Create tags or return tag nodes as graph vertices.

---

## 9. AI grounding bundle (internal — Phase 1C)

### `POST /api/context-graph/ai/grounding-bundle`

**Auth:** JWT + optional internal service token for pipeline.

**Request:** `BundleResolveRequest` + `query: string` for signal detection.

**Response:** `ContextBundleDescriptor` optimized for pipeline — `aiSuitability.groundable` enforced.

**Consumer:** `DigitalLifeTwinCore` / pipeline orchestrator — not browser-exposed initially.

---

## 10. Admin diagnostic (Phase 1B)

### `GET /api/context-graph/admin/projection`

**Auth:** Admin role required.

**Query:** Same as projection + `userId` (impersonation policy applies).

**Purpose:** Pipeline/debug graph — not user-facing.

---

## 11. Explicit non-endpoints

The following are **not** Context Graph API responsibilities:

| Operation | Correct API |
|-----------|-------------|
| Create/update/delete V_Link | `/api/vlinks/*` |
| Link/unlink entity | `/api/vlinks/:id/entities` |
| Create tag on entity | Module APIs |
| Write AI memory | AI module APIs |
| Grant file access | Drive permission APIs |

---

## 12. Versioning

| Header | Value |
|--------|-------|
| `X-Context-Graph-Contract-Version` | `1.0` |

Breaking changes require contract version bump and certification re-evaluation.

---

## 13. Implementation phases

| Endpoint | Phase |
|----------|-------|
| `bundle/resolve`, `vlinks/:id/bundle` | 1A / 1C |
| `entities/.../context`, `neighbors` | 1B |
| `projection` | 1B |
| `ai/grounding-bundle` | 1C |
| `tags/search` | 2A |
| `admin/projection` | 1B |

---

**Last updated:** 2026-06-18
