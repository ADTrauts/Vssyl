# AI operations (`docs/ai/`)

Runbooks and rules for **vision, providers, and multimodal** behavior in production. Product-level AI rules and module context patterns live in **`memory-bank/aiContextSystem.md`**.

**Canonical platform diagrams (May 2026):** [`docs/architecture/AI_PLATFORM_OVERVIEW.md`](../architecture/AI_PLATFORM_OVERVIEW.md)

| File | Purpose | Diagrams |
|------|---------|----------|
| **ARCHITECTURE.md** | Attachment + vision pipelines (client → GCS → provider) | ✅ Mermaid |
| **PROVIDERS.md** | `callAIProvider` multimodal routing + capabilities | ✅ Mermaid |
| **RUNBOOK.md** | Prod troubleshooting; `[VISION_PIPELINE]` checklist | ✅ Mermaid |
| **GOLDEN_RULES.md** | Non-negotiable behavior for AI / vision paths | — |

**Partner / module AI contracts:** [`docs/guides/MODULE_AI_SDK_BOUNDARIES.md`](../guides/MODULE_AI_SDK_BOUNDARIES.md) · [`docs/guides/AI_CONTEXT_PROVIDER_API.md`](../guides/AI_CONTEXT_PROVIDER_API.md)

**Platform roadmap & execution discipline:** [`docs/plans/AI_PLATFORM_MATURITY_PLAN.md`](../plans/AI_PLATFORM_MATURITY_PLAN.md) (what to build) · [`docs/plans/AI_PLATFORM_EXECUTION_PRINCIPLES.md`](../plans/AI_PLATFORM_EXECUTION_PRINCIPLES.md) (how to build — **Visible Intelligence > Hidden Intelligence**)

Long narrative architecture (diagrams, deep dives) was archived to **`docs/archive/guides-merged-2026/`** (April 2026). Prefer **`docs/architecture/AI_*.md`** for current Mermaid source.
