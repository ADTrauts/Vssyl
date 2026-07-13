# AI System Glossary

**Date:** 2026-07-12  

| Term | Plain English | Technical | Owner | Related | Confused with |
|------|---------------|-----------|-------|---------|---------------|
| Digital Life Twin | Vssyl’s personal AI that knows your workspace context | `DigitalLifeTwinService` + `Core` via `/api/ai/twin` | AI Platform | Chat UI | Generic “chatbot” |
| Twin Service | Prepares conversation/memory before thinking | `DigitalLifeTwinService` | AI Platform | Core | Core |
| Twin Core | Runs one AI turn end-to-end | `DigitalLifeTwinCore.processAsDigitalTwin` | AI Platform | Providers, pipeline | Service |
| Context provider | A module endpoint that answers “what’s relevant?” | Registered `/api/{module}/ai/context/*` | Module | Orchestrator | UserAIContext |
| ContextProviderOrchestrator | Chooses and fetches providers for a query | `orchestrateContextRetrieval` | AI Platform | Registry | CrossModuleEngine |
| CrossModuleContextEngine | Older name for the context API facade | `getContextForAIQuery` | AI Platform | Orchestrator | Duplicate stack |
| UserAIContext | Things you explicitly taught / pending inferred notes | Prisma `UserAIContext` | AI Platform | Teach Vssyl | Module context |
| UserMemoryFact | A saved durable fact (“I prefer…”) | Prisma `UserMemoryFact` | AI Platform | MemoryRetrievalService | Conversation history |
| Pipeline catalog | Rules for intents, sources, tools, grounding | `getEffectivePipelineCatalog` | AI Platform | Enforcement | Prompt text |
| Grounding | Checking answers against required sources | `runPipelineGroundingRetrieval` + enforcement | AI Platform | Retrieval | Model confidence |
| Conversation reasoning | Figuring out what the user wants before solving | `runConversationReasoning` | Understanding | Coaching | Personality |
| Personality | Long-lived communication style | `PersonalityEngine` / profile | AI Platform | Preferences | Coaching mode |
| PreferenceResolver | Merges hard/soft settings that may influence answers | `PreferenceResolver.resolve` | AI Platform | Learning events | Provider routing |
| Provider | OpenAI / Anthropic / Local adapter | `*Provider.ts` | Model Routing | Catalog | Model |
| Model catalog | Allowed chat models for picker/validation | `modelCatalog.ts` | Model Routing | Routing | Media models |
| Capability matrix | What each provider can do (vision, tools, fallback) | `providerCapabilityMatrix.ts` | Model Routing | Routing | Catalog |
| Tool | Model-requested function run by Vssyl | `toolDefinitions` / `toolExecutor` | Execution | Actions | Approval |
| Action | Post-answer proposed workspace operation | `ActionExecutor` | Execution | Approvals | Tool |
| Approval | Human OK before risky side effect | `ApprovalManager` / twin approvals | Governance | Autonomy | Calendar HR approval |
| Autonomy | User setting for how bold AI may be | `AutonomyManager` / settings | Governance | **Not Core wired** | Autopilot |
| Suggestion | “Try this” card in the product | `AISuggestion` | Experience | Events | Recommendation engine |
| Learning event | Proposed thing the AI learned from use | `AILearningEvent` | Knowledge | Review UI | Durable knowledge |
| Knowledge Engine | Assembles eligible knowledge for a turn | `server/src/knowledge/*` | Knowledge | Decision Model | Decision Model itself |
| Knowledge Decision Model | Philosophy of what to do with new info | Docs only | Governance philosophy | Transition Model | A microservice |
| Observation | Signal that something learnable happened | Ephemeral / rules | Knowledge ingress | Suggestion | Durable fact |
| Retrieval (AI) | Finding evidence via search/providers for grounding | `server/src/ai/retrieval/*` | Retrieval | Unified Search | Context providers |
| Unified Search | Platform search product/constitution | `docs/search/*` | Search | AI retrieval consumer | Twin chat |
| Pipeline trace | Operator diagnostic for a turn | `buildPipelineTrace` | Observability | Diagnostics UI | User influence |
| Response influence | User-facing “why this reply” | `buildResponseInfluence` | Experience/Explain | Trace | Full routing dump |
| Business AI Twin | Business-scoped AI with policies | `BusinessAIDigitalTwin*` | Enterprise | Personal twin | Centralized-ai |
| Centralized AI | Retired admin learning plane | 410 fence | — | — | Business AI |
| Query balance | Metered AI usage credits | `AIQueryService` | Billing adjacency | queryCost | Token $ cost |
| Model tier (proposed) | FAST/BALANCED/DEEP… | Config mapping | Model Routing (future) | Catalog | Provider brand names |
| SPECIALIZED path | Non-twin LLM helper (Notebook, Whisper) | e.g. `notebookAICompletion` | Various | Twin | Twin stack |

---

## Commonly confused pairs

1. **UserAIContext vs module context providers** — taught notes vs live module reads.  
2. **Knowledge Decision Model vs Knowledge Engine** — ingress philosophy vs per-turn composition.  
3. **Tools vs Actions vs Autonomy** — in-loop functions vs post-hoc proposals vs settings not auto-executing.  
4. **Pipeline trace vs influence** — operator vs user.  
5. **AdvancedLearningEngine vs ContinuousLearning** — live signals vs dead scaffold name.
