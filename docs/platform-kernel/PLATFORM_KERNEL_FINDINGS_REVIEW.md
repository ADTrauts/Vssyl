# Platform Kernel — Findings Review

**Program:** Platform Kernel — L2 Certification Evaluation  
**Evaluation date:** 2026-06-23  
**Status:** **Evaluation disposition complete** — findings confirmed; **not** ratified certificate

**Finding classes:** BLOCKING · MAJOR · ADVISORY

**Prior:** Readiness register (2026-06-23) — applied without scope expansion

---

## 1. Summary

| Class | Count | Evaluation verdict |
|-------|------:|-------------------|
| **BLOCKING** | **0** | None — **PASS WITH FINDINGS** eligible |
| **MAJOR** | **4** | **Confirmed OPEN** on certificate (if ratified) |
| **ADVISORY** | **6** | **Confirmed TRACK** on certificate |
| **CLOSED** | **7** | Confirmed closed — not on certificate |

**Total tracked on certificate (if ratified): 10**

---

## 2. Blocking findings

**None at evaluation.**

| Former blocker | Closed by | Evaluation confirmation |
|----------------|-----------|-------------------------|
| ACT-R1 legacy reads | IMP-1/3 | ✅ **Confirmed closed** |
| Dishonest DE stubs | DE-1 | ✅ **Confirmed closed** |
| HR domain event gap | DE-2 | ✅ **Confirmed closed** |

---

## 3. Major findings — certificate (OPEN)

| ID | Pillar | Finding | Evaluation verdict | Certificate treatment | Gate impact |
|----|--------|---------|-------------------|----------------------|-------------|
| **PK-ACT-M1** | Activity | Legacy `Activity` table; C-12 `driveDeleteService.deleteMany` only | **Confirmed** | **OPEN** | G9 |
| **PK-ACT-M4** | Activity | Place + workforce_comms direct `Log` reads | **Confirmed** | **OPEN** | G4 |
| **PK-DE-M4** | Domain Events | Registry orphan types not CI-enforced | **Confirmed** | **OPEN** | G5/G6 |
| **PK-K-M1** | Kernel | Dual `Log` ops (`module_activity_event` vs `domain_event_recorded`) | **Confirmed** | **OPEN** | G9 |

**No new majors introduced at evaluation** — evidence did not require additional modernization scope.

---

## 4. Advisory findings — certificate (TRACK)

| ID | Pillar | Finding | Evaluation verdict | Certificate treatment |
|----|--------|---------|-------------------|----------------------|
| **PK-ACT-M5** | Activity | No runtime-validated activity operation matrix | **Confirmed** | **TRACK** |
| **PK-ACT-M8** | Activity | No ESLint ban on `prisma.activity` | **Confirmed** | **TRACK** |
| **PK-ACT-M9** | Activity | Activity feed reads lack PE parity | **Confirmed** | **TRACK** |
| **PK-DE-M3** | Domain Events | No durability / replay (in-process bus) | **Confirmed** | **TRACK** — L3 scope |
| **PK-DE-M6** | Domain Events | Notification (3) + AI (6) narrow fan-out | **Confirmed** | **TRACK** |
| **PK-DE-M7** | Domain Events | DE-3 optional expansion not executed | **Confirmed** | **TRACK** |

---

## 5. Closed findings — not on certificate

| ID | Was | Closed by | Evaluation confirmation |
|----|-----|-----------|-------------------------|
| PK-ACT-M2 | Feed legacy Activity | IMP-1 | ✅ Closed |
| PK-ACT-M3 | Analytics legacy | IMP-1 | ✅ Closed |
| PK-ACT-M6 | AI legacy | IMP-3 | ✅ Closed |
| PK-ACT-M7 | Drive legacy | IMP-3 | ✅ Closed |
| PK-DE-M1 | Stub subscribers default | DE-1 | ✅ Closed |
| PK-DE-M2 | HR no domain events | DE-2 | ✅ Closed |
| PK-DE-M5 | No operation matrix | DE-1 | ✅ Closed |

---

## 6. Deferred by design (not certificate defects)

| Item | Evaluation treatment |
|------|---------------------|
| Domain event durability / replay | **Excluded** — L3 charter (PK-DE-M3 advisory only) |
| DE-3 consumer expansion | **Optional** — post-cert (PK-DE-M7) |
| Activity table full retirement | **Finding-track** — W4 (PK-ACT-M1 major) |

---

## 7. Findings by required question

| # | Question | Answer |
|---|----------|--------|
| 4 | Blocking findings? | **0** |
| 5 | Major findings? | **4 OPEN** — PK-ACT-M1, M4; PK-DE-M4; PK-K-M1 |
| 6 | Advisory findings? | **6 TRACK** — PK-ACT-M5, M8, M9; PK-DE-M3, M6, M7 |

---

## 8. Plain L2 vs L2 WITH FINDINGS disposition

| Outcome | Blocked by findings? |
|---------|---------------------|
| **Plain L2** | **Yes** — 4 open majors + score 21 < 23 |
| **L2 WITH FINDINGS** | **No** — majors appropriate for finding-track |

---

## 9. Ratification preview (not executed)

If council ratifies, certificate shall list:

- **4 major findings** (OPEN) with owners and remediation horizon
- **6 advisory findings** (TRACK)
- **Sub-score regression rule:** either pillar ≤17 triggers patch review

---

**Last updated:** 2026-06-23
