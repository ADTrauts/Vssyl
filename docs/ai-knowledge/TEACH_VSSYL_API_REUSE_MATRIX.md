# Teach Vssyl — API Reuse Matrix

**Program:** Teach Vssyl Phase 1A  
**Date:** 2026-07-05

Maps every Teach Vssyl action to **existing** endpoints, services, models, tests, and gaps.

---

## Master API inventory

| Endpoint | Method | Service / handler | Model(s) | Client API | Tests |
|----------|--------|-------------------|----------|------------|-------|
| `/api/ai/memory/facts` | GET | `userMemoryFactController` → `userMemoryFactService` | `UserMemoryFact` | `web/src/api/aiMemoryFacts.ts` | `userMemoryFactService.test.ts`, `ai-memory-routes.integration.test.ts` |
| `/api/ai/memory/facts` | POST | same | same | same | same |
| `/api/ai/memory/facts/:id` | PATCH/DELETE | same | same | same | same |
| `/api/ai/user-context` | GET/POST | `userAIContextController` | `UserAIContext` | `CustomContext.tsx`, `AIMemoriesView.tsx` | `userAIContextLearningService.test.ts` |
| `/api/ai/user-context/:id` | PUT/DELETE | same | same | same | — |
| `/api/ai/user-context/pending` | GET | `getPendingLearnings` | `UserAIContext` | `aiContextLearning.ts` | same |
| `/api/ai/user-context/:id/review` | POST | `reviewPendingLearning` | same | same | same |
| `/api/ai/teach` | POST | inline `ai.ts` | `AILearningEvent` + `UserAIContext` | **None** | — |
| `/api/ai/learning/events` | GET | `personalAILearningEventsService.listForUser` | `AILearningEvent` | `aiLearningEvents.ts` | `personalAILearningEventsService.test.ts` |
| `/api/ai/learning/events/:id/review` | PUT | `reviewEvent` → `learningApplicationService` | same | same | `learningApplicationService.test.ts` |
| `/api/ai/learning/signals` | POST | `userLearningSignalService.recordSignal` | `AILearningEvent` (behavioral) | `aiLearningSignals.ts` (**unwired**) | `userLearningSignalService.test.ts` |
| `/api/ai/learning/what-changed` | GET | `learningApplicationService.getWhatChangedSummary` | — | `aiLearningWhatChanged.ts` | — |
| `/api/ai/feedback` | POST | inline + `recordFeedbackOutcome` | `AIConversationHistory` + behavioral event | **None** | — |
| `/api/ai/twin` | POST | `DigitalLifeTwinService` → `DigitalLifeTwinCore` | reads all stores | `AIChatWorkspace` | many twin/pipeline tests |
| `/api/ai/effective-preferences` | GET | effective preferences preview | — | `buildInfluenceStack.ts` | `PreferenceResolver.test.ts` |
| `/api/business-ai/:id/config` | PUT | `businessAIService.updateBusinessAIControls` | `BusinessAIDigitalTwin` | Business AI CC | — |
| `/api/business-ai/:id/learning-events/:id/review` | PUT | inline `businessAI.ts` | `BusinessAILearningEvent` | Business AI CC | — |

Mount: `server/src/index.ts` — `/api/ai`, `/api/ai/memory/facts`, `/api/business-ai`.

---

## Improve Answer → store routing matrix

| Classification | Primary API | Body highlights | Store | Auto-apply? |
|----------------|-------------|-----------------|-------|-------------|
| **Fact** | `POST /api/ai/memory/facts` | `subject`, `predicate`, `sourceType: explicit_user`, `sourceConversationId?` | `UserMemoryFact` | ✅ Yes |
| **Preference** | `POST /api/ai/user-context` | `contextType: preference`, `learningStatus: active`, `source: user` | `UserAIContext` | ✅ Yes |
| **Instruction / rule** | `POST /api/ai/user-context` | `contextType: instruction` | `UserAIContext` | ✅ Yes |
| **Preference (legacy)** | `POST /api/ai/teach` | `scenario`, `preference`, `reasoning?` | Event + active context | ✅ Yes (creates both) |
| **Ambiguous correction** | **Gap:** need correction create → `PUT .../review` | `eventType: correction`, `newBehavior` | `AILearningEvent` → apply | After review |
| **Module entity** | **No API** — redirect URL | — | Application SoR | N/A |
| **Business policy (admin)** | `PUT /api/business-ai/:id/config` | twin settings | `BusinessAIDigitalTwin` | ✅ Admin only |
| **Business policy (employee)** | `BusinessAILearningEvent` path | — | pending admin | After admin review |

---

## Retrieval → influence path (existing)

| Store | Retrieval service | Loaded in | Assembler block / influence |
|-------|-------------------|-----------|----------------------------|
| `UserMemoryFact` | `MemoryRetrievalService.retrieve` | `DigitalLifeTwinService` → core | "User memory facts (saved by you)" |
| `UserAIContext` (active) | Prisma in `DigitalLifeTwinCore`, `PreferenceResolver` | Core | "User-defined AI context" / preferences |
| Applied `AILearningEvent` | `PreferenceResolver` | Core | Soft prefs / learning items in `responseInfluence` |
| Live modules | `ContextProviderOrchestrator` | Core | Module blocks |

Tests: `memoryRetrieval.test.ts`, `aiMemoryPersonalization.integration.test.ts`, `buildResponseInfluence.test.ts`, `PreferenceResolver.test.ts`.

**Missing test:** End-to-end POST fact → retrieve on probe query (G1).

---

## Journey → API matrix

### 1. Teach personal fact / preference — "I prefer concise responses."

| Layer | Existing |
|-------|----------|
| API | `POST /api/ai/user-context` with `contextType: preference`, `title`, `content` |
| Alt | `POST /api/ai/memory/facts` with `category: preference` |
| Alt | `POST /api/ai/teach` with scenario + preference |
| Service | `userAIContextController`, `userMemoryFactService` |
| Store | `UserAIContext` or `UserMemoryFact` |
| Retrieval | `PreferenceResolver` + `MemoryRetrievalService` |
| UI | `CustomContext`, `AIMemoriesView` — **not chat** |
| Gap | **UI only** + pick one canonical path (prefer `user-context` for preferences per matrix) |

### 2. Teach business policy — "Managers approve overtime."

| Layer | Existing |
|-------|----------|
| API (admin) | `PUT /api/business-ai/:businessId/config` |
| API (employee proposal) | Creates `BusinessAILearningEvent` (via system paths) |
| Review | `PUT .../learning-events/:eventId/review` |
| Apply on approve | **Flags only — no `learningApplicationService`** |
| Gap | **Backend apply gap** + admin UI; **defer Phase 2** |

### 3. Teach vocabulary — "Board Meeting means Executive Meeting."

| Layer | Existing |
|-------|----------|
| API | `POST /api/ai/memory/facts` — `subject: "Board Meeting"`, `predicate: "Means Executive Meeting"` |
| Alt | `POST /api/ai/user-context` — `contextType: fact` or `instruction` |
| Category | `memoryFactTypes` — no `vocabulary` enum; use `other` or `constraint` |
| Gap | **UI + classifier** only |

### 4. Correct hallucination — "This isn't true."

| Layer | Existing |
|-------|----------|
| Explicit fact fix | `POST /api/ai/memory/facts` — immediate |
| Review path | `PUT /api/ai/learning/events/:id/review` after event exists |
| Event create | **No client-facing API** creates `eventType: correction` for review queue |
| Dead path | `LearningEngine.processFeedback` — not wired |
| Gap | **Small route glue** to create reviewable correction + **UI** |

### 5. Teach from document — "This SOP is now our standard."

| Layer | Existing |
|-------|----------|
| Live read | `fileAnalysisService` + Drive `File` on attach |
| Teach summary | `POST /api/ai/memory/facts` — user-confirmed summary only |
| Constitution | **Do not** store full SOP text in memory |
| Gap | **UX copy** + attach flow; optional summary fact API reuse |

### 6. Teach from module — "This task has higher priority."

| Layer | Existing |
|-------|----------|
| SoR | Todo module — edit task priority in UI |
| AI read | `todo.*` context providers on next query |
| Gap | **UI redirect** only — link to `/todo` or task deep link |

### 7. Thumbs-down → review → apply → retrieve

| Step | Existing | Gap |
|------|----------|-----|
| Thumbs down | `POST /api/ai/learning/signals` `feedback_negative` | Creates **behavioral_signal**, not review queue |
| Review | `PUT /api/ai/learning/events/:id/review` | Works for human-reviewable types |
| Apply | `learningApplicationService.applyApprovedEvent` | ✅ For `correction` type |
| Retrieve | `MemoryRetrievalService` | ✅ After apply to fact |
| Feedback API | `POST /api/ai/feedback` | Needs `interactionId` — **not returned in twin response today** |
| Gap | **Glue:** thumbs + user text → `correction` event; optional `conversationHistoryId` in twin metadata |

---

## Reuse decision: new endpoint vs client orchestration

| Approach | Recommendation |
|----------|----------------|
| Client calls memory + context APIs directly | ✅ Default for explicit teach |
| New microservice | ❌ Forbidden |
| New Prisma model | ❌ Forbidden |
| Single `POST /api/ai/learning/corrections` on **existing** `ai.ts` router | ✅ Optional convenience — thin wrapper, not new service |
| Extend `userLearningSignalService` for thumbs + text → correction | ✅ Preferred minimal glue |

---

## Related documents

- [AI_CORRECTION_ROUTING_SPEC.md](./AI_CORRECTION_ROUTING_SPEC.md)
- [KNOWLEDGE_TYPE_TO_STORE_MATRIX.md](./KNOWLEDGE_TYPE_TO_STORE_MATRIX.md)
- [TEACH_VSSYL_PHASE_1_IMPLEMENTATION_PLAN.md](./TEACH_VSSYL_PHASE_1_IMPLEMENTATION_PLAN.md)
