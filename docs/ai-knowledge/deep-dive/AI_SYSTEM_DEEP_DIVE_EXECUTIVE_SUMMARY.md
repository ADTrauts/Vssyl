# AI System Deep Dive — Executive Summary

**Program:** AI System Deep Dive Audit  
**Date:** 2026-07-05  
**Constraint:** Documentation only. No architecture redesign. No Teach Vssyl implementation.

---

## Bottom line

Vssyl does **not** train models. It improves answers through **context engineering**: live module fetches, user-governed memory stores, preference resolution, pipeline policies, and operator governance. The platform already has most backend primitives for teaching — but they are **fragmented across surfaces**, **partially unwired in chat UX**, and **split between user explainability and operator diagnostics**.

**Teach Vssyl is primarily a UX + governance + evaluation problem**, not an architecture problem.

---

## Primary question: How does Vssyl learn, remember, retrieve, reason, ground, and correct?

| Capability | Current state | Maturity |
|------------|---------------|----------|
| **Learn** | Chat inference → pending `UserAIContext`; approved `AILearningEvent` → memory/personality; `remember that` → `UserMemoryFact`; collective patterns (opt-in) | Backend strong; chat UX weak |
| **Remember** | Dual SoR: `UserMemoryFact` + `UserAIContext`; conversation summaries; lexical recall index | Functional; overlapping stores |
| **Retrieve** | `MemoryRetrievalService`, `recallRelevantMessages`, module context providers, unified retrieval capability, pipeline grounding prepass | Strong for operators; opaque to users |
| **Reason** | `conversationReasoningLayer`, `DecisionEngine`, structured response modes, cross-module synthesis | Shipped; limited eval coverage |
| **Ground** | Pipeline intent policies + grounding rules + evidence bundles; orchestrator required-source enforcement | Operator-configured; block/regenerate modes |
| **Correct** | Personal learning review (`/ai` Learning tab); `POST /api/ai/teach`; memory fact CRUD — **no in-chat correction flow** | Designed (`AI_CORRECTION_WORKFLOW.md`); not shipped |

---

## Answers to the ten final questions

### 1. How does Vssyl currently learn?

Through **governed persistence paths**, not model fine-tuning:

1. **Explicit user teaching** — Memory tab CRUD (`UserMemoryFact`, `UserAIContext`), `POST /api/ai/teach`, `remember that` phrase detection.
2. **Chat inference** — `factExtractionService` creates pending `UserAIContext` rows (`learningStatus: pending`) until user promotes via Memories or Learning tab.
3. **Learning events** — Modules and chat create `AILearningEvent` rows; user approves → `learningApplicationService` writes to memory facts, context, or personality profile.
4. **Behavioral signals** — `POST /api/ai/learning/signals` and star ratings store analytics-grade signals; **do not reliably change prompts today**.
5. **Collective learning** (opt-in) — `GlobalLearningEvent` → `GlobalPattern` aggregation for low-priority collective context block.
6. **Business learning** — `BusinessAILearningEvent` with admin approval; application pipeline is weaker than personal.

### 2. How does Vssyl currently remember?

| Store | What it holds | Prompt-eligible when |
|-------|---------------|----------------------|
| `UserMemoryFact` | Structured subject/predicate facts | Always retrieved (scored) |
| `UserAIContext` | Instructions, facts, preferences, workflows | `learningStatus: active` only |
| `AIConversation.threadSummary` / `topics` | Cross-session thread rollup | Included in assembly |
| `AIMessageRecallIndex` | Lexical embeddings of past messages | Explicit recall intent only |
| `AIPersonalityProfile` + `AIAutonomySettings` | Tone, autonomy boundaries | Via `PreferenceResolver` |
| `BusinessAIDigitalTwin` | Business voice, restrictions | When `context.businessId` set |

### 3. How does Vssyl currently retrieve knowledge?

**Three retrieval lanes** merge per turn:

1. **Memory lane** — `MemoryRetrievalService.retrieve()` scores `UserMemoryFact` by query relevance.
2. **Conversation lane** — Same-thread history, cross-thread summaries, semantic recall on intent phrases.
3. **Module lane** — `ContextProviderOrchestrator` fetches live data from `/api/{module}/ai/context/*` based on query analysis, intent policies, and grounding rules.

Plus: attached file analysis, V_Link pipeline context, knowledge composition bundles (operator/diagnostics), unified search retrieval for search-aligned intents.

### 4. How does Vssyl currently decide which context to use?

Decision stack (in order):

1. **Intent inference** — Pipeline catalog + query analysis → intents (`workflow_action`, `local_discovery`, etc.).
2. **Grounding prepass** — Required/optional sources from `AIPipelineGroundingRulePolicy`.
3. **Module matching** — `ModuleAIContextRegistry` keywords/patterns + `@mentions` bypass.
4. **Provider selection plan** — `contextProviderSelection.buildProviderSelectionPlan()` — priority, intent filter, one provider per module, max 4 optional fetches.
5. **Assembly tiering** — `AIContextAssembler` trims low-relevance blocks; conversation continuity favored.
6. **Preference resolution** — `PreferenceResolver` merges personality, autonomy, active context, applied learning events.

### 5. How does Vssyl currently handle corrections?

| Path | Status |
|------|--------|
| User approves `AILearningEvent` (correction type) | **Works** — applies to memory/personality/context |
| User edits Memory tab directly | **Works** |
| `POST /api/ai/teach` | **API exists** — no prominent chat UI |
| In-chat "Improve this answer" / "Teach Vssyl" | **Not implemented** (designed only) |
| Star rating `POST /api/ai/feedback` | **API exists** — no chat UI; stored as behavioral signal, not review queue |
| Business admin learning review | **Partial** — approval flags only |

### 6. What happens when the AI gives a bad answer today?

1. User can open **"Why this answer"** drawer (`responseInfluence` metadata) — explains shaped-by factors, not raw trace.
2. User can navigate to **Memory** or **Learning** tabs manually to fix knowledge.
3. User can **regenerate** (no wired learning signal from regenerate in main chat).
4. **No thumbs down** in main chat; employee assistant has client-only thumbs.
5. Operator can inspect **pipeline diagnostics** if they have admin access and a trace was persisted.
6. **No automatic correction loop** — bad answer does not create a reviewable event unless inference or explicit API call fires.

### 7. What is missing before building Teach Vssyl?

1. **Unified in-chat correction UX** routing to existing stores (design exists in `AI_CORRECTION_WORKFLOW.md`).
2. **Wire feedback APIs** — `/api/ai/feedback`, `/api/ai/learning/signals` to chat UI.
3. **Clarify dual memory SoR** — when to use `UserMemoryFact` vs `UserAIContext` in user-facing flows.
4. **Business learning application** — parity with personal `learningApplicationService`.
5. **Eval loop** — bad answer → correction → golden test case → regression protection (tests exist for pipeline; not for teach loop).
6. **User-visible source catalog** — users don't know what `@mentions`, recall phrases, or modules can provide.
7. **Trace ID bridge** — optional link from user explain drawer to support/operator (not raw trace dump).

### 8. What should be built first?

**Phase 1 — Safe teach loop (minimal):**

1. In-chat **"Teach Vssyl"** on assistant messages → routes to existing APIs per correction classification.
2. Wire **thumbs down** → creates reviewable `AILearningEvent` (not just behavioral signal).
3. Post-teach confirmation with link to Memory/Learning tab.
4. One **golden eval** per correction type (integration test proving approved correction appears in next-turn context).

**Phase 2 — Clarity:**

5. Consolidate Memory tab UX (facts vs context vs pending).
6. Business-admin subset of teach flows for workspace scope.
7. Operator dashboard widget: correction volume + approval latency (reuse pipeline quality stats patterns).

### 9. What should not be touched?

- **`DigitalLifeTwinCore` orchestration spine** — extend, don't rewrite.
- **Pipeline policy registry schema** — operator governance is mature.
- **Module context provider contract** — 35 providers certified; don't break HTTP contract.
- **Provider routing / model catalog** — stable.
- **Personal vs business boundary enforcement** — `businessWorkspaceBoundaries`, tenant scoping.
- **Retired paths** — `/api/centralized-ai/*`, autonomous write routes (410).

### 10. Is the problem architecture, UX, governance, or evaluation?

| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| **UX** | **Primary** | Primitives exist; users can't teach from the moment of failure |
| **Governance** | **Secondary** | Dual memory stores, pending/active consent, business vs personal routing need product rules |
| **Evaluation** | **Secondary** | Strong unit/integration tests; no closed-loop teach regression harness |
| **Architecture** | **Low** | Request lifecycle is coherent; consolidation is naming/UX, not redesign |

---

## Recommended reading order

1. [AI Request Lifecycle](./AI_REQUEST_LIFECYCLE.md) — end-to-end turn flow
2. [AI Knowledge Store Inventory](./AI_KNOWLEDGE_STORE_INVENTORY.md) — what persists
3. [AI Teach Vssyl Implementation Readiness](./AI_TEACH_VSSYL_IMPLEMENTATION_READINESS.md) — phased plan
4. [AI Feedback and Correction Audit](./AI_FEEDBACK_AND_CORRECTION_AUDIT.md) — gap analysis

---

## Related canonical docs (do not duplicate)

- `docs/ai-knowledge/` — Phase 0A reference program
- `memory-bank/aiContextSystem.md` — platform AI context contract
- `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md` — prompt assembly
- `docs/ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md` — retrieval standard

**Audit method:** Codebase exploration of routes, Prisma modules, orchestration services, admin portal pages, frontend AI surfaces, and test suites. No production code modified.
