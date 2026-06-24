# Unified Search — Architecture Audit

**Program:** Unified Search Capability — Phase 1A  
**Date:** 2026-06-23  
**Status:** Updated post–Phase 1A  
**Date:** 2026-06-23  
**Status:** Architecture audit — discovery only

**Cross-reference:** [RELATIONSHIP_SEARCH_ARCHITECTURE.md](../architecture/RELATIONSHIP_SEARCH_ARCHITECTURE.md), [SEARCH_PROVIDER_MODEL.md](../architecture/SEARCH_PROVIDER_MODEL.md), [SEARCH_PERMISSION_MODEL.md](../architecture/SEARCH_PERMISSION_MODEL.md)

---

## 1. Audit scope

Evaluate current search architecture against:

- Platform Capability (not module feature) framing
- Constitutional relationship framework (Phase 2B)
- Post–Platform Kernel L2 honesty baseline
- Multi-tenant isolation and PE expectations

---

## 2. Current architecture (as-built)

```
┌─────────────────────────────────────────────────────────────┐
│  Web: GlobalSearchBar / GlobalSearchContext                 │
│       POST /api/search  (web/src/api/search.ts)             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  searchController.globalSearch                                │
│  • JWT auth only (no PE)                                      │
│  • Hardcoded SearchProvider[] (6)                             │
│  • Sequential await per provider                              │
│  • Merge + sort by relevanceScore                             │
└─────┬──────┬──────┬──────┬──────┬──────┬──────────────────────┘
      │      │      │      │      │      │
   drive  chat  dash  member place  vlink
      │      │      │      │      │
      ▼      ▼      ▼      ▼      ▼
 visibility services / inline Prisma / vlinkService
      │      │                    │
      ▼      ▼                    ▼
   File/Folder  Message/Conv   Listing/VLink rows
```

### Parallel paths (not unified UX)

| Path | Consumers |
|------|-----------|
| Module-local APIs | Calendar event search, Todo list search, Notes filter |
| AI grounding | `pipelineGroundingRetrieval` → context providers |
| Tag facet | `tagIndexService` → Context Graph |
| Admin operator | `adminUserService` filters |

---

## 3. Constitutional alignment

| Principle | ADR / doc | As-built | Verdict |
|-----------|-----------|----------|---------|
| Federated orchestration | SEARCH_ADR | `searchController` fan-out | ✅ Aligned |
| No universal relationship DB | Federation contract | No edge table in search | ✅ Aligned |
| Module SoR for entities | Provider model | Drive/Chat/Place delegate | ✅ Aligned |
| Visibility before hit | SEARCH_PERMISSION_MODEL | Drive/Chat/Place yes; Dashboard/Member partial | ⚠️ Partial |
| Fail-closed | SEARCH_PERMISSION_MODEL | Provider-level; no orchestrator re-check | ⚠️ Partial |
| Manifest `capabilities.search` | Provider model | Not enforced | ❌ Drift |
| Trash excluded | Provider model | Chat/Drive yes | ✅ Mostly |
| Tenant scope on every hop | api-and-auth | Global API lacks explicit tenant filters | ❌ Gap |

---

## 4. Layer audit

### 4.1 API layer

| Check | Status | Notes |
|-------|--------|-------|
| Thin controller | ⚠️ | Business logic + providers in one file |
| Standard proxy | ✅ | Next.js `/api/search` proxy |
| Typed contracts | ✅ | `shared/types/search.ts` |
| Query validation | ✅ | Min 2 chars |
| PE gate | ✅ | `search:read` at orchestrator entry |
| Service boundary | ✅ | `searchCapabilityService` + `searchProviderRegistry` |

### 4.2 Service layer

| Check | Status | Notes |
|-------|--------|-------|
| Dedicated capability service | ❌ | Monolithic controller |
| Provider registry service | ❌ | Static array |
| Visibility delegation | ✅ Partial | Best on Drive/Chat/Place |
| Cross-module Prisma ban | ⚠️ | Dashboard/Member inline |

### 4.3 Data layer

| Check | Status | Notes |
|-------|--------|-------|
| Full-text search engine | ❌ | Prisma `contains` only |
| Derived search index | ❌ | Stub subscriber only |
| Tag index (derived) | ✅ | Exists; not wired to global |
| Activity index | ❌ | Not a search surface |

### 4.4 UI layer

| Check | Status | Notes |
|-------|--------|-------|
| Global bar in layout | ✅ | `GlobalSearchProvider` |
| Module-grouped results | ✅ | `GlobalSearchBar` |
| Business workspace scoped | ⚠️ | Root layout search |
| Suggestions quality | ❌ | Placeholder |

---

## 5. Integration audit

| Integration | Current | Target (capability) |
|-------------|---------|---------------------|
| **Identity** | `userId` from JWT | + tenant context (dashboard/business/household) |
| **Policy Engine** | Module PE on some reads | Platform `search:read` + provider parity |
| **Platform entities** | Result `type` strings ad hoc | Align with `platformEntityRegistry` |
| **Activity** | Not searchable in global bar | Optional future facet (derived) |
| **V_Link** | Dedicated provider | ✅ Correct separation |
| **AI** | Separate orchestration | Consume same providers / contracts |
| **Realtime** | None for search | Optional suggest refresh |
| **Domain Events** | Stub index consumer | Optional Phase 2+ derived index |
| **Third-party modules** | `SearchProvider` interface exists | No marketplace registry loader |

---

## 6. Architectural strengths

1. **Accepted federated model** — avoids universal DB anti-pattern  
2. **Visibility-owned module queries** — Drive/Chat L3 patterns are reusable  
3. **Shared types** — frontend/backend contract exists  
4. **V_Link separation** — container vs entity search not conflated  
5. **Tag index federation** — precedent for optional derived readers (T4)  
6. **Test hooks** — member visibility + place contract tests  

---

## 7. Architectural weaknesses

1. **Not a Platform Capability** — no owner service, matrix CI, or certification path  
2. **Provider registration gap** — manifest lies for Calendar/Todo  
3. **Orchestrator in controller** — blocks PE, testing, and marketplace registration  
4. **No tenant facet on global API** — business workspace conflation risk  
5. **Latency model** — sequential fan-out without budgets  
6. **Ranking heterogeneity** — per-module heuristics; no normalization  
7. **Suggestions dishonesty** — violates post-kernel trust posture  
8. **Index stub dormant** — ADR allows indexes but no roadmap artifact in repo  

---

## 8. Certification class recommendation

| Class | Fit |
|-------|-----|
| Product module | ❌ Wrong — cross-cutting |
| Platform Capability | ✅ **Correct** — like Analytics, Kernel |
| Infrastructure L3 | ❌ Premature — federation L2 first |

Target: **Platform Unified Search Capability — L2 WITH FINDINGS** (future), after Phase 1 federation completeness.

---

## 9. Audit verdict

| Dimension | Grade |
|-----------|-------|
| Constitutional design (docs) | **A-** |
| Runtime implementation | **C+** |
| Platform Capability readiness | **D+** |
| Reuse potential | **B** |

**Conclusion:** Architecture direction is **sound and already ratified**; implementation is **immature and fragmented**. Phase 1 should **complete federation** before central indexing investment.

---

**Last updated:** 2026-06-23
