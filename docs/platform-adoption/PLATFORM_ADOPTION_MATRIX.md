# Platform Adoption Matrix

**Program:** Platform Capability Adoption — Phase 0A  
**Date:** 2026-06-25  
**Status:** Assessment baseline — **Wave 5 operator visibility complete** (see [PLATFORM_ADOPTION_WAVE5_CLOSEOUT.md](./PLATFORM_ADOPTION_WAVE5_CLOSEOUT.md))

**Legend:** **F** = Full · **P** = Partial · **M** = Missing · **N/A** = Not applicable for this module

**Evidence sources:** `builtInModuleManifests.ts`, `searchProviderRegistry.ts`, `registerBuiltInModules.ts`, `*ActivityService.ts`, `*PolicyDual.ts`, `*VlinkAccessService.ts`, `context-graph/CONTEXT_GRAPH_ADAPTER_INVENTORY.md`, `ai/retrieval/AI_RETRIEVAL_OPERATION_MATRIX.md`, `platform-kernel/PLATFORM_KERNEL_REALITY_ASSESSMENT.md`

---

## 1. Product modules — personal + business

| Module | Platform Kernel | Unified Search | AI Retrieval | Context Graph | Marketplace Compat. | Platform Controller | Policy Engine | Activity | Notifications | Realtime | AI Integration | V_Link | Biz/Personal Scope |
|--------|-----------------|----------------|--------------|---------------|---------------------|---------------------|---------------|----------|---------------|----------|----------------|--------|-------------------|
| **Drive (File Hub)** | F — writes F; reads via `getActivityForEntity` | F — `driveSearchProvider` ready | F — query-native via Retrieval Adapter | F — file/folder adapter ready | N/A — built-in; manifest complete | P — module governance only | F — `drivePolicyDual` | F — 100% write paths | F — emit + manifest | F — `driveRealtimeService` | F — visibility reads; action executor | F — access + lifecycle services | F — personal + business workspace |
| **Chat** | F — writes F; federated reads via kernel | F — `chatSearchProvider` | F — 2 providers; visibility-bounded | P — conversation only; threads deferred | N/A | P | F — `chatPolicyDual` | F — `chatActivityService` | F — message/mention/reaction | F — socket membership + message events | F — 2 context providers | F — `chatVlinkAccessService` | F |
| **Calendar** | F | F — `calendarSearchProvider` | F — today/upcoming providers | F — event adapter | N/A | P | F — `calendarPolicyDual` | F — `calendarActivityService` | F — reminders emitted | F — `calendarRealtimeService` | F — 2 providers + AI actions | F — `calendarVlinkAccessService` | F |
| **Todo** | F | F — `todoSearchProvider` | F — query-native via Retrieval Adapter | F — task adapter | N/A | P | F — `todoPolicyDual` | F — `todoActivityService` | F — assignment notifications | P — manifest claims realtime; limited fan-out | F — 4 providers | F — `todoVlinkAccessService` | F |
| **Notebook** | P — link activity only | F — `notebookSearchProvider` ready | F — auto via unified search | P — NotebookLink edges; search evidence via retrieval bridge | P — manifest search enabled | P | F — `notebookPolicyDual` | P — `notebookLinkActivityService` only | M — no manifest notification block | M | F — grounded orchestration | P — operational links; no V_Link manifest | F — business + personal via shell |
| **Notes** (legacy) | P | P — covered by `notesSearchProvider` | F — 2 providers | P — inline resolver; no dedicated access service | P — disabled in UI; manifest exists | P | F — `notesPolicyDual` | F — `notesActivityService` | F — share notifications | M | F | P — resolver only; CG-F-002 gap | F — absorbed into Notebook UI |
| **Place** | P | F — `placeSearchProvider` | P — 5 providers; partial grounding | F — listing/meeting adapter | N/A | P | F — `placePolicyDual` | F — `placeActivityService` (27 emit sites) | F — 6 notification types | F — place realtime patterns | F — read-only external AI actions | F — `placeVlinkAccessService` | F — dual personal/business surface |
| **V_Link** | P — platform substrate | F — `vlinkSearchProvider` | F — pipeline context service | F — association substrate (P0) | N/A | P | P — membership-gated | P — `VLinkActivity` table (module-local) | M — not a notification emitter | M | F — pipeline + AI provider | N/A — is the link layer | F |
| **Dashboard** | P | F — dashboard + widget content search | P — composition via search evidence | M — composition only | N/A | P | F — `dashboardPolicyDual` | F — `dashboardActivityService` | M | M | F — quick-stats bridges analytics capability | M | F — personal + business hub |

---

## 2. Business-only modules

| Module | Platform Kernel | Unified Search | AI Retrieval | Context Graph | Marketplace Compat. | Platform Controller | Policy Engine | Activity | Notifications | Realtime | AI Integration | V_Link | Biz/Personal Scope |
|--------|-----------------|----------------|--------------|---------------|---------------------|---------------------|---------------|----------|---------------|----------|----------------|--------|-------------------|
| **HR** | P — activity + domain events; no HR-specific kernel read | F — `hrSearchProvider` ready | F — auto via unified search | F — 4 HR entity types (V_Link path) + search evidence | P — manifest complete; no delegate probes | P | F — `hrPolicyDual` | F — `hrActivityService` | F — 12 HR notification types | M — no realtime manifest | F — 3 AI context routes | F — `hrVlinkAccessService` | F — business only |
| **Scheduling** | P | F — `schedulingSearchProvider` ready | F — auto via unified search | F — schedule/shift/swap adapters + search evidence | P | P | F — `schedulingPolicyDual` | F — `schedulingActivityService` | F — 6 scheduling types | P — publish realtime on schedule publish | F — overview AI routes | F — `schedulingVlinkAccessService` | F — business only |
| **Workforce Comms** | P | F — `workforceCommsSearchProvider` ready | F — auto via unified search | F — communication/campaign adapter + search evidence | P | P | F — `workforceCommsPolicyDual` | F — `workforceActivityService` | F — manifest types (some planned) | M | F — 2 AI context routes | F — `workforceVlinkAccessService` | F — business only |
| **Analytics** (surface) | P — `analyticsActivityService` | M | M — consumes capability reads | M | N/A — not a built-in module id | P — admin analytics ownership | F — `analyticsPolicyDual` | P — capability-scoped activity | M | M | P — feeds dashboard AI quick-stats | M | F — business redirect to `/workspace/analytics` |
| **Members** | P — `identityActivityService` (account platform) | F — `memberSearchProvider` (platform) | M — no module AI context | M | N/A | P | F — `businessMemberPolicyDual` | P — identity activity via account | M | M | M | M | F — business only |

---

## 3. Platform shells, utilities, and widgets

| Surface | Platform Kernel | Unified Search | AI Retrieval | Context Graph | Marketplace Compat. | Platform Controller | Policy Engine | Activity | Notifications | Realtime | AI Integration | V_Link | Biz/Personal Scope |
|---------|-----------------|----------------|--------------|---------------|---------------------|---------------------|---------------|----------|---------------|----------|----------------|--------|-------------------|
| **Business Workspace** (shell) | P — hosts modules; org chart activity | M — no shell-level search | M — boundary service only | M | P — workspace bridge for partners only | P — reference workspace L3 | P — routes inherit module PE | P — indirect via child modules | M | P — `businessConfigRealtimeService` | M — AI landing delegates to platform | M | F — business context router |
| **Business Administration** (#OC) | F — org chart + approval activity/events | M | M | P — org entities; no graph adapter | N/A — platform capability | F — admin portal L3 reference | F — `orgChartPolicyDual` | F — org + approval activity | P — subset via domain events | F — config realtime | M | P — structure edges | F — business only |
| **Notifications** (utility) | P — consumes domain events | M | M | M | N/A | P — UX reference #2 | P | M — not an activity emitter | F — delivery surface + metadata registry | F — in-app realtime delivery | M — consumer not provider | M | F — all contexts |
| **AI** (workspace) | P — platform consumer | M | F — primary retrieval consumer + query-native discovery | F — graph bundle in pipeline | N/A | P — AI pipeline admin | P — session-scoped | M | M | P — twin socket patterns | F — orchestrator consumes all providers | M | F — personal + business landing |
| **Activity Feed** (widget) | F — reads via `/api/activity-feed` kernel path | M | P — via platform timeline | M | N/A | M | P | F — display consumer | M | F — `activity:feed:refresh` listener | M | M | F |
| **Quick Stats** (widget) | M | M | P — via analytics capability | M | N/A | M | M | M | M | M | P — `dashboardAIContextController` | M | F — dashboard-hosted |
| **Quick Notes** (widget) | **F** — `widget.quicknote.create` | **F** — dashboard provider | **F** — query-native search | N/A | N/A | M | M | **F** | M | M | M | M | F — personal dashboard only |
| **Bookmarks** (widget) | **F** — `widget.bookmark.create` | **F** — dashboard provider | **F** — query-native search | N/A | N/A | M | M | **F** | M | M | M | M | F — personal dashboard only |

---

## 4. Rationale notes by capability

### Platform Kernel

**Full** requires normalized `emitModuleActivityEvent` on write paths **and** federated reads via `platformTimelineReadService` (Wave 1 complete for hot paths). **ACT-R1** legacy read migration closed for Activity Feed, AI, Analytics personal path, Drive history APIs, Place feed. Remaining **P**: `vLinkActivity` module-local table.

**Wave 1 evidence:** [KERNEL_READ_MIGRATION.md](./KERNEL_READ_MIGRATION.md), [ACTIVITY_READ_PARITY_MATRIX.md](./ACTIVITY_READ_PARITY_MATRIX.md)

### Unified Search

Provider registration in `searchProviderRegistry.ts` is the adoption gate. **Wave 2 closed:** HR, Scheduling, Workforce Comms, Notebook. Remaining gaps: Analytics, dashboard widgets.

**Wave 2 evidence:** [PLATFORM_DISCOVERABILITY.md](./PLATFORM_DISCOVERABILITY.md), [DISCOVERABILITY_PARITY_MATRIX.md](./DISCOVERABILITY_PARITY_MATRIX.md)

### AI Retrieval

Provider registration ≠ discovery adoption. **Wave 3:** query-driven path via `discover()` for all search-ready modules when consumer intents or `general_discovery` signals match. List/summary providers remain additive for non-query intents.

**Wave 4 evidence:** [PLATFORM_NATIVE_DASHBOARD.md](./PLATFORM_NATIVE_DASHBOARD.md), [DASHBOARD_ADOPTION_MATRIX.md](./DASHBOARD_ADOPTION_MATRIX.md)

### Context Graph

From `CONTEXT_GRAPH_ADAPTER_INVENTORY.md`. **F** = adapter ready with V_Link path. **P** = partial entity coverage or missing dedicated access service.

### Marketplace Compatibility

Built-in modules are **N/A** for partner delegate contracts. Evaluated on manifest honesty and whether surfaces would pass `validateModuleCertification` patterns. Notebook and Notes have manifest gaps.

### Platform Controller

**Wave 5:** All 22 evaluated surfaces appear in `/admin-portal/platform-adoption` with adoption cards. Built-ins show compile-time baseline + live search/activity signals. Partner probes remain on Marketplace submission detail.

**Evidence:** [PLATFORM_OPERATOR_VISIBILITY.md](./PLATFORM_OPERATOR_VISIBILITY.md), [PLATFORM_ADOPTION_DASHBOARD_STANDARD.md](./PLATFORM_ADOPTION_DASHBOARD_STANDARD.md)

### Policy Engine

**F** = module-specific `*PolicyDual` wrapper on mutation and read paths. Widgets and shells inherit or lack PE.

### Activity System

Distinct from Platform Kernel reads. **F** = dedicated `*ActivityService` with taxonomy on primary write paths.

### Notifications

**F** = manifest metadata registered + server emitters for primary types. Planned-only types count as **P**.

### Realtime

**F** = module-specific realtime fan-out beyond platform `activity:feed:refresh`. Chat, Drive, Calendar, Place are reference patterns.

### AI Integration

**F** = `ModuleAIContext` in registry + ≥1 `/api/.../ai/context/*` provider route. All built-in product modules meet this; widgets do not.

### V_Link

**F** = dedicated `*VlinkAccessService` + lifecycle + manifest `vlink: true`. Notes lacks dedicated service (CG-F-002).

### Business / Personal scope

**F** = `businessWorkspace: true` in manifest and/or `supportedContexts` includes both where product-intent requires dual surface.

---

## 5. Matrix statistics

| Capability | Full | Partial | Missing | N/A |
|------------|------|---------|---------|-----|
| Platform Kernel | 11 | 11 | 0 | 0 |
| Unified Search | 10 | 1 | 11 | 0 |
| AI Retrieval | 6 | 12 | 4 | 0 |
| Context Graph | 10 | 8 | 4 | 0 |
| Marketplace Compat. | 0 | 6 | 0 | 16 |
| Platform Controller | 1 | 17 | 4 | 0 |
| Policy Engine | 14 | 8 | 0 | 0 |
| Activity | 11 | 7 | 4 | 0 |
| Notifications | 9 | 3 | 10 | 0 |
| Realtime | 5 | 4 | 13 | 0 |
| AI Integration | 14 | 4 | 4 | 0 |
| V_Link | 10 | 6 | 5 | 1 |
| Biz/Personal Scope | 20 | 2 | 0 | 0 |

*Counts across 22 evaluated surfaces.*

---

**Last updated:** 2026-06-25
