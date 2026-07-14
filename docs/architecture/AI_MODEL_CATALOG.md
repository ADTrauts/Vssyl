# AI Model Catalog

**Program:** AI Architecture Phase 7  
**Date:** 2026-07-13  
**Status:** Active  
**Source of Truth for:** Canonical catalog keys and metadata  
**Code:** `server/src/ai/routing/canonicalModelCatalog.ts`  
**Related:** Chat UI catalog `providers/modelCatalog.ts` remains for preference validation during shadow mode.

---

## Rule

Runtime orchestration asks for **catalogKey** via the router. Native `providerModelId` is for **adapters only**.

---

## Entries (initial)

| Catalog key | Provider | Tier | Capabilities (sample) |
|-------------|----------|------|------------------------|
| openai.gpt-4o-mini | openai | FAST | FAST_CHAT, BALANCED_CHAT, VISION, … |
| openai.gpt-4o | openai | BALANCED | BALANCED_CHAT, DEEP_REASONING, VISION, … |
| anthropic.claude-3-5-sonnet | anthropic | DEEP | DEEP_REASONING, LONG_CONTEXT, VISION |
| anthropic.claude-3-haiku | anthropic | FAST | FAST_CHAT, BALANCED_CHAT |
| local.default | local | LOCAL_OR_PRIVATE | LOCAL_PRIVATE |
| openai.whisper-1 | openai | SPECIALIZED | AUDIO_TRANSCRIPTION |
| openai.dall-e-3 | openai | SPECIALIZED | IMAGE_GENERATION |
| openai.gpt-image-1 | openai | SPECIALIZED | IMAGE_EDIT |
| openai.text-embedding-3-small | openai | SPECIALIZED | EMBEDDINGS |

Each entry declares cost tier, limits, streaming/vision/tools/embeddings/audio/image flags, availability, status, optional deprecation.

Legacy chat `modelCatalog.ts` continues to serve GET `/api/ai/models` and preference validation until cutover.
