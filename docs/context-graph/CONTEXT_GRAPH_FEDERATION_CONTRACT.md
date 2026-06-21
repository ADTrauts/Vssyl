# Context Graph — Federation Contract

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0B — Constitutional architecture  
**Date:** 2026-06-18  
**Status:** Canonical contract — spec only; no implementation  
**Extends:** [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](../architecture/RELATIONSHIP_READ_FEDERATION_CONTRACT.md)

---

## 1. Purpose

Define how the Context Graph **reads** nodes and edges from authoritative systems of record through module adapters — without creating a universal relationship database or write API.

---

## 2. Federation principles (inherited + extended)

| # | Principle |
|---|-----------|
| **F1** | System of record is singular — readers never write foreign SoR |
| **F2** | Read through authority gates — visibility services + Policy Engine |
| **F3** | **No universal relationship table** |
| **F4** | Tenant scope on every hop |
| **F5** | Compose views — conflicting truth resolves to SoR module |
| **F6** | Ephemeral inference is not SoR |
| **F7** | Cached views are derived and invalidatable |
| **CG-F8** | Context Graph orchestrator is **read-only** |
| **CG-F9** | Node identity is **descriptor** — not a stored graph vertex row |
| **CG-F10** | Bundle composition is a **view** — not a persisted graph snapshot |

---

## 3. Node descriptor shape

### 3.1 Entity node (primary)

```typescript
interface PlatformEntityNodeDescriptor {
  kind: 'entity';
  moduleId: string;           // e.g. 'drive', 'todo', 'calendar'
  entityType: string;         // registry key: 'file', 'task', 'event'
  entityId: string;           // UUID or module id
  tenantScope: TenantScope;
  vlinkEntityType?: string;   // optional VLinkEntityType alias when attached
}
```

### 3.2 Container node (secondary)

```typescript
interface VLinkContainerNodeDescriptor {
  kind: 'container';
  containerType: 'vlink';
  vlinkId: string;
  publicCode?: string;        // VL-######## when resolved
  tenantScope: TenantScope;
}
```

### 3.3 Hydrated node (projection DTO)

```typescript
interface GraphNodeDTO {
  descriptor: PlatformEntityNodeDescriptor | VLinkContainerNodeDescriptor;
  display: {
    title: string;
    subtitle?: string;
    icon?: string;
    url?: string;
  };
  access: 'full' | 'restricted' | 'omitted';
  metadata?: {
    tags?: string[];          // from host entity — not separate nodes
    status?: string;
    updatedAt?: string;
  };
}
```

**Forbidden:** File bytes, message bodies, permission blobs, secrets.

---

## 4. Edge descriptor shape

```typescript
interface GraphEdgeDescriptor {
  edgeId: string;             // SoR row id when applicable
  relationshipClass: RelationshipClass;  // taxonomy class
  edgeType: string;           // e.g. 'vlink.attachment', 'notebook.link', 'task.dependency'
  source: PlatformEntityNodeDescriptor | VLinkContainerNodeDescriptor;
  target: PlatformEntityNodeDescriptor;
  direction: 'outbound' | 'inbound' | 'undirected';
  tenantScope: TenantScope;
  lifecycleState: 'active' | 'archived' | 'trashed' | 'revoked' | 'unlinked';
  sourceSystem: 'vlink' | 'notebook' | 'todo' | 'drive' | 'business' | string;
  grantsContentAccess: boolean;  // false for V_Link attachments
  metadata?: Record<string, unknown>;
}
```

### Edge type registry (initial)

| edgeType | SoR | Class |
|----------|-----|-------|
| `vlink.attachment` | `VLinkEntity` | Association |
| `vlink.nest` | `VLink.parentVLinkId` | Hierarchy |
| `vlink.member` | `VLinkMember` | Membership |
| `notebook.link` | `NotebookLink` | Association / Reference |
| `todo.dependency` | `TaskDependency` | Dependency |
| `todo.file_link` | `TaskFileLink` | Association |
| `todo.event_link` | `TaskEventLink` | Association |
| `drive.permission` | `FilePermission` | Access grant |
| `business.approval_hierarchy` | `ManagerApprovalHierarchy` | Hierarchy |
| `business.employee_position` | `EmployeePosition` | Hierarchy |

---

## 5. Module adapter responsibilities

Each adapter **must**:

| Responsibility | Rule |
|----------------|------|
| **Read SoR only** | Query owning module tables — no cross-module Prisma joins |
| **Visibility gate** | Call module `*VisibilityService` or `*VlinkAccessService` before return |
| **Bounded DTOs** | Respect batch size (max 25 refs) and field allowlists |
| **Tenant scope** | Filter by `dashboardId` + context ids on every query |
| **No writes** | Adapters are read delegates — mutations stay in module services |
| **Register** | Declare supported `entityType` keys and `edgeType` outputs |
| **Lifecycle honesty** | Return `trashed` / `archived` states — do not hide soft-deleted hosts |
| **Redaction** | Return `restrictedPlaceholder` when edge exists but target denied |

### Adapter interface (conceptual)

```typescript
interface ContextGraphModuleAdapter {
  moduleId: string;
  supportedEntityTypes: string[];
  supportedEdgeTypes: string[];

  hydrateNode(
    userId: string,
    descriptor: PlatformEntityNodeDescriptor
  ): Promise<GraphNodeDTO>;

  hydrateNodesBatch(
    userId: string,
    descriptors: PlatformEntityNodeDescriptor[]
  ): Promise<GraphNodeDTO[]>;

  listEdgesFrom(
    userId: string,
    anchor: PlatformEntityNodeDescriptor | VLinkContainerNodeDescriptor,
    options: { edgeTypes?: string[]; limit: number }
  ): Promise<GraphEdgeDescriptor[]>;
}
```

---

## 6. Ownership rules

| Artifact | Write owner | Context Graph role |
|----------|-------------|-------------------|
| Module entities | Owning module | Read via adapter |
| `VLink`, `VLinkEntity` | Platform (vlink) | Read + compose bundles |
| `NotebookLink` | Notebook module | Read via adapter |
| Module operational links | Owning module | Read via adapter |
| Org chart / approval | Business Administration | Read via BA adapters |
| `UserMemoryFact` | AI module | **Adjacent** — not graph edge SoR |
| Module tags | Owning module | Hydrate metadata; Tag Index reads mirror |
| Graph projection / bundle | **None** | Derived read view |

**W-No-Universal-SoR:** Context Graph orchestrator **must not** persist authoritative nodes or edges.

---

## 7. Permission rules

### 7.1 Checkpoint order

```
1. Authenticate user (JWT)
2. Resolve tenant scope from request context
3. Container gate (vlinkPermissionService) — if anchor is vlink
4. Module visibility gate — per target descriptor
5. Policy Engine — where module requires dual evaluation
6. Redact or omit — never leak title/content on deny
```

### 7.2 Invariants

| Invariant | Statement |
|-----------|-----------|
| **CG-P1** | V_Link membership ≠ entity content access |
| **CG-P2** | Pending suggestions excluded from all graph reads |
| **CG-P3** | Traversal depth ≤ configured cap per surface |
| **CG-P4** | Denied node does not expand further hops |
| **CG-P5** | Admin diagnostics require impersonation policy |

---

## 8. Read-only graph rules

| Rule | Statement |
|------|-----------|
| **R1** | All Context Graph HTTP APIs are **GET/POST-read** — POST only for `bundle/resolve` (composition, no mutation) |
| **R2** | Orchestrator never calls module write services |
| **R3** | Inference edges (entityLinking) marked `ephemeral: true` — not returned as SoR |
| **R4** | Tag index is read-only mirror — writes go to module SoR |
| **R5** | Graph cache (future) invalidates on domain events — never authoritative |
| **R6** | Attach-of-attach traversal **forbidden** for V_Link containers |

---

## 9. No universal SoR rule

**Explicit prohibition:**

> The Context Graph program shall not introduce a platform-wide `context_nodes`, `graph_edges`, or `relationships` table as system of record for module entity relationships.

Permitted derived stores:

- Read-only Tag Index (mirror)
- Event-invalidated projection cache
- Search relationship facets (derived)

All such stores must declare **derived, invalidatable, non-authoritative** in schema documentation.

---

## 10. Orchestrator responsibilities (future Phase 1A)

| Step | Action |
|------|--------|
| 1 | Accept anchor descriptor + consumer profile (AI, UI, search) |
| 2 | Select adapter set for anchor |
| 3 | List edges within depth/budget |
| 4 | Batch hydrate targets |
| 5 | Apply redaction policy |
| 6 | Compose `ContextBundleDescriptor` or `GraphProjectionDTO` |
| 7 | Return with `truncated`, `depthUsed`, `nodesOmitted` metadata |

---

## 11. Related documents

| Document | Purpose |
|----------|---------|
| [CONTEXT_GRAPH_ADAPTER_INVENTORY.md](./CONTEXT_GRAPH_ADAPTER_INVENTORY.md) | Per-module readiness |
| [CONTEXT_GRAPH_SECURITY_AND_PERMISSION_MODEL.md](./CONTEXT_GRAPH_SECURITY_AND_PERMISSION_MODEL.md) | Security detail |
| [RELATIONSHIP_READ_ADAPTER_CATALOG.md](../architecture/RELATIONSHIP_READ_ADAPTER_CATALOG.md) | Relationship Framework catalog |

**Last updated:** 2026-06-18
