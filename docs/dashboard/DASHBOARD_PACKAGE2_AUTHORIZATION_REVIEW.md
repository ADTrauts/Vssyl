# Dashboard Module — Package 2 Authorization Review

**Program:** Dashboard Module Wave 3 — Package 2 Authorization Review  
**Review date:** 2026-06-21  
**Status:** Governance review only — **no implementation**

**Baseline:** Package 1 complete · **~20–21/27 (~74–78%)** · B1/B2/B4/B5 closed · B3 partial

**Inputs:** [DASHBOARD_MODERNIZATION_PROGRAM.md](./DASHBOARD_MODERNIZATION_PROGRAM.md), Package 1 reports, post-P1 codebase survey

---

## 1. Review purpose

Validate whether **Package 2 — Service Boundary Alignment** is sufficiently defined to authorize engineering ACT, with focus on **DASH-B3**, service extraction, domain events, and architectural risk.

---

## 2. DASH-B3 review (Area A)

### 2.1 Post–Package 1 state

| Surface | Cross-module? | Prisma today | P2 target |
|---------|---------------|--------------|-----------|
| **A-02** quick-stats | Was yes | **Stub** — no foreign Prisma | Remain stub until P3 facade |
| **A-01** overview | No — dashboard SoR | Controller direct Prisma | → `dashboardAIContextService` |
| **A-03** widgets | No — dashboard SoR | Controller direct Prisma | → `dashboardAIContextService` |
| **createDashboard** calendar provision | **Yes** — Calendar domain | `dashboardService` | Decouple → Calendar bootstrap hook |
| **createDashboard** workspace seed | **Yes** — Drive/Chat/Calendar | `businessWorkspaceSeeder` | Decouple → lifecycle hook / subscriber |
| **deleteDashboard** conversations | **Yes** — Chat domain | `dashboardService` | Delegate to Chat trash/delete API or documented FK exception |
| **deleteDashboard** file migration | **Yes** — Drive domain | `dashboardController` + `fileMigrationService` | Move orchestration to service |
| **ensureBusinessDashboardForUser** | Indirect | Via `createDashboard` side effects | Preserve API; side effects decoupled |

### 2.2 Remaining cross-module reads (answer Q3)

| # | Location | Foreign domain | P2 action |
|---|----------|----------------|-----------|
| 1 | `dashboardService.createDashboard` | Calendar | Remove inline create; Calendar owns bootstrap |
| 2 | `businessWorkspaceSeeder` (via create) | Drive, Calendar, Chat | Remove from create path; workspace hook |
| 3 | `dashboardService.deleteDashboard` | Conversation | Chat service delegation or charter exception |
| 4 | `dashboardController.deleteDashboard` | Drive (file migration) | Service-owned workflow |
| 5 | Client `QuickStatsWidget` / `useDashboardStats` | Chat, Todo, Calendar APIs | **Out of P2** — Package 3 |
| 6 | `dashboardService` membership checks | Business, Institution, Household | **Acceptable** — tenant gates on dashboard create |

### 2.3 Remaining direct Prisma paths (answer Q4)

| Path | Owner-appropriate? | P2 disposition |
|------|-------------------|----------------|
| `widgetService` → Widget, Dashboard | ✅ | Keep — widget SoR |
| `sidebarCustomizationService` → Dashboard.preferences | ✅ | Keep |
| `dashboardAIContextController` → Dashboard, Widget | 🟡 | Move to `dashboardAIContextService` |
| `dashboardService` → Calendar create | ❌ | Remove (M2) |
| `dashboardService` → Conversation deleteMany | 🟡 | Delegate or document |
| `dashboardTrashService` → Dashboard | ✅ | Keep / fold into dashboard service |
| `businessWorkspaceSeeder` | ❌ when called from dashboard | Decouple (M3) |

### 2.4 Coupling points

```
createDashboard ──┬──► prisma.calendar.create (M2)
                  └──► seedBusinessWorkspaceResources (M3)
                         ├── folder (Drive)
                         ├── calendar (Calendar)
                         └── conversation (Chat)

deleteDashboard (controller) ──► fileMigrationService (Drive)
deleteDashboard (service) ──► conversation.deleteMany (Chat)

ensureBusinessDashboardForUser ◄── HR, Scheduling, Business, OrgChart, Workforce activity services
```

### 2.5 Ownership violations (constitutional)

| Violation | Severity | Package |
|-----------|----------|---------|
| Calendar provision in dashboard create | Major (G3) | **P2** |
| Workspace seed in dashboard create | Major (G3) | **P2** |
| AI context Prisma in controller | Major (G3) | **P2** |
| Delete orchestration in controller | Major (G3) | **P2** |
| A-02 aggregate reads | Blocking (B3) | **P1 stub ✅** · **P3 full** |
| Client quick-stats cross-module fetch | Major (G5) | **P3** |

### 2.6 Expected DASH-B3 closure (answer Q8)

| Lens | P2 closes? |
|------|------------|
| **Server AI context controller** | **Yes** — service extraction; no foreign Prisma in controller |
| **dashboardService domain leaks** | **Yes** — calendar + seed decoupled |
| **Analytics aggregates (A-02, widgets)** | **No** — Package 3 |
| **Overall B3 finding** | **Partial → Service-boundary closed**; full B3 at P3 |

**Verdict:** P2 closes **B3 for server architecture** per program charter; **not** full B3 including client analytics.

---

## 3. Service extraction review (Area B)

See [DASHBOARD_PACKAGE2_SERVICE_BOUNDARY_REVIEW.md](./DASHBOARD_PACKAGE2_SERVICE_BOUNDARY_REVIEW.md).

| Service | Post-P1 | P2 action |
|---------|---------|-----------|
| `dashboardActivityService` | ✅ Exists | Maintain — add domain event calls |
| `dashboardPolicyDual` | ✅ Exists | Extend test matrix (M4) |
| `dashboardTrashService` | ✅ Exists (P1-A) | Fold or keep — charter trash item **already satisfied** |
| `dashboardService` | Partial | Thin; remove leaks; add delete workflow |
| `widgetService` | Partial | Add domain event emitters |
| `sidebarCustomizationService` | OK | No extraction required |
| `dashboardAIContextService` | **Missing** | **Create** — A-01, A-03 |
| `dashboardDeleteWorkflowService` | **Missing** (optional name) | **Create or extend dashboardService** — D-07 |

---

## 4. Domain event review (Area C)

See [DASHBOARD_PACKAGE2_DOMAIN_EVENT_REVIEW.md](./DASHBOARD_PACKAGE2_DOMAIN_EVENT_REVIEW.md).

**4 required events** — not yet in `domainEventRegistry.ts`. Charter complete.

---

## 5. Architectural risk (Area D)

See [DASHBOARD_PACKAGE2_RISK_REVIEW.md](./DASHBOARD_PACKAGE2_RISK_REVIEW.md).

**Highest risk:** Calendar/workspace decouple without replacement hooks (business + personal first-run UX).

---

## 6. Charter drift (Package 1 overlap)

| P2 charter item | Post-P1 status |
|-----------------|----------------|
| Trash PE via dashboard adapter | ✅ `dashboardTrashService` (P1-A) |
| File-summary PE | ✅ P1 |
| `dashboardPolicyDual.ts` | ✅ P1 |

**Recommendation:** Treat above as **verification-only** in P2; do not re-implement.

---

## 7. Definition completeness (answer Q1)

| Criterion | Score |
|-----------|------:|
| Objectives clear | ✅ |
| Service targets named | ✅ |
| Domain event catalog | ✅ |
| Decouple strategy | 🟡 — hook owners not assigned |
| P1 overlap reconciled | 🟡 — document in kickoff |

**Fully defined:** **~86%** — conditional authorization sufficient.

---

## 8. Hidden dependencies (answer Q2)

| Dependency | Risk |
|------------|------|
| `ensureBusinessDashboardForUser` callers (6+ modules) | Assume create side effects today |
| `dashboard-context.integration.test.ts` | Asserts calendar/seed on create |
| Calendar module bootstrap API | May not exist — must define or stub |
| Workspace lifecycle subscriber | May not exist |
| `domainEventRegistry` registration order | Fail-closed if emit before register |
| Drive `fileMigrationService` PE chain | D-07 workflow move must preserve |

---

## Cross-reference

| Document | Role |
|----------|------|
| [DASHBOARD_PACKAGE2_SERVICE_BOUNDARY_REVIEW.md](./DASHBOARD_PACKAGE2_SERVICE_BOUNDARY_REVIEW.md) | Service inventory |
| [DASHBOARD_PACKAGE2_DOMAIN_EVENT_REVIEW.md](./DASHBOARD_PACKAGE2_DOMAIN_EVENT_REVIEW.md) | Event catalog |
| [DASHBOARD_PACKAGE2_RISK_REVIEW.md](./DASHBOARD_PACKAGE2_RISK_REVIEW.md) | Risk register |
| [DASHBOARD_PACKAGE2_AUTHORIZATION_DECISION.md](./DASHBOARD_PACKAGE2_AUTHORIZATION_DECISION.md) | Formal decision |

---

**Last updated:** 2026-06-21
