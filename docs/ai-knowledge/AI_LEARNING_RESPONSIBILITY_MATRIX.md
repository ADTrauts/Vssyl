# AI Learning Responsibility Matrix

**Program:** AI Learning Experience Review — Phase 0A  
**Date:** 2026-07-06  
**Status:** Action → backend map (verified from code)

---

## Visible actions on Learning page

### Pending UserAIContext (`Suggested for review`)

| UI action | API | Service | Model change |
|-----------|-----|---------|--------------|
| **Save to AI Identity** | `POST /api/ai/user-context/:id/review` `{ action: "promote" }` | `userAIContextLearningService.promote` | `UserAIContext.learningStatus` → `active`, `active` → `true`, `source` → `user`; `learningApplicationService.recordContextPromotion` |
| **Not now** | Same endpoint `{ action: "dismiss" }` | `userAIContextLearningService.dismiss` | `learningStatus` → `dismissed`, `active` → `false` |

**Prompt effect:** Only `learningStatus: active` rows are prompt-eligible (`promptEligibleContextWhere`).

**Does not create:** `UserMemoryFact` on promote (unless content type is fact — still stored as `UserAIContext`, not memory fact table).

---

### AILearningEvent (`Learned behaviors`)

| UI action | API | Service | Model change |
|-----------|-----|---------|--------------|
| **Save to AI Identity** | `PUT /api/ai/learning/events/:id/review` `{ approved: true }` | `personalAILearningEventsService.reviewEvent` → `learningApplicationService.applyApprovedEvent` | See routing table below; `validated: true`, `applied: true`, confidence bump, `patternData` artifact |
| **Not now** | Same `{ approved: false }` | `reviewEvent` → `buildDismissedUpdate` | `validated: true`, `applied: false`, confidence decay, dismiss artifact |

#### `applyApprovedEvent` routing

| `eventType` | Target store | Service method |
|-------------|--------------|----------------|
| `correction` | `UserMemoryFact` | `applyToMemory` → `createUserMemoryFact` |
| Payload with `traitKey` + `traitValue` | Personality profile | `applyToPersonality` |
| Default (preference_update, feedback, etc.) | `UserAIContext` | `applyToPreferenceContext` → create active preference |

**After apply:** `getWhatChangedSummary` can read last promotion from user preference key.

---

### What changed (read-only)

| UI | API | Service |
|----|-----|---------|
| Display card | `GET /api/ai/learning/what-changed` | `learningApplicationService.getWhatChangedSummary(userId)` |

No user action on this section.

---

### Community learning

| UI action | API | Model |
|-----------|-----|-------|
| Enable / Enabled toggle | `updateUserPrivacySettings` | User privacy: `allowCollectiveLearning` |

---

### Advanced insights

| UI action | Destination | Backend |
|-----------|-------------|---------|
| Open Insights | `/ai?tab=more&section=insights` | `AIIntelligenceHub` (analytics components) |

---

## Related actions outside Learning page

### Teach Vssyl (chat — not on Learning page)

| UI action | API | Store |
|-----------|-----|-------|
| Save (Fact / Vocabulary) | `POST /api/ai/memory/facts` | `UserMemoryFact` — **active immediately** |
| Save (Preference) | `POST /api/ai/user-context` | `UserAIContext` — `learningStatus: active` — **no review** |

**Constitution:** P3 explicit beats inferred — **bypasses Learning**.

---

### Suggestions tab (`AmbientSuggestionsView`)

| UI action | API | Service | Model change |
|-----------|-----|---------|--------------|
| **Accept** | `POST /api/ai/suggestions/:id/accept` | `ambientSuggestionService.acceptSuggestion` | `AISuggestion.status` → `ACCEPTED`; may `recordSuggestionAccepted` → signals |
| **Dismiss** | dismiss endpoint | `ambientSuggestionService.dismissSuggestion` | `AISuggestion.status` → `DISMISSED` |

**Side effect → Learning:** Repeated accepts trigger `createPendingPreferenceFromSuggestionPattern` → new **pending** `UserAIContext` with `ambient_suggestion` tag → appears in Learning **Suggested for review**.

**Does not directly promote** to active knowledge.

---

### Chat `AILearningNotice`

| UI action | API | Same as |
|-----------|-----|---------|
| Save to AI Identity (pending) | `reviewPendingLearning(..., 'promote')` | Learning — pending context promote |
| Not now (pending) | `reviewPendingLearning(..., 'dismiss')` | Learning — dismiss |
| Save (session style) | `POST /api/ai/preferences/promote-session` | `promoteSessionPreferences` → durable preference path |

---

### Why this answer (`AIResponseExplainDrawer`)

| UI action | Effect |
|-----------|--------|
| View in Knowledge | Navigate to Knowledge tab |
| Review Learning | Link to `?tab=learning` when learning items influenced reply |

Read-only explainability — **no model writes**.

---

### Knowledge tab (direct CRUD)

| UI action | API | Store |
|-----------|-----|-------|
| Add / edit / delete knowledge | `/api/ai/memory/facts`, `/api/ai/user-context` | Direct CRUD — **no Learning review** |

User-initiated — treated as explicit (P3).

---

### AI Pipeline (operator)

| Action | Surface | User Learning page? |
|--------|---------|---------------------|
| Edit intents, grounding, policies | Admin portal AI Pipeline | **No** |
| View traces | Operator diagnostics | **No** |

---

## Observation → Learning queue (upstream, not on page)

| Source | Creates | Review surface |
|--------|---------|----------------|
| `factExtractionService` | `UserAIContext` `learningStatus: pending` | Learning — Suggested for review |
| `AdvancedLearningEngine` | `AILearningEvent` (reviewable types) | Learning — Learned behaviors |
| Repeated suggestion accepts | Pending preference via `createPendingPreferenceFromSuggestionPattern` | Learning — with “From suggestions” badge |
| `maybePersistRememberThatFact` | `UserMemoryFact` explicit | **Knowledge** — skips Learning |
| Teach Vssyl | Memory fact or active context | **Knowledge** — skips Learning |

---

## Responsibility ownership summary

| Concern | Owner surface |
|---------|---------------|
| Explicit teach | Teach Vssyl, Knowledge CRUD |
| Inferred review | **Learning** (+ chat notice) |
| Workspace proposals | **Suggestions** |
| Active knowledge browse | **Knowledge** |
| Style / personality | **Behavior** |
| Explainability | Chat — Why this answer |
| Operator governance | **AI Pipeline** (admin) |
| Analytics depth | **More → Insights** |

---

## Related documents

- [AI_LEARNING_EXPERIENCE_AUDIT.md](./AI_LEARNING_EXPERIENCE_AUDIT.md)  
- [AI_LEARNING_INFORMATION_ARCHITECTURE.md](./AI_LEARNING_INFORMATION_ARCHITECTURE.md)  
- [AI_LEARNING_ALIGNMENT_WITH_CONSTITUTION.md](./AI_LEARNING_ALIGNMENT_WITH_CONSTITUTION.md)
