# Module AI Context Provider API

**Status:** Canonical contract (Phase 4B + Context Provider Contract Phase A/B, May 2026)  
**Audience:** First-party module authors, marketplace partners, admin reviewers  
**Related:** `memory-bank/aiContextSystem.md`, `memory-bank/moduleSpecs.md`, `server/src/startup/registerBuiltInModules.ts`

---

## Overview

Module **context providers** are authenticated HTTP endpoints the platform calls at query time to fetch live, tenant-scoped data for the Digital Life Twin. Registration happens in the module manifest (`aiContext.contextProviders`); runtime discovery uses the **Module AI Context Registry** (`ModuleAIContextService`).

**Design goal:** A new built-in or marketplace module can ship AI context by following this checklist — **no changes to `DigitalLifeTwinCore`** are required when providers are registered correctly.

---

## Request contract

### Authentication

- **User-facing browser calls:** Next.js proxy → Express with session/JWT (`authenticateJWT`).
- **Internal twin fetch:** `ModuleAIContextService.fetchModuleContext` signs a short-lived JWT (`JWT_SECRET`, 5 min) and calls the provider with `Authorization: Bearer <token>`.
- **401** if `req.user` is missing or invalid.

### Tenant / scope query parameters

The platform passes these query params on internal fetches (`buildModuleContextFetchParams`):

| Parameter | Required | Notes |
|-----------|----------|-------|
| `userId` | Always | Target user for the context fetch |
| `dashboardId` | When available | Personal/business workspace dashboard |
| `businessId` | **Required** for `hr`, `scheduling` | Business-scoped modules reject fetch without it |

Provider implementations **must** scope all Prisma reads by authorized context (`userId`, and `dashboardId` / `businessId` when in business workspace). Never return cross-tenant data.

### HTTP method and timeout

- **GET** only for context providers today.
- Platform timeout: **5000 ms** (`MODULE_CONTEXT_PROVIDER_TIMEOUT_MS`).
- Providers should respond in **&lt; 2 s** under normal load; slow endpoints surface as `timeout` in context density reports.

### Endpoint naming

Register paths relative to the API host:

```
/api/{moduleId}/ai/context/{provider_name}
/api/{moduleId}/ai/query/{provider_name}   # structured counts / lookups
```

Examples (built-in reference):

- `/api/drive/ai/context/recent`
- `/api/chat/ai/context/unread`
- `/api/drive/ai/query/count`

Provider `name` in the registry: **snake_case**, 2–49 chars, unique per module.

---

## Response contract

### Success shape (required)

```json
{
  "success": true,
  "context": { },
  "metadata": {
    "provider": "drive",
    "endpoint": "recent_files",
    "timestamp": "2026-05-21T12:00:00.000Z"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `success` | Yes | Must be `true` on 200 responses |
| `context` | Yes | Module-specific payload; keep bounded and structured |
| `metadata.provider` | Recommended | Module id |
| `metadata.endpoint` | Recommended | Provider name |
| `metadata.timestamp` | Recommended | ISO-8601 generation time |

### Error shape

```json
{
  "success": false,
  "message": "Human-readable error",
  "error": "Optional detail for logs"
}
```

Use **401** for auth failures, **403** for permission denied, **404** when scoped resource missing, **500** for unexpected errors.

### Payload size

- **Recommended max:** 32 KB JSON (`MODULE_CONTEXT_PROVIDER_MAX_PAYLOAD_BYTES`).
- Larger responses may still fetch but are flagged **unhealthy** in admin health checks and may be truncated during context assembly.

---

## Registry registration

In manifest / `registerBuiltInModules.ts`:

```typescript
contextProviders: [
  {
    name: 'recent_files',
    description: "User's recently accessed files",
    endpoint: '/api/drive/ai/context/recent',
    cacheDuration: 300000, // ms; default 900000 if omitted
  },
],
```

| Field | Rules |
|-------|-------|
| `name` | snake_case, unique per module |
| `endpoint` | Matches `/api/.../ai/context/...` or `/api/.../ai/query/...` |
| `cacheDuration` | 60_000 – 86_400_000 ms (1 min – 24 h) |

### Optional orchestrator metadata (Phase B — backward compatible)

All fields below are **optional**. Legacy and marketplace modules without them behave as before.

| Field | Type | Purpose |
|-------|------|---------|
| `supportedIntents` | `string[]` | Pipeline intent ids this provider is useful for (e.g. `local_discovery`, `planning`). Default: `workflow_action`, `general_chat`. |
| `supportedEntities` | `string[]` | Entity types for future graph routing (declarative only in Phase B). |
| `priority` | `number` | Selection tie-breaker (higher wins within same cost tier). Default `50`. |
| `retrievalCost` | `low` \| `medium` \| `high` | Budget-aware selection ordering. Default `medium`. |
| `pipelineSourceIds` | `string[]` | Maps catalog grounding source ids → this provider (e.g. `drive_files` → drive `recent_files`). |
| `volatility` | `static` \| `slow` \| `dynamic` \| `realtime` | Declarative hint for future invalidation (no runtime SWR in Phase B). |
| `freshnessPolicy` | `{ maxAgeMs, staleWhileRevalidate?, realtimeSubscription? }` | Preferred freshness window; `maxAgeMs` drives **diagnostics only** in Phase B. |
| `freshnessWindowMs` | `number` | Legacy alias for `freshnessPolicy.maxAgeMs`. |
| `invalidatedByEvents` | `string[]` | Canonical `DOMAIN_EVENT_TYPES` strings — **documented only** until Phase C invalidation. |

**Wave-1 built-ins** with metadata: `drive`, `calendar`, `chat`, `place`, `hr`, `scheduling` in `registerBuiltInModules.ts`.

`parseContextProviders` (certification + registry load) preserves these fields when present in stored JSON.

On install, registry entry is created via `ModuleAIContextService.registerModuleContext`. Per-user cache lives on `ModuleInstallation.contextProviderCache` keyed `providerName:scope`.

---

## Built-in module checklist (no twin code changes)

Use this when adding a first-party module:

1. **Manifest / registration**
   - [ ] `aiContext.purpose`, `category`, `keywords`, `patterns`, `entities`, `actions`
   - [ ] At least one `contextProviders` entry per checklist above
   - [ ] Register in `server/src/startup/registerBuiltInModules.ts`

2. **Controller**
   - [ ] Create `server/src/controllers/{module}AIContextController.ts`
   - [ ] Wire routes under `/api/{module}/ai/context/*` (and `/ai/query/*` if needed)
   - [ ] Enforce `req.user`, tenant scoping, structured logging

3. **Response**
   - [ ] `{ success, context, metadata }` on every happy path
   - [ ] Payload under 32 KB for default providers

4. **Certification**
   - [ ] Pass `moduleCertificationValidator` (AI-exposed modules **fail** without valid providers)
   - [ ] Run admin **Provider health check** (AI Pipeline → Test Lab)

5. **Observability**
   - [ ] Failures appear in pipeline **context density** report (`providerFetchAudit`: timeout, auth, not_found, network)

**Reference implementation:** `driveAIContextController.ts` + drive block in `registerBuiltInModules.ts`.

---

## Marketplace certification

Third-party modules declaring AI exposure must include `manifest.aiContext.contextProviders` with at least one valid endpoint. Structural validation runs in `moduleCertificationValidator` (validator version **1.1.0+**). Admin approval must not pass if certification fails.

See also: `docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`.

---

## Admin tooling

| Tool | Path | Purpose |
|------|------|---------|
| Provider health check | `POST /api/admin/ai-pipeline/context-providers/health` | Dry-run probe all registered providers for a user |
| Test Lab | Admin → AI Pipeline → Test Lab | Prompt dry-run + context density panel |
| Module AI status | `GET /api/admin/modules/ai/status` | Registry coverage summary |

Health check body (optional fields):

```json
{
  "userId": "target-user-uuid",
  "moduleId": "drive",
  "businessId": "business-uuid",
  "dashboardId": "dashboard-uuid"
}
```

---

## Failure surfacing in context density

When the twin fetches providers during a query, each attempt is recorded in `providerFetchAudit` and summarized in the context density report (Phase 3A). Failure reasons:

| Reason | Typical cause |
|--------|----------------|
| `timeout` | Exceeded 5 s |
| `auth` | 401 / missing user |
| `not_found` | 404 endpoint or registry mismatch |
| `network` | Connection errors |
| `unknown` | Invalid response shape, oversized payload |

View in **AI Test Lab** → Context density panel after a dry-run prompt.

---

## Context Provider Orchestrator (Phase A/B)

**Code:** `server/src/ai/context/ContextProviderOrchestrator.ts`  
**Entry:** `CrossModuleContextEngine.getContextForAIQuery` delegates when `AI_CONTEXT_ORCHESTRATOR_ENABLED` is not `false` (default: on).

### `contextGenerationId`

- A new UUID is minted **per orchestration pass** (module context fetch for a query, or a grounding-only pass).
- `DigitalLifeTwinCore` keeps at most **two** recent generations on `query.context.contextGenerations[]` for trace/debug.
- Pipeline grounding may add a **second** generation when `runPipelineGroundingRetrieval` calls `orchestratePipelineModuleSources`.

### Selection and lazy `fullContext`

- Providers are ranked by intent match, `retrievalCost`, `priority`, and legacy `canHandle` compatibility.
- **`fullContext`** (user profile / preferences bundle) is **lazy**: not loaded unless a selected provider or explicit flag requires it.
- **Stale diagnostics (Phase B):** when cache metadata includes `cachedAt` and `maxAgeMs`, orchestration exposes `fresh` \| `stale` \| `unknown` and `staleContextWarnings[]`. No cache invalidation, websocket refresh, or stale-while-revalidate queues in Phase B.

### Required grounding failures (hybrid)

- Missing required module-backed sources are always recorded in `requiredSourceFailures`.
- Twin **blocks** only when pipeline enforcement mode is `block` or `regenerate` (unchanged semantics).

### Pipeline grounding source mapping

| Catalog `contextSources.id` | Module | Typical provider |
|---------------------------|--------|------------------|
| `vssyl_place` | `place` | `place_discoveries` |
| `drive_files` | `drive` | `recent_files` |
| `calendar` | `calendar` | `upcoming_events` |

`pipelineGroundingRetrieval` uses `orchestratePipelineModuleSources` for module-backed ids above. **Skips fetch** when `existingModuleContexts` already has data for that module. Platform adapters unchanged: `location`, `vlink`, `web_search`, `business_context`.

Diagnostics on trace / `POST /api/ai-context-debug/assemble`:

- `contextGenerationId`, `contextGenerations[]`
- `providerSelectionDiagnostics` (considered / selected / skipped + reasons)
- `requiredSourceFailures`, `groundingSourceToProvider`
- `staleContextWarnings`

### Build order

Server `tsc` requires compiled shared types (`ai-context-provider-contract.d.ts`). Root `type-check` and `verify:ci` run `build:shared` first; `vssyl-server` `pretest` / `pretype-check` build `vssyl-shared`.

### Orchestration snapshots (Phase B.5)

Metadata-only **`AIOrchestrationSnapshot`** per orchestration pass for debugging and future quality analysis.

| Env | Default | Purpose |
|-----|---------|---------|
| `AI_ORCHESTRATION_SNAPSHOT_ENABLED` | `false` (prod) | Master switch |
| `AI_ORCHESTRATION_SNAPSHOT_SAMPLE_RATE` | `0.02` | Prod sampling when enabled |
| `AI_ORCHESTRATION_SNAPSHOT_LOG_LEVEL` | `info` | Structured log level |

- **Builder:** `server/src/ai/context/orchestrationSnapshot.ts`
- **Emit:** end of `orchestrateContextRetrieval` → `operation: ai_orchestration_snapshot`
- **In-request:** `query.context.orchestrationSnapshots[]` (cap 2)
- **Trace:** `contextDensity.orchestration.snapshots`
- **Admin assemble:** `snapshotForce: true` on `getContextForAIQuery`
- **Privacy:** `queryPreview` redacted/truncated (≤120 chars); no provider payloads
- **`orchestratorVersion`:** centralized label (e.g. `phase-b5-v1`) for replay when selection/freshness/ranking semantics change
- **`traceTags`:** optional deterministic tags from build metadata (`grounding_failure`, `required_source_failure`, `stale_context`, `admin_debug`, `grounding_boost`, `fallback_provider`, `high_latency`, `sampled_snapshot` on prod emit) — for dashboards/Test Lab filters; no provider payloads in tags

### Intentionally deferred (Phase C+)

- Runtime event invalidation from `invalidatedByEvents`
- Health-based adaptive ranking (`AI_CONTEXT_FRESHNESS_RANKING_ENABLED`)
- Stale-while-revalidate fetch queues
- WebSocket-driven context refresh
- Active Context Graph materialization
- Vector DB / embedding routing in orchestrator

---

## Constants (source of truth in code)

```typescript
// server/src/ai/constants/moduleContextProvider.ts
MODULE_CONTEXT_PROVIDER_TIMEOUT_MS = 5000
MODULE_CONTEXT_PROVIDER_MAX_PAYLOAD_BYTES = 32768
MODULE_CONTEXT_PROVIDER_DEFAULT_CACHE_MS = 900000
```

---

## Version history

| Date | Change |
|------|--------|
| 2026-05-21 | Phase 4B — canonical spec, certification hardening, admin health check |
| 2026-05-26 | Context Provider Contract Phase A/B — orchestrator, optional metadata, grounding bridge, diagnostics |
