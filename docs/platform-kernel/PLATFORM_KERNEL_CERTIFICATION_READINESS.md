# Platform Kernel — Certification Readiness

**Program:** Platform Kernel Modernization — Wave 1  
**Date:** 2026-06-22  
**Status:** Readiness assessment only — **no certification execution**

**Framework:** G1–G9 gates per platform capability certification pattern (see Analytics L2 CwF, Dashboard L3 CwF).

---

## 1. Maturity summary

| Surface | Current level | Honest level | Target (program) |
|---------|---------------|--------------|------------------|
| **Platform Activity** | L1 | L1 | L2 → L3 |
| **Domain Events** | L1–L2 hybrid | L1 | L2 → L3 |
| **Combined Platform Kernel** | **L1** | **L1** | L2 (joint) before L3 |

**L4:** Not applicable — kernel is infrastructure, not reference implementation.

---

## 2. Platform Activity — G1–G9 posture (estimated)

| Gate | Score | Status | Primary gap |
|------|------:|--------|-------------|
| G1 Authorization | 2 | PARTIAL | Feed API uses auth but no PE on read |
| G2 Auditability | 1 | **FAIL** | ACT-R1 legacy reads |
| G3 Service boundaries | 2 | PARTIAL | No platform read service |
| G4 API coherence | 2 | PARTIAL | Feed merges incompatible sources |
| G5 Ownership | 2 | PARTIAL | Read federation unowned |
| G6 Testing | 2 | PARTIAL | Write tests; no read-contract CI |
| G7 Documentation | 2 | PARTIAL | Module models; no kernel matrix |
| G8 Production safety | 3 | PASS | Writes isolated; failures logged |
| G9 User trust | 2 | PARTIAL | Feed may omit or misrepresent actions |
| **Total** | **~16/27 (~59%)** | **Below L2 threshold** | ACT-R1 |

**L2 candidacy blocker:** G2 Auditability — ACT-R1 must close before honest L2 evaluation.

**L3 candidacy blockers:** Platform read service, operation matrix CI, PE read policy, activity type registry.

---

## 3. Domain Events — G1–G9 posture (estimated)

| Gate | Score | Status | Primary gap |
|------|------:|--------|-------------|
| G1 Authorization | 3 | PASS | Emit post-auth only by convention |
| G2 Auditability | 2 | PARTIAL | Log mirror exists; no read API |
| G3 Service boundaries | 2 | PARTIAL | Stub subscribers; HR gap |
| G4 API coherence | 2 | PARTIAL | No external consume API |
| G5 Ownership | 2 | PARTIAL | Registry owned; adoption uneven |
| G6 Testing | 2 | PARTIAL | Good emit tests; subscriber gaps |
| G7 Documentation | 3 | PASS | DOMAIN_EVENTS.md + registry |
| G8 Production safety | 2 | PARTIAL | In-process durability limits |
| G9 User trust | 2 | PARTIAL | Narrow notification/AI fan-out |
| **Total** | **~18/27 (~67%)** | **Near L2 band** | Stubs + adoption audit |

**L2 candidacy:** **Achievable** after stub retirement/register honesty + adoption audit + subscriber operation matrix.

**L3 candidacy blockers:** Durability story (queue/replay), full consumer matrix, HR emission, platform consume contract.

---

## 4. Combined Platform Kernel — G1–G9 posture (estimated)

| Gate | Score | Status |
|------|------:|--------|
| G1 | 2 | PARTIAL |
| G2 | 1 | **FAIL** — Activity reads |
| G3 | 2 | PARTIAL |
| G4 | 2 | PARTIAL |
| G5 | 2 | PARTIAL |
| G6 | 2 | PARTIAL |
| G7 | 2 | PARTIAL |
| G8 | 2 | PARTIAL |
| G9 | 2 | PARTIAL |
| **Total** | **~15/27 (~56%)** | **L1** |

**Combined kernel cannot certify at L2 until Activity G2 passes.**

---

## 5. Current certification posture

| Item | Status |
|------|--------|
| Ledger row | **None** |
| Prior program | **None** |
| Portfolio classification | Uncertified L1 platform capabilities |
| Blocking portfolio risk | ACT-R1 (architectural debt); AI stubs (adjacent, out of kernel scope) |
| Certificate findings | N/A — not certified |

---

## 6. Earliest certifiable surface

| Rank | Surface | Path | Preconditions |
|------|---------|------|---------------|
| **1** | **Domain Events (platform L2)** | Registry + subscriber honesty | Retire/register stubs; adoption audit; operation matrix |
| **2** | **Platform Activity (platform L2)** | Read federation | ACT-R1 closure; platform read service; feed rewrite |
| **3** | **Combined Kernel (platform L2)** | Joint program | Both above |

**Earliest honest certification:** **Domain Events L2** — higher starting G-score (~67% vs ~59%), but **portfolio integrity requires Activity read contract first** in program sequencing.

---

## 7. Major findings (projected — pre-certification)

### Platform Activity (projected PK-ACT-M*)

| ID | Title | Horizon |
|----|-------|---------|
| PK-ACT-M1 | ACT-R1 legacy read paths platform-wide | Package 1 |
| PK-ACT-M2 | No platform activity read service | Package 1 |
| PK-ACT-M3 | Activity feed API multi-source SoR violation | Package 1 |
| PK-ACT-M4 | Analytics AN-M2 compounds Activity debt | Package 1 / Analytics hygiene |
| PK-ACT-M5 | No platform activity operation matrix | Package 2 |

### Domain Events (projected PK-DE-M*)

| ID | Title | Horizon |
|----|-------|---------|
| PK-DE-M1 | Stub subscribers in production registry | Package 2 |
| PK-DE-M2 | HR module domain-event emission gap | Package 2 / BO owner |
| PK-DE-M3 | No durability / replay story | L3 horizon |
| PK-DE-M4 | Registry adoption not CI-verified | Package 2 |
| PK-DE-M5 | No platform domain-event operation matrix | Package 2 |

---

## 8. L2 readiness checklist (future waves)

### Activity L2

- [ ] Platform activity read service chartered
- [ ] `GET /api/activity-feed` uses normalized Log only
- [ ] Legacy `Activity` table reads removed from certified paths
- [ ] Analytics personal path migrated (AN-M2)
- [ ] AI context engines migrated off `prisma.activity`
- [ ] Operation matrix + integration tests for read API
- [ ] PE or visibility policy on feed reads

### Domain Events L2

- [ ] Stub subscribers removed or feature-flagged
- [ ] HR domain event service + adoption
- [ ] Adoption audit report (registry vs emit sites)
- [ ] Subscriber operation matrix documented
- [ ] Consumer failure metrics in logger

### Combined Kernel L2

- [ ] Both checklists above
- [ ] Dual-write relationship documented for readers
- [ ] Cross-kernel integration tests

---

## 9. L3 horizon (not Wave 1 scope)

- Event durability (queue or transactional outbox)
- Platform event replay / admin diagnostics API
- Full notification mapping for registry subset
- Search index consumer (Search program dependency)
- Kernel reference capability designation (unlikely — infrastructure)

---

## Related

- [PLATFORM_KERNEL_EXECUTIVE_SUMMARY.md](./PLATFORM_KERNEL_EXECUTIVE_SUMMARY.md)
- [PLATFORM_PORTFOLIO_REFRESH_2026_5.md](../platform-portfolio/PLATFORM_PORTFOLIO_REFRESH_2026_5.md)

**Last updated:** 2026-06-22
