# Context Graph — Constitutional Charter

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0B — Constitutional architecture  
**Date:** 2026-06-18  
**Status:** **RATIFICATION PENDING** — constitutional document; no implementation  
**Authority:** Phase 0A discovery ([CONTEXT_GRAPH_EXECUTIVE_SUMMARY.md](./CONTEXT_GRAPH_EXECUTIVE_SUMMARY.md))

---

## 1. Purpose

Establish the **Vssyl Context Graph** as a formal **Tier 0 platform capability** that federates relationship-aware context from decentralized module systems of record — enabling AI grounding, search enrichment, graph visualization, and cross-module intelligence **without** consolidating data into a universal graph database or entity table.

The Context Graph **evolves V_Link** from a user-facing linking feature into the platform's **primary cross-module association substrate** and **read federation orchestration layer**.

---

## 2. Scope

### In scope

| Area | Scope |
|------|-------|
| **Architecture** | Federated node/edge model, bundle descriptors, read API contracts |
| **V_Link** | Association registry, container nodes, attachment edges |
| **Adapters** | Module read delegates for hydrate and edge listing |
| **AI consumption** | Context bundles, pipeline integration, grounding precedence |
| **Tags** | Metadata on nodes; future read-only Tag Index |
| **Security** | Permission-trimmed traversal, redaction model |
| **Certification** | Platform capability G1–G9 gates |

### Out of scope (this program phase)

Runtime code, Prisma models, migrations, HTTP route implementation, UI, Tag Index implementation, AI memory implementation, graph database adoption.

---

## 3. Non-goals

| Non-goal | Rationale |
|----------|-----------|
| **Universal graph database** | Federation over existing Postgres SoRs |
| **Universal `ContextNode` table** | Modules own entity schemas (constitutional) |
| **V_Link replacement** | V_Link is the association substrate — evolve, not replace |
| **Tags as graph entities** | Semantic collapse — tags are metadata |
| **V_Link grants entity access** | Membership ≠ content access (non-negotiable) |
| **N-hop social graph** | Privacy and performance — capped traversal |
| **AI owns the graph** | AI is consumer; modules and platform own SoR |
| **Realtime graph sync v1** | Pull-based federation acceptable initially |
| **Third-party graph engine** | No Neo4j, Neptune, or external graph DB |

---

## 4. Constitutional principles

| # | Principle |
|---|-----------|
| **P1** | **Federation over consolidation** — compose reads; never merge SoRs |
| **P2** | **Module ownership** — entities and operational links live in module schemas |
| **P3** | **V_Link as association substrate** — primary cross-module Association class store |
| **P4** | **Read-only orchestrator** — Context Graph federation never mutates foreign SoR |
| **P5** | **Permission at every hop** — PE + visibility services before hydrate |
| **P6** | **Tags are metadata** — module-local SoR; no tag-as-edge inference |
| **P7** | **AI precedence** — memory > persisted vlink > providers > inference |
| **P8** | **Traversal caps** — depth and node budgets per [GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](../architecture/GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md) |
| **P9** | **Relationship Framework authority** — taxonomy, federation, adapters govern this program |
| **P10** | **Derived views only** — projections, bundles, indexes are invalidatable derivatives |

---

## 5. Tier 0 platform status

| Attribute | Value |
|-----------|-------|
| **Classification** | **Tier 0 Platform Capability** |
| **Layer** | Core platform — peer to Policy Engine, Domain Events, V_Link, Workspace Runtime |
| **Marketplace module** | **No** — not installable; built-in infrastructure |
| **User-facing brand** | **V_Link** remains primary UX surface for association containers |
| **Internal name** | **Context Graph** for federation, bundles, adapters, certification |
| **Ledger designation** | Pending Phase 3 certification (not yet ledgered) |

**Formal declaration:** Context Graph is hereby chartered as a **Tier 0 platform capability** subject to council ratification of this document.

---

## 6. Relationship to V_Link

| Dimension | Relationship |
|-----------|--------------|
| **Identity** | V_Link is the **association SoR** within Context Graph |
| **Containers** | `VLink` rows = optional **container nodes** in graph projection |
| **Edges** | `VLinkEntity` rows = **Association edges** (container → entity) |
| **Membership** | `VLinkMember` = container Membership class — not entity access |
| **Nesting** | `parentVLinkId` = Hierarchy among containers |
| **AI** | Pipeline source `vlink` = primary relationship grounding channel |
| **Evolution** | Add federation orchestrator **around** V_Link — no schema replacement |
| **UX** | `/vlink` hub remains; graph explorer mounts as extension |

**Rule:** No initiative may deprecate V_Link in favor of a parallel association store without architecture governance review.

---

## 7. Relationship to AI

| Dimension | Relationship |
|-----------|--------------|
| **Role** | AI is the **flagship consumer** — not the owner |
| **Grounding** | `vlinkPipelineContextService` + future bundle composer |
| **Precedence** | UserMemoryFact > persisted V_Link > module providers > inference |
| **Suggestions** | `VLinkSuggestion` requires user approval — never silent SoR write |
| **Memory boundary** | `UserMemoryFact` is **adjacent** — not a graph edge |
| **Catalog** | Admin Portal Context Sources governs enablement |
| **Trace** | Pipeline diagnostics must distinguish `vlink`, `graph_bundle`, `memory` |

AI must consume Context Graph through **authorized read paths only** — never raw cross-module Prisma.

---

## 8. Relationship to tags

| Dimension | Relationship |
|-----------|--------------|
| **Classification** | Tags are **metadata on entity nodes** — not graph entities |
| **SoR** | Module-local `tags[]` on host records |
| **Hydration** | Tags included when entity node is hydrated (Pattern A) |
| **Inference** | Tag string collision **must not** create implied edges |
| **Future** | Read-only **Tag Index** (derived) for cross-module facet search |
| **Boundary** | [TAG_RELATIONSHIP_BOUNDARY_REVIEW.md](../architecture/TAG_RELATIONSHIP_BOUNDARY_REVIEW.md) enforced |

**Rule:** Tags filter single entities; V_Link groups multiple entities for human + AI context.

---

## 9. Governance

| Role | Responsibility |
|------|----------------|
| **Platform Architecture** | Charter, federation contract, certification |
| **V_Link / platform team** | Association SoR, resolver registry |
| **Module owners** | Entity adapters, operational links, module tags |
| **AI platform** | Pipeline consumption, bundle composer |
| **Council** | Ratify 0B package; authorize Phase 1 implementation |

---

## 10. Program phases (reference)

| Phase | Status |
|-------|--------|
| 0A Discovery | ✅ Complete |
| **0B Constitutional architecture** | **This package** |
| 1A Federation read foundation | Pending council authorization |
| 1B Graph read API | Pending |
| 1C AI bundle formalization | Pending |
| 1D Resolver completion | Pending |
| 2A Tag index | Pending |
| 2B Graph visualization | Pending |
| 3 Certification | Pending |

---

## 11. Related documents

| Document | Purpose |
|----------|---------|
| [CONTEXT_GRAPH_FEDERATION_CONTRACT.md](./CONTEXT_GRAPH_FEDERATION_CONTRACT.md) | Read federation rules |
| [CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md](./CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md) | Bundle logical type |
| [CONTEXT_GRAPH_READ_API_CONTRACT.md](./CONTEXT_GRAPH_READ_API_CONTRACT.md) | Future HTTP spec |
| [CONTEXT_GRAPH_COUNCIL_PACKET.md](./CONTEXT_GRAPH_COUNCIL_PACKET.md) | Ratification packet |

**Last updated:** 2026-06-18
