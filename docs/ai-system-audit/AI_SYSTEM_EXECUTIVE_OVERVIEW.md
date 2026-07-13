# AI System Executive Overview

**Date:** 2026-07-12  
**Audience:** Product owners, engineering leads, future agents  
**Evidence basis:** Repository code as of audit date; prior deep-dive (2026-07-05) revalidated  

---

## What the system is

Vssyl AI is not a single chatbot wrapper. It is a **platform orchestration layer** that:

1. Speaks for the user as a **Digital Life Twin** (personal conversational AI).  
2. Pulls **live, permission-scoped facts** from modules (Drive, Calendar, Chat, Todo, Place, etc.).  
3. Optionally **grounds** answers against a pipeline catalog of required sources.  
4. Calls an **LLM provider** (OpenAI, Anthropic, or local stub) through adapters.  
5. May **propose tools/actions** that run only through domain services with authorization.  
6. May **propose learning** that becomes durable knowledge only after governance rules.  
7. Emits **diagnostics** for operators and limited explainability for users.

The LLM is a **reasoning and language component**, not the system of record, not the permission system, and not durable memory.

---

## What the model is (and is not)

| The model IS | The model is NOT |
|--------------|------------------|
| A generator of text, structured drafts, and tool-call proposals | The owner of files, events, tasks, or HR data |
| Selected via provider + catalog model id (today) | Automatic authorization to mutate the workspace |
| Subject to vision/capability constraints | Durable “knowledge” without review gates |
| Fallible and must be grounded / enforced | A replacement for retrieval or Application SoR |

---

## Why multiple layers exist

Layers exist because **different decisions have different owners and failure modes**:

| Concern | Why not leave it to the model |
|---------|-------------------------------|
| Permissions / tenant scope | Cross-tenant leak risk; must be deterministic |
| Live entity truth | Apps own SoR; model must read, not invent copies |
| Conversation posture | Avoid premature solution / overconfident coaching |
| Knowledge durability | Silent self-modification is constitutionally forbidden |
| Tool execution | Side effects need authorize → execute → activity |
| Provider choice | Cost, privacy, vision, availability — policy, not vibes |
| Observability | Operators need traces independent of model prose |

**Necessary complexity** is the set of layers that protect those boundaries.  
**Accidental complexity** is duplicated scaffolds, dead engines, dual routes, and naming that implies two systems where one facade + one implementer exist.

---

## Plain-English request story

1. User opens `/ai-chat` or the header AI dropdown and sends a message (optionally with files).  
2. Browser calls **`POST /api/ai/twin`** with JWT, query, and context (`conversationId`, `dashboardId`, `businessId`, `fileIds`, preferred provider/model).  
3. Route checks auth, AI query balance, and business membership when scoped.  
4. **`DigitalLifeTwinService`** loads conversation history, continuity, memory facts, and optional recall.  
5. **`DigitalLifeTwinCore`** resolves preferences, may run conversation reasoning, fetches module context via **`CrossModuleContextEngine` → `ContextProviderOrchestrator`**, may run pipeline grounding / retrieval, analyzes attachments, builds prompts, selects provider/model, calls the LLM, optionally loops tools, enforces grounding, builds diagnostics, and may emit learning signals.  
6. Route persists messages / history / optional diagnostic, returns JSON or SSE.  
7. UI renders text, structured blocks, file issues, and “why this reply” influence metadata.

Business employee AI follows a **policy-gated wrapper** (`BusinessAIDigitalTwinService`) that still reaches the twin core. Notebook AI is a **separate, OpenAI-only completion helper** outside the twin stack.

---

## What is necessary complexity

- Context provider registry + orchestrator (module contract, tenant fetch, timeouts).  
- Pipeline catalog + grounding + enforcement (intent-required sources, anti-hallucination policy).  
- Conversation reasoning (objective / confidence / coaching — pre-provider).  
- Preference / identity / memory injection (governed influence on tone and facts).  
- Provider adapters + capability matrix + fallback.  
- Tool/action execution through module services (not raw Prisma from the model).  
- Knowledge Decision Model philosophy (observations vs durable knowledge).  
- Admin pipeline diagnostics (operator visibility without leaking into customer UX).

---

## What appears accidental

- Orphan engines under `server/src/ai/analytics/`, `models/AutoML*`, `workflows/WorkflowAutomationService` (no production callers).  
- `DecisionEngine` constructed but not method-called on the twin path.  
- `AutonomyManager` / `AutonomousActionExecutor` retained for deprecated surfaces while Core uses prompt-boundary copy only.  
- Multiple mounted deprecated routes (`POST /api/ai/chat`, `/api/ai/autonomous/*`, `/api/centralized-ai` 410 fence).  
- Frontend orphans (`ApprovalManager.tsx`, `SchedulingAIAssistant`, Todo AI suggestion components, `AIProviderTest`).  
- Notebook / document extraction / Whisper paths hardcoding OpenAI models outside `modelCatalog`.  
- Naming: “Knowledge Engine” vs empty `server/src/ai/knowledge/`; “ContinuousLearning” interfaces inside dead analytics scaffolds.  
- Intelligence dashboards (`/api/ai/intelligence/*`) adjacent to twin but not the same stack depth as Core.

---

## Top conclusions

1. **There is one canonical conversational stack** for personal AI chat: twin Service → Core.  
2. **Separation of Core vs Service is intentional:** Service owns conversation/memory preload; Core owns turn orchestration.  
3. **CrossModuleContextEngine is a facade** over ContextProviderOrchestrator — not a duplicate stack (classification: naming confusion + necessary facade).  
4. **Provider routing today is preference + crude complexity + vision/capability + 429 fallback**, not task-tier routing (FAST/BALANCED/DEEP).  
5. **Knowledge governance is documented and partially implemented** across stores; Decision Model is philosophy, not a single runtime class.  
6. **Autonomy evaluation is not on the twin hot path** — silent auto-execution is intentionally de-emphasized.  
7. **Parallel LLM stacks exist** (Notebook completion, extraction, media) and bypass twin context/grounding — accepted specialization, but they need explicit boundary documentation and eventual shared routing config.  
8. **Simplification should start with documentation + retirement of dead/orphaned paths**, not a rewrite of Core.

---

## What this audit does not change

No production code, models, routes, or provider configuration were altered. Recommendations are disposition-ready for a follow-up Phase 0 documentation / Phase 1 retirement program.
