# AI Routing Policy

**Program:** AI Architecture Phase 7  
**Date:** 2026-07-13  
**Status:** Active — policies modeled; business/user knobs inactive unless explicitly passed (shadow)  
**Code:** `server/src/ai/routing/routingPolicy.ts` · `modelRouter.ts`  
**Policy version:** `phase7-2026-07-13`

---

## Business policies (future; inactive by default)

| Mode | Intent |
|------|--------|
| INACTIVE | Default — no business override |
| FORCE_LOCAL | Prefer local only |
| NO_EXTERNAL_AI | Block external providers |
| CHEAPEST | Bias costTier |
| HIGHEST_QUALITY | Bias premium / DEEP |
| PREFERRED_PROVIDER | Bias preferredProvider |

Phase 7 does **not** activate these from tenant config. Tests may pass them into `routeModelRequest` for shadow scoring.

---

## User preferences (future; no UI)

NONE · PREFER_FAST · PREFER_DEEP · PREFER_LOCAL · PREFER_CHEAPEST

Existing Twin preferences (`preferredProvider`, per-provider model ids) still drive **production** selection via `selectLlmProvider`.

---

## Fallback strategy (documented; new behavior not enabled)

```
DEEP → anthropic.claude-3-5-sonnet → openai.gpt-4o → local.default
BALANCED → cloud peers → local (sensitive only)
FAST → mini/haiku → BALANCED
SPECIALIZED → modality-specific only
LOCAL_OR_PRIVATE → local.default only
```

Production fallback remains Wave 1E `resolveLlmFallback` (openai↔anthropic capability-gated). Shadow decisions include a proposed `fallbackChain` for observation only.
