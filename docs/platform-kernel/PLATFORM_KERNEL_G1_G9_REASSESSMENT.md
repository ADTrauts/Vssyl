# Platform Kernel — G1–G9 Reassessment

**Program:** Platform Kernel — L2 Certification Readiness Review  
**Review date:** 2026-06-23  
**Status:** Governance estimate — **not** formal certification scoring

**Scoring:** 3 = PASS · 2 = PARTIAL · 1 = FAIL (per gate)

**Band model (platform capability):** aligned with Analytics L2 CwF precedent

| Range | Interpretation |
|-------|----------------|
| 23–27 | Plain L2 (minimal findings) |
| **20–22** | **L2 WITH FINDINGS** |
| 18–19 | L2 entry |
| ≤17 | Below L2 |

---

## 1. Platform Activity — scorecard

| Gate | Wave 1 | Post-modernization | Status | Evidence |
|------|--------|-------------------|--------|----------|
| **G1 Authorization** | 2 | **2** | PARTIAL | Feed/auth present; no PE on read paths |
| **G2 Auditability** | 1 | **3** | PASS | ACT-R1 closed; canonical `Log` reads |
| **G3 Service boundaries** | 2 | **3** | PASS | `platformActivityQueryService` |
| **G4 API coherence** | 2 | **2** | PARTIAL | 2 compliant direct-Log consumers not delegated |
| **G5 Ownership** | 2 | **3** | PASS | Query service + adoption reports |
| **G6 Test evidence** | 2 | **3** | PASS | Query, feed, AI, Drive tests (26+ IMP suites) |
| **G7 Documentation** | 2 | **3** | PASS | `PLATFORM_ACTIVITY_QUERY_SERVICE.md` + IMP reports |
| **G8 Production safety** | 3 | **3** | PASS | Write isolation; subscriber-style refresh only |
| **G9 User trust** | 2 | **2** | PARTIAL | Legacy table exists; Drive UI legacy mapper |

**Platform Activity total: 22 / 27 (~81%)** — L2 WITH FINDINGS band (upper)

---

## 2. Domain Events — scorecard

| Gate | Wave 1 | Post-modernization | Status | Evidence |
|------|--------|-------------------|--------|----------|
| **G1 Authorization** | 3 | **3** | PASS | Emit post-auth convention |
| **G2 Auditability** | 2 | **2** | PARTIAL | `domain_event_recorded` mirror; no read API |
| **G3 Service boundaries** | 2 | **3** | PASS | Stubs gated; matrix-driven registration |
| **G4 API coherence** | 2 | **2** | PARTIAL | No external consume contract |
| **G5 Ownership** | 2 | **3** | PASS | Registry + emitter matrix + HR facade |
| **G6 Test evidence** | 2 | **3** | PASS | Matrix, registration, HR, registry tests |
| **G7 Documentation** | 3 | **3** | PASS | `DOMAIN_EVENTS.md` + operation matrix |
| **G8 Production safety** | 2 | **2** | PARTIAL | In-process bus; no crash recovery (L3) |
| **G9 User trust** | 2 | **2** | PARTIAL | Notification/AI map narrow subset |

**Domain Events total: 21 / 27 (~78%)** — L2 WITH FINDINGS band

---

## 3. Combined Platform Kernel — scorecard

Holistic scoring (not arithmetic mean — weakest cross-cutting gates weighted).

| Gate | Score | Status | Rationale |
|------|------:|--------|-----------|
| **G1 Authorization** | 2 | PARTIAL | Activity reads lack PE parity |
| **G2 Auditability** | 3 | PASS | Activity reads fixed; DE log mirror |
| **G3 Service boundaries** | 3 | PASS | Query layer + honest subscriber registry |
| **G4 API coherence** | 2 | PARTIAL | Split activity/DE contracts; partial delegation |
| **G5 Ownership** | 3 | PASS | Documented owners across pillars |
| **G6 Test evidence** | 3 | PASS | IMP + DE test suites |
| **G7 Documentation** | 3 | PASS | Kernel doc suite complete |
| **G8 Production safety** | 2 | PARTIAL | DE in-process durability |
| **G9 User trust** | 2 | PARTIAL | Fan-out coverage gaps |

**Combined total: 21 / 27 (~78%)** — **L2 WITH FINDINGS band**

---

## 4. Delta from Wave 1

| Surface | Wave 1 | Post-modernization | Δ |
|---------|--------|-------------------|---|
| Platform Activity | ~16/27 (59%) | **22/27 (81%)** | **+6** |
| Domain Events | ~18/27 (67%) | **21/27 (78%)** | **+3** |
| Combined | ~15/27 (56%) | **21/27 (78%)** | **+6** |

**Primary uplift drivers:** G2 (ACT-R1), G3 (query layer + subscriber honesty), G5/G6/G7 (documentation + tests).

---

## 5. Evaluation eligibility by band

| Outcome | Eligible at readiness? |
|---------|------------------------|
| Enter L2 evaluation | **Yes** |
| L2 WITH FINDINGS (projected) | **Yes** |
| Plain L2 (23+) | **No** — projected 21–22 |
| L3 | **No** — infrastructure capability; durability/replay required |

---

## 6. Gate notes for evaluators

### G2 (restored)

ACT-R1 eliminated production `prisma.activity` reads. Remaining `deleteMany` in `driveDeleteService` is **write cleanup**, not a read-path violation — document as major finding PK-ACT-M1, not G2 fail.

### G8 (partial)

In-process domain event bus is **honest at L2** per charter; evaluators should not treat absence of replay as L2 block if documented as L3 scope (PK-DE-M3).

### G9 (partial)

Narrow notification (3 types) and AI (6 types) consumption is **documented partial** — finding-track, not evaluation blocker.

---

**Last updated:** 2026-06-23
