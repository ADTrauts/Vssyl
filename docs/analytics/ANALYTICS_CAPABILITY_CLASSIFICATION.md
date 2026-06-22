# Analytics Capability — Classification

**Program:** Analytics Capability Phase 0A — Constitutional Discovery Audit  
**Date:** 2026-06-22  
**Status:** Discovery only — **no implementation, no certification, no ledger changes**

**Cross-reference:** [ANALYTICS_OWNERSHIP_MODEL.md](./ANALYTICS_OWNERSHIP_MODEL.md), [ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md](../workspace-review/ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §0.1

---

## 1. Classification decision

| Option | Verdict |
|--------|---------|
| A. Product Module | **Rejected** |
| B. Platform Capability | **Partially accepted** — primary engine class |
| C. Hybrid Domain | **Selected** |

### **Recommended class: Hybrid Domain**

Analytics is a **Hybrid Domain** composed of:

1. **Platform Analytics Capability** (primary) — cross-module tenant rollups, federation contracts, future event pipeline
2. **Operator Analytics** (Admin Portal satellite) — already L3 CwF, separate ownership
3. **Module Domain Analytics** (distributed) — HR, Chat, Place, Workforce Comms own domain metrics
4. **Product Analytics Surfaces** (optional tenant UX) — business workspace page, profile hub — consume capability, not a module
5. **AI Analytics Satellites** (AI Platform) — intelligence analytics, unwired scaffold engines

---

## 2. Decision rationale

### 2.1 Why not a Product Module (A)

| Module criterion | Analytics today | Verdict |
|------------------|-----------------|---------|
| `registerBuiltInModules.ts` entry | **Absent** | Fail |
| `ModuleAIContext` | **None** for `analytics` id | Fail |
| Owned entities / SoR | **None** — derived reads only | Fail |
| `WorkspaceLanding` component | Inline page stub only | Fail |
| Manifest / marketplace contract | **None** | Fail |
| Activity emissions on writes | N/A — read-only | N/A |
| Canonical domain service | **Partial** — only `analyticsDashboardSummaryService` | Fail |
| Operation matrix / certification charter | **None** | Fail |

Platform standards §0.1 explicitly lists `analytics` under **"Platform pseudo-modules (runtime only)."** The `coreModuleRegistry` entry is **navigation metadata**, not module certification.

Certifying Analytics as an L3 peer to Chat, Drive, or HR would require **inventing owned entities** that do not exist. Analytics derives; it does not author.

### 2.2 Why Platform Capability alone is insufficient (B-only)

Pure Platform Capability classification omits:

| Surface | Why it matters |
|---------|----------------|
| **Business workspace `/workspace/analytics`** | Product-facing segment with user expectations of a "module" |
| **`analytics` pseudo-module in registry** | Runtime presents Analytics as a business module to users |
| **Profile `/profile/analytics`** | Account-level product surface (privacy-adjacent hub) |
| **Admin Portal operator analytics** | Distinct L3-certified program — not tenant capability |
| **Module-local analytics** | HR L3 interiors are not platform capability |

A single "Platform Capability" label without hybrid decomposition would **collapse distinct ownership classes** and repeat the ledger error of treating Analytics as one product module.

### 2.3 Why Hybrid Domain fits (C)

| Hybrid layer | Role | Maturity |
|--------------|------|----------|
| **Platform Analytics Capability** | Cross-module tenant federation, `dashboard-summary`, permission gates, event pipeline (future) | L1→L2 |
| **Operator Analytics** | Admin Portal canonical `/admin-portal/analytics` | L3 CwF |
| **Module Domain Analytics** | Per-module SoR metrics | L2–L3 |
| **Product Surfaces** | UX mounts consuming above layers | L0–L2 |
| **AI Satellites** | Intelligence analytics under AI Platform | L2 |

This matches observed repo reality: **47 systems**, **5 ownership classes**, **1 canonical tenant contract** (post Dashboard P3).

---

## 3. Comparison to peer platform patterns

| Platform pattern | Analytics parallel | Reference |
|------------------|-------------------|-----------|
| Search (platform capability) | Cross-module federated reads, no SoR | Search audit charter |
| Realtime (platform capability) | Infrastructure, modules declare usage | No ledger row yet |
| Activity (platform) | Immutable events — analytics consumes, never replaces | `moduleSpecs.md` |
| Admin Portal (L3 module) | Operator analytics already certified | Stage 0C |
| Dashboard (L3 module) | Composition host consuming capability facade | Wave 3 archived |

Analytics most closely follows **Search + Activity consumption** — derived, permission-gated, federated — **not** File Hub module ownership.

---

## 4. Pseudo-module disposition

The `analytics` entry in `coreModuleRegistry.ts` should be understood as:

| Aspect | Current | Target (governance) |
|--------|---------|---------------------|
| Registry id | `analytics` | Retain as **product surface id** OR rename to `business-insights` |
| Module certification | Implied by ledger L1 row | **Reclassify** to platform capability |
| Built-in registration | Absent | **Do not add** without scope lock charter |
| Workspace route | Mock page | Capability-backed or deferred |

**Recommendation:** Retain registry entry as **product surface navigation**; remove pretense of L3 product module certification track.

---

## 5. Dashboard relationship (post Wave 3)

| Asset | Class | Owner |
|-------|-------|-------|
| `dashboardAnalyticsFacade` | Capability contract (client) | Analytics Capability |
| `QuickStatsWidget` | Dashboard widget chrome | Dashboard hosts; Analytics supplies data |
| `widgetRegistry` quickstats | Dashboard registry | Dashboard; `capabilityId: 'analytics'` |
| Enterprise panels | Dashboard UI + Capability data | Hybrid — split ownership documented |

Dashboard Wave 3 **resolved the primary coupling violation**. Dashboard is no longer an analytics producer — it is a **certified consumer** per REFERENCE_MODULE_CATALOG "Analytics consumption" pattern.

---

## 6. Admin Portal relationship

Admin Portal analytics is **not** part of Platform Analytics Capability — it is an **Operator Analytics** slice certified under Admin Portal L3 (Stage 0C).

| Rule | Detail |
|------|--------|
| Canonical path | `/admin-portal/analytics` |
| Data owner | `adminAnalyticsService` |
| Out of scope | Business tenant `/workspace/analytics` |
| Registry | `adminAnalyticsOwnership.ts` |

No consolidation of operator and tenant analytics into one service — constitutional separation is correct.

---

## 7. Classification answers (required questions)

| # | Question | Answer |
|---|----------|--------|
| 1 | What is Analytics? | **Derived metrics layer** — projections, rollups, aggregates, summaries over module/platform SoR |
| 3 | Is Analytics a module? | **No** — pseudo-module navigation only |
| 4 | Is Analytics a platform capability? | **Yes** — for cross-module tenant rollups; **not exclusively** |

---

## 8. Governance implications

| Action | Authorized in Phase 0A? | Phase |
|--------|-------------------------|-------|
| Reclassify ledger row | No — discovery only | Phase 0B governance |
| Remove pseudo-module registry | No | Phase 1 if product surface deferred |
| Register as true built-in module | **Not recommended** | Only if scope lock adds owned entities |
| Platform Capability L2 charter | Recommended next | Phase 0B |
| Wire business workspace page | Implementation | Phase 1 |

---

## 9. One-sentence constitutional statement

> **Analytics is a Hybrid Domain: a Platform Analytics Capability federating module-derived metrics into tenant contracts, with distributed module-local analytics, Admin Portal operator analytics, optional product surfaces, and AI intelligence satellites — not a certifiable L3 product module.**

---

**Last updated:** 2026-06-22
