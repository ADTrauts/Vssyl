# Retrieval Architecture

**Program:** Indexed Knowledge & Retrieval Audit  
**Date:** 2026-07-06  
**Status:** Verified from implementation  
**Authority:** [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md)

---

## Canonical map

Vssyl does **not** use a single retrieval database. Intelligence flows through **layered, permission-gated paths** from Applications to the model.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATIONS (SoR)                                   │
│  Drive · Chat · Calendar · Todo · Notes · HR · Scheduling · Place · V_Link  │
│  Each owns entities; AI never forks entity tables for convenience            │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌──────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│ Metadata / Index │   │ Durable Knowledge     │   │ Live workspace state  │
│ (derivative)     │   │ (taught)              │   │ (per-turn fetch)      │
├──────────────────┤   ├──────────────────────┤   ├──────────────────────┤
│ Unified search   │   │ UserMemoryFact        │   │ Context providers     │
│ AIMessageRecall  │   │ UserAIContext         │   │ (35 HTTP providers)   │
│ AIConversation   │   │ BusinessAIDigitalTwin │   │ fileAnalysisService   │
│   threadSummary  │   │ AILearningEvent →     │   │ geolocation           │
│ VLinkEntity rows │   │   applied context     │   │                       │
└────────┬─────────┘   └──────────┬───────────┘   └──────────┬───────────┘
         │                        │                            │
         └────────────────────────┼────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RETRIEVAL LAYER (distributed)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ ContextProviderOrchestrator     Module provider selection + HTTP fetch         │
│ aiRetrievalCapabilityService    Unified search → evidence (flag-gated)        │
│ MemoryRetrievalService          Scored UserMemoryFact retrieval               │
│ aiMessageRecallService          Recall-intent message index                   │
│ aiConversationMemoryService     Cross-thread summaries                        │
│ vlinkPipelineContextService     Confirmed relationship containers             │
│ graphBundlePipelineContext      Ephemeral federated graph bundles             │
│ pipelineGroundingRetrieval      Intent grounding prepass (catalog sources)    │
│ knowledgeCompositionOrchestrator  Governed neighborhoods (feature-flagged)    │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE ENGINE (emergent composition)                   │
│ Govern: teach · policies · review gates · pipeline enforcement               │
│ Retrieve: paths above (no single service)                                    │
│ Assemble: AIContextAssembler                                                 │
│ Explain: buildResponseInfluence · buildPipelineTrace                           │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Digital Life Twin / Business Digital Twin                                    │
│ DigitalLifeTwinService → DigitalLifeTwinCore                                 │
│ PreferenceResolver · businessWorkspaceBoundaries                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Provider (OpenAI / Anthropic / Local)                                        │
│ system prompt + assembled context + user query                               │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    ▼
                              Answer + trace
                                    │
                                    ▼
                         Feedback (Teach Vssyl · Learning · Explain)
```

---

## Per-turn sequence (Digital Life Twin)

Verified order in `DigitalLifeTwinService` / `DigitalLifeTwinCore` / `pipelineGroundingRetrieval`:

| Step | Component | Retrieval type |
|------|-----------|----------------|
| 1 | `CrossModuleContextEngine.getContextForAIQuery` | Orchestrator → module providers |
| 2 | `PreferenceResolver` | Durable Knowledge (prefs + active context) |
| 3 | `MemoryRetrievalService.retrieve` | Durable Knowledge (facts) |
| 4 | `recallRelevantMessages` (if recall intent) | Indexed Knowledge |
| 5 | `getRecentConversationMemory` | Indexed Knowledge |
| 6 | `runPipelineGroundingRetrieval` | V_Link, graph, location, search discovery, grounding providers |
| 7 | `assembleAIContext` | Merge + rank + budget |
| 8 | Provider call | Reasoning |
| 9 | `buildResponseInfluence` | User explainability |

Reference: `docs/architecture/AI_PLATFORM_OVERVIEW.md`, `docs/ai-knowledge/deep-dive/AI_REQUEST_LIFECYCLE.md`.

---

## Context Provider Orchestrator as retrieval engine

**Verdict: Yes — for module live data.**

`ContextProviderOrchestrator.orchestrateContextRetrieval` (`server/src/ai/context/ContextProviderOrchestrator.ts`) is the **primary retrieval engine for Application SoR snapshots**:

1. **Analyze** — `ModuleAIContextService.analyzeQuery` → matched modules  
2. **Plan** — `buildProviderSelectionPlan` — required grounding sources first, then optional (max 4)  
3. **Fetch** — `fetchRegisteredProviderContext` → internal HTTP to `/api/{module}/ai/context/*`  
4. **Cache** — per-installation `contextProviderCache` with provider `cacheDuration`  
5. **Emit** — `moduleContexts` map consumed by `AIContextAssembler`

**What it is not:**

- Not a full-text search engine (see unified search)  
- Not a taught-knowledge store (see `MemoryRetrievalService`)  
- Not a file OCR/index pipeline (see `fileAnalysisService` on attach)

**Grounding variant:** `orchestratePipelineModuleSources` in `pipelineGroundingRetrieval.ts` calls the same orchestrator with `sourceFilter` for catalog sources (`drive_files`, `calendar`, `vssyl_place`).

---

## Unified search as secondary retrieval engine

`aiRetrievalCapabilityService.discover()` wraps `executeGlobalSearch` — **live federated search** across module visibility services.

- **Pathway:** `AI_RETRIEVAL_PATHWAY = 'unified_search'`  
- **Integration:** `runPipelineRetrievalDiscovery` in `pipelineGroundingRetrieval.ts`  
- **Gated by:** `AI_RETRIEVAL_DISCOVERY_ENABLED` and per-intent flags  

When enabled, search results patch `moduleContexts` via `buildRetrievalContextPatch`.

**This is query-native discovery** — complementary to intent-selected providers.

---

## V_Link role (verified)

| Role | Yes? | Evidence |
|------|------|----------|
| **Relationship metadata** | **Yes** | `VLink`, `VLinkEntity` persisted; user confirms links |
| **Context routing** | **Yes** | `vlinkEntityResolverService` hydrates attachments with access level |
| **Retrieval graph** | **Partial** | Context Graph builds **ephemeral** bundles from V_Link roots — not a stored graph DB |
| **Knowledge graph** | **No** | No persistent KG; `server/src/knowledge/` composes governed views at runtime |

**Pipeline paths:**

1. **Flat:** `fetchVLinkPipelineContext` — membership-scoped vlinks + entity refs  
2. **Graph:** `fetchGraphBundlePipelineContext` → `resolveVLinkBundlesForAi`  
3. **Inference:** `entityLinking.ts` merges confirmed vlinks + cross-module payload heuristics  

**Non-negotiable (code):** `VLinkSuggestion` rows excluded from pipeline; membership required.

---

## Permission model (cross-cutting)

Every retrieval path re-checks authorization:

| Layer | Mechanism |
|-------|-----------|
| Orchestrator fetch | JWT to module endpoints → visibility services |
| Unified search | `SEARCH_READ` + per-module read policy |
| Memory facts | `userId` + scope |
| V_Link | Membership + per-entity resolver |
| Context Graph | `permissionResolver` node omission |
| File attach | `fetchAccessibleActiveFiles` + `FILE_READ` |

AI is **not** a privilege escalation channel (Constitution P12).

---

## What is explicitly not in architecture

| Capability | Status |
|------------|--------|
| Central search index table | **Not built** (stub subscriber only) |
| File content embeddings | **Not built** |
| Vector database | **Not built** |
| Knowledge Engine microservice | **Not built** (by design — Constitution §2) |
| Platform Entity Registry runtime reads | **Not wired** |

---

## Engineer FAQ (quick answers)

| Question | Answer |
|----------|--------|
| Are uploaded files indexed? | **Metadata + filename search only** — not body |
| Are files embedded? | **No** |
| Does OCR exist? | **Yes** — on-demand in `fileAnalysisService`, not stored |
| Are Context Providers the retrieval engine? | **Yes** for module live data |
| Is V_Link a knowledge graph? | **No** — relationship SoR + federated graph **views** |
| Is additional indexing required? | **Not for core engine**; **optional** for persistent file-body search |

---

## Related documents

- [INDEXED_KNOWLEDGE_REFERENCE_AUDIT.md](./INDEXED_KNOWLEDGE_REFERENCE_AUDIT.md)  
- [APPLICATION_INTELLIGENCE_MODEL.md](./APPLICATION_INTELLIGENCE_MODEL.md)  
- [KNOWLEDGE_ENGINE_RETRIEVAL_VALIDATION.md](./KNOWLEDGE_ENGINE_RETRIEVAL_VALIDATION.md)  
- `docs/ai/retrieval/AI_RETRIEVAL_CONTEXT_SOURCE_MAP.md`  
- `docs/architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md`
