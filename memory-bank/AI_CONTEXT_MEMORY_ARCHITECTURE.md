# AI Context and Memory Architecture

**Status:** Implemented and hardened May 2026.

**Commits:** `8432ed83` (initial wire) → `297f4ffc` (production reliability pass).

## Layers

| Layer | Implementation | Notes |
|-------|----------------|-------|
| Module registry + live fetch | `ModuleAIContextService`, `moduleContexts` in `AIContextAssembler` | Conversation mode: assembler only; enterprise also gets legacy prompt `MODULE LIVE CONTEXT` |
| Cross-module snapshot | `CrossModuleContextEngine` + installation-based `activeModules` | |
| Same-thread continuity | `conversationContinuity.ts`, `AIMessage.metadata`, last 20 messages | `refreshConversationThreadMemory` on assistant save |
| Cross-thread summaries | `AIConversation.threadSummary`, `topics` JSON | APIs: `GET /api/ai-conversations/memory/recent`, `/memory/topics` |
| Semantic recall | `AIMessageRecallIndex` + `aiMessageRecallService` | Gated by `hasExplicitRecallIntent`; scored via `combinedRecallScore` |
| User memory facts | `UserMemoryFact` + `/api/ai/memory/facts` | Recall queries: top confidence facts even without keyword overlap (cap 5) |

## Twin entry flow

```
POST /api/ai/twin
  → DigitalLifeTwinService
      → conversation history (sessionId = conversationId when present)
      → getRecentConversationMemory (other threads)
      → recallRelevantMessages (if recall intent)
      → getRelevantUserMemoryFacts (recall-biased when intent)
  → DigitalLifeTwinCore.processAsDigitalTwin
      → CrossModuleContextEngine (moduleContexts)
      → assembleAIContext
  → Providers (buildProviderUserPrompt uses assembledContext — not user-visible)
```

## Recall intent

**File:** `server/src/ai/utils/recallIntent.ts`

Triggers include: “we last talked”, “what were we talking about”, “what did we say about”, “continue our trip planning”, “that vacation/trip”, “those places you mentioned”, “where were we”, “what were the options”, “do you remember”, plus travel follow-ups with topic references.

## Recall scoring and fallbacks

**File:** `server/src/ai/utils/recallScoring.ts`

- `combinedRecallScore`: max of bag-of-words cosine similarity and keyword overlap (travel terms boosted).
- Recall queries: `RECALL_INTENT_MIN_SIMILARITY = 0.08` (vs `0.28` default).
- If no rows pass threshold but recall intent is set: travel-related indexed snippets returned at fixed low score.

## Indexing

| When | How |
|------|-----|
| New messages | `aiConversationController.addMessage` → `indexAIMessageForRecall` |
| Historical | `pnpm --filter vssyl-server backfill:ai-recall-index` (`backfillAIMessageRecallIndex` — idempotent, logs indexed/skipped/errors) |

## Assembler blocks (private context)

| Block title | When |
|-------------|------|
| Recent conversations (other threads) | `threadSummary` present on other threads |
| Recent conversation topics (other threads) | `threadSummary` missing but `topics` JSON present |
| Recalled prior messages (semantic) | `recalledMessages` non-empty after recall query |
| User memory facts | Relevant or recall-biased facts |
| Module live context | `moduleContexts` from installed modules |

## Data model (Prisma modules)

- `prisma/modules/ai/conversations.prisma` — `AIConversation.threadSummary`, `topics`
- `prisma/modules/ai/message-recall.prisma` — `AIMessageRecallIndex`
- `prisma/modules/ai/user-memory.prisma` — `UserMemoryFact`

**Migrations:**
- `20260518120000_ai_conversation_thread_memory`
- `20260518120100_user_memory_facts`
- `20260518120200_ai_message_recall_index`

## Tests

- `server/src/services/__tests__/aiMemoryRecall.integration.test.ts` — index, recall, assembler, backfill idempotency
- `server/src/routes/__tests__/ai-memory-routes.integration.test.ts` — memory/recent, memory/topics, facts CRUD
- `server/src/ai/utils/__tests__/recallIntent.test.ts`
- `server/src/ai/context/__tests__/recallContextAssembly.test.ts`

## User memory facts (Phase 1B)

Structured facts in `UserMemoryFact` carry provenance separate from freeform `UserAIContext`:

| Field | Values / notes |
|-------|----------------|
| `sourceType` | `explicit_user` \| `remember_that` \| `inferred_chat` \| `questionnaire` \| `import` |
| `category` | `preference` \| `person` \| `project` \| `constraint` \| `location` \| `other` (auto-inferred on create when omitted) |
| `isExplicit` | User-authored or remember-that vs inferred |
| `sourceConversationId` / `sourceMessageId` | Set on remember-that path |

**When to use which model:** discrete subject+predicate facts → `UserMemoryFact`; long instructions / promoted learning → `UserAIContext` (`contextType: preference`).

**Code:** `server/src/ai/memory/memoryFactTypes.ts`, `MemoryRetrievalService.ts`, `userMemoryFactService.ts`  
**Migration:** `20260521180000_user_memory_fact_provenance`

### Retrieval (Phase 1C)

Single entry: `memoryRetrievalService.retrieve()` — scoring (`confidence × recency × lexical × scope`), recall bias, inferred confidence floor (0.55), predicate char budget (600). Emits `memoryRetrievalReport` on twin context for pipeline trace (`factsLoaded`, `factsInfluenced`, `influencedFactIds` — no raw predicates in logs). `PreferenceResolver` consumes pre-retrieved facts from Service (no duplicate query on twin path).

## Analytics alignment

`AIConversationHistory.sessionId` uses `conversationId` when present on twin requests.

## Product constraints (preserved)

- Casual conversation answers stay lean — no noisy cross-module dumps in conversation profile.
- Enterprise / analytical modes unchanged.
- Memory mechanics are not cited to end users (“based on your memory index” etc.).

## Related

- `memory-bank/aiContextSystem.md` — module AI context + twin pipeline
- `memory-bank/activeContext.md` — current focus
- `docs/plans/AI_CONVERSATIONAL_CONTINUITY_AND_RENDERING_SOURCE_OF_TRUTH.md` — continuity UX
- `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md` — Control Center preferences path
