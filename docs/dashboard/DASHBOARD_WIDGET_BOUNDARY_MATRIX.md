# Dashboard Module — Widget Boundary Matrix

**Program:** Dashboard Module Wave 3 — Package 3 Authorization Review  
**Review date:** 2026-06-21  
**Status:** Governance only — authoritative classification

**Registry source:** `web/src/components/dashboard/widgetRegistry.ts` (13 types)

---

## 1. Classification definitions

| Class | Definition | Dashboard role |
|-------|------------|------------------|
| **Composition widget** | Widget-local config or dashboard metadata only; no cross-module rollup | SoR for config |
| **Analytics widget** | Cross-module derived KPIs / rollups | Host UI only; consume Analytics |
| **Module widget** | Single-domain summary via owning module API | Host UI; module owns data |
| **Hybrid widget** | Dashboard chrome + non-dashboard data owner (activity, analytics) | Host + integrate |

---

## 2. Registry widget matrix

| Widget ID | Class | Data owner | API / source today | Package 3 action |
|-----------|-------|------------|-------------------|------------------|
| **chat** | Module | Chat | `getConversations(token, dashboardId)` | None |
| **drive** | Module | Drive | Drive list APIs | Remove random share badges; optional quota API |
| **calendar** | Module | Calendar | `calendarAPI.listEvents` | None |
| **todo** | Module | Todo | `getTasks(token, { dashboardId })` | None |
| **notebook** | Module | Notebook | Notebook widget API | None |
| **ai** | Module | AI | AI module delegation | None |
| **notifications** | Module | Notifications | Notification list APIs | None |
| **quickstats** | **Analytics** | **Analytics Capability** | Client aggregate ❌ | **Facade required** |
| **quicknotes** | Composition | Dashboard | `Widget.config` JSON | None |
| **bookmarks** | Composition | Dashboard | `Widget.config` JSON | None |
| **activityfeed** | Hybrid | **Platform activity** | `/api/activity-feed` | None (B4 closed P1) |
| **hr** | Module | HR | `/api/hr/dashboard-summary` | None |
| **scheduling** | Module | Scheduling | `/api/scheduling/dashboard-summary` | None |

---

## 3. Counts

| Class | Count | Widget IDs |
|-------|------:|------------|
| **Module widget** | 10 | chat, drive, calendar, todo, notebook, ai, notifications, hr, scheduling, (activityfeed excluded — hybrid) |
| **Composition widget** | 2 | quicknotes, bookmarks |
| **Analytics widget** | 1 | quickstats |
| **Hybrid widget** | 1 | activityfeed (platform activity — not Analytics) |

---

## 4. Non-registry surfaces (enterprise)

| Surface | Class | Data owner | Mounted in prod? | Package 3 |
|---------|-------|------------|------------------|-----------|
| `ExecutiveAnalyticsPanel` | Analytics | Analytics Capability | **No** | Facade or permanent gate |
| `CrossModuleAnalyticsPanel` | Analytics | Analytics Capability | **No** | Facade or permanent gate |
| `EnhancedDashboardModule` | Analytics shell | Analytics Capability | **No** | Wire or waive |
| `DashboardEnterpriseShowcase` | Demo / marketing | N/A | Yes (business upsell) | Out of scope |

---

## 5. Grid-level consumers (not widgets)

| Consumer | Class | Owner | Package 3 |
|----------|-------|-------|-----------|
| `useDashboardStats` | Analytics projection | Analytics | → facade (dedup with quickstats) |
| `DashboardClient` loader | Composition | Dashboard | None |
| `DashboardHeader` stats display | Analytics consumer | Analytics via facade | → facade |

---

## 6. Authoritative ownership matrix

| Widget / surface | Composition | Analytics | Module | Hybrid | Primary owner |
|------------------|:-----------:|:---------:|:------:|:------:|---------------|
| chat | | | ✅ | | **Module** |
| drive | | | ✅ | | **Module** |
| calendar | | | ✅ | | **Module** |
| todo | | | ✅ | | **Module** |
| notebook | | | ✅ | | **Module** |
| ai | | | ✅ | | **Module** |
| notifications | | | ✅ | | **Module** |
| quickstats | | ✅ | | | **Analytics** |
| quicknotes | ✅ | | | | **Dashboard** |
| bookmarks | ✅ | | | | **Dashboard** |
| activityfeed | | | | ✅ | **Platform activity** |
| hr | | | ✅ | | **Module** |
| scheduling | | | ✅ | | **Module** |
| Executive / Cross-module panels | | ✅ | | ✅ | **Analytics** |
| useDashboardStats | | ✅ | | | **Analytics** |

---

## 7. Registry defect (DASH-M1 / DASH-A6)

| Issue | Detail |
|-------|--------|
| `quickstats` `moduleId: 'quickstats'` | Pseudo-module in `WIDGET_REGISTRY` and `coreModuleRegistry` |
| Not in `registerBuiltInModules.ts` | Not a true module |

**Package 3 disposition:** Reclassify as **capability-backed widget** — `moduleId` → `analytics` or `dashboard` with `capabilityId: 'analytics'` per registry unification charter.

---

## 8. Trust alignment (post–P1/P2)

| Class | Untrusted in default path | Package 3 target |
|-------|---------------------------|------------------|
| Analytics widget | quickstats (partial — client rollup + fake storage) | Trusted via facade |
| Module widgets | drive (partial — random share) | Hygiene fix |
| Enterprise analytics | Gated off | Facade or documented waiver |

---

**Last updated:** 2026-06-21
