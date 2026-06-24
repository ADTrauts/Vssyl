# AI Retrieval — Operation Matrix

**Program:** AI Retrieval Adapter — Phase 0A  
**Date:** 2026-06-23  
**Status:** Baseline inventory — not runtime-validated in CI

**Legend:** **C** = Compliant · **P** = Partial · **N** = Not implemented · **S** = Stub

---

## 1. Orchestration operations

| ID | Operation | Owner | Auth | Visibility | Status |
|----|-----------|-------|------|------------|--------|
| **AR-O-01** | Query intent analysis | `ModuleAIContextService.analyzeQuery` | userId | N/A | **C** |
| **AR-O-02** | Provider selection plan | `contextProviderSelection.ts` | userId | install filter | **C** |
| **AR-O-03** | Parallel provider fetch | `ContextProviderOrchestrator` | JWT internal | per provider | **C** |
| **AR-O-04** | Grounding second pass | `pipelineGroundingRetrieval` | userId | catalog-gated | **C** |
| **AR-O-05** | Skip double-fetch | `moduleHasExistingContext` | — | — | **C** |
| **AR-O-06** | Orchestration snapshot | `orchestrationSnapshot.ts` | admin force | — | **C** |
| **AR-O-07** | Unified Search delegate | — | — | — | **N** |
| **AR-O-08** | Retrieval adapter facade | — | — | — | **N** |

---

## 2. Platform retrieval sources

| ID | Source | Service | Inputs | Outputs | PE | Tenant | Status |
|----|--------|---------|--------|---------|-----|--------|--------|
| **AR-P-01** | User memory | `MemoryRetrievalService` | query, userId, budget | facts + report | user scope | user | **C** |
| **AR-P-02** | Preferences | `PreferenceResolver` | userId, session | effective prefs | user | user | **C** |
| **AR-P-03** | V_Link pipeline | `vlinkPipelineContextService` | query signals | containers | membership | scope | **C** |
| **AR-P-04** | Graph bundle | `graphBundlePipelineContextService` | query signals | edges + hydrate | adapter | tenant | **C** |
| **AR-P-05** | Location | `geolocationService` | clientIp | city/region | N/A | N/A | **C** |
| **AR-P-06** | Activity feed | `platformActivityQueryService` | userId, since | activity rows | feed auth | user | **P** |
| **AR-P-07** | Business boundary | `businessWorkspaceBoundaries` | businessId | policy block | member | business | **C** |
| **AR-P-08** | Lazy user skim | `lazyUserContext` | userId | profile skim | user | user | **C** |
| **AR-P-09** | Unified Search | `searchCapabilityService` | query, filters | SearchResult[] | search:read | context | **N** (AI unwired) |

---

## 3. Module context provider matrix (summary)

| Module | Providers | Grounding sources | Visibility | Matrix |
|--------|-----------|-------------------|------------|--------|
| drive | 2 | `drive_files` | visibility service | **C** |
| chat | 2 | `recent_conversations` | visibility service | **C** |
| calendar | 2 | `calendar` | visibility service | **C** |
| todo | 4 | `module_context` | visibility service | **C** |
| notes | 2 | — | visibility service | **C** |
| notebook | 3 | — | delegates | **C** |
| vlink | 1 | `vlink` | pipeline service | **C** |
| place | 5 | `vssyl_place` | place services | **P** |
| dashboard | 3 | — | partial Prisma | **P** |
| hr | 3 | `business_context` | direct Prisma | **P** |
| scheduling | 3 | `module_context` | direct Prisma | **P** |
| workforce_comms | 2 | — | review | **P** |

Full provider table: [AI_CONTEXT_PROVIDER_MATRIX.md](../../architecture/audits/AI_CONTEXT_PROVIDER_MATRIX.md)

---

## 4. AI tool retrieval

| Tool | Retrieval method | Search overlap | Status |
|------|------------------|----------------|--------|
| `list_drive_files` | `driveVisibilityService` list | drive search (different op) | **C** |
| `search_places` | `placeAIActionService.searchPlaces` | place search provider | **P** — parallel |
| `create_calendar_event` | action service | N/A | **C** (write) |
| Module actions | `ActionExecutor` | N/A | **P** per module |

---

## 5. Pipeline catalog source mapping

| Catalog source | Retrieval path | Module-backed | Status |
|----------------|----------------|---------------|--------|
| `drive_files` | orchestrator → drive `recent_files` | Yes | **C** |
| `calendar` | orchestrator → `today_events` | Yes | **C** |
| `vssyl_place` | orchestrator → `place_discoveries` | Yes | **C** |
| `vlink` | `vlinkPipelineContextService` | Platform | **C** |
| `location` | geolocation | Platform | **C** |
| `user_memory` | assembler injection | Platform | **C** |
| `graph_bundle` | graph bundle service | Platform | **C** |
| `web_search` | external (gated) | Platform | **S** |
| `business_context` | hr providers / boundary | Partial | **P** |
| `notifications_activity` | not fully wired | — | **N** |

Map: `server/src/ai/context/pipelineSourceProviderMap.ts`

---

## 6. Gaps vs target adapter

| Gap | Current | Target |
|-----|---------|--------|
| Query-driven file find | recent list only | Search delegate |
| Query-driven task find | upcoming/overdue lists | Search delegate |
| Single retrieval audit trail | split orchestrator + grounding | adapter unified audit |
| CI enforcement | partial tests | operation matrix gate |

---

**Last updated:** 2026-06-23
