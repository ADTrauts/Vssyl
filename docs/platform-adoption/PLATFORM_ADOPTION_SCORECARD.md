# Platform Adoption Scorecard

**Program:** Platform Capability Adoption — Phase 0A  
**Date:** 2026-06-25  
**Status:** Assessment baseline — **updated post Wave 5** ([closeout](./PLATFORM_ADOPTION_WAVE5_CLOSEOUT.md))

**Important:** Adoption levels **A–E** are **not** certification levels L1–L4. A module can be L3 certified and Level C adoption.

---

## 1. Adoption level definitions

| Level | Name | Definition | Typical score range |
|-------|------|------------|---------------------|
| **A** | Fully Platform Native | Participates in all applicable capabilities at Full depth; reference patterns for other modules | 90–100 |
| **B** | Strong Adoption | Core capabilities adopted; gaps are P2 enhancements not user-visible blockers | 75–89 |
| **C** | Partial Adoption | Works as product module; missing ≥2 major platform surfaces (search, kernel reads, retrieval discovery) | 55–74 |
| **D** | Minimal Adoption | Isolated functionality; ≤50% applicable capabilities; widget or redirect-only | 35–54 |
| **E** | Legacy / Siloed | No meaningful platform participation; local state only | 0–34 |

### Scoring methodology

**Applicable capabilities** (max 12 per module):

1. Platform Kernel  
2. Unified Search  
3. AI Retrieval  
4. Context Graph  
5. Marketplace Compatibility (manifest honesty for built-ins)  
6. Platform Controller visibility  
7. Policy Engine  
8. Activity System  
9. Notifications  
10. Realtime  
11. AI Integration  
12. V_Link  

**Points:** Full = 10 · Partial = 5 · Missing = 0 · N/A excluded from denominator

**Formula:** `score = (earned / (applicable × 10)) × 100` → mapped to level

---

## 2. Module scorecard

| Rank | Module / Surface | Score | Level | Certification (ref) | Top gap |
|------|------------------|-------|-------|---------------------|---------|
| 1 | **Drive (File Hub)** | **94** | **A** | L4 Reference | Kernel read migration (platform-wide) |
| 2 | **Chat** | **86** | **B** | L3 | Context graph threads; retrieval delegate |
| 3 | **Calendar** | **85** | **B** | L3 | Kernel reads; retrieval delegate |
| 4 | **Todo** | **84** | **B** | L3 | Retrieval delegate; realtime depth |
| 5 | **Place** | **82** | **B** | L3 | AI retrieval grounding partial |
| 6 | **V_Link** | **78** | **B** | Substrate | Not a data module; local activity table |
| 7 | **Notifications** (utility) | **76** | **B** | UX Ref #2 | Not a SoR; no search/graph |
| 8 | **AI** (workspace) | **82** | **B** | Platform L2 | Widget/shell consumption gaps |
| 9 | **Notebook** | **76** | **B** | L3 | Graph adapter; notifications manifest |
| 10 | **HR** | **75** | **B** | L3 CwF | Kernel reads; Prisma AI list providers |
| 11 | **Scheduling** | **74** | **B** | L3 CwF | Kernel reads; limited realtime |
| 12 | **Workforce Comms** | **72** | **B** | L3 CwF | No realtime |
| 13 | **Dashboard** | **72** | **B** | L3 CwF | quickstats not searchable |
| 14 | **Notes** (legacy) | **62** | **C** | L2 | V_Link service gap; UI disabled |
| 15 | **Business Administration** | **58** | **C** | L3 #OC | No search; no workspace module |
| 16 | **Business Workspace** (shell) | **57** | **C** | WS-L3 | Shell routes only; no intelligence |
| 17 | **Activity Feed** (widget) | **58** | **C** | None | Kernel read via API |
| 18 | **Quick Notes** (widget) | **58** | **C** | None | No notifications |
| 19 | **Bookmarks** (widget) | **52** | **C** | None | External URLs only |
| 20 | **Analytics** (surface) | **41** | **D** | Capability L2 | Redirect-only product surface |
| 21 | **Members** | **40** | **D** | Account PP-1 | Search-only participation |
| 22 | **Quick Stats** (widget) | **38** | **D** | None | Analytics bridge only |

---

## 3. Portfolio aggregates

| Aggregate | Value |
|-----------|-------|
| **Mean adoption score** | **68.1** |
| **Weighted mean** (by user traffic estimate) | **~86** |
| **Median** | **69.0** |
| **Modules ≥ Level B** | **13 / 22** (59%) |
| **Modules ≤ Level D** | **4 / 22** (18%) |
| **Modules ≤ Level E** | **0 / 22** (0%) |
| **Business-only modules ≥ Level B** | **3 / 5** (60%) |

### By module category

| Category | Avg score | Level distribution |
|----------|-----------|-------------------|
| Certified product core (Drive, Chat, Calendar, Todo, Place) | **86.2** | 1A, 4B |
| Business operations (HR, Scheduling, Workforce) | **73.7** | 3B |
| Composition / shell (Dashboard, Notebook, Business Workspace) | **71.3** | 2B, 1C |
| Widgets (Activity Feed, Quick Stats, Quick Notes, Bookmarks) | **49.5** | 2C, 2D |
| Platform utilities (V_Link, Notifications, AI) | **76.3** | 3B |

---

## 4. Capability adoption rates (portfolio-wide)

Percentage of **applicable** module-capability pairs at **Full**:

| Capability | Full rate | Partial rate | Missing rate |
|------------|-----------|--------------|--------------|
| Biz/Personal scope | **91%** | 9% | 0% |
| Policy Engine | **64%** | 36% | 0% |
| AI Integration | **64%** | 18% | 18% |
| Activity System | **50%** | 32% | 18% |
| V_Link | **45%** | 27% | 23% |
| Notifications | **41%** | 14% | 45% |
| Context Graph | **45%** | 36% | 18% |
| Unified Search | **64%** | 9% | 27% |
| Realtime | **23%** | 18% | 59% |
| AI Retrieval | **50%** | 32% | 18% |
| Platform Kernel | **55%** | 41% | 4% |
| Platform Controller | **82%** | 18% | 0% |
| Marketplace compat. | **0%** | 27% | 0% (73% N/A) |

**Weakest portfolio dimensions:** Realtime depth, legacy Notes/Analytics participation.

**Wave 5 uplift:** Platform Controller operator visibility — adoption dashboard + per-module cards + CI validation.

---

## 5. Adoption level actions (not certification actions)

| Level | Recommended response |
|-------|---------------------|
| **A** | Maintain; use as reference for adoption patterns; document in Platform Controller |
| **B** | Targeted P2 gaps — retrieval delegate, graph completeness |
| **C** | **Adoption program candidate** — assign wave; search + kernel participation |
| **D** | Merge into parent surface (widget → Dashboard) or minimum viable adoption package |
| **E** | Deprecate, merge, or explicit "local-only" product decision |

---

## 6. Scorecard vs certification matrix

|  | L4 | L3 | L2 | L1 | None |
|--|----|----|----|----|------|
| **A** | File Hub | — | — | — | — |
| **B** | — | Chat, Calendar, Todo, Place, Notebook, HR, Sched, WC, Dashboard | — | Notifications†, AI† |
| **C** | — | Notes | Quick Notes, Bookmarks, Activity Feed | Business Admin†, Biz Workspace† |
| **D** | — | — | — | Analytics†, Members†, Quick Stats† |
| **E** | — | — | — | — | — |

† Not architecture certification slots — platform surfaces or widgets  
‡ Dashboard L3 CwF is composition certification

**Divergence hotspots:** Composition widgets were **Level E** pre-Wave 4 — **Wave 4 adopted** search + kernel activity via dashboard module without widget-specific pipelines.

**Last updated:** 2026-06-25
