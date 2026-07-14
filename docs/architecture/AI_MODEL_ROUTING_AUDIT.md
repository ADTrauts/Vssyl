# AI Model Routing Audit

**Program:** AI Architecture Phase 7  
**Date:** 2026-07-13  
**Status:** Active  
**Source of Truth for:** Inventory of provider/model coupling before/during Phase 7 shadow routing  
**Companion:** [`AI_MODEL_ROUTER_ARCHITECTURE.md`](./AI_MODEL_ROUTER_ARCHITECTURE.md) · [`AI_MODEL_ROUTING_READINESS.md`](./AI_MODEL_ROUTING_READINESS.md)

Classification: **Canonical** · **Migration Required** · **Historical** · **Specialized Exemption**

---

## Summary

| Class | Count (approx) | Disposition |
|-------|----------------|-------------|
| Canonical | Provider matrix + selectLlmProvider + chat modelCatalog + new Model Router | Keep; router is decision SoT in shadow |
| Migration Required | Twin prefs / provider defaults still expose model ids | Phase 7B+ when cutting shadow over |
| Specialized Exemption | Whisper, DALL·E, notebook, extraction | Capability-shadowed; adapters still use native ids |
| Historical | Hardcoded defaults inside adapters | Adapter-local only |

---

## Inventory

| Location | Coupling | Class |
|----------|----------|-------|
| `server/src/ai/routing/*` (Phase 7) | Capability → catalogKey | **Canonical** |
| `providerRouting.selectLlmProvider` | Live Twin provider pick + shadow attach | **Canonical** (live) + shadow |
| `providerCapabilityMatrix.ts` | Provider capabilities + visionModel strings | **Canonical** (capability gates) / visionModel **Migration Required** |
| `providers/modelCatalog.ts` | Chat picker / preference validation | **Canonical** (UI/pref validation) |
| `DigitalLifeTwinCore` | Calls `selectLlmProvider`; validates pref model via catalog | **Migration Required** (prefs still model ids) |
| `OpenAIProvider` defaults `gpt-4o`, image models | Adapter defaults | **Historical** / adapter-local |
| `AnthropicProvider` default Claude id | Adapter defaults | **Historical** / adapter-local |
| `routes/ai.ts` `whisper-1` | Transcription | **Specialized Exemption** (shadow: AUDIO_TRANSCRIPTION) |
| `notebookAICompletion.ts` `gpt-4o-mini` | Notebook | **Specialized Exemption** (shadow: STRUCTURED_SUMMARY) |
| `factExtractionService.ts` `gpt-4o` | Fact extract | **Specialized Exemption** (shadow: STRUCTURED_EXTRACTION) |
| `documentExtractionService.ts` `gpt-4o` | Doc extract | **Specialized Exemption** (shadow: STRUCTURED_EXTRACTION) |
| Image gen/edit paths | DALL·E / gpt-image | **Specialized Exemption** (catalog IMAGE_*) |
| User preference keys `ai_preferred_model_*` | Store native model ids | **Migration Required** |
| Business / Personal Twin | Via Core / shared routing | Inherit shadow — **Canonical** path |
| Admin Pipeline Model Routing page | Observe-only | **Canonical** |
| FakeAI / tests | Synthetic | **Canonical** test seam |

---

## Surfaces

| Surface | Behavior in Phase 7 |
|---------|---------------------|
| Twin / Business Twin | Production = `selectLlmProvider` unchanged; shadow proposed route recorded |
| Notebook | Production model unchanged; shadow STRUCTURED_SUMMARY |
| Whisper | Production whisper-1; shadow AUDIO_TRANSCRIPTION |
| Vision | Still matrix vision model adjustment; catalog VISION capability |
| Image generation | Catalog IMAGE_GENERATION (adapter path unchanged) |
| Extraction | Production gpt-4o; shadow STRUCTURED_EXTRACTION |
| Embeddings | Catalog entry; no forced cutover |
| Admin AI | Model Routing observe page |
| Personal / Business AI chat | Twin path |

---

## Success criteria check

| Criterion | Status |
|-----------|--------|
| One Model Router | Yes (`routeModelRequest`) |
| Production unchanged via shadow | Yes |
| Ops can compare current vs proposed | Yes (Pipeline Model Routing) |
| Subsystems request capabilities | Specialized + Twin shadow inputs do; full cutover deferred |
