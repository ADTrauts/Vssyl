# Dashboard Module — Widget Trust Audit

**Program:** Dashboard Module Wave 3 — Phase 0B Constitutional Operations Audit  
**Assessment date:** 2026-06-21  
**Status:** Discovery only

**Registry:** `web/src/components/dashboard/widgetRegistry.ts` (13 types)  
**Enterprise surfaces:** Not registry entries — included as product projections

---

## 1. Trust classification definitions

| Class | Meaning |
|-------|---------|
| **Trusted** | Data from authorized module/platform API; no mock on failure; scope honest |
| **Partially Trusted** | Real API core; synthetic fields, demo constants, or weak scope on failure |
| **Untrusted** | Mock metrics, placeholder fallback, or fabricated data presented as live |

---

## 2. Registry widget audit

| Widget | Authoritative source | Fallback | Mock behavior | AI dep | Analytics dep | Trust |
|--------|---------------------|----------|---------------|--------|---------------|-------|
| **chat** | `getConversations(token, dashboardId)` | Empty list on error | None | ❌ | ❌ | **Trusted** |
| **drive** | Drive list/upload APIs | Error message | `Math.random()` share badges; 10GB demo storage cap | ❌ | ❌ | **Partially Trusted** |
| **calendar** | `calendarAPI.listEvents` | Empty on error | None | ❌ | ❌ | **Trusted** |
| **todo** | `getTasks(token, { dashboardId })` | Empty on error | None | ❌ | ❌ | **Trusted** |
| **notebook** | Notebook widget API reads | Empty on error | None | ❌ | ❌ | **Trusted** |
| **ai** | AI chat module delegation | Loading state | None | ✅ | ❌ | **Trusted** |
| **notifications** | Notification list APIs | Empty on error | None | ❌ | ❌ | **Trusted** |
| **quickstats** | Client aggregate: chat + todo + calendar (+ storage calc) | Keeps prior stats | None explicit; wrong scope risk | ❌ | ✅ **Yes** | **Partially Trusted** |
| **quicknotes** | `Widget.config` JSON only | Default empty | None | ❌ | ❌ | **Trusted** *(local)* |
| **bookmarks** | `Widget.config` JSON only | Default empty | None | ❌ | ❌ | **Trusted** *(local)* |
| **activityfeed** | `/api/activity-feed?dashboardId=` | **`generatePlaceholderActivities()`** | **Fake 4-item feed** | ❌ | 🟡 Activity not analytics | **Untrusted** |
| **hr** | `/api/hr/dashboard-summary?businessId=` | Error UI | None | ❌ | 🟡 Domain metrics | **Trusted** |
| **scheduling** | `/api/scheduling/dashboard-summary?businessId=` | Error UI | None | ❌ | 🟡 Domain metrics | **Trusted** |

### 2.1 Legacy (unregistered)

| Component | Status |
|-----------|--------|
| `NotesWidget.tsx` | Not mounted — **N/A** |

---

## 3. Enterprise projection audit (non-registry)

| Surface | Authoritative source | Fallback | Mock | Trust |
|---------|---------------------|----------|------|-------|
| `EnhancedDashboardModule` | None — client | Loading spinner | **Full mockQuickMetrics + mockAlerts** | **Untrusted** |
| `ExecutiveAnalyticsPanel` | None | — | **mockMetrics, departments, compliance, alerts** | **Untrusted** |
| `CrossModuleAnalyticsPanel` | None | — | **mockModuleMetrics, insights, journeys** | **Untrusted** |
| `DashboardEnterpriseShowcase` | Marketing copy | — | Showcase/demo intentional | **Partially Trusted** *(labeled upsell)* |

---

## 4. Client hooks (grid-level)

| Hook / component | Source | Mock | Trust |
|------------------|--------|------|-------|
| `useDashboardStats` | Chat, Todo, Calendar APIs | Silent catch — stale data | **Partially Trusted** |
| `DashboardClient` grid loader | GET dashboard + widgets | Skeleton only | **Trusted** |

---

## 5. AI context providers (widget-adjacent)

| Provider | Source | Mock | Trust |
|----------|--------|------|-------|
| `overview` | Dashboard + widget metadata | None | **Trusted** |
| `widgets` | Widget inventory | None | **Trusted** |
| `quick-stats` | Cross-module Prisma | `.catch(() => 0)` zeros | **Partially Trusted** / **Untrusted** for cross-domain |

---

## 6. Summary counts

| Trust class | Widgets / surfaces |
|-------------|-------------------:|
| **Trusted** | **9** (chat, calendar, todo, notebook, ai, notifications, hr, scheduling, bookmarks/quicknotes local) |
| **Partially Trusted** | **4** (drive, quickstats, useDashboardStats, enterprise showcase) |
| **Untrusted** | **4** (activityfeed, EnhancedDashboardModule, ExecutiveAnalyticsPanel, CrossModuleAnalyticsPanel) |

---

## 7. Required questions

| # | Question | Answer |
|---|----------|--------|
| 5 | Which widgets are trusted? | **9** registry widgets (see §2) |
| 6 | Which widgets are untrusted? | **activityfeed** + **3 enterprise panels** (4 total surfaces) |

---

## 8. Remediation policy (constitutional — not implementation)

| Trust | Policy |
|-------|--------|
| **Untrusted** | **Must not ship** in production without `FeatureGate off`, explicit demo label, or real API backing before L2 |
| **Partially Trusted** | Remove synthetic fields; delegate aggregates to Analytics capability; fix scope |
| **Trusted** | Maintain module API delegation; add PE parity on host reads where missing |

---

## 9. Cross-reference

| Finding | Widgets |
|---------|---------|
| DASH-B4 | activityfeed |
| DASH-B5 | enterprise panels, EnhancedDashboardModule |
| DASH-B3 | quick-stats AI provider (not widget but same aggregate class) |
| DASH-M6 | quickstats, useDashboardStats |

---

**Last updated:** 2026-06-21
