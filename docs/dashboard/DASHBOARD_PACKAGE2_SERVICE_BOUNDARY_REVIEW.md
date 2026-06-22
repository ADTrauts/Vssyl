# Dashboard Module — Package 2 Service Boundary Review

**Program:** Dashboard Module Wave 3 — Package 2 Authorization Review  
**Review date:** 2026-06-21  
**Status:** Governance only

---

## 1. Service inventory (post–Package 1)

| Service | Lines (approx) | Canonical? | PE | Activity | Domain events |
|---------|----------------|------------|-----|----------|---------------|
| `dashboardService.ts` | ~550 | **Partial** | Via controller | ✅ create/update/delete | ❌ |
| `widgetService.ts` | ~140 | **Partial** | Via controller | ✅ CRUD + batch | ❌ |
| `sidebarCustomizationService.ts` | ~380 | **Yes** (preferences SoR) | Via controller | ✅ customize | ❌ N/A |
| `dashboardActivityService.ts` | ~270 | **Yes** | — | Emitter | ❌ |
| `dashboardTrashService.ts` | ~130 | **Yes** (trash adapter) | ✅ | ✅ trash/restore/delete | ❌ |
| `dashboardPolicyDual.ts` | ~80 | **Yes** | Dual helper | — | — |
| `dashboardAIContextController.ts` | ~290 | **No** — fat controller | ✅ | — | — |
| `fileMigrationService.ts` | external | Drive owns | Drive PE | — | — |
| `businessWorkspaceSeeder.ts` | external | Workspace owns | — | — | — |

---

## 2. Required services (answer Q5)

### 2.1 Must create (P2)

| Service | Owns | Replaces |
|---------|------|----------|
| **`dashboardAIContextService`** | A-01 overview, A-03 widgets bounded reads | Prisma blocks in `dashboardAIContextController` |
| **`dashboardDomainEventService`** (or typed emitters file) | 4 required domain events | Inline future emits |

### 2.2 Must extend (P2)

| Service | Extension |
|---------|-----------|
| **`dashboardService`** | Remove calendar/seed; optional `deleteDashboardWithFiles` workflow |
| **`widgetService`** | Domain event emit after activity |
| **`dashboardActivityService`** | Coordinate activity + domain event ordering (activity first) |

### 2.3 Optional consolidation

| Candidate | Rationale |
|-----------|-----------|
| Merge `dashboardTrashService` → `dashboardService` | Single module service surface; keep adapter methods |
| `dashboardDeleteWorkflowService` | Only if `dashboardService` exceeds maintainability — charter allows extend |

### 2.4 Explicitly not required in P2

| Service | Deferred to |
|---------|-------------|
| `dashboardAnalyticsFacade` | Package 3 |
| `dashboardWidgetCapabilityService` | Package 4 / advisory |
| `dashboardPolicyService` | Satisfied by `dashboardPolicyDual` + PE handlers |

---

## 3. Controller thinning targets

| Controller | Current | P2 target |
|------------|---------|-----------|
| `dashboardController` | PE + **fat delete** (file migration switch) | PE + delegate to `dashboardService.deleteWithFiles` |
| `dashboardAIContextController` | PE + Prisma queries | PE + `dashboardAIContextService` only |
| `widgetController` | Thin ✅ | Unchanged |
| `sidebarController` | Thin ✅ | Unchanged |
| `trashController` | Delegates dashboard_tab ✅ | Verify only |

---

## 4. Service ownership matrix

| Data / behavior | Owner | Dashboard role |
|-----------------|-------|----------------|
| `Dashboard` row | Dashboard module | SoR |
| `Widget` row | Dashboard module | SoR |
| Sidebar preferences JSON | Dashboard module | SoR in `preferences` |
| Calendar bootstrap | **Calendar module** | Must not create in P2 |
| Business workspace seed | **Workspace / platform hook** | Subscribe to tab.created |
| File migration on delete | **Drive module** | Orchestrate via service call |
| Conversation cleanup on delete | **Chat module** | Delegate delete/trash |
| AI context aggregates | **Analytics capability** (P3) | Stub only until facade |
| Module activity log | Platform | Emit via `dashboardActivityService` |
| Domain event bus | Platform | Emit via domain event helpers |

---

## 5. Decouple workstreams

### 5.1 Calendar provision (DASH-M2)

**Today:** `dashboardService.createDashboard` → `prisma.calendar.create` for personal dashboards.

**P2 target:** Remove from dashboard service. Options (kickoff must pick one):

| Option | Owner | Pros | Cons |
|--------|-------|------|------|
| **A** | Calendar listens to `dashboard.tab.created` | Clean event-driven | Requires subscriber implementation |
| **B** | Calendar exposes `ensurePersonalPrimaryCalendar(userId)` API | Explicit, testable | Synchronous coupling remains |
| **C** | Lazy provision on first Calendar module open | No dashboard coupling | UX delay |

**Recommendation:** **Option A** aligned with P2 domain events; **Option B** acceptable interim.

### 5.2 Workspace seed (DASH-M3)

**Today:** `createDashboard` with `businessId` → `seedBusinessWorkspaceResources` (folder, calendar, conversation).

**P2 target:** Remove synchronous seed from create path.

| Option | Mechanism |
|--------|-----------|
| **A** | `dashboard.tab.created` subscriber in workspace/platform layer |
| **B** | Business module `onMemberDashboardEnsured` hook |

**Recommendation:** **Option A** — reuses P2 domain event investment.

### 5.3 Delete workflow (DASH-M8)

**Today:** `dashboardController.deleteDashboard` switches on `fileAction`, calls Drive migration, then `dashboardService.deleteDashboard`.

**P2 target:** Single service method:

```
deleteDashboardWithFiles(userId, dashboardId, fileAction?) → { deleted, migration }
```

Controller: authorize → call service → respond.

---

## 6. Findings closure mapping

| Finding | P2 closure mechanism |
|---------|-------------------|
| **DASH-B3** (server) | `dashboardAIContextService` + decouple create/delete leaks |
| **DASH-M2** | Calendar removed from `createDashboard` |
| **DASH-M3** | Seeder removed from `createDashboard` |
| **DASH-M4** | `dashboardPolicyDual` + operation matrix test suite |
| **DASH-M8** | Delete workflow in service |

---

## 7. API coherence (G4)

| Item | P2 action |
|------|-----------|
| `/api/dashboard` vs `/api/widget` split | **No change** — document as intentional (DASH-A1 advisory) |
| AI routes under `/api/dashboard/ai/context/*` | Unchanged — controller thins |

---

## 8. Gaps requiring kickoff record

| ID | Gap |
|----|-----|
| K2-01 | Calendar bootstrap owner (A/B/C above) |
| K2-02 | Workspace seed subscriber owner |
| K2-03 | Conversation delete: Chat API vs documented FK exception |
| K2-04 | `dashboardTrashService` merge vs separate file |

---

**Last updated:** 2026-06-21
