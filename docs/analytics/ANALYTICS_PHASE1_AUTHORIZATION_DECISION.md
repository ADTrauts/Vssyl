# Analytics Capability — Phase 1 Authorization Decision

**Program:** Analytics Capability — Constitutional Modernization  
**Decision date:** 2026-06-22  
**Authority:** Architecture council governance review (Phase 1 gate)  
**Status:** **Decision recorded — governance only**

**Prerequisite:** [ANALYTICS_PHASE0B_RATIFICATION.md](./ANALYTICS_PHASE0B_RATIFICATION.md) — **RATIFIED**

---

## Decision

### **Option A — Ratify Phase 0B + Authorize Phase 1 (Conditional)**

Phase 0B is **ratified** (see ratification document).  
Phase 1 — Federated L2 Engineering is **authorized to enter implementation** subject to kickoff clarifications below.

---

## Rationale

### Why Option A (not B or C)

| Option | Verdict | Reason |
|--------|---------|--------|
| **A — Ratify + Authorize Phase 1** | ✅ **Selected** | Phase 0B complete; Phase 1 ~85% defined; no hard blockers; SB-01–SB-08 satisfied |
| **B — Ratify + Defer Phase 1** | ❌ Rejected | Mock surfaces and coupling violations remain user-facing; portfolio priority #1 |
| **C — Reject Phase 0B** | ❌ Rejected | Six discovery + five strategic documents; constitutional alignment confirmed |

### Why Phase 1 is ready

| Factor | Assessment |
|--------|------------|
| Phase 0B ratification | **Complete** — SB-01 through SB-08 |
| Scope validation | **~85%** — K1-01–K1-05 kickoff only |
| Constitutional conflicts | **None** |
| Warehouse / pipeline scope creep | **Explicitly excluded** — SB-05, SB-06 |
| Dashboard consumer stability | Facade contract established Wave 3 |
| Blocking findings | **None** for authorization |

### Why not defer Phase 1

- Business workspace mock violates honest metrics principle post Dashboard P3
- Placeholder subscriber creates false governance signal
- Chat/Todo coupling is active trust boundary violation
- L2 candidacy cannot proceed without Phase 1 engineering

---

## Conditions (pre-merge kickoff)

| ID | Condition | Owner | Required before |
|----|-----------|-------|-----------------|
| **K1-01** | Record business workspace disposition: wire **or** hide | Product + Analytics | First UI merge |
| **K1-02** | Record enterprise panel disposition: wire+flag **or** permanent gate | Product + Dashboard | Enterprise panel merge |
| **K1-03** | Record analytics read PE action taxonomy | Platform + Analytics | PE parity merge |
| **K1-04** | Record orphan component disposition: mount **or** delete | Analytics | Orphan cleanup merge |
| **K1-05** | Record cache decision: Redis / in-process / defer | Platform | Cache merge (if any) |

**Failure to record K1-01–K1-03:** PE parity and business workspace merges **blocked** until recorded.

---

## Authorization boundaries

### Permitted in Phase 1 ACT

- Create/refactor `analyticsCapabilityService` and related service methods
- Extract Prisma from `analyticsController` into capability service layer
- Add Chat/Todo module rollup API methods (coordination with module owners)
- Remove `analyticsDomainEventSubscriber` placeholder registration
- PE gates on all `/api/analytics/*` routes
- Wire or hide business workspace analytics segment
- Create `analyticsCapabilityOwnership.ts` + ownership registry doc
- Create `ANALYTICS_OPERATION_MATRIX.md`
- Harden `dashboardAnalyticsFacade` contract tests
- Disposition orphan analytics components
- Optional TTL cache for dashboard-summary
- Ledger reclassification **proposal document** (not ledger ACT)

### Not permitted (remains out of scope)

| Exclusion | Authority |
|-----------|-----------|
| Warehouse / MVAP Prisma modules | SB-05 |
| Event pipeline / rollup processors | SB-06 |
| Analytics event subscriber (production) | SB-06 |
| L2 certification award | Separate candidacy |
| Ledger update | Explicit stop condition |
| Admin Portal analytics changes | L3 satellite — unchanged |
| Wiring `ai/analytics/*` scaffold | SB-07 / AI Platform charter |
| Dashboard composition changes beyond consumer hardening | Dashboard archived |
| Schema migrations for rollup tables | SB-05 |
| Relationship analytics implementation | Phase 2–3 |
| Historical trend APIs | Phase 3 |

---

## Finding closure authorization

| Finding | Authorized to close in Phase 1? | Condition |
|---------|-------------------------------|-----------|
| **AN-01** Unified service | **Yes** | Service extraction complete |
| **AN-02** Chat/Todo coupling | **Yes** | Module rollup APIs wired |
| **AN-03** PE gap | **Yes** | K1-03 + all routes gated |
| **AN-04** Placeholder subscriber | **Yes** | Removed |
| **AN-05** Mock business workspace | **Yes** | K1-01 |
| **AN-06** Operation matrix | **Yes** | Doc published |
| **AN-07** Ownership registry | **Yes** | Registry + tests |
| **AN-08** Activity conflation | **Yes** | Aggregate-only personal DTO |
| **AN-11** Enterprise panels | **Partial** | K1-02 |
| **AN-12** Ledger class | **No** — proposal only | Governance follow-up |

---

## Required questions — decision answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Is Phase 0B ready for ratification? | **Yes — ratified** |
| 2 | Should Hybrid Option C be ratified? | **Yes — ratified** |
| 3 | Is Analytics officially a Hybrid Domain? | **Yes** |
| 4 | Is Analytics officially a Platform Capability? | **Yes — primary engine within Hybrid Domain** |
| 5 | Is a warehouse authorized in Phase 1? | **No** |
| 6 | Is an event pipeline authorized in Phase 1? | **No — remove placeholder only** |
| 14 | Is Phase 1 authorized? | **Yes — conditional (Option A)** |
| 15 | Next implementation package? | **Package 1 — Federated L2 Trust & Service Boundary** |

---

## Next steps

1. Record kickoff decisions K1-01 through K1-05 (1-page kickoff record optional)
2. Enter **ACT mode** for Phase 1 Package 1 engineering
3. Upon Phase 1 completion → Phase 1 closeout review → L2 candidacy governance (separate)

---

**Last updated:** 2026-06-22
