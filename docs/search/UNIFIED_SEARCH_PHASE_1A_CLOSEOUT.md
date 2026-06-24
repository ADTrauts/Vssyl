# Unified Search — Phase 1A Closeout

**Program:** Unified Search Capability — Phase 1A  
**Date:** 2026-06-23  
**Status:** **Complete** — capability service extraction + provider truth pass

---

## 1. Summary

Phase 1A establishes Unified Search as a **platform capability foundation** without central indexing, semantic search, AI retrieval integration, or marketplace SDK work.

| Deliverable | Status |
|-------------|--------|
| `searchCapabilityService` orchestration | ✅ |
| Thin `searchController` | ✅ |
| `RegisteredSearchProvider` contract | ✅ |
| `searchProviderRegistry` (9 providers) | ✅ |
| Calendar / Todo / Notes global providers | ✅ |
| `search:read` Policy Engine gate | ✅ |
| Tenant `filters.context` (backward-compatible) | ✅ |
| Manifest drift corrections | ✅ |
| Tests | ✅ |

---

## 2. Architecture (as-built)

```
POST /api/search
  → searchController.globalSearch (thin)
  → searchCapabilityService.executeGlobalSearch
      → evaluateSearchPolicyDual (search:read)
      → searchProviderRegistry (fan-out)
      → merge + relevance sort
```

**New / moved files:**

| Path | Role |
|------|------|
| `server/src/services/searchCapabilityService.ts` | Orchestration + suggestions |
| `server/src/services/search/searchProviderRegistry.ts` | Provider registry + delegates |
| `server/src/services/search/searchRelevance.ts` | Shared relevance scoring |
| `server/src/services/search/memberSearchVisibility.ts` | Member visibility builder |
| `server/src/services/search/searchUrlBuilder.ts` | Business workspace deep links |
| `server/src/auth/searchPolicyDual.ts` | PE dual wrapper |
| `shared/src/types/search.ts` | Extended contracts |

---

## 3. Provider registry (Phase 1A)

| Provider | Entity types | Manifest `search` | Readiness |
|----------|--------------|:-----------------:|:---------:|
| drive | file, folder | ✅ | ready |
| chat | message, conversation | ✅ | ready |
| calendar | calendar_event | ✅ | ready |
| todo | task | ✅ | ready |
| notes | note | ✅ | ready |
| place | place_listing | ✅ | ready |
| dashboard | dashboard | ✅ | ready |
| vlink | vlink | ✅ | ready |
| member | user | — (platform) | ready |

**Not registered (honest):** scheduling, hr, workforce_comms, admin — no manifest global search claim.

---

## 4. API contract (unchanged)

### `POST /api/search`

**Request body (backward compatible):**

```json
{
  "query": "meeting notes",
  "filters": {
    "moduleId": "calendar",
    "context": {
      "dashboardId": "dash-uuid",
      "businessId": "biz-uuid",
      "householdId": "hh-uuid"
    },
    "contexts": ["dash-uuid"]
  }
}
```

**Response (unchanged):**

```json
{ "success": true, "results": [ /* SearchResult[] */ ] }
```

`filters.context` and `filters.contexts` are **optional** additive fields.

---

## 5. Policy behavior

| Layer | Action | Behavior |
|-------|--------|----------|
| Orchestrator | `search:read` | Authenticated users allowed; `businessId` / `householdId` require active membership; `dashboardId` requires ownership + tenant alignment |
| Providers | Module read actions | Entity-level PE via visibility services (unchanged) |

Security denies (`NOT_MEMBER`, `TENANT_MISMATCH`, `NOT_OWNER`, `INSUFFICIENT_ROLE`) **block** the global search request.

---

## 6. Findings closed

| ID | Finding | Resolution |
|----|---------|------------|
| **US-F01** | Calendar/Todo not in global search | Registered providers |
| **US-F02** | Manifest drift | `capabilities.search` added for notes, dashboard, vlink; registry parity test |
| **US-F03** | No PE on global search | `search:read` + `searchPolicyDual` |
| Monolithic controller | Orchestration in controller | Extracted to `searchCapabilityService` |
| **US-F10** | No tenant context | `filters.context` + PE scope validation |

---

## 7. Remaining gaps (Phase 1B+)

| ID | Gap | Target phase |
|----|-----|--------------|
| US-GAP-05 | Operation matrix CI in CI pipeline | 1B |
| US-REG-01 | Dynamic manifest-driven registry | 1B |
| US-IDX-04 | Tag index wire-up | 2 |
| US-PERF-01 | Parallel provider fan-out + timeouts | 1B |
| US-G-02 | Honest suggestions (history-backed) | 1B |
| AI retrieval convergence | Shared search delegates | 2 |
| Marketplace provider loader | Partner modules | 2 |

---

## 8. Tests added

| Test file | Coverage |
|-----------|----------|
| `searchCapabilityService.test.ts` | Orchestration, PE denial, module filter |
| `searchPolicyDual.test.ts` | Dual enforcement |
| `searchProviderRegistry.test.ts` | Manifest parity, calendar/todo/notes |
| `notesSearchVisibility.test.ts` | Tenant mismatch isolation |
| `policyEngine.test.ts` (`search:read`) | Business membership |
| `searchController.place.contract.test.ts` | Place delegation (registry) |

---

## 9. Maturity update

| Dimension | Phase 0A | Phase 1A |
|-----------|:--------:|:--------:|
| Overall | 1.5 | **2.5** |
| Orchestrator | 2.0 | **3.0** |
| Provider completeness | 1.5 | **3.5** |
| PE integration | 1.0 | **3.0** |
| Certification readiness | 0.5 | **1.5** |

---

## 10. Acceptance criteria

| # | Criterion | Met |
|---|-----------|:---:|
| 1 | `POST /api/search` still works | ✅ |
| 2 | Controller thin | ✅ |
| 3 | `searchCapabilityService` owns orchestration | ✅ |
| 4 | Provider contract explicit | ✅ |
| 5 | Registry honest | ✅ |
| 6 | Calendar + Todo globally searchable | ✅ |
| 7 | Notes globally searchable | ✅ |
| 8 | `search:read` PE protection | ✅ |
| 9 | Business context does not leak cross-tenant | ✅ |
| 10 | Tests pass | ✅ |
| 11 | Documentation updated | ✅ |

---

**Last updated:** 2026-06-23
