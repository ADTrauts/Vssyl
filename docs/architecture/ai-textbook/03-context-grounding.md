# Part 3 — Context + Grounding

**Last verified:** 2026-05-26  
**Hub:** [`../AI_SYSTEM_TEXTBOOK.md`](../AI_SYSTEM_TEXTBOOK.md) · **Prior:** [Part 2](./02-request-lifecycle.md)

---

## 9. Grounding System

### What it does

Ensures the twin has **retrieved evidence** appropriate to the query’s intents before (or while) generating an answer. Runs prepass retrieval (`runPipelineGroundingRetrieval`), tracks required source failures, and applies admin-configured **enforcement modes** via `applyPipelineEnforcement`.

### Why it exists

LLMs confidently answer generic questions (“yoga studios near me”) without live Place data. Grounding connects **policy** (what evidence is required) to **runtime behavior** (block, disclose, or allow with trace).

### Main files

- `server/src/ai/pipeline/pipelineGroundingRetrieval.ts`
- `server/src/ai/pipeline/pipelineEnforcement.ts`
- `server/src/ai/pipeline/buildPipelineTrace.ts`
- `server/src/ai/pipeline/pipelineCatalogService.ts`

### Inputs

- Inferred intents + effective catalog
- User location / IP hints
- Module contexts from orchestrator (including grounding pass)
- Platform sources: `location`, `vlink`, `web_search`, `business_context`

### Outputs

- Grounding prepass payloads merged into assembly
- `requiredSourceFailures[]` on orchestration result
- Trace records + enforcement outcome on response

### Connected systems

Catalog reconcile → grounding rules → orchestrator (module sources) → assembly → enforcement gate.

**Canonical diagram:** [`AI_TWIN_PROMPT_PIPELINE.md`](../AI_TWIN_PROMPT_PIPELINE.md#full-request-flow-with-grounding-gate)

### Enforcement modes

| Mode | Behavior (simplified) |
|------|-------------------------|
| **off** | Diagnostics only; model may answer |
| **disclose** | Response notes missing grounding |
| **block** | Safe failure / clarification instead of confident guess |
| **regenerate** | Attempt recovery path per policy |

Hybrid rule: `requiredSourceFailures` are **always recorded**; hard block depends on enforcement setting.

### Grounding failures & generic risk prevention

When required Place/location/memory sources miss:

- Trace tags `grounding_failure`, `required_source_failure`
- Generic risk intents (local search, factual claims about user data) get highest scrutiny
- Admin Test Lab shows dry-run trace without sending user-visible reply

### Failure modes

- Catalog misconfiguration (source disabled but rule required)
- Place provider slow/empty in business workspace without business scope
- Confusion between **optional** source miss vs **required** failure

### Debugging

- Admin `/admin-portal/ai-pipeline` Test Lab
- Trace `grounding` section + `contextDensity.orchestration`
- Tests: `pipelineGroundingRetrieval.orchestrator.test.ts`, `pipelineGroundingRetrieval.vlink.test.ts`

### Future evolution

Richer evidence bundles; regenerate flows; tighter integration with web search source.

---

## 10. Module Context Providers

### What it does

Module-owned HTTP endpoints return **live, tenant-scoped JSON** describing entities relevant to the user’s query — files, events, threads, places, employees, shifts.

### Why it exists

Modules authorize and query their own data. The platform should not duplicate Drive SQL in Core or bypass module tenancy checks.

### Main files

- `server/src/startup/registerBuiltInModules.ts` — built-in registration + metadata
- `server/src/ai/services/ModuleAIContextService.ts` — registry + internal fetch
- `server/src/ai/services/moduleContextProviderCertification.ts`
- Per-module controllers under `server/src/.../ai/context/`

### Built-in modules (Wave 1 metadata)

| Module | Typical providers | `pipelineSourceIds` (examples) |
|--------|-------------------|----------------------------------|
| **Drive** | recent files, search | `drive_files` |
| **Calendar** | upcoming events | `calendar` |
| **Chat** | threads, messages | `chat_threads` |
| **Place** | nearby / saved places | `vssyl_place` |
| **HR** | employees (business) | `hr_employees` |
| **Scheduling** | shifts (business) | `scheduling_shifts` |

Metadata on each provider may include: `supportedIntents`, `retrievalCost` (`low` | `medium` | `high`), `priority`, `volatility`, `freshnessPolicy`.

### Provider author journey

1. Implement `GET /api/{module}/ai/context/{name}` with JWT auth + tenant scope.
2. Register in module manifest `aiContext.contextProviders`.
3. Add optional orchestrator metadata (`pipelineSourceIds`, etc.).
4. Verify via certification parser + admin registry validate.
5. No `DigitalLifeTwinCore` edit required.

**Contract (must comply):** [`AI_CONTEXT_PROVIDER_API.md`](../../guides/AI_CONTEXT_PROVIDER_API.md)

### Inputs / outputs

- **In:** `userId`, `dashboardId`, `businessId` (required for HR/scheduling), query params
- **Out:** Bounded JSON (counts, summaries, entity refs) — not unbounded dumps

### Connected systems

Registry → orchestrator selection → fetch → entity linking → `assembleAIContext`.

### Failure modes

- 401/403 from provider → audit `error`
- Timeout > 5s → `timeout` in density report
- Missing `businessId` for business modules → empty context

### Debugging

- `providerFetchAudit` entries
- Module-specific logs; admin context debug route

### Future evolution

Marketplace modules use same contract (`MODULE_AI_SDK_BOUNDARIES.md`); certification validator for metadata shapes (Phase C).

---

## 11. Memory + Preferences

### What it does

**Memory** (`UserMemoryFact`, recall services) supplies durable user-specific facts. **Preferences** (`PreferenceResolver`, `UserAIContext`) supply personality, autonomy boundaries, and promoted learning — injected as assembly blocks, not hidden prompt hacks.

### Why it exists

Personalization must be **explicit and consent-governed**. Inferred chat context stays `pending` until user promotes; only `active` rows enter prompts.

### Main files

- `server/src/ai/preferences/PreferenceResolver.ts`
- `server/src/services/userMemoryFactService.ts`
- `server/src/ai/services/userAIContextLearningService.ts`
- `server/src/ai/context/AIContextAssembler.ts` (preference blocks)

### Inputs

- User ID, scope, query (recall intent detection)
- Control Center settings, active `UserAIContext` rows
- Business workspace → separate policy block ([`AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md`](../AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md))

### Outputs

- Memory fact list for assembly
- Resolved preferences → `personalityForProvider`, `autonomyBoundariesForProvider`
- `responseInfluence` summary on response metadata

### Inferred vs explicit preferences

| Type | Source | Prompt-eligible |
|------|--------|-----------------|
| **Explicit** | Control Center questionnaires | Yes |
| **Promoted learning** | User approves pending context | Yes (`active`) |
| **Pending inference** | Chat extraction | No until promoted |
| **Session soft overrides** | Ephemeral thread tone | Applied with metadata; not persisted until promote |

Preview API: `GET /api/ai/effective-preferences`

### Failure modes

- Tenancy leak if memory query ignores `dashboardId`/`businessId`
- Stale memory facts without recall intent still bounded by assembly budget

### Debugging

- Explain drawer / `responseInfluence`
- Memory admin routes; Learning tab on `/ai`

### Future evolution

Unified memory architecture doc in Memory Bank; stronger recall ranking.

---

## 12. Context Freshness + Volatility

### What it does

Providers declare **`freshnessPolicy`** and **`volatility`** metadata. After fetch, `buildStaleContextWarnings` compares policy vs fetch outcome and sets per-provider freshness (`fresh` | `stale` | `unknown`) for diagnostics — **without** automatic cache invalidation yet.

### Why it exists

Not all module data changes at the same rate. Chat is volatile; Drive recent files less so. The platform needs honest **warnings** before it builds complex invalidation infrastructure.

### Why invalidation is deferred (Phase C)

Event-driven invalidation (`invalidatedByEvents`) requires reliable domain event coverage and websocket fan-out — not yet shipped. Query-time fetch + stale **warnings** deliver observability first:

> Warn honestly > silently serve ancient cache > over-invalidate everything

### Main files

- `server/src/ai/context/contextProviderFreshness.ts`
- Provider metadata in `registerBuiltInModules.ts`
- `shared/src/types/ai-context-provider-contract.ts`

### Inputs / outputs

- **In:** Provider metadata, fetch timestamps, optional provider-supplied freshness hints
- **Out:** `staleContextWarnings[]`, snapshot `freshness` fields, trace tag `stale_context`

### Failure modes

- Missing metadata → `unknown` freshness (not an error)
- False stale warnings if provider clocks skewed

### Debugging

- Orchestration snapshot selected provider `freshness`
- Tests: `contextProviderFreshness.test.ts`

### Future evolution

Phase C: `invalidatedByEvents` subscriber, stale-while-revalidate, websocket refresh hints.

**Next:** [Part 4 — Observability](./04-observability.md)
