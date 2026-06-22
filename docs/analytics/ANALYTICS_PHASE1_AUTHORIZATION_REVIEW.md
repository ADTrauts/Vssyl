# Analytics Capability — Phase 1 Authorization Review

**Program:** Analytics Capability — Constitutional Modernization  
**Phase:** 1 — Federated L2 Engineering  
**Review date:** 2026-06-22  
**Status:** Authorization review — **governance only, no implementation**

**Prerequisite:** [ANALYTICS_PHASE0B_RATIFICATION.md](./ANALYTICS_PHASE0B_RATIFICATION.md) — **RATIFIED**

**Companion documents:**
- [Phase 1 Scope Validation](./ANALYTICS_PHASE1_SCOPE_VALIDATION.md)
- [Phase 1 Risk Review](./ANALYTICS_PHASE1_RISK_REVIEW.md)
- [Phase 1 Authorization Decision](./ANALYTICS_PHASE1_AUTHORIZATION_DECISION.md)

---

## 1. Purpose

Evaluate whether **Phase 1 — Federated L2 Engineering** is sufficiently defined to authorize implementation ACT, within ratified Phase 0B constraints (SB-01 through SB-08).

---

## 2. Phase 1 objective

Establish an **honest, federated Platform Analytics Capability at L2 readiness** by:

1. Unifying capability service boundaries
2. Enforcing ownership and PE parity
3. Removing false maturity signals (placeholder subscriber, mock surfaces)
4. Hardening the Dashboard consumer contract
5. Documenting canonical APIs and operation matrix

**Target:** L2 CwF candidacy Q4 2026 — certification is **not** authorized in Phase 1 ACT.

---

## 3. Current baseline (post Dashboard P3)

| Asset | Status |
|-------|--------|
| `GET /api/analytics/dashboard-summary` | ✅ Shipped |
| `analyticsDashboardSummaryService` | ✅ Shipped — coupling violations remain |
| `dashboardAnalyticsFacade` | ✅ Shipped |
| QuickStats / `useDashboardStats` | ✅ Capability-backed |
| AI quick-stats | ✅ Capability-backed |
| `/api/analytics/personal`, `/modules/:id`, `/export` | ⚠️ Controller inline Prisma |
| Placeholder event subscriber | ❌ Active — false signal |
| Business workspace analytics | ❌ Mock |
| Operation matrix | ❌ Not documented |
| Capability ownership registry | ❌ Not created |
| Informal G1–G9 readiness | **~12–15/27 (~44–56%)** |

---

## 4. Authorization review — workstream assessment

| Workstream | Defined? | Blocking gaps | Verdict |
|------------|----------|---------------|---------|
| Unified analytics service | ✅ | Naming: `analyticsCapabilityService` vs extend existing | **Authorize** |
| Ownership enforcement | ✅ | Registry format TBD at kickoff | **Authorize** |
| Remove placeholder subscriber | ✅ | None | **Authorize** |
| Dashboard contract hardening | ✅ | Enterprise panel wire = optional kickoff | **Authorize** |
| Business workspace disposition | ✅ | Wire vs hide decision at kickoff (K1-01) | **Authorize** |
| API inventory cleanup | ✅ | Deprecation policy for orphans | **Authorize** |
| PE parity review | ✅ | Policy actions for analytics reads TBD | **Authorize conditional** |
| Activity vs analytics review | ✅ | Personal analytics path | **Authorize** |
| Domain event review | ✅ | Removal only — no pipeline | **Authorize** |
| Capability ownership registry | ✅ | File location: `web/src/lib/` + `docs/analytics/` | **Authorize** |
| Module rollup APIs (Chat, Todo) | ✅ | Coordination with module owners | **Authorize** |
| Operation matrix | ✅ | Template from Dashboard matrix | **Authorize** |
| Contract tests | ✅ | Extend existing test patterns | **Authorize** |
| Optional Redis cache | ⚠️ | Infrastructure decision at kickoff | **Optional** |
| L2 certification | ❌ | Separate candidacy phase | **Out of scope** |
| Warehouse / event pipeline | ❌ | SB-05, SB-06 | **Explicitly excluded** |

**Overall charter completeness:** **~85%** — sufficient for conditional authorization.

---

## 5. Dependencies and blockers

### 5.1 Non-blocking (Phase 1 may proceed)

| Dependency | Notes |
|------------|-------|
| Dashboard L3 archived | Consumer contract stable |
| Module teams for rollup API extraction | Coordination — not hard blocker |
| Admin Portal L3 | Out of Phase 1 scope |

### 5.2 Soft-blockers (kickoff decisions required)

| ID | Decision | Options |
|----|----------|---------|
| **K1-01** | Business workspace analytics | **A)** Wire to capability + business APIs · **B)** Hide segment until Phase 2 |
| **K1-02** | Enterprise panel disposition | **A)** Wire with feature flag · **B)** Permanent gate with demo label |
| **K1-03** | Analytics read PE actions | Define `ANALYTICS_READ` or reuse `DASHBOARD_READ` for dashboard-scoped paths |
| **K1-04** | Orphan components | Mount `BusinessAnalyticsDashboard` / `ChatAnalytics` or delete |
| **K1-05** | Optional cache | Redis vs in-process TTL vs defer |

### 5.3 Hard blockers

**None identified** that require rejecting Phase 1 authorization.

---

## 6. Cross-program impact

| Program | Impact |
|---------|--------|
| Dashboard (archived) | Facade contract must remain stable — additive changes only |
| Admin Portal | No changes authorized |
| Business Workspace | Segment disposition only |
| Platform Events (#2) | Phase 1 removes placeholder; does not build pipeline |
| Context Graph | No Phase 1 changes |
| HR / Chat / Todo modules | Rollup API extraction — bounded coordination |

---

## 7. Effort estimate

| Workstream | Estimate |
|------------|----------|
| Service extraction + controller refactor | 1–2 weeks |
| Module rollup APIs (Chat, Todo) | 1–2 weeks |
| PE parity + tests | 1 week |
| Business workspace disposition | 3–5 days |
| Subscriber removal + registry + docs | 3–5 days |
| Operation matrix + API cleanup | 1 week |
| **Total Phase 1** | **4–6 weeks engineering** |

---

## 8. Authorization readiness score

| Dimension | Score (1–5) |
|-----------|-------------|
| Scope clarity | 4 |
| Constitutional alignment | 5 |
| Dependency clarity | 4 |
| Risk identification | 4 |
| Test strategy | 4 |
| Rollback safety | 5 |
| **Overall** | **4.2 / 5 — Authorize conditional** |

---

## 9. Required questions — authorization subset

| # | Question | Answer |
|---|----------|--------|
| 5 | Is a warehouse authorized in Phase 1? | **No** — SB-05 |
| 6 | Is an event pipeline authorized in Phase 1? | **No** — SB-06; remove placeholder only |
| 14 | Is Phase 1 authorized? | **Conditional yes** — see authorization decision |

---

## 10. Recommendation

**Proceed to authorization decision Option A:** Ratify Phase 0B (complete) + **Authorize Phase 1 (Conditional)** subject to kickoff decisions K1-01 through K1-05.

Phase 1 is **not** a modernization package for warehouse, event pipeline, relationship analytics, or L2 certification ceremony — it is **federation hardening** toward L2 candidacy.

---

**Last updated:** 2026-06-22
