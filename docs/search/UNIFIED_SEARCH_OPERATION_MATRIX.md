# Unified Search — Operation Matrix

**Program:** Unified Search Capability — Phase 1A  
**Date:** 2026-06-23  
**Status:** Updated post–Phase 1A — see [UNIFIED_SEARCH_PHASE_1A_CLOSEOUT.md](./UNIFIED_SEARCH_PHASE_1A_CLOSEOUT.md)

**Legend:** **C** = Compliant · **P** = Partial · **N** = Not implemented · **S** = Stub

---

## 1. Global orchestrator operations

| ID | Operation | Route | Owner | Auth | Visibility | Status |
|----|-----------|-------|-------|------|------------|--------|
| **US-G-01** | Global entity search | `POST /api/search` | `searchCapabilityService` | JWT + `search:read` | Per-provider | **C** |
| **US-G-02** | Search suggestions | `GET /api/search/suggestions` | `searchCapabilityService` | JWT + `search:read` | N/A | **P** — module hints |
| **US-G-03** | Module filter facet | `filters.moduleId` | Platform | JWT | Provider subset | **C** |
| **US-G-04** | Drive mime facet | `filters.driveMimeCategory` | Drive provider | JWT | driveVisibility | **C** |
| **US-G-05** | Date range facet | `filters.dateRange` | Drive provider | JWT | driveVisibility | **C** |
| **US-G-06** | Pinned facet | `filters.pinned` | Drive provider | JWT | driveVisibility | **C** |
| **US-G-07** | Result merge + rank | Orchestrator sort | Platform | — | — | **P** — naive score |
| **US-G-08** | Provider registry | `searchProviderRegistry.ts` | Platform | — | — | **C** — static registry |
| **US-G-09** | Tenant context pass-through | `filters.context` | Platform | `search:read` scope | Per-provider | **C** |
| **US-G-10** | Tag facet (global) | — | Context Graph | — | tagIndexService | **N** — not wired |

---

## 2. Provider matrix (global registry)

| Provider ID | Entity types | Search authority | Permission authority | Global | Manifest `search` | Matrix |
|-------------|--------------|------------------|----------------------|:------:|:-----------------:|:------:|
| **drive** | file, folder | driveVisibilityService | driveVisibility + PE | ✅ | ✅ | **C** |
| **chat** | message, conversation | chatVisibilityService | chatVisibility + PE | ✅ | ✅ | **C** |
| **place** | business_listing | placeVisibilityService | place PE + publish rules | ✅ | ✅ | **C** |
| **vlink** | vlink | vlinkService | vlinkPermissionService | ✅ | ✅ | **C** |
| **member** | user | memberSearchVisibility | org/connection builder | ✅ | — | **P** |
| **dashboard** | dashboard | searchProviderRegistry | owner + context filter | ✅ | ✅ | **P** |
| **calendar** | event | calendarVisibilityService | calendar PE | ✅ | ✅ | **C** |
| **todo** | task | todoVisibilityService | todo PE | ✅ | ✅ | **C** |
| **notes** | note | notesVisibilityService | notes PE | ✅ | ✅ | **C** |
| **hr** | employee, time-off | — | — | ❌ | ❌ | **N** |
| **scheduling** | shift, schedule | — | — | ❌ | ❌ | **N** |
| **workforce_comms** | broadcast | — | — | ❌ | ❌ | **N** |
| **notebook** | page, links | notesVisibilityService | notes | ❌ | entity flag | **N** |
| **notifications** | notification | notificationController | user scope | ❌ | ❌ | **N** (list filter) |
| **admin** | user, business | admin services | operator role | ❌ | N/A | **N** (operator) |

\*Notes module: `supportsSearch` on entity, not top-level `capabilities.search`.

---

## 3. Module-local search operations (not federated)

| ID | Module | Operation | Route / surface | Status |
|----|--------|-----------|-----------------|--------|
| **US-L-01** | Calendar | Event search | `GET /calendar/events/search` | **C** (module) |
| **US-L-02** | Todo | Task title search | Task list API `search` param | **C** (module) |
| **US-L-03** | Notes | Page search | Notes list `search` query | **C** (module) |
| **US-L-04** | Chat | Invite user search | chat user search service | **C** (module) |
| **US-L-05** | Place | User discovery | `placeController.searchUsers` | **C** (module) |
| **US-L-06** | Member | User search | `GET /member/...` search | **C** (module) |
| **US-L-07** | Drive | In-module search UI | `DriveSearch.tsx` | **C** (module UI) |
| **US-L-08** | Admin | User filter | Admin portal APIs | **C** (operator) |
| **US-L-09** | Notifications | Inbox filter | notifications page | **P** |
| **US-L-10** | Logs | Activity log filter | logController | **P** (admin) |

---

## 4. Adjacent platform operations

| ID | System | Operation | Search role | Status |
|----|--------|-----------|-------------|--------|
| **US-A-01** | Domain Events | `search_index_stub` consumer | Future derived index | **S** (gated) |
| **US-A-02** | Tag Index | `lookupTagsByLabel` | Tag facet discovery | **C** (not in global UI) |
| **US-A-03** | AI Pipeline | `orchestratePipelineModuleSources` | Retrieval not search UX | **P** |
| **US-A-04** | V_Link resolver | Entity hydrate | Not search hits | **C** (boundary) |
| **US-A-05** | Platform Entity Registry | Entity metadata | Discovery metadata only | **P** |

---

## 5. Matrix summary

| Category | C | P | N | S |
|----------|--:|--:|--:|--:|
| Global orchestrator | 3 | 4 | 2 | 1 |
| Global providers (slots) | 4 | 2 | 8 | 0 |
| Module-local | 7 | 2 | 0 | 0 |
| Adjacent | 2 | 2 | 0 | 1 |

**Global federated coverage (L3 modules with manifest search):** **3 / 5 = 60%** registered.

---

## 6. Phase 1 matrix targets (planning only)

| Target | From | To |
|--------|------|-----|
| Register calendar provider | N | C |
| Register todo provider | N | C |
| Register notes provider | N | C |
| Extract orchestrator service | P | C |
| PE on `POST /api/search` | N | C |
| Tenant context on request | N | C |
| Dynamic provider registry | P | C |
| Honest suggestions | S | C or remove |

---

**Last updated:** 2026-06-23
