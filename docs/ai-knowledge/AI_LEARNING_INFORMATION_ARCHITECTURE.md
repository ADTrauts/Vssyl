# AI Learning Information Architecture

**Program:** AI Learning Experience Review — Phase 0A  
**Date:** 2026-07-06  
**Status:** Recommended IA — documentation only  
**Authority:** [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md), [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md)

---

## Learning in AI Identity

```
AI Identity (/ai)
├── AI Identity (home)     — influence stack, badges → Learning count
├── Learning               — INFERENCE REVIEW (this document)
├── Suggestions            — ambient workspace proposals (AISuggestion)
├── Knowledge              — active taught knowledge (post-review + explicit teach)
├── Behavior               — personality, autonomy, style boundaries
└── More → Insights        — analytics depth (not review)
```

**Chat (outside tabs):**

```
Improve answer → Teach Vssyl     — explicit teach (skips Learning)
Why this answer                  — explainability (read-only)
AILearningNotice                 — inline review for pending + session style
```

---

## Lifecycle placement

From [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md):

```
Observation → … → Review → Application → Retrieval → Answer → Feedback
                      ↑
                 LEARNING TAB
```

| Stage | Surface | Learning tab role |
|-------|---------|-------------------|
| Observation | Chat, modules, suggestion signals | **Not visible** — creates pending rows/events |
| Teach (explicit) | Teach Vssyl | **Bypasses** Learning (P3) |
| Review | **Learning tab**, chat notice | **Primary home** |
| Application | Promote / Save | Moves to **Knowledge** |
| Retrieval | Twin (invisible) | — |
| Answer | Chat | — |
| Feedback | Improve answer, explain | Routes to Teach or Learning event |

---

## Current vs recommended responsibilities

### Learning tab — current (as built)

| Section | Responsibility |
|---------|----------------|
| Header | Set expectations |
| What changed | Last application confirmation |
| Suggested for review | Pending `UserAIContext` queue |
| Learned behaviors | Pending `AILearningEvent` queue |
| Chat-only style info | Education only |
| Community learning | Privacy opt-in |
| Advanced insights | Link to More → Insights |

### Learning tab — recommended

| Section | Responsibility | Change |
|---------|----------------|--------|
| Header | **“Review what Vssyl inferred”** | Clarify vs Knowledge / Suggestions |
| What changed | Keep — **“Saved to your Knowledge”** | Align Knowledge rename |
| **Inferred from chat** | Rename from “Suggested for review” | Disambiguate Suggestions tab |
| **Inferred behaviors** | Rename from “Learned behaviors”; simplify badges | Hide eventType/confidence by default |
| Session style note | **Move to Behavior** or collapse to link | Reduce clutter |
| Community learning | **Rename** “Collective insights (optional)” | Avoid “learning” collision |
| Advanced insights | Keep link; clarify **not** workspace Suggestions | Copy fix |

**Do not add to Learning:**

- Teach Vssyl entry (stays chat + Knowledge)
- Browse active knowledge (Knowledge tab)
- Primary `AISuggestion` inbox (Suggestions tab)
- Operator pipeline (admin portal)

---

## Terminology map (fix collisions)

| User term (today) | Actually means | Recommended label |
|-------------------|----------------|-------------------|
| Learning (tab) | Inference review | **Review** or keep **Learning** with subtitle “Review inferred knowledge” |
| Suggestions (tab) | Workspace ambient ideas | **Contextual suggestions** (already used in UI) |
| Suggested for review | Pending UserAIContext | **Inferred from chat** |
| Learned behaviors | AILearningEvent queue | **Inferred patterns** or **Behavior proposals** |
| Insights → Suggestions | Predictions/recommendations | **Forecasts** or **Recommendations** (rename sub-tab) |
| Save to AI Identity | Promote to active stores | **Save to Knowledge** |
| Promote (API) | `learningStatus: active` | User verb: **Save** |
| Dismiss / Not now | `dismissed` or event rejected | **Not now** (keep) |

---

## User mental model (target)

After IA alignment, a user should hold this model:

1. **I teach directly** → Teach Vssyl in chat, or add in **Knowledge**.
2. **Vssyl notices something** → it waits in **Learning** until I save it.
3. **Vssyl proposes a workspace action** → **Suggestions** tab (open file, start chat).
4. **I want to see what it already knows** → **Knowledge**.
5. **I want to know why it answered** → **Why this answer** in chat.

---

## Badge and entry points

| Entry | Destination | Backend signal |
|-------|-------------|----------------|
| AI Identity home — Learning card | `?tab=learning` | `userAIContextLearningService.countPending()` + learning events (badge uses pending context count today) |
| Chat — AILearningNotice | inline promote/dismiss | Latest pending context |
| Chat — “+N more in Learning” | `?tab=learning` | `countPending > 1` |
| Knowledge tab — link to Suggestions | `?tab=suggestions` | Cross-link for pending proposals |
| Learning — Open Insights | `?tab=more&section=insights` | Analytics escape hatch |

**Gap:** Badge counts **pending UserAIContext only**, not pending `AILearningEvent` rows.

---

## Split / rename / simplify decision

| Option | Verdict |
|--------|---------|
| **Keep** tab | **Yes** — constitutional review gate needs a home |
| **Split** into two tabs | **No** — would fragment two small queues |
| **Rename** tab to “Review” | **Optional** — “Learning” still valid if subtitle clarifies |
| **Simplify** sections | **Yes** — priority recommendation |
| **Rewrite** backend | **No** |

---

## Related documents

- [AI_LEARNING_EXPERIENCE_AUDIT.md](./AI_LEARNING_EXPERIENCE_AUDIT.md)  
- [AI_LEARNING_RESPONSIBILITY_MATRIX.md](./AI_LEARNING_RESPONSIBILITY_MATRIX.md)  
- [AI_LEARNING_ALIGNMENT_WITH_CONSTITUTION.md](./AI_LEARNING_ALIGNMENT_WITH_CONSTITUTION.md)
