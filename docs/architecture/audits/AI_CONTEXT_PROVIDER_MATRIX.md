# AI Context Provider Matrix

**Phase:** AI Platform Wave 0 (2026-06-04)  
**Registry source:** `server/src/startup/registerBuiltInModules.ts` → `moduleAIContextRegistry`  
**Fetch path:** `ContextProviderOrchestrator` → `fetchModuleContextProvider` (HTTP to module endpoints)  
**Parent:** [AI_PLATFORM_CONSTITUTIONAL_AUDIT.md](./AI_PLATFORM_CONSTITUTIONAL_AUDIT.md)

---

## Legend

| Field | Meaning |
|-------|---------|
| **Visibility** | Uses module visibility/list service vs raw Prisma |
| **Tenant** | Scoped by `dashboardId` / `businessId` / `householdId` |
| **Grounding** | Pipeline source mapping + freshness metadata |
| **Diagnostics** | Contributes to orchestration snapshot / provider fetch audit |
| **Tests** | Provider selection or integration tests |

---

## Built-in context providers (registered)

| Provider id | Module | Endpoint | Visibility service | Direct Prisma | Tenant scoped | Grounding | Freshness | Diagnostics | Tests |
|-------------|--------|----------|-------------------|---------------|---------------|-----------|-----------|-------------|-------|
| `recent_files` | drive | `/api/drive/ai/context/recent` | **Yes** — `driveVisibilityService.listAccessibleRecentFilesForAIContext` | **No** | dashboard + user | `drive_files`, `module_context` | 300s policy | Yes | yes |
| `storage_overview` | drive | `/api/drive/ai/context/storage` | **Yes** — `aggregateAccessibleDriveStorageForAIContext` | **No** | dashboard + user | `module_context` | 300s | Yes | yes |
| `recent_conversations` | chat | `/api/chat/ai/context/recent` | **Yes** (chat services) | No | participant scope | `module_context`, `recent_conversations` | 120s | Yes | yes |
| `unread_messages` | chat | `/api/chat/ai/context/unread` | **Yes** | No | participant scope | `module_context` | 120s | Yes | yes |
| `upcoming_events` | calendar | `/api/calendar/ai/context/upcoming` | **Yes** | No | calendar scope | `calendar`, `module_context` | 300s | Yes | yes |
| `today_events` | calendar | `/api/calendar/ai/context/today` | **Yes** | No | calendar scope | `calendar` | 300s | Yes | yes |
| `task_overview` | todo | `/api/todo/ai/context/overview` | **Yes** | No | dashboard | `module_context` | 300s default | Yes | yes |
| `upcoming_tasks` | todo | `/api/todo/ai/context/upcoming` | **Yes** | No | dashboard | `module_context` | 300s | Yes | yes |
| `overdue_tasks` | todo | `/api/todo/ai/context/overdue` | **Yes** | No | dashboard | `module_context` | 300s | Yes | yes |
| `recent_notes` | notes | `/api/notes/ai/context/recent` | **Yes** (`notesVisibilityService`) | No | dashboard | — | 300s | Yes | partial |
| `pinned_notes` | notes | `/api/notes/ai/context/pinned` | **Yes** | No | dashboard | — | 300s | Yes | partial |
| `recent_pages` | notebook | `/api/notes/ai/context/recent` | **Yes** (delegates notes) | No | dashboard | — | 300s | Yes | `moduleContextProviderSelection.notebook.test.ts` |
| `pinned_pages` | notebook | `/api/notes/ai/context/pinned` | **Yes** | No | dashboard | — | 300s | Yes | yes |
| `task_overview` (notebook) | notebook | `/api/todo/ai/context/overview` | **Yes** (todo) | No | dashboard | — | 300s | Yes | yes |
| `recent_vlinks` | vlink | `/api/vlinks/ai/context/recent` | **Yes** (vlink pipeline service) | No | membership confirmed | `vlink` | 300s | Yes | `vlinkPipelineContextService.test.ts` |
| `place_overview` | place | `/api/place/ai/context/overview` | via place services | No | user graph | `module_context` | 300s | Yes | `moduleContextProviderSelection.place.test.ts` |
| `place_connections` | place | `/api/place/ai/context/connections` | place services | No | user | `module_context` | 300s | Yes | yes |
| `place_discoveries` | place | `/api/place/ai/context/discoveries` | place services | No | user | — | — | Yes | review |
| `place_activity` | place | `/api/place/ai/context/activity` | place services | No | user | — | — | Yes | review |
| `place_analytics` | place | `/api/place/ai/context/analytics` | place services | No | user | — | — | Yes | review |
| `dashboard_overview` | dashboard | `/api/dashboard/ai/context/overview` | partial | likely Prisma | dashboard | — | 300s | Yes | review |
| `dashboard_quick_stats` | dashboard | `/api/dashboard/ai/context/quick-stats` | partial | likely Prisma | dashboard | — | 120s | Yes | review |
| `dashboard_widget_summary` | dashboard | `/api/dashboard/ai/context/widgets` | partial | likely Prisma | dashboard | — | 300s | Yes | review |
| `hr_overview` | hr | `/api/hr/ai/context/overview` | **No** | **Yes** (controller) | business | `business_context` | 300s | Yes | review |
| `employee_count` | hr | `/api/hr/ai/context/headcount` | **No** | **Yes** | business | — | 300s | Yes | review |
| `hr_time_off` | hr | `/api/hr/ai/context/time-off` | **No** | **Yes** | business | — | 300s | Yes | review |
| `scheduling_overview` | scheduling | `/api/scheduling/ai/context/overview` | **No** | **Yes** | business | `module_context` | 300s | Yes | review |
| `coverage_status` | scheduling | `/api/scheduling/ai/context/coverage` | **No** | **Yes** | business | — | 300s | Yes | review |
| `scheduling_conflicts` | scheduling | `/api/scheduling/ai/context/conflicts` | **No** | **Yes** | business | — | 300s | Yes | review |

---

## Platform / non-module providers

| Source | Service | Class | Notes |
|--------|---------|-------|-------|
| User memory | `MemoryRetrievalService` | **canonical** | Injected in assembler, not HTTP provider |
| V_Link pipeline | `vlinkPipelineContextService.ts` | **canonical** | Confirmed memberships only; catalog source `vlink` |
| User AI context records | `userAIContextController` | **canonical** | CRUD at `/api/ai/context` (mount collision — see legacy register) |
| Business workspace boundary | `businessWorkspaceBoundaries.ts` | **canonical** | Policy block in twin, not module provider |
| Lazy user skim | `lazyUserContext.ts` | **canonical** | Low-cost profile for orchestrator |
| Cross-module synthesis | `ContextSynthesisService.ts` | **optional** | `AI_SYNTHETIC_CONTEXT_ENABLED` |
| Pipeline grounding prepass | `pipelineGroundingRetrieval.ts` | **canonical** | Place, location, memory prepass |

---

## Business Workspace

| Aspect | Status |
|--------|--------|
| Registered `moduleId` | **No** — shell, not a module |
| Context providers | **None** in built-in registry |
| AI surfaces | Business AI Control Center, workspace AI routes, widgets |
| Wave 0 class | **partial** — boundaries via `businessWorkspaceBoundaries.ts` only |

**Disposition:** Wave 1C — define explicit business context providers or document delegation to HR/scheduling/dashboard only.

---

## Analytics / Admin Portal

| Surface | Type | Context for twin? |
|---------|------|-------------------|
| Product `analytics` module | Tenant analytics dashboards | **No** — not wired as twin context source |
| Admin portal analytics ops | `adminPortalRoutes.analyticsOps.ts` | **No** — platform ops metrics |
| Admin AI pipeline | Pipeline catalog + diagnostics | **Observability only** — not user grounding |

See [AI_ADMIN_ANALYTICS_BOUNDARY_REVIEW.md](./AI_ADMIN_ANALYTICS_BOUNDARY_REVIEW.md).

---

## Orchestration and certification metadata

| Mechanism | Path | Purpose |
|-----------|------|---------|
| Provider certification | `moduleContextProviderCertification.ts` | Structural validation (endpoint pattern, cache bounds) |
| Health check | `moduleContextProviderHealthCheck.ts` | Startup / admin health panel |
| Selection | `moduleContextProviderSelection.ts`, `contextProviderSelection.ts` | Intent + pipeline catalog mapping |
| Freshness warnings | `contextProviderFreshness.ts` | Stale context warnings in twin metadata |
| Snapshots | `orchestrationSnapshot.ts` | Admin dry-run / audit trail |
| Tests | `contextProviderOrchestrator.test.ts`, `moduleContextProviderCertification.test.ts` | Platform |

---

## Wave 1C priorities (provider compliance)

| Priority | Provider group | Action |
|----------|----------------|--------|
| P0 | `recent_files`, `storage_overview` | **Done (2026-06-03)** — `driveAIContextService` → `driveVisibilityService`; see [AI_PLATFORM_WAVE_1C_DRIVE_CONTEXT_CLOSEOUT.md](./AI_PLATFORM_WAVE_1C_DRIVE_CONTEXT_CLOSEOUT.md) |
| P1 | HR + scheduling providers | Thin controllers + visibility services |
| P1 | Dashboard providers | Document aggregation contract; reduce raw Prisma |
| P2 | Place analytics provider | Confirm grounding necessity vs insights-only |
| P2 | Notebook duplicate endpoints | Document intentional reuse of notes/todo APIs |

---

## Certified module evidence (do not re-audit)

| Module | Evidence |
|--------|----------|
| Chat | CHAT_OPERATION_MATRIX — AI context + action routing |
| Calendar | CALENDAR_OPERATION_MATRIX |
| Todo | TODO_OPERATION_MATRIX |
| Notebook | NOTEBOOK_OPERATION_MATRIX |
| Place | PLACE_OPERATION_MATRIX — read-only AI twins |
| File Hub | FILE_HUB — tools + Drive context providers compliant (Wave 1C) |

---

## Operational links vs V_Link (Relationship Framework)

Module **operational** cross-entity links are exposed to AI via **module context providers**, not the platform `vlink` pipeline source.

| Mechanism | Taxonomy class | AI exposure path | V_Link source? |
|-----------|----------------|------------------|----------------|
| `VLinkEntity` (confirmed) | Association | `vlinkPipelineContextService` / `recent_vlinks` | **Yes** |
| `TaskFileLink`, `TaskEventLink` | Association / Reference | Todo AI providers (`task_overview`, …) | No |
| `NotebookLink` | Association / Reference | Notebook providers + hydrate via target visibility | No |
| `FileReference` (chat attachment) | Attachment | Drive visibility + chat context | No |
| `entityLinking` inference | AI context (ephemeral) | Twin merge — lower precedence than persisted V_Link | No |

**Authority:** [RELATIONSHIP_OWNERSHIP_MATRIX.md](../RELATIONSHIP_OWNERSHIP_MATRIX.md), [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](../RELATIONSHIP_READ_FEDERATION_CONTRACT.md).
