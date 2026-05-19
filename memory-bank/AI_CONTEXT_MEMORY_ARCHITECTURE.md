# AI Context and Memory Architecture

**Status:** Implemented May 2026 (Phases 1–5 of architecture map).

## Layers

| Layer | Implementation |
|-------|----------------|
| Module registry + live fetch | `ModuleAIContextService`, wired into `AIContextAssembler` via `moduleContexts` |
| Cross-module snapshot | `CrossModuleContextEngine` + installation-based `activeModules` |
| Same-thread continuity | `conversationContinuity.ts`, `AIMessage.metadata`, last 20 messages |
| Cross-thread summaries | `AIConversation.threadSummary`, `topics` JSON, `/api/ai-conversations/memory/*` |
| Semantic recall | `AIMessageRecallIndex` + `aiMessageRecallService` (recall-intent queries) |
| User memory facts | `UserMemoryFact` + `/api/ai/memory/facts` |

## Twin entry

`DigitalLifeTwinService` loads conversation history, recent thread summaries, recalled messages, and memory facts, then `DigitalLifeTwinCore` assembles context for providers.

## Analytics alignment

`AIConversationHistory.sessionId` uses `conversationId` when present on twin requests.

## Related

- `memory-bank/aiContextSystem.md`
- `docs/plans/AI_CONVERSATIONAL_CONTINUITY_AND_RENDERING_SOURCE_OF_TRUTH.md`
