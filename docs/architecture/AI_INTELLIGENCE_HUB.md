# AI Intelligence Hub (personal Control Center)

## Purpose

The **Intelligence** tab on `/ai` consolidates personal AI learning and insight surfaces that were previously orphaned components. It mirrors the business learning-events review pattern while exposing analytics, patterns, predictions, and recommendations in one place.

## Location

| Surface | Route / component |
|--------|-------------------|
| Control Center tab | `/ai?tab=intelligence` |
| Hub component | `web/src/components/ai/AIIntelligenceHub.tsx` |
| Sub-tabs (optional deep link) | `?tab=intelligence&intel=review` \| `analytics` \| `patterns` \| `predictions` \| `recommendations` |

## Sub-tabs

1. **Review** — `PersonalLearningEventsReview` → `GET /api/ai/learning/events`, `PUT /api/ai/learning/events/:eventId/review`
2. **Analytics** — `LearningDashboard` → `/api/ai/intelligence/learning/*`
3. **Patterns** — `SmartPatternInsights` → `/api/ai/patterns/*`
4. **Predictions** — `PredictiveIntelligenceDashboard` → `/api/ai/intelligence/predictive/*`
5. **Recommendations** — `IntelligentRecommendationsDashboard` → `/api/ai/intelligence/recommendations/*`

Dashboard children accept `embedded` to hide duplicate page headers when nested under the hub.

## Personal learning events (review model)

Uses existing `AILearningEvent` rows scoped by `userId` (no schema change).

| State | `validated` | `applied` |
|-------|-------------|-----------|
| Pending review | `false` | any |
| Approved | `true` | `true` |
| Dismissed | `true` | `false` (optional `userFeedback` prefixed `[dismissed]`) |

Service: `server/src/services/personalAILearningEventsService.ts`

Business workspace learning events remain on `GET/PUT /api/business-ai/:businessId/learning-events` and are separate from personal events.

## Related docs

- `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md` — twin prompt assembly
- `docs/architecture/AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md` — business vs personal policy injection

**Last updated:** 2026-05-18
