# AI Platform Wave 1E — Provider Capability Matrix Closeout

**Wave:** 1E only (provider capability + fallback hardening)  
**Date:** 2026-06-03  
**Status:** **COMPLETE**  
**Parent:** [AI_PLATFORM_CERTIFICATION_STRATEGY.md](../AI_PLATFORM_CERTIFICATION_STRATEGY.md)

---

## Objective

Canonical typed provider capability matrix; routing/fallback respects constraints; model API and pipeline diagnostics expose selection/fallback metadata.

**Out of scope:** AI-L2 formal review, centralized-ai, Drive context, ActionExecutor/toolExecutor refactors.

---

## Provider inventory

| Provider | Chat | Stream | Structured | Tools | Vision | Embeddings | Reasoning meta | Fallback eligible |
|----------|------|--------|------------|-------|--------|------------|----------------|-------------------|
| **openai** | yes | yes | yes | yes | yes | yes | no | yes |
| **anthropic** | yes | yes | yes | no | yes | no | no | yes |
| **local** | yes | no | no | no | no | no | no | no |

No test/mock LLM providers registered in production matrix.

**Source of truth:** `server/src/ai/providers/providerCapabilityMatrix.ts`

---

## Code changes

| Area | File | Change |
|------|------|--------|
| Matrix | `providerCapabilityMatrix.ts` | **New** — typed capabilities + requirements helpers |
| Routing | `providerRouting.ts` | **New** — selection, vision, fallback, models API payload |
| Vision shim | `capabilities.ts` | Delegates to matrix |
| Core | `DigitalLifeTwinCore.ts` | Uses routing service; persists `llmProviderRouting` on context |
| Models API | `routes/ai.ts` | `GET /api/ai/models` adds `capabilities` + `matrixVersion` |
| Trace | `mapPipelineTraceInputs.ts`, `buildPipelineTrace.ts` | `llmProviderRouting` on `AIPipelineTrace` |
| Diagnostics | `contextDensityReport.ts` | Orchestration includes `llmProviderRouting` |

---

## Fallback rules (1E)

1. Cross-cloud fallback only **openai ↔ anthropic** on `RATE_LIMITED` / `TEMP_UNAVAILABLE`.
2. Fallback **blocked** when required capabilities (e.g. `tool_calls`) are missing on target.
3. **Local** never used as rate-limit fallback target.
4. Vision stripped when target provider lacks vision (local path).

---

## Tests

| File | Cases |
|------|-------|
| `providerCapabilityMatrix.test.ts` | 5 |
| `providerRouting.test.ts` | 6 |
| `mapPipelineTraceInputs.test.ts` | +1 llm routing on trace |

---

## Certification

| Artifact | Change |
|----------|--------|
| `AI_PLATFORM_OPERATION_MATRIX.md` | Provider routing **P → C** |
| `AI_PLATFORM_SCORECARD.md` | Provider routing **PASS**; ready for L2 review |
| `CERTIFICATION_LEDGER.md` | L2-ready + 1E complete |
| `AI_PIPELINE_OWNERSHIP_MAP.md` | Provider selection ownership updated |

---

## AI-L2 readiness

All planned waves **1A–1E** complete. Platform is **ready for formal AI-L2 certification review** (council/sign-off — not executed in this wave).

**Remaining (non-blocking):** Household/Business/Dashboard LifeTwin stub actions; HR/scheduling context provider Prisma (future module waves).

---

## Sign-off

| Gate | Result |
|------|--------|
| Canonical capability matrix | PASS |
| Fallback respects constraints | PASS |
| Models API exposes matrix | PASS |
| Pipeline trace includes routing | PASS |
| `pnpm type-check` | PASS |
