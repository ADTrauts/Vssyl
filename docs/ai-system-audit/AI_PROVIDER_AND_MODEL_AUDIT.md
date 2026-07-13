# AI Provider and Model Audit

**Date:** 2026-07-12  

---

## Supported providers

| Provider | Adapter | API key | Vision | Tools | Default chat model |
|----------|---------|---------|--------|-------|--------------------|
| OpenAI | `server/src/ai/providers/OpenAIProvider.ts` | `OPENAI_API_KEY` | Yes | Yes | `gpt-4o` |
| Anthropic | `AnthropicProvider.ts` | `ANTHROPIC_API_KEY` | Yes | Limited vs OpenAI tools path | `claude-3-5-sonnet-20241022` |
| Local | `LocalProvider.ts` | none | No | Stub | `local` |

No Gemini (or other) provider implementation found in this audit.

---

## Interfaces and capability declarations

| Artifact | Path | Role |
|----------|------|------|
| Capability matrix SoT | `providerCapabilityMatrix.ts` | Vision/tools/fallback eligibility; version `1e-2026-06-03` |
| Vision helpers | `capabilities.ts` | `getProviderCapabilities` |
| Routing | `providerRouting.ts` | `selectLlmProvider`, `resolveVisionModelForProvider`, `resolveLlmFallback` |
| Chat catalog | `modelCatalog.ts` | UI picker + Core validation + queryCost |

---

## Defaults and selection today

| Concern | Behavior |
|---------|----------|
| Default provider | OpenAI (unless complexity=high → Anthropic; sensitive keywords → local; user preference) |
| Default models | Provider class defaults above |
| Vision | Override to matrix vision model when parts present; strip if unsupported |
| Fallback | On RATE_LIMITED / TEMP_UNAVAILABLE → alternate cloud provider if eligible |
| Retry | Provider client retries + one routing fallback attempt |
| Rate limit | Treated as fallback-triggering error class |
| Cost tracking | `queryCost` in catalog; `AIQueryService` consume; `AIUsageTracking` / admin snapshots — not full $ ledger per turn |
| Token tracking | Provider metadata partially surfaced; not a unified canonical execution record |
| User-selectable | Preferences + `AIProviderModelPicker` / models API |
| Business-selectable | Business twin policy / employee access (not full model matrix for every employee path) |
| Admin controls | Admin portal provider governance + pipeline settings |

### What routing evaluates today

| Attribute | Used? |
|-----------|-------|
| Provider preference | Yes |
| Model preference | Yes (validated against catalog) |
| Task type | **No** (not as first-class tier) |
| Capability (vision) | Yes |
| Latency target | No |
| Cost tier | Indirect via queryCost / model choice |
| Reasoning complexity | Crude `complexity === 'high'` → Anthropic |
| Tool requirement | Partial (fallback may strip tools) |
| Context length | Budget manager exists; not model-switch driver |
| Data sensitivity | Keyword heuristic → local |
| User preference | Yes |
| Business preference | Partial via business policy blocks |
| Availability / fallback | Yes |

---

## Hardcoded model inventory

| Model | File | Purpose | Active | Provider-specific | Move to central config? | Migration risk |
|-------|------|---------|--------|-------------------|-------------------------|----------------|
| `gpt-4o` | `modelCatalog.ts` | Catalog premium | Yes | OpenAI | Already catalog | Low |
| `gpt-4o-mini` | `modelCatalog.ts` | Catalog standard | Yes | OpenAI | Already | Low |
| `claude-3-5-sonnet-20241022` | `modelCatalog.ts` | Catalog | Yes | Anthropic | Already | Low |
| `claude-3-haiku-20240307` | `modelCatalog.ts` | Catalog | Yes | Anthropic | Already | Low |
| `local` | `modelCatalog.ts` | Local | Yes | Local | Already | Low |
| `gpt-4o` | `OpenAIProvider.ts` default | Default chat | Yes | OpenAI | Prefer catalog-only default | Low |
| `claude-3-5-sonnet-20241022` | `AnthropicProvider.ts` default | Default chat | Yes | Anthropic | Prefer catalog-only | Low |
| `gpt-4o` | `providerCapabilityMatrix.ts` | Vision model | Yes | OpenAI | Keep in matrix | Low |
| `claude-3-5-sonnet-20241022` | matrix | Vision model | Yes | Anthropic | Keep in matrix | Low |
| `gpt-4o-mini` | OpenAIProvider health | Health check | Yes | OpenAI | OK specialized | Low |
| `dall-e-3` | OpenAIProvider | Image gen | Yes | OpenAI | Separate media catalog | Med |
| `gpt-image-1` | OpenAIProvider | Image edit | Yes | OpenAI | Separate media catalog | Med |
| `whisper-1` | `routes/ai.ts` | Transcribe | Yes | OpenAI | Media catalog | Med |
| `tts-1` | `routes/ai.ts` | Speech | Yes | OpenAI | Media catalog | Med |
| `gpt-4o` | `documentExtractionService.ts` | Extraction | Yes | OpenAI | **Yes** | Med |
| `gpt-4o` | `factExtractionService.ts` | Fact extraction | Yes | OpenAI | **Yes** | Med |
| `gpt-4o-mini` | `notebookAICompletion.ts` / `NOTEBOOK_AI_MODEL` | Notebook | Yes | OpenAI | **Yes** (tier SPECIALIZED) | Med |

Tests also hardcode catalog ids for preference wiring — expected.

---

## Tests

| Area | Coverage |
|------|----------|
| Provider routing | Partial (pipeline/provider tests exist; not exhaustive E2E fallback) |
| Fallback | Documented in PROVIDERS.md; limited automated proof |
| Capability matching | Matrix versioned; some unit coverage |
| Catalog API | Models endpoint used by UI |

---

## Concerns

1. **No provider-neutral task tiers** — business logic thinks in OpenAI/Anthropic names.  
2. **Parallel paths ignore catalog** — Notebook, extraction, Whisper.  
3. **Sensitive → local** is keyword-based (brittle).  
4. **Complexity → Anthropic** is a coarse heuristic, not DEEP tier policy.  
5. **Model families will churn** — catalog is the right seam; Core must not grow new hardcoded ids.  
6. Docs in `docs/ai/PROVIDERS.md` largely match Core vision path (validated).

---

## Fit for future model families (architectural, no implementation)

Keep **adapters + capability declarations + catalog entries**. Introduce **logical tiers** (FAST/BALANCED/DEEP/SPECIALIZED/LOCAL_OR_PRIVATE) mapped in config only — see [AI_MODEL_ROUTING_TARGET_ARCHITECTURE.md](./AI_MODEL_ROUTING_TARGET_ARCHITECTURE.md).
