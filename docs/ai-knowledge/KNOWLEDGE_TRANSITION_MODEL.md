# Knowledge Transition Model

**Version:** 1.0.0  
**Status:** Active — state transitions for governed knowledge  
**Date:** 2026-07-06  
**Authority:** [AI_KNOWLEDGE_DECISION_MODEL.md](./AI_KNOWLEDGE_DECISION_MODEL.md)

---

## Purpose

Define **when information moves between states** — from first observation through retirement — without implying a new runtime engine or unified state table.

States are **distributed** across existing models (`UserAIContext.learningStatus`, `AISuggestion.status`, `AILearningEvent.validated`, etc.). This document is the **canonical transition philosophy**.

---

## State diagram (conceptual)

```
                    ┌──────────────┐
                    │  OBSERVATION  │ (ephemeral — not a stored row)
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
    ┌─────────┐     ┌────────────┐    ┌──────────────┐
    │ IGNORED │     │ TEMPORARY  │    │ PROPOSED     │
    └─────────┘     │  CONTEXT   │    │ (pending)    │
                    └─────┬──────┘    └──────┬───────┘
                          │                    │
              session end │          ┌─────────┴─────────┐
                          ▼          ▼                   ▼
                    ┌──────────┐ ┌────────────┐   ┌─────────────┐
                    │ EXPIRED  │ │ SUGGESTION │   │ LEARNING    │
                    └──────────┘ │  (pending) │   │ REVIEW      │
                                 └─────┬──────┘   └──────┬──────┘
                                       │                 │
                              accept/dismiss      promote/dismiss
                                       │                 │
                                       ▼                 ▼
                                 ┌──────────────────────────┐
                                 │   DURABLE KNOWLEDGE      │
                                 │   (prompt-eligible)      │
                                 └────────────┬─────────────┘
                                              │
                                    retire / trash / expire
                                              ▼
                                 ┌──────────────────────────┐
                                 │   RETIRED / DELETED       │
                                 └────────────┬─────────────┘
                                              │
                                    new observation
                                              ▼
                                 ┌──────────────────────────┐
                                 │   RE-OBSERVATION          │
                                 └──────────────────────────┘
```

---

## States and stores

| State | Meaning | Typical store / field |
|-------|---------|------------------------|
| **Observation** | Signal detected; no user-visible row yet | In-memory / pipeline |
| **Ignored** | Classifier dropped or deduped | No row |
| **Temporary context** | Session/thread scoped | Session prefs, continuity JSON, ephemeral attach text |
| **Proposed (pending)** | Awaiting review | `UserAIContext.learningStatus: pending`, `AILearningEvent.validated: false` |
| **Suggestion (pending)** | Workspace action proposal | `AISuggestion.status: PENDING` |
| **Durable knowledge** | Prompt-eligible taught | `UserMemoryFact`, active `UserAIContext`, twin policy |
| **Live / indexed** | SoR or derivative index | Module tables, `AIMessageRecallIndex`, V_Link |
| **Retired** | Soft-deleted or dismissed permanently | `trashedAt`, `learningStatus: dismissed`, `AISuggestion.DISMISSED` |
| **Expired** | TTL elapsed | `AISuggestion.EXPIRED`, `UserMemoryFact.expiresAt` past |

---

## Transition rules

### Observation → Ignore

| Condition | Example |
|-----------|---------|
| Below confidence / length threshold | Short chat with no extractable fact |
| Dedupe match | Identical memory fact subject+predicate |
| Suppression key active | User dismissed suggestion type |
| Policy block | Operator-disabled source |

**No store write.**

---

### Observation → Temporary context

| Condition | Example |
|-----------|---------|
| User asks for different tone **this chat** | Session preference override |
| Thread continuity update | `threadSummary` / `topics` refresh |
| Attached file for **this turn** | `fileAnalysisService` output |

**Rules:** Expires at session/thread end unless user promotes to durable. **Not** prompt-eligible cross-session without save.

---

### Observation → Live retrieval only

| Condition | Example |
|-----------|---------|
| Application entity CRUD | Calendar event created |
| User uploads PDF to Drive | File in SoR; filename searchable |
| V_Link entity linked | Relationship in V_Link tables |

**Rules:** Entity stays in **SoR**. AI reads via providers/search at query time. **Never** copy full entity into `UserMemoryFact` for convenience (P1, A1).

---

### Observation → Suggestion

| Condition | Example |
|-----------|---------|
| Correlation rule fires | Chat + Drive activity pattern |
| Action-oriented proposal | “Extract info from this file?” |

**Transition:** `AISuggestion` PENDING → ACCEPTED / DISMISSED / EXPIRED. Accept may route to chat/module — **not** automatically to durable knowledge.

---

### Observation → Learning review

| Condition | Example |
|-----------|---------|
| Chat inference | `factExtractionService` → pending context |
| Behavioral pattern | `AILearningEvent` reviewable type |
| Repeated suggestion accepts | `createPendingPreferenceFromSuggestionPattern` |

**Rules:** **Not prompt-eligible** until promote/approve (P4). User reviews on **Learning** tab or chat notice.

---

### Observation → Immediate knowledge

| Condition | Example |
|-----------|---------|
| Explicit teach | Teach Vssyl, “remember that…” |
| User Knowledge CRUD | Add fact in Knowledge tab |
| Business admin policy | Business twin update |

**Rules:** **No inference review** (P3). Write to correct store via classification. Run evaluation for retrieval proof (P9).

---

### Suggestion → Learning review

| Condition | Example |
|-----------|---------|
| Repeated accepts of same suggestion type | Pending preference proposal |

**Not automatic on first accept.**

---

### Learning review → Durable knowledge

| Action | Backend | Result |
|--------|---------|--------|
| Promote pending context | `userAIContextLearningService.promote` | `learningStatus: active` |
| Approve learning event | `learningApplicationService.applyApprovedEvent` | Memory fact / context / personality |

**Becomes prompt-eligible** on next twin turn.

---

### Learning review → Retired (dismiss)

| Action | Result |
|--------|--------|
| Dismiss pending context | `learningStatus: dismissed`, inactive |
| Reject learning event | `validated: true`, `applied: false` |

**Must not** influence future answers (unless re-observed).

---

### Durable knowledge → Retirement / deletion

| Action | Store behavior |
|--------|----------------|
| User deletes fact | `trashedAt` / delete `UserMemoryFact` |
| User removes context | Delete or deactivate `UserAIContext` |
| Expiration | `expiresAt` passed — excluded from retrieval |
| Admin policy revoke | Business twin update |

**Forgetting** is user-governed; Applications retain SoR entities.

---

### Retired → Re-observation

| Condition | Example |
|-----------|---------|
| Same pattern detected again | New pending row (if not deduped) |
| User re-teaches | New explicit fact (dedupe may return existing) |

**No silent resurrection** of dismissed items without new observation or explicit teach.

---

## Prompt-eligibility timeline

```
                    NOT ELIGIBLE          ELIGIBLE
                          │                  │
Inferred propose ─────────┼── review ────────┤
Explicit teach ───────────┼──────────────────┤ (immediate)
Live SoR fetch ───────────┼──────────────────┤ (per turn only)
Session temp ─────────────┤                  │
                          │                  │
                     dismiss/expiry      retire/delete
```

---

## Evaluation and regression hooks

| Transition | Eval required |
|------------|---------------|
| → Immediate knowledge | Store + retrieval + assembly tests |
| → Durable via review | Same after promote |
| → Live only | Provider/search permission tests |
| → Ignore | No user-visible regression |

Detail: [AI_KNOWLEDGE_EVAL_LOOP_SPEC.md](./AI_KNOWLEDGE_EVAL_LOOP_SPEC.md).

---

## Related documents

- [AI_KNOWLEDGE_DECISION_MODEL.md](./AI_KNOWLEDGE_DECISION_MODEL.md)  
- [OBSERVATION_CLASSIFICATION_MATRIX.md](./OBSERVATION_CLASSIFICATION_MATRIX.md)  
- [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md)
