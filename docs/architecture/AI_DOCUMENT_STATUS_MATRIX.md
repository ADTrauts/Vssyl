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
| [`AI_MODEL_ROUTER_ARCHITECTURE.md`](./AI_MODEL_ROUTER_ARCHITECTURE.md) | Current | Phase 7 Model Router (shadow) |
| [`AI_MODEL_ROUTING_AUDIT.md`](./AI_MODEL_ROUTING_AUDIT.md) | Current | Phase 7 routing audit |
| [`AI_CAPABILITY_MODEL.md`](./AI_CAPABILITY_MODEL.md) | Current | Capability taxonomy |
| [`AI_ROUTING_TIERS.md`](./AI_ROUTING_TIERS.md) | Current | Routing tiers |
| [`AI_MODEL_CATALOG.md`](./AI_MODEL_CATALOG.md) | Current | Canonical model catalog |
| [`AI_ROUTING_POLICY.md`](./AI_ROUTING_POLICY.md) | Current | Routing policy |
| [`AI_PHASE7_CLOSEOUT.md`](./AI_PHASE7_CLOSEOUT.md) | Current | Phase 7 closeout |
| [`AI_SKILLS_ARCHITECTURE.md`](./AI_SKILLS_ARCHITECTURE.md) | Current | Phase 8 Skills Framework architecture |
| [`AI_SKILL_CONTRACT.md`](./AI_SKILL_CONTRACT.md) | Current | `AISkillDefinition` field contract |
| [`AI_SKILL_EXECUTION_MODEL.md`](./AI_SKILL_EXECUTION_MODEL.md) | Current | Selection, plan, runner boundaries |
| [`AI_SKILL_REGISTRY.md`](./AI_SKILL_REGISTRY.md) | Current | Code-first registry |
| [`AI_SKILL_LIFECYCLE.md`](./AI_SKILL_LIFECYCLE.md) | Current | Skill status machine |
| [`AI_SKILL_CANDIDATE_AUDIT.md`](./AI_SKILL_CANDIDATE_AUDIT.md) | Current | Skill-like behavior audit |
| [`AI_SKILL_PILOT_CATALOG.md`](./AI_SKILL_PILOT_CATALOG.md) | Current | Phase 8 pilot Skills |
| [`AI_SKILL_CERTIFICATION_STANDARD.md`](./AI_SKILL_CERTIFICATION_STANDARD.md) | Current | Skill certification checklist |
| [`AI_SKILL_SECURITY_MODEL.md`](./AI_SKILL_SECURITY_MODEL.md) | Current | Skill security boundaries |
| [`AI_PHASE8_SKILLS_CERTIFICATION_MATRIX.md`](./AI_PHASE8_SKILLS_CERTIFICATION_MATRIX.md) | Current | Phase 8 certification matrix |
| [`AI_PHASE8_CLOSEOUT.md`](./AI_PHASE8_CLOSEOUT.md) | Current | Phase 8 closeout |

### Future / design-only

| Document | Status | Role |
|----------|--------|------|
| [`../ai-system-audit/AI_MODEL_ROUTING_TARGET_ARCHITECTURE.md`](../ai-system-audit/AI_MODEL_ROUTING_TARGET_ARCHITECTURE.md) | Future | Task-tier routing design — **not shipped** |
| Industry Intelligence section in Intelligence Model | Future | Knowledge packs — **not shipped** |
| AI Studio / customer-created Skills | Future | Phase 8 ships code-first pilots only |
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
| **Digital Life Twin** | Current | Shared conversational runtime (`/api/ai/twin`) | Calling every LLM call a Twin |
| **Personal / Business scope** | Current | Scopes of authorized reality over shared Twin | Separate intelligence engines |
| **Business Twin (product language)** | Current careful | Business-scoped Twin + policy overlay | Equating to `BusinessAIDigitalTwinService` `/interact` |
| **BusinessAIDigitalTwinService `/interact`** | Noncanonical / legacy / mock | Config record may still feed Twin policy | Canonical conversational Business Twin |
| **Shared AI Runtime** | Current | Twin Service→Core orchestration | — |
| **Response contract** | Current | `conversation` \| `grounded_answer` \| `enterprise` (answer *shape*) | Equating `enterprise` with “business topic”; equating `conversation` with ungrounded |
| **C3 / shouldRetrieveModuleContext** | Current | Conditional MODULE ContextProvider skip | “LLM-only mode” |
| **requiresAuthoritativeContext** | Current | Coarse non–base-model / platform-truth need | Complete source planner; personal-recall synonym |
| **Broad discovery** | Current | C3 safety signal only | Cross-module attention product |
| **External read capabilities** | Canonical design | [`AI_EXTERNAL_CAPABILITY_MODEL.md`](./AI_EXTERNAL_CAPABILITY_MODEL.md) — Places, Routes, web; not shipped | Conflating with Vssyl Place; ContextProvider internet fetch; provider-native search as owner |
| **Live External Truth / web_search** | Not shipped | Future capability; stub/trace only; fits external capability model | Claiming live web access |
| **`place_search` / `search_places`** | Current | Vssyl Place only — not Google Places | Repurposing for Google Maps Platform |
| **Centralized AI** | Deprecated wording | Historical/fenced `/api/centralized-ai` | Describing current architecture |
| **Knowledge** | Current | Governed information that may influence answers | Synonym for “intelligence” |
| **Intelligence** | Current | Reasoning/routing/quality capability (four scopes) | “Intelligence” as a private fact dump |
| **Knowledge Engine** | Current | Composition runtime in `server/src/knowledge/` | Assuming code under `server/src/ai/knowledge/` |
| **Knowledge Decision Model** | Current | Ingress philosophy (docs) | Treating as a microservice |
| **Learning Engine** | Legacy / careful | Prefer naming AdvancedLearningEngine / review flows specifically | “ContinuousLearning” as live platform; Learning as general intelligence |
| **ContinuousLearning** | Deprecated wording | Orphan scaffold only | Product feature claims |
| **Context Engine / CrossModuleContextEngine** | Legacy name, current facade | Facade over ContextProviderOrchestrator | Second competing orchestrator |
| **ContextProviderOrchestrator** | Current | Canonical MODULE provider fetch (C3-gated) | Universal context system (memory/history/web) |
| **Autonomy** | Current settings; deprecated autopilot | Settings / boundary copy | Silent auto-execution on Twin |
| **Approval** | Current (dual paths) | Twin approvals + autonomy ApprovalManager | Assuming one UI owns all |
| **AI Pipeline** | Current | Catalog, grounding, enforcement, admin diagnostics | Synonym for Twin chat UI; primary user-outcome router |
| **Notebook AI** | Current specialized | OpenAI completion helper outside full Twin | Claiming full Twin parity |
| **Context Graph** | Current (platform capability) | Graph/neighborhoods; consumed by knowledge/retrieval | Equating to Twin itself |
| **V_Link** | Current | Persisted cross-module relationship layer | Replacement for memory or ContextProviders |
| **Provider** | Current | OpenAI / Anthropic / Local adapters | Hardcoding brand as product logic |
| **Routing (provider)** | Current (limited) | providerRouting + prefs + vision + Phase 7 shadow | Assuming live router cutover; conflating with Twin outcome routing |
| **Model tiers** | Current (shadow) | Phase 7 capability + tier taxonomy | Docs implying production tier routing |
| **Skill** | Current | Governed task contract (`AISkillDefinition`) | Saved prompts, provider ids, or Twin fork |
| **Intent (Skill)** | Current | `AISkillIntentType` selection hint | Executable without Skill key |
| **Capability** | Current | `AIModelCapability` — provider-neutral | Provider model string in Skill contract |
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
