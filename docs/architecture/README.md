# Architecture reference (`docs/architecture/`)

Cross-cutting platform design notes. **Agent enforcement** lives in `.cursor/rules/` (short); this folder explains **why**, examples, anti-patterns, and review checklists.

Complement (not replace) `memory-bank/systemPatterns.md` for product-level architecture narrative.

| Topic | Document | Cursor rule |
|-------|----------|-------------|
| **Platform standards (constitutional)** | [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) | `platform-standards.mdc` |
| **Module certification ledger** | [CERTIFICATION_LEDGER.md](./CERTIFICATION_LEDGER.md) | `platform-standards.mdc` |
| **Reference Module Catalog** | [REFERENCE_MODULE_CATALOG.md](./REFERENCE_MODULE_CATALOG.md) | `module-development.mdc` |
| **Governance foundation (complete)** | [GOVERNANCE_FOUNDATION_COMPLETE.md](./GOVERNANCE_FOUNDATION_COMPLETE.md) | — |
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
| **File Hub (reference module) audits** | [audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md](./audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md) | `module-development.mdc` |

**Reference modules:**

| # | Module | Doc |
|---|--------|-----|
| 1 | File Hub (L4) | [FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md](./audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md) |
| 2 | Chat (L3) | [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) |
| 3 | Calendar (L3) | [CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md) |

**Copy guide:** [REFERENCE_MODULE_CATALOG.md](./REFERENCE_MODULE_CATALOG.md) — which patterns to take from which module.

Pattern catalog: [`../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md). Executive status: [`CERTIFICATION_LEDGER.md`](./CERTIFICATION_LEDGER.md).

**Module audits (Phase 0):** [`audits/`](./audits/) — e.g. [TODO_CONSTITUTIONAL_AUDIT.md](./audits/TODO_CONSTITUTIONAL_AUDIT.md), [TODO_OPERATION_MATRIX.md](./audits/TODO_OPERATION_MATRIX.md), [TODO_SERVICE_EXTRACTION_PLAN.md](./audits/TODO_SERVICE_EXTRACTION_PLAN.md).

**Onboarding and how-to guides** stay in [`docs/guides/README.md`](../guides/README.md).

**Textbook maintenance:** Update [`AI_SYSTEM_TEXTBOOK.md`](./AI_SYSTEM_TEXTBOOK.md) when changing `server/src/ai/` orchestration, pipeline catalog, grounding enforcement, or twin request contract.

**Notebook (composition module):**

| Doc | Topic |
|-----|--------|
| [NOTEBOOK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_IMPLEMENTATION_PLAN.md) | Phase sequence |
| [NOTEBOOK_LINK_SCHEMA_DESIGN.md](./NOTEBOOK_LINK_SCHEMA_DESIGN.md) | Phase 3A — `notebook_links` schema |
| [NOTEBOOK_LINK_API_DESIGN.md](./NOTEBOOK_LINK_API_DESIGN.md) | Phase 3A — REST API |
| [NOTEBOOK_LINK_ACCESS_RULES.md](./NOTEBOOK_LINK_ACCESS_RULES.md) | Phase 3A — authorization |
| [NOTEBOOK_LINK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_LINK_IMPLEMENTATION_PLAN.md) | Phase 3B scope |

**Last updated:** 2026-06-01
