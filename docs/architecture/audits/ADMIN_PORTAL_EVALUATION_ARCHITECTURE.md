# Admin Portal — Evaluation Architecture

**Package:** 0D-E — Diagnostics & Evaluation Consolidation  
**Date:** 2026-06-17

---

## 1. Scope

**Evaluation** = controlled dry-run of twin pipeline, suggestion correlation, and module context probes — **not** production A/B or centralized-ai experiment scaffold (retired 0D-B).

---

## 2. Current state

| Surface | Owner | Status |
|---------|-------|--------|
| AI Test Lab panel | AI Pipeline | Production — `POST /ai-pipeline/test-lab` |
| Suggestion dry-run | AI Pipeline | Production — `POST /suggestions/dry-run` |
| Suggestion funnel metrics | AI Pipeline | Production — `GET /suggestions/metrics` |
| Context provider health | AI Pipeline | Production — `POST /context-providers/health` |
| Pipeline diagnostics | AI Pipeline | Production — trace forensics |
| Quality dashboard | AI Pipeline | Production — enforcement trends |
| ai-context validation tab | Legacy | Transitional — `POST /ai-context-debug/validate` |
| centralized-ai A/B | Deprecated | 410 fenced |

---

## 3. Target ownership

```
/admin-portal/ai-pipeline/test-lab  (CANONICAL evaluation hub)
    ├── SuggestionCorrelationDryRunPanel
    ├── AITestLabPanel
    └── ContextProviderHealthPanel

/admin-portal/ai-pipeline/diagnostics  (CANONICAL forensics)
    └── PipelineTraceDetail + evidence

/admin-portal/ai-pipeline/quality  (CANONICAL monitoring)
    └── PipelineQualityDashboard
```

**Single operator path:** Pipeline hub → Observe (diagnostics / test lab) → Govern (quality).

---

## 4. Capability mapping

| Capability | UI | API | Service |
|------------|-----|-----|---------|
| Twin prompt dry-run | `AITestLabPanel` | `POST /test-lab` | `DigitalLifeTwinService` |
| Provider selection in test | Test lab form | `body.provider` | Provider routing |
| Suggestion fixture eval | `SuggestionCorrelationDryRunPanel` | `POST /suggestions/dry-run` | `SuggestionDryRunService` |
| Funnel metrics | Same panel | `GET /suggestions/metrics` | `getSuggestionFunnelMetrics` |
| Module provider probe | `ContextProviderHealthPanel` | `POST /context-providers/health` | `moduleContextProviderHealthCheck` |
| Trace replay / evidence | `PipelineTraceDetail` | `GET /diagnostics/:id/evidence` | `evidenceBundleFromTrace` |
| At-risk / weak phrase trends | `PipelineQualityDashboard` | `GET /quality/stats` | `getPipelineQualityStats` |

---

## 5. Remaining gaps

| Gap | Impact | Package |
|-----|--------|---------|
| Context validation UI only on ai-context | Operator split brain | 0D-F redirect or pipeline panel |
| No HTTP tests for test-lab POST | AP-F-030 partial | 0D-E added GET smoke; POST deferred |
| ai-context `POST /assemble` no UI | API-only debug path | Document; merge to test-lab later |
| Evaluation results not linked from diagnostics list | UX friction | 0D-F optional deep link |

---

## 6. Non-goals (0D-E)

- No Business AI evaluation merge
- No provider governance changes
- No centralized-ai A/B revival
- No certification work

---

**Conclusion:** Evaluation architecture is **pipeline-centric** today; legacy ai-context tabs are the only duplicate evaluation/diagnostics path, dispositioned for 0D-F retirement.
