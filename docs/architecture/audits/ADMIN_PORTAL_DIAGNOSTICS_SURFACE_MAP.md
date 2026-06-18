# Admin Portal — Diagnostics Surface Map

**Package:** 0D-E — Diagnostics & Evaluation Consolidation  
**Initiative:** AP-AI-03  
**Findings:** AP-F-029, AP-F-030  
**Date:** 2026-06-17

---

## 1. Executive summary

| Surface | Handlers / items | Classification |
|---------|------------------|----------------|
| AI Pipeline diagnostics API | 8 routes (diagnostics, evidence, export, quality, suggestions) | **CANONICAL** |
| AI Pipeline diagnostics UI | 2 pages (diagnostics, test-lab) + hub widgets | **CANONICAL** |
| ai-context-debug API | 6 routes | **TRANSITIONAL** (Deprecation headers 0D-E) |
| ai-context admin UI | 1 page, 5 tabs, 5 components | **TRANSITIONAL** |
| Evaluation (test-lab) | 3 API routes + 3 panels | **CANONICAL** |

---

## 2. API routes

### Canonical — `/api/admin-portal/ai-pipeline/*`

| Method | Path | Purpose | Classification |
|--------|------|---------|----------------|
| GET | `/diagnostics` | Trace list (+ optional `userId`) | CANONICAL |
| GET | `/diagnostics/:traceId` | Trace detail | CANONICAL |
| GET | `/diagnostics/:traceId/evidence` | Evidence bundle | CANONICAL |
| POST | `/diagnostics/export` | CSV/JSON export | CANONICAL |
| GET | `/quality/stats` | Quality / at-risk metrics | CANONICAL |
| POST | `/test-lab` | Twin dry-run | CANONICAL |
| POST | `/context-providers/health` | Module provider probe | CANONICAL |
| GET | `/suggestions/metrics` | Suggestion funnel | CANONICAL |
| POST | `/suggestions/dry-run` | Suggestion correlation dry-run | CANONICAL |

### Transitional — `/api/ai-context-debug/*`

| Method | Path | Purpose | Classification |
|--------|------|---------|----------------|
| GET | `/user/:userId` | User context inspector | TRANSITIONAL → MERGE diagnostics |
| GET | `/session/:sessionId` | Session reasoning | TRANSITIONAL → MERGE diagnostics |
| POST | `/validate` | Context validation | TRANSITIONAL → KEEP (gap) |
| GET | `/cross-module/:userId` | Cross-module map | TRANSITIONAL → MERGE provider health |
| GET | `/stats` | Platform AI stats | TRANSITIONAL → MERGE quality/stats |
| POST | `/assemble` | Context density dry-run | TRANSITIONAL → MERGE evidence |

**0D-E:** All six emit `Deprecation` + `Link` successor headers via `aiContextDebugTransitionalMiddleware`.

---

## 3. Pages

| Page | Path | Classification | API client |
|------|------|----------------|------------|
| Response Diagnostics | `/admin-portal/ai-pipeline/diagnostics` | **CANONICAL** | `adminApiService.getAiPipelineDiagnostics` |
| AI Test Lab | `/admin-portal/ai-pipeline/test-lab` | **CANONICAL** | `runAiPipelineTestLab`, suggestion helpers |
| Pipeline hub | `/admin-portal/ai-pipeline` | **CANONICAL** | `usePipelineHubData`, live feed → diagnostics |
| AI Context Debug | `/admin-portal/ai-context` | **TRANSITIONAL** | `web/src/api/aiContextDebug.ts` |
| Quality | `/admin-portal/ai-pipeline/quality` | **CANONICAL** | `getAiPipelineQualityStats` |

---

## 4. Components

### Canonical (pipeline)

| Component | Role |
|-----------|------|
| `PipelineTraceTable` / `PipelineTraceDetail` | Diagnostics forensics |
| `PipelineEvidenceViewer` / `ContextDensityPanel` | Evidence / density |
| `PipelineLiveActivityFeed` | Hub → diagnostics deep links |
| `AITestLabPanel` | Evaluation dry-run |
| `SuggestionCorrelationDryRunPanel` | Suggestion evaluation |
| `ContextProviderHealthPanel` | Module provider probe |
| `PipelineQualityDashboard` | Monitoring |

### Transitional (ai-context)

| Component | API helper | Classification |
|-----------|------------|----------------|
| `UserContextInspector` | `getAIContext` | DUPLICATE |
| `AIReasoningViewer` | `getAISession` | DUPLICATE |
| `ContextValidationTools` | `validateAIContext` | DUPLICATE |
| `CrossModuleContextMap` | `getCrossModuleContext` | DUPLICATE |
| `RealTimeContextMonitor` | `getAIContextStats` | DUPLICATE |

---

## 5. Hooks & services

| Item | Location | Classification |
|------|----------|----------------|
| `usePipelineHubData` | `ai-pipeline/usePipelineHubData.ts` | CANONICAL |
| `pipelineDiagnosticPersistence` | `server/src/ai/pipeline/` | CANONICAL |
| `pipelineTraceStore` | `server/src/ai/pipeline/` | CANONICAL |
| `SuggestionDryRunService` | `server/src/ai/suggestions/` | CANONICAL |
| `ai-context-debug.ts` handlers | `server/src/routes/` | TRANSITIONAL |

---

## 6. adminApiService diagnostics helpers

| Method | Route | Classification |
|--------|-------|----------------|
| `getAiPipelineDiagnostics` | `/diagnostics` | CANONICAL |
| `getAiPipelineDiagnostic` | `/diagnostics/:id` | CANONICAL |
| `getAiPipelineEvidence` | `/diagnostics/:id/evidence` | CANONICAL |
| `exportAiPipelineDiagnostics` | `/diagnostics/export` | CANONICAL |
| `getAiPipelineQualityStats` | `/quality/stats` | CANONICAL |
| `runAiPipelineTestLab` | `/test-lab` | CANONICAL |
| `runSuggestionCorrelationDryRun` | `/suggestions/dry-run` | CANONICAL |
| `getSuggestionFunnelMetrics` | `/suggestions/metrics` | CANONICAL |
| `runModuleContextProviderHealthCheck` | `/context-providers/health` | CANONICAL |

**Legacy client:** `web/src/api/aiContextDebug.ts` — 5 fetch functions (TRANSITIONAL).

---

## 7. Classification summary

| Class | API routes | UI surfaces |
|-------|------------|-------------|
| CANONICAL | 9 pipeline diagnostics/eval | diagnostics + test-lab + hub |
| TRANSITIONAL | 6 ai-context-debug | ai-context page |
| DUPLICATE | — | 5 ai-context components (retire 0D-F) |
| LEGACY | 0 live (centralized-ai fenced) | ai-learning redirect |

---

**Verification:** `ADMIN_PORTAL_DIAGNOSTICS_OWNERSHIP_MODEL.md`, `admin-portal-ai-pipeline.test.ts`, `aiContextDebugTransitional.test.ts`.
