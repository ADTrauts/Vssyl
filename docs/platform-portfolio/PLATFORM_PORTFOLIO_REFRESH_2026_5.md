# Platform Portfolio Refresh 2026.5

**Program:** Platform Portfolio Refresh 2026.5  
**Assessment date:** 2026-06-23  
**Authority:** Post-completion of Platform Kernel L2 CwF (21/27), Dashboard Wave 3, Account Platform, and Analytics Capability  
**Status:** Portfolio snapshot — synchronized with ledger execution (Platform Kernel archived)

**Supersedes for prioritization:** [`PLATFORM_PORTFOLIO_REFRESH_2026.md`](./PLATFORM_PORTFOLIO_REFRESH_2026.md) (2026-06-22)

**Constraint:** Governance and discovery only. No runtime code, schemas, routes, tests, UX implementation, modernization packages, or certification execution. **Do not authorize Analytics Phase 2.**

---

## Purpose

Produce a fresh **portfolio-wide constitutional assessment** after the 2026 certification wave closure. Re-rank modernization targets based on **current certified state** — not interim June assumptions — and reassess all remaining platform kernel capabilities.

---

## Executive posture

The platform has crossed a **third certification inflection point**. **Thirteen** major programs are **archived** with ledger execution. The **product module core** is fully L3+ (six plain L3 modules + File Hub L4 + three BO modules CwF + Dashboard CwF). **Eight platform domains** hold L3 rows (Admin Portal, BA, Context Graph, BO, Reference Workspace, Account Platform). **Platform Analytics Capability** and **Platform Kernel** are **L2 WITH FINDINGS**.

The **remaining landscape** clusters into:

1. **Certified-with-findings backlog** — Dashboard, Analytics, **Platform Kernel**, Account Platform, Business Operations, Reference Workspace, Context Graph, Business Administration — advisory remediation only
2. **Uncertified platform infrastructure (L1–L2)** — Platform Scheduler, Manifest governance at **L1**; Policy Engine, V_Link, Global Trash, Notifications, AI Platform at **L2** without platform L3 charter; **Search** and **Realtime** without ledger rows
3. **Explicitly not authorized** — Analytics Phase 2; PK-W4; L3 durability/replay; any reopening of archived certification programs

**Portfolio coverage estimate:** Built-in product modules at L3+ ≈ **100%**; platform domain programs chartered in 2026 wave ≈ **100%** complete; platform kernel at honest L2+ ≈ **~70%** (Kernel L2 CwF; Scheduler/Manifest L1 remain).

---

## A. Certification portfolio (snapshot)

### Certified domains (L3+)

| Category | Domain / surface | Level | Designation | G-score |
|----------|------------------|-------|-------------|---------|
| **Reference Implementation** | File Hub (`drive`) | **L4** | Architecture Reference #1 | 87/100 |
| **Product modules** | Chat, Calendar, Todo, Notebook, Place | **L3** | Reference Modules #2–#5 | — |
| | HR, Scheduling, Workforce Communications | **L3 CwF** | BO Ref Candidates #1, #6, #7 | 24/27 domain |
| | Dashboard | **L3 CwF** | Program archived 2026-06-21 | **24/27** |
| **Sub-domain** | Notes | **L2** | Notebook dependency | — |
| **Platform control plane** | Admin Portal | **L3** | Control Plane Reference CwF | — |
| **Platform subdomain** | Business Administration | **L3** | #OC-1 / #OC-2 / #OC-3 | — |
| **Platform capability** | Context Graph | **L3** | #CG-1 / #CG-2 / #CG-3 CwF | — |
| **Platform domain** | Business Operations | **L3 CwF** | Domain + Ref #1 / #6 / #7 | — |
| **Platform shell** | Reference Workspace | **WS-L3 CwF** | Program #3 | — |
| **Account Platform** | PP-1, PP-2, PP-3, umbrella | **L3 CwF** | #AP-BILL-1 Reference Capability CwF | 24–26/27 |
| **Platform capability** | **Platform Analytics Capability** | **L2 CwF** | Hybrid Domain primary engine | **21/27** |
| **Platform capability** | **Platform Kernel** | **L2 CwF** | Activity + Domain Events · Option C | **21/27** (Activity 22, DE 21) |

### UX certification track (independent)

| UX # | Module | Status |
|------|--------|--------|
| #1–#5 | Drive, Notifications, Todo, AI, Calendar | Approved with Findings |
| #6 | Place (expansion) | Eligible With Findings — **not registered** |

---

## B. Archived programs (do not reopen)

| Program | Outcome | Archive date |
|---------|---------|--------------|
| Admin Portal modernization | L3 CERTIFIED | 2026-06-18 |
| Business Administration | L3 CERTIFIED | 2026-06-18 |
| Context Graph | L3 CERTIFIED | 2026-06-19 |
| Business Operations | L3 WITH FINDINGS | 2026-06-19 |
| Reference Workspace | WS-L3 WITH FINDINGS | 2026-06-19 |
| Account Platform (PP-1, PP-2, PP-3, umbrella) | L3 WITH FINDINGS | 2026-06-20 |
| **Dashboard Wave 3** | **L3 WITH FINDINGS (24/27)** | **2026-06-21** |
| **Analytics Capability** | **L2 WITH FINDINGS (21/27)** | **2026-06-22** |
| **Platform Kernel** | **L2 WITH FINDINGS (21/27)** | **2026-06-23** |
| Notebook initiative | L3 CERTIFIED | 2026-06-02 |
| Place Wave 4B | L3 + Ref #5 | 2026-06-02 |

**Treatment:** Certificate majors and advisories are **module-owner / capability-owner backlog** (90-day plans). No new certification program waves unless separate council charter.

---

## C. Active programs

| Program | Status | Notes |
|---------|--------|-------|
| **Platform Module Modernization Roadmap** | Wave 3 **complete** | No active certification wave |
| **UX Reference #6 Place** | Eligible, not registered | Governance-only prep allowed |
| **Advisory burn-down** | Ongoing backlog | Not portfolio programs |
| **AI Platform L3** | **Deferred** | 52/100 readiness; ROI rank 5/5 |
| **Analytics Phase 2** | **Not authorized** | Event pipeline — separate council gate |
| **Relationship Search Phase 2B** | Planning only | Architecture guidelines exist; no platform audit |

**No active certification programs** for Identity, Settings, Billing, Reference Workspace, Business Operations, Dashboard, Analytics, or **Platform Kernel**.

---

## D. Platform capability reassessment

### Search Capability

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | **L1** (estimated) — architecture ADRs exist; no platform operation matrix |
| **Certification** | **Unaudited** — no ledger row |
| **Implementation** | `searchController` federates 6 providers: drive, chat, dashboard, member, place, vlink |
| **Gaps** | Missing global providers for todo, calendar, notes, notebook, hr, scheduling, workforce_comms; no manifest-driven registration; `search_index_stub` subscriber is placeholder; no PE integration on search reads |
| **Architecture** | [RELATIONSHIP_SEARCH_ARCHITECTURE.md](../architecture/RELATIONSHIP_SEARCH_ARCHITECTURE.md), [SEARCH_PROVIDER_MODEL.md](../architecture/SEARCH_PROVIDER_MODEL.md) — Phase 2B relationship search not started |
| **Risk** | Medium — cross-module findability degrades as L3 module density grows |
| **Cert path** | Platform audit → operation matrix → L2 platform row → L3 charter |

### Realtime Platform

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | **L2** at module level (Chat socket hub); **no platform row** |
| **Certification** | **Unaudited** at platform layer |
| **Implementation** | `chatSocketService` hub; domain events broadcast `platform:domain_event` to actor; module rooms require membership proof |
| **Gaps** | No platform operation matrix; no unified realtime governance doc; cross-module room patterns undocumented at platform tier |
| **Risk** | Medium — tenant leakage risk managed per-module but not platform-certified |
| **Cert path** | Platform audit charter → L2 platform row |

### Domain Events Platform

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | **L2 CwF** (sub-score 21/27 under `platform_kernel`) |
| **Certification** | **Executed** 2026-06-23 (RD-PK-001) |
| **Implementation** | `domainEventBus` in-process; 192 registry types; 7 production subscribers; stubs gated |
| **Gaps** | PK-DE-M4 orphan CI; PK-DE-M3 L3 durability; narrow notification/AI fan-out |
| **Risk** | Low–Medium — certificate finding-track |
| **Cert path** | Finding burn-down; L3 durability separate program |

### Platform Activity Infrastructure

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | **L2 CwF** (sub-score 22/27 under `platform_kernel`) |
| **Certification** | **Executed** 2026-06-23 (RD-PK-001) |
| **Implementation** | `platformActivityQueryService`; ACT-R1 reads closed |
| **Gaps** | PK-ACT-M1 legacy table; PK-ACT-M4 Place/workforce delegate |
| **Risk** | Low–Medium — certificate finding-track |
| **Cert path** | PK-W4 (not authorized) or finding burn-down |

### Policy Engine

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | **L2** |
| **Certification** | Platform L2; no L3 charter |
| **Implementation** | `policyEngine.ts` — write paths on L3 modules; `analyticsPolicyDual` added Phase 1 |
| **Gaps** | Read-path parity incomplete (Place, Todo, Dashboard, member connections); no platform operation matrix CI |
| **Risk** | **High** — authorization inconsistency on reads |
| **Cert path** | Read-path parity charter → **closest L2→L3 platform candidate** |

### AI Platform

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | **L2** |
| **Certification** | L3 **deferred** (52/100) |
| **Implementation** | Centralized learning, predictive, recommendation engines; `AIEventConsumer`; module AI context providers |
| **Gaps** | **B-04 stub executors** — household, business, dashboard, notifications may return fake success; legacy duplication; matrix ~82% C |
| **Risk** | **Critical** — constitutional trust violation |
| **Cert path** | Stub deny policy → readiness re-score >75 → L3 re-evaluation |

### Notifications

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | **L2** service; **UX Ref #2** |
| **Certification** | Service L2; no platform L3 row |
| **Implementation** | `NotificationService`; domain-event subscriber; manifest metadata on L3 modules |
| **Gaps** | Consolidation partial; cross-module notification routing not platform-matrixed |
| **Risk** | Low–Medium |
| **Cert path** | Operation matrix + consolidation → L3 platform row (strong candidate given UX Ref #2) |

### V_Link Platform

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | **L2** |
| **Certification** | #CG-2 Reference Capability; no standalone platform L3 |
| **Implementation** | `vlinkPermissionService`, resolver pipeline, search provider |
| **Gaps** | Resolver expansion partial; platform operation matrix incomplete |
| **Risk** | Low–Medium — L3 modules participate |
| **Cert path** | Resolver expansion + platform matrix → L3 |

### Scheduler Infrastructure

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | **L1** |
| **Certification** | Uncertified |
| **Implementation** | `platformJobRegistry` + `platformCronJobs` (7 jobs); separate `PatternAnalysisScheduler` |
| **Gaps** | §22 inventory incomplete; jobs outside registry (AI pattern analysis); no tier migration plan (transitional → canonical) |
| **Risk** | Medium — background job honesty |
| **Cert path** | Full §22 registry → L2 |

### Module Manifest Infrastructure

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | **L1** |
| **Certification** | Uncertified |
| **Implementation** | `reconcileBuiltInManifest` in `registerBuiltInModules`; manifest JSON on Module records |
| **Gaps** | Capability truth drift (`capabilities.search` not enforced); reconcile-on-startup incomplete for all built-ins; manifest ≠ runtime registration for search/AI |
| **Risk** | Medium — partner and built-in capability claims unreliable |
| **Cert path** | Reconcile completeness + capability enforcement → L2 |

---

## E. Uncertified register

### Product modules

| Domain | Maturity | Notes |
|--------|----------|-------|
| *(none at L1)* | — | All product modules L3+ or L2 sub-domain (Notes) |

### Platform capabilities — no L3 row

| System | Level | Audit? | Cert readiness |
|--------|-------|--------|----------------|
| **Search** | L1 (est.) | Guidelines only | Low — needs platform audit |
| **Realtime** | L2 module / — platform | No | Low |
| **AI Platform** | L2 | L3 readiness (52/100) | **Deferred** |
| **Domain Events** | **L2 CwF** | Kernel program archived | Finding-track |
| **Module Activity** | **L2 CwF** | Kernel program archived | Finding-track |
| **Platform Scheduler** | L1 | Partial (registry code) | Low |
| **Manifest governance** | L1 | Partial | Low |
| **Policy Engine** | L2 | L2 cert review | **Medium-High** |
| **Notifications** | L2 | UX Ref #2 | **Medium-High** |
| **V_Link** | L2 | CG-2 reference | Medium |
| **Global Trash** | L2 | Handler coverage good | Medium |
| **Marketplace / partners** | — | Rulebook only | Not assessed |

---

## F. Strategic priority assessment

| Lens | Top item | Rationale |
|------|----------|-----------|
| **Highest platform risk** | **AI stub executors** | Constitutional §16 trust violation |
| **Highest architectural debt** | **Policy Engine read-path gaps** | ACT-R1 closed at Platform Kernel L2 CwF |
| **Highest business value** | **Search Capability** | Cross-module findability after L3 density |
| **Highest modernization value** | **Policy Engine platform L3** | Closest L2→L3 platform candidate |
| **Closest to certification** | **Policy Engine platform L3** | Already L2; bounded read-path gap |
| **Most benefits AI** | **PE read parity + stub deny** | Kernel honesty delivered |
| **Most benefits whole platform** | **Policy Engine L3** | Authorization consistency on reads |
| **Highest reference potential** | **PP-2 Settings Platform** (deferred) | 26/27 G-score |

---

## G. What changed since 2026 refresh (same day, post-Wave-3 closure)

| Prior assumption (PLATFORM_PORTFOLIO_REFRESH_2026) | Current reality (2026.5) |
|-----------------------------------------------------|--------------------------|
| Dashboard Wave 3 **in progress / top priority** | **L3 CwF archived** — 24/27; 4 majors on certificate |
| Analytics **scope undecided** | **L2 CwF archived** — 21/27; Hybrid Domain ratified; Phase 2 **not authorized** |
| Account Platform **recent** | **Confirmed archived** — advisory burn-down only |
| Top initiative = Dashboard audit | **Obsolete** — kernel **L2 CwF archived** 2026-06-23 |
| 11 archived programs | **13** archived programs (Dashboard, Analytics, **Platform Kernel**) |

---

## H. Decision options (ranked recommendation)

| Rank | Option | Verdict |
|------|--------|---------|
| **1** | **A. Platform Kernel Modernization** | **Complete** — L2 CwF archived 2026-06-23 |
| **2** | **B. AI Platform Modernization (narrow)** | **Recommended primary** — stub executor deny policy |
| **3** | **C. Search Capability Program** | **Recommended second** — platform audit + provider gaps |
| **4** | **E. Other** | AP advisory burn-down — parallel hygiene, not portfolio initiative |
| **5** | **D. Analytics Phase 2** | **Do not authorize** — separate council gate; certificate majors sufficient for now |

---

## Required questions (summary)

See [`PLATFORM_EXECUTIVE_SUMMARY_2026_5.md`](./PLATFORM_EXECUTIVE_SUMMARY_2026_5.md) for full answers.

| # | Question | Short answer |
|---|----------|--------------|
| 1 | What remains uncertified? | Platform kernel L1 (Events, Activity, Scheduler, Manifest); Search, Realtime (no row); PE/V_Link/Trash/Notifications/AI at L2 without platform L3 |
| 2 | What remains unaudited? | **Search**, **Realtime platform**, **Marketplace pipeline** |
| 3 | Highest platform risk? | **AI stub executors** |
| 4 | Highest architectural debt? | **Policy Engine read-path gaps** (ACT-R1 **closed**) |
| 5 | Modernize next capability? | **Policy Engine platform L3** |
| 6 | Modernize next module? | **None** — all product modules L3+; hygiene = Dashboard P4 optional |
| 7 | Closest to certification? | **Policy Engine platform L3** |
| 8 | Most benefits AI? | **Domain Events + Activity honesty** |
| 9 | Most benefits platform? | **Platform kernel increment** |
| 10 | Do NOT work on yet? | Archived programs; Analytics Phase 2; AI full L3; Calendar/Place L4 |
| 11 | Top 10 modernization priorities? | See modernization priority doc |
| 12 | Top 10 certification candidates? | See certification status doc |
| 13 | Top 10 reference candidates? | See reference candidates doc |
| 14 | Recommended next initiative? | **B. AI stub deny policy** or **Policy Engine platform L3** |
| 15 | Recommended next three? | **A → B (narrow) → C** |

---

## Deliverables index

| Document | Purpose |
|----------|---------|
| This file | Master refresh assessment |
| [PLATFORM_CERTIFICATION_STATUS_2026_5.md](./PLATFORM_CERTIFICATION_STATUS_2026_5.md) | Certification matrix |
| [PLATFORM_RISK_MATRIX_2026_5.md](./PLATFORM_RISK_MATRIX_2026_5.md) | Risk scoring |
| [PLATFORM_MODERNIZATION_PRIORITY_2026_5.md](./PLATFORM_MODERNIZATION_PRIORITY_2026_5.md) | Priorities + roadmap |
| [PLATFORM_REFERENCE_CANDIDATES_2026_5.md](./PLATFORM_REFERENCE_CANDIDATES_2026_5.md) | Reference promotion map |
| [PLATFORM_EXECUTIVE_SUMMARY_2026_5.md](./PLATFORM_EXECUTIVE_SUMMARY_2026_5.md) | Executive brief |

---

## Stop condition

- Portfolio assessment **complete**
- No implementation work
- No certification work
- No ledger update
- No council activity
- No modernization packages created

**Last updated:** 2026-06-23
