# Dashboard Module — Executive Summary (Phase 0A)

**Program:** Dashboard Module Wave 3 — Phase 0A Constitutional Audit  
**Date:** 2026-06-21  
**Audience:** Product, engineering leadership, architecture council  
**Status:** Discovery complete — **no implementation, certification, ledger, or council activity**

---

## Bottom line

The **Dashboard module is a legitimate, certifiable product module** — but today it is a **widget composition platform at L1 (~63% G1–G9)**, not certifiable at L2/L3.

**Reference Workspace shells are out of scope** (WS-L3 archived). This audit covers **`dashboard` id product only**: widget grid, registry, layout persistence, and APIs.

**Primary identity:** Dashboard is **primarily a widget host**. It owns **composition state** (layouts, widget instances, widget-local config), **not** domain SoR for Chat, Drive, HR, or Analytics.

**Critical defects:** Missing activity + PE on writes; fake placeholder activity feed; mock enterprise analytics panels; cross-module Prisma in AI quick-stats provider.

**Recommended next initiative after Phase 0A:** **Phase 0B — Dashboard Module Operation Matrix & Trust Policy Charter** (discovery/governance — define matrix rows, trust policy for mock removal, PE/activity requirements before service extraction ACT).

---

## Required questions

| # | Question | Answer |
|---|----------|--------|
| **1** | Legitimate standalone module? | **Yes** — registered built-in #10, services, APIs, AI context, widget product |
| **2** | What does Dashboard actually own? | Widget registry, grid UX, `Widget` rows, layout/preferences JSON, widget-local config, dashboard tab CRUD |
| **3** | What belongs to Workspace? | PlatformShell, navigation SSOT, module mounts, `DashboardLayoutInner`, business switch, cross-surface routing |
| **4** | Primarily widget platform? | **Yes** — 13 registry types; core value is projection grid |
| **5** | Own business domain data? | **No** — only composition metadata; domain data stays in source modules |
| **6** | Services that exist? | `dashboardService`, `widgetService`, `sidebarCustomizationService`; AI logic in controller; coupled `fileMigrationService`, `businessWorkspaceSeeder` |
| **7** | Architectural violations? | **5 blocking, 8 major** — see findings below |
| **8** | Belongs to Analytics instead? | QuickStats, AI quick-stats aggregates, enterprise panels, ActivityFeed placeholders → **Analytics / platform reads** |
| **9** | Certification readiness? | **17/27 (~63%) L1** — **NOT CERTIFIABLE** for L2/L3 |
| **10** | Next initiative? | **Phase 0B: Operation Matrix + Trust Policy Charter** — then Phase 1 service extraction (when ACT authorized) |

---

## Architecture at a glance

```
Workspace Shell (WS-L3 · archived)
       │ hosts
       ▼
Dashboard Module (L1 · this audit)
  • DashboardClient / widgetRegistry
  • /api/dashboard + /api/widget
  • Widget + layout SoR
       │ projects via widgets
       ▼
L3 Modules (Chat, Drive, Todo, HR, …)
       ▲
       │ derived reads (should consume)
Platform Analytics Capability (scope TBD)
```

---

## Inventory highlights

| Area | Count / note |
|------|----------------|
| API routes | 11 dashboard + 4 widget + 3 AI context |
| Services | 3 primary + 2 cross-coupled |
| Widget types | 13 registered, 12 mounted |
| Prisma models | Dashboard, Widget, RetentionPolicy, ComplianceSettings |
| PE coverage | 1 of ~8 mutation/read-sensitive handlers |
| Activity emissions | 0 |
| Module operation matrix | Missing |
| Integration tests | 1 (context membership) |

---

## Findings summary

### Blocking (5)

| ID | Issue |
|----|-------|
| DASH-B1 | No module activity emissions |
| DASH-B2 | PE missing on writes |
| DASH-B3 | AI quick-stats cross-module Prisma |
| DASH-B4 | ActivityFeed placeholder fake data |
| DASH-B5 | Enterprise mock analytics panels |

### Major (8)

Dual registry · calendar side effect on create · workspace seeder coupling · no operation matrix · tenancy entity conflation · QuickStats analytics overlap · business hub stub · fat delete controller

### Advisory (8)

API namespace split · sidebar hybrid · missing WorkspaceLanding · manifest drift · widget trash · pseudo-module quickstats · orphaned NotesWidget · no notification manifest

---

## Analytics boundary (summary)

Dashboard must **consume** Platform Analytics for rollups — not generate them.

| Keep in Dashboard | Move to Analytics |
|-------------------|-------------------|
| Widget layout meta (AI overview) | QuickStats aggregation |
| Module widget hosts (HR summary via HR API ✅) | Enterprise executive/cross-module panels |
| ActivityFeed as **host** of real feed | Placeholder activities on failure |
| Bookmarks/quick notes in widget.config | AI quick-stats foreign Prisma |

Full matrix: [DASHBOARD_ANALYTICS_BOUNDARY_ANALYSIS.md](./DASHBOARD_ANALYTICS_BOUNDARY_ANALYSIS.md)

---

## G1–G9 estimate

**17/27 (~63%) — L1 Stabilizing**

| PASS (0) | PARTIAL (8) | FAIL (1) |
|----------|-------------|----------|
| — | G1, G3, G4, G5, G6, G7, G8, G9 | G2 |

**Determination:** NOT CERTIFIABLE · not L2 · not L3 candidate

---

## Deliverables index

| Document | Purpose |
|----------|---------|
| [DASHBOARD_REALITY_ASSESSMENT.md](./DASHBOARD_REALITY_ASSESSMENT.md) | Routes, APIs, models, widgets, duplication |
| [DASHBOARD_OWNERSHIP_MODEL.md](./DASHBOARD_OWNERSHIP_MODEL.md) | Shell vs module vs Analytics boundaries |
| [DASHBOARD_SERVICE_BOUNDARY_ANALYSIS.md](./DASHBOARD_SERVICE_BOUNDARY_ANALYSIS.md) | Services, violations, lifecycle gaps |
| [DASHBOARD_WIDGET_ARCHITECTURE_AUDIT.md](./DASHBOARD_WIDGET_ARCHITECTURE_AUDIT.md) | Per-widget data sources and ownership |
| [DASHBOARD_ANALYTICS_BOUNDARY_ANALYSIS.md](./DASHBOARD_ANALYTICS_BOUNDARY_ANALYSIS.md) | Dashboard vs Analytics matrix |
| [DASHBOARD_CERTIFICATION_READINESS.md](./DASHBOARD_CERTIFICATION_READINESS.md) | G1–G9, findings, cert posture |
| This file | Executive brief |

---

## Stop condition

- Phase 0A constitutional audit **complete**
- No runtime code changes
- No service extraction
- No certification or ledger update
- No council activity
- No implementation plans authorized

**Last updated:** 2026-06-21
