# AI operations (`docs/ai/`)

Runbooks and rules for **vision, providers, and multimodal** behavior in production.

**Start here (Phase 0):** [`docs/architecture/AI_READING_GUIDE.md`](../architecture/AI_READING_GUIDE.md) · [`AI_SYSTEM_MENTAL_MODEL.md`](../architecture/AI_SYSTEM_MENTAL_MODEL.md)  
**Architecture navigation:** [`docs/architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md`](../architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md)  
**Whole-system analysis:** [`docs/ai-system-audit/README.md`](../ai-system-audit/README.md)  
**AI platform constitution:** [`docs/architecture/AI_PLATFORM_CONSTITUTION.md`](../architecture/AI_PLATFORM_CONSTITUTION.md)  
**Product-level AI philosophy:** [`memory-bank/aiProductPhilosophy.md`](../../memory-bank/aiProductPhilosophy.md)  
**Providers / assembly:** [`docs/guides/AI_CONTEXT_PROVIDER_API.md`](../guides/AI_CONTEXT_PROVIDER_API.md), [`docs/architecture/AI_CONTEXT_ASSEMBLY.md`](../architecture/AI_CONTEXT_ASSEMBLY.md)  
**Architecture entry:** [`docs/architecture/AI_READING_GUIDE.md`](../architecture/AI_READING_GUIDE.md)  
**AI retrieval:** [`retrieval/`](./retrieval/) — [`AI_RETRIEVAL_CONSTITUTION.md`](./retrieval/AI_RETRIEVAL_CONSTITUTION.md)

**Canonical platform diagrams:** [`docs/architecture/AI_PLATFORM_OVERVIEW.md`](../architecture/AI_PLATFORM_OVERVIEW.md)

**Internal architecture textbook:** [`docs/architecture/AI_SYSTEM_TEXTBOOK.md`](../architecture/AI_SYSTEM_TEXTBOOK.md)

| File | Purpose | Diagrams |
|------|---------|----------|
| **ARCHITECTURE.md** | Attachment + vision pipelines (client → GCS → provider) | ✅ Mermaid |
| **PROVIDERS.md** | Twin `callAIProvider` multimodal routing + capabilities | ✅ Mermaid |
| **RUNBOOK.md** | Prod troubleshooting; `[VISION_PIPELINE]` checklist | ✅ Mermaid |
| **GOLDEN_RULES.md** | Non-negotiable behavior for AI / vision paths | — |

**Partner / module AI contracts:** [`docs/guides/MODULE_AI_SDK_BOUNDARIES.md`](../guides/MODULE_AI_SDK_BOUNDARIES.md) · [`docs/guides/AI_CONTEXT_PROVIDER_API.md`](../guides/AI_CONTEXT_PROVIDER_API.md)

**Platform roadmap & execution discipline:** [`docs/plans/AI_PLATFORM_MATURITY_PLAN.md`](../plans/AI_PLATFORM_MATURITY_PLAN.md) (what to build) · [`docs/plans/AI_PLATFORM_EXECUTION_PRINCIPLES.md`](../plans/AI_PLATFORM_EXECUTION_PRINCIPLES.md) (how to build — **Visible Intelligence > Hidden Intelligence**)

Long narrative architecture (diagrams, deep dives) was archived to **`docs/archive/guides-merged-2026/`** (April 2026). Prefer **`docs/architecture/AI_*.md`** for current Mermaid source. Prefer **`docs/ai-system-audit/`** for whole-system analysis.
