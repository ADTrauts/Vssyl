# Platform Kernel — Certification Risk Review

**Program:** Platform Kernel — L2 Certification Evaluation Authorization  
**Review date:** 2026-06-23  
**Status:** Risk review — **governance only**

**Prior:** [PLATFORM_KERNEL_REALITY_ASSESSMENT.md](./PLATFORM_KERNEL_REALITY_ASSESSMENT.md) (Wave 1) · [PLATFORM_KERNEL_FINDINGS_REVIEW.md](./PLATFORM_KERNEL_FINDINGS_REVIEW.md)

---

## 1. Risk summary

Platform Kernel L2 evaluation is **medium risk, high value**. Modernization closed Wave 1 critical defects (ACT-R1, dishonest subscribers, HR gap). Residual risk is **operational and documentation debt**, not trust-boundary collapse.

**Overall risk posture:** **Acceptable** for evaluation authorization.

| Risk category | Level | Authorization impact |
|---------------|-------|---------------------|
| Evaluation execution risk | **Medium** | Acceptable — evidence exists |
| Certification outcome risk | **Medium-Low** | L2 CwF projected; plain L2 unlikely |
| Production incident risk | **Low-Medium** | In-process bus; no fake stubs |
| Governance drift risk | **Low** | Doc suite + matrix validation |

---

## 2. Evaluation risks

Risks to the **evaluation process** itself (not production).

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| **ER-01** | Evaluator treats legacy `Activity` table as ACT-R1 regression | Medium | Medium | Document C-12 write-only path; grep evidence |
| **ER-02** | Split-certification pressure (Activity vs DE) | Low | High | Option C pre-authorized in readiness review |
| **ER-03** | Score inflation vs readiness conservative 21/27 | Medium | Medium | Use holistic combined scoring; sub-scores informational |
| **ER-04** | L3 durability scope creep during evaluation | Medium | High | Charter exclusion PK-DE-M3; explicit L3 deferral |
| **ER-05** | Registry count drift (180 vs 192 in older docs) | Low | Low | Update matrix doc at evaluation kickoff |
| **ER-06** | Insufficient HTTP/integration test matrix | Medium | Medium | Document as advisory; unit coverage strong |

**Highest evaluation risk:** **ER-04** — evaluators conflating in-process bus with L2 failure. Mitigation: Analytics precedent (federated L2 without pipeline).

---

## 3. Certification risks

Risks to **certification outcome** if evaluation proceeds.

| ID | Risk | Likelihood | Impact | Disposition |
|----|------|------------|--------|-------------|
| **CR-01** | Plain L2 awarded incorrectly | Low | High | Score band 20–22 → CwF only |
| **CR-02** | Certificate without finding-track | Medium | Medium | 4 majors pre-registered |
| **CR-03** | Sub-score regression post-cert undetected | Low | Medium | Option C regression rule in model review |
| **CR-04** | Dual-write operator confusion (PK-K-M1) | Medium | Low | Major finding on certificate |
| **CR-05** | Place/workforce drift from query service | Medium | Medium | PK-ACT-M4 finding-track |
| **CR-06** | Registry orphan types accumulate | Medium | Medium | PK-DE-M4 CI audit finding |
| **CR-07** | Notification/AI under-coverage misread as broken kernel | Low | Low | Documented partial by design |

**Certification risk verdict:** Outcome **L2 WITH FINDINGS** is **defensible** at 21/27 with 0 blockers — consistent with Analytics L2 CwF (21/27, 14 findings).

---

## 4. Plain L2 blockers

These **block plain L2** but **do not block evaluation authorization**.

| ID | Blocker | Gate affected |
|----|---------|---------------|
| **PL-01** | Combined score 21/27 (< 23) | Band |
| **PL-02** | PK-ACT-M1 legacy Activity table | G9 |
| **PL-03** | PK-ACT-M4 non-delegated consumers | G4 |
| **PL-04** | PK-DE-M4 registry orphan CI gap | G5/G6 |
| **PL-05** | PK-K-M1 operator dual-log confusion | G9 |
| **PL-06** | PK-ACT-M9 feed PE parity gap | G1 |
| **PL-07** | PK-DE-M3 in-process durability | G8 (L3 charter excluded from L2 fail) |

**Plain L2 authorization:** **Not recommended** at this gate.

---

## 5. L2 WITH FINDINGS blockers

| Blocker | Present? |
|---------|:--------:|
| Score below L2 entry (≤17) | No — 21/27 |
| Unresolved Wave 1 critical defects | No |
| Dishonest production subscribers | No |
| ACT-R1 read violations | No |
| HR domain event gap | No |
| Missing evaluation evidence package | No |

**L2 WITH FINDINGS authorization blockers:** **None**

---

## 6. Production safety risks

| Risk | Likelihood | Impact | Post-modernization status |
|------|------------|--------|---------------------------|
| Fake subscriber maturity signal | **Was High** | High | **Closed** (DE-1) |
| Cross-tenant activity read leak | Low | Critical | Query service scoped |
| Subscriber cascade failure | Low | Medium | Fault isolation per handler |
| Process crash loses in-flight DE | Medium | Medium | **Accepted L2** — L3 scope |
| `prisma.activity` read regression | Low | High | No production reads; ESLint advisory |

---

## 7. Trust and auditability risks

| Risk | Severity | Finding |
|------|----------|---------|
| Feed shows stale/wrong source | **Was Critical** | **Mitigated** — canonical reads |
| Analytics derives from wrong SoR | **Was Critical** | **Mitigated** — capability service |
| AI context from legacy Activity | **Was High** | **Mitigated** — IMP-3 |
| Operators cannot distinguish activity vs DE logs | Medium | PK-K-M1 |
| Partial notification fan-out appears as outage | Low | PK-DE-M6 documented |

---

## 8. Risk by required question

| # | Question | Answer |
|---|----------|--------|
| 5 | Evaluation risks? | **Medium** — scope creep, scoring discipline, doc drift |
| 6 | Certification risks? | **Medium-Low** — plain L2 over-award; finding-track discipline |
| 7 | Plain L2 blockers? | **7 identified** — score + 4 majors + PE/durability |
| 8 | WITH FINDINGS blockers? | **None** |

---

## 9. Risk acceptance for authorization

| Condition | Accepted? |
|-----------|:---------:|
| Proceed with evaluation at 21/27 | ✅ |
| Target L2 WITH FINDINGS only | ✅ |
| Accept in-process bus at L2 | ✅ (charter) |
| Accept 4 majors on certificate | ✅ |
| Defer plain L2 to post-finding remediation | ✅ |

**Recommendation:** Risks are **within tolerance** for **AUTHORIZE** evaluation.

---

**Last updated:** 2026-06-23
