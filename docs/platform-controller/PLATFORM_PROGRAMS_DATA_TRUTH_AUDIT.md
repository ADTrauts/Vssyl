# Platform Programs Data Truth Audit

**Program:** Platform Controller Phase 1C  
**Date:** 2026-06-24  
**Scope:** Verify each Platform Programs hub card uses real, non-misleading data

**Implementation reference:** `web/src/config/platformPrograms.ts`, `usePlatformProgramsHubHealth.ts`, `PlatformProgramCard.tsx`

---

## 1. How health is computed

On hub load, `usePlatformProgramsHubHealth` fetches five probes in parallel:

| Probe | API | Used by program |
|-------|-----|-----------------|
| Dashboard stats | `adminApiService.getDashboardStats()` | Platform Kernel |
| Pipeline quality | `getAiPipelineQualityStats({ days: 7 })` | AI Retrieval |
| Pipeline catalog | `getAiPipelineCatalog()` | Context Graph |
| Module stats | `getModuleStats()` | Marketplace Partner Runtime |
| Pilot readiness | `getMarketplaceReadiness('vssyl-pilot-assets')` | Unified Search |

Health heuristics are **client-side** in `loadProgramHealth()` — not certified program status from a governance service.

---

## 2. Per-program truth assessment

### 2.1 Platform Kernel

| Field | Source | Truth |
|-------|--------|-------|
| **healthSource** | `dashboard` | |
| **healthSummary** | `formatDashboardSystemHealth(systemHealth, systemHealthStatus)` | |
| **Underlying metric** | `getDashboardSystemHealthSummary()` → `SystemMonitoringService.getSystemHealth()` CPU+memory pressure inverted to 0–100 score | **Infrastructure proxy only** |
| **readinessSummary** | `totalUsers` · `totalBusinesses` counts | **Real DB counts** |
| **Certification label** | Static in `platformPrograms.ts` (`L3`, version, lastValidated) | **Marketing/metadata — not live-validated on hub load** |

| Status | **Partially Working** |
|--------|----------------------|
| **Misleading if** | Green card implies "Platform Kernel L3 certified and healthy" |
| **Actually means** | Host resource pressure below threshold + user/business counts |
| **Risk** | **High** — operators may confuse infra metric with kernel program health |
| **Recommended action** | Rename card subtitle to "Infrastructure pressure"; separate certification badge from live health; or add real kernel probe endpoint |

---

### 2.2 Unified Search

| Field | Source | Truth |
|-------|--------|-------|
| **healthSource** | `searchPilotReadiness` | |
| **Pilot module** | `vssyl-pilot-assets` (constant) | Single sandbox module |
| **health logic** | `searchDelegate.declared && registered && allowlisted` → healthy; declared only → degraded | |
| **API** | `GET /api/admin-portal/modules/:id/readiness` (readiness.searchDelegate) | **Real registry probe** |

| Status | **Partially Working** |
|--------|----------------------|
| **Misleading if** | Green implies fleet-wide Unified Search health |
| **Actually means** | One pilot module has search delegate wired |
| **Risk** | **Medium** — scope is intentionally pilot per Phase 1B design |
| **Recommended action** | Card already notes pilot; add explicit "Pilot module only" in healthSummary; expand probe fleet in future phase |

---

### 2.3 AI Retrieval

| Field | Source | Truth |
|-------|--------|-------|
| **healthSource** | `pipeline` | |
| **Metrics** | `retrievalTriggerPercent`, `totalTraces`, `atRiskPercent`, `atRiskCount` | From pipeline trace analytics (7d) |
| **health logic** | `atRisk <= 15%` → healthy else degraded | |

| Status | **Working** (as retrieval ops metric) |
|--------|--------------------------------------|
| **Misleading if** | Equated to entire AI platform health |
| **Actually means** | Retrieval trace quality in rolling window |
| **Risk** | Low for intended ops use |
| **Recommended action** | None for 1C; keep link to `/ai-pipeline/quality` |

---

### 2.4 Context Graph

| Field | Source | Truth |
|-------|--------|-------|
| **healthSource** | `catalog` | |
| **Metrics** | `contextSources.length`, intent count, tool policy count | From `getAiPipelineCatalog()` |
| **health logic** | `sourceCount > 0` → healthy else degraded | |

| Status | **Partially Working** |
|--------|----------------------|
| **Misleading if** | Green implies Context Graph engine connectivity / graph SLO |
| **Actually means** | At least one context source registered in pipeline catalog |
| **Risk** | **High** — registration count ≠ graph health, latency, or correctness |
| **Recommended action** | Change health label to "Sources registered"; add degraded when sources exist but probes fail; future: graph health endpoint |

---

### 2.5 Marketplace Partner Runtime

| Field | Source | Truth |
|-------|--------|-------|
| **healthSource** | `moduleStats` | |
| **Metrics** | `pendingReviews`, `totalSubmissions` from `getModuleStats()` | `moduleSubmission` table counts |
| **health logic** | `pending <= 5` → healthy else degraded | |

| Status | **Partially Working** |
|--------|----------------------|
| **Misleading if** | Green implies partner iframe/runtime sandbox healthy |
| **Actually means** | Governance queue depth for module submissions |
| **Risk** | **High** — conflates review queue with runtime certification |
| **Recommended action** | Rename summary to "Submission queue"; add runtime probe when sandbox health API exists |

---

## 3. Static metadata vs live probes

| Card field | Live? | Source |
|------------|-------|--------|
| `certificationLevel` / `certificationLabel` | **No** | Static in config |
| `version` | **No** | Static string |
| `lastValidated` | **No** | Static date string |
| `openFindings` | **No** | Static string array |
| `healthStatus` / `healthSummary` | **Yes** | Probe APIs + client heuristics |
| `readinessSummary` | **Yes** | Derived from same probes |

**Finding:** Cards can show static "L3" certification while health is `unknown` — progressive disclosure helps but **certification badge can overstate** if read without expanding health section.

---

## 4. Error handling truth

| Behavior | Truth impact |
|----------|--------------|
| Failed dashboard/pipeline/catalog/moduleStats → `healthStatus: 'unknown'` | **Good** |
| Failed readiness → unknown with "probe per module" message | **Good** |
| Partial errors → first error string in hub `error` state | **Good** |
| `readinessRes.error` not pushed to `errors[]` | **Gap** — search pilot failure may show unknown without hub-level error |

---

## 5. Program card feature table

| Program | Page | API | Data Source | Status | Risk | Recommended Action |
|---------|------|-----|-------------|--------|------|-------------------|
| Platform Kernel | platform-programs | `GET /dashboard/stats` | CPU/memory heuristic + user counts | Partially Working | High | Relabel health; decouple certification badge |
| Unified Search | platform-programs | `GET /modules/vssyl-pilot-assets/readiness` | Search delegate registry | Partially Working | Medium | Emphasize pilot scope on card |
| AI Retrieval | platform-programs | `GET /ai-pipeline/quality/stats` | Pipeline traces (7d) | Working | Low | — |
| Context Graph | platform-programs | `GET /ai-pipeline/catalog` | Context source count | Partially Working | High | Don't equate count to graph health |
| Marketplace Partner Runtime | platform-programs | `GET /modules/stats` | Submission queue counts | Partially Working | High | Rename metric; add runtime probe later |

---

## 6. Compliance with Phase 1B card standard

Per `PLATFORM_PROGRAM_CARD_STANDARD.md`:

- ✅ Progressive disclosure implemented
- ✅ Deep links to operator surfaces
- ⚠️ Health line can imply certified program status when only proxy metrics are green
- ⚠️ Static `openFindings` not synced to issue tracker automatically

---

## 7. Recommended card copy changes (documentation-only for 1C)

| Program | Current implicit message | Honest message |
|---------|-------------------------|----------------|
| Kernel | "System healthy" | "Host resource pressure: X%" |
| Search | "Search ready" | "Pilot module delegate: registered / gap" |
| Retrieval | (acceptable) | Keep trace-based wording |
| Context Graph | "N sources healthy" | "N sources registered in catalog" |
| Marketplace | "N pending reviews" | "Submission queue: N pending" |

Implementation of copy changes is **Phase 1D** — flagged here for truth alignment.

---

**Last updated:** 2026-06-24
