# Dashboard Module — Analytics Ownership Review

**Program:** Dashboard Module Wave 3 — Package 3 Authorization Review  
**Review date:** 2026-06-21  
**Status:** Governance only

**Authority:** [DASHBOARD_ANALYTICS_SEPARATION_CHARTER.md](./DASHBOARD_ANALYTICS_SEPARATION_CHARTER.md) AS-1 through AS-6

---

## 1. Executive determination

Cross-module **derived metrics** belong to the **Platform Analytics Capability**. Dashboard owns **composition state** and **widget hosting** only. Module APIs own **domain summaries** (HR, Scheduling). Platform activity owns the **immutable activity feed** — not Analytics warehouse.

**Dashboard must not continue owning analytics projections** after Package 3.

---

## 2. Ownership principles (constitutional)

| ID | Rule |
|----|------|
| **AS-1** | Dashboard owns composition state (`Widget`, layout, preferences) |
| **AS-2** | Analytics owns derived cross-module metrics |
| **AS-3** | Module APIs own domain summaries |
| **AS-4** | Platform activity owns immutable event feed reads |
| **AS-5** | Dashboard consumes Analytics; never computes rollups in controllers |
| **AS-6** | No mock metrics in production paths (P1 enforced) |

---

## 3. Surface-by-surface ownership

### 3.1 QuickStats (`quickstats` widget)

| Dimension | Owner |
|-----------|-------|
| Widget type registration, position, config UI | **Dashboard** |
| Unread messages, pending tasks, today events rollups | **Analytics** |
| Storage used percent | **Analytics** (Drive module contributes source metric) |
| Client fetch orchestration today | **Dashboard** ❌ violation |
| Target fetch path | `dashboardAnalyticsFacade` → `/api/analytics/*` |

**Classification:** **Hybrid** — Dashboard composition widget hosting **Analytics-owned** data.

**Evidence:** `QuickStatsWidget.tsx` — `Promise.allSettled` on chat, todo, calendar; `storageUsedPercent: 23` placeholder.

---

### 3.2 `useDashboardStats` hook

| Dimension | Owner |
|-----------|-------|
| Hook location (`web/src/hooks/`) | **Dashboard** (consumer) |
| Rollup semantics | **Analytics** |
| Consumers | `DashboardClient`, `DashboardHeader` |

**Classification:** **Analytics-owned data** · **Dashboard-owned consumer**.

**Defect:** Duplicates QuickStats aggregation logic — violates single-capability rule (DASH-M6).

**Target:** One facade method `getDashboardSummary(dashboardId)` shared by widget and hook.

---

### 3.3 AI Quick Stats (A-02)

| Dimension | Owner |
|-----------|-------|
| Route `GET /api/dashboard/ai/context/quick-stats` | **Dashboard** (module AI surface) |
| Aggregate field values | **Analytics** |
| PE gate | **Dashboard** (`DASHBOARD_READ`) |
| Implementation today | Metadata stub — no foreign Prisma (P2) |

**Classification:** **Shared** — Dashboard registers provider; Analytics supplies bounded rollup DTO.

**Target:** `dashboardAIContextController` → `dashboardAnalyticsFacade` or thin server delegate calling Analytics read service.

---

### 3.4 Executive analytics panels

| Component | Owner |
|-----------|-------|
| `ExecutiveAnalyticsPanel` | **Analytics** metrics · **Dashboard** UI |
| `CrossModuleAnalyticsPanel` | **Analytics** metrics · **Dashboard** UI |
| `EnhancedDashboardModule` | **Analytics** product shell · **Dashboard** module |

**Current state (post–P1):** Mock metrics removed; panels render empty; **not mounted** in production path — `DashboardModuleWrapper` shows `DashboardEnterpriseShowcase` only.

**Classification:** **Analytics-owned** when enabled; **feature-gated** until capability contract exists.

---

### 3.5 Enterprise metrics widgets (non-registry)

| Surface | Owner | Status |
|---------|-------|--------|
| `EnhancedDashboardModule` quick metrics / alerts | **Analytics** | Unmounted |
| `DashboardEnterpriseShowcase` | **Marketing** | Demo-labeled — out of analytics SoR |

---

### 3.6 Surfaces explicitly NOT Analytics-owned

| Surface | Actual owner | Rationale |
|---------|--------------|-----------|
| **activityfeed** widget | **Platform activity** | `/api/activity-feed` — immutable feed, not rollup warehouse |
| **hr** widget | **HR module** | `/api/hr/dashboard-summary` |
| **scheduling** widget | **Scheduling module** | `/api/scheduling/dashboard-summary` |
| **AI overview / widgets providers** | **Dashboard** | Composition metadata only |
| **quicknotes / bookmarks** | **Dashboard** | Widget-local config SoR |
| **Admin Portal analytics** | **Admin Portal** | Operator metrics |

---

## 4. Master ownership table

| Surface | Dashboard | Analytics | Shared | Module | Out of scope |
|---------|:---------:|:---------:|:------:|:------:|:------------:|
| QuickStats widget | host | data | ✅ | sources | |
| useDashboardStats | consumer | data | ✅ | sources | |
| AI quick-stats A-02 | route/PE | data | ✅ | | |
| ExecutiveAnalyticsPanel | UI | data | ✅ | | |
| CrossModuleAnalyticsPanel | UI | data | ✅ | | |
| EnhancedDashboardModule | UI shell | data | ✅ | | |
| activityfeed | host | | | | **Platform activity** |
| hr / scheduling widgets | host | | | ✅ | |
| Drive storage in quickstats | | ✅ rollup | | Drive source | |

---

## 5. Transition model (Package 3)

```
BEFORE (violation):
  QuickStatsWidget ──► chat API + todo API + calendar API (client rollup)
  useDashboardStats  ──► same (duplicate)
  A-02               ──► stub nulls

AFTER (constitutional):
  QuickStatsWidget ──┐
  useDashboardStats  ├──► dashboardAnalyticsFacade ──► Analytics read API
  A-02 (server)      ──┘
```

---

## 6. Forbidden after Package 3

- Dashboard client importing 2+ module APIs for rollup KPIs
- Hardcoded metric placeholders (`storageUsedPercent: 23`) without `degraded: true` metadata
- Re-introducing mock executive metrics without demo flag
- Storing rollup summaries in module activity log

---

## 7. Required question answers

| # | Question | Answer |
|---|----------|--------|
| 2 | Who owns QuickStats? | **Analytics** (data) · Dashboard (host) |
| 3 | Who owns useDashboardStats? | **Analytics** |
| 4 | Who owns AI quick stats? | **Analytics** (data) · Dashboard (route) |
| 5 | Who owns enterprise panels? | **Analytics** (data) · Dashboard (UI) |

---

**Last updated:** 2026-06-21
