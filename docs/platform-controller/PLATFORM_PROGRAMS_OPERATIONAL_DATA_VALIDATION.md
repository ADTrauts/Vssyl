# Platform Programs — Operational Data Validation (Phase 1E)

**Included in:** [PLATFORM_CONTROLLER_GCP_STRIPE_VALIDATION.md](./PLATFORM_CONTROLLER_GCP_STRIPE_VALIDATION.md)  
**Date:** 2026-06-25

Per-program validation of Platform Programs hub cards against real data sources in production.

---

## Summary table

| Program | Hub API(s) | Real data source | Prod backing | Misleading? (post-1D) |
|---------|------------|------------------|--------------|---------------------|
| Platform Kernel | `GET /dashboard/stats` | `SystemMonitoringService` CPU/memory | **Yes** when monitoring returns metrics | **No** — labeled infrastructure pressure |
| Unified Search | `GET /modules/vssyl-pilot-assets/marketplace-readiness` | Registry + manifest + allowlist | **Yes** for pilot module only | **No** — pilot scoped |
| AI Retrieval | `GET /ai-pipeline/quality/stats?days=7` | Pipeline trace aggregates | **Data-dependent** | **No** — labeled pipeline quality |
| Context Graph | `GET /ai-pipeline/catalog` | Registered context sources | **Yes** (catalog registry) | **No** — not claimed as graph SLO |
| Marketplace Partner Runtime | `GET /modules/stats` | `moduleSubmission` counts | **Yes** (queue depth) | **No** — labeled review queue |

---

## Per-program detail

### Platform Kernel

- **Signal:** Infrastructure pressure % from host metrics.
- **Not measuring:** Platform Kernel L3 certification, kernel SLO, or multi-service fleet health.
- **Prod note:** If `systemHealthStatus === 'unavailable'`, card shows **Unknown** — correct behavior.

### Unified Search

- **Signal:** Search delegate declared / registered / allowlisted on pilot module.
- **Not measuring:** Unified Search indexing, fleet-wide delegate health, or search latency.
- **Prod note:** Readiness errors now surface in hub error state (1D).

### AI Retrieval

- **Signal:** 7-day retrieval trigger %, trace count, at-risk traces.
- **Not measuring:** End-user AI answer quality in product UI.
- **Prod risk:** Empty trace window → metrics may show zeros — interpret as low activity, not “healthy fleet.”

### Context Graph

- **Signal:** Count of registered context sources + intent/tool counts in readiness line.
- **Not measuring:** Graph connectivity, cross-module link health, or provider probe success rate.

### Marketplace Partner Runtime

- **Signal:** Pending submission count vs threshold.
- **Not measuring:** Partner iframe runtime, sandbox certification, or artifact scan pass rate.

---

## Static vs live on cards

| Field | Live? |
|-------|-------|
| Certification badge / version / lastValidated | **Static** (config) |
| Operational signal line | **Live** (APIs above) |
| Open findings | **Static** (config) |

Operators must not treat static certification metadata as live validation.

---

**Last updated:** 2026-06-25
