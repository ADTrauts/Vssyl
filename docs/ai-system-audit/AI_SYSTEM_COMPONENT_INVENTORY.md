# AI System Component Inventory

**Date:** 2026-07-12  
**Scale:** ~162 production TS files under `server/src/ai/` + `server/src/knowledge/` + AI routes/controllers + web AI surfaces  

Confidence legend: **H** = confirmed by imports/callers/routes · **M** = partial evidence · **L** = inferred / incomplete

---

## 1. Backend AI directories (`server/src/ai/`)

| Path | Type | Primary responsibility | Runtime | Tests | Confidence |
|------|------|------------------------|---------|-------|------------|
| `core/DigitalLifeTwinCore.ts` | service | Canonical turn orchestration (~2575 LOC): context, reasoning, grounding, provider, tools, enforcement, learning signals | Active | Partial (activity + executors) | H |
| `core/DigitalLifeTwinService.ts` | service | Pre-core: history, continuity, recall, memory facts, remember-that; streaming wrapper | Active | Partial | H |
| `core/PersonalityEngine.ts` | engine | Personality profile for prompts / control center | Active | Limited | H |
| `core/DecisionEngine.ts` | engine | Constructed on twin path; **no method calls found** | Scaffold | Low | H |
| `core/LearningEngine.ts` | engine | Legacy learning for deprecated `processRequest` | Deprecated path | Low | H |
| `core/ActionExecutor.ts` | execution | Post-response LifeTwin actions via module controllers/services | Active | Yes (per-module) | H |
| `core/ActionExecutorRegistry.ts` | registry | Partner/webhook action executors | Active | Integration | H |
| `context/CrossModuleContextEngine.ts` | engine | Facade: `getContextForAIQuery` → orchestrator | Active | Yes | H |
| `context/ContextProviderOrchestrator.ts` | orchestrator | Intent-aware provider selection + parallel fetch + audit | Active | Yes | H |
| `context/contextProviderRegistry.ts` | registry | Load `ModuleAIContextRegistry` providers | Active | Yes | H |
| `context/fetchModuleContextProvider.ts` | utility | HTTP/service fetch of registered providers | Active | Yes | H |
| `context/AIContextAssembler.ts` | utility | Merge/tier/trim context blocks for prompts | Active | Via Core/tests | H |
| `context/ContextBudgetManager.ts` | utility | Token/budget constraints | Active | Partial | H |
| `conversation/*` | understanding | Objective, confidence, premature-solution guard, coaching | Active via Core | Limited | H |
| `providers/OpenAIProvider.ts` | provider | Chat, tools, vision, DALL·E / gpt-image | Active | Limited | H |
| `providers/AnthropicProvider.ts` | provider | Chat + vision | Active | Limited | H |
| `providers/LocalProvider.ts` | provider | Local/sensitive stub; no vision | Active (fallback/sensitive) | Limited | H |
| `providers/modelCatalog.ts` | config | Chat model catalog for picker + validation | Active | Indirect | H |
| `providers/providerRouting.ts` | routing | selectLlmProvider, vision adjust, fallback | Active | Partial | H |
| `providers/providerCapabilityMatrix.ts` | policy | Capability SoT (`1e-2026-06-03`) | Active | Partial | H |
| `providers/capabilities.ts` | policy | Vision helpers | Active | Partial | H |
| `pipeline/*` | governance/obs | Catalog, grounding, enforcement, traces, retention | Active | Strong (~17) | H |
| `retrieval/*` | retrieval | Unified-search discovery pilot for pipeline | Feature-flagged | Strong (~6) | H |
| `prompts/providerUserPrompt.ts` | utility | User prompt assembly | Active | Yes | H |
| `preferences/PreferenceResolver.ts` | service | Hard/soft prefs, learning influence | Active | Strong | H |
| `memory/MemoryRetrievalService.ts` | service | Score/retrieve `UserMemoryFact` | Active | Yes | H |
| `tools/toolDefinitions.ts` | registry | Tool schemas exposed to LLM | Active | Yes | H |
| `tools/toolExecutor.ts` | execution | Drive/todo tools via domain services | Active | Yes | H |
| `approval/ApprovalManager.ts` | governance | Approval CRUD/execute for autonomy routes | Active (routes) | Limited | H |
| `autonomy/AutonomyManager.ts` | governance | Evaluate autonomy — **not wired into Core** | Settings + deprecated | Limited | H |
| `actions/AutonomousActionExecutor.ts` | execution | Legacy autonomous loop | **Retired** (no callers; routes 410) | Limited | H |
| `actions/ActionTemplates.ts` | utility | Action templates for autonomy UI | Partial | Low | M |
| `learning/AdvancedLearningEngine.ts` | learning | Post-interaction learning events/signals | Active | Yes | H |
| `learning/CentralizedLearningEngine.ts` | learning | Consent/patterns; mostly gate in Core | Partial | Partial | M |
| `learning/PatternAnalysisScheduler.ts` | scheduler | Optional (`ENABLE_PATTERN_ANALYSIS_SCHEDULER`) | Conditional | Low | H |
| `learning/ABTestingEngine.ts` etc. | orphan | Performance/notification/security helpers | **Unused** | Self only | H |
| `suggestions/*` | experience | Ambient suggestion correlation/ranking/rules | Active | Yes | H |
| `intelligence/*` | analytics-adj | Recommendations / predictive / patterns | HTTP active | Partial | H |
| `analytics/*` | orphan | AIPoweredInsights, BI, RealTime, Predictive | **Unused** | None/low | H |
| `models/AIModelManagementService.ts`, `AutoMLService.ts` | orphan | Model mgmt scaffolds | **Unused** | Low | H |
| `workflows/WorkflowAutomationService.ts` | orphan | Workflow scaffold | **Unused** | Low | H |
| `enterprise/BusinessAIDigitalTwinService.ts` | service | Business policy wrapper → personal twin | Active | Limited | H |
| `privacy/PrivacyDataRouter.ts` | utility | Legacy `processRequest` privacy routing | Deprecated path | Low | H |
| `consumers/AIEventConsumer.ts` | consumer | Domain events → suggestion signals | Active | Limited | H |
| `services/ModuleAIContextService.ts` | service | Registry fetch/cache/health | Active | Yes | H |
| `knowledge/` | — | **Tests only** — no production modules | N/A | Integration | H |

---

## 2. Knowledge Engine (`server/src/knowledge/`)

| Component | Path | Responsibility | Callers | Runtime | Confidence |
|-----------|------|----------------|---------|---------|------------|
| Composition orchestrator | `knowledgeCompositionOrchestrator.ts` | Assemble knowledge cards for turn | Pipeline grounding, assemblers | Active | H |
| Convergence engine | `knowledgeConvergenceEngine.ts` | Fact convergence / conflict | Knowledge path | Active | H |
| Neighborhood service | `knowledgeNeighborhoodService.ts` | Graph neighborhoods | Project assistant consumer | Active | H |
| Project assistant consumer | `projectAssistantNeighborhoodConsumer.ts` | Project-assistant retrieval consumer | Retrieval adoption | Active | H |
| Trust / provenance / cards | `trustResolver.ts`, `provenanceMapper.ts`, `knowledgeCard.ts` | Provenance + trust | Composition | Active | H |

**Note:** AI Knowledge Decision Model (`docs/ai-knowledge/AI_KNOWLEDGE_DECISION_MODEL.md`) is **philosophy/SoT**, not a class under this folder.

---

## 3. Frontend AI files (major)

| Component | Path | Audience | Primary APIs | Active |
|-----------|------|----------|--------------|--------|
| AIChatWorkspace | `web/src/components/ai/AIChatWorkspace.tsx` | Customer | `/api/ai/twin`, media, conversations | Yes |
| AIChatDropdown | `web/src/components/header/AIChatDropdown.tsx` | Customer | twin + suggestions | Yes |
| AI Identity `/ai` | `web/src/app/ai/page.tsx` | Customer | identity, learning, memory, autonomy | Yes |
| EmployeeAIAssistant | `web/src/components/work/EmployeeAIAssistant.tsx` | Business | `/api/business-ai/:id/interact` | Yes |
| NotebookAIPanel | `web/src/components/notebook/NotebookAIPanel.tsx` | Customer | `/api/notebook/pages/:id/ai/*` | Yes |
| Admin AI Pipeline | `web/src/app/admin-portal/ai-pipeline/**` | Admin | admin pipeline APIs | Yes |
| Business AI CC | `web/src/app/business/[id]/ai/` | Biz admin | `/api/business-ai/:id/*` | Yes |
| ApprovalManager | `web/src/components/ai/ApprovalManager.tsx` | — | autonomy approvals | **Orphan UI** |
| SchedulingAIAssistant | `web/src/components/scheduling/SchedulingAIAssistant.tsx` | — | twin | **Unmounted** |
| AIProviderTest / Status / EnhancedSearch | `web/src/components/ai/*` | — | twin | **Orphan** |

---

## 4. Shared types

| Path | Role |
|------|------|
| `shared/src/types/module-ai-context.ts` | Module AI context manifest shapes |
| `shared/src/types/ai-context-provider-contract.ts` | Provider response contract |
| `shared/src/types/ai-orchestration-snapshot.ts` | Orchestration snapshot for diagnostics |

---

## 5. Prisma AI modules (`prisma/modules/ai/`)

| File | Models (summary) |
|------|------------------|
| `ai-models.prisma` | Personality, autonomy, approvals, usage, learning events/patterns, suggestions, UserAIContext, AB/workflow/AutoML scaffolds, extracted expense |
| `conversations.prisma` | `AIConversation`, `AIMessage` |
| `user-memory.prisma` | `UserMemoryFact` |
| `message-recall.prisma` | `AIMessageRecallIndex` |
| `module-context-registry.prisma` | Registry, cache, performance metrics |
| `ai-pipeline.prisma` | Diagnostics, policies, settings, audit |
| `enterprise-ai.prisma` | Business twin + interactions + learning + usage |
| `analytics.prisma` | Scaffold analytics tables |
| `billing/aiQueryBalance.prisma` | Query balance / purchases |
| `admin/ai-provider-history.prisma` | Provider usage/expense snapshots |

---

## 6. API routes (summary)

Canonical conversational: **`POST /api/ai/twin`** (`server/src/routes/ai.ts`).

Other mounts (see also `docs/architecture/AI_CANONICAL_ROUTE_MAP.md`):

| Mount | File | Notes |
|-------|------|-------|
| `/api/ai/*` | `routes/ai.ts` | Twin, media, suggestions, shims |
| `/api/ai/autonomy` | `ai-autonomy.ts` | Settings, evaluate, approvals |
| `/api/ai/autonomous` | `ai/autonomous.ts` | **Retired/410** |
| `/api/ai/intelligence` | `ai-intelligence.ts` | Recs / predictive |
| `/api/ai/personality` | `ai-personality.ts` | Profile |
| `/api/ai/user-context` | `ai-user-context.ts` | Taught/inferred context CRUD |
| `/api/ai-conversations` | `aiConversations.ts` | Conversation CRUD |
| `/api/business-ai` | `businessAI.ts` | Tenant business AI |
| `/api/admin-portal/ai-pipeline` | `adminPortalRoutes.aiPipeline.ts` | Operator plane |
| `/api/centralized-ai` | middleware 410 | Fenced |
| Module `/api/*/ai/context/*` | Module controllers | Registry providers |

---

## 7. Runtime registrations

| Mechanism | Path | Status |
|-----------|------|--------|
| Built-in module AI context | `server/src/startup/registerBuiltInModules.ts` | Active at startup (`index.ts`) |
| Modules with providers | drive, chat, calendar, hr, scheduling, workforce_comms, todo, notes, notebook, vlink, place, dashboard | Active |
| Domain event → AI | `events/registerDomainEventSubscribers.ts` → `AIEventConsumer` | Active |
| Pattern scheduler | `ENABLE_PATTERN_ANALYSIS_SCHEDULER` | Optional |

---

## 8. Environment variables (AI-relevant)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI chat/vision/media/extraction/notebook |
| `ANTHROPIC_API_KEY` | Anthropic chat/vision |
| `OPENAI_ADMIN_API_KEY`, `OPENAI_ORG_ID` | Admin provider ops |
| `NOTEBOOK_AI_MODEL` | Notebook default (`gpt-4o-mini`) |
| `AI_CONTEXT_ORCHESTRATOR_ENABLED` | Orchestrator vs legacy CrossModule path |
| `AI_ORCHESTRATION_SNAPSHOT_*` | Snapshot retention |
| `AI_SYNTHETIC_CONTEXT_ENABLED` | Synthetic context policy |
| `AI_PIPELINE_*` | Diagnostics / enforcement gates |
| `AI_RETRIEVAL_*` | Retrieval pilot gates |
| `ENABLE_PATTERN_ANALYSIS_SCHEDULER` | Background pattern job |
| `NEXT_PUBLIC_AI_ACTIONS_UI` | Frontend autonomous actions gate |

---

## 9. Provider configuration

| Source | Role |
|--------|------|
| `modelCatalog.ts` | Chat models exposed to UI + Core validation |
| `providerCapabilityMatrix.ts` | Vision/tools/fallback eligibility |
| `providerRouting.ts` | Runtime selection + fallback diagnostics |
| User prefs | Preferred provider/model per PreferenceResolver |
| Hardcoded defaults | Provider class defaults (`gpt-4o`, `claude-3-5-sonnet-20241022`) |

---

## 10–15. Prompt / tools / context / knowledge / governance / observability

Covered in depth in companion docs. Quick owners:

| Concern | Owner |
|---------|-------|
| Prompt assembly | `providerUserPrompt.ts` + Core system prompt builders |
| Tools | `toolDefinitions.ts` / `toolExecutor.ts` |
| Context providers | Registry + module HTTP handlers |
| Knowledge compose | `server/src/knowledge/*` + pipeline grounding |
| Governance | Auth routes, PreferenceResolver, pipeline enforcement, ApprovalManager (side path) |
| Observability | `buildPipelineTrace`, diagnostic persistence, logger ops |

---

## 16. Tests

~99 tests under `server/src/ai/**`. Concentration: context (19), pipeline (17), core (9), preferences (8), utils (8), suggestions (6), retrieval (6). Frontend: stream/response handlers + admin retirement tests. See [AI_TEST_AND_REGRESSION_AUDIT.md](./AI_TEST_AND_REGRESSION_AUDIT.md).

---

## 17. Documentation clusters

| Cluster | Path |
|---------|------|
| Attachment/providers | `docs/ai/` |
| Knowledge constitution | `docs/ai-knowledge/` |
| Platform AI architecture | `docs/architecture/AI_*` |
| Prior deep dive | `docs/ai-knowledge/deep-dive/` |
| This audit | `docs/ai-system-audit/` |

---

## 18. Deprecated / archived / fenced

| Item | Evidence | Status |
|------|----------|--------|
| `POST /api/ai/chat` | `ai.ts` → `processRequest` | Mounted deprecated |
| `/api/ai/autonomous/*` | `routes/ai/autonomous.ts` | Retired responses |
| `/api/centralized-ai` | Middleware 410 | Fenced |
| Admin redirects | `ai-learning`, `ai-context`, `ai-system` → pipeline | Redirected |
| `AutonomousActionExecutor` | No production `new` callers | Dead |
| `ai/analytics/*` engines | Zero imports | Orphan |
| Wave legacy register | `docs/architecture/audits/AI_LEGACY_DUPLICATION_REGISTER.md` | Historical + still useful |

---

## Per-component assessment template (applied to majors)

For each major component above, auditors recorded:

- Inputs / outputs (request → response or DB write)  
- State owned (if any)  
- DB read/write  
- External systems (OpenAI/Anthropic/GCS)  
- Direct callers  
- Registration  
- Active?, tested?, docs match?, concerns  

Full narrative for the spine matches [AI_SYSTEM_END_TO_END_FLOWS.md](./AI_SYSTEM_END_TO_END_FLOWS.md) and prior deep-dive lifecycle (revalidated 2026-07-12).

### Concerns summary (inventory-level)

| ID | Concern | Components |
|----|---------|------------|
| INV-01 | Core is over-broad (many layers in one class) | DigitalLifeTwinCore |
| INV-02 | Orphan analytics/AutoML/workflow | analytics/, models/, workflows/ |
| INV-03 | Autonomy not on twin path but UI/routes remain | AutonomyManager, AutonomousActions UI |
| INV-04 | Parallel LLM paths outside catalog routing | Notebook, extraction, Whisper/TTS |
| INV-05 | Empty `ai/knowledge/` vs real `src/knowledge/` | Naming / doc confusion |
| INV-06 | DecisionEngine inert | DecisionEngine |
