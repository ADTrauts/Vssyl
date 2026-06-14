# Cross-Surface Transition Map

**Status:** Authoritative (Wave 2C)  
**Date:** 2026-06-14  
**Program:** [Reference Workspace Program](./audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md)  
**Surfaces:** Personal Dashboard · Business Workspace · Place (consumer / publisher)

> **Pattern stub:** `WS-REF-XWS-001` — cross-workspace transitions. Governance doc until pattern annex extraction.

---

## 1. Surface identifiers

| Surface | `surfaceId` | Primary chrome | URL family |
|---------|-------------|----------------|------------|
| Personal Dashboard | `personal-dashboard` | `DashboardLayoutInner` | `/dashboard/*`, `/{module}?dashboard=` |
| Business Workspace | `business-workspace` | `DashboardLayoutWrapper` | `/business/:id/workspace/*` |
| Place consumer | `place-consumer` | `PlacePageShell` / `PlaceContent` tab | `/place` |
| Place publisher | `place-publisher` | `PlaceWorkspaceLanding` | `/business/:id/workspace/place` |
| Work tab (adjacent) | `work-tab-embed` | `BrandedWorkDashboard` | In-tab; links to business workspace |

---

## 2. Ownership boundaries on transitions

| Layer | Owns transition | Must not own |
|-------|-----------------|--------------|
| **Shell** | Router push target; context switch; active tab state | Product data load on destination |
| **Runtime bridge** | `contextType`, `businessId`, `householdId`, `dashboardId` rebinding | Module permissions implementation |
| **Module destination** | Interior mount; authorized reads/writes | Sidebar chrome of other surface |
| **Platform global** | Session, search, notifications bell | Module-specific routing |

---

## 3. Personal → Business

| Trigger | Source owner | Canonical target | Href pattern | Runtime effect |
|---------|--------------|------------------|--------------|----------------|
| Work tab → select business | `WorkTab` | Business workspace hub | `/business/:businessId/workspace` | `contextType: business`; `BusinessLayoutRuntimeShell` |
| Work tab → branded dashboard module | `BrandedWorkDashboard` | Business module segment | `buildBusinessWorkspaceModuleHref(businessId, moduleId)` | Same |
| Business-type dashboard tab + members sidebar | `DashboardContext` | Business members page | `/business/:businessId/workspace/members` | Cross-surface; leaves personal grid |
| Global header "switch to work" | Inner | Work tab or business workspace | Context-dependent | `WorkAuth` |

**Boundary:** Personal shell **orchestrates** exit; business shell **owns** destination mount. Personal must not embed business module interiors inline (contrast: pre-1B business stubs — resolved).

---

## 4. Business → Personal

| Trigger | Source owner | Canonical target | Href pattern | Runtime effect |
|---------|--------------|------------------|--------------|----------------|
| Switch to personal (header) | `DashboardLayoutWrapper` | Personal dashboard hub | `/dashboard` or last active `/dashboard/:id` | `contextType: personal` |
| Post-work logout | `WorkAuth` + Inner | Personal dashboard | `/dashboard` | Clears work auth context |
| Business route → personal module (edge) | Rare — avoid | `/{module}?dashboard=:personalDashboardId` | Manual / bookmark only |

**Boundary:** Business shell must not persist business-only scope on personal destination. `handleSwitchToPersonal` is business-owned transition helper.

---

## 5. Personal → Place

| Trigger | Source owner | Canonical target | Href pattern | Notes |
|---------|--------------|------------------|--------------|-------|
| Place global tab | `DashboardLayoutInner` | Place tab embed | In-tab `PlaceContent` | Sidebar remains visible |
| Sidebar / direct nav | Module route | Place consumer | `/place` | `PlacePageShell` |
| Widget (future PlaceWidget) | Widget escalation | `/place` | Not implemented |

**Boundary:** Consumer Place — **not** publisher. Publisher is business-only (§6).

---

## 6. Business → Place

| Trigger | Source owner | Canonical target | Href pattern | Archetype |
|---------|--------------|------------------|--------------|-----------|
| Business sidebar Place module | `DashboardLayoutWrapper` | Publisher hub | `/business/:id/workspace/place` | Publisher workspace |
| Place consumer (user intent) | User navigation | Consumer graph | `/place` | Dual-surface product (UX #6) |

**Teaching rule:** Same `moduleId` (`place`), different **workspace archetype** — publisher mounts in hub switch; consumer mounts in personal tab or `/place` route.

---

## 7. Dashboard widget → module

| Trigger | Source owner | Canonical target | Scope param |
|---------|--------------|------------------|-------------|
| Widget escalation link | Widget component | `/{moduleId}?dashboard={activeDashboardId}` | Required when from grid |
| Widget CTA (AI) | `AIWidget` | `/ai-chat` | Optional dashboard context |
| Utility widget | Widget | `/notifications`, etc. | Per routing contract |

**Boundary:** Widget **never** mounts full module — escalation only. Shell grid unmounts when module route active.

---

## 8. Module → dashboard return

| Trigger | Source owner | Canonical target | Behavior |
|---------|--------------|------------------|----------|
| Sidebar dashboard click | `navigateToModule('dashboard')` or dashboard tab | `/dashboard/:id` | Returns to grid |
| Global dashboard tab | `DashboardLayoutInner` | `/dashboard/:id` | Sets `currentDashboardId` |
| `navigateToDashboard` while in module | `DashboardContext` | `/{module}?dashboard={newId}` or `/dashboard/{newId}` | Preserves module if mid-flow |
| Browser back | User | Previous URL | Shell resolves active state from pathname |

**Boundary:** Module routes must not trap user — sidebar always offers dashboard tab return via PlatformShell.

---

## 9. URL translation matrix (asymmetry)

Business segment-canonical vs personal query-canonical — **intentional**; translation via shared helpers (Wave 2C).

| Intent | Personal canonical | Business canonical | Helper |
|--------|-------------------|-------------------|--------|
| Open Drive | `/drive?dashboard=:id` | `/business/:bid/workspace/drive` | `buildWidgetToModuleHref` / `buildPersonalToBusinessHref` |
| Open Chat | `/chat?dashboard=:id` | `/business/:bid/workspace/chat` | Same |
| Open Place (consumer) | `/place` or Place tab | N/A — use publisher segment | `buildPersonalToPlaceHref` |
| Open Place (publisher) | N/A | `/business/:bid/workspace/place` | `buildBusinessToPlaceHref` |
| Hub / grid home | `/dashboard/:id` | `/business/:bid/workspace` | `buildModuleToDashboardReturnHref` / `buildBusinessToPersonalHref` |

**Implementation:** `web/src/lib/crossSurfaceNavigation.ts`

---

## 10. Transition invariants

| ID | Invariant |
|----|-----------|
| X-1 | Every documented transition has **one canonical target** per source surface |
| X-2 | Cross-surface transitions **rebind runtime scope** before destination render |
| X-3 | Personal → Business never uses legacy `?module=` for **new** navigation (business 1C rule) |
| X-4 | Place publisher never mounts in personal grid widget without contract update |
| X-5 | Widget escalation and sidebar navigation **converge** on same module-route href |

---

## 11. Related

- [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](./PERSONAL_DASHBOARD_ROUTING_CONTRACT.md)
- [WORKSPACE_ROUTING_CONTRACT.md](./WORKSPACE_ROUTING_CONTRACT.md)
- [PERSONAL_DASHBOARD_WIDGET_CONTRACT.md](./PERSONAL_DASHBOARD_WIDGET_CONTRACT.md)

*Last updated: 2026-06-03 (Personal Dashboard Wave 2C)*
