# AI Retrieval — Reality Assessment

**Program:** AI Retrieval Adapter — Phase 0A Discovery  
**Date:** 2026-06-23  
**Status:** Discovery only — no implementation

**Prerequisites:** Unified Search L2 CwF (RD-US-001); AI Platform L2 Platform Compliant

---

## 1. Executive posture

| Question | Answer |
|----------|--------|
| Is there a unified AI retrieval layer? | **No** |
| Is retrieval permission-safe at module boundaries? | **Mostly yes** — visibility services on mature modules |
| Does AI use Unified Search today? | **No** — zero production calls to `executeGlobalSearch` from AI paths |
| Is a Retrieval Adapter justified? | **Yes** — convergence layer needed |
| Recommended model | **Hybrid (Option B)** — Search for discovery + providers for summaries |

**Central finding:** AI retrieval is **mature at L3 (multi-source)** but **fragmented**. The same visibility primitives power global search and AI context, yet **no shared adapter** connects them.

---

## 2. Retrieval path inventory

### 2.1 Twin request pipeline (primary)

```
Client → DigitalLifeTwinCore / DigitalLifeTwinService
  → PreferenceResolver (memory + preferences)
  → CrossModuleContextEngine.getContextForAIQuery
      → ContextProviderOrchestrator.orchestrateContextRetrieval
  → runPipelineGroundingRetrieval (second pass)
  → fetchVLinkPipelineContext / fetchGraphBundlePipelineContext
  → entityLinking + ContextSynthesisService (optional)
  → assembleAIContext (AIContextAssembler)
  → LLM provider + toolExecutor rounds
```

### 2.2 Path catalog

| # | Path | Owner | Entry | Output |
|---|------|-------|-------|--------|
| **R-01** | Context Provider Orchestrator | Platform AI | `ContextProviderOrchestrator.ts` | `moduleContexts`, audit, snapshot |
| **R-02** | Module HTTP context providers | Per module | `/api/{module}/ai/context/*` | Module-shaped JSON |
| **R-03** | Pipeline grounding retrieval | Platform AI | `pipelineGroundingRetrieval.ts` | Module patch + location + vlink + graph |
| **R-04** | Memory retrieval | Platform AI | `MemoryRetrievalService.ts` | Scored `UserMemoryFact` rows |
| **R-05** | User AI context CRUD | Platform AI | `/api/ai/context` | Pinned/session context records |
| **R-06** | V_Link pipeline context | Platform AI | `vlinkPipelineContextService.ts` | Membership-scoped V_Link hits |
| **R-07** | Graph bundle context | Context Graph | `graphBundlePipelineContextService.ts` | Federated relationship bundle |
| **R-08** | Lazy user skim | Platform AI | `lazyUserContext.ts` | Low-cost profile block |
| **R-09** | Business workspace boundary | Platform AI | `businessWorkspaceBoundaries.ts` | Policy block (not entity data) |
| **R-10** | Activity feed (twin) | Platform Kernel | `platformActivityQueryService` via engine | Recent activity rows |
| **R-11** | Drive file fetch (tools/vision) | Drive | `fetchAccessibleActiveFiles` | Attachment analysis |
| **R-12** | AI tools | Platform AI | `toolExecutor.ts` | `list_drive_files`, `search_places`, actions |
| **R-13** | Notebook grounded context | Notebook | `notebookAIContextService.ts` | Page + linked entities |
| **R-14** | Geolocation | Platform | `geolocationService` | IP → location summary |
| **R-15** | Preference resolution | Platform AI | `PreferenceResolver.ts` | Effective prefs + memory reuse |
| **R-16** | Synthetic context (optional) | Platform AI | `ContextSynthesisService.ts` | Cross-module synthesis |
| **R-17** | Entity linking | Platform AI | `entityLinking.ts` | Ephemeral cross-module links |
| **R-18** | Domain event consumer (AI) | Platform AI | `AIEventConsumer.ts` | Learning signal stubs only |
| **R-19** | Unified Search | Platform Search | `POST /api/search` | **Not wired to AI** |
| **R-20** | Orphan: `searchTasksForAI` | Todo | `todoVisibilityService` | **Defined, unused** |

---

## 3. Context provider count

**~35 registered providers** across **12 module ids** (from `registerBuiltInModules.ts` + `moduleAIContextRegistry`):

| Module | Provider count | Visibility-backed |
|--------|:--------------:|:-----------------:|
| drive | 2 | ✅ |
| chat | 2 | ✅ |
| calendar | 2 | ✅ |
| todo | 4 | ✅ |
| notes | 2 | ✅ |
| notebook | 3 | ✅ (delegates notes/todo) |
| vlink | 1 | ✅ |
| place | 5 | ✅ (partial) |
| dashboard | 3 | ⚠️ partial |
| hr | 3 | ❌ Prisma in controller |
| scheduling | 3 | ❌ Prisma in controller |
| workforce_comms | 2 | ⚠️ review |

---

## 4. Permission models by path

| Path | Orchestrator PE | Entity PE | Tenant scope |
|------|-----------------|-----------|--------------|
| Context providers | JWT internal fetch | Module visibility + dual | dashboardId, businessId |
| Grounding orchestrator | Same as R-01 | Same | Same |
| Memory retrieval | userId | fact ownership | user |
| V_Link pipeline | userId | membership + resolver | scope |
| Graph bundle | userId | adapter PE | tenant |
| Tools | userId | action-specific services | varies |
| Unified Search | `search:read` | provider PE | `filters.context` |
| HR/scheduling providers | JWT | **weak** — direct Prisma | businessId query |

---

## 5. Search vs AI today

| Capability | Global Search | AI retrieval |
|------------|:-------------:|:------------:|
| Drive files by name | `searchAccessibleDriveFiles` | `listAccessibleRecentFilesForAIContext` (recent, not query) |
| Tasks by title | `searchAccessibleTasks` | `getUpcomingTasksForAI` (list filters) |
| Calendar events | `searchEvents` | `upcoming_events` / `today_events` |
| Notes | `searchAccessiblePages` | `listRecentPagesForAi` |
| Chat messages | `searchAccessibleChat` | `recent_conversations` |
| Places | `searchListingsForUser` | `search_places` tool + `place_discoveries` provider |
| V_Link | `searchVLinksForUser` | `vlinkPipelineContextService` |

**Shared visibility services — separate orchestration.**

---

## 6. Maturity score (0–5)

| Level | Definition | Status |
|-------|------------|--------|
| 0 — Prompt Only | Raw prompt, no context | Superseded |
| 1 — Static Context | Fixed profile blocks | Partial (`lazyUserContext`) |
| 2 — Context Providers | Module HTTP providers | ✅ Met |
| 3 — Multi-Source Retrieval | Orchestrator + grounding + memory | ✅ **Current (~3.0)** |
| 4 — Unified Retrieval Layer | Adapter + Search convergence | ❌ Gap |
| 5 — Certified Retrieval Infrastructure | Governance + CI + AI-Search contract | ❌ Future |

| Dimension | Score |
|-----------|------:|
| **Overall retrieval maturity** | **3.0** |
| Provider coverage | 3.5 |
| Permission safety | 3.0 |
| Search alignment | 1.0 |
| Deduplication | 1.5 |
| Certification readiness | 1.0 |

---

## 7. Architectural risks

| ID | Risk | Tier |
|----|------|------|
| **AR-01** | AI and Search diverge on same visibility primitives | **High** |
| **AR-02** | HR/scheduling providers bypass visibility services | **High** |
| **AR-03** | No query-driven entity discovery in twin (except tools) | **High** |
| **AR-04** | Double orchestration pass (context + grounding) | **Medium** |
| **AR-05** | Dead code (`searchTasksForAI`) implies unfinished convergence | **Medium** |
| **AR-06** | Dashboard providers raw Prisma | **Medium** |
| **AR-07** | No retrieval operation matrix CI | **Medium** |

---

## 8. Phase 0A conclusion

A **Retrieval Adapter** platform capability is **justified**. It should not replace context providers; it should **unify discovery** (Search delegates) while preserving **summary providers** for structured grounding.

**Next:** [AI_RETRIEVAL_SEARCH_ALIGNMENT.md](./AI_RETRIEVAL_SEARCH_ALIGNMENT.md), [AI_RETRIEVAL_STRATEGIC_POSITIONING.md](./AI_RETRIEVAL_STRATEGIC_POSITIONING.md)

---

**Last updated:** 2026-06-23
