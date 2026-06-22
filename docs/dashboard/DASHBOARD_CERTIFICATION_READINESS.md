# Dashboard Module — Certification Readiness

**Program:** Dashboard Module Wave 3 — Phase 0A Constitutional Audit  
**Assessment date:** 2026-06-21  
**Status:** Discovery only — **no certification execution**

**Scoring model:** G1–G9 gates (same framework as L3 module / platform domain certifications)  
**Reference benchmarks:** Chat L3 ~27/27; Notebook L3; WS-L3 shell 23/27 (not applicable to module)

---

## 1. Certification posture

| Level | Verdict |
|-------|---------|
| **NOT CERTIFIABLE** (L2/L3) | **Yes — current posture** |
| **L2 candidate** | **No** — blocking gaps on G2, partial G1/G3/G6 |
| **L3 WITH FINDINGS candidate** | **No** — requires L2 foundation + operation matrix |
| **Plain L3 candidate** | **No** |

**Ledger today:** L1 Stabilizing — **accurate**.

---

## 2. G1–G9 scorecard (estimated)

| Gate | Score | Status | Evidence |
|------|------:|--------|----------|
| **G1 Authorization** | **2** | PARTIAL | PE on `getDashboardById` only; widget/dashboard writes JWT-only |
| **G2 Auditability** | **1** | FAIL | No `emitModuleActivityEvent` for dashboard module mutations |
| **G3 Service boundaries** | **2** | PARTIAL | Services exist; AI controller + calendar/seed coupling |
| **G4 API coherence** | **2** | PARTIAL | Split dashboard/widget routers; otherwise consistent REST |
| **G5 Ownership** | **2** | PARTIAL | Documented hybrid; tenancy bleed; analytics mock overlap |
| **G6 Test evidence** | **2** | PARTIAL | 1 integration test; no module operation matrix; drift tests are shell-scoped |
| **G7 Documentation** | **2** | PARTIAL | Product context placeholder-heavy; Phase 0A docs now exist |
| **G8 Production safety** | **2** | PARTIAL | Protected deletes; placeholder/mock UI paths undermine trust |
| **G9 UX consistency** | **2** | PARTIAL | Revitalization complete; enterprise mock panels; dark mode hardened |

**Total: 17/27 (~63%)** — **Level 1 Stabilizing** band (consistent with ledger)

### Score interpretation

| Range | Level |
|-------|-------|
| 27/27 | Plain L3 |
| 23–26 | L3 WITH FINDINGS band |
| 18–22 | L2 band |
| **≤17** | **L1 — current** |

---

## 3. Findings register

### Blocking (certification stoppers)

| ID | Finding | Gate | Evidence |
|----|---------|------|----------|
| **DASH-B1** | No module activity on widget/dashboard lifecycle | G2 | No dashboard `emitModuleActivityEvent` in server |
| **DASH-B2** | PE missing on write paths (dashboard, widget, sidebar) | G1 | `dashboardController`, `widgetController` |
| **DASH-B3** | AI quick-stats cross-module Prisma without authorization on foreign resources | G1/G3 | `dashboardAIContextController.getDashboardQuickStats` |
| **DASH-B4** | ActivityFeedWidget serves **placeholder fake activities** on API failure | G8 | `generatePlaceholderActivities()` |
| **DASH-B5** | Enterprise analytics panels present **mock metrics as product UI** | G8/G5 | `ExecutiveAnalyticsPanel`, `CrossModuleAnalyticsPanel` |

### Major (L2 blockers; L3 WITH FINDINGS acceptable only after closure plan)

| ID | Finding | Gate |
|----|---------|------|
| **DASH-M1** | Dual widget registry (`widgetRegistry` vs `coreModuleRegistry`) | G5/G4 |
| **DASH-M2** | Calendar auto-provision inside `dashboardService.createDashboard` | G3 |
| **DASH-M3** | `businessWorkspaceSeeder` invoked from dashboard create | G3 |
| **DASH-M4** | No Dashboard module operation matrix | G6/G7 |
| **DASH-M5** | Tenancy `Dashboard` entity conflates platform binding + product | G5 |
| **DASH-M6** | QuickStats / `useDashboardStats` duplicate Analytics capability | G5 |
| **DASH-M7** | Business hub uses workspace stub — not module delegation | G5 |
| **DASH-M8** | Fat `deleteDashboard` controller orchestration | G3 |

### Advisory (track on certificate)

| ID | Finding | Gate |
|----|---------|------|
| **DASH-A1** | Split `/api/dashboard` and `/api/widget` namespaces | G4 |
| **DASH-A2** | Sidebar JSON owned by module, rendered by shell — document contract | G5 |
| **DASH-A3** | Missing `DashboardWorkspaceLanding` for business hub pattern | G7 |
| **DASH-A4** | Manifest minimal on fresh deploy | G7 |
| **DASH-A5** | Widget hard delete vs global trash parity unclear | G8 |
| **DASH-A6** | `quickstats` pseudo-moduleId in registry | G5 |
| **DASH-A7** | Legacy `NotesWidget` orphaned | G7 |
| **DASH-A8** | No notification types in manifest | G7 |

---

## 4. Gate-by-gate detail

### G1 Authorization (PARTIAL)

**Pass evidence:** `POLICY_ACTIONS.DASHBOARD_READ` on get-by-id; membership checks on business dashboard create.

**Fail evidence:** Widget CRUD, dashboard update/delete, sidebar writes lack `authorize()`.

### G2 Auditability (FAIL)

No normalized activity for: dashboard create/update/delete, widget add/remove/move, sidebar save.

### G3 Service boundaries (PARTIAL)

`dashboardService` + `widgetService` exist but AI logic in controller; foreign domain side effects in dashboard create.

### G4 API coherence (PARTIAL)

RESTful patterns; dual router mount; client split.

### G5 Ownership (PARTIAL)

Phase 0A ownership model clarifies boundaries; implementation still blurs Analytics and Workspace.

### G6 Test evidence (PARTIAL)

`dashboard-context.integration.test.ts` — membership only. Personal registry drift tests cover widget **types** under shell program, not module HTTP matrix.

### G7 Documentation (PARTIAL)

`memory-bank/dashboardProductContext.md` outdated placeholders; constitutional docs added Phase 0A.

### G8 Production safety (PARTIAL)

Delete protections good; mock/placeholder UI paths are production-trust risks.

### G9 UX consistency (PARTIAL)

Grid revitalization strong; enterprise analytics UX misrepresents data fidelity.

---

## 5. Comparison to certification targets

| Criterion | L3 module requirement | Dashboard today |
|-----------|----------------------|-----------------|
| Registered built-in | ✅ | ✅ |
| ModuleAIContext | ✅ | ✅ |
| Canonical services | Required | Partial |
| PE all privileged paths | Required | Partial |
| Activity emissions | Required | ❌ |
| Operation matrix majority C | Required | ❌ Missing |
| No trust violations | Required | ❌ Mock/placeholder |
| WorkspaceLanding (business) | Expected | ❌ |

---

## 6. Path to L2 (discovery estimate — not a plan)

To reach **L2 band (~20–22/27)** would require at minimum:

- Close DASH-B1, B2, B4, B5 (activity, PE writes, remove fake data paths)
- Operation matrix draft with majority **P** rows
- Extract AI context to service; stop cross-module controller Prisma
- Registry unification charter executed

**Not in Phase 0A scope.**

---

## 7. Relationship to WS-L3

Reference Workspace WS-L3 **does not** satisfy Dashboard module certification. Personal Dashboard operation matrix rows owned by `Dash` are **shell-adjacent** — module L3 requires separate HTTP/service audit.

---

## 8. Certification recommendation

| Question | Answer |
|----------|--------|
| Certify now? | **No** |
| Legitimate certifiable module? | **Yes — after remediation waves** |
| Target track | **Module L1 → L2 → L3** independent of WS program |

---

**Last updated:** 2026-06-21
