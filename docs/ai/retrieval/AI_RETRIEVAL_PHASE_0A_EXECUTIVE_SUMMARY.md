# AI Retrieval — Phase 0A Executive Summary

**Program:** AI Retrieval Adapter — Phase 0A Reality Assessment  
**Date:** 2026-06-23  
**Audience:** Product, engineering leadership, architecture council  
**Status:** **Discovery complete** — no implementation

**Prerequisites:** Unified Search L2 CwF (RD-US-001); AI Platform L2 Platform Compliant

---

## Bottom line

AI retrieval is **production-grade at multi-source orchestration (Level 3)** but **not unified**. ~35 context providers, pipeline grounding, memory, V_Link, and graph bundle paths operate **in parallel** with Unified Search — **sharing visibility services but not orchestration**. Zero production calls connect AI to `searchCapabilityService`.

**Recommended architecture:** **Option B — Hybrid** — Retrieval Adapter coordinates **Search for discovery** + **providers for summaries** + **independent memory/preferences**.

**Retrieval Adapter is justified** as the next platform capability (`ai_retrieval`).

---

## Current retrieval maturity

| Dimension | Score (0–5) |
|-----------|:-----------:|
| **Overall** | **3.0** |
| Context providers | 3.5 |
| Multi-source orchestration | 3.5 |
| Permission safety | 3.0 |
| Search alignment | **1.0** |
| Deduplication | 1.5 |
| Certification readiness | 1.0 |

| Level | Status |
|-------|--------|
| Level 3 — Multi-Source Retrieval | ✅ **Current** |
| Level 4 — Unified Retrieval Layer | ❌ Target (Phase 1) |
| Level 5 — Certified Infrastructure | ❌ Future |

---

## Existing retrieval systems

| System | Role | Maturity |
|--------|------|----------|
| `ContextProviderOrchestrator` | Module context fan-out | Production |
| `pipelineGroundingRetrieval` | Grounding second pass | Production |
| `MemoryRetrievalService` | User memory facts | Production |
| `vlinkPipelineContextService` | V_Link grounding | Production |
| `graphBundlePipelineContextService` | Relationship bundle | Production |
| `AIContextAssembler` | Prompt assembly | Production |
| `toolExecutor` | Tool-based retrieval | Production |
| `platformActivityQueryService` | Activity feed | Production |
| `searchCapabilityService` | Global discovery | **Unwired to AI** |

---

## Duplicated retrieval paths (top 5)

| Duplication | Paths | Priority |
|-------------|-------|----------|
| **Drive files** | recent provider vs search vs tool list | P0 |
| **Tasks** | list providers vs search vs orphan `searchTasksForAI` | P0 |
| **Places** | provider vs `search_places` tool vs global search | P0 |
| **Notes** | recent provider vs `searchAccessiblePages` | P1 |
| **Orchestration** | context pass + grounding pass | P1 |

---

## Search alignment opportunities

| Opportunity | Impact |
|-------------|--------|
| Adapter → `executeGlobalSearch` for query intents | Closes SC-M4; single discovery PE |
| Shared visibility delegates | Trust path unification |
| `SearchResult` → AI evidence mapper | Assembly consistency |
| Normalize `filters.context` with provider scope | Tenant parity |
| Retire `searchTasksForAI` orphan or wire to adapter | Honesty |

**Search should NOT absorb:** memory, preferences, HR rollups, storage stats, graph edges, activity.

---

## Architectural risks

| ID | Risk | Tier |
|----|------|------|
| AR-01 | AI/Search divergence on same visibility | **High** |
| AR-02 | HR/scheduling direct Prisma in AI providers | **High** |
| AR-03 | No query-driven twin discovery | **High** |
| AR-04 | Double orchestration latency | Medium |
| AR-05 | Orphan search helpers | Medium |

---

## Recommended future architecture

```
DigitalLifeTwinCore
  → aiRetrievalCapabilityService (NEW — Phase 1)
      → discover(query) → searchCapabilityService
      → summarize(intent) → ContextProviderOrchestrator
      → memory() → MemoryRetrievalService
      → normalize scope + unified audit
  → AIContextAssembler (unchanged contract)
```

**Classification:** Platform Capability `ai_retrieval` — peer to `unified_search`.

---

## Phase 1 roadmap (preview — not authorized)

| # | Package | Outcome |
|---|---------|---------|
| 0B | Capability charter + ownership model | Governance foundation |
| 1A | `aiRetrievalCapabilityService` skeleton | Service boundary |
| 1B | `discover()` → Search integration | SC-M4 closure |
| 1C | Intent router (discovery vs summary) | Hybrid model |
| 1D | `SearchResult` → context block mapper | Assembly |
| 1E | Unified retrieval audit + tests | Regression gate |
| 1F | Place path consolidation | Triple-path fix |
| 2A | HR/scheduling visibility remediation | AI-2 compliance |
| 2B | Operation matrix CI | Certification prep |
| 3+ | Tag facet, semantic charter (if approved) | Out of scope 0A |

---

## Deliverable index

| Document | Purpose |
|----------|---------|
| [AI_RETRIEVAL_REALITY_ASSESSMENT.md](./AI_RETRIEVAL_REALITY_ASSESSMENT.md) | Master inventory |
| [AI_RETRIEVAL_OPERATION_MATRIX.md](./AI_RETRIEVAL_OPERATION_MATRIX.md) | C/P/N matrix |
| [AI_RETRIEVAL_ARCHITECTURE_AUDIT.md](./AI_RETRIEVAL_ARCHITECTURE_AUDIT.md) | As-built vs constitutional |
| [AI_RETRIEVAL_CONTEXT_SOURCE_MAP.md](./AI_RETRIEVAL_CONTEXT_SOURCE_MAP.md) | Entity × source map |
| [AI_RETRIEVAL_DUPLICATION_ANALYSIS.md](./AI_RETRIEVAL_DUPLICATION_ANALYSIS.md) | Consolidation register |
| [AI_RETRIEVAL_SEARCH_ALIGNMENT.md](./AI_RETRIEVAL_SEARCH_ALIGNMENT.md) | Search role analysis |
| [AI_RETRIEVAL_STRATEGIC_POSITIONING.md](./AI_RETRIEVAL_STRATEGIC_POSITIONING.md) | Option B recommendation |

---

## Success criteria

| Criterion | Met? |
|-----------|:----:|
| How AI retrieves today | ✅ |
| What retrieval exists | ✅ |
| What is duplicated | ✅ |
| What should move to Search | ✅ |
| What stays outside Search | ✅ |
| Adapter justified | ✅ |
| Phase 1 roadmap defined | ✅ |

---

## Stop conditions honored

- No production code modified  
- No migrations  
- No retrieval adapter implementation  
- No vector/semantic/RAG work  

---

**Last updated:** 2026-06-23

---

## Phase 1A update (2026-06-23)

**Status:** Retrieval Adapter foundation **shipped**.

| Item | Change |
|------|--------|
| `aiRetrievalCapabilityService` | Internal `discover()` API |
| Search integration | Calls `executeGlobalSearch` — no duplicate search logic |
| Evidence mapping | `SearchResult` → `AIRetrievalEvidence` |
| Pilot | `planning` intent in `pipelineGroundingRetrieval` |
| Search alignment score | **1.0 → 2.5** (pilot wired; not full migration) |

See [AI_RETRIEVAL_PHASE_1A_CLOSEOUT.md](./AI_RETRIEVAL_PHASE_1A_CLOSEOUT.md).
