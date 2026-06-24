# Unified Search — Gap Analysis

**Program:** Unified Search Capability — Phase 1A  
**Date:** 2026-06-23  
**Status:** Updated — see [UNIFIED_SEARCH_PHASE_1A_CLOSEOUT.md](./UNIFIED_SEARCH_PHASE_1A_CLOSEOUT.md)

---

## 1. Gap summary

| Category | Critical | High | Medium | Low |
|----------|:--------:|:----:|:------:|:---:|
| Provider / federation | 1 | 2 | 2 | 0 |
| Platform capability | 0 | 3 | 2 | 0 |
| Security / trust | 0 | 1 | 3 | 0 |
| Performance / scale | 0 | 0 | 2 | 2 |
| UX / product | 0 | 1 | 2 | 1 |
| **Total** | **1** | **7** | **11** | **3** |

---

## 2. Architectural blockers (global search honesty)

| ID | Gap | Impact | Phase 1 action |
|----|-----|--------|----------------|
| **US-GAP-01** | Calendar/Todo manifest `search: true` but no global provider | User expectation violation | ✅ Phase 1A — providers registered |
| **US-GAP-02** | No Platform Search Capability service boundary | Cannot certify; PE gap | ✅ Phase 1A — `searchCapabilityService` |
| **US-GAP-03** | No `search:read` PE action | Authorization inconsistency | ✅ Phase 1A — PE + dual |
| **US-GAP-04** | Global API lacks tenant context | Wrong hits in business workspace | ✅ Phase 1A — `filters.context` |
| **US-GAP-05** | No operation matrix CI | Regression risk | **Partial** — tests exist; CI gate Phase 2 |

---

## 3. Missing indexes / infrastructure

| ID | Gap | Notes |
|----|-----|-------|
| **US-IDX-01** | No production search index | By ADR — optional derived index |
| **US-IDX-02** | `search_index_stub` non-functional | Gated; logs only |
| **US-IDX-03** | No PostgreSQL FTS / vector layer | Prisma substring ceiling |
| **US-IDX-04** | Tag index not wired to orchestrator | US-GAP-09 |

**Verdict:** Central index is **not** a Phase 0A blocker; federation gaps are.

---

## 4. Missing metadata / registration

| ID | Gap |
|----|-----|
| **US-REG-01** | Dynamic provider registration from manifests |
| **US-REG-02** | Platform entity type alignment on `SearchResult.type` |
| **US-REG-03** | Notes/Notebook not in capability map |
| **US-REG-04** | HR/Scheduling/Workforce entities absent |
| **US-REG-05** | Marketplace module provider loader |

---

## 5. Security concerns

| ID | Concern | Severity |
|----|---------|----------|
| **US-SEC-01** | Dashboard search uses owner-only Prisma — may miss shared dashboards | Medium |
| **US-SEC-02** | Member search duplicate paths (member API vs provider) | Low |
| **US-SEC-03** | No orchestrator-level audit event for search | Medium |
| **US-SEC-04** | Place listing search is catalog-wide — correct but needs PE documentation | Low |
| **US-SEC-05** | AI retrieval paths separate — could leak broader context than search UX | Medium |

---

## 6. Performance concerns

| ID | Concern |
|----|---------|
| **US-PERF-01** | Sequential provider calls — latency additive |
| **US-PERF-02** | `contains` scans on large tables (messages, tasks) |
| **US-PERF-03** | No caching layer (Memory Bank aspirational) |
| **US-PERF-04** | No per-provider timeout |

---

## 7. What prevents true global search today

1. **Incomplete provider registry** — majority of L3 modules not federated  
2. **No platform capability ownership** — search is a controller, not a certified surface  
3. **Tenant context gap** — global query is user-scoped only  
4. **No unified ranking/pagination contract**  
5. **Tag and relationship search concepts not exposed in UX** (documented but not shipped)  
6. **No certification / matrix enforcement** — drift already present  

---

## 8. Retire vs keep

| Item | Recommendation |
|------|----------------|
| Federated provider model | **Keep** |
| `searchController` monolith | **Refactor** → capability service |
| Placeholder suggestions | **Retire** or implement honestly |
| `search_index_stub` | **Keep gated** until Phase 2+ charter |
| Memory Bank `indexContent()` provider method | **Defer** — not implemented |
| Inline dashboard search | **Replace** with visibility service |

---

## 9. Phase 1 gap closure priority

| Priority | Gap IDs |
|----------|---------|
| P0 | US-GAP-01, US-GAP-02, US-GAP-03 |
| P1 | US-GAP-04, US-GAP-05, US-REG-01, US-GAP-09 (tag wire) |
| P2 | US-PERF-01, US-SEC-03, Notes/HR provider planning |
| P3 | US-IDX-* (derived index charter) |

---

**Last updated:** 2026-06-23
