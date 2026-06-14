# Personal Context Variants — Household, Education, Personal

**Status:** Authoritative annex (Wave 2B)  
**Date:** 2026-06-14  
**Parent:** [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](./PERSONAL_DASHBOARD_ROUTING_CONTRACT.md)  
**Audit:** [PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md](./audits/PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md) (PD-8)

---

## 1. Variant model

Personal Dashboard shell supports **three dashboard context types** on one physical shell (`DashboardLayoutInner`). No separate shell files per variant.

| Variant | `WorkspaceContextType` | Legacy `WidgetContext` | Dashboard model signal |
|---------|------------------------|--------------------------|------------------------|
| **Personal** | `personal` | `personal` | Default dashboard; no household/institution |
| **Household** | `household` | `household` | `household` relation on dashboard |
| **Education** | `education` | `educational` | `institution` relation on dashboard |

**Mapping:** `contextMapping.ts` — `fromLegacyDashboardType` / `toLegacyWidgetContext`.

---

## 2. Shared shell (all variants)

| Concern | Shared? | Artifact |
|---------|---------|----------|
| `PlatformShell mode="personal"` | ✅ | `DashboardLayoutInner` |
| Global header tabs | ✅ | `GlobalHeaderTabs` |
| Left/right sidebar chrome | ✅ | `PlatformLeftSidebar`, `PlatformRightRail` |
| Sidebar folder customization | ✅ | `SidebarCustomizationProvider` |
| Widget grid mechanics | ✅ | `DashboardClient`, `DashboardGrid` |
| Module route tree | ✅ | `/{module}?dashboard=` pattern |
| Work / Place tab embeds | ✅ | Global tabs — not variant-specific |
| Dashboard create/delete UI | ✅ | Modals in Inner |

---

## 3. Shared runtime (all variants)

| Concern | Mechanism | Variant-specific input |
|---------|-----------|------------------------|
| Context detection | `WorkspaceRuntimeScopeBridge` | `getDashboardType(currentDashboard)` |
| `dashboardId` | `currentDashboard.id` | Always set per tab |
| `householdId` | `resolveHouseholdId(currentDashboard)` | **Household only** |
| `businessId` | Usually null on personal variants | Business-type dashboard tabs exception |
| Installed modules | `PositionAwareModuleProvider` | May filter by context |
| Permission snapshot | `buildPersonalPermissionSnapshot` | Per installed modules |

**Fallback:** `PERSONAL_DEFAULT_MODULES` when position-aware provider unavailable — **engineering debt** (PD-9); registry should be authoritative in 2C.

---

## 4. Context-specific content

### 4.1 Personal

| Aspect | Behavior |
|--------|----------|
| **Creation** | "Blank tab" in create-dashboard modal |
| **Widgets** | All non-business-context widgets from `WIDGET_REGISTRY` |
| **Module routes** | Standard personal module tree |
| **Icon / tab label** | User-defined dashboard name |
| **Maturity** | **WS-L1 target** for personal variant |

### 4.2 Household

| Aspect | Behavior |
|--------|----------|
| **Creation** | "Home tab" → creates `household` via `/api/household` then linked dashboard |
| **Post-create** | Member invitation flow in Inner modal |
| **Widgets** | Same registry; household-scoped data via `dashboardId` + `householdId` |
| **Adjacent routes** | `/household/manage` — household domain management |
| **Module interiors** | Modules scope by dashboard; household APIs when applicable |
| **Maturity** | **WS-L0** — shell shared; household-specific module suite immature |

**PD-8 closure (governance):** ✅ Context documented. **Engineering:** household widget filtering rules; household module install list.

### 4.3 Education

| Aspect | Behavior |
|--------|----------|
| **Creation** | Educational dashboard type via dashboard model |
| **Creation route** | `/educational/create` (adjacent) |
| **Widgets** | Same registry; `educational` context alias |
| **Module routes** | Reuses personal module tree — **no education-specific module routes yet** |
| **Maturity** | **WS-L0** — type exists; product surface immature |

**PD-8 closure (governance):** ✅ Context documented. **Engineering:** education module route tree TBD.

---

## 5. Widget eligibility by variant

From `WIDGET_REGISTRY.contexts`:

| Widget category | `personal` | `household` | `educational` | `business` (on personal shell tab) |
|-----------------|:----------:|:-----------:|:-------------:|:----------------------------------:|
| Core product widgets | ✅ | ✅ | ✅ | ✅ where installed |
| `hr`, `scheduling` | ❌ | ❌ | ❌ | ✅ (`contexts: ['business']`) |
| Utility (`alwaysAvailable`) | ✅ | ✅ | ✅ | ✅ |

---

## 6. Routing invariants by variant

| ID | Invariant |
|----|-----------|
| V-1 | All variants use **`/dashboard/:dashboardId`** for grid home |
| V-2 | Module escalation always includes `?dashboard=:id` when from grid |
| V-3 | Variant does **not** change module route path prefix — only runtime scope |
| V-4 | Household creation must bind `householdId` before household-scoped module APIs |
| V-5 | Education variant must not claim UX certification until module routes exist |

---

## 7. Future extensibility

| Extension | Approach |
|-----------|----------|
| New context type (e.g. `community`) | Add `WorkspaceContextType` + dashboard model relation; **reuse shell** |
| Context-specific sidebar defaults | `defaultLeftSidebarConfig` per type in Inner or config service |
| Context-specific widget packs | Extend `WIDGET_REGISTRY.contexts` |
| Dedicated shell file | **Avoid** — charter dashboard archetype is one shell, multiple context types |
| Partner / marketplace dashboards | Separate runtime path (`modules/run`) — not personal variant |

---

## 8. PD-8 disposition

| Item | Wave 2B status |
|------|----------------|
| Boundary matrix for household/edu | ✅ **Complete** (this doc) |
| Context-specific routing rules | ✅ §6 invariants |
| Dedicated shell per variant | ❌ Not required — confirmed shared shell |
| Engineering: household module filter | ⏳ Wave 2C+ |
| Engineering: education route tree | ⏳ Future product wave |

---

## 9. Related

- [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](./PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) §8
- [CROSS_SURFACE_TRANSITIONS.md](./CROSS_SURFACE_TRANSITIONS.md)
- [WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](./WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md)

*Last updated: 2026-06-14 (Personal Dashboard Wave 2B)*
