# Dashboard Module — Modernization Scope Definition

**Program:** Dashboard Module Wave 3 — Phase 0B Constitutional Operations Audit  
**Assessment date:** 2026-06-21  
**Status:** Constitutional scope only — **not** an implementation plan

**Baseline:** L1 · 17/27 G1–G9 · 42 operations · 4C / 22P / 16N matrix rows

---

## Purpose

Define minimum constitutional work to reach L2, L3 WITH FINDINGS, and plain L3 — without sequencing tasks or engineering packages.

---

## 1. Level definitions (Dashboard module)

| Level | G1–G9 band | Operation matrix | Trust |
|-------|------------|------------------|-------|
| **L2 — Operational** | ~20–22/27 | Majority **P**; zero **N** on blocking rows | No blocking trust violations |
| **L3 WITH FINDINGS** | ~23–26/27 | Majority **C**; advisories documented | No mock/placeholder in product paths |
| **Plain L3** | 27/27 | All **C** on material rows | Full PE + activity + matrix green |

---

## 2. Minimum path to L2 (~20–22/27)

### 2.1 Constitutional closure (blocking)

| Scope area | Must close | Findings |
|------------|------------|----------|
| **Auditability** | Emit module activity on all 16 mutation operations | DASH-B1 |
| **Authorization** | PE on all write paths + sensitive reads (24 ops) | DASH-B2 |
| **Trust** | Remove or feature-gate: ActivityFeed placeholder, enterprise mock metrics | DASH-B4, B5 |
| **Service boundary** | Extract AI context from controller; remove cross-module Prisma from quick-stats | DASH-B3 |

### 2.2 Matrix posture

| Metric | L2 minimum |
|--------|------------|
| Blocking rows **N** → **P** or **C** | 16 → ≤4 |
| PE compliance | ≥80% of required paths |
| Activity compliance | 100% of mutations |
| Trust class **Untrusted** surfaces | 0 in default product path |

### 2.3 G1–G9 uplift (estimated)

| Gate | L1 → L2 target |
|------|----------------|
| G1 | 2 → 3 (PASS) |
| G2 | 1 → 3 (PASS) |
| G3 | 2 → 3 (PASS) |
| G6 | 2 → 3 (matrix + tests on PE/activity) |
| G8 | 2 → 3 (trust policy enforced) |

**Estimated score after L2 scope:** **21/27 (~78%)** — lower L2 band

### 2.4 Explicitly out of L2 minimum

- Plain WS-L3 shell work
- Analytics capability L3
- Registry unification complete (major, not blocking for L2 if documented)
- Tenancy entity split (charter-only at L2)
- Business hub delegation (workspace advisory)
- Domain events on all paths (advisory at L2)
- Notification manifest types

---

## 3. Minimum path to L3 WITH FINDINGS (~23–26/27)

**Requires L2 scope complete**, plus:

### 3.1 Additional constitutional scope

| Scope area | Requirement |
|------------|-------------|
| **Operation matrix** | ≥70% rows **C**; remainder **P** with documented advisories |
| **Registry** | Single capability resolution path (charter executed) | DASH-M1 |
| **Coupling** | Calendar provision + workspace seeder removed from `createDashboard` | DASH-M2, M3 |
| **Service extraction** | `dashboardAIContextService`; thin controllers | DASH-M8, B3 |
| **Business surface** | `DashboardWorkspaceLanding` or documented delegation to module grid | DASH-M7, A3 |
| **Analytics** | QuickStats + AI quick-stats consume Analytics facade **or** explicit deferral waiver on certificate | DASH-M6 |
| **Tests** | Operation matrix HTTP rows covered — majority integration tests **PASS** |
| **Documentation** | Operation matrix + trust policy + ownership model maintained |
| **Domain events** | ≥4 high-signal lifecycle events wired |

### 3.2 G1–G9 uplift (estimated)

| Gate | L2 → L3 CwF |
|------|-------------|
| G4 | 2 → 3 |
| G5 | 2 → 3 |
| G7 | 2 → 3 |
| G9 | 2 → 3 (enterprise paths honest or gated) |

**Estimated score:** **24/27 (~89%)** with **5–8 advisories** on certificate

### 3.3 Acceptable advisories at L3 CwF

- API namespace split (DASH-A1)
- Widget hard delete vs trash parity (A5)
- Domain events not on all rows (partial adoption)
- Sidebar shell hybrid (A2) — documented contract
- Analytics facade partial if waiver documented

---

## 4. Minimum path to plain L3 (27/27)

**Requires L3 WITH FINDINGS**, plus:

| Scope area | Requirement |
|------------|-------------|
| **G1–G9** | All gates **PASS** (3/3 each) |
| **Operation matrix** | **100% C** on material HTTP/mutation rows |
| **Advisories** | **0** open majors; advisories burned down or waived with council approval |
| **Registry** | `coreModuleRegistry.widgets` aligned with `WIDGET_REGISTRY` |
| **Tenancy** | Domain split charter executed **or** explicit platform exception documented |
| **Analytics** | No Dashboard-native aggregation; Analytics capability consumed |
| **Notifications** | Manifest types if product emits user notifications |
| **Reference patterns** | Operation matrix parity with File Hub / Chat reference modules |
| **UX** | No Partially Trusted widgets without documented exception |

**Estimated effort class:** Full module certification program — not a single wave.

---

## 5. Scope boundaries (never in Dashboard Wave 3)

| Excluded | Owner |
|----------|-------|
| PlatformShell / navigation SSOT | Reference Workspace (archived) |
| Business workspace switch | Workspace advisories |
| Admin Portal analytics | Admin Portal L3 |
| Analytics capability build-out | Separate platform program |
| HR/Scheduling module interiors | Module owners |

---

## 6. Phase map (constitutional only — not execution)

| Phase | Constitutional objective | Cert target |
|-------|-------------------------|-------------|
| **0A** | Reality + ownership audit | — ✅ Complete |
| **0B** | Operation matrix + trust model | — ✅ This document |
| **1** | Trust closure + PE/activity on mutations | L2 path |
| **2** | Service extraction + coupling removal + matrix tests | L2 achieved |
| **3** | Registry unification + business delegation + analytics facade | L3 CwF eval |
| **4** | Advisory burn-down + domain events + docs | Plain L3 eval |

*Phase numbers are governance labels only — not authorized engineering.*

---

## 7. Risk if scope skipped

| Skipped item | Risk |
|--------------|------|
| Trust closure | Platform certification dishonesty; user mistrust |
| PE writes | Authorization bypass on widget/layout mutation |
| Activity | Broken audit trail; AI ambient signals false |
| Analytics delegation | Second analytics SoR; L3 claim invalid |

---

**Last updated:** 2026-06-21
