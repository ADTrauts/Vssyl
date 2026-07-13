# AI Platform Metrics

**Program:** AI Architecture Phase 3  
**Date:** 2026-07-12  
**Status:** Active — definitions + aggregation helpers (no charts)  
**Source of Truth for:** Platform quality metric IDs

---

## Rule

Metrics measure **platform intelligence quality**. They must not promote private knowledge into global corpora (`knowledgeScoped: true` on every definition).

---

## Defined metrics

| ID | Unit |
|----|------|
| `hallucination_rate` | ratio |
| `correction_rate` | ratio |
| `approval_rate` | ratio |
| `tool_success_rate` | ratio |
| `tool_failure_rate` | ratio |
| `provider_quality_score` | score |
| `provider_latency_p50_ms` | ms |
| `provider_latency_p95_ms` | ms |
| `retrieval_failure_rate` | ratio |
| `grounding_failure_rate` | ratio |
| `conversation_quality_score` | score |
| `evaluation_score_avg` | score |
| `business_satisfaction_avg` | score |
| `memory_correction_rate` | ratio |
| `knowledge_promotion_rate` | ratio |
| `regression_pass_rate` | ratio |

Full definitions: `AI_PLATFORM_METRIC_DEFINITIONS` in `shared/src/types/ai-intelligence-platform.ts`.  
Aggregation: `aggregatePlatformMetrics` in `platformMetrics.ts`.

---

## Non-goals

- No chart UI
- No production dashboards in Phase 3
- `knowledge_promotion_rate` counts operator-resolved Knowledge Engine correction routes — not user memory exfiltration
