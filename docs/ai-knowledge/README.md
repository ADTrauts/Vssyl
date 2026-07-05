# AI Knowledge Reference Program

**Program:** AI Knowledge Reference Program  
**Phase:** 0A — Knowledge Architecture Discovery  
**Date:** 2026-07-05  
**Constraint:** Preserve existing AI architecture. Consolidation and product clarity only.

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
| [Correction Workflow](./AI_CORRECTION_WORKFLOW.md) | Designed (not implemented) correction UX |

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

- `memory-bank/aiContextSystem.md`
- `memory-bank/AI_CONTEXT_MEMORY_ARCHITECTURE.md`
- `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md`
- `docs/ai/retrieval/AI_RETRIEVAL_CONTEXT_SOURCE_MAP.md`
