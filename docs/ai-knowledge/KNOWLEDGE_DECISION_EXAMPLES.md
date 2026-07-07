# Knowledge Decision Examples

**Version:** 1.0.0  
**Status:** Active — scenario walkthroughs for Decision Model v1  
**Date:** 2026-07-06  
**Authority:** [AI_KNOWLEDGE_DECISION_MODEL.md](./AI_KNOWLEDGE_DECISION_MODEL.md)

---

## Purpose

Classify **common real-world scenarios** through the canonical decision model. Each example states: initiator, classification, outcome, components, and what must **not** happen.

---

## Example 1 — User says “Remember that I prefer morning meetings”

| Field | Value |
|-------|-------|
| **Initiator** | User |
| **Intent** | Explicit teach |
| **Classification** | Preference / fact hybrid → preference |
| **Outcome** | **Immediate knowledge** |
| **Review** | None (P3) |
| **Expire** | No (unless user sets) |
| **Prompt-eligible** | Next turn via `MemoryRetrievalService` |
| **SoR** | N/A — not a Calendar entity |
| **Durable** | `UserMemoryFact` and/or active `UserAIContext` via `maybePersistRememberThatFact` / Teach API |
| **Never store** | Duplicate calendar events |

**Components:** `maybePersistRememberThatFact`, `userMemoryFactService`, twin assembly.

---

## Example 2 — User uploads a PDF to Drive

| Field | Value |
|-------|-------|
| **Initiator** | User / Application |
| **Intent** | Entity CRUD |
| **Classification** | Entity (document) |
| **Outcome** | **Live retrieval only** (+ indexed filename) |
| **Review** | None |
| **Prompt-eligible** | When user asks about file — search + optional attach OCR |
| **SoR** | **Drive** owns file |
| **Durable** | No AI memory of full PDF body by default |
| **Never store** | Full document text in `UserMemoryFact` |

**Components:** Drive module, `searchService`, `fileAnalysisService` (ephemeral on attach).

**If user teaches:** “Remember my Q3 plan is in budget.pdf” → **Immediate knowledge** (pointer fact), not file duplication.

---

## Example 3 — User creates a Calendar event

| Field | Value |
|-------|-------|
| **Initiator** | User / Application |
| **Intent** | Entity CRUD |
| **Classification** | Entity (event) |
| **Outcome** | **Live retrieval only** |
| **Review** | None |
| **Prompt-eligible** | Per-turn via Calendar context provider |
| **SoR** | **Calendar** |
| **Durable** | No — unless user explicitly teaches a preference about scheduling |
| **Never store** | Event payload copied to memory tables |

**Components:** Calendar provider, `ContextProviderOrchestrator`, unified search for event titles.

---

## Example 4 — User repeatedly mentions “Arthur” in chat

| Field | Value |
|-------|-------|
| **Initiator** | AI inference |
| **Intent** | Implicit pattern |
| **Classification** | Fact or relationship (ambiguous) |
| **Outcome** | **Learning review** (if extract fires) or **Ignore** (single weak mention) |
| **Review** | User promote/dismiss |
| **Prompt-eligible** | Only after promote |
| **SoR** | If Arthur is a contact/employee → HR/Chat SoR via live retrieval |
| **Durable** | Pending `UserAIContext` only after review |

**Components:** `factExtractionService`, Learning tab, optional V_Link if user links entity.

**Must not:** Auto-create “Arthur is important” memory without review.

---

## Example 5 — User changes favorite dashboard

| Field | Value |
|-------|-------|
| **Initiator** | User / Application |
| **Intent** | Preference signal |
| **Classification** | Preference (workspace UI) |
| **Outcome** | **Live retrieval only** for UI state; **Learning review** only if inference proposes teachable preference |
| **Review** | Only if inferred proposal created |
| **SoR** | Dashboard/user prefs in platform stores |
| **Durable** | Explicit teach only — “Always open Business workspace first” |

**Components:** User preference APIs, optional `AILearningEvent` if behavioral engine fires.

---

## Example 6 — Business admin creates an SOP document

| Field | Value |
|-------|-------|
| **Initiator** | User (admin) / Application |
| **Intent** | Entity CRUD |
| **Classification** | Entity (document) + business scope |
| **Outcome** | **Live retrieval only** |
| **Review** | None for SoR write |
| **SoR** | Drive or Business module |
| **Durable AI** | Only if admin adds **business policy** to twin — not automatic from upload |

**Components:** Drive search, business context providers, `BusinessAIDigitalTwin` for explicit policy.

**If admin teaches:** “Follow the SOP in folder X” → **Immediate knowledge** (business-scoped instruction).

---

## Example 7 — User edits a project (Tasks)

| Field | Value |
|-------|-------|
| **Initiator** | User / Application |
| **Intent** | Entity CRUD |
| **Classification** | Entity (task/project) |
| **Outcome** | **Live retrieval only** |
| **SoR** | **Tasks** |
| **Durable** | No automatic memory of edit |
| **Prompt-eligible** | Tasks provider on relevant queries |

**Components:** Tasks context provider, unified search.

---

## Example 8 — User chats about Italy once

| Field | Value |
|-------|-------|
| **Initiator** | User |
| **Intent** | Casual topic |
| **Classification** | Low-confidence / temporary |
| **Outcome** | **Temporary context** or **Ignore** |
| **Review** | None |
| **Expire** | End of conversation |
| **Durable** | No |
| **Indexed** | May appear in `AIMessageRecallIndex` for recall — not taught fact |

**Must not:** Create “User likes Italy” pending context from one mention unless extraction threshold met (still → review).

---

## Example 9 — User chats about Italy for six months

| Field | Value |
|-------|-------|
| **Initiator** | AI inference |
| **Intent** | Sustained pattern |
| **Classification** | Preference or fact proposal |
| **Outcome** | **Learning review** |
| **Review** | User |
| **Durable** | Only after promote |
| **SoR** | Chat history indexed; taught fact is separate |

**Components:** `factExtractionService`, recurring topic in `aiConversationMemoryService`, Learning tab.

**Distinction:** Long chat history ≠ durable knowledge without review or explicit teach.

---

## Example 10 — User links entities with V_Link

| Field | Value |
|-------|-------|
| **Initiator** | User / Application |
| **Intent** | Relationship CRUD |
| **Classification** | Relationship |
| **Outcome** | **Live retrieval only** |
| **SoR** | **V_Link** |
| **Durable** | Edge in V_Link tables — not copied to `UserMemoryFact` |
| **Prompt-eligible** | Graph hydration at query time |

**Components:** V_Link services, graph context in twin, `pipelineGroundingRetrieval`.

---

## Example 11 — Calendar meeting occurs

| Field | Value |
|-------|-------|
| **Initiator** | Application |
| **Intent** | Entity lifecycle (time-based) |
| **Classification** | Entity (event) |
| **Outcome** | **Live retrieval only** |
| **Suggestion** | Optional — “Meeting starting” notification (not memory) |
| **SoR** | Calendar |
| **Durable** | No AI memory of attendance unless user teaches |

**Components:** Calendar provider, notification system (orthogonal to knowledge stores).

---

## Example 12 — AI observes repeated behavior (e.g. always opens Drive after chat)

| Field | Value |
|-------|-------|
| **Initiator** | AI |
| **Intent** | Behavioral pattern |
| **Classification** | Preference or procedure proposal |
| **Outcome** | **Suggestion** first; **Learning review** after repeated accepts |
| **Review** | User |
| **Durable** | After `createPendingPreferenceFromSuggestionPattern` + promote |

**Components:** `ambientSuggestionService`, `userLearningSignalService`, `AILearningEvent`, Learning tab.

**Must not:** Silent preference write from analytics alone.

---

## Summary table

| Scenario | Canonical outcome |
|----------|-------------------|
| “Remember that…” | Immediate knowledge |
| PDF upload | Live retrieval (+ filename index) |
| Calendar event create | Live retrieval |
| Repeated “Arthur” | Learning review (or ignore if weak) |
| Favorite dashboard change | Live retrieval; infer → review only if proposed |
| Business SOP upload | Live retrieval; policy teach separate |
| Project edit | Live retrieval |
| Italy once | Temporary / ignore |
| Italy six months | Learning review |
| V_Link | Live retrieval (graph SoR) |
| Meeting occurs | Live retrieval |
| Repeated behavior | Suggestion → Learning review |

---

## Related documents

- [OBSERVATION_CLASSIFICATION_MATRIX.md](./OBSERVATION_CLASSIFICATION_MATRIX.md)  
- [KNOWLEDGE_TRANSITION_MODEL.md](./KNOWLEDGE_TRANSITION_MODEL.md)  
- [INDEXED_KNOWLEDGE_REFERENCE_AUDIT.md](./INDEXED_KNOWLEDGE_REFERENCE_AUDIT.md)
