> **HISTORICAL DOCUMENT**  
> This document reflects an earlier stage of the AI architecture (deep-dive audit, 2026-07-05).  
> For the **current** architecture, see:  
> - [`docs/ai-system-audit/README.md`](../../ai-system-audit/README.md) — official System Audit  
> - [`docs/architecture/AI_SYSTEM_MENTAL_MODEL.md`](../../architecture/AI_SYSTEM_MENTAL_MODEL.md) — mental model  
> - [`docs/architecture/AI_READING_GUIDE.md`](../../architecture/AI_READING_GUIDE.md) — reading order  
> - [`docs/architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md`](../../architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md) — agent navigation  

---

# AI Context Provider Inventory

**Program:** AI System Deep Dive Audit  
**Date:** 2026-07-05

Inventory of all registered AI context providers, orchestration rules, and platform-only sources.

**Registry source:** `server/src/startup/registerBuiltInModules.ts` → `ModuleAIContextRegistry` at startup.

**Total:** 35 HTTP module providers across 12 built-in modules + 10 platform-only pipeline sources.

---

## Orchestration architecture

| Component | Path | Role |
|-----------|------|------|
| Registry loader | `server/src/ai/context/contextProviderRegistry.ts` | Load + normalize provider metadata |
| Orchestrator | `server/src/ai/context/ContextProviderOrchestrator.ts` | Intent + grounding + parallel fetch |
| Selection plan | `server/src/ai/context/contextProviderSelection.ts` | Required vs optional provider picks |
| Query routing | `server/src/ai/services/moduleContextProviderSelection.ts` | Keyword-based provider pick within module |
| Legacy gate | `server/src/ai/context/legacyProviderCanHandle.ts` | Provider must match query keywords |
| HTTP fetch | `server/src/ai/context/fetchModuleContextProvider.ts` | Internal GET via `ModuleAIContextService` |
| Pipeline map | `server/src/ai/context/pipelineSourceProviderMap.ts` | Catalog source ID → provider |
| Freshness | `server/src/ai/context/contextProviderFreshness.ts` | Stale warnings from cache age |

**Feature flag:** Orchestrator on by default; legacy path via `AI_CONTEXT_ORCHESTRATOR_ENABLED=false`.

---

## Selection rules (when providers run)

1. **Installed module** — `moduleInstallation.enabled = true` (fallback: `dashboard` module).
2. **Query match** — `ModuleAIContextService.analyzeQuery()` → matched modules; up to 4 fetches.
3. **@mention bypass** — `@drive`, `@calendar`, etc. skip keyword matching (100% confidence, ~45ms faster).
4. **Grounding pass** — Required sources from `AIPipelineGroundingRulePolicy` always run first.
5. **Intent filter** — Provider `supportedIntents` must overlap detected intents.
6. **Keyword gate** — `legacyProviderCanHandle()` picks one provider per module per query.
7. **Business scope** — `hr`, `scheduling`, `workforce_comms` skipped without `businessId`.
8. **Budget** — Max 4 optional providers; required providers unlimited in grounding pass.
9. **Dedup** — One provider per module per orchestration pass.

---

## Failure behavior

| Outcome | Effect |
|---------|--------|
| HTTP/auth/timeout (5s) | Audit `failed`; optional omitted |
| Required grounding failure | `requiredSourceFailures`; may block/regenerate per enforcement mode |
| Empty payload | Status `miss`; required miss counts as failure |
| Stale cache | Warning in `staleContextWarnings`; data still used |
| Optional failure | Orchestration continues |

---

## Platform-only pipeline sources (no HTTP module provider)

Handled outside module HTTP fetch in `pipelineGroundingRetrieval`:

| Source ID | Handler | Notes |
|-----------|---------|-------|
| `business_context` | Platform layer | Business workspace policy digest — **not** a `business` module provider |
| `module_context` | Orchestrator aggregate | Meta-source for module-backed data |
| `vlink` | `vlinkPipelineContextService` | Graph relationship context |
| `recent_conversations` | Conversation memory services | Cross-thread summaries |
| `user_memory` | `MemoryRetrievalService` | UserMemoryFact retrieval |
| `location` | Location context (when available) | Geo context |
| `web_search` | Tool/web search path | External retrieval |
| `profile` | User profile snapshot | Identity context |
| `notifications_activity` | Activity feed | Recent platform activity |
| `repo_context` | Code/repo context (operator/dev) | Limited production use |

---

## Module provider inventory

Provider ID format: `{moduleId}.{name}`.

### drive (3 providers)

| ID | Endpoint | Priority | Freshness | Grounding sources | Intents |
|----|----------|----------|-----------|-------------------|---------|
| `drive.recent_files` | `/api/drive/ai/context/recent` | 80 | 300s dynamic | `drive_files`, `module_context` | workflow_action, planning, general_chat |
| `drive.storage_overview` | `/api/drive/ai/context/storage` | 55 | 900s slow | `module_context` | workflow_action, general_chat |
| `drive.file_count` | `/api/drive/ai/query/count` | 45 | 600s slow | `module_context` | workflow_action, general_chat |

**Auth:** JWT; optional `dashboardId`  
**Data:** `driveVisibilityService` — tenant-scoped file lists  
**Files:** `controllers/driveAIContextController.ts`, `services/driveAIContextService.ts`

---

### chat (3 providers)

| ID | Endpoint | Priority | Freshness | Grounding |
|----|----------|----------|-----------|-----------|
| `chat.recent_conversations` | `/api/chat/ai/context/recent` | 70 | 120s dynamic | `module_context`, `recent_conversations`* |
| `chat.unread_messages` | `/api/chat/ai/context/unread` | 85 | 60s realtime | `module_context` |
| `chat.conversation_history` | `/api/chat/ai/query/history` | 50 | 300s dynamic | `module_context` |

\* Platform source; chat provider tagged in registry.

**Auth:** JWT; `conversationId` required for history  
**Files:** `controllers/chatAIContextController.ts`, `services/chatVisibilityService.ts`

---

### calendar (3 providers)

| ID | Endpoint | Priority | Freshness | Grounding |
|----|----------|----------|-----------|-----------|
| `calendar.upcoming_events` | `/api/calendar/ai/context/upcoming` | 75 | 300s dynamic | `calendar`, `module_context` |
| `calendar.today_events` | `/api/calendar/ai/context/today` | 85 | 900s dynamic | `calendar`, `module_context` |
| `calendar.availability` | `/api/calendar/ai/query/availability` | 60 | 600s dynamic | `module_context` |

**Auth:** JWT; ISO8601 range for availability  
**Files:** `controllers/calendarAIContextController.ts`, `services/calendarVisibilityService.ts`

---

### hr (3 providers) — business-scoped

| ID | Endpoint | Priority | Policy |
|----|----------|----------|--------|
| `hr.hr_overview` | `/api/hr/ai/context/overview` | 75 | `HR_EMPLOYEE_READ` |
| `hr.employee_count` | `/api/hr/ai/context/headcount` | 65 | `HR_EMPLOYEE_READ` |
| `hr.time_off_summary` | `/api/hr/ai/context/time-off` | 70 | `HR_TIME_OFF_READ` |

**Requires:** `businessId` + active `businessMember`  
**Skipped:** Orchestrator omits if no business context  
**Files:** `controllers/hrAIContextController.ts`, `services/hrAiContextService.ts`

---

### scheduling (3 providers) — business-scoped

| ID | Endpoint | Priority |
|----|----------|----------|
| `scheduling.scheduling_overview` | `/api/scheduling/ai/context/overview` | 75 |
| `scheduling.coverage_status` | `/api/scheduling/ai/context/coverage` | 70 |
| `scheduling.scheduling_conflicts` | `/api/scheduling/ai/context/conflicts` | 65 |

**Auth:** `checkSchedulingEmployeeAccess`  
**Files:** `controllers/scheduling/schedulingAiContextController.ts`

---

### workforce_comms (2 providers) — business-scoped

| ID | Endpoint | Priority | Intents |
|----|----------|----------|---------|
| `workforce_comms.workforce_comms_overview` | `/api/workforce-comms/ai/context/overview` | 75 | business_operations, workflow_action |
| `workforce_comms.workforce_comms_reach` | `/api/workforce-comms/ai/context/reach` | 70 | business_operations, analytics |

**Reach provider:** Requires `communicationId`; admin report policy for reach metrics.

---

### todo (4 providers)

| ID | Endpoint | Notes |
|----|----------|-------|
| `todo.task_overview` | `/api/todo/ai/context/overview` | Default todo queries |
| `todo.upcoming_tasks` | `/api/todo/ai/context/upcoming` | Due-soon keywords |
| `todo.overdue_tasks` | `/api/todo/ai/context/overdue` | 120s freshness |
| `todo.priority_tasks` | `/api/todo/ai/context/priority` | Priority keywords |

**Gap:** `/api/todo/ai/context/priority-analysis` exists but is **not registered**.

---

### notes (2 providers)

| ID | Endpoint | Requirement |
|----|----------|---------------|
| `notes.recent_notes` | `/api/notes/ai/context/recent` | `dashboardId` required |
| `notes.pinned_notes` | `/api/notes/ai/context/pinned` | `dashboardId` required |

---

### notebook (3 providers) — delegates to notes/todo endpoints

| ID | Actual endpoint |
|----|-----------------|
| `notebook.recent_pages` | notes recent |
| `notebook.pinned_pages` | notes pinned |
| `notebook.task_overview` | todo overview |

Same HTTP handlers; different registry module ID for keyword routing.

---

### vlink (1 provider)

| ID | Endpoint | Data |
|----|----------|------|
| `vlink.recent_vlinks` | `/api/vlinks/ai/context/recent` | Active vlinks + linked entity summaries (max 5 full-access entities) |

**Note:** Catalog source `vlink` is also handled by `vlinkPipelineContextService` separately.

---

### place (5 providers)

| ID | Endpoint | Priority | Grounding |
|----|----------|----------|-----------|
| `place.place_overview` | `/api/place/ai/context/overview` | 60 | `module_context` |
| `place.place_connections` | `/api/place/ai/context/connections` | 55 | `module_context` |
| `place.place_discoveries` | `/api/place/ai/context/discoveries` | **90** | **`vssyl_place`**, `module_context` |
| `place.place_activity` | `/api/place/ai/context/activity` | 65 | `module_context` |
| `place.place_analytics` | `/api/place/ai/context/analytics` | 40 | `module_context` |

**Intents:** `local_discovery`, `recommendation`, `business_operations` (analytics)

---

### dashboard (3 providers)

| ID | Endpoint | Requirement |
|----|----------|---------------|
| `dashboard.dashboard_overview` | `/api/dashboard/ai/context/overview` | Optional dashboardId |
| `dashboard.dashboard_quick_stats` | `/api/dashboard/ai/context/quick-stats` | dashboardId required |
| `dashboard.dashboard_widget_summary` | `/api/dashboard/ai/context/widgets` | dashboardId required |

**Policy:** `evaluateDashboardPolicyDual(DASHBOARD_READ)`

---

### business module

**No registered providers.** Business workspace data flows through:
- Platform source `business_context`
- Business-scoped modules: `hr`, `scheduling`, `workforce_comms`
- `BusinessAIDigitalTwin` policy block in twin assembly

---

## Grounding source → provider mapping

From `pipelineSourceProviderMap.ts`:

| Pipeline source | Primary provider | Fallback |
|-----------------|------------------|----------|
| `drive_files` | `drive.recent_files` | `drive.storage_overview` |
| `calendar` | `calendar.today_events` | `calendar.upcoming_events` |
| `vssyl_place` | `place.place_discoveries` | — |

**business_operations intent** requires `business_context` + `module_context` — not satisfiable by a single HTTP provider.

---

## Provider metadata defaults

When registry omits fields:

| Field | Default |
|-------|---------|
| `priority` | 50 |
| `retrievalCost` | medium |
| `supportedIntents` | `workflow_action`, `general_chat` |
| `freshnessPolicy.maxAgeMs` | Derived from `cacheDuration` |

Modules with incomplete explicit metadata: `todo`, `notes`, `notebook`, `vlink`, `dashboard`.

---

## Third-party marketplace providers

Partners register via manifest sync (`ModuleRegistrySyncService.ts`). Same HTTP contract as built-ins:

- Auth'd `/api/{module}/ai/context/*` endpoints
- Registered in `ModuleAIContextRegistry`
- Subject to orchestrator selection and pipeline source policies when wired

See: `docs/guides/AI_CONTEXT_PROVIDER_API.md`, `memory-bank/moduleSpecs.md`

---

## Known gaps

1. No `business` module HTTP providers — by design; use platform `business_context`.
2. `todo.priority-analysis` route unregistered.
3. Notebook reuses notes/todo handlers — intentional but confusing in diagnostics.
4. HR/scheduling still use direct Prisma in context services (constitutional adoption in progress).
5. Users have no catalog of available `@mentions` or provider capabilities in product UI.

---

## Summary counts

| Module | Providers | Business-scoped |
|--------|-----------|-----------------|
| drive | 3 | No |
| chat | 3 | No |
| calendar | 3 | No |
| hr | 3 | Yes |
| scheduling | 3 | Yes |
| workforce_comms | 2 | Yes |
| todo | 4 | Optional |
| notes | 2 | dashboard required |
| notebook | 3 | via delegation |
| vlink | 1 | No |
| place | 5 | No |
| dashboard | 3 | dashboard scope |
| **Total** | **35** | **8 business-gated** |
