# Dashboard Module — Widget Architecture Audit

**Program:** Dashboard Module Wave 3 — Phase 0A Constitutional Audit  
**Assessment date:** 2026-06-21  
**Status:** Discovery only

**Registry authority:** `web/src/components/dashboard/widgetRegistry.ts`  
**Rendering authority:** `DashboardClient.tsx` + `WidgetContentRenderer` (via personal dashboard contracts)

---

## 1. Executive determination

| Question | Answer |
|----------|--------|
| Is Dashboard primarily a widget host? | **Yes** — grid + registry + instance persistence is the core product |
| Does Dashboard own data? | **Composition data only** (`Widget`, layout JSON, widget-local config) |
| Does Dashboard only aggregate data? | **Mostly yes for utility widgets** — but violates this today via AI quick-stats, enterprise panels, and placeholder activity feed |

---

## 2. Registry summary

- **13 registered widget types** in `WIDGET_REGISTRY`
- **12 mounted** in `DashboardClient` component map (notebook yes; notes legacy unused)
- **5 alwaysAvailable** utility widgets (ai, notifications, quickstats, quicknotes, bookmarks, activityfeed)
- **2 business-only** (hr, scheduling)
- **Dual contract:** `coreModuleRegistry` lists `dashboard.widgets: []` — drift

---

## 3. Widget inventory matrix

| Widget id | Display name | moduleId | Data source | API dependencies | AI dep | Personal | Business |
|-----------|--------------|----------|-------------|------------------|--------|----------|----------|
| **chat** | Chat | chat | Chat module | `getConversations(token, dashboardId)` | ❌ | ✅ | ✅ |
| **drive** | File Hub | drive | Drive module | Drive widget internal fetches | ❌ | ✅ | ✅ |
| **calendar** | Calendar | calendar | Calendar module | `calendarAPI.listEvents` | ❌ | ✅ | ✅ |
| **todo** | To-Do | todo | Todo module | `getTasks(token, { dashboardId })` | ❌ | ✅ | ✅ |
| **notebook** | Notebook | notebook | Notebook module | Notebook widget API reads | ❌ | ✅ | ✅ |
| **ai** | AI Assistant | ai | AI module | Delegates to `AIChatModule` / AI routes | ✅ | ✅ | ✅ |
| **notifications** | Notifications | notifications | Notification platform | Notification list APIs | ❌ | ✅ | ✅ |
| **quickstats** | Quick Stats | quickstats | **Aggregated** | `getConversations`, `getTasks`, `calendarAPI` | ❌ | ✅ | ✅ |
| **quicknotes** | Quick Notes | quicknotes | **Widget config only** | None — local `widget.config` | ❌ | ✅ | ✅ |
| **bookmarks** | Bookmarks | bookmarks | **Widget config only** | None — local `widget.config` | ❌ | ✅ | ✅ |
| **activityfeed** | Activity Feed | activityfeed | **Platform activity** | `/api/activity-feed?dashboardId=` | ❌ | ✅ | ✅ |
| **hr** | HR | hr | HR module | `/api/hr/dashboard-summary?businessId=` | ❌ | ❌ | ✅ |
| **scheduling** | Scheduling | scheduling | Scheduling module | Scheduling widget internal API | ❌ | ❌ | ✅ |

### 3.1 Legacy / unregistered

| Component | Status |
|-----------|--------|
| `NotesWidget.tsx` | Exists; **not** in registry or `DashboardClient` — superseded by `notebook` |

### 3.2 Enterprise panels (not WIDGET_REGISTRY entries)

| Panel | Location | Data source | Scope |
|-------|----------|-------------|-------|
| `ExecutiveAnalyticsPanel` | `enterprise/` | **Client mock / generated** | Business enterprise |
| `CrossModuleAnalyticsPanel` | `enterprise/` | **Client mock / generated** | Business enterprise |
| `EnhancedDashboardModule` | `enterprise/` | Composes panels + mock metrics | Business feature-gated |
| `DashboardEnterpriseShowcase` | `enterprise/` | Marketing/showcase | Business upsell |

---

## 4. Ownership domain per widget

| Domain | Widgets |
|--------|---------|
| **Chat** | chat |
| **Drive** | drive |
| **Calendar** | calendar |
| **Todo** | todo |
| **Notebook** | notebook |
| **AI Platform** | ai |
| **Notifications platform** | notifications |
| **HR module** | hr |
| **Scheduling module** | scheduling |
| **Dashboard-local (config SoR)** | quicknotes, bookmarks |
| **Dashboard + cross-module read (should be Analytics)** | quickstats |
| **Platform activity read (not Analytics SoR)** | activityfeed |
| **Unowned mock analytics (defect)** | enterprise panels |

---

## 5. Data flow architecture

```
User grid (DashboardClient)
    │
    ├─► Widget instance (Widget row: type, config, position)
    │
    └─► Widget component
            │
            ├─► Module API (chat, drive, todo, …)     ← correct pattern
            ├─► widget.config JSON only               ← correct for bookmarks/notes
            ├─► /api/activity-feed                    ← platform read (host)
            ├─► Multi-module client aggregate         ← quickstats (should delegate)
            └─► Mock/setState metrics                 ← enterprise (violates trust)
```

---

## 6. Widget lifecycle

| Stage | Owner | Persistence |
|-------|-------|-------------|
| Type registration | `widgetRegistry.ts` | Code |
| Eligibility | `getAvailableWidgets(installedModuleIds, dashboardType)` | Runtime |
| Picker | `WidgetPicker` + `getWidgetPickerAvailableEntries` | — |
| Create instance | POST `/api/widget/:dashboardId/widgets` | `Widget` row |
| Layout | `DashboardGrid` + batch positions API | `Widget.position`, `Dashboard.layout` |
| Delete | DELETE `/api/widget/:id` | Hard delete (no widget trash) |
| Config update | PUT `/api/widget/:id` | `Widget.config` |

**Gap:** Widget delete is hard delete — Global Trash integration for widgets is partial/unclear vs module standard.

---

## 7. Personal vs business widget behavior

| Widget | Personal behavior | Business behavior |
|--------|-------------------|-------------------|
| hr, scheduling | Hidden (contexts filter) | Shown when installed |
| quickstats | Aggregates user-scoped module APIs | Same — **may ignore businessId scope** |
| hr | N/A | Requires `businessId` on dashboard row |
| Enterprise panels | Not shown | Feature gate via `DashboardModuleWrapper` |

**Scope risk:** `useDashboardStats` and `QuickStatsWidget` key off `dashboardId` but aggregate user-global task counts (`createdById: userId` in AI provider) — tenant scoping inconsistency.

---

## 8. AI dependencies

| Surface | AI integration |
|---------|----------------|
| `ai` widget | Full AI chat delegation |
| AI context providers | Overview, quick-stats, widgets — registered for twin |
| Enterprise panels | No orchestrator — local mock |
| Other widgets | None direct |

---

## 9. Architectural assessment

### Strengths

- Clear registry with categories and context filters
- Module-aligned widget ids map to `moduleId`
- WidgetPicker scopes to installed modules
- `isRegisteredWidgetType` guard in renderer (drift CI)
- Most widgets correctly delegate to module APIs

### Defects

| Defect | Impact |
|--------|--------|
| Utility widgets perform client-side aggregation | Duplicates Analytics capability |
| ActivityFeed placeholder fallback on API failure | **Constitutional trust violation** — fake activity |
| Enterprise panels generate mock metrics | **Trust violation** — presents as real analytics |
| `coreModuleRegistry` empty widgets array | Capability resolution lies |
| quickstats moduleId `quickstats` not a real module | Pseudo-module pattern (like analytics) |

---

## 10. Answers to required questions

| # | Question | Answer |
|---|----------|--------|
| 4 | Primarily widget platform? | **Yes** |
| 5 | Owns business data? | **No** — owns widget/layout records only |
| — | Only aggregates? | **Should be** — but currently aggregates + mocks in utility/enterprise surfaces |

---

**Last updated:** 2026-06-21
