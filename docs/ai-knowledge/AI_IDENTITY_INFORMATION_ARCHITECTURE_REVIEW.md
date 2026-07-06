# AI Identity — Information Architecture Review

**Version:** 1.0.0  
**Status:** Approved — terminology transition (user-facing only)  
**Date:** 2026-07-05  
**Program:** AI Knowledge / Teach Vssyl  
**Authority:** [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md)

---

## Executive summary

**Verdict:** Rename the product tab and related copy from **Memory** to **Knowledge**.

**Memory** remains the correct **technical** term for durable taught stores (`UserMemoryFact`, `MemoryRetrievalService`). **Knowledge** is the correct **product** term for what users manage in AI Identity — facts, preferences, vocabulary, and instructions that influence future answers.

No backend models, APIs, services, schemas, or file names change in this transition.

---

## Current IA (before)

| Section | User label | Primary purpose | Underlying systems |
|---------|------------|-----------------|-------------------|
| **AI Identity** | AI Identity | Home — communication style, influence stack, workspace overlay | Identity snapshot, preferences resolver |
| **Learning** | Learning | Review inferred observations before they become durable | `UserAIContext` pending, learning events |
| **Suggestions** | Suggestions | Ambient proposals (files, patterns) | `AISuggestion` |
| **Memory** | Memory | Browse/edit facts, context, instructions, patterns | `UserMemoryFact`, `UserAIContext`, patterns |
| **Behavior** | Behavior | Personality, tone, autonomy boundaries | Questionnaire, autonomy settings |
| **More** | Provider / Actions / Insights | Model choice, autonomous actions, analytics depth | Provider config, intelligence hub |

**Entry points outside tabs:** Chat → **Improve answer** → **Teach Vssyl** (Phase 1A); chat → **Why this answer** (explainability).

---

## Recommended IA (after)

| Section | User label | Rationale |
|---------|------------|-----------|
| **AI Identity** | AI Identity (unchanged) | Canonical home for the Digital Life Twin — “who your twin is” |
| **Learning** | Learning (unchanged) | Matches Constitution glossary: governed process, review gate (P4) |
| **Suggestions** | Suggestions (unchanged) | Observation → proposal stage; distinct from stored knowledge |
| **Knowledge** | **Knowledge** (was Memory) | Umbrella for taught durable intelligence users can inspect |
| **Behavior** | Behavior (unchanged) | D8: behavior ≠ memory; style/autonomy are not taught facts |
| **More** | More (unchanged) | Advanced / operator-adjacent surfaces |

**URL:** `?tab=knowledge` is canonical; `?tab=memory`, `?tab=memories`, and `?tab=context` redirect for backward compatibility. Internal tab id remains `memory` in code.

---

## Specific questions — answers

### 1. Does “Memory” accurately describe explicit teaching, facts, preferences, vocabulary, stored knowledge, and future retrieval?

**Partially — and increasingly no.**

- **Accurate for:** structured facts (`UserMemoryFact`), “remember that…” chat saves, retrieval of explicit facts.
- **Inaccurate for:** preferences and instructions in `UserAIContext`, vocabulary taught via Teach Vssyl, and the full idea of “what influences my twin.”
- The Memory tab already mixed constitutional **memory** (facts) with broader **taught knowledge** (preferences, workflows). Product language lagged Teach Vssyl and the Constitution.

### 2. “Remember this” vs “know this”

Users use both. Constitution and Teach Vssyl favor **know / learn / teach**:

- Teach Vssyl confirmation: “Vssyl **learned** this.”
- Constitution P13: users teach **facts, preferences, rules** — not “memory files.”
- “Remember that…” remains valid **chat phrasing** but should not name the management surface.

**Product stance:** **Know / teach / learn** for surfaces; **remember** only as casual chat affordance.

### 3. Does “Knowledge” align with the Constitution?

**Yes.**

| Source | Alignment |
|--------|-----------|
| Glossary **Knowledge** | Anything that may influence an answer — taught, live, experiential, platform |
| Glossary **Memory** | Subset: **durable taught** knowledge |
| Article II §2 | Knowledge Engine = emergent composition — not a memory file |
| P13 | Plain-language teach — facts, preferences, rules |

Renaming the tab to **Knowledge** matches the constitutional hierarchy: Knowledge (product) ⊃ Memory (technical store for taught facts).

### 4. Replace Memory, or nest Memory under Knowledge?

**Knowledge replaces Memory as the tab label.**

- **Knowledge** = user-facing parent concept (what Vssyl knows that you taught and saved).
- **Memory** = engineering term only; never shown as the primary nav label.

Do **not** add a nested “Memory” sub-nav inside Knowledge in Phase 1 — the existing sections (facts, context, instructions) remain, described as types of knowledge.

### 5. Do Learning, Suggestions, Memory, and Teach Vssyl form one lifecycle?

**Yes — with Behavior and live Application data as parallel inputs.**

```
Teach Vssyl (chat) ──────────────┐
"Remember that…" (chat) ─────────┤
Suggestions (ambient) ───────────┼→ Learning (review) ─→ Knowledge (stored)
Learning hub (inference) ────────┘                              │
                                                                ▼
Application data (live SoR) ────────────────────────→ Context assembly
Behavior (style/autonomy) ──────────────────────────→       │
                                                                ▼
                                                         Reasoning → Answer
                                                                │
Feedback (Improve answer) ──────────────────────────────────────┘
```

| Stage | Surface | Constitution stage |
|-------|---------|-------------------|
| Teach | Teach Vssyl modal, chat | Explicit teaching (P3) |
| Propose | Suggestions | Observation |
| Review | Learning | Inference review (P4) |
| Store | **Knowledge** tab | Application to memory stores |
| Assemble | (invisible) | Context assembly (P11) |
| Answer | Chat | Answer |
| Feedback | Improve answer | Correction (P8) |

---

## Terminology decisions

| Before (user-facing) | After | Notes |
|----------------------|-------|-------|
| Memory (tab) | **Knowledge** | Nav label only |
| Long-term memories | **Long-term knowledge** | Facts section |
| Add a memory | **Add knowledge** | In-tab create |
| Save memory | **Save knowledge** | |
| Manage in Memory | **Manage knowledge** | Identity home link |
| View in Memory | **View in Knowledge** | Explain drawer |
| Memories that shaped this reply | **Knowledge that shaped this reply** | Explain drawer |
| Forget memory? | **Remove this knowledge?** | Destructive confirm |
| Why I remembered this | **Why I used this** | Fact detail |
| Failed to load memory | **Failed to load knowledge** | Error copy |
| `?tab=memory` | `?tab=knowledge` | Canonical URL; legacy redirects |

**Unchanged (intentional):**

- **AI Identity** — product name for the twin control center.
- **Learning** — review queue, not storage.
- **Teach Vssyl** — verb for explicit teach flow (chat modal).
- **Behavior** — not knowledge (D8).
- Backend: `UserMemoryFact`, `/api/ai/memory/facts`, `MemoryRetrievalService`, etc.

---

## Constitution alignment

| Principle | How IA change supports it |
|-----------|---------------------------|
| **P2** Engine is emergent | “Knowledge” reflects composition, not a single memory table |
| **P3** Explicit beats inferred | Teach Vssyl + Knowledge tab = where explicit teaching lands |
| **P4** Inference reviewable | Learning tab stays separate from Knowledge |
| **P7** Explainable answers | Explain drawer links to **Knowledge**, not Memory |
| **P13** Plain-language teach | Users manage what Vssyl **knows**, not memory files |
| **D8** Behavior ≠ memory | Behavior tab unchanged |
| **D1** Route, don’t reinvent | Copy-only change; same stores and APIs |

---

## Success criteria (post-change)

A new user should understand:

1. **What Vssyl knows** → **Knowledge** tab  
2. **How to teach Vssyl** → **Improve answer** in chat, or add in **Knowledge**  
3. **Where learning happens** → **Learning** tab (review before save)  
4. **Where suggestions appear** → **Suggestions** tab  
5. **What influences answers** → **Why this answer** + **Knowledge** links  

**AI Identity** remains the canonical home for managing the personal Digital Life Twin.

---

## Implementation scope (this change)

- User-facing strings in AI Identity components and explain drawer  
- `memoryFactWhyExplanation` and related display labels in `aiMemoryFacts.ts`  
- URL alias `tab=knowledge` with redirect from legacy `tab=memory`  
- No component renames, no API or schema changes  

---

## Related documents

- [TEACH_VSSYL_PHASE_1A_IMPLEMENTATION.md](./TEACH_VSSYL_PHASE_1A_IMPLEMENTATION.md)  
- [TEACH_VSSYL_UI_FLOW.md](./TEACH_VSSYL_UI_FLOW.md)  
- [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md)
