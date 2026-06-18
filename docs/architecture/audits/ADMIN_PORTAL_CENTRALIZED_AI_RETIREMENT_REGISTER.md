# Admin Portal — Centralized AI Retirement Register

**Package:** 0D-B — Legacy AI Retirement Preparation  
**Finding:** AP-F-008  
**Date:** 2026-06-17  
**Total entries:** **97** handlers + **2** UI surfaces

**Legend — Status:** `FENCED` (410 via middleware) | `REDIRECTED` (UI) | `PENDING_DELETE` (0D-G)

---

## UI surfaces

| Route/Page | Status | Consumer | Retirement Phase | Replacement | Risk |
|------------|--------|----------|------------------|-------------|------|
| `/admin-portal/ai-learning` | REDIRECTED | Former sole HTTP consumer | 0D-B | `/admin-portal/ai-pipeline` | Low — middleware + page redirect |
| `adminApiService` centralized helpers (×4) | FENCED (client removed) | ai-learning only | 0D-B | AI Pipeline client methods | Low — grep-verified zero refs |

---

## API routes — learning cluster (0d-b-learning)

| Route | Method | Status | Consumer | Retirement Phase | Replacement | Risk |
|-------|--------|--------|----------|------------------|-------------|------|
| `/health` | GET | FENCED | None (was ai-learning) | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/patterns` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/patterns/analyze` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/insights` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/privacy/settings` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline/compliance` | Low |
| `/privacy/settings` | PUT | FENCED | None | 0D-B | `/admin-portal/ai-pipeline/compliance` | Low |
| `/consent/stats` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline/compliance` | Low |
| `/scheduler/status` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/scheduler/trigger-analysis` | POST | FENCED | None | 0D-B | Platform jobs | Low |
| `/scheduler/trigger-insights` | POST | FENCED | None | 0D-B | Platform jobs | Low |
| `/analytics/summary` | GET | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/forecasts` | GET | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/impact/:insightId` | GET | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/predictions/:userId` | GET | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/streams` | GET | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/streams` | POST | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/streams/:streamId/data` | POST | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/streams/:streamId/data` | GET | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/metrics` | GET | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/metrics` | POST | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/dashboards` | GET | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/dashboards` | POST | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/dashboards/:dashboardId` | GET | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/alerts` | GET | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/alerts/:alertId/acknowledge` | POST | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/analytics/alerts/:alertId/resolve` | POST | FENCED | None | 0D-B | `/admin-portal/analytics` | Low |
| `/audit/logs` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline/audit` | Low |

---

## API routes — wave-1d (pre-0D-B)

| Route | Method | Status | Consumer | Retirement Phase | Replacement | Risk |
|-------|--------|--------|----------|------------------|-------------|------|
| `/learning/event` | POST | FENCED | None | wave-1d | `POST /api/ai/learning/*` | Low |
| `/models` | GET | FENCED | None | wave-1d | `GET /api/ai/models` | Low |
| `/models/:modelId` | GET | FENCED | None | wave-1d | `GET /api/ai/models` | Low |
| `/models` | POST | FENCED | None | wave-1d | `GET /api/ai/models` | Low |
| `/models/:modelId/performance` | GET | FENCED | None | wave-1d | `GET /api/ai/models` | Low |
| `/models/:modelId/explanations` | POST | FENCED | None | wave-1d | `GET /api/ai/models` | Low |

---

## API routes — mock scaffold (0d-b-scaffold)

| Route | Method | Status | Consumer | Retirement Phase | Replacement | Risk |
|-------|--------|--------|----------|------------------|-------------|------|
| `/performance/metrics` | GET | FENCED | None | 0D-B | `/admin-portal/performance` | Low |
| `/performance/health` | GET | FENCED | None | 0D-B | `/admin-portal/performance` | Low |
| `/security/audit` | GET | FENCED | None | 0D-B | `/admin-portal/security` | Low |
| `/security/compliance/gdpr` | POST | FENCED | None | 0D-B | `/admin-portal/security` | Low |
| `/security/privacy/report` | GET | FENCED | None | 0D-B | `/admin-portal/security` | Low |
| `/security/compliance/frameworks` | GET | FENCED | None | 0D-B | `/admin-portal/security` | Low |
| `/security/compliance/status` | GET | FENCED | None | 0D-B | `/admin-portal/security` | Low |
| `/security/incidents` | POST | FENCED | None | 0D-B | `/admin-portal/security` | Low |
| `/security/incidents` | GET | FENCED | None | 0D-B | `/admin-portal/security` | Low |
| `/security/audits` | POST | FENCED | None | 0D-B | `/admin-portal/security` | Low |
| `/security/privacy/reports` | POST | FENCED | None | 0D-B | `/admin-portal/security` | Low |
| `/security/metrics` | GET | FENCED | None | 0D-B | `/admin-portal/security` | Low |
| `/ab-testing/create` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline/test-lab` | Low |
| `/ab-testing/status/:testId` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline/test-lab` | Low |
| `/ab-testing/:testId/start` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline/test-lab` | Low |
| `/ab-testing/:testId/stop` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline/test-lab` | Low |
| `/notifications` | GET | FENCED | None | 0D-B | `/admin-portal/notifications` | Low |
| `/notifications/:notificationId/read` | POST | FENCED | None | 0D-B | `/admin-portal/notifications` | Low |
| `/notifications/send` | POST | FENCED | None | 0D-B | `/admin-portal/notifications` | Low |
| `/notifications/stats` | GET | FENCED | None | 0D-B | `/admin-portal/notifications` | Low |
| `/sso/providers` | GET | FENCED | None | 0D-B | `/admin-portal/system` | Low |
| `/sso/providers` | POST | FENCED | None | 0D-B | `/admin-portal/system` | Low |
| `/sso/oauth2/:providerId/initiate` | POST | FENCED | None | 0D-B | `/admin-portal/system` | Low |
| `/sso/oauth2/:providerId/callback` | POST | FENCED | None | 0D-B | `/admin-portal/system` | Low |
| `/automl/jobs` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/automl/jobs` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/automl/jobs/:jobId/start` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/automl/jobs/:jobId/progress` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/automl/recommendations` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/workflows` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/workflows` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/workflows/:workflowId/execute` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/workflows/executions` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/workflows/executions/:executionId` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/decision-support` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/decision-support` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive-maintenance` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive-maintenance` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/continuous-learning` | GET | FENCED | None | 0D-B | `/api/ai/learning/*` | Low |
| `/continuous-learning` | POST | FENCED | None | 0D-B | `/api/ai/learning/*` | Low |
| `/predictive/forecasting-models` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive/forecasting-models` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive/forecasting-models/:modelId/forecast` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive/forecasting-models/:modelId/forecasts` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive/anomaly-models` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive/anomaly-models` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive/anomaly-models/:modelId/detect` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive/anomaly-models/:modelId/anomalies` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive/pipelines` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive/pipelines` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive/pipelines/:pipelineId/execute` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/predictive/insights` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/business/metrics` | GET | FENCED | None | 0D-B | `/admin-portal/business-ai` | Low |
| `/business/metrics` | POST | FENCED | None | 0D-B | `/admin-portal/business-ai` | Low |
| `/business/dashboards` | GET | FENCED | None | 0D-B | `/admin-portal/business-ai` | Low |
| `/business/insights` | GET | FENCED | None | 0D-B | `/admin-portal/business-ai` | Low |
| `/business/reports/:templateId/generate` | POST | FENCED | None | 0D-B | `/admin-portal/business-ai` | Low |
| `/ai-insights/patterns` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/ai-insights/patterns/discover` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/ai-insights/insights` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/ai-insights/recommendations` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/ai-insights/recommendations` | POST | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/ai-insights/recommendations/:recommendationId/status` | PUT | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |
| `/ai-insights/continuous-learning` | GET | FENCED | None | 0D-B | `/admin-portal/ai-pipeline` | Low |

---

## Mount & file retirement (deferred)

| Item | Status | Retirement Phase | Risk |
|------|--------|------------------|------|
| `server/src/routes/ai-centralized.ts` (3,491 LOC) | **DELETED** | 0D-G | — |
| `/api/centralized-ai` mount in `index.ts` | **410 STUB** | 0D-G | Low — optional full mount removal in 1B |

---

## Summary counts

| Category | Count |
|----------|-------|
| API routes FENCED | **97** |
| UI surfaces REDIRECTED | **1** |
| Client helpers removed | **4** |
| Active consumers remaining | **0** |
| PENDING_DELETE (0D-G) | **0** — router deleted; stub mount retained |

---

**Verification:** `aiCentralizedAdminFence.test.ts` asserts all 97 handler paths match a deprecated route rule.
