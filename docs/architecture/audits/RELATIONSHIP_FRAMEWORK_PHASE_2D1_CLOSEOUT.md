# Relationship Framework — Phase 2D-1 Closeout

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-1 — Relationship Read Adapter Catalog  
**Status:** **Complete**  
**Date:** 2026-06-14  
**Prior phases:** 1A–1D, 2A (tags), 2B (search), 2C (automation triggers)

> **Scope:** Constitutional read adapter architecture only. No services, APIs, schemas, graph DB, or UI.

---

## Required report

| # | Topic | Section |
|---|-------|---------|
| 1 | Read model summary | §1 |
| 2 | Hydration model summary | §2 |
| 3 | Provider registry summary | §3 |
| 4 | AI retrieval alignment | §4 |
| 5 | Governance model summary | §5 |
| 6 | Unresolved risks | §6 |
| 7 | Recommended next phase | §7 |

---

## Phase 2D-1 deliverables

| ID | Deliverable | Path | Status |
|----|-------------|------|--------|
| 2D1-1 | Read adapter catalog | [RELATIONSHIP_READ_ADAPTER_CATALOG.md](../RELATIONSHIP_READ_ADAPTER_CATALOG.md) | ✅ |
| 2D1-2 | Hydration patterns | [RELATIONSHIP_HYDRATION_PATTERNS.md](../RELATIONSHIP_HYDRATION_PATTERNS.md) | ✅ |
| 2D1-3 | Provider registry model | [RELATIONSHIP_PROVIDER_REGISTRY.md](../RELATIONSHIP_PROVIDER_REGISTRY.md) | ✅ |
| 2D1-4 | AI relationship retrieval | [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../AI_RELATIONSHIP_RETRIEVAL_MODEL.md) | ✅ |
| 2D1-5 | Read adapter governance | [READ_ADAPTER_GOVERNANCE.md](../READ_ADAPTER_GOVERNANCE.md) | ✅ |
| 2D1-6 | Phase 2D-1 closeout | This document | ✅ |

---

## 1. Read model summary

### Locked architecture

**Read adapters** are module/platform **read delegates** for each taxonomy class — they query SoR through visibility gates and return bounded `RelationshipReadDTO` edges.

- **18 relationship classes** cataloged with SoR, adapter owner, payload shape, AI/search/analytics eligibility  
- **No universal relationship database** — parallel adapters per ownership matrix  
- **Read adapter ≠ SearchProvider** — search finds entities; adapters return edges + hydrate  
- **Tag class** — host metadata only, not edge graph  

### Adapter index

16+ logical adapter ids documented (`drive.visibility`, `vlink.resolver`, `notebook.links`, …) mapping to K1–K4 kinds.

---

## 2. Hydration model summary

### Patterns A–E formalized

| Pattern | Role |
|---------|------|
| **A** | Direct module read via visibility service |
| **B** | Federated search orchestrator |
| **C** | Edge list + target hydrate — **cross-module core** |
| **D** | Derived indexes — read-only, re-verify |
| **E** | Event → invalidate / re-fetch — not payload as truth |

### Pattern C rules

- Edge owner lists relationships  
- **Target module** gates hydrate  
- V_Link membership never skips target check  
- Failures: omit, placeholder, or partial panel — never leak  

---

## 3. Provider registry summary

Future **Relationship Provider Registry** declares:

- `providerId`, kind K1–K7, relationship classes, capabilities  
- Permission contract version binding to visibility services  
- Links to PLATFORM_ENTITY_MODEL for K2  
- Drift prevention vs search, AI, and entity registry  

**Status:** Model only — no runtime registry shipped in 2D-1.

---

## 4. AI retrieval alignment

### Precedence (locked)

```
UserMemoryFact → Persisted V_Link (resolver) → Module AI providers
  → Operational links (Pattern C) → Search/index hydrate → Event re-fetch signal → Inference
```

- AI never bypasses visibility  
- No raw cross-module tables  
- Tags via providers only  
- Events signal re-fetch — [AI_AUTOMATION_BOUNDARY.md](../AI_AUTOMATION_BOUNDARY.md)  

Aligns with [AI_CONTEXT_ASSEMBLY.md](../AI_CONTEXT_ASSEMBLY.md), [RELATIONSHIP_SEARCH_ARCHITECTURE.md](../RELATIONSHIP_SEARCH_ARCHITECTURE.md).

---

## 5. Governance model summary

| Element | Rule |
|---------|------|
| **Certification** | G1–G16 checklist before registry `active` |
| **Ownership** | Module owns K1–K3; platform owns K4 |
| **Deprecation** | Immutable providerId; successor required |
| **Compatibility** | Security may tighten without major version |
| **Testing** | Tenant, PE, trash, hydrate parity themes defined |
| **PR gate** | No duplicate SoR, no universal table, pattern declared |

Certification levels R0–R3 defined for migration path.

---

## 6. Unresolved risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| RA-R1 | `notes.vlinkAccess` not extracted — inline resolver | Medium | Registry planned gap; PLATFORM_ENTITY_MODEL |
| RA-R2 | Implicit adapters — no runtime registry yet | Medium | 2D-1 model; implementation track separate |
| RA-R3 | N+1 hydrate latency on large V_Links | Medium | Batch resolver — performance at implementation |
| RA-R4 | NotebookLink / TaskDependency event gaps | Low | 2C catalog gaps — optional emitters later |
| RA-R5 | K5/K1 permission drift if teams diverge | High | Governance G11 + shared contract version |
| RA-R6 | Graph viz (2D-2) tempts derived SoR | High | ADR + derived-only rule |
| RA-R7 | Third-party module read surfaces | Medium | Marketplace K1 iframe boundary |

---

## 7. Recommended next phase

**Not executed.** Architecture documentation only.

| Rank | Phase | Rationale | Proposed deliverables |
|------|-------|-----------|-------------------------|
| **2D-2 (recommended)** | **Graph Visualization Contract** | Read adapters + Pattern C/E define node/edge sources — viz must stay derived | `RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md` |
| 2D-3 | Recommendation Architecture | Consumes search + adapters + events — not SoR | `RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md` |
| 2D-4 | Relationship Analytics Model | Formalizes C0 analytics over adapters/events | `RELATIONSHIP_ANALYTICS_MODEL.md` |

**Recommendation:** **2D-2 Graph Visualization Contract** — completes consumer architecture trilogy (search, automation, read, viz) without graph DB as SoR.

### Engineering (separate track)

- Runtime Relationship Provider Registry  
- `notesVlinkAccessService` extraction  
- Batch hydrate APIs  
- todo/calendar/notes global SearchProviders  

---

## Framework index update

Read adapter artifacts registered under **Phase 2D-1** in [RELATIONSHIP_FRAMEWORK_INDEX.md](../RELATIONSHIP_FRAMEWORK_INDEX.md).

---

## Success criteria

| Criterion | Met? |
|-----------|------|
| All 18 taxonomy classes in catalog | ✅ |
| Patterns A–E with permission/failure behavior | ✅ |
| Registry model preventing drift | ✅ |
| AI retrieval aligned with 2B/2C | ✅ |
| Governance certification defined | ✅ |
| No graph DB / universal store | ✅ |
| Phase 2D-2 recommended | ✅ |

---

## Next step

**Human gate:** Approve Phase 2D-2 (Graph Visualization Contract).

**Do not execute Phase 2D-2** until explicitly requested.

---

**Last updated:** 2026-06-14
