# Context Graph — Reality Assessment

**Program:** Context Graph Phase 0A — Relationship Discovery  
**Date:** 2026-06-23  
**Status:** Discovery artifact — no implementation  
**Scope:** Determine whether Vssyl already contains the foundations of a Context Graph

---

## Executive finding

**Vssyl already contains a partial Context Graph.** The platform is not at Level 0. Relationship infrastructure is decentralized across module schemas, V_Link (Tier 0 association), a certified Context Graph federation layer (L3), Unified Search, and AI Retrieval evidence — but these layers are **not yet unified** as a single relationship consumption path for all AI consumers.

The central question for Phase 0A:

> What relationships already exist across Vssyl, and how should AI, Search, and Retrieval use them?

**Answer:** Relationships exist in at least **six parallel systems** (module FKs, V_Link, operational links, activity/events, search indexes, retrieval evidence). Persisted cross-module truth is strongest in **V_Link** and module-owned edges. **Search and Retrieval repeatedly reconstruct** relationships that are implicit in co-occurrence, tags, or query context but not stored as graph edges.

---

## Graph maturity score

| Level | Definition | Status |
|-------|------------|--------|
| **0** | No relationships | ❌ Superseded |
| **1** | Ad hoc relationships | ✅ Historical — module FKs only |
| **2** | V_Link foundations | ✅ Shipped (2025–2026) |
| **3** | Relationship platform | ✅ **Current baseline** — taxonomy, read federation, PE, domain events |
| **4** | Graph ready | ⚠️ **Partial** — Context Graph L3 certified; adapters + bundles; retrieval not federated |
| **5** | Certified graph capability | ⚠️ Context Graph L3 CwF (RD-CG-010); not Level 5 on this 0–5 discovery scale |

### Determination

| Field | Value |
|-------|-------|
| **Current level** | **3.5** (between Relationship Platform and Graph Ready) |
| **Target level** | **4** — unified read federation for AI + Search + Retrieval without new SoR |
| **Blockers** | Retrieval evidence ephemeral; Search parallel paths; no retrieval→bundle bridge; tag index advisory-only; HR/scheduling adapters incomplete |

---

## Relationship-capable systems inventory

| System | Role | Persistence | Graph relevance |
|--------|------|-------------|-----------------|
| **V_Link** | Cross-module association container + attachments | `VLink`, `VLinkEntity`, `VLinkMember` | Primary **association edge** substrate |
| **Platform Entities** | `(moduleId, entityType, entityId)` registry | Manifest + startup registry | **Node identity** contract |
| **Module FKs** | Ownership, hierarchy, containment | Per-module Prisma | **Native edges** (file→folder, task→project) |
| **Activity** | Immutable action log | `ModuleActivityEvent` envelope | **Temporal** relationship signal |
| **Domain Events** | Cross-cutting fan-out | Event bus subscribers | **Invalidation / re-fetch** — not SoR |
| **Unified Search** | Federated discovery | Provider indexes (derived) | **Ephemeral** relatedness at query time |
| **AI Retrieval** | Pipeline evidence via Search | Ephemeral per request | **Strong graph candidate** — rediscovered edges |
| **Context Graph** | Federation orchestrator | Derived bundles | **Projection layer** — L3 certified |
| **NotebookLink / todo refs** | Operational references | Module tables | Module-local **reference** edges |
| **Place connections** | Follow / community | Place module | **Follow** class edges |
| **Business / household membership** | Tenant + roster | `BusinessMember`, `HouseholdMember` | **Membership** nodes |
| **Dashboard ownership** | Workspace scope | `Dashboard` FKs | **Containment** anchor |
| **File associations** | Shares, attachments | Drive + chat | **Access grant** + **attachment** |
| **Calendar associations** | Event attendees, links | Calendar module | **Participation** + V_Link |
| **Task associations** | Project, assignee, deps | Todo module | **Assignment**, **dependency** |
| **Chat associations** | Conversations, files | Chat module | **Attachment**, **membership** |

---

## V_Link analysis

### Model: hybrid node + edge

| Aspect | V_Link role |
|--------|-------------|
| **VLink container** | **Graph node** — scoped, nestable hub with membership |
| **VLinkEntity** | **Graph edge** — directed attachment from container → module entity |
| **VLinkMember** | **Membership edge** — user → container (not content access) |
| **VLink.parentVLinkId** | **Hierarchy edge** — container nesting |

V_Link is **not** a pure edge table nor a universal node store. It is an **association hub** that acts as both a first-class navigable object (node) and a source of cross-module edges (attachments).

### Enforcement

- Link permission: Policy Engine + `vlinkPermissionService`
- Attachment access: per-module `*VlinkAccessService` + `vlinkEntityResolverService`
- **Membership ≠ attachment content access** (constitutional)

---

## Search + retrieval alignment (preview)

| Capability | Relationship role today | Future V_Graph role |
|------------|-------------------------|---------------------|
| **Unified Search** | Discovers entities; no edge persistence | **Discovery input** — candidate edges with provenance `inference` |
| **AI Retrieval** | Maps search hits → `AIRetrievalEvidence` | **Evidence feed** for bundle composition |
| **Platform Entities** | Node IDs for adapters | **Stable node keys** |
| **Activity** | Audit trail of actions | **Temporal edge** signals (who linked what) |
| **Domain Events** | Re-fetch triggers | **Invalidation** — not edge SoR |
| **Context Graph** | Bundle resolution from anchors | **Orchestration** — merge SoR + ephemeral evidence |

**Principle:** None of these replace each other. V_Graph (if named distinctly from certified Context Graph) means **unified consumption**, not a new database.

---

## Architectural risks

| ID | Risk | Severity |
|----|------|----------|
| R-01 | Retrieval rediscovers same cross-module links every request | Major |
| R-02 | Search indexes treated as relationship SoR | Major |
| R-03 | V_Link membership confused with file/note access | Major (mitigated by framework) |
| R-04 | Duplicate graph paths: `vlink` pipeline vs `graph_bundle` vs retrieval | Moderate |
| R-05 | Ephemeral inference persisted without user accept | Major (constitutional violation) |
| R-06 | Incomplete entity resolver coverage (NOTE, DASHBOARD enums) | Moderate |
| R-07 | Place triple path (tool, provider, search) diverges | Moderate |

---

## Repeated reconstruction (summary)

Relationships most often **rebuilt at query time** rather than stored:

1. **Cross-module co-occurrence** — retrieval consumers find files + tasks + events in one answer
2. **Tag overlap** — tag index exists but not as graph edges
3. **Project context** — `project_assistant` infers project boundaries from search
4. **Operational proximity** — same dashboard, same business, same time window
5. **Place + business context** — `local_discovery` links listings to user/business scope
6. **entityLinking inference** — ephemeral merge with persisted V_Link preference

These are **strong graph candidates** for Phase 1 **projection** (not persistence without governance).

---

## References

- [CONTEXT_GRAPH_CURRENT_STATE_INVENTORY.md](./CONTEXT_GRAPH_CURRENT_STATE_INVENTORY.md) (2026-06-18 baseline)
- [CONTEXT_GRAPH_CERTIFICATION_PROMOTION_RECORD.md](./CONTEXT_GRAPH_CERTIFICATION_PROMOTION_RECORD.md)
- [V_LINK.md](../architecture/V_LINK.md)
- [RELATIONSHIP_TAXONOMY.md](../architecture/RELATIONSHIP_TAXONOMY.md)
- [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md)
- [AI_RETRIEVAL_PHASE_2B3_CLOSEOUT.md](../ai/retrieval/AI_RETRIEVAL_PHASE_2B3_CLOSEOUT.md)

**Last updated:** 2026-06-23
