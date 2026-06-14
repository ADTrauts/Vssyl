# Personal Dashboard Wave 2A — Co-Surface Boundary Audit

**Status:** **Complete** — governance and analysis only  
**Date:** 2026-06-14  
**Surface:** Personal Dashboard shell (`personal-dashboard`) — `/dashboard/*` + personal module routes  
**Program:** [Reference Workspace Program](./REFERENCE_WORKSPACE_CHARTER_REVIEW.md)  
**Co-surface:** Business Workspace ([WS-L1 Certified with Findings](./BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md))

> **No engineering. No certification. No registration. Audit only.**

---

## Required report

| # | Topic | Outcome |
|---|-------|---------|
| 1 | Dashboard ownership matrix | §2 |
| 2 | Module ownership matrix | §3 |
| 3 | Business vs Personal parity assessment | §4 |
| 4 | WS-L2 blockers | **10 blockers** (PD-1–PD-10) — §5 |
| 5 | Co-surface readiness | **Yes with findings** — §6 |
| 6 | Recommended Wave 2B scope | §7 |

---

## 1. Executive summary

Wave 2A is the first formal boundary audit of the **Personal Dashboard shell** — the charter's co-surface for inaugural Reference Workspace registration alongside Business Workspace.

**Key findings:**

1. **Different archetype, shared chrome.** Personal Dashboard is a **dashboard workspace** (widget grid + context tabs); Business Workspace is a **hub workspace** (module switch). Both consume certified `PlatformShell` (`personal` | `business` modes).
2. **Personal shell ownership is clearer on product boundaries** than pre-1B Business Workspace — modules mount as **top-level App Router pages** (`/drive`, `/chat`, …) wrapped in `DashboardLayout`, not inline stub widgets in the shell switch.
3. **Navigation is fragmented.** `DashboardContext.navigateToModule` uses `/${module}?dashboard=:id` with inline `router.push` calls in `DashboardLayoutInner` — no single contract file, no CI drift tests (contrast: `businessWorkspaceNavigation.ts` + 24 automated tests).
4. **Widget orchestration is shell-owned** via `DashboardClient` → `WidgetContentRenderer` switch — legitimate **projections** per `WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md` (module = capability; widget = projection), but boundary is undocumented.
5. **Parallel entry surfaces** — Work tab (`WorkTab` / `BrandedWorkDashboard`), Place tab (`PlaceContent`), and global tabs — lack unified navigation contract with the personal module route tree.
6. **Household and education** reuse the personal shell via dashboard **type** on the `Dashboard` model — no dedicated shell file; boundaries not previously audited.

**WS-L2 posture:** Personal Dashboard is **not WS-L1 certified**. Business Workspace WS-L1 does **not** transfer. Co-surface registration remains **prep-eligible only** until Personal achieves equivalent boundary documentation and enforcement.

---

## 2. Dashboard ownership matrix

Surfaces the **Personal Dashboard shell** owns or orchestrates.

### 2.1 Platform chrome and shell

| Surface | Owner | Key artifacts | Notes |
|---------|-------|---------------|-------|
| **Personal platform chrome** | Reference Workspace (personal) | `DashboardLayoutInner` → `PlatformShell mode="personal"` | 3C-4E certified |
| **Global header tabs** | Workspace + Platform | `GlobalHeaderTabs` — personal / household / edu / work / place tabs | Context switching |
| **Left sidebar** | Workspace | `PlatformLeftSidebar` + folder config + `effectiveLeftSidebarConfig` | Per-dashboard-tab customization |
| **Right rail** | Workspace | `PlatformRightRail`, pinned modules, AI/Modules/Trash | `GlobalTrashBin` platform-global |
| **Sidebar customization** | Workspace | `SidebarCustomizationModal`, `LeftSidebarCustomizer` | Shared with business via `SidebarCustomizationProvider` |
| **Work tab embed** | Workspace (adjacent) | `WorkTab` → `BrandedWorkDashboard` | Hides sidebar; parallel business entry |
| **Place tab embed** | Workspace (adjacent) | `PlaceContent` | Consumer Place surface in global layout |
| **Theme / branding** | Workspace + Platform | `useThemeColors`, `useGlobalBranding` | Personal mode defaults |

### 2.2 Dashboard shell and widget orchestration

| Surface | Owner | Key artifacts | Notes |
|---------|-------|---------------|-------|
| **Dashboard route tree** | Dashboard platform | `/dashboard`, `/dashboard/[id]` | Client-side redirect + grid |
| **Widget grid layout** | Dashboard platform | `DashboardGrid`, `WidgetShell` | react-grid-layout |
| **Widget type switch** | Dashboard platform (shell projection) | `DashboardClient` → `WidgetContentRenderer` | Maps widget type → widget component |
| **Widget registry** | Dashboard platform | `WIDGET_REGISTRY` in `widgetRegistry.ts` | 13 widget types; context filters |
| **Widget picker / build-out** | Dashboard platform | `WidgetPicker`, `DashboardBuildOutModal`, `EmptyDashboard` | Install-gated |
| **Dashboard CRUD / tabs** | Dashboard platform | `DashboardContext`, create/delete modals in Inner | Personal, household, edu types |
| **Edit mode / layout persistence** | Dashboard platform | `DashboardClient` layout save | Per-dashboard widgets |

### 2.3 Navigation and module mounting (personal)

| Concern | Owner | Mechanism | Gap vs Business |
|---------|-------|-----------|-----------------|
| Sidebar module list | Workspace | `navigateToModule` in `DashboardContext` | No contract file |
| Active module highlight | Workspace | `pathname?.split('/')[1]` in Inner | Path-first only; no resolver |
| Personal module routes | Workspace + Module | `/{module}?dashboard={id}` via App Router | Query-scoped, not segment |
| Module layout wrapper | Workspace | Per-module `layout.tsx` → `DashboardLayout` | **Inconsistent** — chat omits layout without `?dashboard=` |
| Members routing | Workspace | Personal → `/member`; business dashboard → business members | Cross-surface branch in `navigateToModule` |
| Cross-context (personal ↔ business) | Workspace | Work tab auth → `/business/:id/workspace` | Segment URLs on business side only |

### 2.4 Runtime scope management

| Concern | Owner | Mechanism | Notes |
|---------|-------|-----------|-------|
| Runtime bridge | Workspace | `DashboardLayout.tsx` → `WorkspaceRuntimeScopeBridge` | Shared primitive with business |
| Context detection | Workspace | `fromLegacyDashboardType`, pathname, `WorkAuth` | personal / household / education / business |
| Installed modules (personal) | Workspace | `PositionAwareModuleProvider.getFilteredModules()` | Fallback: `PERSONAL_DEFAULT_MODULES` hardcoded |
| Permission snapshot | Workspace | `buildPersonalPermissionSnapshot` | No contract tests |
| Household scope | Dashboard platform | `householdId` from `currentDashboard.household` | Resolved in bridge |
| Business layout override | Workspace | `BusinessLayoutRuntimeShell` — explicit `contextType="business"` | Personal lacks named shell wrapper |

### 2.5 Platform-global cross-cutting (not personal-specific)

| Concern | Owner | Personal integration |
|---------|-------|---------------------|
| **Search** | Platform (root) | `GlobalSearchProvider` in `app/layout.tsx` |
| **Notifications** | Platform + modules | Header bell; `NotificationsWidget` on grid |
| **Global trash** | Platform | `GlobalTrashBin` in right rail |
| **Stackable chat** | Platform + Chat module | `StackableChatContainer` in root layout |
| **Auth/session** | Platform | NextAuth; per-page session gates on module routes |

---

## 3. Module ownership matrix

Product `moduleId` surfaces the personal shell **mounts or projects** but does **not** own.

### 3.1 Full module routes (personal context)

| Module | Owner | Personal entry | Shell role | Shell must not |
|--------|-------|----------------|------------|----------------|
| **Drive** | Module (UX #1) | `/drive?dashboard=` → `DrivePageContent` | Wrap in `DashboardLayout`; sidebar nav | Own file CRUD |
| **Chat** | Module | `/chat?dashboard=` → chat pages | Layout **conditional** on query param | Persist messages |
| **Calendar** | Module (UX #5) | `/calendar?dashboard=` | `DashboardLayout` wrap | Own event CRUD |
| **Todo** | Module (UX #3) | `/todo?dashboard=` | `DashboardLayout` wrap | Own task services |
| **Notebook** | Module | `/notebook?dashboard=` | `DashboardLayout` wrap | Own page/link services |
| **AI** | Module (UX #4) | `/ai-chat` (rail), `/ai` (identity), widget | Multiple entry paths | Own twin pipeline |
| **Place** | Module (UX #6 candidate) | `/place` tab embed + `/place` route | `PlaceContent` in tab; standalone route | Own graph/commerce |
| **VLink** | Platform module | `/vlink?dashboard=` | `DashboardLayout` wrap | Own link resolution |
| **Members** | Member domain | `/member` (personal) | Routed from `navigateToModule` | Own member CRUD in shell |
| **Notifications** | Platform utility | Widget only + `/notifications` | Widget projection | N/A |

### 3.2 Widget projections (dashboard grid only)

| Widget type | Module source | Component | Boundary |
|-------------|---------------|-----------|----------|
| `chat` | chat | `ChatWidget` | Summary projection — not full module |
| `drive` | drive | `DriveWidget` | Recent files overview |
| `calendar` | calendar | `CalendarWidget` | Upcoming events |
| `todo` | todo | `TodoWidget` | Task summary |
| `notebook` | notebook | `NotebookWidget` | Page/task counts |
| `ai` | ai | `AIWidget` | Quick AI surface |
| `hr` / `scheduling` | business modules | `HRWidget` / `SchedulingWidget` | `contexts: ['business']` only on business-type dashboards |
| Utility widgets | platform | notifications, quickstats, etc. | `alwaysAvailable: true` |

**Rule (from runtime contracts):** Widget switch in `DashboardClient` is **dashboard-platform-owned projection routing** — not a product boundary leak *if* widgets remain summaries and link to full module routes. Boundary is **undocumented** (PD-5).

### 3.3 Context variants (household / education)

| Context | Owner | Mechanism | Shell file |
|---------|-------|-----------|------------|
| **Household** | Dashboard platform | `dashboard.type` / `householdId`; Home tab creation in Inner | None — reuses personal shell |
| **Education** | Dashboard platform | `educational` dashboard type; `/educational/create` | None — reuses personal shell |
| **Household management** | Household domain | `/household/manage` | Adjacent route |

### 3.4 Future / immature

| Module | Status | Notes |
|--------|--------|-------|
| Education modules | WS-L0 | Dashboard type exists; no education module route tree |
| Marketplace widgets | TBD | `modules/run/[moduleId]` iframe path separate from shell |
| Place publisher | Business only | `PlaceWorkspaceLanding` in business hub — not personal |

---

## 4. Business vs Personal parity assessment

### 4.1 Parity matrix

| Area | Business Workspace | Personal Dashboard | Parity |
|------|-------------------|-------------------|--------|
| **Shell ownership** | `DashboardLayoutWrapper` | `DashboardLayoutInner` | ✅ Both workspace-owned |
| **PlatformShell** | `mode="business"` (3C-4F) | `mode="personal"` (3C-4E) | ✅ Certified both modes |
| **Archetype** | Hub — module switch | Dashboard — widget grid + module routes | ⚠️ **Intentional difference** |
| **Mount model** | `BusinessWorkspaceContent` switch + segment-page children | Top-level `/{module}` pages + widget grid | ⚠️ Different by design |
| **Navigation SSOT** | `businessWorkspaceNavigation.ts` + contracts | `DashboardContext.navigateToModule` + inline pushes | ❌ **Gap** |
| **URL model** | Segment `/workspace/:segment` canonical | Query `?dashboard=:id` on `/:module` | ❌ **Gap** |
| **Navigation tests** | 15 + 9 CI tests | None | ❌ **Gap** |
| **Routing contract doc** | `WORKSPACE_ROUTING_CONTRACT.md` | None | ❌ **Gap** |
| **Runtime scope bridge** | `BusinessLayoutRuntimeShell` (explicit) | `WorkspaceRuntimeScopeBridge` in `DashboardLayout` | 🟡 Shared primitive; personal less explicit |
| **Dashboard bootstrap** | `ensureBusinessDashboard` (single owner) | `DashboardContext` + `DashboardClient` redirect logic | 🟡 Personal consolidated in context; no duplicate leak found |
| **Widget orchestration** | N/A (hub, not grid) | `WidgetContentRenderer` switch | N/A — personal-only concern |
| **Stub product UI in shell** | Removed (1B) | Not present — widgets are projections | ✅ |
| **Module install filter** | `BusinessConfigurationContext` | `PositionAwareModuleProvider` | 🟡 Different providers; shared sidebar customizer |
| **Parallel entry** | `BrandedWorkDashboard` (segment-aligned 1C) | `WorkTab`, `PlaceContent` tabs | 🟡 Both have adjacent entries |
| **Cross-surface transitions** | `handleSwitchToPersonal` → `/dashboard` | Work tab → `/business/:id/workspace` | 🟡 No unified cross-surface contract |
| **Household / education** | N/A in business hub | Dashboard type on model | 🟡 Unaudited contexts |
| **Search / notifications** | Platform-global | Platform-global | ✅ Parity |
| **WS-L1 certification** | Certified with Findings | Not certified | ❌ **Gap** |

### 4.2 Parity summary

| Category | Count |
|----------|-------|
| ✅ Parity / acceptable difference | 5 |
| 🟡 Partial parity | 5 |
| ❌ Gap requiring remediation | 5 |

**Conclusion:** Surfaces are **architecturally complementary** (hub vs dashboard archetypes) but **operationally asymmetric** on navigation contracts, URL policy, automated enforcement, and certification status. Dual registration is feasible only after Personal closes the ❌ gaps to a WS-L1-equivalent bar.

---

## 5. WS-L2 blockers (Personal Dashboard)

Blockers for Personal Dashboard WS-L1/L2 and co-surface registration. Classified P0 / P1 / P2.

| ID | Blocker | Priority | Description | Blocks |
|----|---------|----------|-------------|--------|
| **PD-1** | No personal navigation SSOT | **P1** | `navigateToModule` in `DashboardContext` + scattered `router.push` in Inner — no `personalDashboardNavigation.ts` equivalent | WS-L1 personal · registration |
| **PD-2** | No personal routing contract | **P1** | No documented invariants for `/{module}?dashboard=` vs bare `/{module}` vs dashboard grid paths | WS-L2 · registration doc |
| **PD-3** | No CI drift tests | **P1** | No tests linking sidebar modules → routes → registry for personal context | WS-L2 · silent drift risk |
| **PD-4** | URL model asymmetry | **P1** | Business segment-canonical; personal query-canonical — cross-surface href builders not aligned | WS-L2 · XWS transitions |
| **PD-5** | Widget projection boundary undocumented | **P2** | `WidgetContentRenderer` switch ownership vs module interiors not in workspace docs | WS-L2 |
| **PD-6** | Module layout wrapper inconsistency | **P2** | `chat/layout.tsx` skips `DashboardLayout` without `?dashboard=`; other modules always wrap | WS-L2 · mount confusion |
| **PD-7** | Work / Place tab parallel entries | **P2** | Tab embeds bypass personal module route contract; no unified active-state resolver | WS-L2 |
| **PD-8** | Household / education contexts unaudited | **P2** | Reuse personal shell with no boundary matrix or context-specific routing rules | WS-L2 · registration |
| **PD-9** | `PERSONAL_DEFAULT_MODULES` hardcoded | **P2** | Runtime bridge fallback bypasses registry when `PositionAwareModuleProvider` unavailable | WS-L2 · drift |
| **PD-10** | AI entry path fragmentation | **P2** | `/ai-chat`, `/ai`, AI widget, AI right-rail — no canonical personal AI entry doc | WS-L2 |

**P0 blockers:** **0** — no stub product UI or shell CRUD leaks equivalent to pre-1B Business Workspace.

**P1 blockers:** **4** — navigation, routing contract, CI enforcement, URL asymmetry.

**P2 blockers:** **6** — documentation, consistency, and context-depth items.

---

## 6. Co-surface readiness determination

### Question

Can Business Workspace and Personal Dashboard eventually share a single Reference Workspace registration?

### Answer: **Yes with findings**

| Criterion | Assessment |
|-----------|------------|
| Charter intent (dual co-surface) | ✅ Supported — hub + dashboard archetypes under one program |
| Shared PlatformShell primitive | ✅ Both modes certified |
| Shared runtime bridge | ✅ `WorkspaceRuntimeScopeBridge` used by both |
| Shared sidebar customization | ✅ `SidebarCustomizationProvider` |
| Business WS-L1 | ✅ Certified with Findings |
| Personal WS-L1 equivalent | ❌ Not started — PD-1 through PD-4 open |
| Registration doc | ❌ `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` not drafted |
| Archetype documentation | 🟡 Business documented; personal widget/route model needs contract |

**Readiness tiers:**

| Tier | Applicable? |
|------|-------------|
| Not ready | ❌ |
| **Eligible for Reference Workspace prep** | ✅ **Current combined state** |
| Ready for Reference Workspace registration review | ❌ — Personal must close P1 blockers + achieve WS-L1 personal certification |

**Findings that qualify "Yes with findings":**

1. Personal Dashboard has **no P0 shell/product leaks** — healthier boundary baseline than pre-1B business.
2. **Fundamental archetype difference** (hub vs dashboard) is acceptable in one registration as **two mode consumers** — not a blocker.
3. **Navigation and enforcement asymmetry** is the primary registration risk — addressable in Wave 2B–2C.
4. Business WS-L1 **F-2** (Personal co-surface) from certification review is **confirmed open** by this audit.

**No registration or certification was performed.**

---

## 7. Recommended Wave 2B scope

Governance-first wave to close P1 blockers; optional implementation wave follows.

### 2B-1 — Personal navigation contract (governance + design)

| Deliverable | Type |
|-------------|------|
| `PERSONAL_DASHBOARD_ROUTING_CONTRACT.md` | Doc — mirror business routing contract |
| `personalDashboardContracts.ts` design spec | Doc appendix — route kinds: `grid`, `module-route`, `tab-embed` |
| Canonical personal entry path table | Doc — per module + widget deep-link |

### 2B-2 — Widget vs module boundary (governance)

| Deliverable | Type |
|-------------|------|
| Widget projection rules in routing contract | Doc — when shell may switch widget types |
| Cross-link `WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md` | Doc update |

### 2B-3 — Cross-surface transition map (governance)

| Deliverable | Type |
|-------------|------|
| Personal ↔ Business ↔ Place transition table | Doc — href builders, context switches |
| Align `WS-REF-XWS-001` pattern stub | Charter / pattern annex |

### 2B-4 — Household / education annex (governance)

| Deliverable | Type |
|-------------|------|
| Context variant subsection in routing contract | Doc — household/edu dashboard types |
| PD-8 closure criteria | Audit checklist |

### 2B-5 — Implementation handoff (future wave 2C — not 2B)

| Item | Type |
|------|------|
| `personalDashboardNavigation.ts` | Code |
| `personalDashboardNavigation.test.ts` | Code |
| `chat/layout.tsx` consistency fix | Code |
| Personal WS-L1 certification review | Governance |

**Wave 2B constraints:** Governance and design only — same as Wave 2A. Engineering deferred to **2C**.

---

## 8. Constraints honored

- ✅ Governance and analysis only  
- ✅ No engineering  
- ✅ No certification  
- ✅ No registration  

---

## Related

- [BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md](./BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md) §2.2
- [BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md](./BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md) §3 F-2
- [REFERENCE_WORKSPACE_CHARTER_REVIEW.md](./REFERENCE_WORKSPACE_CHARTER_REVIEW.md)
- [WORKSPACE_ROUTING_CONTRACT.md](../WORKSPACE_ROUTING_CONTRACT.md)
- [WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](../WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md)

---

*Last updated: 2026-06-14 (Personal Dashboard Wave 2A co-surface audit)*
