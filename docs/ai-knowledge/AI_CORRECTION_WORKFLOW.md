# AI Correction Workflow

**Program:** AI Knowledge Reference Program — Phase 0A  
**Date:** 2026-07-05  
**Status:** **Design only** — not implemented  
**Constraint:** Route corrections to **existing stores** — no new memory system

---

## 1. Trigger

User receives a poor AI response in `/ai-chat` (or business employee drawer).

**Affordances on assistant message:**

| Label | Tone |
|-------|------|
| **Improve this answer** | Primary — low commitment |
| **Teach Vssyl** | Direct — user knows what's wrong |
| *(thumbs down exists or future)* | Implicit signal |

---

## 2. User flow (wireframe narrative)

### Step 1 — Acknowledge

```
This answer wasn't right. Help Vssyl do better next time.
```

### Step 2 — Classify (user-friendly — not technical)

Single question with chip options:

> **What kind of fix is this?**

| Chip | User sees | Maps to |
|------|-----------|---------|
| **A fact about me** | "I work at Acme" | `UserMemoryFact` or `UserAIContext` fact |
| **A preference** | "Be more concise" | `UserAIContext` preference / `AILearningEvent` |
| **A rule** | "Always use metric units" | `UserAIContext` instruction |
| **About a file or event** | "Check my calendar" | Redirect to module — **not memory** |
| **About my company** | Business-only | Business scope — admin or business context |
| **Just this conversation** | "Ignore earlier in this chat" | Thread note (future) or session — **Phase 2** |

**Auto-suggest:** If user skips chips, default to **fact** for declarative corrections, **preference** for style.

### Step 3 — Capture correction

```
What should Vssyl know instead?
[________________________________]
```

Pre-fill from user selection text if they highlighted message before clicking.

### Step 4 — Confirm scope

| Scope | When shown |
|-------|------------|
| **Just for me** | Default personal |
| **For [Business name]** | When chat has `businessId` and user is admin |
| **Remember always** vs **This project only** | If `scopeId` contexts exist — advanced collapse |

### Step 5 — Submit outcome

```
✓ Saved. Vssyl will use this next time you ask about [topic].
```

Optional: **See what you taught** → `/ai?tab=memory`

---

## 3. Routing logic (backend — existing APIs)

| Classification | API / store | Notes |
|----------------|-------------|-------|
| Fact | `POST /api/ai/memory/facts` | Preferred for declarative |
| Preference | `POST /api/ai/user-context` `contextType: preference` | Or learning event |
| Instruction | `POST /api/ai/user-context` `contextType: instruction` | |
| Correction signal | `AILearningEvent` `eventType: correction` | Always create for analytics |
| Business fact | Business-scoped memory/context APIs | Requires `businessId` + role |
| Module data | **No save** — deep link to Calendar/Drive/etc. | Show message: "Edit your calendar event" |
| Conversation only | `AIMessage.metadata` flag (future) | Phase 2 — not memory |

**Never:** Write to pipeline policies from user correction.

---

## 4. Decision: fact vs policy vs preference vs memory

| Signal | Route |
|--------|-------|
| Declarative statement ("I am…", "My team…") | **Fact** → `UserMemoryFact` |
| Style/tone ("shorter", "more formal") | **Preference** |
| Imperative always/never | **Instruction** |
| Repeated same correction (3+ times) | **Learning event** + suggest instruction promotion |
| Entity in module (meeting, file) | **Module redirect** |
| Business compliance rule | **Business admin** approval queue |

### Auto-classifier (Phase 1B — optional assist)

Lightweight rules on correction text — **not LLM classification in v1**:

- Contains "always" / "never" → instruction  
- Contains "prefer" / "tone" / "shorter" → preference  
- Else → fact  

User can override via chips in Step 2.

---

## 5. Operator visibility

| Event | Operator sees |
|-------|---------------|
| User correction | Aggregated in pipeline quality trends (correction rate) — not per-user by default |
| Support ticket | Support context + diagnostics trace for same turn |
| Abuse | Rate limit corrections per user — future |

---

## 6. Edge cases

| Case | Behavior |
|------|----------|
| Correction conflicts with existing teach | Show "You already taught: …" — offer replace or keep both |
| Inferred pending context matches | Offer dismiss pending + save explicit |
| Wrong about attached file | Redirect to Drive; offer re-attach |
| Business employee not admin | Business chip → "Ask your admin" + copyable summary |
| Non-English | Same flow — store in user's language |

---

## 7. What user should NOT see

- Prompt text  
- Embedding / RAG  
- Context provider names  
- Pipeline intent IDs  
- Token counts  
- Provider model names (unless in Provider settings)

---

## 8. Success criteria

| Criterion | Measure |
|-----------|---------|
| User completes correction in <3 steps | UX test |
| Correct store selected >85% (with chips) | Analytics |
| Same wrong answer repeat rate drops | Diagnostics compare |
| No new Prisma models | Architecture review |

---

## 9. Implementation phases

| Phase | Deliverable |
|-------|-------------|
| 0A | This document |
| 1B | Chat UI affordance + chip flow + fact/context APIs |
| 2 | Business branch + conflict warnings |
| 3 | Thread-scoped "just this chat" |
| 4 | Auto-classifier refinement |

---

## 10. Relation to existing Learning tab

| Flow | Learning tab |
|------|--------------|
| System-inferred correction | Still lands in Learning for review |
| User-initiated **Improve answer** | **Immediate save** to Teach + optional learning event |
| User rejects inference | Learning tab dismiss — unchanged |

**Learning tab becomes:** history of system proposals — not primary correction path.
