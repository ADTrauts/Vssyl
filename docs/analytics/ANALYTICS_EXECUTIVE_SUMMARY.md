# Analytics Capability — Executive Summary

**Program:** Analytics Capability Phase 0A — Constitutional Discovery Audit  
**Date:** 2026-06-22  
**Status:** Discovery complete — **no implementation, no certification, no ledger changes**

**Deliverables:** [Reality Assessment](./ANALYTICS_REALITY_ASSESSMENT.md) · [Ownership Model](./ANALYTICS_OWNERSHIP_MODEL.md) · [Risk Matrix](./ANALYTICS_ARCHITECTURAL_RISK_MATRIX.md) · [Classification](./ANALYTICS_CAPABILITY_CLASSIFICATION.md) · [Certification Readiness](./ANALYTICS_CERTIFICATION_READINESS.md)

---

## Bottom line

Analytics in Vssyl is a **Hybrid Domain** — not a product module, not a single platform service, but a **federation of derived-metric systems** spanning platform capability reads, operator admin analytics (already L3), module-local domain analytics, AI satellites, and stub product surfaces.

Dashboard Module Wave 3 established the **first honest cross-module tenant contract** (`GET /api/analytics/dashboard-summary` + `dashboardAnalyticsFacade`). Everything else remains **immature, duplicated, or mock**.

**Do not certify Analytics as an L3 product module.** Pursue **Platform Analytics Capability L2** after Phase 0B scope lock.

---

## Classification

| Option | Verdict |
|--------|---------|
| A. Product Module | **Rejected** |
| B. Platform Capability | **Primary engine class** |
| C. Hybrid Domain | **Selected** |

---

## Inventory at a glance

| Category | Count | Maturity |
|----------|-------|----------|
| API routes (analytics in path) | 24+ | L1–L3 mixed |
| Backend services | 17 | L1–L3 mixed |
| Frontend pages | 8+ | L0–L3 mixed |
| Widgets / panels | 9 | L0–L2 mixed |
| Event consumers | 1 | L0 placeholder |
| Scheduled rollup jobs | 0 | Not built |
| Prisma analytics models | 20+ | Mostly unwired scaffold |
| AI analytics engines | 7 | 3 live, 4 unwired |

**Canonical tenant contract:** `analyticsDashboardSummaryService` → `/api/analytics/dashboard-summary` → `dashboardAnalyticsFacade`.

**Canonical operator destination:** `/admin-portal/analytics` → `adminAnalyticsService`.

---

## Required questions — answers

### 1. What is Analytics?

**Derived metrics** — projections, rollups, aggregates, and summaries computed from module and platform systems of record. Analytics describes what happened or what state exists in aggregate; it never authorizes, never mutates domain state, and never substitutes for the activity log or domain SoR.

Three operational classes:
- **Tenant analytics** — dashboard-scoped cross-module rollups for users and businesses
- **Operator analytics** — platform MRR, growth, system health for admins
- **Domain analytics** — module-owned metrics (HR attendance, chat message stats, place network)

### 2. Who owns Analytics?

| Owner | Scope |
|-------|-------|
| **Platform Analytics Capability** | Cross-module tenant rollups, `/api/analytics/*`, `dashboard-summary`, future event pipeline |
| **Admin Portal** | Operator/platform metrics, BI insights (L3 CwF) |
| **Domain modules** | HR, Chat, Place, Workforce Comms, Scheduling — own domain metrics |
| **Dashboard** | Widget composition only — consumes capability via facade |
| **AI Platform** | Learning, predictive, recommendation intelligence analytics |
| **Platform Activity** | Immutable event feed — not analytics warehouse |

### 3. Is Analytics a module?

**No.** The `analytics` entry in `coreModuleRegistry.ts` is a **pseudo-module** — navigation metadata without `registerBuiltInModules` entry, manifest, `ModuleAIContext`, owned entities, or workspace landing. It must not be certified as a peer L3 module like Chat or Drive.

### 4. Is Analytics a platform capability?

**Yes — for cross-module tenant rollups.** This is the primary long-term engine class. It is not exclusively a platform capability because operator analytics (Admin Portal), module-local analytics, and product surfaces are separate ownership classes within the Hybrid Domain.

### 5. What systems consume Analytics?

| Consumer | Source |
|----------|--------|
| `QuickStatsWidget`, `useDashboardStats`, Dashboard header | Platform Capability (`dashboard-summary`) |
| AI quick-stats (`/api/dashboard/ai/context/quick-stats`) | Platform Capability |
| Executive / Cross-Module enterprise panels | Platform Capability (`enterprise` projection) |
| Admin Portal analytics pages | Operator (`adminAnalyticsService`) |
| Profile analytics page | Platform Capability (`/api/analytics/personal`) |
| Business profile tab | Business domain + capability federation |
| HR / Place / Workforce reporting UIs | Module domain services |
| AI intelligence dashboards | AI Platform |
| Business workspace page | **Nothing today** (mock) |

### 6. What systems produce Analytics?

| Producer | Output |
|----------|--------|
| `analyticsDashboardSummaryService` | Dashboard summary DTO, enterprise projection |
| `analyticsController` (inline) | Personal, module, export analytics |
| `adminAnalyticsService` | Operator platform metrics, BI |
| `businessAnalyticsService` | Business member/file/conversation counts |
| `chatAnalyticsService`, `hrAnalyticsService`, `placeVisibilityService`, `workforceReportingService` | Domain metrics |
| `systemMonitoringService` | `SystemMetrics` time series |
| `CentralizedLearningEngine`, intelligence engines | AI analytics |
| Domain event subscriber | **Nothing** (placeholder log only) |

### 7. Current maturity?

| Layer | Posture |
|-------|---------|
| Platform Analytics Capability | **L1.5 → L2 entry** (~44–56% informal G1–G9) |
| Operator Analytics | **L3 CwF** (via Admin Portal) |
| Module domain analytics | **L2–L3** (varies by module) |
| Product surfaces (business workspace) | **L0 mock** |
| Event pipeline | **L0 placeholder** |
| AI analytics scaffold | **L0 unwired** |

Ledger row `analytics` L1 "Pseudo-module; subscriber stubs" is **maturity-accurate** but **class-misleading** (implies product module).

### 8. Largest architectural risks?

1. **Capability-layer Prisma coupling** — `analyticsDashboardSummaryService` queries Chat/Todo tables directly instead of module rollup APIs
2. **Permission model unenforced** — AP1–AP5 documented but not systematic on all paths
3. **Fictional event pipeline** — placeholder subscriber on every domain event
4. **Mock business workspace page** — user-facing segment with no real data
5. **No unified service layer** — legacy `/api/analytics/personal` uses controller inline Prisma

### 9. Certification path?

| Track | Recommendation |
|-------|----------------|
| L3 Product Module | **Reject** — no owned SoR |
| Platform Capability L2 CwF | **Pursue** — Q3 2026 realistic after charter |
| Operator re-certification | **Not needed** — Admin Portal L3 covers it |

**Sequence:**
1. **Phase 0B** — Scope lock charter, operation matrix, event pipeline decision, ledger classification proposal
2. **Phase 1** — Service extraction, module rollup API decoupling, wire/hide mock surfaces, PE audit
3. **Phase 2** — Federation hardening, enterprise panel decision, DTO cleanup
4. **Phase 3** — L2 certification candidacy

### 10. Recommended next phase?

**Phase 0B — Scope Lock & Charter** (governance, 1–2 weeks):

| Decision | Options |
|----------|---------|
| Event pipeline | Activate materialization **or** remove placeholder subscriber |
| Business workspace page | Wire to capability-backed APIs **or** hide segment until ready |
| Ledger classification | Reclassify `analytics` from product module to platform capability |
| Operation matrix | Draft read operations with PE actions for L2 path |
| Coupling remediation | Charter module rollup APIs for chat/todo counts |

**Do not** begin implementation packages or certification until Phase 0B council ratification.

---

## Post-Dashboard Wave 3 state

| Achievement | Status |
|-------------|--------|
| `dashboardAnalyticsFacade` | ✅ Shipped |
| `GET /api/analytics/dashboard-summary` | ✅ Shipped |
| QuickStats / `useDashboardStats` decoupled | ✅ Shipped |
| AI quick-stats capability-backed | ✅ Shipped |
| Enterprise panels | ⚠️ Data path exists; UI gated/unwired |
| Analytics warehouse | ❌ Not built |
| Business workspace analytics | ❌ Still mock |

Dashboard is now a **certified consumer** of Analytics capability. Analytics modernization is **portfolio priority #1** per [PLATFORM_MODERNIZATION_PRIORITY_2026.md](../platform-portfolio/PLATFORM_MODERNIZATION_PRIORITY_2026.md).

---

## Constitutional one-liner

> Analytics is a **Hybrid Domain**: Platform Analytics Capability federates module-derived metrics into tenant contracts; Admin Portal owns operator analytics; modules own domain metrics; Dashboard hosts widgets that consume — **not** a certifiable L3 product module.

---

## Stop condition confirmation

| Constraint | Status |
|------------|--------|
| Discovery only | ✅ |
| No runtime code changes | ✅ |
| No new services / APIs | ✅ |
| No Dashboard changes | ✅ |
| No Admin Portal changes | ✅ |
| No ledger update | ✅ |
| No certification start | ✅ |

---

**Last updated:** 2026-06-22
