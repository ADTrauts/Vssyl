# AI Document Status Matrix

**Program:** AI Architecture Phase 0  
**Date:** 2026-07-12  
**Status:** Active — status of AI documentation and terminology  
**Owner:** AI Platform / Architecture council  
**Source of Truth for:** Which AI docs are Current / Supporting / Historical / Future; terminology status  
**Companion:** [`AI_READING_GUIDE.md`](./AI_READING_GUIDE.md)

Status key: **Current** · **Supporting** · **Historical** · **Future** · **Deprecated wording**

---

## A. Document status

### Constitutional / entry (Current)

| Document | Status | Role |
|----------|--------|------|
| [`AI_SYSTEM_MENTAL_MODEL.md`](./AI_SYSTEM_MENTAL_MODEL.md) | Current | Plain-English mental model |
| [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md) | Current | Four intelligence scopes; Knowledge vs Intelligence |
| [`AI_PLATFORM_CONSTITUTION.md`](./AI_PLATFORM_CONSTITUTION.md) | Current | Platform AI law |
| [`../ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md`](../ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md) | Current | Knowledge law |
| [`../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md`](../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md) | Current | Retrieval law |
| [`AI_READING_GUIDE.md`](./AI_READING_GUIDE.md) | Current | Reading order |
| [`AI_ARCHITECTURE_NAVIGATION_GUIDE.md`](./AI_ARCHITECTURE_NAVIGATION_GUIDE.md) | Current | Agent decision trees |
| [`../ai-system-audit/README.md`](../ai-system-audit/README.md) | Current | Official whole-system analysis set |

### Living supporting (Current / Supporting)

| Document | Status | Role |
|----------|--------|------|
| [`AI_PLATFORM_OVERVIEW.md`](./AI_PLATFORM_OVERVIEW.md) | Supporting | Diagrams (verify against audit if conflict) |
| [`AI_TWIN_PROMPT_PIPELINE.md`](./AI_TWIN_PROMPT_PIPELINE.md) | Supporting | Twin prompt pipeline detail |
| [`AI_CONVERSATION_REASONING.md`](./AI_CONVERSATION_REASONING.md) | Supporting | Understanding layer |
| [`AI_CONTEXT_ASSEMBLY.md`](./AI_CONTEXT_ASSEMBLY.md) | Supporting | Context assembly |
| [`AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md`](./AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md) | Supporting | Personal/business boundaries |
| [`AI_CANONICAL_ROUTE_MAP.md`](./AI_CANONICAL_ROUTE_MAP.md) | Supporting | Route inventory |
| [`../ai/ARCHITECTURE.md`](../ai/ARCHITECTURE.md), [`PROVIDERS.md`](../ai/PROVIDERS.md), [`RUNBOOK.md`](../ai/RUNBOOK.md), [`GOLDEN_RULES.md`](../ai/GOLDEN_RULES.md) | Supporting | Vision/providers ops (Twin-scoped; see exemptions) |
| [`../ai-knowledge/AI_KNOWLEDGE_DECISION_MODEL.md`](../ai-knowledge/AI_KNOWLEDGE_DECISION_MODEL.md) | Current | Ingress philosophy |
| [`../ai-knowledge/KNOWLEDGE_TRANSITION_MODEL.md`](../ai-knowledge/KNOWLEDGE_TRANSITION_MODEL.md) | Current | State transitions |
| [`memory-bank/aiContextSystem.md`](../../memory-bank/aiContextSystem.md) | Supporting | Context provider product/implementation notes |
| Audit package docs under `docs/ai-system-audit/` | Current analysis | Do not duplicate; link |
| [`AI_PIPELINE_OPERATOR_INFORMATION_ARCHITECTURE.md`](./AI_PIPELINE_OPERATOR_INFORMATION_ARCHITECTURE.md) | Current | Canonical Admin AI Pipeline operator IA |
| [`AI_ADMIN_SURFACE_CONSOLIDATION_MATRIX.md`](./AI_ADMIN_SURFACE_CONSOLIDATION_MATRIX.md) | Current | Admin AI surface dispositions |
| [`AI_PIPELINE_OPERATOR_RBAC.md`](./AI_PIPELINE_OPERATOR_RBAC.md) | Current | Operator RBAC (platform ADMIN) |
| [`AI_OPERATIONS_CENTER_API.md`](./AI_OPERATIONS_CENTER_API.md) | Current | Intelligence workflow API (`/api/admin/ai/operations`) |
| [`AI_PHASE4B_ADMIN_CONSOLIDATION_CLOSEOUT.md`](./AI_PHASE4B_ADMIN_CONSOLIDATION_CLOSEOUT.md) | Current | Phase 4B closeout |
| [`AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md`](./AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md) | Current | Phase 6B platform certification |
| [`AI_PLATFORM_SUBSYSTEM_INVENTORY.md`](./AI_PLATFORM_SUBSYSTEM_INVENTORY.md) | Current | Subsystem inventory + ownership + debt |
| [`AI_PLATFORM_CANONICAL_DIAGRAM.md`](./AI_PLATFORM_CANONICAL_DIAGRAM.md) | Current | Canonical whole-platform Mermaid diagram |
| [`AI_MODEL_ROUTING_READINESS.md`](./AI_MODEL_ROUTING_READINESS.md) | Current | Phase 7 readiness (no implementation) |
| [`AI_PHASE6B_CLOSEOUT.md`](./AI_PHASE6B_CLOSEOUT.md) | Current | Phase 6B closeout |

### Future / design-only

| Document | Status | Role |
|----------|--------|------|
| [`../ai-system-audit/AI_MODEL_ROUTING_TARGET_ARCHITECTURE.md`](../ai-system-audit/AI_MODEL_ROUTING_TARGET_ARCHITECTURE.md) | Future | Task-tier routing design — **not shipped** |
| Industry Intelligence section in Intelligence Model | Future | Knowledge packs — **not shipped** |
| [`../ai-knowledge/AI_CORRECTION_WORKFLOW.md`](../ai-knowledge/AI_CORRECTION_WORKFLOW.md) | Future / Design | End-user Teach Vssyl correction UX — **not** operator Phase 6 workflow |

### Historical (preserved; banners applied)

| Document | Status | Prefer instead |
|----------|--------|----------------|
| [`AI_OPERATIONS_CENTER_ARCHITECTURE.md`](./AI_OPERATIONS_CENTER_ARCHITECTURE.md) | Historical | Pipeline operator IA (4B) |
| [`AI_OPERATIONS_CENTER_UX.md`](./AI_OPERATIONS_CENTER_UX.md) | Historical | Pipeline Hub UX |
| [`AI_OPERATIONS_CENTER_RBAC.md`](./AI_OPERATIONS_CENTER_RBAC.md) | Historical | `AI_PIPELINE_OPERATOR_RBAC.md` |
| [`AI_OPERATIONS_CENTER_CLOSEOUT.md`](./AI_OPERATIONS_CENTER_CLOSEOUT.md) | Historical | Phase 4B closeout |
| [`../ai-knowledge/deep-dive/*`](../ai-knowledge/deep-dive/) (2026-07-05) | Historical | System Audit + Mental Model + Reading Guide |
| [`audits/AI_LEGACY_DUPLICATION_REGISTER.md`](./audits/AI_LEGACY_DUPLICATION_REGISTER.md) | Historical | Audit redundancy register (still useful archaeology) |
| Session summaries / old plans implying ContinuousLearning platform | Historical | Intelligence Model + audit |
| [`../guides/AI_SYSTEM_ARCHITECTURE_MAP.md`](../guides/AI_SYSTEM_ARCHITECTURE_MAP.md) | Historical (already deprecated) | AI_PLATFORM_OVERVIEW |

### Onboarding textbook

| Document | Status | Note |
|----------|--------|------|
| [`AI_SYSTEM_TEXTBOOK.md`](./AI_SYSTEM_TEXTBOOK.md) + `ai-textbook/` | Supporting | Keep; cross-link Mental Model as step 0 |

---

## B. Terminology status

| Term | Status | Correct use | Avoid |
|------|--------|-------------|-------|
| **Digital Life Twin / Personal Twin** | Current | Conversational personal AI over shared runtime | Calling every LLM call a Twin |
| **Business Twin** | Current | Business-scoped wrapper + policy | Separate unrelated AI stack |
| **Shared AI Runtime** | Current | Twin Service→Core orchestration | — |
| **Centralized AI** | Deprecated wording | Historical/fenced `/api/centralized-ai` | Describing current architecture |
| **Knowledge** | Current | Governed information that may influence answers | Synonym for “intelligence” |
| **Intelligence** | Current | Reasoning/routing/quality capability (four scopes) | “Intelligence” as a private fact dump |
| **Knowledge Engine** | Current | Composition runtime in `server/src/knowledge/` | Assuming code under `server/src/ai/knowledge/` |
| **Knowledge Decision Model** | Current | Ingress philosophy (docs) | Treating as a microservice |
| **Learning Engine** | Legacy / careful | Prefer naming AdvancedLearningEngine / review flows specifically | “ContinuousLearning” as live platform |
| **ContinuousLearning** | Deprecated wording | Orphan scaffold only | Product feature claims |
| **Context Engine / CrossModuleContextEngine** | Legacy name, current facade | Facade over ContextProviderOrchestrator | Second competing orchestrator |
| **ContextProviderOrchestrator** | Current | Canonical provider fetch | — |
| **Autonomy** | Current settings; deprecated autopilot | Settings / boundary copy | Silent auto-execution on Twin |
| **Approval** | Current (dual paths) | Twin approvals + autonomy ApprovalManager | Assuming one UI owns all |
| **AI Pipeline** | Current | Catalog, grounding, enforcement, admin diagnostics | Synonym for Twin chat UI |
| **Notebook AI** | Current specialized | OpenAI completion helper outside full Twin | Claiming full Twin parity |
| **Context Graph** | Current (platform capability) | Graph/neighborhoods; consumed by knowledge/retrieval | Equating to Twin itself |
| **Provider** | Current | OpenAI / Anthropic / Local adapters | Hardcoding brand as product logic |
| **Routing** | Current (limited) | providerRouting + prefs + vision | Assuming FAST/BALANCED/DEEP shipped |
| **Model tiers** | Future wording | Design target only until Model Routing ships | Docs implying live tiers |
| **Operator correction workflow** | Current | `docs/architecture/AI_CORRECTION_WORKFLOW.md` (Phase 6) | Confusing with knowledge UX doc of same filename |
| **Teach Vssyl correction UX** | Design only | `docs/ai-knowledge/AI_CORRECTION_WORKFLOW.md` | Claiming it is the operator Platform workflow |

---

## C. Conflicts resolved in Phase 0

| Conflict | Resolution |
|----------|------------|
| Where to start for whole-system understanding | Mental Model → Reading Guide → System Audit |
| Deep-dive vs Audit | Deep-dive = Historical; Audit = official analysis |
| ContinuousLearning as platform | Deprecated wording; not a live system |
| Knowledge Engine location | `server/src/knowledge/`; empty `ai/knowledge/` is not the engine |
| PROVIDERS.md scope | Twin vision/provider path; Notebook/media are specialized exemptions (documented) |
| Autonomy = autopilot | Clarified in Mental Model; settings ≠ silent execution |
| SoT proposal | **Accepted** as navigation mapping (constitutions remain principle SoT) |
