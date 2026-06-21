# Context Graph — Modernization Roadmap

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0A — Discovery  
**Date:** 2026-06-18  
**Status:** Planning artifact — no implementation authorized in 0A

---

## Program thesis

Evolve **V_Link** into the **Vssyl Context Graph and Knowledge Layer** through phased federation architecture — preserving module SoR ownership and Relationship Framework constitutional rules.

**Implementation authorization:** Begins after Phase 0B council review.

---

## Phase summary

| Phase | Name | Type | Duration est. |
|-------|------|------|---------------|
| **0A** | Discovery + reality assessment | Docs only | ✅ Complete |
| **0B** | Constitutional architecture | Docs only | 2–3 weeks |
| **1A** | Federation read foundation | Engineering | 4–6 weeks |
| **1B** | Graph projection API | Engineering | 3–4 weeks |
| **1C** | AI context bundle formalization | Engineering | 2–3 weeks |
| **1D** | Resolver completion + NOTE service | Engineering | 2 weeks |
| **2A** | Tag index (read mirror) | Engineering | 3–4 weeks |
| **2B** | Graph visualization surface | Engineering + UX | 4–6 weeks |
| **3** | Certification readiness | Governance | 2 weeks |

---

## Phase 0A — Complete ✅

**Deliverables:**

- [CONTEXT_GRAPH_REALITY_ASSESSMENT.md](./CONTEXT_GRAPH_REALITY_ASSESSMENT.md)
- [CONTEXT_GRAPH_CURRENT_STATE_INVENTORY.md](./CONTEXT_GRAPH_CURRENT_STATE_INVENTORY.md)
- [CONTEXT_GRAPH_PLATFORM_ARCHITECTURE.md](./CONTEXT_GRAPH_PLATFORM_ARCHITECTURE.md)
- [CONTEXT_GRAPH_OWNERSHIP_MODEL.md](./CONTEXT_GRAPH_OWNERSHIP_MODEL.md)
- [CONTEXT_GRAPH_ENTITY_RELATIONSHIP_MODEL.md](./CONTEXT_GRAPH_ENTITY_RELATIONSHIP_MODEL.md)
- [CONTEXT_GRAPH_AI_INTEGRATION_ANALYSIS.md](./CONTEXT_GRAPH_AI_INTEGRATION_ANALYSIS.md)
- [CONTEXT_GRAPH_SECURITY_AND_PERMISSION_MODEL.md](./CONTEXT_GRAPH_SECURITY_AND_PERMISSION_MODEL.md)
- [CONTEXT_GRAPH_REFERENCE_COMPARISON.md](./CONTEXT_GRAPH_REFERENCE_COMPARISON.md)
- [CONTEXT_GRAPH_MODERNIZATION_ROADMAP.md](./CONTEXT_GRAPH_MODERNIZATION_ROADMAP.md)
- [CONTEXT_GRAPH_EXECUTIVE_SUMMARY.md](./CONTEXT_GRAPH_EXECUTIVE_SUMMARY.md)

---

## Phase 0B — Recommended scope (next)

**Type:** Constitutional architecture only — no runtime code, no schema, no APIs.

### Deliverables

| # | Artifact | Purpose |
|---|----------|---------|
| 1 | `CONTEXT_GRAPH_CONSTITUTIONAL_CHARTER.md` | Program authority, non-negotiables |
| 2 | `CONTEXT_GRAPH_FEDERATION_CONTRACT.md` | Orchestrator read contract (extends Relationship Framework) |
| 3 | `CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md` | Logical context bundle type |
| 4 | `CONTEXT_GRAPH_READ_API_CONTRACT.md` | Graph projection HTTP contract (spec only) |
| 5 | `CONTEXT_GRAPH_ADAPTER_INVENTORY.md` | Module adapter completion matrix |
| 6 | `CONTEXT_GRAPH_OPERATION_MATRIX.md` | Platform operations catalog |
| 7 | `CONTEXT_GRAPH_FINDINGS_REGISTER.md` | Open gaps from 0A |
| 8 | `CONTEXT_GRAPH_CERTIFICATION_FRAMEWORK.md` | G1–G9 gate definitions |
| 9 | `CONTEXT_GRAPH_EXECUTIVE_SUMMARY_0B.md` | Council review packet |

### 0B decisions required

1. Ratify **Conceptual Option C** (federated nodes/edges)
2. Ratify **Tag Option B** (metadata on nodes)
3. Ratify **Platform capability B+D** classification
4. Approve graph read API contract (spec)
5. Prioritize NOTE resolver vs graph API vs tag index

### 0B explicit exclusions

- Prisma models
- Migrations
- Services
- Routes
- UI
- AI memory implementation

---

## Phase 1A — Federation read foundation

| Work item | Description |
|-----------|-------------|
| `contextGraphOrchestratorService` | Read-only federation composer |
| Adapter registry | Wire existing `*VlinkAccessService` + notebook adapter |
| PE checkpoint | Unified visibility gate per hop |
| Domain event consumer | Cache invalidation stub (optional) |
| Integration tests | Multi-module hydrate scenarios |

**Migration complexity:** **Low** — new service reads existing SoRs.

---

## Phase 1B — Graph projection API

| Work item | Description |
|-----------|-------------|
| `GET /api/context-graph/projection` | Anchor + depth + caps |
| `GraphNode` / `GraphEdge` DTOs | Per traversal model |
| Admin diagnostic endpoint | Depth-restricted |
| Rate limits | Per GRAPH_TRAVERSAL performance limits |

**Migration complexity:** **Low** — additive API.

---

## Phase 1C — AI context bundle formalization

| Work item | Description |
|-----------|-------------|
| `ContextBundleDescriptor` type | Logical bundle contract |
| Pipeline `graph_bundle` source | Optional catalog entry |
| Bundle composer | Layers 1–4 assembly |
| Trace extensions | Bundle metadata in diagnostics |

**Migration complexity:** **Low** — extends existing pipeline.

---

## Phase 1D — Resolver completion

| Work item | Description |
|-----------|-------------|
| `notesVlinkAccessService` | Replace inline NOTE resolver |
| NOTE lifecycle unlink | Trash integration |
| CHAT_THREAD decision | Register or remove enum |
| Manifest alignment | Notes `vlink` capability declaration |
| PLATFORM_ENTITY_MODEL sync | Update truth table |

**Migration complexity:** **Low** — module-scoped remediation.

---

## Phase 2A — Tag index (read mirror)

| Work item | Description |
|-----------|-------------|
| Tag index schema | Derived read table or search index |
| Domain event ingestion | Module tag change signals |
| Facet API | Cross-module tag search |
| Governance | TAG_STRATEGY compliance |

**Migration complexity:** **Moderate** — new derived store; not SoR.

---

## Phase 2B — Graph visualization

| Work item | Description |
|-----------|-------------|
| V_Link hub graph view | 1-hop attachment visualization |
| Entity detail neighborhood | Module surfaces |
| Federated explorer | 2-hop capped (future) |

**Migration complexity:** **Low** — UI over Phase 1B API.

---

## Migration complexity estimate (overall)

| Area | Complexity | Rationale |
|------|------------|-----------|
| V_Link schema changes | **None required** | Federation uses existing tables |
| Module SoR changes | **Low** | Adapter additions only |
| AI pipeline | **Low** | Extend catalog + bundle composer |
| Tag layer | **Moderate** | New derived index |
| NotebookLink integration | **Low** | Adapter registration |
| Org chart / approval adapters | **Low** | Read-only business adapters |
| User-facing V_Link UX | **Low** | Incremental enhancement |
| Data migration | **None** | No SoR consolidation |

**Overall: Low–Moderate** — architecture is evolutionary, not rip-and-replace.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Semantic collapse (tag = vlink) | High | TAG_RELATIONSHIP_BOUNDARY_REVIEW enforcement |
| Permission leak in traversal | High | PE at every hop; depth caps |
| Universal table pressure | High | Constitutional charter non-negotiable |
| Scope creep into graph DB | Medium | Federation ADR locked |
| NOTE resolver debt | Medium | Phase 1D prioritized |
| Parallel association confusion | Medium | Adapter catalog + UX copy |
| AI inference as SoR | Medium | Precedence rules + trace |
| Realtime expectations | Low | Document pull model v1 |

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Relationship Framework Phase 2D docs | ✅ Available |
| V_Link production | ✅ Shipped |
| Admin Portal L3 | ✅ Certified |
| Business Administration L3 | ✅ Certified |
| AI Pipeline context sources | ✅ Production |
| Tag Strategy Phase 2A | ✅ Documented |

**No blockers for Phase 0B.**

---

## Stop conditions

| Condition | Action |
|-----------|--------|
| Phase 0A | Stop after docs — **now** |
| Phase 0B | Stop after constitutional package — no code |
| Council rejects federation model | Revisit Option analysis |
| Universal table proposed | Escalate to architecture governance |

---

## Recommended immediate next step

**Authorize Phase 0B** — constitutional architecture package and council review. Do not begin runtime implementation until 0B ratified.

---

**Last updated:** 2026-06-18
