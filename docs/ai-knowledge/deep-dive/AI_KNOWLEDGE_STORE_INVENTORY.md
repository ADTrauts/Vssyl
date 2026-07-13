> **HISTORICAL DOCUMENT**  
> This document reflects an earlier stage of the AI architecture (deep-dive audit, 2026-07-05).  
> For the **current** architecture, see:  
> - [`docs/ai-system-audit/README.md`](../../ai-system-audit/README.md) — official System Audit  
> - [`docs/architecture/AI_SYSTEM_MENTAL_MODEL.md`](../../architecture/AI_SYSTEM_MENTAL_MODEL.md) — mental model  
> - [`docs/architecture/AI_READING_GUIDE.md`](../../architecture/AI_READING_GUIDE.md) — reading order  
> - [`docs/architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md`](../../architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md) — agent navigation  

---

# AI Knowledge Store Inventory

**Program:** AI System Deep Dive Audit  
**Date:** 2026-07-05

Complete inventory of persistent and semi-persistent stores that influence AI behavior. Schema sources: `prisma/modules/ai/*.prisma` (generated root: `prisma/schema.prisma`).

---

## Summary matrix

| Store | Scope | User editable | Operator editable | Prompt influence | Overlap risk |
|-------|-------|---------------|-------------------|------------------|--------------|
| `UserMemoryFact` | personal/business/household | Yes | No | High — retrieved every turn | vs `UserAIContext` |
| `UserAIContext` | personal/business/module/folder/project | Yes (promote pending) | No | High — active rows only | vs memory facts |
| `AILearningEvent` | personal (+ businessId in metadata) | Review only | No | Medium — when applied+validated | vs pending context |
| `GlobalLearningEvent` / `GlobalPattern` | platform (consent) | Opt-in only | Platform | Low — collective block | vs personal learning |
| `AIPersonalityProfile` | personal | Yes | No | High — preference resolver | vs UserAIContext preference |
| `AIAutonomySettings` | personal | Yes | No | High — action boundaries | — |
| `AIConversation` / `AIMessage` | personal (+ optional business) | Yes (chat) | No | High — same-thread + summaries | vs `AIConversationHistory` |
| `AIMessageRecallIndex` | personal | No (auto) | No | Medium — recall intent only | vs thread summaries |
| `AIConversationHistory` | personal | Feedback fields | Read via diagnostics | Indirect — analytics | vs chat tables |
| `BusinessAIDigitalTwin` | business | Business admin | Platform read | High in business chat | vs `Business.aiSettings` |
| `BusinessAILearningEvent` | business | Admin approve | No | Medium — weak apply | vs personal learning |
| `ModuleAIContextRegistry` | platform | No | Admin sync | High — routing | vs pipeline sources |
| `AIPipeline* policies` | platform | No | Admin CRUD | High — retrieval gating | vs registry |
| `UserAIContextCache` | personal | No | No | Intended medium | **Unimplemented writes** |
| `AISuggestion` | personal | Dismiss/accept | No | Low — ambient | separate from teach |

---

## Tier 1 — User-governed long-term memory

### UserMemoryFact

**Schema:** `prisma/modules/ai/user-memory.prisma`  
**Table:** `user_memory_facts`

| Field | Purpose |
|-------|---------|
| `subject`, `predicate` | Structured fact body |
| `scope`, `businessId`, `dashboardId` | Tenant isolation |
| `sourceType` | `explicit_user`, `remember_that`, `inferred_chat`, `questionnaire`, `import` |
| `confidence`, `isExplicit` | Retrieval scoring |
| `expiresAt`, `trashedAt` | Lifecycle |

**Services:** `userMemoryFactService.ts`, `MemoryRetrievalService.ts`, `memoryContextInjection.ts`  
**API:** `GET/POST/PATCH/DELETE /api/ai/memory/facts`  
**UI:** `/ai?tab=memory` → `AIMemoriesView`

**Prompt path:** `MemoryRetrievalService.retrieve()` → explicit block + inferred block (confidence-gated) in `AIContextAssembler`. Also fed to `pipelineGroundingRetrieval` source `user_memory`.

**Conflict/staleness:** User can edit/delete; trashed excluded; optional `expiresAt`. No automatic dedup against `UserAIContext`.

---

### UserAIContext

**Schema:** `prisma/modules/ai/ai-models.prisma`  
**Table:** `user_ai_context`

| Field | Purpose |
|-------|---------|
| `contextType` | `instruction`, `fact`, `preference`, `workflow` |
| `scope`, `scopeId`, `moduleId` | Scoping |
| `learningStatus` | `active`, `pending`, `dismissed` |
| `source` | `user` or `conversation` (inferred) |

**Services:** `userAIContextController.ts`, `userAIContextLearningService.ts`, `factExtractionService.ts`  
**API:** `/api/ai/user-context/*`, `/api/ai/user-context/pending`, `/:id/review`  
**UI:** Memory tab (`CustomContext`), Learning hub (pending review)

**Prompt eligibility:** Only `learningStatus: active` via `promptEligibleContextWhere`. Pending rows require user promotion — consent model for inferred learning.

**Overlap:** Semantically duplicates `UserMemoryFact` for fact-type entries. Product should route declarative facts to memory facts, instructions/preferences to context.

---

## Tier 2 — Learning and collective intelligence

### AILearningEvent

**Schema:** `prisma/modules/ai/ai-models.prisma`  
**Table:** `ai_learning_events`

| Field | Purpose |
|-------|---------|
| `eventType` | `correction`, `feedback`, `preference_update`, `reinforcement`, `pattern_recognition`, `behavioral_signal` |
| `oldBehavior`, `newBehavior` | Correction payload |
| `applied`, `validated` | Application state |
| `sourceModule` | Provenance |

**Services:** `personalAILearningEventsService.ts`, `learningApplicationService.ts`, `AdvancedLearningEngine.ts`  
**API:** `GET /api/ai/learning/events`, `PUT .../:eventId/review`, `POST /api/ai/learning/signals`, `POST /api/ai/teach`  
**UI:** `/ai?tab=learning` → `PersonalLearningEventsReview`

**On approve:** `learningApplicationService.applyApprovedEvent` routes to:
- Corrections → `UserMemoryFact`
- Preferences → `UserAIContext`
- Traits → `AIPersonalityProfile.personalityData`

**Behavioral signals:** Auto-marked applied+validated; **not in review queue**; limited prompt effect today.

---

### GlobalLearningEvent / GlobalPattern / CollectiveInsight

**Scope:** Platform, anonymized (`hashed userId`)  
**Consent:** `userAllowsCollectiveLearning` check in twin  
**Prompt:** Low-priority `"Collective learning patterns"` block when opted in  
**UI:** Buried in `/ai` → More → Insights  
**Editable:** Platform operator only

---

### SystemConfiguration

**Table:** `system_configuration`  
**Use:** AI learning config key-value JSON  
**Owner:** Platform via `CentralizedLearningEngine`

---

## Tier 3 — Conversation memory

### AIConversation / AIMessage

**Schema:** `prisma/modules/ai/conversations.prisma`

| Model | Memory fields |
|-------|---------------|
| `AIConversation` | `threadSummary`, `topics` (JSON), `businessId`, `dashboardId` |
| `AIMessage` | `content`, `role`, `metadata`, `attachments` |

**Services:** `aiConversationController.ts`, `aiConversationMemoryService.ts`  
**API:** `/api/ai-conversations/*`  
**UI:** `/ai-chat`

**Prompt influence:** Same-thread messages in provider history; cross-session via `getRecentConversationMemory` and summary blocks.

---

### AIMessageRecallIndex

**Schema:** `prisma/modules/ai/message-recall.prisma`  
**Embedding:** JSON array bag-of-words — **not pgvector**

**Services:** `aiMessageRecallService.ts`  
**Trigger:** Indexed on message save; retrieved when `hasExplicitRecallIntent(query)`  
**User visibility:** None — magic recall phrases only

---

### AIConversationHistory

**Schema:** `prisma/modules/ai/ai-models.prisma`  
**Purpose:** Full turn diagnostic log (query, context JSON snapshot, response, provider, tokens, `feedbackRating`)

**Writers:** `ai.ts` saveTwinQueryHistory  
**Readers:** Intelligence engines, admin diagnostics (via `_pipelineTrace` in context JSON)  
**Overlap:** Duplicates chat persistence purpose; primary value is analytics and trace linkage

---

## Tier 4 — Identity and preferences

### AIPersonalityProfile

Soft communication preferences from questionnaire and applied learning.  
**API:** `/api/ai/personality/profile`  
**UI:** `/ai?tab=behavior` → `PersonalityQuestionnaire`

### AIAutonomySettings

Per-domain autonomy levels and approval thresholds.  
**API:** `/api/ai/autonomy/settings`  
**UI:** `AutonomyControls`

### UserPreference (ai_preferred_*)

Provider and model selection — affects routing, not knowledge content.

---

## Tier 5 — Business AI

### BusinessAIDigitalTwin

**Schema:** `prisma/modules/ai/enterprise-ai.prisma`

| Field group | Content |
|-------------|---------|
| `aiPersonality` | Business voice JSON |
| `capabilities`, `restrictions` | Feature gates |
| `learningSettings` | Business learning config |
| Security/compliance JSON | Policy metadata |

**Services:** `BusinessAIDigitalTwinService.ts`  
**API:** `/api/business-ai/:id/config`, `interact`, `learning-events`  
**UI:** `BusinessAIControlCenter`, `EmployeeAIAssistant`

### BusinessAILearningEvent

Admin-approved business learning — parallel to personal events but **weaker application pipeline** (approval flags without full `learningApplicationService` parity).

### Business.aiSettings (JSON column)

**Schema:** `prisma/modules/business/business.prisma`  
**Overlap:** Duplicate config surface with `BusinessAIDigitalTwin` — product should treat twin as canonical for prompts.

---

## Tier 6 — Platform registry and cache

### ModuleAIContextRegistry

**Schema:** `prisma/modules/ai/module-context-registry.prisma`  
**Content:** Keywords, patterns, concepts, entities, actions, `contextProviders` URLs, `fullAIContext` manifest mirror

**Owner:** Platform / module author  
**API:** `/api/modules/:moduleId/ai/context`, admin sync routes  
**Influence:** Query routing and provider list — not direct prompt text

### UserAIContextCache

**Status:** Schema + invalidation (`deleteMany`) exist; **no active upsert/read path found in server/src**. Intended 15-min TTL cache — effectively dormant.

### ModuleAIPerformanceMetric

Daily per-module AI performance aggregates — monitoring only, no prompt effect.

---

## Tier 7 — Pipeline policy stores (operator knowledge governance)

**Schema:** `prisma/modules/ai/ai-pipeline.prisma`

| Model | Controls |
|-------|----------|
| `AIPipelineIntentPolicy` | Intent catalog, `groundingRequired`, default tools |
| `AIPipelineGroundingRulePolicy` | Required/optional sources per intent |
| `AIPipelineContextSourcePolicy` | Source catalog, `wiredInTwin`, retrieval priority |
| `AIPipelineToolPolicyRow` | Tool permissions, risk, grounding requirement |
| `AIPipelineSettings` | Enforcement mode, weak phrase list, retention |
| `AIPipelinePolicyAuditLog` | Policy edit audit trail |
| `AIPipelineDiagnostic` | Per-turn trace JSON, evidence, linked `conversationHistoryId` |

**Services:** `pipelineCatalogService.ts`, `pipelineRegistryService.ts`, `pipelineDiagnosticPersistence.ts`  
**API:** `/api/admin-portal/ai-pipeline/*`  
**UI:** Admin portal AI Pipeline section

**Prompt influence:** Gates **what gets retrieved**, not stored user facts. Code defaults in `pipelineCatalogDefaults.ts` when DB empty.

---

## Tier 8 — Adjacent stores (not memory tables, prompt-fed)

| Store | Role |
|-------|------|
| `File` + `fileAnalysisService` | Attachment summaries and vision |
| V_Link models + `vlinkPipelineContextService` | Relationship graph context |
| `context-graph/*` | Entity link traversal bundles |
| `knowledge/*` composition orchestrator | Neighborhood bundles (diagnostics-heavy) |
| `aiRetrievalCapabilityService` | Unified search retrieval |
| `AISuggestion` | Ambient suggestions (accept may create pending preference) |
| `AIExtractedExpense` | Document-derived facts from Drive extraction |

---

## Overlap resolution guidance (for Teach Vssyl)

| User intent | Canonical store | Avoid |
|-------------|-----------------|-------|
| Declarative fact ("I work at Acme") | `UserMemoryFact` | Duplicate in `UserAIContext` fact |
| Standing instruction ("Always use metric") | `UserAIContext` instruction | — |
| Style preference ("Be concise") | `UserAIContext` preference or personality soft prefs | Duplicate learning events |
| Correction of wrong answer | `AILearningEvent` correction → review → apply | Behavioral signal only |
| Business policy | `BusinessAIDigitalTwin` | Personal memory with business scope unless employee-specific |

---

## Schema file index

| File | Models |
|------|--------|
| `prisma/modules/ai/user-memory.prisma` | UserMemoryFact |
| `prisma/modules/ai/ai-models.prisma` | UserAIContext, AILearningEvent, Global*, AIPersonalityProfile, AIAutonomySettings, AIConversationHistory |
| `prisma/modules/ai/conversations.prisma` | AIConversation, AIMessage |
| `prisma/modules/ai/message-recall.prisma` | AIMessageRecallIndex |
| `prisma/modules/ai/module-context-registry.prisma` | ModuleAIContextRegistry, UserAIContextCache, ModuleAIPerformanceMetric |
| `prisma/modules/ai/enterprise-ai.prisma` | BusinessAIDigitalTwin, BusinessAIInteraction, BusinessAILearningEvent |
| `prisma/modules/ai/ai-pipeline.prisma` | All AIPipeline* models |
| `prisma/modules/ai/analytics.prisma` | Generic analytics scaffolding (largely unused for AI memory) |
