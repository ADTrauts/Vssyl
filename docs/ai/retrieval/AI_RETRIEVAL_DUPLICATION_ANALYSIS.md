# AI Retrieval — Duplication Analysis

**Program:** AI Retrieval Adapter — Phase 0A  
**Date:** 2026-06-23  
**Status:** Consolidation opportunity register

---

## 1. Duplication summary

| Category | Count | Severity |
|----------|------:|----------|
| Same entity, different list vs search paths | **8** | High |
| Parallel orchestration passes | **1** | Medium |
| Duplicate provider endpoints (notebook) | **3** | Low |
| Orphan search helpers | **1** | Medium |
| Place search triple path | **1** | High |

---

## 2. Entity-level duplication

### 2.1 Drive files

| Path | Method | Query-aware? |
|------|--------|:------------:|
| AI `recent_files` provider | `listAccessibleRecentFilesForAIContext` | ❌ recency |
| AI tool `list_drive_files` | visibility list | ❌ list |
| Global Search | `searchAccessibleDriveFiles` | ✅ substring |
| Twin attachment | `fetchAccessibleActiveFiles` | id-scoped |

**Consolidation:** Query-driven discovery → **Search delegate**. Recency summaries → **keep provider**.

---

### 2.2 Tasks

| Path | Method | Query-aware? |
|------|--------|:------------:|
| AI `upcoming_tasks` / `overdue_tasks` | list filters | ❌ |
| AI `task_overview` | stats | ❌ |
| `searchTasksForAI` | `searchAccessibleTasks` | ✅ **unused** |
| Global Search | `searchAccessibleTasks` | ✅ |

**Consolidation:** Wire `searchTasksForAI` → Search adapter OR delete orphan. List providers remain for grounding summaries.

---

### 2.3 Calendar events

| Path | Method | Query-aware? |
|------|--------|:------------:|
| AI `today_events` / `upcoming_events` | time-window lists | ❌ |
| Notebook link hydrate | `searchEvents` (notebookAIActionService) | ✅ |
| Global Search | `searchEvents` | ✅ |

**Consolidation:** Query/event discovery → Search. Time-window summaries → providers.

---

### 2.4 Notes

| Path | Method | Query-aware? |
|------|--------|:------------:|
| AI `recent_notes` / `pinned_notes` | `listRecentPagesForAi` | ❌ |
| Global Search | `searchAccessiblePages` | ✅ |
| Notes module list API | `listPages` with search param | ✅ module-local |

**Consolidation:** AI query discovery → Search. Pinned/recent → providers.

---

### 2.5 Chat

| Path | Method | Query-aware? |
|------|--------|:------------:|
| AI `recent_conversations` | participant recent | ❌ |
| Global Search | `searchAccessibleChat` | ✅ message content |

**Consolidation:** Message content search → Search. Conversation summaries → provider.

---

### 2.6 Place listings

| Path | Method | Query-aware? |
|------|--------|:------------:|
| AI `place_discoveries` provider | curated discoveries | partial |
| AI tool `search_places` | `placeAIActionService.searchPlaces` | ✅ |
| Global Search | `searchListingsForUser` | ✅ |

**Consolidation:** **High priority** — three paths; tool and Search share `searchListingsForUser` delegate. **Phase 1A:** documented only; adapter `moduleId: 'place'` filter available for future tool migration.

---

## Phase 1A consolidation status

| Entity | Action in 1A | Rationale |
|--------|--------------|-----------|
| Place | **Deferred** | `search_places` tool would gain `search:read` gate if routed through adapter |
| Drive, tasks, notes, chat | **No change** | Pilot uses full Search fan-out for planning only |
| `searchTasksForAI` orphan | **No change** | Unwired; delete or wire in 1B |

**Last updated:** 2026-06-23 (Phase 1A)

---

### 2.7 V_Link

| Path | Method | Query-aware? |
|------|--------|:------------:|
| AI pipeline | `fetchVLinkPipelineContext` | signal-based |
| AI provider `recent_vlinks` | recent list | ❌ |
| Global Search | `searchVLinksForUser` | ✅ |

**Consolidation:** Pipeline for grounding signals; Search for explicit find; recent list stays provider.

---

### 2.8 Business / user context

| Path | Content |
|------|---------|
| `lazyUserContext` | profile skim |
| `PreferenceResolver` | prefs + memory |
| `businessWorkspaceBoundaries` | policy block |
| HR `hr_overview` | business stats |

**Not duplicate** — different purpose. Adapter should **not** merge.

---

## 3. Orchestration duplication

```
Pass 1: CrossModuleContextEngine → orchestrateContextRetrieval
Pass 2: pipelineGroundingRetrieval → orchestratePipelineModuleSources
```

Both call the same orchestrator with overlapping module sources (`drive`, `calendar`, `place`).

| Mitigation today | `moduleHasExistingContext` skip |
| Target | Single adapter pass with unified plan |

---

## 4. Notebook provider duplication

Notebook reuses notes/todo endpoints:

| Notebook provider | Delegates to |
|-------------------|--------------|
| `recent_pages` | `/api/notes/ai/context/recent` |
| `pinned_pages` | `/api/notes/ai/context/pinned` |
| `task_overview` | `/api/todo/ai/context/overview` |

**Intentional** — not consolidation target. Document in adapter as composition pattern.

---

## 5. Consolidation roadmap

| Priority | Action | Closes |
|----------|--------|--------|
| **P0** | Introduce `aiRetrievalAdapter.discover(query)` → Search | AR-01, AR-03 |
| **P0** | Unify place search (tool + search provider) | place triple path |
| **P1** | Remove or wire `searchTasksForAI` | orphan |
| **P1** | Merge orchestrator passes in adapter | AR-04 |
| **P2** | Normalize scope object across Search + providers | tenant drift |
| **P2** | HR/scheduling visibility extraction | AI-2 violation |

---

## 6. What NOT to consolidate

| Path | Reason |
|------|--------|
| MemoryRetrievalService | User facts — not entity discovery |
| PreferenceResolver | Runtime behavior — Category A |
| Activity feed | Temporal signal — not search |
| Graph bundle | Relationship edges — not entity search |
| Domain events | Signals only |
| Admin diagnostics | Operator plane |

---

**Last updated:** 2026-06-23
