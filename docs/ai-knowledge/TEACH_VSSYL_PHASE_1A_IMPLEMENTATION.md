# Teach Vssyl — Phase 1A Implementation

**Status:** Shipped (personal knowledge loop)  
**Constitution:** `docs/ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md`  
**Architecture:** Frozen — no new services, schemas, or Knowledge Graph.

## What shipped

End-to-end **Improve answer → Teach Vssyl → classification → save → confirmation** on assistant chat messages, scoped to **personal** learning only.

| Classification | Route | Store |
|----------------|-------|-------|
| Fact | `POST /api/ai/memory/facts` | `UserMemoryFact` |
| Preference | `POST /api/ai/user-context` | `UserAIContext` (`contextType: preference`, `learningStatus: active`) |
| Vocabulary | `POST /api/ai/memory/facts` | `UserMemoryFact` (subject/predicate from “X means Y”) |

Retrieval uses existing **MemoryRetrievalService → Digital Life Twin → AIContextAssembler** paths; no new backend glue.

## Files changed

### Frontend

- `web/src/components/ai/TeachVssylModal.tsx` — modal (form + confirmation)
- `web/src/components/ai/AIChatWorkspace.tsx` — “Improve answer” entry point
- `web/src/api/teachVssyl.ts` — orchestrates existing POST APIs
- `web/src/lib/teachVssylParser.ts` — subject/predicate parsing for facts/vocabulary
- `web/src/api/aiMemoryFacts.ts` — optional `sourceConversationId` on create

### Tests

- `server/src/ai/knowledge/__tests__/teachVssylPhase1.integration.test.ts` — G1–G4
- `web/src/lib/__tests__/teachVssylParser.test.ts` — parser unit tests

## Gate tests (G1–G4)

| Gate | Assertion |
|------|-----------|
| G1 | Taught fact retrieved on related query (`MemoryRetrievalService`) |
| G2 | Taught preference appears in assembled user-defined context block |
| G3 | Vocabulary fact retrieved on term query |
| G4 | Duplicate subject+predicate returns existing fact (`createUserMemoryFact`) |

## Constitution principles

- **P3 Explicit over inferred** — user selects chip and text; auto-applies to active stores.
- **P11 Assemble, don’t duplicate** — routes to SoR tables only; twin assembles at read time.
- **P13 Plain language** — confirmation shows scope, storage type, and effect.
- **D1 Route, don’t reinvent** — existing memory and user-context APIs only.

## Out of scope (later phases)

Business learning, thumbs-down, Knowledge Health, Knowledge Explorer, document/module teaching.

## Success scenario

1. User opens **Improve answer** on an assistant message.
2. Enters “My favorite dashboard is Operations”, selects **Fact**, saves.
3. Confirmation: Personal / Fact / will influence future conversations.
4. Next chat turn: twin retrieval includes `Favorite dashboard → Operations`.
