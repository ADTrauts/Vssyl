# AI Learning Experience Audit

**Program:** AI Learning Experience Review — Phase 0A  
**Date:** 2026-07-06  
**Status:** UX and architecture alignment audit — documentation only  
**Authority:** [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md)

---

## Executive summary

The **Learning** tab (`AILearningHub`) is **fundamentally correct** as the Constitution’s **inference review gate** (P4). It is **not** the home for explicit teaching, browsing stored knowledge, ambient workspace suggestions, or operator pipeline controls.

**Verdict:** **Keep** the tab; **simplify and reorganize** copy and section order — **no backend rewrite** required.

| Question | Answer |
|----------|--------|
| What is Learning actually for? | **Reviewing inferred knowledge** before it influences answers |
| Multiple responsibilities? | **Yes** — two review queues + confirmation + settings + deep-link |
| Constitution-aligned? | **Mostly yes** — gaps are UX/terminology, not architecture |
| User comprehension? | **Mixed** — “Suggestions” overload and engineering labels hurt clarity |

---

## Primary question: What is the purpose of the Learning page?

The Learning page currently owns **multiple** responsibilities:

| Responsibility | On page today? | Correct owner per Constitution |
|----------------|----------------|--------------------------------|
| Reviewing **inferred** knowledge | **Yes** (core) | **Learning** ✓ |
| Approving AI **suggestions** (workspace) | **Partial** (secondary queue from suggestion patterns) | **Suggestions** primary; Learning for derived preferences |
| Managing **learning events** | **Yes** | **Learning** ✓ |
| **Correcting** answers | **Indirect** (`correction` event type only) | **Teach Vssyl** (explicit) + Learning (inferred corrections) |
| **Teaching** Vssyl | **No** (correct) | **Teach Vssyl** / **Knowledge** |
| Evaluating **AI quality** | **No** (link only) | **Insights** (user depth) / **AI Pipeline** (operator) |
| **Privacy / collective** opt-in | **Yes** | **Learning** or **Behavior** (acceptable) |

**Canonical purpose (recommended):**

> **Learning is where users review what Vssyl inferred** — and choose whether it becomes durable knowledge in AI Identity.

Explicit teaching bypasses this page (Teach Vssyl → Knowledge, auto-applied per Phase 1A).

---

## Section-by-section audit

### Page header

| # | Question | Finding |
|---|----------|---------|
| 1. What does it do? | Sets expectation: inferred observations wait here; user saves or dismisses |
| 2. Backend | N/A (copy only) |
| 3. Intended user | Personal AI Identity owner |
| 4. Constitution | Aligns with P4 (inference reviewable), P13 (plain language) |
| 5. Stay here? | **Yes** |
| 6. User understands? | **Mostly** — “learning” vs “knowledge” still ambiguous post-IA rename |

**File:** `web/src/components/ai/AILearningHub.tsx` (lines 121–129)

---

### What changed

| # | Question | Finding |
|---|----------|---------|
| 1. What does it do? | Shows last **applied** learning outcome (before → after summary) |
| 2. Backend | `GET /api/ai/learning/what-changed` → `learningApplicationService.getWhatChangedSummary` (reads last promotion from user prefs key `LEARNING_LAST_PROMOTION_PREF_KEY`) |
| 3. Intended user | User who just approved a learning item |
| 4. Constitution | Supports P8/P9 (governed path with visible outcome) |
| 5. Stay here? | **Yes** — valuable confirmation |
| 6. User understands? | **Moderate** — empty state says “Approve a suggestion **below**” but pending items may be in **Suggested for review**, not Suggestions tab |

**Gap:** Empty state conflates **Suggestions tab** with **in-page review queue**.

---

### Suggested for review

| # | Question | Finding |
|---|----------|---------|
| 1. What does it do? | Lists **pending** `UserAIContext` rows; promote → active knowledge; dismiss → dismissed |
| 2. Backend | `GET /api/ai/user-context/pending`; `POST /api/ai/user-context/:id/review` `{ action: promote \| dismiss }` → `userAIContextLearningService` |
| 3. Intended user | User with chat-inferred or suggestion-pattern proposals |
| 4. Constitution | **Core P4** — inference not prompt-eligible until promoted (`learningStatus: pending` → `active`) |
| 5. Stay here? | **Yes** — primary review queue |
| 6. User understands? | **Confusing label** — “Suggested for review” vs top-level **Suggestions** tab |

**Sources of pending rows (verified):**

- `factExtractionService.extractAndSaveFacts` — post-chat inference → `learningStatus: 'pending'`, `source: 'conversation'`
- `learningApplicationService.createPendingPreferenceFromSuggestionPattern` — repeated **ambient suggestion accepts** → `tags: ['ambient_suggestion', ...]`

**Badge “From suggestions”** correctly indicates the second path.

---

### Learned behaviors (`PersonalLearningEventsReview`)

| # | Question | Finding |
|---|----------|---------|
| 1. What does it do? | Review **`AILearningEvent`** rows (human-reviewable types); approve applies to memory/preference/personality |
| 2. Backend | `GET /api/ai/learning/events?status=`; `PUT /api/ai/learning/events/:id/review` → `personalAILearningEventsService` → `learningApplicationService.applyApprovedEvent` |
| 3. Intended user | User with behavioral/correction/preference events from `AdvancedLearningEngine` and related paths |
| 4. Constitution | P4 + P8 — governed application with audit trail on event |
| 5. Stay here? | **Yes** — second review queue (different model than pending context) |
| 6. User understands? | **Weak** — exposes `eventType` (snake_case), **confidence %**, `sourceModule`; feels engineering-led |

**Reviewable types:** `correction`, `feedback`, `preference_update`, `reinforcement`, `pattern_recognition`, `prediction`, `insight` (`HUMAN_REVIEWABLE_EVENT_TYPES`).

**Not shown:** `behavioral_signal` (auto-validated by design).

---

### Chat-only style adjustments (informational card)

| # | Question | Finding |
|---|----------|---------|
| 1. What does it do? | Explains session-only style; actual actions live in **chat** (`AILearningNotice`) |
| 2. Backend | `promoteSessionPreferences` → `POST /api/ai/preferences/promote-session` (from chat banner, not this card) |
| 3. Intended user | Chat users |
| 4. Constitution | D8 — session vs durable; aligns |
| 5. Stay here? | **Optional** — could move to Behavior or help doc |
| 6. User understands? | **Yes** as explanation; **dead end** on this page (no action) |

---

### Community learning (optional)

| # | Question | Finding |
|---|----------|---------|
| 1. What does it do? | Toggles `allowCollectiveLearning` privacy setting |
| 2. Backend | `getUserPrivacySettings` / `updateUserPrivacySettings` |
| 3. Intended user | Privacy-conscious user |
| 4. Constitution | P14/P15 — opt-in collective; aligns |
| 5. Stay here? | **Debatable** — fits **Behavior** or account privacy |
| 6. User understands? | **Moderate** — “community learning” vs personal Learning tab name collision |

---

### Advanced insights (link card)

| # | Question | Finding |
|---|----------|---------|
| 1. What does it do? | Links to `/ai?tab=more&section=insights` |
| 2. Backend | `AIIntelligenceHub` — analytics, patterns, predictions |
| 3. Intended user | Power users |
| 4. Constitution | Analytics ≠ taught knowledge (D8) — correct separation |
| 5. Stay here? | **Yes** as escape hatch |
| 6. User understands? | **Confusing** — Insights also has a **“Suggestions”** sub-tab (predictions/recommendations ≠ `AISuggestion`) |

---

## Compare: Learning vs other surfaces

| Surface | Primary job | Overlap with Learning |
|---------|-------------|----------------------|
| **Teach Vssyl** | Explicit teach → auto-save to Knowledge | **None** on page (correct); both end in Knowledge stores |
| **Knowledge** | Browse/edit **active** taught knowledge | Learning **feeds** Knowledge on promote; no overlap in UI |
| **Suggestions** | `AISuggestion` accept/dismiss → chat/module actions | Accept **patterns** may create **pending** rows on Learning |
| **Behavior** | Personality + autonomy | Session style promote overlaps conceptually |
| **Why this answer** | Explainability | Read-only; no review |
| **AI Pipeline** | Operator intents, grounding, traces | **No user overlap** |

---

## Issues found

### Duplicate concepts

| Issue | Detail |
|-------|--------|
| **“Suggestions” triple meaning** | (1) AI Identity **Suggestions** tab, (2) Learning **“Suggested for review”**, (3) Insights **Suggestions** sub-tab |
| **“Save to AI Identity”** | Same CTA for pending context, learning events, chat banners — outcome is **Knowledge** stores |
| **Two review queues** | Pending `UserAIContext` vs `AILearningEvent` — same buttons, different backends |

### Confusing terminology

- **Learning** vs **learning events** vs **community learning**
- **Promote** (API) vs **Save to AI Identity** (UI)
- **eventType** badges (`preference_update`, `pattern_recognition`)
- **Confidence %** on events — engineering metric

### Hidden features

- Chat **`AILearningNotice`** promotes/dismisses pending context without visiting Learning
- **Validated** filter on learning events (“Saved earlier”) — easy to miss
- Suggestion-pattern pending rows only appear after **repeated accepts** on Suggestions tab

### Wrong place / predating Constitution

| Item | Issue |
|------|-------|
| Community learning toggle | Name collides with tab purpose |
| Insights → Suggestions sub-tab | Legacy naming; not `AISuggestion` |
| Fact extraction comment | “Like ChatGPT Custom Instructions” — predates explicit **Teach Vssyl** / review-first framing |

### Engineering concepts exposed

- `eventType`, `sourceModule`, confidence percentage
- “Learning events” as user-facing label
- `promote` / `dismiss` vs human verbs

### Workflow dead ends

- Chat-only style card — no action on Learning page
- “What changed” empty → points to wrong “suggestion” surface

---

## Final answers (Phase 0A)

See [AI_LEARNING_ALIGNMENT_WITH_CONSTITUTION.md](./AI_LEARNING_ALIGNMENT_WITH_CONSTITUTION.md) for full list.

**Page disposition:** **Keep + Simplify + Reorganize** (terminology and section clarity). **Not** split into new tabs. **Not** “no changes.”

**Reorganization without rewrite:** Yes — copy, section titles, empty states, CTA alignment to “Save to Knowledge,” collapse or relocate informational cards, hide engineering badges from default view.

---

## Related documents

- [AI_LEARNING_INFORMATION_ARCHITECTURE.md](./AI_LEARNING_INFORMATION_ARCHITECTURE.md)  
- [AI_LEARNING_RESPONSIBILITY_MATRIX.md](./AI_LEARNING_RESPONSIBILITY_MATRIX.md)  
- [AI_LEARNING_ALIGNMENT_WITH_CONSTITUTION.md](./AI_LEARNING_ALIGNMENT_WITH_CONSTITUTION.md)  
- [AI_IDENTITY_INFORMATION_ARCHITECTURE_REVIEW.md](./AI_IDENTITY_INFORMATION_ARCHITECTURE_REVIEW.md)
