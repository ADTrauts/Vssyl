# Relationship Framework — Phase 2B Closeout

**Program:** Vssyl Relationship Framework  
**Phase:** 2B — Relationship Search Architecture  
**Status:** **Complete**  
**Date:** 2026-06-14  
**Prior phases:** 1A–1D (discovery, governance, lifecycle, doc reconciliation), 2A (tag strategy)

> **Scope:** Constitutional search architecture only. No search engine, indexes, APIs, services, vector/graph DB, or UI.

---

## Required report

| # | Topic | Section |
|---|-------|---------|
| 1 | Search architecture summary | §1 |
| 2 | Provider model summary | §2 |
| 3 | Permission model summary | §3 |
| 4 | Index strategy summary | §4 |
| 5 | Architectural risks | §5 |
| 6 | Recommended next phase | §6 |

---

## Phase 2B deliverables

| ID | Deliverable | Path | Status |
|----|-------------|------|--------|
| 2B-1 | Relationship search architecture | [RELATIONSHIP_SEARCH_ARCHITECTURE.md](../RELATIONSHIP_SEARCH_ARCHITECTURE.md) | ✅ |
| 2B-2 | Search provider model | [SEARCH_PROVIDER_MODEL.md](../SEARCH_PROVIDER_MODEL.md) | ✅ |
| 2B-3 | Tag index contract | [TAG_INDEX_CONTRACT.md](../TAG_INDEX_CONTRACT.md) | ✅ |
| 2B-4 | Search permission model | [SEARCH_PERMISSION_MODEL.md](../SEARCH_PERMISSION_MODEL.md) | ✅ |
| 2B-5 | Architecture decision record | [SEARCH_ARCHITECTURE_DECISION_RECORD.md](../SEARCH_ARCHITECTURE_DECISION_RECORD.md) | ✅ |
| 2B-6 | Phase 2B closeout | This document | ✅ |

---

## 1. Search architecture summary

### Locked model

**Federated read orchestration** — search consumers fan out to module SearchProviders and platform V_Link search; merge authorized views; **never** own relationship truth.

### Four separate concepts (must not collapse)

| Concept | Purpose |
|---------|---------|
| **Entity Search** | Openable records (files, tasks, events, notes, listings, messages) |
| **Tag Search** | Facets on module-local labels — not standalone hits |
| **Relationship Search** | Typed edges (shares, links, follows) — adapters + hydrate, or filters on entity search |
| **V_Link Search** | Association **containers** — membership-scoped metadata only |

### Ownership

| Layer | Role |
|-------|------|
| **Orchestrator** | Merge, rank, UX — no SoR |
| **SearchProvider** | Module-scoped query delegate |
| **Visibility / PE** | Authorization |
| **Module / platform SoR** | Truth |

### Federation pattern

**Pattern E — Parallel fan-out** primary; optional **Pattern D** derived indexes for acceleration only.

---

## 2. Provider model summary

### Provider types

| Type | Examples | Registry v1 |
|------|----------|-------------|
| **Entity** | drive, chat, place, todo*, calendar*, notes* | Partial — todo/calendar/notes pending global |
| **Container** | vlink | ✅ |
| **Identity** | member, dashboard | ✅ |

### Authority split (no duplication)

Each provider documents:

- **System of record** — module/platform table  
- **Search authority** — who implements query  
- **Permission authority** — visibility service / PE / vlinkPermissionService  
- **Result responsibility** — module owner accountable for wrong hits  

**Rule:** SearchProvider never writes SoR; never searches another module's entities without that module's visibility API.

---

## 3. Permission model summary

### Fail-closed defaults

| Question | Answer |
|----------|--------|
| Entities user cannot open? | **No** |
| V_Links user cannot access? | **No** |
| Relationship counts? | **Conditional** — aggregates only, no leaked titles |
| Tag facets? | **Conditional** — tenant-scoped; hydrate required; no standalone tag hits |

### AI grounding

Search / Tag Index at **precedence layer 4** — below UserMemoryFact, persisted V_Link, module AI providers. V_Link attachments require resolver — not search attachment indexing.

---

## 4. Index strategy summary

| Index | Role | Authority |
|-------|------|-----------|
| **Module SoR** | Authoritative | Module writes |
| **Entity search index** | Optional derived acceleration | Read-only |
| **Tag Index** | Facet mirror of `tags[]` | [TAG_INDEX_CONTRACT.md](../TAG_INDEX_CONTRACT.md) — non-authoritative |
| **V_Link container index** | Optional title/membership mirror | Platform derived |
| **Relationship read index** | Future per-edge-type | Phase 2C+ — not universal |

**Stub today:** `searchIndexDomainEventSubscriber` — v1 uses live SearchProviders.

Invalidation: domain events + hydrate re-check; prefer omit on doubt.

---

## 5. Architectural risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| SB-R1 | V_Link attachment text in global index | High | Container metadata only; ADR + permission model |
| SB-R2 | Tag Index becomes de facto tag SoR | High | TAG_INDEX_CONTRACT write prohibitions |
| SB-R3 | Provider bypasses visibility service | High | Certification + SEARCH_PROVIDER_MODEL |
| SB-R4 | Semantic collapse (relationship search table) | High | ADR rejects universal DB |
| SB-R5 | Global registry gaps (todo/calendar/notes) | Medium | Implementation track — not arch change |
| SB-R6 | Stale index allows unauthorized hit | High | Hydrate re-check; fail-closed |
| SB-R7 | AI uses search index above V_Link | Medium | Precedence in permission model |
| SB-R8 | Cross-module tag facet leakage | High | visibilityClass + tenant on index rows |

---

## 6. Recommended next phase

### Phase 2C — Consumer Architecture Catalog (recommended)

**Not executed.** Architecture documentation only.

Phase 2A/2B closeouts ranked **Automation Trigger Catalog** as the next consumer after search. Phase 2B completion enables a broader **2C program** with ordered tracks:

| Rank | Track | Rationale | Key deliverables (proposed) |
|------|-------|-----------|----------------------------|
| **2C-1** | **Automation Trigger Catalog** | RELATIONSHIP_EVENT_MODEL ✅; search must not be automation SoR | `RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md` |
| **2C-2** | **Relationship Read Adapter Catalog** | Completes Relationship Search story | `RELATIONSHIP_READ_ADAPTER_CATALOG.md` |
| **2C-3** | **Graph Visualization Contract** | Derived graph only — ADR aligned | `RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md` |
| **2C-4** | **Recommendation Architecture** | Depends on search + tag + events | `RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md` |

**Human gate:** Approve Phase 2C scope (single track or full 2C program).

### Engineering (separate from doc track)

Not part of Phase 2B:

- Register todo/calendar/notes global SearchProviders  
- Implement Tag Index or entity search index  
- Wire `searchIndexDomainEventSubscriber` beyond stub  
- Vector search per module  

---

## Framework index update

Search artifacts registered under **Phase 2B** in [RELATIONSHIP_FRAMEWORK_INDEX.md](../RELATIONSHIP_FRAMEWORK_INDEX.md).

---

## Success criteria

| Criterion | Met? |
|-----------|------|
| Four search concepts separated | ✅ |
| Provider authority documented per major module | ✅ |
| Tag index contract (derived, read-only) | ✅ |
| Permission fail-closed rules | ✅ |
| ADR for federation vs alternatives | ✅ |
| No implementation scope creep | ✅ |
| Phase 2C recommended | ✅ |

---

## Next step

**Human gate:** Approve Phase 2C (recommend **2C-1 Automation Trigger Catalog** first).

**Do not execute Phase 2C** until explicitly requested.

---

**Last updated:** 2026-06-14
