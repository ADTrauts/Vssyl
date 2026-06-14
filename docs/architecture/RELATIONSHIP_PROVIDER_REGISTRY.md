# Relationship Provider Registry

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-1 — Read adapter constitutional architecture  
**Status:** Constitutional registry model (future)  
**Date:** 2026-06-14  
**Catalog:** [RELATIONSHIP_READ_ADAPTER_CATALOG.md](./RELATIONSHIP_READ_ADAPTER_CATALOG.md)  
**Governance:** [READ_ADAPTER_GOVERNANCE.md](./READ_ADAPTER_GOVERNANCE.md)

> **Scope:** Defines a **future registry model** for relationship read adapters, search providers, and V_Link resolvers — preventing drift. **No** registry implementation, code, or API in this phase.

---

## Purpose

Today adapters are **implicit** in visibility services (`driveVisibilityService`, `vlinkEntityResolverService`, …). As modules and entity types grow, consumers need a **discoverable registry** that declares:

- Who owns each read path  
- Which relationship classes are served  
- Permission contract version  
- Compatibility with PLATFORM_ENTITY_MODEL  

**Registry is a catalog of read delegates** — not a universal relationship store.

---

## Registry vs other registries

| Registry | Purpose | Writes SoR? |
|----------|---------|-------------|
| **Relationship Provider Registry** (this doc) | Read adapters + hydrate gates | No |
| `platformEntityRegistry` | Entity type descriptors for V_Link resolver | No |
| `domainEventRegistry` | Event types for emit/consume | No |
| SearchProvider array | Entity search | No |
| Module manifest (`registerBuiltInModules`) | AI context + capabilities | No |

**Rule:** Relationship Provider Registry **references** platform entity registry — does not duplicate entity typing.

---

## Provider kinds

| Kind | Id prefix | Example |
|------|-----------|---------|
| **K1 — Visibility adapter** | `{module}.visibility` | `todo.visibility` |
| **K2 — V_Link access adapter** | `{module}.vlinkAccess` | `drive.vlinkAccess` |
| **K3 — Operational link adapter** | `{module}.links` | `notebook.links` |
| **K4 — Platform V_Link adapter** | `vlink.platform`, `vlink.resolver`, `vlink.pipeline` | Platform |
| **K5 — Search provider** | `{module}.search` | `drive.search` |
| **K6 — AI context provider** | `{module}.ai.{providerId}` | `todo.ai.overview` |
| **K7 — Graph slice adapter** (future 2D-2) | `{module}.graph` | `place.graph` |

Kinds K1–K4 are **relationship read adapters**. K5–K7 are **consumer-facing** registrations that must delegate to K1–K4 for relationship truth.

---

## Registry entry schema (conceptual)

Each entry **must** declare:

| Field | Required | Description |
|-------|----------|-------------|
| `providerId` | ✅ | Stable string — `{module}.{role}` |
| `kind` | ✅ | K1–K7 |
| `ownerModule` | ✅ | Owning module or `platform` |
| `ownerTeam` | ✅ | Accountability (File Hub, Chat, …) |
| `relationshipClasses` | ✅ | Taxonomy classes served (primary) |
| `entityTypes` | ⚠️ | Platform entity types when K2/K4 |
| `capabilities` | ✅ | `read.edges`, `read.hydrate`, `read.list`, `search.entities`, … |
| `tenantScopes` | ✅ | `personal`, `business`, `household`, `public_catalog` |
| `permissionContract` | ✅ | Reference to visibility service + PE actions |
| `payloadSchemaVersion` | ✅ | DTO version for RelationshipReadDTO |
| `maxBatchSize` | ✅ | Bound for list/hydrate |
| `cachePolicy` | ⚠️ | TTL, re-check rules |
| `status` | ✅ | `active`, `deprecated`, `planned` |
| `platformEntityModelRow` | ⚠️ | Link to PLATFORM_ENTITY_MODEL checklist |
| `documentationUrl` | ✅ | Module operation matrix or architecture doc |

---

## Capability declarations

| Capability | Meaning |
|------------|---------|
| `read.edges.fromAnchor` | List edges where anchor is source |
| `read.edges.toAnchor` | List edges where anchor is target |
| `read.edges.byContainer` | List edges in V_Link / project / folder |
| `read.hydrate.target` | Resolve target entity summary with PE |
| `read.membership.roster` | List container members |
| `read.grants.onResource` | List access grants |
| `search.entities` | SearchProvider entity search |
| `search.containers` | V_Link container search |
| `ai.context.bundle` | AI provider bounded payload |
| `analytics.aggregate` | Safe metadata for metrics |
| `graph.slice` | Layout nodes/edges for viz (derived) |

Consumers declare required capabilities — orchestrator resolves providers from registry.

---

## Relationship classes served (initial registry map)

| providerId | kind | Classes |
|------------|------|---------|
| `drive.visibility` | K1 | Ownership, access grant, hierarchy, containment |
| `drive.vlinkAccess` | K2 | Association hydrate |
| `chat.visibility` | K1 | Membership, communication, attachment |
| `chat.vlinkAccess` | K2 | Association hydrate |
| `calendar.vlinkAccess` | K2 | Association hydrate |
| `todo.visibility` | K1 | Ownership, assignment, dependency, tag, containment |
| `todo.vlinkAccess` | K2 | Association hydrate |
| `notes.visibility` | K1 | Ownership, access grant, tag, containment |
| `notebook.links` | K3 | Reference, association (operational) |
| `place.visibility` | K1 | Follow, visibility, tag, membership, participation |
| `place.vlinkAccess` | K2 | Association hydrate |
| `business.members` | K1 | Membership |
| `vlink.platform` | K4 | Association, membership, hierarchy, ownership (container) |
| `vlink.resolver` | K4 | Association hydrate (cross-type) |
| `vlink.pipeline` | K4 | Association (AI bundle) |
| `vlink.search` | K5 | Association container search |
| `ai.memory` | K1 | AI context |

**Planned gaps:** `notes.vlinkAccess` (migrate from inline resolver), `calendar.visibility` edge adapter, `todo.search`, `notes.search`, `calendar.search`.

---

## Permission contract

Each entry binds to:

| Contract element | Source |
|------------------|--------|
| Visibility service | Module `*VisibilityService` |
| V_Link link gate | `*VlinkAccessService` |
| PE actions | Module manifest permissions |
| Tenant keys | dashboardId, businessId, householdId |

**Versioning:** `permissionContractVersion` bumps when PE actions or visibility semantics change — consumers re-certify.

---

## Versioning expectations

| Version type | When to bump |
|--------------|--------------|
| `payloadSchemaVersion` | DTO fields added/removed |
| `permissionContractVersion` | PE or visibility behavior change |
| `providerId` | **Never** rename — deprecate and add new id |
| Registry `schemaVersion` | Registry envelope change |

### Compatibility guarantees

| Change | Breaking? |
|--------|-----------|
| Add optional DTO field | No |
| Remove DTO field | Yes — major bump |
| Tighten visibility (more deny) | No for security — document in changelog |
| Loosen visibility | **Breaking** — security review required |
| New relationship class on existing adapter | No — extend declaration |

---

## Registration workflow (governance)

1. Module proposes entry in PR with operation matrix update  
2. Architecture verifies ownership matrix — no duplicate SoR  
3. PLATFORM_ENTITY_MODEL updated if new VLinkEntityType  
4. Entry added to registry manifest (future) with `status: active`  
5. Consumer docs updated if AI/search/graph affected  

See [READ_ADAPTER_GOVERNANCE.md](./READ_ADAPTER_GOVERNANCE.md).

---

## Drift prevention

| Drift symptom | Registry guard |
|---------------|----------------|
| New VLink type without resolver | `platformEntityModelRow` required on K2 |
| Search bypasses visibility | K5 must declare `permissionContract` same as K1 |
| NotebookLink read in V_Link service | Separate K3 id — class declaration |
| AI reads Prisma directly | Must register K6 delegating to K1 |
| Duplicate hydrate logic | Single K2 per module per entity type |

### CI expectations (future implementation)

- Manifest `capabilities.vlink` ↔ registry K2 entries  
- Registered entity types ⊆ `platformEntityRegistry`  
- Deprecated providers fail lint if referenced by new code  

---

## Relationship to SearchProvider registry

| Aspect | SearchProvider | Relationship read adapter |
|--------|----------------|---------------------------|
| Returns | Openable entity hits | Edges + optional hydrate |
| Registration | `searchController` array | Relationship Provider Registry |
| Overlap | Same visibility service | Search may call K1; edge panels call K3/C |

Single module may register **both** K5 and K1 — shared permission contract required.

---

## Related documents

| Document | Purpose |
|----------|---------|
| [PLATFORM_ENTITY_MODEL.md](./PLATFORM_ENTITY_MODEL.md) | Entity integration truth |
| [SEARCH_PROVIDER_MODEL.md](./SEARCH_PROVIDER_MODEL.md) | K5 detail |
| [RELATIONSHIP_READ_ADAPTER_CATALOG.md](./RELATIONSHIP_READ_ADAPTER_CATALOG.md) | Class coverage |

**Last updated:** 2026-06-14
