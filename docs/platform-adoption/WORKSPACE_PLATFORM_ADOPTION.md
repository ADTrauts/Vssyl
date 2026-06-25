# Workspace Platform Adoption

**Program:** Platform Capability Adoption — Wave 4  
**Date:** 2026-06-25  
**Status:** Complete

---

## 1. Personal vs business workspace

| Surface | Dashboard model | Widget registry | Platform capabilities |
|---------|-----------------|-----------------|----------------------|
| **Personal dashboard** | `Dashboard.userId` scoped | `widgetRegistry.ts` (13 types) | Search, AI, Kernel activity |
| **Business workspace** | Module hubs + optional business dashboards | Same registry; business-context widgets | Same providers; `businessId` on dashboard |

**Consistency rule:** Composition widget search and activity use the **dashboard module** — not duplicate widget modules.

---

## 2. Implementation map

| Capability | Entry point | Widget coverage |
|------------|-------------|-----------------|
| Unified Search | `dashboardSearchProvider` | quicknotes, bookmarks |
| AI Retrieval | `discover()` fan-out | Via dashboard search hits |
| Platform Kernel | `dashboardActivityService` | quicknote/bookmark create |
| Policy Engine | `dashboardPolicyDual` | Dashboard ownership on search |
| AI context | `dashboardAIContextService` | Overview + quick-stats routes |

---

## 3. Out of scope (by design)

| Widget | Why not full search |
|--------|---------------------|
| quickstats | Aggregated KPIs — not discrete searchable entities |
| notifications | Module widget — notification module search N/A |
| Module widgets | Owned by respective module providers |

---

## 4. Workspace shortcuts

External bookmark URLs are indexed as **dashboard bookmarks** — not a separate shortcut search provider.

---

## 5. Tests

| File | Coverage |
|------|----------|
| `dashboardWidgetVisibilityService.test.ts` | Search + PE |
| `widgetServiceCompositionActivity.test.ts` | Kernel emit on create |
| `dashboardActivityService.test.ts` | New activity actions |
| `searchProviderRegistry.test.ts` | Manifest parity |

**Last updated:** 2026-06-25
