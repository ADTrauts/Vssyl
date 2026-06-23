# Platform Kernel — Certification Record

**Program:** Platform Kernel — Final Governance Execution  
**Award date:** 2026-06-23  
**Authority:** RD-PK-001 Council Ratification

**Classification:** Platform Capability — composite infrastructure (Activity + Domain Events) — **not** Product Module

**Topology:** Option C — combined award with sub-scores

---

## Certification summary

| Field | Value |
|-------|-------|
| **Capability id** | `platform_kernel` |
| **Product name** | Platform Kernel |
| **Prior posture** | L1 — Stabilizing; uncertified; ACT-R1; dishonest DE stubs; HR gap |
| **Awarded certification** | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| **Ratification date** | 2026-06-23 (RD-PK-001) |
| **Execution date** | 2026-06-23 |
| **Combined G1–G9** | **21/27 (~78%)** |
| **Activity sub-score** | **22/27 (~81%)** |
| **Domain Events sub-score** | **21/27 (~78%)** |
| **Blocking findings** | **0** |
| **Major findings** | **4** — PK-ACT-M1, M4; PK-DE-M4; PK-K-M1 |
| **Advisory findings** | **6** — PK-ACT-M5, M8, M9; PK-DE-M3, M6, M7 |

---

## Evidence chain

| Stage | Document | Outcome |
|-------|----------|---------|
| Wave 1 | Discovery suite | Joint program charter |
| Wave 2 | P1/P2 charters | Activity read + DE hardening |
| Wave 3 | IMP + DE engineering | ACT-R1 closed; subscriber honesty; HR adopted |
| Readiness | [PLATFORM_KERNEL_CERTIFICATION_READINESS_REVIEW.md](./PLATFORM_KERNEL_CERTIFICATION_READINESS_REVIEW.md) | L2 CwF candidate |
| Authorization | [PLATFORM_KERNEL_EVALUATION_AUTHORIZATION_DECISION.md](./PLATFORM_KERNEL_EVALUATION_AUTHORIZATION_DECISION.md) | AUTHORIZE |
| Evaluation | [PLATFORM_KERNEL_CERTIFICATION_EVALUATION.md](./PLATFORM_KERNEL_CERTIFICATION_EVALUATION.md) | PASS WITH FINDINGS |
| Ratification | [PLATFORM_KERNEL_CERTIFICATION_RATIFICATION.md](./PLATFORM_KERNEL_CERTIFICATION_RATIFICATION.md) | APPROVE |
| Execution | [PLATFORM_KERNEL_GOVERNANCE_EXECUTION.md](./PLATFORM_KERNEL_GOVERNANCE_EXECUTION.md) | **Executed** |

---

## Gate posture at award (combined)

| Gate | Score | Status |
|------|------:|--------|
| G1 Authorization | 2 | PARTIAL |
| G2 Auditability | 3 | PASS |
| G3 Service boundaries | 3 | PASS |
| G4 API / contract coherence | 2 | PARTIAL |
| G5 Ownership | 3 | PASS |
| G6 Testing | 3 | PASS |
| G7 Documentation | 3 | PASS |
| G8 Production safety | 2 | PARTIAL |
| G9 Platform trust | 2 | PARTIAL |
| **Total** | **21/27 (~78%)** | **L2 WITH FINDINGS** |

---

## Sub-scores at award

| Pillar | Score | Band |
|--------|------:|------|
| Platform Activity | **22/27** | L2 CwF (upper) |
| Domain Events | **21/27** | L2 CwF |

---

## Certificate findings

### Major (open on certificate)

| ID | Title | Remediation horizon |
|----|-------|---------------------|
| **PK-ACT-M1** | Legacy Activity table + C-12 cleanup | PK-W4 retirement (not authorized) |
| **PK-ACT-M4** | Place/workforce direct-Log reads | Delegate to query service |
| **PK-DE-M4** | Registry orphan types not CI-enforced | CI audit |
| **PK-K-M1** | Dual Log operations operator confusion | Operator guide |

### Advisory (tracked on certificate)

PK-ACT-M5, M8, M9; PK-DE-M3, M6, M7

---

## Ledger entry (executed)

```
LEVEL 2 CERTIFIED WITH FINDINGS · Platform Kernel · G1–G9 21/27 · Sub-scores: Activity 22/27, Domain Events 21/27 · 10 tracked findings (4 major, 6 advisory) · Topology Option C · RD-PK-001
```

See [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md).

---

## Reference posture

| Role | Status |
|------|--------|
| Reference producer | **Deferred** |
| Module dual-write facade | **Affirmed** |
| Activity query consumer | **Affirmed** |
| DE subscriber honesty | **Affirmed** |

---

## Program status

**ARCHIVED** — see [PLATFORM_KERNEL_PROGRAM_ARCHIVE.md](./PLATFORM_KERNEL_PROGRAM_ARCHIVE.md)

---

**Last updated:** 2026-06-23
