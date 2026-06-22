# Dashboard Module — Modernization Program

**Program:** Dashboard Module Wave 3 — Phase 1 Trust & Authorization Charter  
**Date:** 2026-06-21  
**Status:** Constitutional program definition — **not** engineering execution

**Baseline:** L1 · 17/27 G1–G9 · DASH-B1–B5 blocking · 42 operations

**Target progression:** L1 → **L2 (~21/27)** → **L3 WITH FINDINGS (~24/27)** → plain L3 (27/27, out of Wave 3 scope)

---

## Program structure

Four packages — sequential dependency with Package 1 gate for all engineering ACT.

```
Phase 0A/0B (complete) → Phase 1 Charter (this doc) → ACT gate → Package 1 → 2 → 3 → 4
```

---

## Package 1 — Trust Foundation

**Objective:** Close blocking trust and audit violations; establish PE + activity on all mutations.

### Scope

| Workstream | Deliverables (when ACT) |
|------------|-------------------------|
| **Authorization** | `DASHBOARD_WRITE`, `DASHBOARD_DELETE` in PE; dual-enforcement on 14 write paths + sensitive reads |
| **Activity** | `dashboardActivityService` + 10 action catalog; wire 16 mutation ops |
| **Trust** | Remove ActivityFeed placeholder; feature-gate or demo-label enterprise mock panels |
| **AI quick-stats** | Disable cross-module Prisma OR metadata-only stub pending Package 3 |
| **Silent create** | Move D-02 auto-create out of GET or emit activity + PE |
| **Tests** | PE + activity integration tests for core CRUD |
| **Docs** | Update operation matrix row status |

### Findings closed

| ID | Closed? |
|----|---------|
| DASH-B1 | ✅ |
| DASH-B2 | ✅ (24/24 PE paths — target) |
| DASH-B4 | ✅ |
| DASH-B5 | ✅ (gate/mock removal) |
| DASH-B3 | 🟡 Partial — stub only; full close in Package 3 |
| TP-ACT-01–03 | ✅ |
| TP-PE-01–03, 06–08 | ✅ |
| TP-TRUST-01–04 | ✅ |

### Expected score impact

| Gate | Before | After P1 |
|------|--------|----------|
| G1 Authorization | 2 | **3** PASS |
| G2 Auditability | 1 | **3** PASS |
| G8 Production safety | 2 | **3** PASS |
| G3 Service boundaries | 2 | 2 (partial — AI still in controller) |
| G6 Test evidence | 2 | **3** PASS |
| **Total** | **17/27** | **~21/27 (~78%)** |

### Readiness

| Metric | After P1 |
|--------|----------|
| Certification | **L2 band entry** |
| Matrix N rows | ≤6 (down from 16) |
| PE compliance | 100% |
| Activity compliance | 100% mutations |
| Untrusted widgets in default path | 0 |

---

## Package 2 — Service Boundary Alignment

**Objective:** Canonical services, domain events, decouple foreign side effects, thin controllers.

### Scope

| Workstream | Deliverables (when ACT) |
|------------|-------------------------|
| **Services** | `dashboardAIContextService` — overview + widgets only |
| **Controllers** | Thin pass-through; delete orchestration → service |
| **Domain events** | 4 required events in registry + emitters |
| **Decouple** | Calendar provision out of `createDashboard`; workspace seed → lifecycle hook |
| **Trash** | PE on dashboard_tab trash paths via dashboard service adapter |
| **File summary** | PE-gated read via dashboard service |
| **Policy** | `dashboardPolicyDual.ts` test matrix |

### Findings closed

| ID | Closed? |
|----|---------|
| DASH-B3 | 🟡 Service boundary — Prisma removed from controller |
| DASH-M2, M3, M8 | ✅ |
| DASH-M4 | ✅ (matrix tests) |
| TP-DE-01 | ✅ (4 required events) |
| TP-PE-04, 07, 08 | ✅ |

### Expected score impact

| Gate | After P1 | After P2 |
|------|----------|----------|
| G3 Service boundaries | 2 | **3** PASS |
| G4 API coherence | 2 | **3** PASS |
| G5 Ownership | 2 | **3** PASS |
| G7 Documentation | 2 | **3** PASS |
| **Total** | ~21/27 | **~23/27 (~85%)** |

### Readiness

| Metric | After P2 |
|--------|----------|
| Certification | **L3 WITH FINDINGS evaluation eligible** |
| Matrix C rows | ≥60% |
| Domain events | 4/4 required |

---

## Package 3 — Analytics Decoupling

**Objective:** Delegate all rollups to Analytics capability; hygiene on partial-trust widgets.

### Scope

| Workstream | Deliverables (when ACT) |
|------------|-------------------------|
| **Facade** | `dashboardAnalyticsFacade` read-only client |
| **Widgets** | quickstats, useDashboardStats → facade |
| **AI** | A-02 → facade or remove provider until Analytics ready |
| **Enterprise** | Real data via facade OR permanent feature-gate with council waiver |
| **Drive widget** | Remove Math.random share; real storage quota from Drive |
| **Registry** | Align `coreModuleRegistry.widgets` with `WIDGET_REGISTRY` |

### Findings closed

| ID | Closed? |
|----|---------|
| DASH-B3 | ✅ Full |
| DASH-M1, M6 | ✅ |
| TP-TRUST-05, 06, 07 | ✅ |
| DASH-A6 | ✅ |

### Expected score impact

| Gate | After P2 | After P3 |
|------|----------|----------|
| G5 Ownership | 3 | **3** PASS (clean) |
| G9 UX consistency | 2 | **3** PASS |
| G8 | 3 | 3 |
| **Total** | ~23/27 | **~24/27 (~89%)** |

### Readiness

| Metric | After P3 |
|--------|----------|
| Certification | **L3 WITH FINDINGS candidate** |
| Analytics honesty | Yes (or documented waiver on enterprise) |
| Untrusted + partial widgets | 0 untrusted; drive fixed |

**Dependency:** Analytics capability scope lock — facade may return empty with `meta.stale` until Analytics L2.

---

## Package 4 — Certification Readiness

**Objective:** Operation matrix majority C, advisories documented, optional enhancements for plain L3 path.

### Scope

| Workstream | Deliverables (when ACT) |
|------------|-------------------------|
| **Matrix** | ≥70% C rows; HTTP integration suite |
| **Business hub** | `DashboardWorkspaceLanding` or delegate charter |
| **Notifications** | Manifest types if product notifications added |
| **Realtime** | Optional `dashboard:{id}` room contract |
| **Tenancy** | Split charter OR documented platform exception |
| **Advisories** | Burn-down DASH-A1–A8 |
| **Governance** | L3 WITH FINDINGS evaluation packet (separate council ACT) |

### Findings closed

| ID | Closed? |
|----|---------|
| DASH-A1–A8 | Partial/full per item |
| DASH-M5, M7 | Charter or implement |
| WS cross-ref | Business hub only — not WS reopen |

### Expected score impact

| Gate | After P3 | After P4 |
|------|----------|----------|
| G6 | 3 | **3** PASS (full matrix CI) |
| G7 | 3 | **3** PASS |
| All gates | mixed | **24–26/27** |
| **Total** | ~24/27 | **~25/27 (~93%)** L3 CwF |

### Readiness

| Metric | After P4 |
|--------|----------|
| Certification | **L3 WITH FINDINGS** award eligible (governance ACT) |
| Plain L3 | Deferred — requires 27/27 + zero majors |

---

## Package comparison matrix

| | P1 Trust | P2 Services | P3 Analytics | P4 Cert prep |
|---|:---:|:---:|:---:|:---:|
| Closes DASH-B1 | ✅ | | | |
| Closes DASH-B2 | ✅ | | | |
| Closes DASH-B3 | partial | partial | ✅ | |
| Closes DASH-B4 | ✅ | | | |
| Closes DASH-B5 | ✅ | | ✅ | |
| Domain events | | ✅ | optional+ | optional+ |
| Registry unify | | | ✅ | |
| L2 target | ✅ | | | |
| L3 CwF target | | | ✅ | ✅ |

---

## Explicit non-scope (all packages)

- Reference Workspace shell / WS-L3 reopen
- Analytics capability L3 certification
- Admin Portal analytics
- Prisma tenancy entity split (charter only unless P4 council approves)
- Plain L3 27/27 certification execution

---

## ACT gate (before Package 1 code)

| Gate | Requirement |
|------|-------------|
| Charter approved | This document + 6 Phase 1 deliverables |
| Analytics | Separation charter accepted; P3 may use empty facade |
| Workspace | Confirmed out of scope |

---

**Last updated:** 2026-06-21
