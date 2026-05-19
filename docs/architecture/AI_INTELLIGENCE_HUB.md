# AI Insights (personal Control Center)

**Last updated:** 2026-05-18 (AI Identity Phase 4)

## Purpose

**Insights** is the optional, advanced analytics surface for personal AI — consolidated under **More → Insights** on `/ai`. It replaces the former top-level **Intelligence** tab and five separate sub-tabs with a calmer three-tab layout.

Everyday learning review (chat suggestions, learned behaviors) lives on the **Learning** tab (`AILearningHub`), not here.

## Location

| Surface | Route / component |
|--------|-------------------|
| Control Center entry | `/ai` → **More** → **Insights** (`?tab=more&section=insights`) |
| Hub component | `web/src/components/ai/AIIntelligenceHub.tsx` (Insights-only) |
| Activity summary strip | `web/src/components/ai/InsightsActivityStrip.tsx` |
| Sub-tabs | `?intel=analytics` \| `patterns` \| `suggestions` |

### Legacy URLs (redirected)

| Old | New |
|-----|-----|
| `?tab=intelligence` | `?tab=more&section=insights` |
| `?intel=review` | `analytics` |
| `?intel=predictions` \| `recommendations` | `suggestions` |

Routing helpers: `web/src/lib/aiControlCenterTabs.ts`, `resolveInsightsSubTab()` in `AIIntelligenceHub.tsx`.

## Sub-tabs (collapsed)

1. **Analytics** — `LearningDashboard` → `/api/ai/intelligence/learning/*`
2. **Patterns** — `SmartPatternInsights` → `/api/ai/patterns/*`
3. **Suggestions** — `PredictiveIntelligenceDashboard` + `IntelligentRecommendationsDashboard` (stacked) → predictive + recommendations APIs

Embedded children hide duplicate page headers when nested under the hub.

## Learning vs Insights

| Concern | Tab | APIs / UI |
|--------|-----|-----------|
| Pending context from chat, promote/dismiss | **Learning** | `GET /api/ai/context/pending`, `AILearningHub` |
| Personal `AILearningEvent` review | **Learning** | `PersonalLearningEventsReview`, `GET/PUT /api/ai/learning/events` |
| Analytics, patterns, predictions, recommendations | **Insights** | Intelligence routes under `/api/ai/intelligence/*` |

Business workspace learning events remain on Business **Workspace AI** admin — not mixed with personal rows.

## Removed / consolidated (Phase 4)

- Orphan UI: `LearnedFromChatBanner`, `SessionStylePromoteBanner` (replaced by `AILearningNotice` in `/ai-chat`)
- Debug orphans: `AutonomyControlsTest`, `AutonomyControlsHybrid`
- Top-level Intelligence tab and separate Predictions / Recommendations tabs (merged into **Suggestions**)

## Related docs

- `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md` — twin prompt assembly
- `docs/architecture/AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md` — workspace vs personal AI Identity
