# Dashboard Domain Boundary Analysis

**Program:** Workspace & Dashboard Constitutional Review  
**Assessment date:** 2026-06-21  
**Status:** Discovery only — no implementation, no certification, no ledger changes

**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §0.1, §3; [WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](../architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md); [WORKSPACE_OWNERSHIP_MODEL.md](../workspace/WORKSPACE_OWNERSHIP_MODEL.md)

---

## Purpose

Define constitutional ownership boundaries for everything labeled "Dashboard" in code, docs, and ledger. Resolve whether Dashboard Wave 3 is a module program or a workspace program.

---

## 1. Boundary model (authoritative)

**Classification: C — Hybrid ownership** (affirmed WS-L3-1, WS-L3-3, WORKSPACE_OWNERSHIP_MODEL §Dashboard boundary)

```
┌─────────────────────────────────────────────────────────────────┐
│  Reference Workspace Program (WS-L3 WITH FINDINGS — ARCHIVED)    │
│  ┌──────────────────────────┐  ┌────────────────────────────┐ │
│  │ Business Workspace shell │  │ Personal Dashboard shell    │ │
│  │ PlatformShell + switch   │  │ PlatformShell + tabs/routes │ │
│  │ businessWorkspaceNav SSOT│  │ personalDashboardNav SSOT   │ │
│  └────────────┬─────────────┘  └──────────────┬───────────────┘ │
│               │ mounts                         │ mounts         │
│               ▼                                ▼                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Module interiors (Drive, HR, Chat, …) — module teams own     ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ widget projections (personal only)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard MODULE (`dashboard` id) — L1, independent L3 track  │
│  DashboardClient · widgetRegistry · dashboardService · Widget*   │
│  /api/dashboard/* · AI context providers · module manifest       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ tenancy anchor (cross-cutting)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard ENTITY (Prisma) — platform tenancy + layout store   │
│  businessId / householdId / institutionId + widgets[]          │
└─────────────────────────────────────────────────────────────────┘
```

**Invariant:** Shell must not perform module mutations. Widget grid mutations belong to Dashboard module services, not workspace switch/grid orchestrators.

---

## 2. Ownership matrix

| Concern | Owner | In workspace cert? | In module cert? |
|---------|-------|---------------------|-----------------|
| `PlatformShell` geometry (3C-4E/4F) | Platform Shell / UX | ✅ WS-L3 | ❌ |
| Business module switch | Business Workspace | ✅ WS-L3 | ❌ |
| Personal tabs + sidebar chrome | Personal Dashboard shell | ✅ WS-L3 | ❌ |
| `personalDashboardNavigation.ts` | Personal Dashboard shell | ✅ WS-L3 | ❌ |
| `businessWorkspaceNavigation.ts` | Business Workspace | ✅ WS-L3 | ❌ |
| `DashboardLayoutInner` orchestration | Personal Dashboard shell | ✅ WS-L3 | ❌ |
| `DashboardClient` widget grid | **Dashboard module** | ❌ Out of scope | ✅ Target L3 |
| `widgetRegistry.ts` / `WidgetPicker` | **Dashboard module** | ❌ | ✅ |
| `dashboardService.ts` / controller | **Dashboard module** | ❌ | ✅ |
| `Dashboard` / `Widget` Prisma models | **Shared — split concern** | Tenancy binding | Layout/widgets |
| Business hub `case 'dashboard'` | **Workspace stub** | ✅ (retire stub → delegate) | 🟡 Overlap |
| `BrandedWorkDashboard` hub cards | Business Workspace | ✅ WS-L3 | ❌ |
| Sidebar customization API | Dashboard prefs slice | 🟡 Hybrid | 🟡 Hybrid |
| Enterprise dashboard wrapper | Dashboard module (gated) | ❌ | ✅ |

---

## 3. Is Dashboard a true module?

### 3.1 Module contract checklist (moduleSpecs.md + §3 platform standards)

| Criterion | Dashboard module | Verdict |
|-----------|------------------|---------|
| Registered built-in (`registerBuiltInModules.ts`) | ✅ `id: 'dashboard'` | **Met** |
| ModuleAIContext + providers | ✅ overview, quick-stats, widgets | **Met** |
| Canonical services | 🟡 `dashboardService.ts` — partial; dual registry | **Partial** |
| Thin controllers | 🟡 Present; some fat paths | **Partial** |
| Normalized activity events | 🔴 Weak / missing for widget lifecycle | **Gap** |
| Policy Engine on writes | 🟡 Partial | **Partial** |
| Global Trash (widgets) | 🟡 Partial | **Partial** |
| WorkspaceLanding hub (business) | ❌ Uses `BusinessWorkspaceHubPanel` stub | **Gap** |
| Tenant scoping | ✅ dashboardId + context ids | **Met** |
| Manifest completeness | 🟡 Minimal on fresh deploy (§0.4) | **Partial** |

**Determination:** Dashboard **is a true module** for widget/grid product semantics — but **not a complete L3 module** today. It fails reference-module completeness (activity, registry unification, hub pattern).

### 3.2 What is NOT the Dashboard module

| Artifact | Actual owner |
|----------|--------------|
| `/dashboard/layout.tsx` shell wrapper | Personal Dashboard shell |
| `DashboardLayoutWrapper` in business workspace | Business Workspace shell |
| `useEnsureBusinessDashboard` | Platform tenancy binding |
| Default personal landing route `/dashboard` | Workspace routing policy |
| `Dashboard` row as tenant key for Chat/Drive/etc. | Platform tenancy (kernel-adjacent) |

---

## 4. Is Dashboard a workspace composition surface?

**Yes — for orchestration layers only.**

| Surface | Composition behavior |
|---------|---------------------|
| Business Workspace | Switch mounts modules; `dashboard` case shows hub panel stub |
| Personal Dashboard shell | Routes to module pages; hosts widget grid container |
| Workspace runtime | Derives `availableModules` / `availableWidgets` from contracts |

**No — for product semantics.** Widget types, layout persistence, edit mode, templates, and widget CRUD are **module product**, not shell orchestration.

**Constitutional rule (WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS):** *Module = capability; widget = projection.* Workspace derives availability; Dashboard module owns projection registry and grid lifecycle.

---

## 5. Certification track analysis

| Track | Scope | Status | Dashboard module included? |
|-------|-------|--------|------------------------------|
| **WS-L1 → WS-L3** | Shell orchestration (both co-surfaces) | **ARCHIVED** CwF | **No** — explicit at award |
| **Module L1 → L3** | Product module interoperability | **Not started** (Wave 3) | **Yes** — sole target |
| **UX Reference** | Module interior UX | Not registered for Dashboard | Optional future |

### Required questions (Dashboard-specific)

| # | Question | Answer |
|---|----------|--------|
| 3 | Independent certification track? | **Yes** — module L3 track separate from WS-L3 |
| 4 | Governed by Workspace instead? | **Shell layers yes; module product no** |

**Anti-pattern:** Using WS-L3 certificate to claim Dashboard module L3 readiness — explicitly forbidden by WORKSPACE_CERTIFICATION_RECORD § "What this record is NOT."

---

## 6. Business vs personal Dashboard divergence

| Context | Dashboard experience | Owner |
|---------|---------------------|-------|
| **Personal** | Full `DashboardClient` widget grid at `/dashboard/:id` | Dashboard module product |
| **Business** | `BusinessWorkspaceHubPanel` stub on switch case | Workspace stub — **leak** per BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT |
| **Business enterprise** | `DashboardModuleWrapper` → `EnhancedDashboardModule` | Dashboard module (feature-gated) — parallel path |

**Boundary defect:** Business workspace `dashboard` case overlaps Dashboard module / widgets without delegating to module services. Modernization roadmap §5.8 calls to retire stub widgets and delegate to Dashboard module APIs.

---

## 7. Dual registry boundary

| Registry | Location | Authority today |
|----------|----------|---------------|
| `WIDGET_REGISTRY` | `web/src/components/dashboard/widgetRegistry.ts` | **Rendering authoritative** |
| `coreModuleRegistry` | `web/src/runtime/modules/coreModuleRegistry.ts` | Contract metadata; `dashboard` has `widgets: []` |
| Module manifests | DB via startup registration | Capability truth (partial drift) |

**Wave 3 focus (roadmap §5.6):** Consolidate to one capability resolution path — module boundary work, not workspace shell work.

---

## 8. Adjacent domain boundaries

| Adjacent domain | Relationship to Dashboard |
|-----------------|---------------------------|
| **Account Platform / Settings** | Sidebar prefs overlap; AP domain map excludes widget grid to Dashboard Wave 3 |
| **Admin Portal** | Operator dashboard at `/admin-portal/dashboard` — **not** product Dashboard module |
| **Notifications** | Widget projection + header bell — separate notification service |
| **AI Platform** | AIWidget delegates to module AI; dashboard AI context is module-owned |
| **File Hub** | Drive widget is projection; Drive module owns data |

---

## 9. Long-term architecture recommendation

1. **Preserve WS-L3 shell certification** — advisory burn-down only; no program reopen.
2. **Proceed Dashboard Module Wave 3** scoped to: widget registry unification, `dashboardService` extraction, activity emissions, tenancy/layout domain clarification, business hub delegation (retire stub).
3. **Rename initiative** in portfolio docs from "Dashboard Wave 3" to **"Dashboard Module Wave 3"** to prevent workspace conflation.
4. **Optional future:** Split Prisma `Dashboard` into tenancy context record vs layout document — charter required before schema work.

---

## 10. Wave 3 authorization gate

| Gate | Pass? |
|------|-------|
| Shell boundary documented | ✅ (this review + prior WS-L3) |
| Dashboard module distinct from shell | ✅ |
| WS-L3 not reopened | ✅ |
| Tenancy entanglement acknowledged | ✅ |
| Business stub overlap documented | ✅ |

**Recommendation:** Authorize **Dashboard Module Wave 3** (constitutional audit + service extraction charter) — **not** Workspace Experience replacement.

---

**Last updated:** 2026-06-21
