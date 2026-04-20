# AI Model Selection — Phase-by-Phase Plan

**Date:** February 2025  
**Status:** All phases (1–6) complete. Implementation pushed to git (main): `feat(ai): model selection per provider + quota differentiation`.

**Related:** [AI_PLATFORM_PHASED_PLAN.md](./AI_PLATFORM_PHASED_PLAN.md) (other AI features), [activeContext.md](./activeContext.md) (current AI state).

---

## Scope: Chat/Twin Models Only

This plan applies to **chat/twin models** only — the models that power the Digital Life Twin (text and vision *input*: answering questions, analyzing attachments, etc.). It does **not** include:

- **Image generation (DALL·E):** Uses fixed model `dall-e-3` via `POST /api/ai/generate-image`. No user-selectable model; out of scope for this project.
- **Image edit (e.g. remove background):** Uses fixed model `gpt-image-1` via `POST /api/ai/edit-image`. No user-selectable model; out of scope.

If we later add "image generation model" or "image edit model" selection, that can be a separate catalog or phase. For this project, the model catalog and UI are for **chat/twin models** (e.g. gpt-4o, gpt-4o-mini, claude-3-5-sonnet, claude-3-haiku).

---

## How We Work

- Build **one phase at a time**.
- At the **end of each phase**, the assistant will:
  - Mark the phase complete in this file (or you update it).
  - Ask: **"Phase N is complete. Ready to start Phase N+1?"**
- Do **not** start the next phase until you say yes (e.g. "Yes, start Phase N+1" or "ACT" with that intent).
- Phases are **additive**; existing behavior is preserved (provider selection still works; model selection is an enhancement).

---

## Phase Overview

| Phase | Name | Goal |
|-------|------|------|
| 1 | Model Catalog & Backend Foundation | Define available models per provider and create backend infrastructure |
| 2 | Preferences & API Integration | Store user model preferences and accept model selection in API requests |
| 3 | Core Logic & Provider Updates | Wire model selection through Core to providers; ensure vision compatibility |
| 4 | Frontend UI Implementation | Add model selection UI to settings and chat interfaces |
| 5 | Testing & Documentation | Verify end-to-end functionality and document the feature |
| 6 | Optional: Quota Differentiation | Make premium models consume more queries (optional enhancement) |

Phases 1–5 are core; Phase 6 is optional.

---

## Phase 1: Model Catalog & Backend Foundation

**Goal:** Create a source of truth for available models per provider, including metadata (label, vision support, cost tier). This enables all subsequent phases.

### Scope

- **Backend:** Create `server/src/ai/providers/modelCatalog.ts` (or similar) that exports:
  - Model definitions: `{ id, provider, label, description, supportsVision, costTier?, queryCost? }`
  - Helper functions: `getModelsForProvider(provider)`, `getModel(modelId)`, `isModelAvailable(modelId, provider)`
  - Curated list of models (**chat/twin only**; excludes image-generation models like `dall-e-3` and edit models like `gpt-image-1`):
    - **OpenAI**: `gpt-4o`, `gpt-4o-mini` (and optionally `gpt-4-turbo`, `gpt-3.5-turbo` if desired)
    - **Anthropic**: `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307` (and optionally `claude-3-opus-20240229`)
    - **Local**: `local` (single model, no selection needed)
- **Backend:** Update `capabilities.ts` to reference model catalog for vision models (or keep separate but ensure consistency).
- **Backend:** Create `GET /api/ai/models` endpoint that returns available models grouped by provider (for frontend to consume).

### Deliverables

1. **Model catalog file:** `server/src/ai/providers/modelCatalog.ts` with model definitions and helper functions.
2. **API endpoint:** `GET /api/ai/models` returns `{ openai: [...], anthropic: [...], local: [...] }` with model metadata.
3. **Consistency check:** Vision models in `capabilities.ts` align with catalog (or catalog is source of truth).

### Completion Criteria

- [x] Model catalog file exists with at least 2 models per provider (OpenAI, Anthropic).
- [x] `GET /api/ai/models` endpoint returns correct model list (testable via API call).
- [x] Helper functions work: `getModelsForProvider('openai')` returns OpenAI models.
- [x] Vision support flags are accurate (e.g. `gpt-4o` supports vision, `gpt-4o-mini` may or may not).
- [x] No breaking changes to existing provider selection or vision behavior.

### Files to Create/Modify

- **Create:** `server/src/ai/providers/modelCatalog.ts` ✅
- **Modify:** `server/src/routes/ai.ts` (add `GET /api/ai/models` route) ✅
- **Optional:** `server/src/ai/providers/capabilities.ts` (reference catalog or ensure consistency) ✅

### When Phase 1 is Done

Assistant will ask: **"Phase 1 is complete. Ready to start Phase 2?"**

---

## Phase 2: Preferences & API Integration

**Goal:** Allow users to save preferred models (per provider or global) and accept model selection in API requests.

### Scope

- **Backend:** Extend user preferences to store model selection:
  - Option A: Single `ai_preferred_model` (applies to selected provider).
  - Option B: Per-provider keys (`ai_preferred_model_openai`, `ai_preferred_model_anthropic`).
  - **Recommendation:** Option B (per-provider) for better UX (user can set different defaults for OpenAI vs Anthropic).
- **Backend:** Update `GET /api/ai/preferences` to return `preferredModel` (or per-provider models).
- **Backend:** Update `PUT /api/ai/preferences` to accept and save `preferredModel` (or per-provider).
- **Backend:** Update `POST /api/ai/twin` to accept optional `model` parameter in request body (allows per-request override).
- **Backend:** Pass `preferredModel` through to `DigitalLifeTwinService.processAsDigitalLifeTwin()` context.

### Deliverables

1. **Preferences storage:** User preferences can store model selection (per-provider or global).
2. **Preferences API:** `GET /api/ai/preferences` includes model preferences; `PUT /api/ai/preferences` accepts and saves them.
3. **Twin API:** `POST /api/ai/twin` accepts optional `model` parameter; passes to Core processing.

### Completion Criteria

- [x] User can save preferred model via `PUT /api/ai/preferences` (testable via API call).
- [x] `GET /api/ai/preferences` returns saved model preference.
- [x] `POST /api/ai/twin` accepts `model` parameter and passes it to Core (log or verify in Core).
- [x] Existing provider preference (`ai_preferred_provider`) still works.
- [x] No breaking changes to existing twin requests (model parameter is optional).

### Files to Create/Modify

- **Modify:** `server/src/routes/ai-preferences.ts` (add model preference read/write) ✅
- **Modify:** `server/src/routes/ai.ts` (accept `model` in `/twin` request body) ✅
- **Modify:** `server/src/ai/core/DigitalLifeTwinService.ts` (accept `preferredModel` in context) ✅

### When Phase 2 is Done

Assistant will ask: **"Phase 2 is complete. Ready to start Phase 3?"**

---

## Phase 3: Core Logic & Provider Updates

**Goal:** Wire model selection through `DigitalLifeTwinCore` to providers. Ensure vision requests use compatible models.

### Scope

- **Backend:** In `DigitalLifeTwinCore.processAsDigitalLifeTwin()`:
  - After selecting provider (existing logic), determine model:
    1. User preference for that provider (from Phase 2).
    2. Request override (`model` parameter from API).
    3. Vision model (from `capabilities.ts`) if vision parts are present and user model doesn't support vision.
    4. Provider default (from provider config).
  - Pass selected model to `callAIProvider()` via `options.modelOverride`.
- **Backend:** Update `callAIProvider()` to pass `modelOverride` to provider `process()` calls via `providerData`.
- **Backend:** Update `OpenAIProvider.process()` and `AnthropicProvider.process()`:
  - Use `data.modelOverride` when present (for all requests, not just vision).
  - Fallback to vision model if vision parts present and override doesn't support vision.
  - Fallback to config default.
  - Validate model is available (check against catalog or provider's known models).
- **Backend:** Ensure vision compatibility: if user selects a model that doesn't support vision but request has images, either:
  - Auto-upgrade to vision-capable model (preferred), or
  - Strip vision parts and use user's model (fallback).

### Deliverables

1. **Core model selection:** `DigitalLifeTwinCore` selects model based on preference → override → vision → default.
2. **Provider model override:** Both OpenAI and Anthropic providers use `modelOverride` when provided.
3. **Vision compatibility:** Vision requests automatically use vision-capable models (or strip vision if user model doesn't support it).
4. **Model validation:** Invalid model IDs are rejected or fallback to default (with logging).

### Completion Criteria

- [x] User preference model is used when provider matches preference.
- [x] Request `model` parameter overrides preference.
- [x] Vision requests use vision-capable models (or handle gracefully).
- [x] Invalid model IDs fallback to default (no crashes).
- [x] Existing behavior preserved: if no model preference, uses provider default.
- [x] Logging shows which model was selected (for debugging).

### Files to Create/Modify

- **Modify:** `server/src/ai/core/DigitalLifeTwinCore.ts` (model selection logic in `generateLifeTwinResponse`) ✅
- **Modify:** `server/src/ai/core/DigitalLifeTwinCore.ts` (pass `modelOverride` in `callAIProvider()`) ✅
- **Modify:** `server/src/ai/providers/OpenAIProvider.ts` (use `modelOverride` in `process()`) ✅
- **Modify:** `server/src/ai/providers/AnthropicProvider.ts` (use `modelOverride` in `process()`) ✅
- **Import:** `server/src/ai/providers/modelCatalog.ts` (getModel for resolution) ✅

### When Phase 3 is Done

Assistant will ask: **"Phase 3 is complete. Ready to start Phase 4?"**

---

## Phase 4: Frontend UI Implementation

**Goal:** Add model selection UI to settings page and chat interfaces (full page, dropdown, module).

### Scope

- **Frontend:** Create `web/src/components/ai/AIModelPicker.tsx` (similar to `AIServicePicker.tsx`):
  - Accepts `provider` and `value` (selected model ID).
  - Shows dropdown with models for that provider (from `GET /api/ai/models`).
  - Displays model label, description, optional cost indicator (e.g. "Premium" badge).
  - Handles vision compatibility (disable non-vision models when images are attached, or show warning).
- **Frontend:** Update `web/src/components/ai/ProviderSettings.tsx`:
  - Add model selection below provider selection.
  - Load models for selected provider dynamically.
  - Save model preference when user changes it.
- **Frontend:** Update `web/src/app/ai-chat/page.tsx`:
  - Add model picker (below or integrated with provider picker).
  - Load and display available models for selected provider.
  - Send `model` parameter in twin requests (or use preference as default).
- **Frontend:** Update `web/src/components/header/AIChatDropdown.tsx`:
  - Add model selection (compact version if space is limited).
  - Send `model` in requests or use preference.
- **Frontend:** Update `web/src/components/ai/AIServicePicker.tsx` (optional):
  - If keeping separate pickers, ensure model picker updates when provider changes.
  - Or create combined "Provider + Model" picker component.

### Deliverables

1. **Model picker component:** `AIModelPicker.tsx` with dropdown showing models for a provider.
2. **Settings integration:** Model selection in `ProviderSettings.tsx` saves preference.
3. **Chat integration:** Model selection in `ai-chat/page.tsx` and `AIChatDropdown.tsx`.
4. **API integration:** Frontend calls `GET /api/ai/models` to load available models.
5. **Vision handling:** UI disables or warns when non-vision model is selected with images attached.

### Completion Criteria

- [x] User can select model in settings page and preference is saved.
- [x] User can select model in AI chat (full page) and it's used in requests.
- [x] User can select model in AI chat dropdown and it's used in requests.
- [x] Model list updates when provider changes (shows only models for that provider).
- [x] Vision compatibility is handled (disable non-vision models or show warning when images attached).
- [x] Existing provider selection still works.
- [x] UI shows model descriptions/cost indicators (if implemented).

### Files to Create/Modify

- **Create:** `web/src/components/ai/AIModelPicker.tsx` ✅
- **Create:** `web/src/api/aiModels.ts` (getAIModels) ✅
- **Modify:** `web/src/components/ai/ProviderSettings.tsx` ✅
- **Modify:** `web/src/app/ai-chat/page.tsx` ✅
- **Modify:** `web/src/components/header/AIChatDropdown.tsx` ✅

### When Phase 4 is Done

Assistant will ask: **"Phase 4 is complete. Ready to start Phase 5?"**

---

## Phase 5: Testing & Documentation

**Goal:** Verify end-to-end functionality, test edge cases, and document the feature.

### Scope

- **Testing:**
  - Test model selection in settings (save and load preference).
  - Test model selection in chat (full page, dropdown, module).
  - Test per-request model override (send `model` in API request).
  - Test vision compatibility (attach image, verify vision-capable model is used).
  - Test fallback behavior (invalid model ID, missing preference, provider default).
  - Test provider switching (change provider, verify model list updates).
  - Test with all supported models (gpt-4o, gpt-4o-mini, claude-3-5-sonnet, claude-3-haiku).
- **Documentation:**
  - Update `memory-bank/activeContext.md` with model selection feature status.
  - Update `memory-bank/progress.md` if applicable.
  - Add brief note in code comments (model catalog, Core selection logic).
  - Optional: User-facing docs (settings page help text or tooltip).

### Deliverables

1. **Test coverage:** All major flows tested (preferences, chat, vision, fallbacks).
2. **Documentation:** `activeContext.md` updated with model selection status.
3. **Code comments:** Key functions documented (model selection logic, catalog structure).

### Completion Criteria

- [x] Model selection works end-to-end (settings → chat → API → provider).
- [x] Vision requests use correct models.
- [x] Fallback behavior works (invalid model, missing preference).
- [x] No regressions to existing provider selection or vision behavior.
- [x] Documentation updated (`activeContext.md`).
- [x] Code is commented where needed (model selection logic).

### Files to Create/Modify

- **Modify:** `memory-bank/activeContext.md` (add model selection section) ✅
- **Modify:** `memory-bank/progress.md` (if applicable) ✅
- **Review:** All files modified in Phases 1–4 (add comments if needed) ✅

### When Phase 5 is Done

Assistant will ask: **"Phase 5 is complete. Ready to start Phase 6 (quota differentiation), or is the feature complete?"**

---

## Phase 6: Optional — Quota Differentiation

**Goal:** Make premium models consume more queries (e.g. GPT-4o = 2 queries, GPT-4o-mini = 1 query) to reflect cost differences.

### Scope

- **Backend:** Add `queryCost` field to model catalog (default 1, premium models = 2 or 3).
- **Backend:** In `AIQueryService.consumeQuery()`, accept optional `queryCost` parameter (or determine from model used).
- **Backend:** In `POST /api/ai/twin`, after processing, determine model used and call `consumeQuery(userId, businessId, queryCost)`.
- **Backend:** Update `checkQueryAvailability()` to account for query cost (show "X queries remaining" or "X premium queries remaining").
- **Frontend:** Show query cost indicator in model picker (e.g. "Uses 2 queries" badge).
- **Frontend:** Update query balance display to show cost-aware remaining queries (or show "X standard queries, Y premium queries").

### Deliverables

1. **Query cost in catalog:** Models have `queryCost` field (1 for standard, 2+ for premium).
2. **Cost-aware consumption:** `consumeQuery()` accepts and uses `queryCost`.
3. **UI indicators:** Model picker shows query cost; balance display reflects cost.
4. **Documentation:** Explain quota differentiation in settings or help text.

### Completion Criteria

- [x] Premium models consume more queries (test: check balance before/after request).
- [x] Query balance display shows accurate remaining queries (accounting for cost).
- [x] Model picker shows query cost indicator.
- [x] Existing query consumption (1 query per request) still works for standard models.
- [x] Documentation explains quota differentiation.

### Files to Create/Modify

- **Modify:** `server/src/ai/providers/modelCatalog.ts` (add `queryCost` to model definitions) ✅
- **Modify:** `server/src/services/aiQueryService.ts` (accept `queryCost` in `consumeQuery()`) — already supports `amount` ✅
- **Modify:** `server/src/routes/ai.ts` (determine model used and pass `queryCost` to `consumeQuery()`) ✅
- **Modify:** `web/src/components/ai/AIModelPicker.tsx` (show query cost badge) ✅
- **Modify:** Query balance display components — no change (remaining is in query units; premium deducts more) ✅

### When Phase 6 is Done

Assistant will ask: **"Phase 6 is complete. Model selection feature is fully implemented with quota differentiation."**

---

## Summary

- **Phases 1–5:** Core model selection feature; build in order; after each phase, assistant asks before starting the next.
- **Phase 6:** Optional quota differentiation; can be done after Phase 5 or skipped.
- **Workflow:** Complete phase → update this doc if desired → assistant asks "Ready to start Phase N+1?" → you confirm → we start the next phase.

**When you want to begin, say "Start Phase 1" (or "ACT" with that intent).** After Phase 1 is complete, the assistant will ask for confirmation before starting Phase 2.

---

## Technical Notes

### Model Selection Priority (Phase 3)

When determining which model to use, priority order is:
1. **Request override** (`model` parameter in API request) — highest priority
2. **User preference** (saved `ai_preferred_model_[provider]`)
3. **Vision model** (if vision parts present and user model doesn't support vision)
4. **Provider default** (from provider config) — fallback

### Vision Compatibility (Phase 3)

- If user selects a model that supports vision and request has images → use user's model.
- If user selects a model that doesn't support vision but request has images → auto-upgrade to vision-capable model (preferred) or strip vision parts (fallback).
- Vision models are defined in `capabilities.ts` and should align with model catalog.

### Token Usage vs Query Cost

- **Token count:** Same prompt/response uses roughly the same number of tokens regardless of model.
- **Cost per token:** Premium models charge more per token (e.g. GPT-4o vs GPT-4o-mini).
- **Query cost:** In Vssyl, queries are counted (not tokens). Phase 6 optionally makes premium models consume more queries to reflect cost differences.

### API Request Format

```typescript
// POST /api/ai/twin
{
  query: "User's question",
  provider: "openai" | "anthropic" | "auto", // Optional, uses preference if not provided
  model: "gpt-4o" | "gpt-4o-mini" | ..., // Optional, uses preference if not provided
  context: { ... }
}
```

### Preferences Format

```typescript
// GET /api/ai/preferences
{
  preferredProvider: "openai" | "anthropic" | "auto",
  preferredModel: "gpt-4o", // Or per-provider: preferredModelOpenai, preferredModelAnthropic
}

// PUT /api/ai/preferences
{
  preferredProvider?: "openai" | "anthropic" | "auto",
  preferredModel?: "gpt-4o", // Or per-provider keys
}
```
