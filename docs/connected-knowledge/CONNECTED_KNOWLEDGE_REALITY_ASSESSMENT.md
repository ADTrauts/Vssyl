# Connected Knowledge Platform — Reality Assessment

**Program:** Connected Knowledge Platform — Phase 0A  
**Date:** 2026-06-25  
**Status:** Discovery only — **no implementation**

**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md); certified capabilities in [REFERENCE_MODULE_CATALOG.md](../architecture/REFERENCE_MODULE_CATALOG.md); Relationship Framework [RELATIONSHIP_FRAMEWORK_INDEX.md](../architecture/RELATIONSHIP_FRAMEWORK_INDEX.md); Context Graph program archive.

---

## 1. Executive summary

Vssyl is an **application platform** with **partial knowledge federation**. Relationships are real, persisted, and governed — but they live in **module schemas, V_Link tables, and ephemeral AI evidence** without a single user-visible or consumer-unified knowledge layer.

The platform does **not** need a new graph database. It needs **constitutional unification** of how entities and relationships are identified, composed, provenanced, and consumed — building on certified Context Graph, V_Link, Platform Entities, Unified Search, and AI Retrieval.

**Knowledge readiness: 2.6 / 5** (see executive summary scorecard).

---

## 2. Working definitions

| Term | Definition |
|------|------------|
| **Connected Knowledge Platform** | Platform where **entities and relationships** are the primary organizational model for discovery, AI, and workspace — modules remain SoRs |
| **Entity** | Addressable object: `(moduleId, entityType, entityId)` per Platform Entity Model |
| **Relationship** | Typed directed connection between entities or principals, classed per Relationship Taxonomy |
| **Knowledge** | Persisted or user-confirmed relationships + entity state, with provenance and permission-respecting federation |
| **Evidence** | Ephemeral retrieval/search hits used for grounding — not knowledge until confirmed or module-persisted |
| **Federation** | Read-time composition from multiple SoRs without a universal entity table |

---

## 3. Platform posture (June 2026)

### 3.1 Certified foundations

| Capability | Certification | Knowledge relevance |
|------------|---------------|---------------------|
| Platform Kernel | Certified (activity + domain events) | Temporal + invalidation signals |
| Unified Search | Certified | Entity discovery; no edge SoR |
| AI Retrieval | Certified | Ephemeral relatedness evidence |
| Context Graph | **L3 CwF** | Federation orchestrator for AI bundles |
| Marketplace Partner Runtime | Certified | Partner isolation; delegate patterns documented |
| Platform Controller | Certified | Governance; adoption visibility added 2026-06-25 |
| Platform Adoption | Phase 0A complete | Read-path debt blocks knowledge trust |

### 3.2 What changed with Platform Adoption

Platform Adoption Phase 0A (2026-06-25) established that **capabilities work; module participation does not**. For Connected Knowledge, this means:

- AI may **retrieve** HR or Scheduling entities but **search and activity feeds** often omit them
- Cross-module "what happened recently" is **inconsistent** — knowledge history is fragmented
- Dashboard widgets do not participate in graph or search — **home-screen knowledge is siloed**

Connected Knowledge **depends on adoption completion** for trustworthy reads; it does not replace adoption work.

---

## 4. Component evaluation

### 4.1 V-Link

| Aspect | Assessment |
|--------|------------|
| **Current role** | Tier 0 **Association** container; cross-module attachment SoR; AI pipeline catalog source `vlink` |
| **Overlap** | Context Graph `vlinkContextGraphAdapter`; entityLinking `persistedVLinks`; search linkable entity types |
| **Duplication** | Low at storage; **high at consumption** (pipeline, graph adapter, UI hub each compose separately) |
| **Missing** | Partner resolver; NOTE/Notebook parity; USER/BUSINESS as linkable nodes; relationship confidence metadata |
| **Long-term responsibility** | **Primary cross-module association SoR** + user knowledge containers + AI suggestion governance |

**Inventory:** 5 Prisma models, 23 API routes, 20+ services, 14 domain event types, 8+ linkable entity types.

**Constitutional constraint:** Membership does not grant linked entity content access — must persist in any evolution.

### 4.2 Context Graph

| Aspect | Assessment |
|--------|------------|
| **Current role** | L3-certified **federation orchestrator** — resolves bundles from anchors via adapters |
| **Overlap** | V_Link adapter duplicates pipeline V_Link reads; retrieval bridge adds third inference path |
| **Duplication** | No edge storage duplication; **orchestration path duplication** vs twin pipeline |
| **Missing** | Full retrieval→bundle bridge; `federationDepth` diagnostics; HR/scheduling adapters |
| **Long-term responsibility** | **Canonical read federation API** for all knowledge consumers (AI first, search hints second) |

See [CONTEXT_GRAPH_PROGRAM_ARCHIVE](../context-graph/CONTEXT_GRAPH_PROGRAM_ARCHIVE.md).

### 4.3 Platform Kernel

| Aspect | Assessment |
|--------|------------|
| **Current role** | Normalized activity writes (`module_activity_event`); domain event bus |
| **Overlap** | Legacy `prisma.activity` reads; module-local audit tables (HR) |
| **Duplication** | **ACT-R1:** feed, analytics, AI context still hit legacy tables |
| **Missing** | Unified timeline read for all consumers; relationship-action normalization |
| **Long-term responsibility** | **Immutable action log** — temporal knowledge signal, not relationship SoR |

### 4.4 Unified Search

| Aspect | Assessment |
|--------|------------|
| **Current role** | Federated entity discovery across registered providers |
| **Overlap** | AI Retrieval delegates to search for query-native discovery |
| **Duplication** | Parallel ranking vs retrieval evidence — no shared provenance |
| **Missing** | BO module providers; Notebook; relationship-aware ranking |
| **Long-term responsibility** | **Discovery input layer** — find entities; optional inference hints to graph |

### 4.5 AI Retrieval

| Aspect | Assessment |
|--------|------------|
| **Current role** | Intent-scoped evidence assembly via search delegate + module providers |
| **Overlap** | Context Graph inference edges; entityLinking; V_Link pipeline |
| **Duplication** | Same entities rediscovered each turn without persistence |
| **Missing** | Consumer-wide search delegate wiring; evidence→V_Link suggestion loop |
| **Long-term responsibility** | **Ephemeral evidence producer** — feeds federation, never silent SoR |

### 4.6 Platform Entities

| Aspect | Assessment |
|--------|------------|
| **Current role** | Startup registry of `(moduleId, entityType)` descriptors for trash, search, V_Link, activity |
| **Overlap** | V_Link `VLinkEntityType` enum; manifest `entities[]` |
| **Duplication** | Three registration surfaces (registry, manifest, enum) — drift risk |
| **Missing** | Custom entity types; partner entities; relationship capability metadata per type |
| **Long-term responsibility** | **Node identity contract** — single registry key format for all graph consumers |

### 4.7 Activity System

| Aspect | Assessment |
|--------|------------|
| **Current role** | Normalized envelope on write; 18+ module activity services |
| **Overlap** | V_Link activity rows; domain events for same actions |
| **Duplication** | Activity vs domain event for some V_Link mutations — intentional fan-out |
| **Missing** | Relationship lifecycle events in feed ("linked", "unlinked", "suggested") uniformly |
| **Long-term responsibility** | **Audit and timeline** — "what happened" not "what is connected" |

### 4.8 Marketplace

| Aspect | Assessment |
|--------|------------|
| **Current role** | Partner runtime (iframe/bundle); manifest certification |
| **Overlap** | V_Link `MODULE_ENTITY` enum placeholder — unimplemented |
| **Duplication** | None operational |
| **Missing** | V_Link delegate (`hydrate`, `accessCheck`, `search`); partner entity registry |
| **Long-term responsibility** | **External SoR integration** via delegates — platform stores edges, partner validates access |

See [VLINK_PARTICIPATION_ARCHITECTURE.md](../marketplace/VLINK_PARTICIPATION_ARCHITECTURE.md).

### 4.9 AI Memory

| Aspect | Assessment |
|--------|------------|
| **Current role** | `UserMemoryFact` — user-stated or learning-applied facts; `MemoryRetrievalService` scoring |
| **Overlap** | Relationship Taxonomy "AI context" class; not graph edges |
| **Duplication** | None with V_Link — different layer |
| **Missing** | Facts linked to entity anchors; expiry governance in graph bundle |
| **Long-term responsibility** | **User semantic memory** — adjacent knowledge, not relationship SoR |

### 4.10 Notifications

| Aspect | Assessment |
|--------|------------|
| **Current role** | Delivery pipeline for module events |
| **Overlap** | None with relationship storage |
| **Duplication** | N/A |
| **Missing** | N/A for knowledge layer |
| **Long-term responsibility** | **Alerting** — consumes events, does not define knowledge |

### 4.11 Dashboard

| Aspect | Assessment |
|--------|------------|
| **Current role** | L3 CwF composition module; widget host |
| **Overlap** | Activity Feed widget vs Platform Kernel feed |
| **Duplication** | Widget-local storage (Quick Notes, Bookmarks) vs platform entities |
| **Missing** | Widget participation in search, V_Link, graph |
| **Long-term responsibility** | **Knowledge surfacing shell** — consumes federation, does not own edges |

### 4.12 Business Workspace

| Aspect | Assessment |
|--------|------------|
| **Current role** | WS-L3 shell routing to HR, Scheduling, Workforce Comms, analytics |
| **Overlap** | Each child module owns entities; no workspace-level entity graph |
| **Duplication** | Per-module navigation vs unified entity hub |
| **Missing** | Cross-BO entity neighborhood; search/retrieval adoption |
| **Long-term responsibility** | **Tenant-scoped entity landing** — route to modules or future entity hub |

---

## 5. Overlap and duplication matrix

| Pattern | Systems involved | Severity | Resolution direction |
|---------|------------------|----------|---------------------|
| V_Link context assembly | Pipeline, Graph adapter, UI resolver | **High** | Single federation read contract |
| Relatedness at AI time | Retrieval, entityLinking, V_Link, Graph | **High** | Precedence: V_Link > module FK > retrieval > inference |
| Entity registration | Registry, manifest, VLinkEntityType | **Medium** | Generated alignment checks (Platform Controller) |
| Recent activity | Kernel, legacy tables, widgets | **High** | ACT-R1 migration |
| Project/topic concept | V_Link container, Todo project, ad hoc AI | **Medium** | User-facing "hub" = V_Link; Todo project stays containment |
| Tags vs relationships | Tag index, module tags[] | **Low** | Tags remain metadata per taxonomy |

---

## 6. Missing platform capabilities (knowledge-specific)

| ID | Capability | Why it matters |
|----|------------|----------------|
| CK-01 | **Unified federation read API** | One bundle shape for AI, search, operator |
| CK-02 | **Relationship provenance model** | `manual`, `module_native`, `ai_accepted`, `inference` |
| CK-03 | **Confidence tier** | Solid vs dashed edges in all consumers |
| CK-04 | **Entity neighborhood query** | "Everything connected to X" without manual V_Link navigation |
| CK-05 | **Knowledge governance UI** | Review AI suggestions, merge duplicates, archive hubs |
| CK-06 | **Partner relationship delegate** | Marketplace entities in graph |
| CK-07 | **Custom entity type contract** | Business-defined entity types without new modules |
| CK-08 | **Causal/history layer** | Phase 2+ — activity + state change narrative |

---

## 7. Architectural risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| KR-1 | Universal relationships table proposed under deadline | **Critical** | Constitutional ban — federate SoRs |
| KR-2 | Retrieval evidence auto-persisted as V_Link | **High** | User accept workflow only |
| KR-3 | V_Link membership conflated with file access | **High** | Existing constitutional rule — audit all new paths |
| KR-4 | Graph program duplicates Context Graph | **Medium** | Connected Knowledge extends CG charter |
| KR-5 | Module-centric UX blocks entity adoption | **Medium** | Product track parallel to platform |
| KR-6 | Partner in-process resolver pressure | **High** | Delegate model only |

---

## 8. Maturity model

| Level | Name | Vssyl status |
|-------|------|--------------|
| 0 | Siloed modules | ✅ Historical |
| 1 | Shared search + AI context | ✅ |
| 2 | V_Link + Relationship Framework | ✅ |
| 3 | Context Graph federation (L3) | ✅ **Current** |
| 4 | Unified knowledge consumption | ⚠️ Partial |
| 5 | Entity-primary UX + partner knowledge | ❌ Future |

---

## 9. References

- [ENTITY_RELATIONSHIP_CATALOG.md](./ENTITY_RELATIONSHIP_CATALOG.md)
- [CONNECTED_KNOWLEDGE_ARCHITECTURE_AUDIT.md](./CONNECTED_KNOWLEDGE_ARCHITECTURE_AUDIT.md)
- [CONTEXT_GRAPH_REALITY_ASSESSMENT.md](../context-graph/CONTEXT_GRAPH_REALITY_ASSESSMENT.md)
- [PLATFORM_ADOPTION_REALITY_ASSESSMENT.md](../platform-adoption/PLATFORM_ADOPTION_REALITY_ASSESSMENT.md)
- [RELATIONSHIP_TAXONOMY.md](../architecture/RELATIONSHIP_TAXONOMY.md)
