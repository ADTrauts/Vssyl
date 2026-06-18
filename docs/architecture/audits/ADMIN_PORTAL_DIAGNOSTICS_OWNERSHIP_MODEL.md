# Admin Portal — Diagnostics Ownership Model

**Package:** 0D-E — Diagnostics & Evaluation Consolidation  
**Date:** 2026-06-17

---

## 1. Owner assignments

| Domain | Owner | Canonical entry |
|--------|-------|-----------------|
| **Diagnostics** | AI Pipeline | `/admin-portal/ai-pipeline/diagnostics` |
| **Evaluation** | AI Pipeline | `/admin-portal/ai-pipeline/test-lab` |
| **Monitoring** | AI Pipeline | Hub metrics + `/ai-pipeline/quality` |
| **Context debugging (forensics)** | AI Pipeline | Trace detail + evidence bundles |
| **Context debugging (legacy UI)** | Transitional | `/admin-portal/ai-context` → retires 0D-F |

---

## 2. Pipeline-owned (canonical)

| Capability | Route owner | UI owner | Service owner |
|------------|-------------|----------|---------------|
| Trace list / filter by user | `GET /ai-pipeline/diagnostics` | `diagnostics/page.tsx` | `pipelineDiagnosticPersistence` |
| Trace detail | `GET /ai-pipeline/diagnostics/:traceId` | `PipelineTraceDetail` | `pipelineTraceStore` |
| Evidence bundle | `GET .../evidence` | `PipelineEvidenceViewer` | `buildPipelineEvidenceBundle` |
| Export / purge | `POST .../export`, retention | `PipelineCompliancePanel` | `pipelineRetentionService` |
| Quality stats | `GET /quality/stats` | `quality/page.tsx` | `getPipelineQualityStats` |
| Test lab dry-run | `POST /test-lab` | `AITestLabPanel` | `DigitalLifeTwinService` |
| Suggestion eval | `POST /suggestions/dry-run` | `SuggestionCorrelationDryRunPanel` | `SuggestionDryRunService` |
| Module provider probe | `POST /context-providers/health` | `ContextProviderHealthPanel` | `moduleContextProviderHealthCheck` |
| Hub live activity | `GET /diagnostics` (poll) | `PipelineLiveActivityFeed` | `usePipelineHubData` |

---

## 3. Temporary bridge surfaces

| Surface | Role | Retirement |
|---------|------|------------|
| `/api/ai-context-debug/*` | Legacy API with Deprecation headers | Mount shrink 0D-F / 0D-G |
| `/admin-portal/ai-context` | Legacy 5-tab UI | Redirect 0D-F |
| `web/src/api/aiContextDebug.ts` | Legacy client | Remove after UI redirect |
| ai-system → ai-context card | Transitional launcher | Remove 0D-F |

---

## 4. Retirement candidates

| Item | Phase | Replacement |
|------|-------|-------------|
| `UserContextInspector` et al. | 0D-F | Pipeline diagnostics + trace detail |
| `GET /ai-context-debug/user/:userId` | 0D-F+ | `GET /ai-pipeline/diagnostics?userId=` |
| `GET /ai-context-debug/stats` | 0D-F+ | `GET /ai-pipeline/quality/stats` |
| `POST /ai-context-debug/assemble` | 0D-F+ | Test lab + evidence API |
| Pipeline hub → ai-context footer link | **Done 0D-E** | Response Diagnostics link |

---

## 5. Explicit boundaries

### Belongs in Pipeline (diagnostics / evaluation)

- Pipeline traces, intents, grounding evidence
- Test lab dry-runs and suggestion correlation
- Quality/enforcement monitoring
- Module context provider health probes (admin)

### Belongs in Diagnostics (sub-domain of Pipeline)

- Forensics UI (`PipelineTraceTable`, evidence viewers)
- Export and retention of diagnostic records

### Belongs in Provider Governance (not 0D-E)

- LLM usage/expense — `/api/admin/ai-providers`, hub `#provider-governance`

### Belongs in Business AI (not 0D-E)

- Business digital twins — `/admin-portal/business-ai`

---

## 6. Enforcement (0D-E)

1. `aiContextDebugTransitionalMiddleware` on all context-debug responses
2. Pipeline hub footer links to **Response Diagnostics** only
3. ai-context page transitional banner → pipeline diagnostics
4. HTTP tests prove pipeline authZ and context-debug deprecation headers

---

**Next:** 0D-F — ai-context redirect, ai-system launcher cleanup, optional 410 for mapped endpoints.
