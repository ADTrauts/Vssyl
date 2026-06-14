# Relationship Framework — Phase 2A Closeout

**Program:** Vssyl Relationship Framework  
**Phase:** 2A — Tag Strategy  
**Status:** **Complete**  
**Date:** 2026-06-14  
**Prior phases:** 1A–1D (discovery, governance, lifecycle, doc reconciliation)

> **Scope:** Constitutional tag architecture only. No implementation, APIs, schema, UI, search engine, or automation.

---

## Required report

| # | Topic | Section |
|---|-------|---------|
| 1 | Final tag philosophy | §1 |
| 2 | Architectural risks | §2 |
| 3 | Recommended next phase | §3 |

---

## Phase 2A deliverables

| ID | Deliverable | Path | Status |
|----|-------------|------|--------|
| 2A-1 | Tag Strategy | [TAG_STRATEGY.md](../TAG_STRATEGY.md) | ✅ |
| 2A-2 | Ownership and scope matrix | [TAG_OWNERSHIP_AND_SCOPE_MATRIX.md](../TAG_OWNERSHIP_AND_SCOPE_MATRIX.md) | ✅ |
| 2A-3 | Search and discovery guidelines | [TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md](../TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md) | ✅ |
| 2A-4 | Boundary review | [TAG_RELATIONSHIP_BOUNDARY_REVIEW.md](../TAG_RELATIONSHIP_BOUNDARY_REVIEW.md) | ✅ |
| 2A-5 | Phase 2A closeout | This document | ✅ |

---

## 1. Final tag philosophy

### Locked principles

| Principle | Statement |
|-----------|-----------|
| **Tags are labels, not links** | A tag names one host entity — it does not point elsewhere |
| **Module SoR** | Tags live on module rows (`tags[]` or module junction) — no platform tag write path in v1 |
| **No access semantics** | Tags never grant read/write; PE evaluates host entity |
| **Lifecycle = host lifecycle** | Trash/restore/delete tags with entity — no independent tag row |
| **No inheritance by default** | Folder/project does not auto-propagate tags to children |
| **V_Link ≠ tags** | Cross-module grouping and AI grounding use V_Link Association class |
| **Operational links ≠ tags** | NotebookLink, TaskFileLink, shares, assigns stay separate SoR |
| **AI memory ≠ tags** | UserMemoryFact for facts; UserAIContext.tags for instruction organization only |
| **Future search = derived index** | Module writes; federated read index may mirror — not a new SoR |
| **Chat v1: no tag fields** | Conversation organization via membership + V_Link; hashtags remain content |

### Module posture summary

| Verdict | Modules |
|---------|---------|
| **Recommended** | Todo, Notes, Place (listing/community), AI (UserAIContext) |
| **Allowed not required** | Drive, Calendar, Business (catalog), HR, Scheduling (future) |
| **Forbidden v1** | Chat structured tags |

### Relationship to Relationship Framework

Tags are **taxonomy class Tag** only — documented in Phase 1B/1C lifecycle and ownership docs; Phase 2A adds tag-specific constitution without amending relationship classes.

---

## 2. Architectural risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| TS-R1 | **Semantic collapse** (tag used for share/group/AI fact) | High | Boundary review checklist + PR gate |
| TS-R2 | **Premature global tag table** | High | TAG_SEARCH guidelines — index is derived read mirror only |
| TS-R3 | **Cross-module tag equivalence inference** | High | AI precedence doc; no `tags` pipeline source |
| TS-R4 | **Chat hashtag scraping as tag SoR** | Medium | Forbidden v1; explicit contract if product reverses |
| TS-R5 | **Drive labels without strategy** | Low | Allowed but defer until File Hub product prioritizes |
| TS-R6 | **Place public tags leak private tasks** | High | Tenant + visibilityClass on future index rows |
| TS-R7 | **Tag autocomplete drives wrong UX** | Medium | Defer to Phase 2B search arch — module-scoped first |
| TS-R8 | **Duplicate tag vocab** (category vs tags[]) | Low | Todo documents coexistence; metadata vs Tag class |

---

## 3. Recommended next phase

### Phase 2B — Relationship Search Architecture (recommended)

**Not executed.** Architecture documentation only (same constraints as 2A unless scope expanded).

| Rank | Rationale |
|------|-----------|
| **#1 after 2A** | Tag Strategy defines facet rules; Search Architecture defines how federated search merges **tag facets**, **entity search**, and **relationship read paths** without unified DB |
| **Depends on** | TAG_SEARCH_AND_DISCOVERY_GUIDELINES ✅, RELATIONSHIP_READ_FEDERATION_CONTRACT ✅ |
| **Deliverables (proposed)** | `RELATIONSHIP_SEARCH_ARCHITECTURE.md`, optional `TAG_INDEX_CONTRACT.md` (read mirror spec), update FRAMEWORK_INDEX |

### Phase 2C candidates (after 2B)

| Phase | Topic | Dependency |
|-------|-------|------------|
| 2C-1 | Automation Trigger Catalog | RELATIONSHIP_EVENT_MODEL ✅ |
| 2C-2 | Graph Visualization Contract | Taxonomy + Search arch |
| 2C-3 | Recommendation Architecture | Tag + Search + Events |

### Engineering (out of scope for Phase 2 doc track)

Only after Phase 2B search doc approved:

- `notesVlinkAccessService` (relationship gap, not tag)  
- Resolver/manifest drift CI test  
- Optional Drive/Calendar `tags[]` product decision  

---

## Framework index update

Tag artifacts added under **Phase 2A** in [RELATIONSHIP_FRAMEWORK_INDEX.md](../RELATIONSHIP_FRAMEWORK_INDEX.md).

---

## Success criteria

| Criterion | Met? |
|-----------|------|
| Tag definition and anti-patterns documented | ✅ |
| Per-module allow/recommend/forbid matrix | ✅ |
| Search/AI/recommendation guidelines (no impl) | ✅ |
| Explicit boundary vs V_Link and operational links | ✅ |
| No implementation scope creep | ✅ |
| Phase 2B recommended | ✅ |

---

## Next step

**Human gate:** Approve Phase 2B (Relationship Search Architecture).

**Do not execute Phase 2B** until explicitly requested.

---

**Last updated:** 2026-06-14
