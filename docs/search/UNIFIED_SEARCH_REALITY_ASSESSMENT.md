# Unified Search — Reality Assessment

**Program:** Unified Search Capability — Phase 0A Discovery  
**Date:** 2026-06-23  
**Authority:** Post–Platform Kernel L2 CwF; [PLATFORM_PORTFOLIO_REFRESH_2026_5.md](../platform-portfolio/PLATFORM_PORTFOLIO_REFRESH_2026_5.md)  
**Status:** Discovery only — **no implementation, no certification, no ledger changes**

**Scope:** Platform-wide search inventory and maturity baseline. Implementation, indexing, and certification — **out of scope**.

---

## 1. Executive summary

Vssyl has a **partial federated search foundation** but **no certified Unified Search Platform Capability**.

| Layer | Reality | Maturity |
|-------|---------|----------|
| **Global orchestrator** | `POST /api/search` → `searchController.globalSearch` fans out to **6 providers** | **L2** (module federation) |
| **Central index** | `searchIndexDomainEventSubscriber` — **stub only**, env-gated, not production | **L0** |
| **Module-local search** | Drive, Chat, Calendar, Todo, Notes, Place, Admin, Notifications — Prisma `contains` | **L1–L2** |
| **Constitutional architecture** | Relationship Framework Phase 2B docs — **federated model ratified** | **L3 design / L1 runtime** |
| **Unified Search capability** | No ledger row; manifest `capabilities.search` **not enforced** at registry | **L1** |

**Bottom line:** Search is **not greenfield**. The platform already chose **federated orchestration** (ADR accepted 2026-06-14). Phase 0A finds **~45% reuse** of intended architecture with **critical provider gaps** (Calendar, Todo, Notes, HR, Scheduling, Notebook) and **no platform operation matrix, PE parity, or derived index**.

---

## 2. What search systems exist (inventory)

### Global / platform layer

| System | Route / entry | Implementation | Status |
|--------|---------------|----------------|--------|
| **Global search API** | `POST /api/search` | `searchController.ts` | Production |
| **Search suggestions** | `GET /api/search/suggestions` | Hardcoded strings in controller | Placeholder |
| **Search types contract** | `shared/types/search.ts` | `SearchProvider`, `SearchResult`, `SearchFilters` | Production |
| **Frontend global UI** | `GlobalSearchBar`, `GlobalSearchContext`, `CompactSearchButton` | `web/src/` | Production |
| **Domain event search index** | Subscriber stub | `searchIndexDomainEventSubscriber.ts` | **Not production** (PK-W3-DE-1 gated) |

### Registered global providers (6)

| `moduleId` | Delegates to | Entity types |
|------------|--------------|--------------|
| `drive` | `driveVisibilityService` | files, folders |
| `chat` | `chatVisibilityService.searchAccessibleChat` | messages, conversations |
| `dashboard` | Inline Prisma on `Dashboard` | dashboards (owner-only) |
| `member` | Inline Prisma + org/connection visibility | users |
| `place` | `placeVisibilityService.searchListingsForUser` | business listings |
| `vlink` | `vlinkService.searchVLinksForUser` | V_Link containers |

### Module-local search (not in global registry)

| Module | API / surface | Service | Method |
|--------|---------------|---------|--------|
| **Calendar** | `GET /api/calendar/events/search` | `calendarVisibilityService.searchEvents` | Prisma `contains` + calendar access |
| **Todo** | Task list filters | `todoVisibilityService` (`search` param) | Prisma `contains` + PE |
| **Notes** | Notes list API | `notesVisibilityService` | Prisma `contains` |
| **Place (local)** | Listings browse, user search | `placeVisibilityService` | Catalog + user lookup |
| **Chat (local)** | Invite user search | `chatUserSearchService` | Scoped user lookup |
| **Member** | `GET /api/member/search` | `memberController.searchUsers` | Platform member discovery |
| **Admin Portal** | User/business admin lists | `adminUserService`, `adminImpersonationService` | Operator-scoped `contains` |
| **Notifications** | Notification list | `notificationController` | Title/body `contains` |
| **Activity / logs** | Admin log viewer | `logController` | Log text filter |
| **Drive (local UI)** | `DriveSearch.tsx` | Module-scoped file search callback | Separate from global bar |

### AI / retrieval (parallel discovery path)

| System | Purpose | Not global search |
|--------|---------|-------------------|
| `pipelineGroundingRetrieval` | AI context orchestration | Module providers + V_Link + graph bundle |
| `ContextProviderOrchestrator` | Module AI context | Read-only bounded sets |
| `searchTasksForAI` | Todo AI context | Module-scoped |
| `SemanticSimilarityEngine` | AI internal | Not user search |
| `IntelligentRecommendationsEngine` | Recommendations | Not federated search |

### Context Graph / tags (discovery adjunct)

| System | Purpose |
|--------|---------|
| `tagIndexService` | Federated **tag facet** lookup across Todo, Notes, Place providers |
| `contextGraphController` | Graph bundle reads — not full-text search |

### Manifest-declared `capabilities.search: true`

Drive, Chat, Calendar, Todo, Place — **five modules**. Notes/Notebook declare `supportsSearch` on entities but **not** top-level `capabilities.search`. HR, Scheduling, Workforce, Dashboard — **no** global search capability flag.

---

## 3. How implementations work (patterns)

| Pattern | Usage | Full-text | Ranking | Security |
|---------|-------|-----------|---------|----------|
| **Prisma `contains` + `insensitive`** | All production search | No PostgreSQL FTS | `calculateRelevanceScore` string heuristics | Module visibility services (Drive, Chat, Place); inline where (Member, Dashboard) |
| **Sequential provider fan-out** | Global search | N/A | Merge sort by `relevanceScore` | Per-provider; **no PE on orchestrator** |
| **Take limits** | 5–10 per provider | — | — | Implicit cap |
| **Min query length** | Global: 2 chars | — | — | 401 without auth |

**No** unified pagination contract. **No** shared search index table. **No** `@@fulltext` or `tsvector` in server code.

---

## 4. Platform search foundation assessment

| Foundation element | Exists? | Location | Gap |
|--------------------|---------|----------|-----|
| Shared `SearchProvider` interface | ✅ | `shared/types/search.ts` | Not registry-driven; hardcoded array |
| Orchestrator | ✅ | `searchController.globalSearch` | Monolithic; not a service |
| Visibility delegation | ✅ Partial | Drive, Chat, Place | Dashboard/Member inline Prisma |
| Derived index subscriber | ⚠️ Stub | DE subscriber | Not production |
| Tag facet federation | ✅ | `tagIndexService` | Not wired to global search |
| Manifest enforcement | ❌ | `builtInModuleManifests.ts` | Claims ≠ registry |
| Operation matrix | ❌ | — | No platform search matrix |
| PE `search:read` | ❌ | — | Auth JWT only on `/api/search` |
| Certification | ❌ | Ledger | **Unaudited** |

---

## 5. Search maturity by module (0–5 scale)

| Module / surface | Level | Rationale |
|------------------|------:|-----------|
| **Drive / File Hub** | **4** | Global provider + visibility service + local UI; FH-4 compliant |
| **Chat** | **4** | Global provider + participant scope + PE on reads |
| **Place** | **3** | Global provider + module-local catalog; PE on listing read |
| **V_Link** | **3** | Platform provider; membership-scoped |
| **Calendar** | **2** | Module search API only; **not** in global registry |
| **Todo** | **2** | Module list search + AI helper; **not** global |
| **Notes / Notebook** | **2** | Module filter only; entity `supportsSearch` |
| **Member / identity** | **2** | Global provider; connection/org visibility |
| **Dashboard** | **2** | Global provider; owner-only Prisma |
| **Admin Portal** | **1** | Operator list filters only |
| **HR** | **0–1** | No search APIs |
| **Scheduling** | **0** | No search |
| **Workforce Communications** | **0** | No search |
| **Notifications** | **1** | In-module list filter |
| **Activity / Platform Activity** | **0–1** | Admin log filter; not user discovery |
| **AI retrieval** | **2** | Parallel orchestration; not unified UX |
| **Platform orchestrator** | **2** | Federation without completeness or PE |
| **Unified Search (capability)** | **1.5** | Design L3 / runtime L1–L2 |

**Scale:** 0 = none · 1 = basic filter · 2 = module search · 3 = cross-entity in module · 4 = platform-search-ready provider · 5 = unified certified

---

## 6. Major findings

| ID | Finding | Severity |
|----|---------|----------|
| **US-F01** | **Provider gap** — Calendar, Todo, Notes certified modules with `capabilities.search` missing from global registry | **Critical** |
| **US-F02** | **Manifest drift** — `capabilities.search: true` not coupled to provider registration | **High** |
| **US-F03** | **No platform capability** — search is code + ADRs, not owned Platform Capability with matrix/PE | **High** |
| **US-F04** | **Stub suggestions** — `getSuggestions` returns fake query strings | **Medium** |
| **US-F05** | **Sequential fan-out** — no timeout/circuit breaker; latency stacks | **Medium** |
| **US-F06** | **No central index** — stub subscriber only; ADR allows optional derived indexes | **Low** (by design) |
| **US-F07** | **Prisma substring only** — scale/quality ceiling for large tenants | **Medium** |
| **US-F08** | **Dashboard provider** — bypasses dashboard visibility service | **Medium** |
| **US-F09** | **Tag index not integrated** — Context Graph tag federation unused by global bar | **Medium** |
| **US-F10** | **Business workspace** — uses root `GlobalSearchProvider`; not tenant-context enriched | **Medium** |

---

## 7. What can be reused

| Asset | Reuse |
|-------|-------|
| `SearchProvider` / `SearchResult` types | Keep — extend with tenant context |
| Federated orchestration pattern | Keep — extract to `searchCapabilityService` |
| Module visibility search functions | Keep — register missing providers |
| Relationship Framework 2B docs | Keep — constitutional north star |
| `tagIndexService` | Wire as optional T4 facet reader |
| Global UI (`GlobalSearchBar`) | Keep — improve suggestions/honest empty states |
| Integration tests | Extend (`search-member-visibility`, `place.contract`) |

---

## 8. What should be retired or gated

| Item | Action |
|------|--------|
| Hardcoded suggestion strings | Retire — replace with history or honest empty |
| Inline dashboard Prisma in controller | Retire — delegate to dashboard visibility |
| `search_index_stub` production expectation | Already gated — document as Phase 2+ optional |
| Memory Bank `indexContent()` on providers | Aspirational — not implemented; archive or Phase 2 |

---

## 9. Strategic architecture preview

**Recommendation: Option C — Hybrid** (federated providers + optional derived read indexes)

Aligns with [SEARCH_ARCHITECTURE_DECISION_RECORD.md](../architecture/SEARCH_ARCHITECTURE_DECISION_RECORD.md). See [UNIFIED_SEARCH_STRATEGIC_POSITIONING.md](./UNIFIED_SEARCH_STRATEGIC_POSITIONING.md).

---

## 10. Phase 1 readiness

| Gate | Ready? |
|------|--------|
| Discovery complete | ✅ This assessment |
| Constitutional model | ✅ Phase 2B ADRs |
| Provider inventory | ✅ |
| Platform Capability charter | ⏳ Phase 0B / Phase 1 planning |
| Engineering ACT | ❌ Not authorized |

---

**Last updated:** 2026-06-23
