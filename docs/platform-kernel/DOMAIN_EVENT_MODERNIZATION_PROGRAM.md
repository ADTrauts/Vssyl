# Domain Event Modernization Program

**Program:** Platform Kernel Modernization — Domain Events  
**Charter:** [DOMAIN_EVENTS_HARDENING_CHARTER.md](./DOMAIN_EVENTS_HARDENING_CHARTER.md)  
**Date:** 2026-06-23  
**Status:** Program plan — **not authorized for implementation**

**Precondition:** ACT-R1 complete; Platform Activity **L2 candidate**.

---

## 1. Program objective

Raise Platform Domain Events from **honest L1** to **L2 certification candidacy** by:

1. Subscriber registry honesty
2. Module adoption closure (HR critical path)
3. Documented subscriber operation matrix
4. Registry adoption CI

**Explicitly deferred to L3:** Durability, queues, replay APIs.

---

## 2. Program structure

```
Platform Kernel — Domain Events
├── W2-P2 — Hardening Charter (THIS — COMPLETE)
├── W3-DE — Implementation (NOT AUTHORIZED)
│   ├── DE-1 — Subscriber honesty + operation matrix
│   ├── DE-2 — Adoption closure (HR + registry audit)
│   └── DE-3 — Consumer expansion (notification/AI)
├── W4 — Domain Events L2 certification evaluation (FUTURE)
└── W5 — L3 durability + replay (FUTURE)
```

---

## 3. Implementation packages (planned)

### PK-W3-DE-1 — Subscriber Honesty + Operation Matrix

| Field | Detail |
|-------|--------|
| **Priority** | **P0** |
| **Objective** | Production registry reflects real capabilities |
| **Scope** | Unregister or feature-flag `search_index_stub`, `workflow_router_stub`; publish subscriber operation matrix; update `DOMAIN_EVENTS.md`; subscriber integration tests |
| **Out of scope** | Search index, workflow router implementation |
| **Risk** | Low |
| **L2 impact** | G3, G8 ↑ |

**Deliverables:**
- Updated `registerDomainEventSubscribers.ts`
- `docs/architecture/DOMAIN_EVENT_SUBSCRIBER_MATRIX.md`
- Tests: stub absence + retained subscriber smoke tests

---

### PK-W3-DE-2 — Adoption Closure

| Field | Detail |
|-------|--------|
| **Priority** | **P0** |
| **Objective** | Close HR gap; verify registry adoption |
| **Scope** | `hrDomainEventService.ts`; wire critical HR mutations; registry-vs-emit audit script or CI; optional `driveDomainEventService` thin wrapper |
| **Owner** | Platform Kernel + BO/HR module owner |
| **Risk** | Medium |
| **L2 impact** | G5, G6 ↑ |

**Deliverables:**
- HR domain event facade + tests
- `DOMAIN_EVENT_REGISTRY_ADOPTION_REPORT.md`
- Deprecation list for orphan registry types (governance)

---

### PK-W3-DE-3 — Consumer Expansion (optional L2+)

| Field | Detail |
|-------|--------|
| **Priority** | **P2** |
| **Objective** | Broaden notification + AI mappings for high-value events |
| **Scope** | Notification switch expansion (chat, calendar, place subset); AI consumer type list review; webhook documentation |
| **Risk** | Medium — notification noise |
| **L2 impact** | G9 ↑ |

**Not required for L2 candidacy** — improves user trust post-certification.

---

### PK-W5-DE-4 — Durability + Replay (L3)

| Field | Detail |
|-------|--------|
| **Priority** | **L3 horizon** |
| **Objective** | Transactional outbox or queue; admin replay; dead-letter |
| **Scope** | Infrastructure — **separate authorization** |
| **Risk** | High |
| **Prerequisite** | L2 certified |

See [DOMAIN_EVENT_REPLAY_REVIEW.md](./DOMAIN_EVENT_REPLAY_REVIEW.md).

---

### Cross-program dependencies

| Program | Dependency on Domain Events |
|---------|----------------------------|
| **Search modernization** | Implements real `search_index` consumer — register when ready |
| **Workflow automation** | Implements `workflow_router` — register when ready |
| **Analytics Phase 2** | May consume domain events — **not** activity table |
| **Realtime certification** | Socket subscriber exists — separate surface |

---

## 4. Sequencing (Option D — Hybrid)

```
ACT-R1 (DONE)
    ↓
PK-W3-DE-1  Subscriber honesty     ← fastest L2 path start
    ↓
PK-W3-DE-2  HR + adoption audit    ← parallel-friendly after DE-1
    ↓
L2 readiness review
    ↓
PK-W3-DE-3  Consumer expansion     ← optional
    ↓
L2 certification evaluation
    ↓
PK-W5-DE-4  Replay / durability    ← L3 only
```

**Parallel work allowed:** DE-2 HR facade can begin after DE-1 stub removal is merged.

---

## 5. Certification path

### Domain Events L2 checklist

- [ ] Stub subscribers removed or feature-flagged (DE-1)
- [ ] Subscriber operation matrix published (DE-1)
- [ ] HR domain event facade + critical emits (DE-2)
- [ ] Registry adoption audit complete (DE-2)
- [ ] Subscriber integration tests for retained handlers (DE-1/2)
- [ ] `DOMAIN_EVENTS.md` aligned with registry (DE-1)
- [ ] Combined kernel: Activity L2 candidacy maintained (ACT-R1)

### Projected G1–G9 (Domain Events)

| Gate | Current | Post DE-1 | Post DE-1+2 |
|------|--------:|----------:|------------:|
| G1 Authorization | 3 | 3 | 3 |
| G2 Auditability | 2 | 2 | 3 |
| G3 Service boundaries | 2 | **3** | **3** |
| G4 API coherence | 2 | 2 | 2 |
| G5 Ownership | 2 | 2 | **3** |
| G6 Testing | 2 | **3** | **3** |
| G7 Documentation | 3 | **3** | **3** |
| G8 Production safety | 2 | **3** | **3** |
| G9 User trust | 2 | 2 | 2 |
| **Total /27** | **~18 (~67%)** | **~21 (~78%)** | **~22 (~81%)** |

**L2 threshold:** ~75% (≥20/27) — achievable after **DE-1 + DE-2**.

### Combined Platform Kernel L2

Requires **both:**
- Platform Activity L2 candidacy ✅ (post ACT-R1)
- Domain Events L2 candidacy (post DE-1 + DE-2)

---

## 6. Risk register

| ID | Risk | Mitigation |
|----|------|------------|
| DE-R1 | HR facade delays BO certification | Prioritize DE-2; BO owner sign-off |
| DE-R2 | Registry orphan types confuse adopters | Adoption audit + deprecate list |
| DE-R3 | Webhook latency on emit path | Document; async wrapper in DE-3 |
| DE-R4 | Premature replay investment | Charter defers to L3 |
| DE-R5 | Search team expects stub to exist | Communication + unregister |

---

## 7. Success metrics

| Metric | Target (post DE-1+2) |
|--------|----------------------|
| Production stub subscribers | **0** |
| HR critical mutations with domain emit | **100%** |
| Major modules with facade or documented delegation | **12/12** |
| G-score (Domain Events) | **≥20/27** |
| Registry types without emit site (orphans) | Documented + phased deprecation |

---

## 8. Authorization gate

Implementation packages **PK-W3-DE-*** require:

1. Engineering lead approval
2. Architecture council acknowledgment of Option D sequencing
3. BO owner commitment for HR facade (DE-2)

**No code changes authorized by this document.**

---

**Last updated:** 2026-06-23
