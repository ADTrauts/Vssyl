# Architecture reference (`docs/architecture/`)

Cross-cutting platform design notes. **Agent enforcement** lives in `.cursor/rules/` (short); this folder explains **why**, examples, anti-patterns, and review checklists.

Complement (not replace) `memory-bank/systemPatterns.md` for product-level architecture narrative.

| Topic | Document | Cursor rule |
|-------|----------|-------------|
| **Platform standards (constitutional)** | [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) | `platform-standards.mdc` |
| Legacy cleanup / deprecation | [LEGACY_CLEANUP.md](./LEGACY_CLEANUP.md) | `platform-standards.mdc` |
| Global Trash | [GLOBAL_TRASH.md](./GLOBAL_TRASH.md) | `module-development.mdc` |
| V_Link | [V_LINK.md](./V_LINK.md) | — |
| Platform entity model | [PLATFORM_ENTITY_MODEL.md](./PLATFORM_ENTITY_MODEL.md) | — |
| Platform job registry | [PLATFORM_JOB_REGISTRY.md](./PLATFORM_JOB_REGISTRY.md) | — |
| **AI System Textbook (internal onboarding)** | [AI_SYSTEM_TEXTBOOK.md](./AI_SYSTEM_TEXTBOOK.md) → [`ai-textbook/`](./ai-textbook/) | — |
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

**Textbook maintenance:** Update [`AI_SYSTEM_TEXTBOOK.md`](./AI_SYSTEM_TEXTBOOK.md) when changing `server/src/ai/` orchestration, pipeline catalog, grounding enforcement, or twin request contract.

**Last updated:** 2026-05-28
