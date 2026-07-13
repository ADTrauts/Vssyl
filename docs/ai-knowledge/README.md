# AI Knowledge Reference Program

**Program:** AI Knowledge Reference Program  
**Phase:** Constitution v1 *(0A, deep-dive, 0B complete; Phase 0 architecture governance 2026-07-12)*  
**Date:** 2026-07-12  
**Constraint:** Preserve existing AI architecture. Consolidation and product clarity only.

**Platform navigation (Phase 0):** [`../architecture/AI_READING_GUIDE.md`](../architecture/AI_READING_GUIDE.md) · [`../architecture/AI_SYSTEM_MENTAL_MODEL.md`](../architecture/AI_SYSTEM_MENTAL_MODEL.md) · [`../architecture/AI_INTELLIGENCE_MODEL.md`](../architecture/AI_INTELLIGENCE_MODEL.md) (Knowledge vs Intelligence) · [`../ai-system-audit/README.md`](../ai-system-audit/README.md)

> **Note:** The `deep-dive/` folder is **Historical**. Prefer the System Audit for whole-system analysis.

## Constitutional authority (start here)

**All future AI knowledge work must align with:**

| Document | Purpose |
|----------|---------|
| **[AI Knowledge Constitution v1](./AI_KNOWLEDGE_CONSTITUTION.md)** | **Canonical philosophy — Source of Truth for AI knowledge** |
| [AI Knowledge Principles](./AI_KNOWLEDGE_PRINCIPLES.md) | Numbered principles + PR checklist |
| [AI Knowledge Glossary](./AI_KNOWLEDGE_GLOSSARY.md) | Canonical term definitions |
| [AI Knowledge Decision Model](./AI_KNOWLEDGE_DECISION_MODEL.md) | Ingress philosophy — what happens to new information |

## Documents

| Document | Purpose |
|----------|---------|
| [Executive Summary](./AI_KNOWLEDGE_REFERENCE_PROGRAM_EXECUTIVE_SUMMARY.md) | Bottom line, maturity, recommended order |
| [Reference Assessment](./AI_KNOWLEDGE_REFERENCE_ASSESSMENT.md) | Full inventory of every knowledge source |
| [Architecture](./AI_KNOWLEDGE_ARCHITECTURE.md) | Layered knowledge model (no redesign) |
| [Taxonomy](./AI_KNOWLEDGE_TAXONOMY.md) | Categories and first-class concepts |
| [Governance](./AI_KNOWLEDGE_GOVERNANCE.md) | Ownership, conflicts, staleness, explainability |
| [Operator Model](./AI_KNOWLEDGE_OPERATOR_MODEL.md) | Operations Platform AI section evolution |
| [User Experience](./AI_KNOWLEDGE_USER_EXPERIENCE.md) | How users teach Vssyl today and should tomorrow |
| [AI Pipeline Review](./AI_PIPELINE_REVIEW.md) | Audit of existing operator AI Pipeline |
| [Correction Workflow](./AI_CORRECTION_WORKFLOW.md) | Phase 0A correction UX wireframes (superseded in detail by 0B routing spec) |

## Phase 0B — Knowledge Engine & Teach Vssyl (2026-07-05)

Canonical specification for how Vssyl should be taught. **Documentation only — no implementation.**

| Document | Purpose |
|----------|---------|
| [Phase 0B Executive Summary](./AI_KNOWLEDGE_PHASE_0B_EXECUTIVE_SUMMARY.md) | Decisions, lifecycle summary, Phase 1 scope |
| [Knowledge Engine Spec](./AI_KNOWLEDGE_ENGINE_SPEC.md) | Engine definition — existing components, no new store |
| [Knowledge Lifecycle](./KNOWLEDGE_LIFECYCLE.md) | Observation → regression protection |
| [Teach Vssyl Product Spec](./TEACH_VSSYL_PRODUCT_SPEC.md) | Product flows and surfaces |
| [Type → Store Matrix](./KNOWLEDGE_TYPE_TO_STORE_MATRIX.md) | Canonical knowledge type routing |
| [Correction Routing Spec](./AI_CORRECTION_ROUTING_SPEC.md) | Governance modes and API routing |
| [Eval Loop Spec](./AI_KNOWLEDGE_EVAL_LOOP_SPEC.md) | Minimum proof before Teach Vssyl ships |

## Phase 1A — Implementation readiness (2026-07-05)

Validation that Teach Vssyl Phase 1 can ship via existing architecture. **Documentation only — implementation begins after checklist gate.**

| Document | Purpose |
|----------|---------|
| [Phase 1 Implementation Plan](./TEACH_VSSYL_PHASE_1_IMPLEMENTATION_PLAN.md) | Verdict, trace, phases 1A/1B |
| [API Reuse Matrix](./TEACH_VSSYL_API_REUSE_MATRIX.md) | Endpoints, services, stores, gaps per journey |
| [UI Flow](./TEACH_VSSYL_UI_FLOW.md) | Modal flow, entry points, client routing |
| [Risk Assessment](./TEACH_VSSYL_RISK_ASSESSMENT.md) | Journey and cross-cutting risks |
| [Phase 1 Checklist](./TEACH_VSSYL_PHASE_1_CHECKLIST.md) | Gates before UI work |

## Constitution (2026-07-05)

Philosophy and principles — **required reading before Phase 1 implementation.**

| Document | Purpose |
|----------|---------|
| [AI Knowledge Constitution v1](./AI_KNOWLEDGE_CONSTITUTION.md) | Canonical philosophy for all AI knowledge features |
| [AI Knowledge Principles](./AI_KNOWLEDGE_PRINCIPLES.md) | Quick-reference principles and anti-patterns |
| [AI Knowledge Glossary](./AI_KNOWLEDGE_GLOSSARY.md) | Term definitions |

## Indexed Knowledge & Retrieval Audit (2026-07-06)

Architecture verification — **documentation only; no code changes.** Validates whether existing retrieval/indexing is sufficient.

| Document | Purpose |
|----------|---------|
| [Indexed Knowledge Reference Audit](./INDEXED_KNOWLEDGE_REFERENCE_AUDIT.md) | Per-system 10-question audit; three-category classification |
| [Retrieval Architecture](./RETRIEVAL_ARCHITECTURE.md) | Canonical map: Applications → retrieval → assembly → twin |
| [Application Intelligence Model](./APPLICATION_INTELLIGENCE_MODEL.md) | How each Application contributes; SoR vs taught knowledge |
| [Knowledge Engine Retrieval Validation](./KNOWLEDGE_ENGINE_RETRIEVAL_VALIDATION.md) | Orchestrator verdict, constitution alignment, recommendation |

**Verdict:** Retrieval architecture **complete** for constitutional SoR + federated model. **Optional:** persistent file-content index if product requires document-body search without per-chat attach.

## AI Learning Experience Review (2026-07-06)

UX and IA alignment audit for the Learning tab — **documentation only; no code changes.**

| Document | Purpose |
|----------|---------|
| [Learning Experience Audit](./AI_LEARNING_EXPERIENCE_AUDIT.md) | Section-by-section audit; overlaps and issues |
| [Learning Information Architecture](./AI_LEARNING_INFORMATION_ARCHITECTURE.md) | Lifecycle placement; recommended IA |
| [Learning Responsibility Matrix](./AI_LEARNING_RESPONSIBILITY_MATRIX.md) | Every action → API → model |
| [Learning Constitution Alignment](./AI_LEARNING_ALIGNMENT_WITH_CONSTITUTION.md) | P3/P4/P8; final verdict |

**Verdict:** Learning tab is **fundamentally correct** as the inference review gate; **simplify and reorganize** copy (not rewrite backend).

## AI Knowledge Decision Model (2026-07-06)

Canonical ingress philosophy — **documentation only; no code changes.** Defines what happens when new information enters Vssyl.

| Document | Purpose |
|----------|---------|
| [AI Knowledge Decision Model](./AI_KNOWLEDGE_DECISION_MODEL.md) | Primary SoT — observation → classification → decision branches |
| [Knowledge Transition Model](./KNOWLEDGE_TRANSITION_MODEL.md) | State transitions: proposal → review → durable → retirement |
| [Observation Classification Matrix](./OBSERVATION_CLASSIFICATION_MATRIX.md) | Initiator × intent × type → outcome; component map |
| [Knowledge Decision Examples](./KNOWLEDGE_DECISION_EXAMPLES.md) | Scenario walkthroughs (remember that, PDF, calendar, V_Link, etc.) |

**Verdict:** Existing architecture **supports** Decision Model v1. **No new infrastructure required.** Decision Model governs ingress; Knowledge Engine governs per-turn retrieval and assembly.

## Teach Vssyl Phase 1A (shipped)

Personal knowledge loop — Improve answer → Teach Vssyl modal.

| Document | Purpose |
|----------|---------|
| [Phase 1A Implementation](./TEACH_VSSYL_PHASE_1A_IMPLEMENTATION.md) | What shipped; APIs reused; gate tests |
| [AI Identity IA Review](./AI_IDENTITY_INFORMATION_ARCHITECTURE_REVIEW.md) | Memory → Knowledge terminology |

## Deep dive audit (2026-07-05)

Full end-to-end AI system audit before Teach Vssyl implementation. **Documentation only — no code changes.**

| Document | Purpose |
|----------|---------|
| [Executive Summary](./deep-dive/AI_SYSTEM_DEEP_DIVE_EXECUTIVE_SUMMARY.md) | Bottom line + ten final answers |
| [Component Map](./deep-dive/AI_SYSTEM_COMPONENT_MAP.md) | System layers and file index |
| [Request Lifecycle](./deep-dive/AI_REQUEST_LIFECYCLE.md) | User prompt → response → persistence |
| [Knowledge Store Inventory](./deep-dive/AI_KNOWLEDGE_STORE_INVENTORY.md) | Every memory/policy store |
| [Context Provider Inventory](./deep-dive/AI_CONTEXT_PROVIDER_INVENTORY.md) | 35 module providers + platform sources |
| [Pipeline Operations Audit](./deep-dive/AI_PIPELINE_OPERATIONS_AUDIT.md) | Admin AI Pipeline assessment |
| [Feedback and Correction Audit](./deep-dive/AI_FEEDBACK_AND_CORRECTION_AUDIT.md) | What exists vs missing |
| [Evals and Regression Audit](./deep-dive/AI_EVALS_AND_REGRESSION_AUDIT.md) | Test coverage and eval loop gaps |
| [Explainability and Grounding Audit](./deep-dive/AI_EXPLAINABILITY_AND_GROUNDING_AUDIT.md) | User vs operator explainability |
| [Teach Vssyl Readiness](./deep-dive/AI_TEACH_VSSYL_IMPLEMENTATION_READINESS.md) | Phased implementation plan |

## Related architecture (canonical — do not duplicate)

- **[AI Knowledge Constitution v1](./AI_KNOWLEDGE_CONSTITUTION.md)** — **start here for AI knowledge philosophy**
- [AI Platform Constitution](../architecture/AI_PLATFORM_CONSTITUTION.md) — runtime orchestration boundaries
- `memory-bank/aiContextSystem.md`
- `memory-bank/AI_CONTEXT_MEMORY_ARCHITECTURE.md`
- `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md`
- `docs/ai/retrieval/AI_RETRIEVAL_CONTEXT_SOURCE_MAP.md`
