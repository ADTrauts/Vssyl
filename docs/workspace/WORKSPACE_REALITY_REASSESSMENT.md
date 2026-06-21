# Workspace — Reality Reassessment (ENG-1 / WS-L3 Prep)

**Program:** Reference Workspace — ENG-1 Workspace Closure & WS-L3 Readiness Assessment  
**Assessment date:** 2026-06-19  
**Authority:** [Platform Portfolio Assessment](../platform-portfolio/PLATFORM_PORTFOLIO_EXECUTIVE_SUMMARY.md) — highest priority initiative  
**Status:** Discovery + targeted ENG-1 remediation — **no certification, no ledger, no council**

---

## Purpose

Reassess Business Workspace + Personal Dashboard (Reference Workspace program) for **WS-L3** eligibility after portfolio prioritization. Close **ENG-1** (Place segment 404) if remediation is minimal. Produce definitive readiness posture.

---

## A. Workspace inventory

### Business Workspace

| Layer | Key artifacts |
|-------|---------------|
| **Routes** | `/business/:id/workspace`, `/business/:id/workspace/:segment`, nested `hr/*`, `scheduling/*`, `workforce-comms/*`, `settings/*` |
| **App Router** | `web/src/app/business/[id]/workspace/**` — 27 segment/nested pages (incl. **place** post ENG-1) |
| **Layout** | `workspace/layout.tsx` → `DashboardLayoutWrapper` |
| **Shell** | `PlatformShell` (3C-4F business), `PlatformLeftSidebar`, `PlatformRightRail` |
| **Module mount** | `BusinessWorkspaceContent.tsx` switch + `BusinessWorkspaceHubPanel` |
| **Navigation SSOT** | `businessWorkspaceNavigation.ts`, `businessWorkspaceContracts.ts` |
| **Providers** | `BusinessConfigurationProvider`, `PositionAwareModuleProvider`, `SidebarCustomizationProvider` |
| **Sidebar** | `DashboardLayoutWrapper` + `SidebarCustomizationModal`, `SidebarFolderRenderer` |
| **Personalization** | `SidebarCustomizationContext`, installed-module filter via `BusinessConfigurationContext` |
| **Cross-surface** | `crossSurfaceNavigation.ts` |
| **Tests** | `businessWorkspaceNavigation.test.ts` (15), `businessWorkspaceRegistryDrift.test.ts` (9), `businessWorkspaceRouteHygiene.test.ts` (4), `crossSurfaceNavigation.test.ts` (6) |

**Mounted modules (switch):** dashboard, drive, chat, calendar, todo, notebook, place, ai, vlink, hr, scheduling, workforce_comms, members, analytics.

### Personal Workspace (Dashboard shell)

| Layer | Key artifacts |
|-------|---------------|
| **Routes** | `/dashboard`, `/dashboard/:id`, module routes (`/drive`, `/chat`, …), tab embeds |
| **Layout** | `dashboard/layout.tsx` → `DashboardLayout` → `DashboardLayoutInner` |
| **Shell** | `PlatformShell` (3C-4E personal), `GlobalHeaderTabs` |
| **Grid / widgets** | `DashboardClient.tsx`, `DashboardContext`, `WidgetContentRenderer` |
| **Navigation SSOT** | `personalDashboardNavigation.ts`, `personalDashboardContracts.ts` |
| **Tests** | `personalDashboardNavigation.test.ts` (15), `personalDashboardRegistryDrift.test.ts` (15) |

### Shared workspace infrastructure

| Component | Path | Role |
|-----------|------|------|
| PlatformShell | `web/src/components/layouts/PlatformShell.tsx` | Header + sidebar + rail geometry |
| PlatformLeftSidebar | `layouts/PlatformLeftSidebar.tsx` | Shared sidebar chrome |
| Workspace runtime bridge | `WorkspaceRuntimeScopeBridge`, `BusinessLayoutRuntimeShell` | Scope persistence (partial test coverage) |
| Routing contracts | `WORKSPACE_ROUTING_CONTRACT.md`, `PERSONAL_DASHBOARD_ROUTING_CONTRACT.md` | Constitutional URL policy |
| Cross-surface map | `CROSS_SURFACE_TRANSITIONS.md` | B↔P↔Place transitions |

### Server-side workspace services

| Service / API | Scope |
|---------------|-------|
| `businessAPI` / `serverBusinessApiCall` | Business fetch for layout |
| `useEnsureBusinessDashboard` | Dashboard id binding |
| Business configuration context | Installed modules, branding |
| No dedicated `workspaceService.ts` | Shell is **web-orchestration-first** — modules own server paths |

---

## B. Historical program lineage

| Program | Outcome | Relevance |
|---------|---------|-----------|
| Business Workspace Wave 0–1D | L1 → hygiene closed | Orphan pages removed; contracts |
| Personal Dashboard Wave 2A–2D | L1 → drift enforcement | Registry drift CI |
| Reference Workspace 2E–2F | WS-L2 CwF | QA + matrix re-audit |
| Reference Workspace registration prep | Approved w/ Findings | Platform shell doc |
| UX Modernization 3C-4E/4F | PlatformShell extraction | Shell ownership |
| Dashboard build-out | Widget registry | Personal grid — separate module debt |

---

## C. Current posture summary

| Surface | WS-L1 | WS-L2 | Ledger module row |
|---------|-------|-------|-------------------|
| Business Workspace | CwF | CwF (~90%) | L1 Stabilizing |
| Personal Dashboard shell | CwF | CwF (~88%) | L1 Stabilizing (Dashboard module) |
| Combined Reference Workspace | — | CwF (~89%) | WS-L2 program only |

**ENG-1 status (this assessment):** **Closed** — `workspace/place/page.tsx` null deferral added (2026-06-19).

---

## D. Constitutional G1–G9 summary

See [WORKSPACE_G1_G9_SCORECARD.md](./WORKSPACE_G1_G9_SCORECARD.md) — **23/27 (~85%)** post ENG-1.

---

## E. Certification readiness summary

See [WORKSPACE_CERTIFICATION_READINESS.md](./WORKSPACE_CERTIFICATION_READINESS.md).

**Determination:** **WS-L3 WITH FINDINGS candidate** — **READY FOR REVIEW** (governance evaluation only; not executed).

**Not plain WS-L3** — ENG-2 runtime scope tests, REG-B3 pattern annex, 11 carry-forward advisories remain.

---

## F. Dashboard boundary (required)

**Answer: C — Hybrid ownership**

| Layer | Owner | Relationship |
|-------|-------|--------------|
| **Personal Dashboard shell** | Reference Workspace / Platform Shell | Workspace orchestration surface (`DashboardLayoutInner`, tabs, sidebar) |
| **Dashboard module** (`dashboard` id) | Separate product module (ledger **L1**) | Widget grid product logic in `DashboardClient` — **not** workspace shell |
| **Business workspace hub** | Reference Workspace | Module switch — distinct from personal widget grid |

**Constitutional rule:** Workspace **orchestrates** module mounts; Dashboard **module** owns widget registry and grid semantics. Do not conflate WS-L3 shell certification with Dashboard Wave 3 module modernization.

---

## G. Defer vs Dashboard Wave 3

| Track | When |
|-------|------|
| **WS-L3 governance review** | **Next** — after ENG-1 closure; findings burn-down |
| **Dashboard Wave 3 module audit** | **Parallel optional** — does not block WS-L3 shell review |
| **Do not merge** | WS-L3 must not wait for Dashboard L3 module certification |

---

## Related deliverables

- [WORKSPACE_FINDINGS_REGISTER.md](./WORKSPACE_FINDINGS_REGISTER.md)
- [WORKSPACE_OWNERSHIP_MODEL.md](./WORKSPACE_OWNERSHIP_MODEL.md)
- [ENG_1_VALIDATION_REPORT.md](./ENG_1_VALIDATION_REPORT.md)
- [WORKSPACE_EXECUTIVE_SUMMARY.md](./WORKSPACE_EXECUTIVE_SUMMARY.md)

**Last updated:** 2026-06-19
