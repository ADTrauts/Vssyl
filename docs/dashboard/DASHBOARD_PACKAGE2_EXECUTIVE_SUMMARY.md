# Dashboard Module — Package 2 Executive Summary

**Program:** Dashboard Module Wave 3 — Package 2 Authorization Review  
**Date:** 2026-06-21  
**Audience:** Engineering leadership, governance council  
**Status:** Governance complete — **no implementation performed**

---

## Bottom line

**Package 2 — Service Boundary Alignment is authorized to enter implementation (Option A, conditional).**

Package 2 addresses **architectural coupling** left after Package 1 trust work: extract AI context to a service, decouple calendar/workspace side effects from dashboard create, thin delete orchestration, and register **4 required domain events**. Expected outcome: **~22–23/27 (~81–85%)**, **L3 WITH FINDINGS evaluation eligible**.

**DASH-B3** closes for **server/service boundaries** in P2; **full B3** (client analytics aggregates) remains **Package 3**.

---

## Context

| Milestone | Status |
|-----------|--------|
| Package 1 Trust Foundation | ✅ Complete |
| Current readiness | **~20–21/27 (~74–78%)** |
| Package 2 target | **~23/27 (~85%)** |
| Closed (P1) | B1, B2, B4, B5 |
| Remaining | B3 (partial), M2, M3, M4, M8 |

---

## What Package 2 delivers

| Workstream | Outcome |
|------------|---------|
| **AI context service** | `dashboardAIContextService` — A-01/A-03 out of controller |
| **Decouple create** | Remove calendar provision (M2) + workspace seed (M3) |
| **Delete workflow** | Service-owned D-07 orchestration (M8) |
| **Domain events** | 4 required types registered + emitted |
| **Policy matrix** | Extended `dashboardPolicyDual` tests (M4) |

---

## DASH-B3 posture

| Layer | P2 | P3 |
|-------|----|----|
| AI controller foreign Prisma | ✅ Removed (A-02 stubbed P1) | — |
| AI overview/widgets in service | ✅ | — |
| Calendar/seed in createDashboard | ✅ Decouple | — |
| Client quick-stats / analytics | — | ✅ Facade |

---

## Domain events (required 4)

1. `dashboard.tab.created`
2. `dashboard.tab.deleted`
3. `dashboard.widget.added`
4. `dashboard.widget.removed`

Optional events (trash, layout, tab.updated) may defer without blocking authorization.

---

## Top risks

1. **Calendar/workspace decouple** without replacement hooks — breaks first-run UX  
2. **Delete workflow move** — must preserve Drive PE chain  
3. **6+ modules** calling `ensureBusinessDashboardForUser` — assume sync side effects today  

---

## Decision

| | |
|---|---|
| **Recommendation** | **Option A — Authorize Package 2 (Conditional)** |
| **Implementation begin?** | **Yes** — AI service + domain events may start immediately; decouple after K2-01/K2-02 |
| **Certification** | **Not authorized** |
| **Ledger** | **Not updated** |

---

## Pre-kickoff conditions

| ID | Item |
|----|------|
| K2-01 | Calendar bootstrap after M2 removal |
| K2-02 | Workspace seed subscriber after M3 removal |
| K2-03 | Delete workflow service boundary |
| K2-04 | Conversation cleanup strategy on delete |

---

## Deliverables produced

| Document | Purpose |
|----------|---------|
| [DASHBOARD_PACKAGE2_AUTHORIZATION_REVIEW.md](./DASHBOARD_PACKAGE2_AUTHORIZATION_REVIEW.md) | Full B3, service, event review |
| [DASHBOARD_PACKAGE2_SERVICE_BOUNDARY_REVIEW.md](./DASHBOARD_PACKAGE2_SERVICE_BOUNDARY_REVIEW.md) | Service inventory + extraction |
| [DASHBOARD_PACKAGE2_DOMAIN_EVENT_REVIEW.md](./DASHBOARD_PACKAGE2_DOMAIN_EVENT_REVIEW.md) | Event catalog |
| [DASHBOARD_PACKAGE2_RISK_REVIEW.md](./DASHBOARD_PACKAGE2_RISK_REVIEW.md) | Risk register |
| [DASHBOARD_PACKAGE2_AUTHORIZATION_DECISION.md](./DASHBOARD_PACKAGE2_AUTHORIZATION_DECISION.md) | Formal Option A decision |
| **This document** | Executive summary |

---

## Required questions — quick reference

1. **Fully defined?** Conditional yes (~86%)  
2. **Hidden dependencies?** ensureBusiness callers, integration tests, hook owners  
3. **Cross-module reads remaining?** Calendar, seed, Drive delete, Chat delete; client P3  
4. **Direct Prisma paths?** AI controller, dashboardService leaks, seeder  
5. **Required services?** `dashboardAIContextService`, extended `dashboardService`, domain emitters  
6. **Required domain events?** 4 (tab created/deleted, widget added/removed)  
7. **Highest risk?** Decouple without hooks  
8. **B3 closure?** Server boundary in P2; full in P3  
9. **Readiness after P2?** ~22–23/27  
10. **Authorization?** Option A conditional  
11. **Begin implementation?** Yes, with kickoff conditions  

---

## Next step

Record **Package 2 Implementation Kickoff** (K2-01–K2-04), then open engineering ACT. Begin with low-risk tracks (AI service extraction, domain event registry) while hook owners finalize decouple contracts.

---

**Last updated:** 2026-06-21
