# Workspace — Ownership Model

**Program:** ENG-1 / WS-L3 Readiness Assessment  
**Date:** 2026-06-19  
**Status:** Governance record — supersedes informal references in wave audits for executive authority

**Authorities:** [REFERENCE_WORKSPACE_PLATFORM_SHELL.md](../architecture/REFERENCE_WORKSPACE_PLATFORM_SHELL.md), [WORKSPACE_ROUTING_CONTRACT.md](../architecture/WORKSPACE_ROUTING_CONTRACT.md), [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](../architecture/PERSONAL_DASHBOARD_ROUTING_CONTRACT.md)

---

## Executive model

Reference Workspace is a **hybrid holder program** — two co-surfaces under one certification umbrella:

| Co-surface | Canonical name | URL root | Primary owner |
|------------|----------------|----------|---------------|
| **Business** | Business Workspace | `/business/:id/workspace/*` | Platform Shell (business mode) |
| **Personal** | Personal Dashboard shell | `/dashboard/*` + module routes | Platform Shell (personal mode) |

**Not owners:** Individual product modules (Drive, HR, Place, etc.) — modules own interiors; workspace owns **orchestration only**.

---

## Ownership matrix

| Concern | Owner | SoR / artifact | Duplication risk |
|---------|-------|----------------|------------------|
| **Workspace shell chrome** | Platform Shell team | `PlatformShell`, `PlatformLeftSidebar`, `PlatformRightRail` | Low — extracted 3C-4E/4F |
| **Business module mounting** | Business Workspace | `BusinessWorkspaceContent` switch | **None** — single switch |
| **Business navigation URLs** | Business Workspace | `businessWorkspaceNavigation.ts` | Low — SSOT enforced by 28 tests |
| **Business sidebar modules list** | Business Configuration + PositionAware | `BusinessConfigurationContext`, `PositionAwareModuleProvider` | Medium — filter vs registry drift (CI guarded) |
| **Business sidebar customization** | Sidebar customization | `SidebarCustomizationContext` | Low — presentation only |
| **Personal module mounting** | Personal Dashboard shell | `DashboardLayoutInner` + module routes | Medium — tab embed vs direct routes |
| **Personal widget grid** | **Dashboard module** (product) | `DashboardClient`, `DashboardContext` | **Hybrid** — see §Dashboard boundary |
| **Personal navigation URLs** | Personal Dashboard shell | `personalDashboardNavigation.ts` | Low — 36 tests |
| **Cross-surface transitions** | Reference Workspace program | `crossSurfaceNavigation.ts` | Low |
| **Runtime scope / tenant binding** | Workspace runtime bridge | `WorkspaceRuntimeScopeBridge` | Medium — **ENG-2** test gap |
| **Workspace personalization** | Split | Business: sidebar customization; Personal: dashboard picker + tabs | Medium — no unified prefs API |
| **Installed-module gating** | Business Configuration | Manifest + business install list | Documented finding B-F3 area |

---

## Shell vs module boundary

```
┌─────────────────────────────────────────────────────────┐
│  PlatformShell (header, sidebar chrome, right rail)      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Workspace orchestration (hub / switch / grid)     │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Module interior (Drive, HR, Place, …)       │  │  │
│  │  │  — module teams own services, PE, activity   │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Invariant:** Shell must not perform module mutations (no product CRUD in switch/grid).

---

## Dashboard boundary (constitutional)

**Classification: C — Hybrid**

| Layer | Part of workspace? | Owner |
|-------|-------------------|-------|
| `DashboardLayoutInner` / tabs / personal sidebar | **Yes** — Personal Workspace shell | Reference Workspace |
| `DashboardClient` widget grid / registry | **No** — product module interior | Dashboard module (ledger L1) |
| `BrandedWorkDashboard` business hub cards | **Yes** — Business hub panel | Business Workspace |
| Widget types / escalation | **Shared contract** | Widget registry + module manifests |

**Rule:** WS-L3 certifies **shell orchestration**. Dashboard **module** L3 is a separate Wave 3 program.

---

## Duplication identified

| Duplication | Surfaces | Severity | Remediation |
|-------------|----------|----------|-------------|
| Business profile vs workspace settings | `/business/:id/profile` vs `workspace/settings` | Medium | Portfolio Settings audit (deferred) |
| Legacy `?module=` vs segment URLs | Business workspace | Low | B-F2 sunset policy |
| Tab embed vs direct module URL | Personal Work/Place tabs | Low | P-F4 by design |
| Bootstrap ad-hoc hrefs | `DashboardClient` | Low | P-F3 / ENG-4 |
| Notifications entry | Header bell vs sidebar module | Low | RWS-27 product choice |

**No duplication** in canonical navigation SSOT (business + personal each have one helper module).

---

## Sidebar ownership

| Surface | Sidebar content owner | Customization |
|---------|----------------------|---------------|
| Business | `DashboardLayoutWrapper` builds `LeftSidebarConfig` from installed modules + customization | `SidebarCustomizationModal` |
| Personal | `DashboardLayoutInner` + `GlobalHeaderTabs` | Dashboard tab model + module list |

---

## Module mounting ownership

| Mount type | Authority | Contract |
|------------|-----------|----------|
| Switch-mounted modules | `BusinessWorkspaceContent` `switch` | `BUSINESS_WORKSPACE_SWITCH_CONTRACTS` |
| Segment-page modules | App Router `children` + layout | `WORKSPACE_CHILD_ROUTE_SEGMENTS` |
| Personal full-page modules | Dedicated `/drive`, `/chat`, … routes | `personalDashboardContracts` |
| Personal grid widgets | `WidgetContentRenderer` | Widget registry |

---

## Related

- [WORKSPACE_REALITY_REASSESSMENT.md](./WORKSPACE_REALITY_REASSESSMENT.md)
- [WORKSPACE_FINDINGS_REGISTER.md](./WORKSPACE_FINDINGS_REGISTER.md)

**Last updated:** 2026-06-19
