# Architecture reference (`docs/architecture/`)

Cross-cutting platform design notes. **Agent enforcement** lives in `.cursor/rules/` (short); this folder explains **why**, examples, anti-patterns, and review checklists.

Complement (not replace) `memory-bank/systemPatterns.md` for product-level architecture narrative.

| Topic | Document | Cursor rule |
|-------|----------|-------------|
| Policy Engine (v1) | [POLICY_ENGINE.md](./POLICY_ENGINE.md) | `policy-engine.mdc` |
| Domain event bus | [DOMAIN_EVENTS.md](./DOMAIN_EVENTS.md) | `domain-events.mdc` |
| Workspace runtime + module contracts | [WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](./WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md) | `workspace-runtime.mdc`, `runtime-state-boundaries.mdc` |
| **AI platform overview (diagram hub)** | [AI_PLATFORM_OVERVIEW.md](./AI_PLATFORM_OVERVIEW.md) | — |
| Digital Life Twin prompt path | [AI_TWIN_PROMPT_PIPELINE.md](./AI_TWIN_PROMPT_PIPELINE.md) | — |
| AI context assembly | [AI_CONTEXT_ASSEMBLY.md](./AI_CONTEXT_ASSEMBLY.md) | — |
| Business vs personal twin boundaries | [AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md](./AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md) | — |
| Admin AI Pipeline (grounding diagnostics) | [AI_PIPELINE_ADMIN_TOOLS.md](./AI_PIPELINE_ADMIN_TOOLS.md) | `module-interoperability.mdc` (activity vs analytics) |
| Attachments & vision pipelines | [../ai/ARCHITECTURE.md](../ai/ARCHITECTURE.md) | — |
| Vision provider routing / runbook | [../ai/PROVIDERS.md](../ai/PROVIDERS.md), [../ai/RUNBOOK.md](../ai/RUNBOOK.md) | — |
| Control Center / Learning hub | [AI_INTELLIGENCE_HUB.md](./AI_INTELLIGENCE_HUB.md) | — |

**Onboarding and how-to guides** stay in [`docs/guides/README.md`](../guides/README.md).

**Last updated:** 2026-05-23
