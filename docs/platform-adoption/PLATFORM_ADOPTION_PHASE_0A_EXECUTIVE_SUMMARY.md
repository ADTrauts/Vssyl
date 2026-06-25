# Platform Adoption Program — Phase 0A Executive Summary

**Program:** Platform Capability Adoption Assessment  
**Date:** 2026-06-25  
**Status:** Discovery only — **no implementation, no certification changes, no module rewrites**

**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md); certified platform capabilities in [REFERENCE_MODULE_CATALOG.md](../architecture/REFERENCE_MODULE_CATALOG.md); [PLATFORM_PORTFOLIO_REFRESH_2026.md](../platform-portfolio/PLATFORM_PORTFOLIO_REFRESH_2026.md)

**Sibling deliverables:** [PLATFORM_ADOPTION_REALITY_ASSESSMENT.md](./PLATFORM_ADOPTION_REALITY_ASSESSMENT.md) · [PLATFORM_ADOPTION_MATRIX.md](./PLATFORM_ADOPTION_MATRIX.md) · [PLATFORM_ADOPTION_SCORECARD.md](./PLATFORM_ADOPTION_SCORECARD.md) · [MODULE_PLATFORM_PARTICIPATION_REVIEW.md](./MODULE_PLATFORM_PARTICIPATION_REVIEW.md) · [PLATFORM_ADOPTION_OPPORTUNITY_REGISTER.md](./PLATFORM_ADOPTION_OPPORTUNITY_REGISTER.md) · [PLATFORM_ADOPTION_WAVE_PLAN.md](./PLATFORM_ADOPTION_WAVE_PLAN.md)

---

## 1. Strategic question

Vssyl has crossed a platform inflection point. Six foundational capabilities are certified:

- Platform Kernel (activity + domain events)
- Unified Search
- AI Retrieval
- Context Graph
- Marketplace Partner Runtime
- Platform Controller

The next maturity stage is not building more platform infrastructure. It is ensuring **every first-party module behaves like a native citizen** of that platform.

This assessment answers: **"How well does each module participate in everything the platform already provides?"**

---

## 2. Executive findings

### 2.1 Portfolio posture

| Metric | Value |
|--------|-------|
| **Modules evaluated** | **22** first-party surfaces (12 built-in product modules + 6 business-only + 4 platform shells/widgets) |
| **Level A — Fully Platform Native** | **1** (File Hub) |
| **Level B — Strong Adoption** | **7** (Chat, Calendar, Todo, Place, V_Link, Notifications utility, AI workspace) |
| **Level C — Partial Adoption** | **9** (Notebook, Dashboard, HR, Scheduling, Workforce Comms, Business Workspace shell, Business Administration, Notes legacy, Activity Feed widget) |
| **Level D — Minimal Adoption** | **4** (Analytics surface, Members, Quick Stats, Quick Notes) |
| **Level E — Legacy / Siloed** | **1** (Bookmarks widget) |

**Weighted portfolio adoption score: 68 / 100** — strong at the certified module core, uneven at business operations edges and dashboard-hosted widgets.

### 2.2 User-visible gap (the story that matters)

From a user's perspective, the platform **feels fragmented** in four places:

1. **Global search finds files and messages but not shifts, HR records, or workforce announcements** — workforce modules are invisible in the omnibar.
2. **The activity feed and AI twin still read legacy tables** — recent actions in Chat may appear in-module but not reliably in the cross-module feed or AI memory.
3. **Business workspace modules work in isolation** — HR, Scheduling, and Workforce Comms do not surface in search, retrieval discovery, or unified activity the way File Hub and Chat do.
4. **Dashboard widgets (Quick Stats, Quick Notes, Bookmarks) are siloed** — they do not participate in search, V_Link, or activity even though users treat them as part of the workspace.

### 2.3 Highest-value adoption opportunities (ranked)

| Rank | Opportunity | Modules affected | User impact |
|------|-------------|------------------|-------------|
| **1** | Wire activity feed + AI reads to Platform Kernel (ACT-R1) | All modules (read path) | Cross-module timeline and AI memory become trustworthy |
| **2** | Add search providers for BO modules | HR, Scheduling, Workforce Comms | One search bar finds shifts, time-off, announcements |
| **3** | AI Retrieval search delegate for query-driven discovery | Drive, Todo, Calendar, HR, Scheduling | AI answers "find my…" with live search, not static lists |
| **4** | Notebook manifest + search + V_Link parity | Notebook, Notes | Meeting workspace links appear in graph and search |
| **5** | Platform Controller per-module adoption cards | All built-ins | Operators see adoption gaps without code archaeology |
| **6** | Dashboard widget platform participation | Quick Stats, Quick Notes, Activity Feed | Home screen becomes a true platform hub |
| **7** | Members module identity consolidation | Members, Account Platform | People search and org context unify |

---

## 3. Capability adoption summary

| Platform capability | Portfolio adoption | Weakest modules |
|---------------------|-------------------|-----------------|
| **Platform Kernel** | **Partial** — writes strong, reads legacy | Activity Feed, Analytics personal path, AI context engines |
| **Unified Search** | **Partial** — 9/12 built-ins with providers | HR, Scheduling, Workforce Comms, Notebook |
| **AI Retrieval** | **Partial** — providers exist; discovery unwired | All modules using list-only providers |
| **Context Graph** | **Partial** — 8 adapters; Notes/Notebook gaps | Notes, Notebook, Chat threads |
| **Marketplace Compatibility** | **N/A built-ins** / manifest honest | Built-ins not partner-delegate tested; Notebook manifest thin |
| **Platform Controller** | **Partial** — governance for modules; no adoption dashboard | No per-module adoption visibility |
| **Policy Engine** | **Strong** — dual wrappers on L3+ modules | Widgets, Bookmarks, legacy shortcuts |
| **Activity System** | **Partial** — 18 activity services; uneven write coverage | HR audit-only paths; feed reads legacy |
| **Notifications** | **Strong** — manifest metadata + emitters on L3 modules | Planned types unimplemented (drive folder variants) |
| **Realtime** | **Partial** — Chat, Drive, Calendar, Place strong | HR, Scheduling, Notebook, Dashboard |
| **AI Integration** | **Strong** — all major modules register `ModuleAIContext` | Retrieval quality varies (Prisma-direct vs visibility) |
| **V_Link** | **Partial** — 10 modules with access services | Notes dedicated service gap; Notebook no graph adapter |
| **Business / Personal scope** | **Strong** — tenant scoping on SoR paths | Analytics redirect-only business surface |

---

## 4. Recommended adoption waves (summary)

| Wave | Theme | Duration estimate | User-visible outcome |
|------|-------|-------------------|----------------------|
| **Wave 1** | **Trust the timeline** — kernel read migration | 4–6 weeks | Activity feed and AI show the same events users see in modules |
| **Wave 2** | **Search everywhere** — BO module providers + notebook | 3–4 weeks | Global search finds workforce and notebook content |
| **Wave 3** | **Smarter AI discovery** — retrieval search delegate | 4–5 weeks | AI finds entities by query, not pre-canned lists |
| **Wave 4** | **Home screen native** — dashboard widgets + graph gaps | 3–4 weeks | Dashboard feels connected to the rest of the platform |
| **Wave 5** | **Operator visibility** — Platform Controller adoption cards | 2–3 weeks | Admins see adoption health per module |

Full wave plan: [PLATFORM_ADOPTION_WAVE_PLAN.md](./PLATFORM_ADOPTION_WAVE_PLAN.md)

---

## 5. What this assessment is not

- **Not module certification** — adoption levels (A–E) are distinct from L1–L4 certification.
- **Not a platform build program** — no new capabilities authorized.
- **Not a marketplace change** — built-in modules evaluated for first-party participation; partner runtime assessed only where manifests apply.

---

## 6. Success criteria check

| Criterion | Met |
|-----------|-----|
| Every major module evaluated | ✅ 22 surfaces |
| Platform participation quantified | ✅ Matrix + scorecard |
| Missing integrations identified | ✅ Opportunity register |
| High-value opportunities ranked | ✅ §2.3 + register |
| Implementation roadmap exists | ✅ Wave plan |
| User-perspective evaluation | ✅ §2.2 user-visible gaps |

---

## 7. Next step

Council review of Phase 0A deliverables. Upon approval, authorize **Wave 1** (Platform Kernel read migration) as the first adoption implementation program — highest cross-module user impact with existing write infrastructure.

**Last updated:** 2026-06-25
