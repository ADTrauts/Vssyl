# Admin Portal — AI Admin Test Matrix

**Package:** 0D-E — Diagnostics & Evaluation Consolidation  
**Findings:** AP-F-030 (primary), AP-F-029  
**Date:** 2026-06-17

---

## Status legend

| Status | Meaning |
|--------|---------|
| **PASS** | Automated test exists and covers authZ + happy path |
| **PARTIAL** | Hygiene/doc test or authZ only |
| **MISSING** | No automated coverage |

---

## `/api/admin-portal/ai-pipeline/*` (45 handlers)

| Route cluster | Handlers | Integration | Hygiene | Status |
|---------------|----------|-------------|---------|--------|
| Catalog / registry | 3 | catalog + graph GET | consolidation test | **PARTIAL** |
| Policy CRUD | 28 | — | — | **MISSING** |
| Diagnostics | 4 | diagnostics GET | diagnostics ownership | **PARTIAL** |
| Quality | 1 | quality/stats GET | — | **PARTIAL** |
| Test lab | 1 | — | — | **MISSING** |
| Suggestions | 2 | metrics GET | — | **PARTIAL** |
| Context providers | 1 | — | — | **MISSING** |
| Retention / compliance | 4 | retention GET | — | **PARTIAL** |
| Audit | 1 | — | — | **MISSING** |
| AuthZ (all) | — | 403 non-admin, 401 unauth | pipeline test | **PASS** |

**File:** `server/src/routes/__tests__/admin-portal-ai-pipeline.test.ts` — **8 cases** (6 admin GET + 2 authZ).

---

## `/api/ai-context-debug/*` (6 handlers)

| Endpoint | Deprecation test | Handler parity | Status |
|----------|------------------|----------------|--------|
| `GET /user/:userId` | PASS | — | **PARTIAL** |
| `GET /session/:sessionId` | PASS | — | **PARTIAL** |
| `POST /validate` | PASS | — | **PARTIAL** |
| `GET /cross-module/:userId` | PASS | — | **PARTIAL** |
| `GET /stats` | PASS | — | **PARTIAL** |
| `POST /assemble` | PASS | — | **PARTIAL** |
| 6/6 disposition coverage | PASS | — | **PASS** |

**File:** `server/src/routes/__tests__/aiContextDebugTransitional.test.ts` — **9 cases**.

---

## `/api/admin/ai-providers/*` (8 handlers)

| Status | Notes |
|--------|-------|
| **MISSING** | Out of 0D-E scope (0D-C complete); no HTTP suite |

---

## `/api/admin/business-ai/*`

| Status | Notes |
|--------|-------|
| **MISSING** | Out of 0D-E scope |

---

## Web / hygiene tests

| File | Scope | Status |
|------|-------|--------|
| `adminPortalDiagnosticsOwnership.test.ts` | UI ownership, docs | **PASS** (6) |
| `adminPortalAiPipelineConsolidation.test.ts` | Nav, 45-route count | **PASS** (5) |
| `adminPortalProviderGovernance.test.ts` | Provider satellite | **PASS** (5) |
| `adminPortalCentralizedAiRetirement.test.ts` | Centralized-ai fence | **PASS** (5) |
| `aiCentralizedAdminFence.test.ts` | 410 fences | **PASS** (31) |

---

## Service coverage

| Service | Unit/integration | Status |
|---------|------------------|--------|
| `pipelineCatalogService` | — | **MISSING** |
| `pipelineDiagnosticPersistence` | Indirect via diagnostics GET | **PARTIAL** |
| `SuggestionDryRunService` | — | **MISSING** |
| `moduleContextProviderHealthCheck` | — | **MISSING** |
| `ai-context-debug` handlers | Deprecation middleware | **PARTIAL** |

---

## AP-F-030 closure assessment

| Criterion | 0D-D | 0D-E |
|-----------|------|------|
| ≥1 pipeline HTTP test file | No | **Yes** — 8 cases |
| ≥5 cases | No | **Yes** |
| Catalog smoke | — | PASS |
| Diagnostics smoke | — | PASS |
| AuthZ proof | Partial | PASS |

**Verdict:** AP-F-030 **materially addressed** — full policy/diagnostics domain coverage remains **1B**.

---

## AP-F-029 closure assessment

| Criterion | 0D-E |
|-----------|------|
| Disposition doc for all 6 endpoints | PASS |
| Deprecation headers on all routes | PASS |
| Pipeline canonical UI link | PASS |
| ai-context UI retired | **Done (0D-F)** |

**Verdict:** AP-F-029 **substantially closed** — UI redirect and component removal complete (0D-F); API mount shrink **0D-G / 1B**.

---

## Recommended next tests (not 0D-E)

| Priority | Test |
|----------|------|
| P1 | `POST /ai-pipeline/test-lab` smoke with mocked twin |
| P2 | Policy intent create + audit log entry |
| P3 | `POST /context-providers/health` with fixture modules |
