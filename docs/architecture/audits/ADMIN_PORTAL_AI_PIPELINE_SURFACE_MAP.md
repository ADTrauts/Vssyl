# Admin Portal — AI Pipeline Surface Map

**Package:** 0D-D — AI Pipeline Consolidation  
**Initiative:** AP-AI-02  
**Date:** 2026-06-17  
**Canonical prefix:** `/api/admin-portal/ai-pipeline/*` (mount via `admin-portal.ts`)

---

## 1. Executive summary

| Metric | Value |
|--------|-------|
| API handlers | **45** (`adminPortalRoutes.aiPipeline.ts`, ~1,322 LOC) |
| UI pages | **10** under `/admin-portal/ai-pipeline` |
| Pipeline components | **32** in `web/src/components/admin-portal/ai-pipeline/` |
| Backend pipeline services | **21** modules in `server/src/ai/pipeline/` |
| `adminApiService` pipeline methods | **30** |
| HTTP integration tests | **0** (AP-F-030 — deferred 0D-E) |

---

## 2. Pages

| Page | Path | Classification | Primary capability |
|------|------|----------------|-------------------|
| Hub | `/admin-portal/ai-pipeline` | **CANONICAL** | Operations console, health, provider governance |
| Intents | `.../intents` | **CANONICAL** | Intent catalog registry |
| Grounding | `.../grounding` | **CANONICAL** | Grounding rules |
| Sources | `.../sources` | **CANONICAL** | Context sources |
| Tools | `.../tools` | **CANONICAL** | Tool policies |
| Diagnostics | `.../diagnostics` | **CANONICAL** | Trace forensics |
| Test Lab | `.../test-lab` | **CANONICAL** | Dry-run + evaluation |
| Quality | `.../quality` | **CANONICAL** | Enforcement stats |
| Audit | `.../audit` | **CANONICAL** | Policy audit log |
| Compliance | `.../compliance` | **CANONICAL** | Retention, export, purge |

**Related non-pipeline pages (not owned here):**

| Page | Classification | Notes |
|------|----------------|-------|
| `/admin-portal/ai-system` | TRANSITIONAL | Launcher only (0D-D: single pipeline card) |
| `/admin-portal/ai-context` | **LEGACY** duplicate diagnostics | Merge target 0D-E — not modified in 0D-D |
| `/admin-portal/ai-learning` | **DEPRECATED** | Redirects to pipeline hub (0D-B) |

---

## 3. API routes (45 handlers)

### Registry & catalog

| Method | Path | Classification |
|--------|------|----------------|
| GET | `/ai-pipeline/catalog` | CANONICAL |
| GET | `/ai-pipeline/registry/graph` | CANONICAL |
| POST | `/ai-pipeline/registry/validate` | CANONICAL |

### Policy — intents (10)

| Method | Path |
|--------|------|
| POST | `/ai-pipeline/policies/intents` |
| POST | `/ai-pipeline/policies/intents/:intentId/duplicate` |
| POST | `/ai-pipeline/policies/intents/:intentId/archive` |
| POST | `/ai-pipeline/policies/intents/:intentId/restore` |
| POST | `/ai-pipeline/policies/intents/:intentId/enable` |
| POST | `/ai-pipeline/policies/intents/:intentId/disable` |
| PUT | `/ai-pipeline/policies/intents/:intentId` |

### Policy — grounding (8)

| Method | Path |
|--------|------|
| POST | `/ai-pipeline/policies/grounding` |
| PUT | `/ai-pipeline/policies/grounding/:intentId` |
| POST | `/ai-pipeline/policies/grounding/:intentId/duplicate` |
| POST | `/ai-pipeline/policies/grounding/:intentId/archive` |
| POST | `/ai-pipeline/policies/grounding/:intentId/restore` |
| POST | `/ai-pipeline/policies/grounding/:intentId/enable` |
| POST | `/ai-pipeline/policies/grounding/:intentId/disable` |

### Policy — sources (8)

| Method | Path |
|--------|------|
| POST | `/ai-pipeline/policies/sources` |
| PUT | `/ai-pipeline/policies/sources/:sourceId` |
| POST | `/ai-pipeline/policies/sources/:sourceId/duplicate` |
| POST | `/ai-pipeline/policies/sources/:sourceId/archive` |
| POST | `/ai-pipeline/policies/sources/:sourceId/restore` |
| POST | `/ai-pipeline/policies/sources/:sourceId/enable` |
| POST | `/ai-pipeline/policies/sources/:sourceId/disable` |

### Policy — tools (8)

| Method | Path |
|--------|------|
| POST | `/ai-pipeline/policies/tools` |
| PUT | `/ai-pipeline/policies/tools/:toolId` |
| POST | `/ai-pipeline/policies/tools/:toolId/duplicate` |
| POST | `/ai-pipeline/policies/tools/:toolId/archive` |
| POST | `/ai-pipeline/policies/tools/:toolId/restore` |
| POST | `/ai-pipeline/policies/tools/:toolId/enable` |
| POST | `/ai-pipeline/policies/tools/:toolId/disable` |

### Settings, observability, evaluation

| Method | Path | Classification |
|--------|------|----------------|
| PUT | `/ai-pipeline/policies/settings` | CANONICAL |
| GET | `/ai-pipeline/audit` | CANONICAL |
| GET | `/ai-pipeline/quality/stats` | CANONICAL |
| GET | `/ai-pipeline/diagnostics` | CANONICAL |
| GET | `/ai-pipeline/diagnostics/:traceId` | CANONICAL |
| GET | `/ai-pipeline/diagnostics/:traceId/evidence` | CANONICAL |
| POST | `/ai-pipeline/diagnostics/export` | CANONICAL |
| POST | `/ai-pipeline/test-lab` | CANONICAL |
| POST | `/ai-pipeline/context-providers/health` | CANONICAL (module context) |
| GET | `/ai-pipeline/suggestions/metrics` | CANONICAL |
| POST | `/ai-pipeline/suggestions/dry-run` | CANONICAL |
| GET | `/ai-pipeline/retention` | CANONICAL |
| PUT | `/ai-pipeline/retention` | CANONICAL |
| POST | `/ai-pipeline/retention/purge` | CANONICAL |

**Satellite (documented, not pipeline prefix):**

| Mount | Handlers | Classification |
|-------|----------|----------------|
| `/api/admin/ai-providers` | 8 | SATELLITE — provider governance (0D-C) |
| `/api/ai-context-debug` | 6 | LEGACY — diagnostics duplicate (0D-E) |
| `/api/centralized-ai` | 97 | DEPRECATED — all 410 (0D-B) |

---

## 4. Components (32)

| Component | Classification | Used by |
|-----------|----------------|---------|
| `PipelineOperationsHub` | CANONICAL | Hub page |
| `PipelineHubToolSections` | CANONICAL | Hub navigation cards |
| `ProviderGovernancePanel` | CANONICAL (satellite UI) | Hub `#provider-governance` |
| `PipelineSubpageShell` | CANONICAL | All sub-pages |
| `PipelineHealthMetrics` | CANONICAL | Hub |
| `PipelineLiveActivityFeed` | CANONICAL | Hub |
| `PipelineAtRiskTrends` | CANONICAL | Hub |
| `PipelineEnforcementBadge` | CANONICAL | Hub |
| `PipelineTraceTable` / `PipelineTraceDetail` | CANONICAL | Diagnostics |
| `AITestLabPanel` | CANONICAL | Test lab |
| `SuggestionCorrelationDryRunPanel` | CANONICAL | Test lab |
| `ContextProviderHealthPanel` | CANONICAL | Test lab |
| `PipelineQualityDashboard` | CANONICAL | Quality |
| `PipelinePolicyAuditTable` | CANONICAL | Audit |
| `PipelineCompliancePanel` | CANONICAL | Compliance |
| `PipelinePolicyEditors` | CANONICAL | Grounding/sources/tools |
| Registry suite (`PipelineIntentRegistrySection`, etc.) | CANONICAL | Intents + registry pages |
| Evidence/diagnostic panels (`ContextDensityPanel`, etc.) | CANONICAL | Trace detail |

---

## 5. Hooks

| Hook | Classification | Purpose |
|------|----------------|---------|
| `usePipelineHubData` | CANONICAL | Hub metrics + traces polling |
| `usePipelineCatalog` | CANONICAL | Catalog load for editors |
| `usePipelineRegistry` | CANONICAL | Registry graph + validation |

---

## 6. Backend services (`server/src/ai/pipeline/`)

| Service module | Classification | Route consumer |
|----------------|----------------|----------------|
| `pipelineCatalogService` | CANONICAL | Catalog, policies, audit, settings |
| `pipelineRegistryService` | CANONICAL | CRUD, archive, enable/disable |
| `pipelineRegistryValidator` | CANONICAL | Graph + validate |
| `pipelineDiagnosticPersistence` | CANONICAL | Diagnostics list/detail |
| `pipelineRetentionService` | CANONICAL | Retention, export, purge |
| `pipelineTraceStore` | CANONICAL | Trace storage |
| `buildPipelineTrace` / `mapPipelineTraceInputs` | CANONICAL | Test lab trace build |
| `pipelineEnforcement` | CANONICAL | Runtime enforcement |
| `pipelineGroundingRetrieval` | CANONICAL | Grounding runtime |
| Other pipeline helpers | CANONICAL | Trace insights, evidence, defaults |

**Outside `ai/pipeline/` but pipeline-adjacent:**

| Service | Location | Classification |
|---------|----------|----------------|
| `SuggestionDryRunService` | `ai/suggestions/` | CANONICAL — pipeline routes call it |
| `moduleContextProviderHealthCheck` | `ai/services/` | CANONICAL — pipeline route |
| `DigitalLifeTwinService` | `ai/core/` | CANONICAL runtime — test-lab invokes |

**`adminService.ts`:** No pipeline logic (verified grep).

---

## 7. adminApiService methods (30)

All use `/ai-pipeline/*` via `makeRequest` except `exportAiPipelineDiagnostics` (direct fetch for CSV).

| Group | Methods |
|-------|---------|
| Catalog/registry | `getAiPipelineCatalog`, `getAiPipelineRegistryGraph`, `validateAiPipelineRegistry` |
| Intent CRUD | `createAiPipelineIntent`, `duplicateAiPipelineIntent`, `archiveAiPipelineIntent`, `restoreAiPipelineIntent`, `setAiPipelineIntentEnabled`, `updateAiPipelineIntentPolicy` |
| Grounding CRUD | `createAiPipelineGroundingRule`, `updateAiPipelineGroundingPolicy` (+ archive/restore via registry methods) |
| Source CRUD | `createAiPipelineContextSource`, `duplicateAiPipelineContextSource`, `archiveAiPipelineContextSource`, `restoreAiPipelineContextSource`, `updateAiPipelineContextSourcePolicy` |
| Tool CRUD | `createAiPipelineToolPolicy`, `duplicateAiPipelineToolPolicy`, `archiveAiPipelineToolPolicy`, `restoreAiPipelineToolPolicy`, `updateAiPipelineToolPolicy` |
| Settings | `updateAiPipelineSettings` |
| Observability | `getAiPipelineDiagnostics`, `getAiPipelineDiagnostic`, `getAiPipelineEvidence`, `exportAiPipelineDiagnostics`, `getAiPipelineQualityStats`, `getAiPipelinePolicyAudit` |
| Evaluation | `runAiPipelineTestLab`, `runSuggestionCorrelationDryRun`, `getSuggestionFunnelMetrics` |
| Module context | `runModuleContextProviderHealthCheck` |
| Compliance | `getAiPipelineRetention`, `updateAiPipelineRetention`, `purgeAiPipelineDiagnostics` |

---

## 8. Classification summary

| Class | Count (API) | Notes |
|-------|-------------|-------|
| CANONICAL | 45 | All `/ai-pipeline/*` handlers |
| SATELLITE | 8 | `/api/admin/ai-providers` — linked from hub |
| LEGACY | 6 | `ai-context-debug` — 0D-E merge target |
| DEPRECATED | 97 | `centralized-ai` — fenced 410 |

---

**Verification:** `adminPortalAiPipelineConsolidation.test.ts` asserts 45 handler paths; inventory doc is authoritative for 0D-E test targeting.
