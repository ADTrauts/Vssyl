# Dashboard Module — Package 2 Authorization Decision

**Program:** Dashboard Module Wave 3 — Package 2 Authorization Review  
**Decision date:** 2026-06-21  
**Authority:** Constitutional governance review (Package 2 gate)  
**Status:** **Decision recorded — governance only**

---

## Decision

### **Option A — Authorize Package 2 (Conditional)**

Package 2 — Service Boundary Alignment is **authorized to enter implementation** subject to four pre-kickoff clarifications. No additional governance phase required.

**Conditions (must be recorded before decouple merges):**

| ID | Condition | Owner |
|----|-----------|-------|
| **K2-01** | Calendar bootstrap disposition after M2 removal (event subscriber vs Calendar API) | Calendar + Dashboard leads |
| **K2-02** | Workspace seed disposition after M3 removal (`tab.created` subscriber owner) | Platform / Workspace |
| **K2-03** | D-07 delete workflow service boundary (`dashboardService` extend vs dedicated service) | Dashboard lead |
| **K2-04** | Conversation cleanup on delete: Chat delegation vs documented FK exception | Chat + Dashboard |

**Failure to record K2-01–K2-02:** Decouple PRs **blocked** (calendar/seed removal). Domain event and AI service work may proceed in parallel.

---

## Rationale

### Why Option A

| Factor | Assessment |
|--------|------------|
| Charter completeness | **~86%** — objectives, services, events defined |
| Package 1 foundation | PE, activity, trash adapter complete |
| Finding mapping | B3 server path, M2/M3/M8/M4 clearly scoped |
| Domain event model | Complete — 4 required, optional deferred |
| Risk profile | Medium-high but bounded with hook plan |
| P1 overlap | Trash PE / file-summary already done — verification only |

### Why not Option B

Option B (additional governance phase) would be warranted if:

- Domain event catalog were undefined — **it is defined**
- Service extraction targets unknown — **they are named**
- B3 closure criteria conflicted across docs — **resolved**: P2 = server boundary; P3 = analytics

Remaining gaps are **kickoff decisions**, not charter gaps.

---

## Finding closure authorization

| Finding | Authorized to close in P2? | Condition |
|---------|---------------------------|-----------|
| **DASH-B3** | **Partial (server)** | AI service + decouple; not client analytics |
| **DASH-M2** | **Yes** | K2-01 hook live |
| **DASH-M3** | **Yes** | K2-02 subscriber live |
| **DASH-M4** | **Yes** | Policy dual + matrix tests |
| **DASH-M8** | **Yes** | K2-03 service workflow |
| **DASH-B3 full** | **No** | Package 3 |

---

## Authorization boundaries

### Permitted in Package 2 ACT

- Create `dashboardAIContextService` — move A-01/A-03 Prisma from controller
- Remove calendar create from `dashboardService.createDashboard`
- Remove `seedBusinessWorkspaceResources` from create path
- Extract delete+file workflow to service
- Register 4 domain event types + emitters in services
- Extend `dashboardPolicyDual` test matrix
- Update operation matrix documentation
- Integration tests for domain events and decouple paths

### Not permitted (out of scope)

- `dashboardAnalyticsFacade` (Package 3)
- Client quick-stats / `useDashboardStats` changes (Package 3)
- Registry unification `coreModuleRegistry` (Package 3)
- Certification award / ledger update
- Prisma schema changes
- New HTTP routes (unless kickoff approves subscriber-only internal APIs)

### Verification-only (P1 complete — do not re-build)

- Trash PE via `dashboardTrashService`
- File-summary PE on D-08
- Activity on 16 mutations
- A-02 metadata stub

---

## Required questions — answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Is Package 2 fully defined? | **Conditional yes (~86%)** — K2-01–K2-04 at kickoff |
| 2 | Hidden dependencies? | **Yes** — ensureBusiness callers, integration tests, hook owners |
| 3 | Remaining cross-module reads? | Calendar/seed on create; Drive on delete; Chat on delete; client stats (P3) |
| 4 | Remaining direct Prisma paths? | AI controller; dashboardService calendar/conv; seeder — see Service Boundary Review |
| 5 | Required services? | `dashboardAIContextService`, domain event emitters, extended `dashboardService` |
| 6 | Required domain events? | **4:** tab.created, tab.deleted, widget.added, widget.removed |
| 7 | Highest architectural risk? | Decouple calendar/seed without replacement hooks |
| 8 | Expected DASH-B3 closure? | **Server/service boundary closed**; full B3 at P3 |
| 9 | Readiness after Package 2? | **~22–23/27 (~81–85%)** |
| 10 | Authorization recommendation? | **Option A — Authorize (Conditional)** |
| 11 | Should implementation begin? | **Yes** — parallel tracks: AI service + domain events; decouple after K2-01/K2-02 |

---

## Sign-off posture

| Gate | Status |
|------|--------|
| Package 1 complete | ✅ |
| Phase 1 Charter | ✅ |
| Package 2 Authorization Review | ✅ **This document** |
| Implementation ACT | ✅ **Authorized (conditional)** |
| Certification ACT | ❌ Not authorized |

---

**Last updated:** 2026-06-21
