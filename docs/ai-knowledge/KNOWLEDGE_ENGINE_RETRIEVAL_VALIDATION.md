# Knowledge Engine Retrieval Validation

**Program:** Indexed Knowledge & Retrieval Audit  
**Date:** 2026-07-06  
**Status:** Constitutional alignment verified  
**Authority:** [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md)

---

## Primary question

> When users upload files, create projects, schedule meetings, chat, link entities, or create business data — does Vssyl already build sufficient indexes and retrieval structures to support AI reasoning?

### Answer

**Yes**, under the constitutional architecture Vssyl already chose:

- **Applications** persist entity truth.  
- **Federated retrieval** (context providers + unified search + relationship stores + small AI indexes) supplies discovery.  
- **Context assembly** composes a bounded per-turn view.  
- **No** monolithic knowledge database is required or present.

**Additional indexing** is warranted only for **identified product gaps** — not for a new “Knowledge Engine service.”

---

## Recommendation

### **Architecture complete** (for organizational intelligence as constitutionally defined)

The distributed retrieval stack is **production-real** and **sufficient** for:

- Live module intelligence (35 providers)  
- Taught personal knowledge (Teach Vssyl / `UserMemoryFact`)  
- Relationship intelligence (V_Link + Context Graph)  
- Query-native discovery (unified search → AI, when flags enabled)  
- Experiential continuity (thread summaries, recall index)  
- Permission-scoped federation  

### **One additional retrieval layer recommended** (scoped, optional)

**Only if** product requires cross-session **file-body** and **deep document** discovery without attaching files each chat:

| Proposed layer | Scope | Not a replacement for |
|----------------|-------|------------------------|
| **Persistent file-content index** (extracted text + optional embeddings) | Drive SoR extension or sidecar index | Context Provider Orchestrator |
| **Federated search v2** (`searchIndexDomainEventSubscriber` — currently stub) | Async index from domain events | Live module providers |

This is a **Drive/search product investment**, not a Knowledge Engine rewrite.

**Do not build:** unified AI database, knowledge graph product, or new memory microservice (Constitution P2, A8).

---

## Constitution validation

### “The Knowledge Engine owns knowledge” — **incorrect**

| Claim | Verdict | Evidence |
|-------|---------|----------|
| Engine owns business data | **False** | Providers read module tables; no shadow SoR |
| Engine owns taught facts | **Partially misleading** | Facts live in `UserMemoryFact` — **user-governed store**, not “engine-owned” |
| Engine owns retrieval | **True** | Orchestrator, grounding, assembly, policies |
| Engine owns governance | **True** | Teach, review, pipeline enforcement |

### Correct statement (validated)

> **The Knowledge Engine owns retrieval orchestration, context assembly, governance, and explainability while Applications remain Systems of Record.**

Aligns with Constitution Article II §1, §2, §10, §11 and [AI_KNOWLEDGE_ENGINE_SPEC.md](./AI_KNOWLEDGE_ENGINE_SPEC.md) §2–3.

---

## Is Context Provider Orchestrator the retrieval engine?

### **Yes — for Application live context**

| Capability | Orchestrator | Other owner |
|------------|--------------|-------------|
| Module snapshot fetch | **Primary** | — |
| Provider selection / budget | **Primary** | Pipeline catalog intents |
| Taught fact retrieval | No | `MemoryRetrievalService` |
| Message recall | No | `aiMessageRecallService` |
| Cross-module search | No | `aiRetrievalCapabilityService` |
| File OCR / attach | No | `fileAnalysisService` in twin core |
| V_Link relationships | No | `vlinkPipelineContextService` + graph |
| Business policy | No | `businessWorkspaceBoundaries` |

The orchestrator is **one retrieval engine among several**, coordinated by `DigitalLifeTwinService` and `pipelineGroundingRetrieval` — consistent with “emergent engine” (P2).

### How it works (implementation trace)

```
User query
  → CrossModuleContextEngine.getContextForAIQuery
  → orchestrateContextRetrieval (if AI_CONTEXT_ORCHESTRATOR_ENABLED !== 'false')
      → analyzeQuery (keyword/module match)
      → buildProviderSelectionPlan (required + optional providers)
      → fetchRegisteredProviderContext → ModuleAIContextService.fetchModuleContext
      → moduleContexts{}
  → DigitalLifeTwinCore + pipelineGroundingRetrieval (additional sources)
  → assembleAIContext(moduleContexts, userMemoryFacts, …)
  → Provider
```

**Files:** `ContextProviderOrchestrator.ts`, `CrossModuleContextEngine.ts`, `AIContextAssembler.ts`.

---

## Missing capabilities (verified)

| Capability | Impact | Priority |
|------------|--------|----------|
| File body search / stored OCR | Users cannot ask AI about PDF content without attach | High (product-dependent) |
| AI retrieval discovery flags off by default in some envs | Search patch may not run | Medium — ops/config |
| Notes provider without body | Skim path misses note content | Medium |
| Search index event subscriber stub | No async centralized index | Low until v2 planned |
| Platform Entity Registry unused | No runtime effect | Low |
| `searchTasksForAI` orphan | Dead code | Low |

---

## Redundant systems (not bugs — layered design)

| Overlap | Resolution |
|---------|------------|
| Orchestrator + unified search | Intent-selected skim vs query-native discovery |
| V_Link flat + graph bundle | Simple grounding vs bounded multi-hop |
| `entityLinking` inference + V_Link | Ephemeral hints vs confirmed links |
| Memory service + UserAIContext | Different knowledge types (facts vs prefs) — product unification only |

---

## Evaluated against success criteria

| Criterion | Status |
|-----------|--------|
| How Drive contributes | Providers + attach analysis + filename search — [APPLICATION_INTELLIGENCE_MODEL.md](./APPLICATION_INTELLIGENCE_MODEL.md) |
| How Calendar contributes | Live event providers + grounding |
| How Chat contributes | Module providers + search; separate from twin recall |
| Uploaded files indexed | **Filename only**; body **not** indexed |
| Files embedded | **No** |
| OCR exists | **Yes**, on-demand, not stored |
| Context Providers = retrieval engine | **Yes** for module live data |
| V_Link = graph? | **Relationship metadata** + ephemeral retrieval graph — **not** knowledge graph |
| Additional indexing required? | **Optional** file-content layer only |
| Applications remain SoR | **Verified** in code paths |

---

## Decision record

| Date | Decision |
|------|----------|
| 2026-07-06 | Indexed Knowledge audit complete — **no implementation** |
| 2026-07-06 | Constitutional framing affirmed: Engine = retrieve + assemble + govern; Apps = SoR |
| 2026-07-06 | Retrieval architecture **complete** for current phase; **file-content index** optional future layer |

---

## Related documents

- [INDEXED_KNOWLEDGE_REFERENCE_AUDIT.md](./INDEXED_KNOWLEDGE_REFERENCE_AUDIT.md)  
- [RETRIEVAL_ARCHITECTURE.md](./RETRIEVAL_ARCHITECTURE.md)  
- [APPLICATION_INTELLIGENCE_MODEL.md](./APPLICATION_INTELLIGENCE_MODEL.md)  
- [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md)  
- [deep-dive/AI_SYSTEM_DEEP_DIVE_EXECUTIVE_SUMMARY.md](./deep-dive/AI_SYSTEM_DEEP_DIVE_EXECUTIVE_SUMMARY.md)
