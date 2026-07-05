# AI Knowledge Reference Program — Executive Summary

**Program:** AI Knowledge Reference Program  
**Phase:** 0A — Knowledge Architecture Discovery  
**Date:** 2026-07-05  
**Status:** Discovery complete — no implementation in this phase

---

## The question

> **If a user wants to teach Vssyl something… what should they do?**

### Answer today (fragmented but functional)

| Audience | Canonical action | Where |
|----------|------------------|-------|
| **End user (personal)** | Teach in **Memory** or say **"remember that…"** in chat | `/ai?tab=memory`, `/ai-chat` |
| **End user (review inferred)** | Approve/dismiss in **Learning** | `/ai?tab=learning` |
| **Business admin** | Configure business twin + learning | `/business/[id]/ai` |
| **Platform operator** | Inspect traces and policies | `/admin-portal/ai-pipeline` |

### Answer we should ship (product clarity — not yet unified)

**One verb: Teach.** One place to see what Vssyl knows: **What I taught Vssyl.**  
Behind that single UX, existing stores remain (`UserMemoryFact`, `UserAIContext`, `AILearningEvent`, module data, pipeline policies).

---

## Can Vssyl answer "the AI got this wrong"?

| Question | Today | After recommended Phase 1 UX |
|----------|-------|---------------------------|
| Where should that knowledge live? | **Partial** — operator knows; user sees Memory/Learning split | **Yes** — correction router picks store by type |
| Who owns it? | **Partial** — scoped in DB; not surfaced in UI | **Yes** — owner badge (You / Business / Vssyl inferred) |
| How is it edited? | **Yes** — Memory CRUD, Learning review | **Yes** — unified edit from correction flow |
| How does it influence future responses? | **No** for users — no explainability | **Partial** — "Used in your last answer" summary |

Users still should **not** need to understand prompts, embeddings, RAG, or memories as technical concepts.

---

## AI Pipeline: single page or dedicated section?

**Verdict: Already evolved — formalize, do not replace.**

The AI Pipeline is **not** a single overloaded page today. It is:

- **Hub:** `/admin-portal/ai-pipeline` (health, activity, tool cards, provider governance)
- **10 subpages:** diagnostics, test-lab, intents, grounding, sources, tools, quality, audit, compliance

**Recommendation:** Evolve the Operations Platform sidebar from one link ("AI Pipeline") into a structured **AI** section:

```
AI (section)
├── Overview          ← current hub (keep)
├── Diagnostics       ← already separate nav item
├── Pipeline Config   ← intents, grounding, sources, tools (group label)
├── Quality & Audit   ← quality, audit, compliance (group label)
└── Providers         ← provider governance (already in nav)
```

Do **not** split further for page size. Split only where operator mental model already exists (Observe / Configure / Govern — already in `PipelineHubToolSections.tsx`).

Do **not** add Knowledge Explorer or Memory admin as new subsystems — surface **read-only aggregates** from existing APIs in Phase 1B+.

---

## Current AI knowledge maturity

| Dimension | Score | Notes |
|-----------|------:|-------|
| **Underlying architecture** | **~88%** | Twin pipeline, providers, memory layers, pipeline policies — production-grade |
| **Knowledge product clarity** | **~48%** | Many names (Memory, Context, Facts, Learning); no single "Teach" |
| **User teach/correct UX** | **~52%** | Memory + "remember that" work; no in-chat correction router |
| **Governance & explainability** | **~40%** | Consent gates exist; users cannot see why AI answered |
| **Operator knowledge inspection** | **~58%** | Diagnostics strong; no unified "knowledge health" view |
| **Taxonomy as product concept** | **~35%** | Categories in schema; not first-class in UI |
| **Overall knowledge architecture (product)** | **~54%** | Architecture correct; organization and clarity lag |

**Phase 0A program completion:** **100%** (discovery docs)  
**Full AI Knowledge Reference Program (implementation):** **~15%** (discovery only)

---

## Knowledge inventory (summary)

**40+ influence points** across four layers:

1. **Persistent stores** — `UserAIContext`, `UserMemoryFact`, `AILearningEvent`, `GlobalLearningEvent`, `BusinessAIDigitalTwin`, `BusinessAILearningEvent`, `ModuleAIContextRegistry`, `AIPipeline*Policy`, `AIMessageRecallIndex`, `AIConversation`/`AIMessage`, `AIConversationHistory`, V_Link graph, Drive files
2. **Runtime assembly** — `DigitalLifeTwinService`, `DigitalLifeTwinCore`, `AIContextAssembler`, `PreferenceResolver`
3. **Live module providers** — 11+ built-in modules (`/api/{module}/ai/context/*`)
4. **Operator control plane** — AI Pipeline hub + subpages

Full per-source matrix: [AI_KNOWLEDGE_REFERENCE_ASSESSMENT.md](./AI_KNOWLEDGE_REFERENCE_ASSESSMENT.md)

---

## Major overlaps

| Overlap | Risk |
|---------|------|
| **UserAIContext + UserMemoryFact + AILearningEvent** | Same fact in three shapes; different consent gates |
| **AIConversation vs AIConversationHistory** | UI chat vs analytics/diagnostics history |
| **Recall index + memory facts + thread summaries** | Three answers to "what did we discuss?" |
| **Module registry vs pipeline source policies vs orchestrator** | Catalog drift — source "wired" but not fetched |
| **V_Link + graph bundles + module providers + search** | Relationship queries hit multiple paths |
| **Business.aiSettings JSON vs BusinessAIDigitalTwin** | Duplicate business config stores |
| **Personality + UserAIContext preference + UserPreference + session overrides** | User cannot see which layer "won" |

---

## Missing concepts (product, not architecture)

| Concept | Status |
|---------|--------|
| Single **Teach** verb for users | Missing |
| **Knowledge type** surfaced in UI (fact vs preference vs policy) | Schema partial; UI absent |
| **Correction router** from bad AI answer | Missing |
| **Explainability** ("what influenced this answer") | Operator-only via diagnostics |
| **Stale knowledge** detection for users | Missing |
| **Unified knowledge read view** (personal) | Partial (`AIMemoriesView` — not complete) |
| **Operator knowledge health** (cross-tenant patterns) | Missing as labeled surface |

---

## Recommended implementation order

| Phase | Focus | Builds on | Est. effort |
|-------|-------|-----------|-------------|
| **0A** | Discovery docs (this program) | — | ✅ Done |
| **0B** | Product language + information architecture spec | 0A taxonomy | 1 week |
| **1A** | **Teach** UX consolidation in `/ai` (rename, merge views, no new stores) | `AIMemoriesView`, `UserAIContext`, `UserMemoryFact` | 2 weeks |
| **1B** | In-chat **Improve answer** → correction router (design in [AI_CORRECTION_WORKFLOW.md](./AI_CORRECTION_WORKFLOW.md)) | Learning events, memory APIs | 2–3 weeks |
| **2A** | Operator **AI section** nav formalization (labels only) | Existing pipeline pages | 3–5 days |
| **2B** | **Knowledge Health** read-only panel (diagnostics + provider health aggregate) | Pipeline APIs | 1–2 weeks |
| **3A** | User **explainability** summary (non-technical) | `AIPipelineDiagnostic.traceJson` patterns | 2 weeks |
| **3B** | Stale knowledge surfacing | `expiresAt`, `updatedAt`, learning review | 1–2 weeks |
| **4** | Business knowledge parity (unified teach for business admin) | `BusinessAIControlCenter` | 2 weeks |

**Do not** in early phases: new embedding stores, replace memories, replace context providers, redesign twin architecture.

---

## Success criteria (Phase 0A)

| Criterion | Met |
|-----------|:---:|
| Inventory every AI knowledge source | ✅ |
| Per-source purpose, owner, scope, overlap | ✅ |
| AI Pipeline audited | ✅ |
| Taxonomy proposed | ✅ |
| Governance model drafted | ✅ |
| Correction workflow designed (not built) | ✅ |
| Operator vs user audience mapped | ✅ |
| Pipeline single-page vs section recommendation | ✅ |
| Preserve architecture constraint honored | ✅ |

---

**Next step:** Phase 0B — product language and IA spec, then Phase 1A Teach UX consolidation.
