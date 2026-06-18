# Admin Portal AI Administration File Target Matrix

**Program:** Admin Portal Modernization — Stage 0D Planning  
**Date:** 2026-06-17  
**Rows:** 62  
**Constraint:** Planning inventory only — no implementation

**Columns:** File | Domain | Action | Complexity | Finding | Future Package

---

## 1. Legacy retirement (AP-AI-04 / AP-F-008)

| File | Domain | Action | Complexity | Finding | Package |
|------|--------|--------|------------|---------|---------|
| `server/src/routes/ai-centralized.ts` | Legacy API | Shrink / delete (>80% handlers) | **XL** | AP-F-008 | 0D-B |
| `server/src/middleware/centralizedAiFence.ts` | Legacy fence | Expand deprecated route table | M | AP-F-008 | 0D-B |
| `server/src/index.ts` | Mount | Shrink or remove `/api/centralized-ai` mount | M | AP-F-008 | 0D-B |
| `server/src/routes/__tests__/aiCentralizedAdminFence.test.ts` | Tests | Expand 410 coverage tests | S | AP-F-008 | 0D-B |
| `server/src/ai/learning/CentralizedLearningEngine.ts` | Learning | Evaluate retain vs retire with user path | M | AP-F-008 | 0D-B |
| `web/src/app/admin-portal/ai-learning/page.tsx` | Legacy UI | Redirect or real-or-empty rewrite | L | AP-F-008 | 0D-F |
| `web/src/lib/adminApiService.ts` | Client | Remove centralized-ai fetch helpers | M | AP-F-008 | 0D-B |
| `web/src/app/admin-portal/ai-system/page.tsx` | Hub UI | Remove ai-learning chart deps on centralized-ai | M | AP-F-008 | 0D-F |

---

## 2. Diagnostics consolidation (AP-AI-03 / AP-F-029)

| File | Domain | Action | Complexity | Finding | Package |
|------|--------|--------|------------|---------|---------|
| `server/src/routes/ai-context-debug.ts` | Debug API | Map, gate, or retire endpoints | L | AP-F-029 | 0D-E |
| `web/src/app/admin-portal/ai-context/page.tsx` | Debug UI | Redirect to pipeline/diagnostics | S | AP-F-029 | 0D-F |
| `web/src/components/admin-portal/UserContextInspector.tsx` | Debug UI | Merge into pipeline or retire | M | AP-F-029 | 0D-E |
| `web/src/components/admin-portal/AIReasoningViewer.tsx` | Debug UI | Merge into `PipelineTraceDetail` or retire | M | AP-F-029 | 0D-E |
| `web/src/components/admin-portal/ContextValidationTools.tsx` | Debug UI | Merge or retire | M | AP-F-029 | 0D-E |
| `web/src/components/admin-portal/CrossModuleContextMap.tsx` | Debug UI | Link to `ContextProviderHealthPanel` | M | AP-F-029 | 0D-E |
| `web/src/components/admin-portal/RealTimeContextMonitor.tsx` | Debug UI | Retire or ops-gate | M | AP-F-029 | 0D-E |
| `web/src/middleware.ts` | Redirect | Add `/admin-portal/ai-context` redirect | S | AP-F-029 | 0D-F |

---

## 3. Pipeline administration (AP-AI-02 / AP-F-030)

| File | Domain | Action | Complexity | Finding | Package |
|------|--------|--------|------------|---------|---------|
| `server/src/routes/admin-portal/adminPortalRoutes.aiPipeline.ts` | Canonical API | Preserve; document route map (0D-D) | L | AP-F-030 | **0D-D complete** |
| `server/src/routes/admin-portal.ts` | Router | Verify pipeline registration unchanged | S | AP-F-030 | 0D-D |
| `server/src/routes/__tests__/admin-portal-ai-pipeline.test.ts` | Tests | **Create** HTTP smoke suite | M | AP-F-030 | 0D-E |
| `server/src/ai/pipeline/pipelineCatalogService.ts` | Pipeline svc | Preserve | — | — | — |
| `server/src/ai/pipeline/pipelineRegistryService.ts` | Pipeline svc | Preserve | — | — | — |
| `server/src/ai/pipeline/pipelineDiagnosticPersistence.ts` | Diagnostics | Preserve | — | AP-F-029 | 0D-E |
| `server/src/ai/pipeline/pipelineRetentionService.ts` | Compliance | Preserve | — | — | — |
| `web/src/app/admin-portal/ai-pipeline/page.tsx` | Canonical UI | Enhance hub (providers link) | M | AP-AI-05 | 0D-F |
| `web/src/app/admin-portal/ai-pipeline/diagnostics/page.tsx` | Diagnostics UI | Absorb debug tab entry points | M | AP-F-029 | 0D-E |
| `web/src/app/admin-portal/ai-pipeline/test-lab/page.tsx` | Evaluation UI | Preserve; optional debug gate | S | AP-F-030 | 0D-E |
| `web/src/components/admin-portal/ai-pipeline/PipelineOperationsHub.tsx` | Hub component | Add satellite links | M | AP-AI-05 | 0D-F |
| `web/src/components/admin-portal/ai-pipeline/PipelineSubpageShell.tsx` | Shell | Preserve | — | — | — |
| `web/src/types/adminAiPipeline.ts` | Types | Preserve / extend for merged debug | S | AP-F-029 | 0D-E |

---

## 4. Provider governance (AP-AI-01)

| File | Domain | Action | Complexity | Finding | Package |
|------|--------|--------|------------|---------|---------|
| `server/src/routes/ai-provider-usage.ts` | Satellite API | Preserve; document only | S | — | 0D-C |
| `server/src/services/aiProviderServices/openAIAdminService.ts` | Provider svc | Preserve | — | — | — |
| `server/src/services/aiProviderServices/anthropicAdminService.ts` | Provider svc | Preserve | — | — | — |
| `server/src/services/aiProviderServices/combinedProviderService.ts` | Provider svc | Preserve | — | — | — |
| `server/src/services/aiProviderServices/historicalDataService.ts` | Provider svc | Preserve | — | — | — |
| `web/src/components/admin-portal/ProviderUsageView.tsx` | Provider UI | Embed in pipeline hub | M | AP-AI-01 | **0D-C complete** |
| `web/src/components/admin-portal/ProviderExpensesView.tsx` | Provider UI | Embed or link from hub | M | AP-AI-01 | **0D-C complete** (billing satellite + pipeline link) |
| `web/src/lib/adminApiService.ts` | Client | Preserve provider methods; remove centralized | M | AP-AI-01 | **0D-C complete** |
| `web/src/components/admin-portal/ai-pipeline/ProviderGovernancePanel.tsx` | Provider UI | **Created** — canonical panel | M | AP-AI-01 | **0D-C complete** |

---

## 5. Business AI satellite

| File | Domain | Action | Complexity | Finding | Package |
|------|--------|--------|------------|---------|---------|
| `server/src/routes/adminBusinessAI.ts` | Satellite API | Remove centralized-learning toggles | M | AP-F-008 | 0D-B |
| `web/src/app/admin-portal/business-ai/page.tsx` | Satellite UI | Preserve | S | — | 0D-F |
| `web/src/components/admin-portal/BusinessAIGlobalDashboard.tsx` | Satellite UI | Remove legacy learning toggle UI | M | AP-F-008 | 0D-F |

---

## 6. Module AI registry (boundary only)

| File | Domain | Action | Complexity | Finding | Package |
|------|--------|--------|------------|---------|---------|
| `server/src/routes/moduleAIContext.ts` | Governance API | Document link; no merge | S | — | — |
| `web/src/app/admin-portal/modules/page.tsx` | Governance UI | Add cross-link to AI pipeline | S | AP-AI-05 | 0D-F |

---

## 7. UX / navigation (AP-AI-05)

| File | Domain | Action | Complexity | Finding | Package |
|------|--------|--------|------------|---------|---------|
| `web/src/app/admin-portal/layout.tsx` | Nav | Adjust AI section labels/links | M | AP-AI-05 | 0D-F |
| `web/src/app/admin-portal/ai-system/page.tsx` | Transitional hub | Nav-only launcher refactor | L | AP-AI-05 | 0D-F |
| `web/src/lib/__tests__/adminPortalAiPipelineConsolidation.test.ts` | Tests | **Created** pipeline nav/inventory hygiene | S | AP-AI-02 | **0D-D complete** |
| `web/src/lib/__tests__/adminPortalAiAdminHygiene.test.ts` | Tests | **Create** redirect/no-centralized-ai grep tests | S | AP-F-008 | 0D-G |

---

## 8. Documentation & audit artifacts

| File | Domain | Action | Complexity | Finding | Package |
|------|--------|--------|------------|---------|---------|
| `docs/architecture/audits/ADMIN_PORTAL_OPERATION_MATRIX.md` | Docs | Update AI rows post-0D | S | AP-F-030 | 0D-G |
| `docs/architecture/audits/ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md` | Docs | Update centralized-ai disposition | S | AP-F-008 | 0D-G |
| `docs/architecture/audits/ADMIN_PORTAL_AUTH_MATRIX.md` | Docs | Note retired mounts | S | AP-F-008 | 0D-G |
| `docs/guides/ADMIN_PORTAL.md` | Docs | AI control plane section | S | AP-F-028 | 0D-G |
| `memory-bank/adminProductContext.md` | Memory Bank | AI admin status post-0D | S | — | 0D-G |
| `docs/architecture/AI_PIPELINE_ADMIN_TOOLS.md` | Architecture | Cross-link control plane arch | S | — | 0D-A |

---

## 9. Pipeline UI sub-pages (preserve)

| File | Domain | Action | Complexity | Finding | Package |
|------|--------|--------|------------|---------|---------|
| `web/src/app/admin-portal/ai-pipeline/intents/page.tsx` | Pipeline UI | Preserve | — | — | — |
| `web/src/app/admin-portal/ai-pipeline/grounding/page.tsx` | Pipeline UI | Preserve | — | — | — |
| `web/src/app/admin-portal/ai-pipeline/sources/page.tsx` | Pipeline UI | Preserve | — | — | — |
| `web/src/app/admin-portal/ai-pipeline/tools/page.tsx` | Pipeline UI | Preserve | — | — | — |
| `web/src/app/admin-portal/ai-pipeline/audit/page.tsx` | Pipeline UI | Preserve | — | — | — |
| `web/src/app/admin-portal/ai-pipeline/quality/page.tsx` | Pipeline UI | Preserve | — | — | — |
| `web/src/app/admin-portal/ai-pipeline/compliance/page.tsx` | Pipeline UI | Preserve | — | — | — |
| `web/src/components/admin-portal/ai-pipeline/PipelineTraceTable.tsx` | Diagnostics | Preserve | — | AP-F-029 | — |
| `web/src/components/admin-portal/ai-pipeline/PipelineTraceDetail.tsx` | Diagnostics | Extend for merged debug | M | AP-F-029 | 0D-E |
| `web/src/components/admin-portal/ai-pipeline/AITestLabPanel.tsx` | Evaluation | Preserve | — | AP-F-030 | — |
| `web/src/components/admin-portal/ai-pipeline/PipelineCompliancePanel.tsx` | Governance | Preserve | — | — | — |

---

## 10. Complexity legend

| Level | Meaning |
|-------|---------|
| **S** | <1 day; config, redirect, test |
| **M** | 1–3 days; focused file changes |
| **L** | 3–5 days; multi-file UX or API |
| **XL** | 1+ sprint; ai-centralized.ts retirement |

---

## 11. Matrix summary

| Action type | Row count |
|-------------|----------:|
| Preserve | 18 |
| Shrink / retire / delete | 6 |
| Redirect / merge UI | 10 |
| Create tests | 2 |
| Enhance / refactor | 14 |
| Document | 6 |
| Evaluate | 6 |
| **Total rows** | **62** |

---

**Matrix close.** Planning only. Next: [Implementation Sequence](./ADMIN_PORTAL_AI_ADMIN_IMPLEMENTATION_SEQUENCE.md).
