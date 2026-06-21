# Context Graph — Operation Matrix

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0B — Constitutional architecture  
**Date:** 2026-06-18  
**Status:** Future runtime catalog — spec only

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Shipped today (via V_Link or module path) |
| ⚠️ | Partial / implicit |
| 🔜 | Planned — Context Graph Phase 1+ |
| ❌ | Not implemented |
| **RO** | Read-only |
| **PE** | Policy Engine checkpoint |

---

## 1. Core composition operations

### 1.1 Resolve bundle

| Field | Value |
|-------|-------|
| **Operation** | `contextGraph.resolveBundle` |
| **HTTP (future)** | `POST /api/context-graph/bundle/resolve` |
| **Status** | 🔜 Phase 1A |
| **Auth** | JWT + tenant scope |
| **PE** | Per-node visibility gates |
| **SoR** | **RO** — federated read |
| **Input** | Root descriptor + depth/budget options |
| **Output** | `ContextBundleDescriptor` |
| **Consumer** | AI pipeline, API clients, hub |

### 1.2 V_Link bundle

| Field | Value |
|-------|-------|
| **Operation** | `contextGraph.resolveVLinkBundle` |
| **HTTP (future)** | `GET /api/context-graph/vlinks/:id/bundle` |
| **Status** | ⚠️ Implicit via `/api/vlinks/*` + resolver today; 🔜 formal bundle |
| **Auth** | V_Link membership |
| **PE** | `vlinkPermissionService` + per-attachment PE |
| **Output** | `ContextBundleDescriptor` kind=`vlink` |

### 1.3 Entity context

| Field | Value |
|-------|-------|
| **Operation** | `contextGraph.resolveEntityContext` |
| **HTTP (future)** | `GET /api/context-graph/entities/:moduleId/:entityType/:entityId/context` |
| **Status** | 🔜 Phase 1B |
| **Auth** | Module visibility |
| **PE** | Module adapter gate |
| **Output** | `ContextBundleDescriptor` kind=`entity_neighborhood` |

---

## 2. Graph traversal operations

### 2.1 List neighbors

| Field | Value |
|-------|-------|
| **Operation** | `contextGraph.listNeighbors` |
| **HTTP (future)** | `GET .../entities/.../neighbors` |
| **Status** | 🔜 Phase 1B |
| **Depth** | Default 1 |
| **PE** | Per edge target |
| **Caps** | 50 edges default |

### 2.2 Permission-trimmed graph traversal

| Field | Value |
|-------|-------|
| **Operation** | `contextGraph.traverseProjection` |
| **HTTP (future)** | `GET /api/context-graph/projection` |
| **Status** | 🔜 Phase 1B |
| **Rules** | [GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](../architecture/GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md) |
| **Max depth** | 2 user-facing; 1 AI default |
| **Forbidden** | Attach-of-attach; N>2; cross-tenant BFS |
| **PE** | Every hop — omit or redact on deny |

### 2.3 Validate access

| Field | Value |
|-------|-------|
| **Operation** | `contextGraph.validateAccess` |
| **HTTP (future)** | Internal — no public route initially |
| **Status** | ⚠️ Partial — per-module `*VlinkAccessService` |
| **Purpose** | Pre-flight check before link or bundle compose |
| **Output** | `{ allowed: boolean; reason?: string; redacted: boolean }` |

---

## 3. Summarization operations

### 3.1 Summarize context

| Field | Value |
|-------|-------|
| **Operation** | `contextGraph.summarizeBundle` |
| **HTTP (future)** | Embedded in bundle response |
| **Status** | ⚠️ Partial — `vlinkPipelineContextService` produces implicit summary |
| **Output** | `ContextBundleSummaries.human` + `.ai` |
| **Limits** | human 2KB; ai 4KB |

### 3.2 AI grounding bundle

| Field | Value |
|-------|-------|
| **Operation** | `contextGraph.composeAiGroundingBundle` |
| **HTTP (future)** | `POST /api/context-graph/ai/grounding-bundle` |
| **Status** | ⚠️ Partial via `fetchVLinkPipelineContext`; 🔜 Phase 1C |
| **Precedence** | Memory > vlink > providers > inference |
| **Exclusions** | Pending suggestions |
| **Output** | Bundle + `aiSuitability` flags |
| **Token budget** | 2,000 default slice |

---

## 4. Tag operations

### 4.1 Tag index lookup

| Field | Value |
|-------|-------|
| **Operation** | `contextGraph.searchTags` |
| **HTTP (future)** | `GET /api/context-graph/tags/search` |
| **Status** | ❌ Phase 2A |
| **SoR** | **RO** derived index |
| **PE** | Re-hydrate matched entities through module adapters |
| **Rule** | Tags are metadata — not graph nodes |

### 4.2 Tag on hydrate

| Field | Value |
|-------|-------|
| **Operation** | `adapter.hydrateNode` includes `metadata.tags` |
| **Status** | ⚠️ Partial — module providers include tags where field exists |
| **Rule** | No tag-only expansion |

---

## 5. V_Link operations (existing — not Context Graph)

These remain on `/api/vlinks/*` — **not** migrated to Context Graph write path.

| Operation | Status | Notes |
|-----------|--------|-------|
| Create vlink | ✅ | `POST /api/vlinks` |
| Link entity | ✅ | `POST /api/vlinks/:id/entities` |
| Unlink entity | ✅ | `DELETE .../entities/:linkId` |
| Manage members | ✅ | members routes |
| Suggestions | ✅ | approval-gated |
| Archive/restore | ✅ | separate from trash |

---

## 6. Adapter operations (per module)

| Operation | Owner | Status |
|-----------|-------|--------|
| `adapter.hydrateNode` | Module adapter | ⚠️ via resolver |
| `adapter.hydrateNodesBatch` | Module adapter | ⚠️ partial batch |
| `adapter.listEdgesFrom` | Module adapter | ❌ |
| `vlink.listAttachments` | V_Link platform | ✅ |
| `vlink.resolveAttachment` | `vlinkEntityResolverService` | ✅ |
| `notebook.listLinks` | Notebook module | ⚠️ |
| `todo.listDependencies` | Todo module | ⚠️ via provider |

---

## 7. Admin operations

| Operation | Status | Auth |
|-----------|--------|------|
| Enable/disable `vlink` pipeline source | ✅ Admin Portal | Admin |
| Pipeline trace `source: vlink` | ✅ | Admin |
| Admin graph projection | 🔜 Phase 1B | Admin + impersonation policy |
| Graph health diagnostic | ❌ | Admin |

---

## 8. Matrix summary

| Category | ✅ Today | ⚠️ Partial | 🔜 Planned | ❌ Missing |
|----------|--------:|-----------:|-----------:|-----------:|
| Bundle composition | 0 | 2 | 3 | 0 |
| Graph traversal | 0 | 1 | 2 | 0 |
| Summarization | 0 | 2 | 1 | 0 |
| Tag index | 0 | 1 | 0 | 1 |
| AI grounding | 0 | 1 | 1 | 0 |
| Adapter interface | 0 | 3 | 10 | 2 |

---

## 9. Constitutional gaps (all categories)

| ID | Gap | Blocks Phase 1? |
|----|-----|-----------------|
| CG-OM-1 | No `contextGraphOrchestratorService` | Yes |
| CG-OM-2 | No formal bundle API | Yes |
| CG-OM-3 | No `listEdgesFrom` adapters | Yes |
| CG-OM-4 | No graph projection route | Phase 1B |
| CG-OM-5 | No tag index | Phase 2A only |
| CG-OM-6 | NOTE resolver debt | Phase 1D parallel |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [CONTEXT_GRAPH_READ_API_CONTRACT.md](./CONTEXT_GRAPH_READ_API_CONTRACT.md) | HTTP mapping |
| [CONTEXT_GRAPH_FEDERATION_CONTRACT.md](./CONTEXT_GRAPH_FEDERATION_CONTRACT.md) | Orchestrator rules |
| [CONTEXT_GRAPH_FINDINGS_REGISTER.md](./CONTEXT_GRAPH_FINDINGS_REGISTER.md) | Tracked findings |

**Last updated:** 2026-06-18
