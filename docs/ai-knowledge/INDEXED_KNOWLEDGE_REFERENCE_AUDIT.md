# Indexed Knowledge & Retrieval Reference Audit

**Program:** Indexed Knowledge & Retrieval Audit  
**Date:** 2026-07-06  
**Status:** Implementation verification — documentation only  
**Authority:** [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md)

---

## Executive answer

**Does Vssyl already build sufficient indexes and retrieval structures for AI reasoning?**

**Yes — for the constitutional model.** Vssyl implements **federated retrieval**: Applications remain Systems of Record (SoR); AI reads through **visibility services**, **context providers**, **unified search**, **relationship stores**, and **small derivative AI indexes** (taught facts, message recall, conversation rollups). There is **no** monolithic knowledge database and **no** file-content vector index.

**Would additional indexing architecture be required?**

**Not for the Knowledge Engine core.** Additional indexing is **optional and gap-specific** — primarily **persistent file-body search/OCR index** if product requires “find anything inside my uploads” without attaching files to each chat turn. See [KNOWLEDGE_ENGINE_RETRIEVAL_VALIDATION.md](./KNOWLEDGE_ENGINE_RETRIEVAL_VALIDATION.md).

---

## Three-category classification (every source)

| Category | Definition | Examples |
|----------|------------|----------|
| **1. Durable Knowledge** | User- or admin-taught records that persist across turns and influence prompts until deleted | `UserMemoryFact`, active `UserAIContext`, `BusinessAIDigitalTwin` policy JSON, applied `AILearningEvent` outcomes |
| **2. Indexed Knowledge** | Application-owned information with a **queryable derivative** (DB row, recall index, rollup field) used for discovery | `AIMessageRecallIndex`, `AIConversation.threadSummary` / `topics`, unified search hits over module tables, `VLink` + `VLinkEntity` rows |
| **3. Live Context** | Ephemeral per-turn reads from SoR with no durable AI copy of entity payloads | Module context providers, `fileAnalysisService` extraction, geolocation, pipeline grounding fetches, Context Graph bundles, knowledge composition output |

**Rule:** Entity attributes (file bytes, event times, task titles in SoR) are **Live Context** when fetched per turn. Copying a **user statement** into `UserMemoryFact` is **Durable Knowledge**. Scanning `AIMessage` into `AIMessageRecallIndex` is **Indexed Knowledge** (derivative of AI chat SoR).

---

## Per-system audit (10 questions each)

### Drive

| # | Answer |
|---|--------|
| 1. What is indexed? | **Filename only** for search (`File.name` `contains`). No file-body index. Attached files: on-demand text/OCR via `fileAnalysisService` (ephemeral). |
| 2. Where stored? | SoR: `File` / `Folder` (Postgres) + GCS/local bytes. No extracted-text column. |
| 3. SoR owner | Drive module |
| 4. Retrieval owner | `driveVisibilityService` (search + AI attach), `searchProviderRegistry.searchDrive`, `drive.*` context providers |
| 5. AI discovery | Provider `drive.recent_files` (orchestrator); grounding source `drive_files`; unified search; attachment path in `DigitalLifeTwinCore` |
| 6. Live? | **Yes** — providers and search query Postgres at request time |
| 7. Copied to AI memory? | **No** entity copy. User may teach facts about files via Teach Vssyl |
| 8. Context assembly? | **Yes** — `Module live context: Drive` blocks; attachment summaries in twin core |
| 9. Permissions? | **Yes** — owner/share + `FILE_READ` Policy Engine per file |
| 10. User expects searchable? | **Yes** — global search finds files by name; **not** by document content |

**Category:** Live Context (providers, attach analysis); Indexed Knowledge (filename search only).

---

### Chat (user-to-user module)

| # | Answer |
|---|--------|
| 1. What is indexed? | `Message.content`, `Conversation.name` for unified search (`searchAccessibleChat`) |
| 2. Where stored? | Chat module tables |
| 3. SoR owner | Chat module |
| 4. Retrieval owner | `chatVisibilityService`, `chat.*` providers |
| 5. AI discovery | `chat.recent_conversations`, `unread_messages`, `conversation_history` (requires `conversationId`) |
| 6. Live? | **Yes** |
| 7. Copied to AI memory? | **No** automatic copy to `UserMemoryFact` |
| 8. Context assembly? | **Yes** |
| 9. Permissions? | **Yes** — participant + `CHAT_CONVERSATION_READ` |
| 10. User expects searchable? | **Yes** — global search |

**Category:** Live Context (+ Indexed Knowledge for search `contains` on messages).

**Note:** AI twin chat (`AIConversation` / `AIMessage`) is a **separate SoR** — see Recall Index below.

---

### Calendar

| # | Answer |
|---|--------|
| 1. What is indexed? | Title, description, location in unified search; providers return scheduled events |
| 2. Where stored? | Calendar `Event` / `Calendar` tables |
| 3. SoR owner | Calendar module |
| 4. Retrieval owner | `calendarVisibilityService`, `calendar.*` providers |
| 5. AI discovery | `calendar.today_events`, `upcoming_events`, `availability`; grounding `calendar` |
| 6. Live? | **Yes** — recurrence expanded at read time |
| 7. Copied to AI memory? | **No** |
| 8. Context assembly? | **Yes** |
| 9. Permissions? | **Yes** — `CALENDAR_*` policy actions |
| 10. User expects searchable? | **Yes** |

**Category:** Live Context (+ Indexed Knowledge via search).

---

### Tasks (Todo)

| # | Answer |
|---|--------|
| 1. What is indexed? | Title, description in unified search |
| 2. Where stored? | `Task` table |
| 3. SoR owner | Todo module |
| 4. Retrieval owner | `todoVisibilityService`, `todo.*` providers |
| 5. AI discovery | `task_overview`, `upcoming_tasks`, `overdue_tasks`, `priority_tasks` |
| 6. Live? | **Yes** |
| 7. Copied to AI memory? | **No** |
| 8. Context assembly? | **Yes** |
| 9. Permissions? | **Yes** — dashboard scope + todo policies |
| 10. User expects searchable? | **Yes** |

**Category:** Live Context. **Gap:** `searchTasksForAI` exists but is **unused** (orphan).

---

### Notes / Notebook

| # | Answer |
|---|--------|
| 1. What is indexed? | Title + **body** in unified search (`searchAccessiblePages`); AI providers return **metadata only** (title, tags, pinned — no body) |
| 2. Where stored | Notes `Note` / page tables |
| 3. SoR owner | Notes module (notebook delegates) |
| 4. Retrieval owner | `notesVisibilityService`, `notes.*` / `notebook.*` providers |
| 5. AI discovery | Providers + unified search (when retrieval discovery enabled) |
| 6. Live? | **Yes** |
| 7. Copied to AI memory? | **No** |
| 8. Context assembly? | **Yes** (metadata blocks); full text via search retrieval path only |
| 9. Permissions? | **Yes** — `createdById`, `dashboardId` |
| 10. User expects searchable? | **Yes** — search includes content; AI skim provider does not |

**Category:** Live Context (providers); Indexed Knowledge (search on content).

---

### Business records (HR, Scheduling, Workforce Comms)

| # | Answer |
|---|--------|
| 1. What is indexed? | Module-specific fields in unified search via visibility services |
| 2. Where stored? | Respective module tables |
| 3. SoR owner | HR, Scheduling, Workforce Comms modules |
| 4. Retrieval owner | Module AI context controllers + search providers |
| 5. AI discovery | `hr.*`, `scheduling.*`, `workforce_comms.*` providers; `business_context` platform source for **policy** not entity rows |
| 6. Live? | **Yes** |
| 7. Copied to AI memory? | **No** entity copy; business policies in `BusinessAIDigitalTwin` are **Durable Knowledge** |
| 8. Context assembly? | **Yes** |
| 9. Permissions? | **Yes** — `businessMember` + module policies |
| 10. User expects searchable? | **Yes** (admin/employee scope) |

**Category:** Live Context for entities; Durable Knowledge for twin policy JSON.

---

### Unified Search (`POST /api/search`)

| # | Answer |
|---|--------|
| 1. What is indexed? | **Nothing centrally** — fans out to 13+ providers, each `contains` on SoR tables |
| 2. Where stored? | N/A (orchestrator only) |
| 3. SoR owner | Each module |
| 4. Retrieval owner | `searchCapabilityService.executeGlobalSearch` |
| 5. AI discovery | `aiRetrievalCapabilityService.discover()` when pipeline retrieval flags enabled |
| 6. Live? | **Yes** — every query hits source tables |
| 7. Copied to AI memory? | **No** |
| 8. Context assembly? | **Yes** — via `buildRetrievalContextPatch` → `moduleContexts` patch |
| 9. Permissions? | **Yes** — `SEARCH_READ` + per-hit module policy |
| 10. User expects searchable? | **Yes** — primary global search UX |

**Category:** Indexed Knowledge (per-module DB text match) orchestrated as Live Context at AI time.

**Stub:** `searchIndexDomainEventSubscriber` — logs only; no index writes (`DOMAIN_EVENT_SEARCH_INDEX_SUBSCRIBER_ENABLED`).

---

### V_Link

| # | Answer |
|---|--------|
| 1. What is indexed? | `VLink`, `VLinkEntity` (confirmed links), `VLinkMember`; search on title + `publicCode` |
| 2. Where stored? | `prisma/modules/platform/vlink.prisma` |
| 3. SoR owner | V_Link platform layer (user-curated relationships) |
| 4. Retrieval owner | `vlinkService`, `vlinkPipelineContextService`, Context Graph adapters, `searchVLinksForUser` |
| 5. AI discovery | Pipeline sources `vlink`, `graph_bundle`; provider `vlink.recent_vlinks`; query signals `VL-XXXXXX` |
| 6. Live? | **Yes** for hydration; relationships **persisted** |
| 7. Copied to AI memory? | **No** — relationship metadata stays in V_Link tables |
| 8. Context assembly? | **Yes** |
| 9. Permissions? | **Yes** — membership + `vlinkEntityResolverService` per attachment |
| 10. User expects searchable? | **Yes** |

**Category:** Indexed Knowledge (relationship store) + Live Context (hydrated entity snapshots).

**V_Link is NOT a knowledge graph** — it is the **authoritative relationship metadata store**. See [RETRIEVAL_ARCHITECTURE.md](./RETRIEVAL_ARCHITECTURE.md).

---

### Context Graph

| # | Answer |
|---|--------|
| 1. What is indexed? | **Nothing persisted** — ephemeral bundles from V_Link + module adapters |
| 2. Where stored? | Per-request only (`ContextBundleDescriptor`) |
| 3. SoR owner | Underlying modules + V_Link |
| 4. Retrieval owner | `bundleResolver`, `graphBundlePipelineContextService` |
| 5. AI discovery | Pipeline catalog source `graph_bundle` |
| 6. Live? | **Yes** |
| 7. Copied to AI memory? | **No** |
| 8. Context assembly? | **Yes** |
| 9. Permissions? | **Yes** — `permissionResolver` omits denied nodes |
| 10. User expects searchable? | **No** — internal AI path |

**Category:** Live Context (federated retrieval graph).

---

### Platform Entity Registry

| # | Answer |
|---|--------|
| 1. What is indexed? | **Entity type descriptors** only (moduleId, entityType, vlink mapping) |
| 2. Where stored? | In-memory `Map` at startup (`registerPlatformEntities.ts`) |
| 3. SoR owner | Platform metadata |
| 4. Retrieval owner | N/A — **no production runtime consumers** found outside tests |
| 5. AI discovery | **Not wired** |
| 6. Live? | Static catalog |
| 7. Copied to AI memory? | **No** |
| 8. Context assembly? | **No** |
| 9. Permissions? | N/A |
| 10. User expects searchable? | **No** |

**Category:** N/A (type catalog, not intelligence source).

---

### Context Provider Orchestrator

| # | Answer |
|---|--------|
| 1. What is indexed? | Provider **metadata** in `ModuleAIContextRegistry`; per-user **cache** in `ModuleInstallation.contextProviderCache` |
| 2. Where stored? | Postgres registry + installation cache JSON |
| 3. SoR owner | Platform (registry); module data remains in modules |
| 4. Retrieval owner | `ContextProviderOrchestrator.orchestrateContextRetrieval` |
| 5. AI discovery | Query analysis → provider plan → HTTP fetch to module `/api/*/ai/context/*` |
| 6. Live? | **Yes** (with TTL cache) |
| 7. Copied to AI memory? | **No** |
| 8. Context assembly? | **Yes** — primary `moduleContexts` input |
| 9. Permissions? | **Yes** — JWT to module endpoints; module visibility services |
| 10. User expects searchable? | **Indirect** — users expect AI to “know my calendar”; providers supply that |

**Category:** Live Context orchestration. **Acts as module retrieval engine** — see validation doc.

---

### Memory Retrieval Service

| # | Answer |
|---|--------|
| 1. What is indexed? | `UserMemoryFact` rows |
| 2. Where stored? | `user_memory_facts` |
| 3. SoR owner | AI knowledge layer (taught facts) |
| 4. Retrieval owner | `MemoryRetrievalService` |
| 5. AI discovery | Every twin turn; pipeline source `user_memory` |
| 6. Live? | **Index read** (lexical scoring, not vector DB) |
| 7. Copied to AI memory? | **Is** the durable taught store |
| 8. Context assembly? | **Yes** — explicit + inferred fact blocks |
| 9. Permissions? | **Yes** — `userId` + scope (`personal` / `business`) |
| 10. User expects searchable? | **Yes** — via Knowledge tab / teach |

**Category:** **Durable Knowledge**

---

### Recall Index (`AIMessageRecallIndex`)

| # | Answer |
|---|--------|
| 1. What is indexed? | AI twin message snippets + bag-of-words `embedding` JSON |
| 2. Where stored? | `ai_message_recall_index` |
| 3. SoR owner | `AIMessage` (AI chat); index is derivative |
| 4. Retrieval owner | `aiMessageRecallService.recallRelevantMessages` |
| 5. AI discovery | Recall-intent queries only (`hasExplicitRecallIntent`) |
| 6. Live? | **Index read** |
| 7. Copied? | **Yes** — derivative index from messages |
| 8. Context assembly? | **Yes** — “Recalled prior messages” block |
| 9. Permissions? | **Yes** — `userId`, optional tenant filters |
| 10. User expects searchable? | **Partially** — magic recall phrases, not advertised |

**Category:** **Indexed Knowledge**

---

### Conversation thread memory

| # | Answer |
|---|--------|
| 1. What is indexed? | `AIConversation.threadSummary`, `topics` JSON |
| 2. Where stored? | `AIConversation` row |
| 3. SoR owner | AI conversations |
| 4. Retrieval owner | `aiConversationMemoryService` |
| 5. AI discovery | Platform source `recent_conversations` |
| 6. Live? | **Rollup written** after assistant turns (deterministic) |
| 7. Copied? | **Yes** — summary fields on conversation |
| 8. Context assembly? | **Yes** |
| 9. Permissions? | **Yes** — user + tenant scope |
| 10. User expects searchable? | **Low** — continuity feature |

**Category:** **Indexed Knowledge**

---

### File Analysis (OCR / vision / chunking)

| # | Answer |
|---|--------|
| 1. What is indexed? | **Nothing persisted** |
| 2. Where stored? | Ephemeral in request (`FileAnalysisResult`, vision parts) |
| 3. SoR owner | Drive file bytes |
| 4. Retrieval owner | `fileAnalysisService` (called from `DigitalLifeTwinCore`) |
| 5. AI discovery | User attaches files to AI chat |
| 6. Live? | **Yes** — extract on demand (PDF text, tesseract OCR fallback, officeparser, vision) |
| 7. Copied to AI memory? | **No** — unless user teaches a fact |
| 8. Context assembly? | **Yes** — attachment summaries in prompt |
| 9. Permissions? | `fetchAccessibleActiveFiles` + drive read policy |
| 10. User expects searchable? | **Often yes** — **gap**: no cross-session file-body search |

**Category:** **Live Context**

**OCR exists:** `tryPdfOcrFallback` (tesseract), image path in `extractTextFromBuffer`. **Not stored.**

---

### Embeddings

| System | Embedding type | Persisted? |
|--------|----------------|------------|
| Drive files | None | No |
| Unified search | None | No |
| `AIMessageRecallIndex` | Bag-of-words 28-dim (`simpleTextEmbedding.ts`) | Yes |
| `SemanticSimilarityEngine` | Same style on `AIConversationHistory` | Process cache only |
| `UserMemoryFact` | Lexical scoring only | No vector column |

**No** pgvector, Pinecone, or file embedding pipeline in repo.

---

### Knowledge composition (`server/src/knowledge/`)

| # | Answer |
|---|--------|
| 1. What is indexed? | Composes **governed bundles** from Context Graph output + memory facts |
| 2. Where stored? | Ephemeral; 30s neighborhood cache when enabled |
| 3. SoR owner | Underlying graph + modules |
| 4. Retrieval owner | `knowledgeCompositionOrchestrator` |
| 5. AI discovery | `KNOWLEDGE_COMPOSITION_ENABLED=true` + `project_assistant` pilot |
| 6. Live? | **Yes** |
| 7. Copied to AI memory? | **No** |
| 8. Context assembly? | **Yes** — optional patch |
| 9. Permissions? | Inherited from graph |
| 10. User expects searchable? | **No** |

**Category:** Live Context (governed derivation).

---

## Gaps summary

| Gap | Severity | Notes |
|-----|----------|-------|
| No file-body search index | **High** for “search inside PDFs” UX | OCR runs only on attach |
| `searchIndexDomainEventSubscriber` stub | Medium | Federated search v2 not built |
| Notes provider omits body | Medium | Search path has content; provider does not |
| Unified search → AI behind flags | Medium | `AI_RETRIEVAL_*_ENABLED` env gates |
| Platform Entity Registry unused | Low | Type catalog only |
| `searchTasksForAI` orphan | Low | Dead code path |

## Redundancies (intentional overlap)

| Overlap | Why it exists |
|---------|----------------|
| V_Link flat pipeline + Context Graph bundles | Flat list for grounding; graph for bounded multi-hop |
| `entityLinking` inference + persisted V_Link | Ephemeral cross-module hints vs confirmed links |
| Chat module vs AI twin memory | Different SoRs (user chat vs twin chat) |
| Notebook providers → Notes/Todo | UI module split; same backends |

---

## Related documents

- [RETRIEVAL_ARCHITECTURE.md](./RETRIEVAL_ARCHITECTURE.md) — canonical flow map  
- [APPLICATION_INTELLIGENCE_MODEL.md](./APPLICATION_INTELLIGENCE_MODEL.md) — per-application contribution  
- [KNOWLEDGE_ENGINE_RETRIEVAL_VALIDATION.md](./KNOWLEDGE_ENGINE_RETRIEVAL_VALIDATION.md) — orchestrator + constitution verdict
