# AI Retrieval — Strategic Positioning

**Program:** AI Retrieval Adapter — Phase 0A  
**Date:** 2026-06-23  
**Status:** Strategic recommendation — discovery only

---

## 1. Platform capability framing

| Attribute | Value |
|-----------|-------|
| **Proposed capability id** | `ai_retrieval` |
| **Class** | Platform Capability |
| **Peer capabilities** | `unified_search`, AI Platform orchestration, Context Graph |
| **User promise** | Governed, permission-safe information discovery for AI |
| **Not** | A new LLM feature, RAG product, or search replacement |

---

## 2. Architecture options

### Option A — Search First

AI uses Unified Search as **primary** discovery; providers demoted or removed.

| Pros | Cons |
|------|------|
| Single discovery path | Loses curated summaries |
| PE parity via search:read | Poor fit for stats/overview |
| Aligns with RD-US-001 intent | Breaks grounding catalog model |

### Option B — Hybrid (recommended)

**Search for query-driven discovery** + **context providers for structured summaries** + **memory/preferences independent**.

| Pros | Cons |
|------|------|
| Matches Search Option C Hybrid | Two contracts to maintain |
| Preserves grounding catalog | Requires adapter layer |
| Minimal disruption to L3 modules | Intent routing complexity |
| Constitutional alignment (AI-5 layer 4) | Phase 1 design effort |

### Option C — Context Provider First

Keep current model; Search optional manual tool.

| Pros | Cons |
|------|------|
| No new layer | Perpetuates duplication |
| Zero migration | SC-M4 (Search cert) unclosed |
| | No query-driven discovery |

---

## 3. Formal recommendation

### **Option B — Hybrid**

**Primary discovery:** `aiRetrievalAdapter.discover()` → `searchCapabilityService.executeGlobalSearch()` with normalized tenant scope.

**Primary summaries:** Existing `ContextProviderOrchestrator` for catalog-backed grounding sources.

**Independent:** MemoryRetrievalService, PreferenceResolver, location, activity, diagnostics.

**Justification:**

1. [SEARCH_PHASE_1B_EXECUTIVE_SUMMARY.md](../../search/SEARCH_PHASE_1B_EXECUTIVE_SUMMARY.md) — AI retrieval dependency acknowledged (SC-M4).
2. [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md) — layer 5 Search hydrate with PE re-check.
3. Visibility primitives already shared — adapter is **wiring**, not new trust model.
4. Context providers remain essential for **non-query** grounding (overdue counts, storage stats).
5. Option A would force search to serve aggregation — wrong capability boundary.

---

## 4. Strategic role questions

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | Required for all certified modules? | **Indirectly** — modules must expose visibility delegates usable by Search **and** adapter |
| 2 | Required for Marketplace modules? | **Yes** — same SearchProvider + context provider contracts |
| 3 | Required for AI retrieval? | **Yes** — this program **is** the retrieval capability |
| 4 | Required for Platform Entity discovery? | **Partial** — Search finds entities; registry resolves types |
| 5 | Required for Context Graph? | **Complementary** — graph bundle for edges; Search for entity keys |

---

## 5. Capability boundaries

```
┌─────────────────────────────────────────────────────────┐
│                  ai_retrieval (target)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Discovery  │  │  Summaries   │  │  Independent   │ │
│  │  (Search)   │  │  (Providers) │  │  (Memory/etc)  │ │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘ │
│         │                │                   │          │
│         ▼                ▼                   ▼          │
│  unified_search   ContextProvider      MemoryRetrieval  │
│                   Orchestrator         PreferenceResolver│
└─────────────────────────────────────────────────────────┘
```

---

## 6. What this program is NOT

- Vector database / embedding index (Phase 3+ charter)
- Semantic search / RAG pipeline
- Replacement of DigitalLifeTwinCore
- UI search redesign
- Central index (violates Search constitution)

---

## 7. Certification path (preview)

| Phase | Outcome | Target level |
|-------|---------|--------------|
| 0A | This discovery suite | — |
| 0B | Capability charter + ownership | — |
| 1A | Retrieval adapter + Search wire | L3 retrieval |
| 1B | Governance + operation matrix CI | L2 CwF candidate |
| 2+ | AI-Search audit, tag facet, marketplace | L4 unified layer |

---

## 8. Dependencies

| Dependency | Status |
|------------|--------|
| Unified Search L2 CwF | ✅ RD-US-001 |
| AI Platform L2 | ✅ |
| Context Provider Orchestrator | ✅ production |
| Visibility services (L3 modules) | ✅ mostly |
| HR/scheduling visibility remediation | ❌ blocker for full cert |

---

**Last updated:** 2026-06-23
