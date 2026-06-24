# Unified Search — Phase 0A Executive Summary

**Program:** Unified Search Capability — Phase 0A Reality Assessment  
**Date:** 2026-06-23  
**Audience:** Product, engineering leadership, architecture council  
**Status:** **Discovery complete** — no implementation, no certification

**Authority:** Post–Platform Kernel L2 CwF; portfolio priority shift to Unified Search ([PLATFORM_MODERNIZATION_PRIORITY_2026_5.md](../platform-portfolio/PLATFORM_MODERNIZATION_PRIORITY_2026_5.md))

---

## Bottom line

Vssyl **already has federated global search** (`POST /api/search`, 6 providers) and **ratified constitutional architecture** (Relationship Framework Phase 2B). It does **not** yet have a **Unified Search Platform Capability** — provider gaps, manifest drift, no PE, and monolithic orchestration block the user promise *"find information anywhere in Vssyl."*

**Recommended architecture:** **Option C — Hybrid** (module federation + optional derived indexes).

**Current unified search maturity:** **1.5 / 5** (design L3, runtime L1–L2).

**Phase 1 should complete federation before central indexing investment.**

---

## Current maturity score

| Dimension | Score (0–5) |
|-----------|------------|
| **Overall Unified Search capability** | **1.5** |
| Global orchestrator | **2.0** |
| Provider completeness (L3 modules) | **1.5** (60% of manifest search modules) |
| Security / PE integration | **1.0** |
| Constitutional doc alignment | **4.0** |
| Derived index / hybrid path | **0.5** |
| Certification readiness | **0.5** |

**Platform Search Readiness (qualitative):**

| Integration | Readiness |
|-------------|-----------|
| Identity | Partial — JWT only |
| Permissions | Partial — module visibility, no PE |
| Platform entities | Low — ad hoc result types |
| Activity | Not integrated |
| V_Link | **Good** |
| AI | Parallel path — not unified |
| Realtime | None |
| Third-party modules | Interface only |

---

## Search systems discovered

| Layer | Count | Notes |
|-------|------:|-------|
| Global providers | **6** | drive, chat, dashboard, member, place, vlink |
| Module-local search APIs | **10+** | Calendar, Todo, Notes, Admin, etc. |
| UI surfaces | **3** | GlobalSearchBar, DriveSearch, module filters |
| Derived readers | **2** | tagIndexService (live), DE search stub (gated) |
| Constitutional docs | **6+** | Phase 2B ADR suite |

---

## Major findings

| ID | Finding |
|----|---------|
| **US-F01** | Calendar + Todo claim `capabilities.search` but lack global providers |
| **US-F02** | Manifest not enforced against provider registry |
| **US-F03** | No Platform Capability ownership (controller-only) |
| **US-F04** | Placeholder suggestions undermine trust |
| **US-F05** | Sequential fan-out latency risk |
| **US-F09** | Tag index federation not wired to global UI |
| **US-F10** | Business workspace lacks tenant-scoped search context |

---

## Architectural risks

| Risk | Tier |
|------|------|
| User trust — incomplete global coverage | **High** |
| Manifest capability lies | **High** |
| No PE on `/api/search` | **High** |
| Prisma substring scale ceiling | **Medium** |
| AI vs search path divergence | **Medium** |
| Premature central index scope creep | **Medium** (governance) |

---

## Recommended architecture

**Option C — Hybrid**

1. **Authoritative:** Module `SearchProvider` + visibility services (extend to Calendar, Todo, Notes, HR roadmap).  
2. **Optional:** Derived indexes — tag facet, event-driven index (post charter), relationship adapters.  
3. **Reject:** Central-only index (Option B) as Phase 1 strategy.

---

## Strategic positioning

| Question | Answer |
|----------|--------|
| Core Platform Capability? | **Yes** |
| Required for future modules? | **Yes** — manifest ⇔ provider |
| AI retrieval dependency? | **Yes** — shared contracts |
| Marketplace dependency? | **Yes** — `SearchProvider` registry |
| Context Graph foundation? | **Yes** — tag + relationship readers |

---

## Implementation roadmap (Phase 1 preview — not authorized)

| # | Package | Outcome |
|---|---------|---------|
| 0B | Capability charter + ownership | Platform Capability class |
| 1A | Extract `searchCapabilityService` | Service boundary |
| 1B | Register Calendar, Todo, Notes providers | Close US-F01 |
| 1C | `search:read` PE + tenant context | Security parity |
| 1D | Operation matrix + HTTP tests | Regression gate |
| 1E | Honest suggestions / history | Trust |
| 2+ | Tag wire + optional DE index charter | Hybrid acceleration |

---

## Deliverable index

| Document | Purpose |
|----------|---------|
| [UNIFIED_SEARCH_REALITY_ASSESSMENT.md](./UNIFIED_SEARCH_REALITY_ASSESSMENT.md) | Master inventory |
| [UNIFIED_SEARCH_OPERATION_MATRIX.md](./UNIFIED_SEARCH_OPERATION_MATRIX.md) | C/P/N matrix |
| [UNIFIED_SEARCH_ARCHITECTURE_AUDIT.md](./UNIFIED_SEARCH_ARCHITECTURE_AUDIT.md) | As-built vs ADR |
| [UNIFIED_SEARCH_CAPABILITY_MAP.md](./UNIFIED_SEARCH_CAPABILITY_MAP.md) | Entity searchability |
| [UNIFIED_SEARCH_GAP_ANALYSIS.md](./UNIFIED_SEARCH_GAP_ANALYSIS.md) | Gap register |
| [UNIFIED_SEARCH_STRATEGIC_POSITIONING.md](./UNIFIED_SEARCH_STRATEGIC_POSITIONING.md) | Option C recommendation |

---

## Phase 0A success criteria

| Criterion | Met? |
|-----------|:----:|
| What search already exists | ✅ |
| What can be reused | ✅ |
| What should be retired | ✅ |
| Central architecture justified | ✅ Hybrid, not central-only |
| Can become certified capability | ✅ After Phase 1 federation |
| Phase 1 roadmap defined | ✅ Preview above |

---

## Stop conditions honored

- No new search features implemented  
- No production code modified  
- No migrations  
- No certification or ledger updates  

---

**Last updated:** 2026-06-23
