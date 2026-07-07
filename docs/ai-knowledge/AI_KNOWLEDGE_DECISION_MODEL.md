# AI Knowledge Decision Model

**Version:** 1.0.0  
**Status:** Active — canonical decision philosophy for information ingress  
**Date:** 2026-07-06  
**Program:** AI Knowledge Decision Model  
**Authority:** [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md)

---

## Preamble

When new information enters Vssyl, the platform must decide **what happens next** — without copying Applications, without silent self-modification, and without a monolithic “AI database.”

The **AI Knowledge Decision Model** is the constitutional specification for those decisions. It is **not** a runtime service, microservice, or replacement for the Knowledge Engine. It is the **Source of Truth for ingress philosophy**: every future feature that introduces information into Vssyl must declare which decision branch it uses.

**Companion documents:**

| Document | Role |
|----------|------|
| [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md) | Principles and ownership |
| [AI_KNOWLEDGE_ENGINE_SPEC.md](./AI_KNOWLEDGE_ENGINE_SPEC.md) | Runtime composition (retrieve, assemble, govern) |
| [KNOWLEDGE_TRANSITION_MODEL.md](./KNOWLEDGE_TRANSITION_MODEL.md) | State transitions |
| [OBSERVATION_CLASSIFICATION_MATRIX.md](./OBSERVATION_CLASSIFICATION_MATRIX.md) | Classifier inputs → outcomes |
| [KNOWLEDGE_DECISION_EXAMPLES.md](./KNOWLEDGE_DECISION_EXAMPLES.md) | Scenario walkthroughs |

**Hierarchy:** Constitution → **Decision Model** → Lifecycle / Engine specs → implementation.

---

## Primary question

> When new information enters Vssyl, how should the platform decide what happens next?

**Answer:** Classify the **initiator**, **intent**, and **knowledge type**, then route to exactly one **decision outcome** (see §4). Retrieval and assembly happen later — governed by the Knowledge Engine — only for information that is **eligible** for the current turn.

---

## Relationship to the Knowledge Engine

| Question | Owner |
|----------|-------|
| **What should happen to this information?** | **Decision Model** (this document) |
| **How should eligible knowledge be retrieved, scoped, assembled, and explained?** | **Knowledge Engine** (emergent runtime) |

The Decision Model governs **ingress, classification, review gates, and durability**. The Knowledge Engine governs **per-turn composition** of already-authorized knowledge and live Application reads.

```
Information ingress                    Per-turn answer
─────────────────────                  ─────────────────
Decision Model                         Knowledge Engine
  observe → classify → decide            retrieve → assemble → reason
  review → apply (durable)               explain → feedback → evaluate
```

**Constitution alignment:** Article II §2 (engine is emergent), §10 (Apps teach; Engine composes), §11 (assemble don’t duplicate). The Decision Model **does not** add a new engine — it names how existing stores and gates participate at ingress.

---

## Canonical definitions

Terms align with [AI_KNOWLEDGE_GLOSSARY.md](./AI_KNOWLEDGE_GLOSSARY.md). Decision Model extensions below.

### Observation

A **learnable signal** detected from product use: chat text, repeated module behavior, attachment upload, correlation rule match, admin config change. Observation **proposes** — it does not, by itself, change answers.

**Not observation:** User explicit teach; Application entity CRUD (SoR update); operator pipeline edit.

### Signal

A **normalized, attributable unit** derived from an observation (often with metadata: source module, tenant, confidence, dedupe key). Signals feed classifiers and may create proposals (`AILearningEvent`, pending `UserAIContext`, `AISuggestion`).

### Confidence

A **governance weight** (0–1) attached to proposals — not model logits exposed to users by default. Influences ranking and deduplication; **does not** bypass review for inferred knowledge (P4).

### Inference

Knowledge **proposed** by the system without explicit user teach intent. Always **review-required** before prompt-eligible unless constitutionally exempt (e.g. auto-validated `behavioral_signal` rows that are explicitly non-prompt-eligible).

### Temporary context

Information scoped to **one conversation or turn** — session style overrides, thread continuity metadata, ephemeral attachment extraction. **Expires** when the session/thread ends or user dismisses. Not durable knowledge unless explicitly saved.

### Suggestion

A **user-facing proposal to act** in the workspace (`AISuggestion`) — open a file, start a chat, visit a module. Not durable knowledge. May **spawn** a learning proposal after repeated acceptance.

### Learning

The **governed process** of converting observation or correction into **prompt-eligible** knowledge through classification, review (if required), application, and evaluation. Distinct from the Learning **tab** (review UI).

### Explicit teaching

Deliberate user or admin action to add or correct governed knowledge: Teach Vssyl, “remember that…”, Knowledge CRUD, business twin config. **Bypasses inference review** (P3). Still subject to tenant scope and store routing.

### Knowledge

Anything that **may influence** an AI answer: taught, live, experiential, platform rules. The Decision Model splits knowledge into **categories** (below) for ingress decisions.

### Live retrieval

Authorized **read at query time** from Application SoR or providers — **not copied** into taught stores. Preferred for entity truth (P1, P11).

### Indexed knowledge

Application-owned or derivative data with a **queryable index** (DB text search, recall index, conversation rollup, V_Link rows). Retrieved without duplicating entity payloads into memory tables.

### Durable knowledge

Taught knowledge **persisted** until user/admin deletes or retires: `UserMemoryFact`, active `UserAIContext`, `BusinessAIDigitalTwin` policy, applied learning outcomes.

### Expiration

Time-bound **loss of eligibility**: suggestion TTL, session context end, optional `UserMemoryFact.expiresAt`. Distinct from deletion.

### Forgetting

User-initiated **removal** of durable knowledge (trash/delete) or dismiss of pending proposals. Does not delete Application SoR entities.

### Evaluation

**Proof** that a decision outcome worked: store write correct, retrieval on relevant query, assembly includes taught content. Required before scaling features (P9).

### Regression protection

CI and eval gates ensuring future changes do not break proven teach and retrieval paths.

---

## Knowledge categories (decision-relevant)

| Category | Ingress default | Prompt-eligible when |
|----------|-----------------|----------------------|
| **Live context** | Never store entity copy | Each turn via providers/search |
| **Indexed knowledge** | Store derivative index only | Via retrieval path when query matches |
| **Durable knowledge** | Store in taught tables | After explicit teach or approved apply |
| **Temporary context** | Session/thread fields only | Current conversation only |
| **Platform policy** | Operator/admin stores | When catalog enables source |

---

## The canonical decision flow

```
New Information
      │
      ▼
┌─────────────┐
│ Observation │  System notices; user/admin may also initiate directly
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ Classification│  Initiator × intent × knowledge type × tenant
└──────┬───────┘
       │
       ▼
┌─────────────┐
│   Decision   │  Exactly one primary outcome (may chain: Suggestion → Learning)
└──────┬──────┘
       │
       ├──► Ignore
       ├──► Temporary Context
       ├──► Live Retrieval only (SoR — no AI store)
       ├──► Suggestion
       ├──► Learning Review
       └──► Immediate Knowledge (explicit teach)
```

### Branch purposes

| Outcome | Purpose | Constitution |
|---------|---------|--------------|
| **Ignore** | Noise, sub-threshold, deduped, or policy-blocked | P15 — no autonomous mutation |
| **Temporary Context** | Shape current thread without durable teach | D8 — session ≠ memory |
| **Live Retrieval only** | Entity truth stays in Application | P1, P11 |
| **Suggestion** | Propose workspace **action**, not memory | Observation ≠ application |
| **Learning Review** | Inferred knowledge awaits human gate | P4 |
| **Immediate Knowledge** | Explicit teach or admin policy write | P3 |

**After** durable application, the Knowledge Engine handles retrieval → assembly on subsequent turns.

---

## Decision attributes (every branch)

For each outcome, engineers must answer:

| Attribute | Question |
|-----------|----------|
| **Initiator** | User, AI inference, Application event, Operator? |
| **Expire?** | TTL, session end, or persistent until delete? |
| **Review?** | None, user, business admin, operator? |
| **Prompt-eligible?** | When does it enter twin context? |
| **Remain in SoR?** | Application owns entity — always for domain data |
| **Durable knowledge?** | Written to taught stores? |
| **Never store?** | Ephemeral only — live fetch or ignore |

See [OBSERVATION_CLASSIFICATION_MATRIX.md](./OBSERVATION_CLASSIFICATION_MATRIX.md) for the full matrix.

---

## Architecture validation

**Verdict:** Existing architecture **supports** Decision Model v1. **No new infrastructure required** for the philosophy.

| Decision outcome | Existing components |
|------------------|-------------------|
| Ignore | Dedup in `createUserMemoryFact`, suggestion suppression keys, classifier thresholds |
| Temporary context | Session prefs, `AIConversation` continuity, attachment extract in twin |
| Live retrieval | `ContextProviderOrchestrator`, unified search, V_Link hydrate, `fileAnalysisService` (ephemeral) |
| Suggestion | `ambientSuggestionService`, `AISuggestion` |
| Learning review | `userAIContextLearningService`, `personalAILearningEventsService`, Learning tab |
| Immediate knowledge | Teach Vssyl APIs, `maybePersistRememberThatFact`, Knowledge CRUD, `BusinessAIDigitalTwin` |
| Retrieval (post-decision) | `MemoryRetrievalService`, twin, `AIContextAssembler` |
| Evaluation | Gate tests, `AI_KNOWLEDGE_EVAL_LOOP_SPEC.md` |

**Optional gaps** (product, not decision philosophy): file-body index, business learning apply parity, Teach thumbs-down routing — see [KNOWLEDGE_ENGINE_RETRIEVAL_VALIDATION.md](./KNOWLEDGE_ENGINE_RETRIEVAL_VALIDATION.md).

---

## Contradictions discovered

| Item | Resolution |
|------|------------|
| Constitution Article IV lists “Learning” after Answer in layer stack | **Clarified:** Learning loop includes ingress (Decision Model) and runtime feedback; diagram is lifecycle not ingress order |
| Article IV says Engine “decide what to retrieve” | **Narrowed:** Engine decides retrieval **of eligible knowledge**; Decision Model decides **ingress fate** — companion docs now distinguish |
| `factExtractionService` creates pending context | **Aligned** with P4; product copy must not imply auto-memory |
| `behavioral_signal` events auto-validated | **Aligned** if non-prompt-eligible; documented in matrix |

No constitutional amendment required — companion specification clarifies scope.

---

## Rules for new features

Any PR that introduces new information into Vssyl must document:

1. **Initiator** and **classification** inputs  
2. **Decision outcome** (one primary branch)  
3. **Store** (if any) and **review gate**  
4. **Prompt-eligibility** timing  
5. **Evaluation** proof required (P9)  
6. **SoR** — which Application owns entity truth  

---

## Recommended first implementation after Decision Model

**Not new infrastructure.** Recommended **product and glue** in priority order:

1. **Learning UX simplification** — align copy with Decision Model branches ([AI_LEARNING_INFORMATION_ARCHITECTURE.md](./AI_LEARNING_INFORMATION_ARCHITECTURE.md))  
2. **Teach Vssyl Phase 1B** — thumbs-down / Improve Answer → classified explicit teach (correction path)  
3. **Eval loop CI** — retrieval proof for each decision outcome class  
4. **Optional:** file-content index (Drive) — live retrieval enhancement, not Decision Model change  

---

## Related documents

- [KNOWLEDGE_TRANSITION_MODEL.md](./KNOWLEDGE_TRANSITION_MODEL.md)  
- [OBSERVATION_CLASSIFICATION_MATRIX.md](./OBSERVATION_CLASSIFICATION_MATRIX.md)  
- [KNOWLEDGE_DECISION_EXAMPLES.md](./KNOWLEDGE_DECISION_EXAMPLES.md)  
- [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md)  
- [RETRIEVAL_ARCHITECTURE.md](./RETRIEVAL_ARCHITECTURE.md)
