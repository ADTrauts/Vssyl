# Observation Classification Matrix

**Version:** 1.0.0  
**Status:** Active — classifier inputs → decision outcomes  
**Date:** 2026-07-06  
**Authority:** [AI_KNOWLEDGE_DECISION_MODEL.md](./AI_KNOWLEDGE_DECISION_MODEL.md)

---

## Purpose

Map **classification dimensions** to **canonical decision outcomes** and **existing components**. Use this matrix when designing ingress for any new AI feature.

---

## Classification dimensions

| Dimension | Values |
|-----------|--------|
| **Initiator** | User, AI inference, Application, Operator |
| **Intent** | Explicit teach, implicit pattern, entity CRUD, workspace action, correction, noise |
| **Knowledge type** | Fact, preference, instruction, entity, relationship, procedure, temporary, policy |
| **Scope** | Personal, business, session, platform |
| **Confidence** | High (explicit), medium (pattern), low (single mention) |

---

## Master outcome matrix

| Outcome | Initiator | Review | Expire | Prompt-eligible | SoR | Durable store | Never store entity copy |
|---------|-----------|--------|--------|-----------------|-----|---------------|-------------------------|
| **Ignore** | AI / App | No | N/A | No | App if exists | No | Yes |
| **Temporary context** | User / AI | No | Session/thread | Current turn only | App | No | Yes |
| **Live retrieval only** | User / App | No | N/A | Per-turn fetch | **App** | No | **Yes** |
| **Suggestion** | AI | No | TTL | No (action UI) | App refs | No | Yes |
| **Learning review** | AI | **User** | Until dismiss | After approve | App refs | Pending row | Yes |
| **Immediate knowledge** | User / Admin | No* | Optional TTL | After write | App refs | **Yes** | Yes |

\* Business-scoped employee proposals may require admin review per governance tier.

---

## Initiator × intent routing

| Initiator | Intent | Primary outcome | Secondary |
|-----------|--------|-----------------|-----------|
| **User** | “Remember that…” | Immediate knowledge | — |
| **User** | Teach Vssyl chip | Immediate knowledge | Eval |
| **User** | Entity CRUD in module | Live retrieval only | — |
| **User** | One-off chat topic | Temporary context or Ignore | — |
| **User** | Correction / Improve Answer | Immediate knowledge or Learning review | Classify chip |
| **AI** | Chat fact extract | Learning review | — |
| **AI** | Correlation rule | Suggestion | → Learning if repeated |
| **AI** | Repeated behavior | Learning review | `AILearningEvent` |
| **Application** | File/event/task write | Live retrieval only | Indexed search |
| **Application** | V_Link create | Live retrieval only | V_Link SoR |
| **Operator** | Pipeline policy | Platform policy store | Not user memory |
| **Operator** | Test lab trace | Ignore (diagnostic) | — |

---

## Knowledge type routing

| Type | If explicit | If inferred | Wrong path (forbidden) |
|------|-------------|-------------|------------------------|
| **Fact** | `UserMemoryFact` immediate | Pending → promote | Copy calendar event to fact |
| **Preference** | Active `UserAIContext` | Pending context | Auto-apply from one thumbs-up |
| **Instruction** | Active `UserAIContext` | Pending context | Pipeline intent from user chat |
| **Entity** | Redirect to Application | Live retrieval | `UserMemoryFact` for event body |
| **Relationship** | V_Link edit | Live retrieval + graph | Duplicate graph in memory |
| **Procedure** | Explicit teach only | Learning review (weak) | Infer from single action |
| **Temporary** | Session fields | Expire | Cross-session without teach |
| **Policy** | Business twin / operator | Admin review | User personal store |

Detail: [KNOWLEDGE_TYPE_TO_STORE_MATRIX.md](./KNOWLEDGE_TYPE_TO_STORE_MATRIX.md).

---

## Component map by outcome

| Outcome | Primary components |
|---------|-------------------|
| Ignore | Classifier thresholds, dedupe in `userMemoryFactService`, suggestion suppression |
| Temporary context | `DigitalLifeTwinService`, session prefs, `aiConversationMemoryService` |
| Live retrieval | `ContextProviderOrchestrator`, `searchService`, `aiRetrievalCapabilityService`, V_Link services |
| Suggestion | `ambientSuggestionService`, `AISuggestion`, `userLearningSignalService` |
| Learning review | `factExtractionService`, `userAIContextLearningService`, `personalAILearningEventsService`, Learning tab |
| Immediate knowledge | Teach APIs, `maybePersistRememberThatFact`, Knowledge CRUD, `BusinessAIDigitalTwin` |
| Post-decision retrieval | `MemoryRetrievalService`, `AIContextAssembler`, `pipelineGroundingRetrieval` |

---

## Confidence and review gates

| Confidence | Typical signal | Review |
|------------|----------------|--------|
| **Explicit** | User typed teach / remember | None |
| **High inferred** | Repeated pattern (≥3 accepts) | User promote |
| **Medium** | `factExtractionService` extract | User promote |
| **Low** | Single chat mention | Ignore or temporary only |
| **Behavioral analytics** | Stars, thumbs metadata | None — **not** prompt-eligible |

**Rule:** Confidence **never** auto-promotes inferred knowledge to active (P4).

---

## Indexed vs durable decision

| Information | Decision | Rationale |
|-------------|----------|-----------|
| Chat message text | Indexed (`AIMessageRecallIndex`) | Recall without duplicating as fact |
| Drive filename | Indexed (search) | SoR is file blob |
| Drive body (today) | Live attach or ephemeral OCR | No persisted body index |
| Taught “I prefer bullet lists” | Durable `UserAIContext` | User intent |
| Calendar event | Live provider | SoR = Calendar |
| V_Link edge | Live graph | SoR = V_Link |

---

## New infrastructure required?

| Capability | Required? |
|------------|-----------|
| Decision philosophy | **No** — this document |
| Ingress routing | **No** — extend classifiers in existing services |
| Unified state machine DB | **No** — forbidden by engine spec |
| File body index | **Optional** product gap — still Live/Indexed category |
| Business learning apply | **Glue** — not new service |

---

## Related documents

- [KNOWLEDGE_DECISION_EXAMPLES.md](./KNOWLEDGE_DECISION_EXAMPLES.md)  
- [KNOWLEDGE_TRANSITION_MODEL.md](./KNOWLEDGE_TRANSITION_MODEL.md)  
- [APPLICATION_INTELLIGENCE_MODEL.md](./APPLICATION_INTELLIGENCE_MODEL.md)
