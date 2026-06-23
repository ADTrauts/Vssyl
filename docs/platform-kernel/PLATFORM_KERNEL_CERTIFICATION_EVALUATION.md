# Platform Kernel — Formal Certification Evaluation

**Program:** Platform Kernel — L2 Certification Evaluation  
**Evaluation date:** 2026-06-23  
**Evaluator:** Governance evaluation (readiness + authorization + implementation evidence review)  
**Status:** **Evaluation complete** — **no certification award, no ratification, no ledger update**

**Scope:** Platform Capability **L2 CERTIFIED WITH FINDINGS** only — plain L2, L3 infrastructure, and reference producer designation **out of scope**

**Capability id:** `platform_kernel` (Platform Kernel — Activity + Domain Events composite)

**Classification:** Platform Capability — **not** Product Module

**Topology:** **Option C** — combined award with Activity and Domain Events sub-scores

**Prerequisites:** [PLATFORM_KERNEL_CERTIFICATION_READINESS_REVIEW.md](./PLATFORM_KERNEL_CERTIFICATION_READINESS_REVIEW.md) · [PLATFORM_KERNEL_EVALUATION_AUTHORIZATION_DECISION.md](./PLATFORM_KERNEL_EVALUATION_AUTHORIZATION_DECISION.md) — **AUTHORIZE**

---

## 1. Evaluation summary

| Field | Result |
|-------|--------|
| **Combined G1–G9** | **21/27 (~78%)** |
| **Platform Activity sub-score** | **22/27 (~81%)** |
| **Domain Events sub-score** | **21/27 (~78%)** |
| **Certification band** | **L2 WITH FINDINGS** |
| **Blocking findings** | **0** |
| **Formal evaluation outcome** | **PASS WITH FINDINGS** |
| **Certification recommendation** | **L2 CERTIFIED WITH FINDINGS** |
| **Certification award** | **Not executed** (separate council ratification ACT) |
| **Ledger** | **Not updated** — recommendation recorded only |

---

## 2. Area A — Combined G1–G9 evaluation

Formal scoring: **3 = PASS** · **2 = PARTIAL** · **1 = FAIL**

Holistic combined scoring (weakest cross-cutting gates weighted; not arithmetic mean of sub-scores).

| Gate | Score | Status | Evaluation rationale |
|------|------:|--------|----------------------|
| **G1 Authorization** | **2** | PARTIAL | Domain events emit post-auth; activity feed reads lack PE parity (PK-ACT-M9) |
| **G2 Auditability** | **3** | PASS | ACT-R1 closed; canonical `Log` reads; `domain_event_recorded` mirror |
| **G3 Service boundaries** | **3** | PASS | `platformActivityQueryService`; matrix-driven DE registration; stubs gated |
| **G4 API / contract coherence** | **2** | PARTIAL | Split activity/DE contracts; Place/workforce not delegated (PK-ACT-M4) |
| **G5 Ownership** | **3** | PASS | Kernel + module facade ownership documented; HR adopted |
| **G6 Testing** | **3** | PASS | IMP-1/3 + DE-1/2 test suites; matrix validation tests |
| **G7 Documentation** | **3** | PASS | Kernel suite, query service, DE operation matrix, IMP/DE reports |
| **G8 Production safety** | **2** | PARTIAL | Honest subscriber registry; in-process bus without crash recovery (PK-DE-M3 — L3 charter excluded from fail) |
| **G9 Platform trust** | **2** | PARTIAL | Feed/analytics/AI reads canonical; legacy table + narrow fan-out (PK-ACT-M1, PK-DE-M6) |

**Combined total: 21/27**

See [PLATFORM_KERNEL_CERTIFICATION_SCORECARD.md](./PLATFORM_KERNEL_CERTIFICATION_SCORECARD.md).

---

## 3. Area B — Sub-score evaluation

### Platform Activity — 22/27

| Gate | Score | Status | Evidence |
|------|------:|--------|----------|
| G1 | 2 | PARTIAL | Auth on feed; no PE on reads |
| G2 | 3 | PASS | ACT-R1 closed |
| G3 | 3 | PASS | `platformActivityQueryService` |
| G4 | 2 | PARTIAL | PK-ACT-M4 direct-Log consumers |
| G5 | 3 | PASS | Adoption reports + query service ownership |
| G6 | 3 | PASS | Query, feed, AI, Drive tests |
| G7 | 3 | PASS | `PLATFORM_ACTIVITY_QUERY_SERVICE.md` |
| G8 | 3 | PASS | Write isolation |
| G9 | 2 | PARTIAL | PK-ACT-M1 legacy table |

### Domain Events — 21/27

| Gate | Score | Status | Evidence |
|------|------:|--------|----------|
| G1 | 3 | PASS | Post-auth emit convention |
| G2 | 2 | PARTIAL | Log mirror only; no read API |
| G3 | 3 | PASS | DE-1 matrix + stub gating |
| G4 | 2 | PARTIAL | No external consume contract |
| G5 | 3 | PASS | 192 types; HR facade; participation validator |
| G6 | 3 | PASS | Matrix, HR, registry tests |
| G7 | 3 | PASS | `DOMAIN_EVENTS.md` + operation matrix |
| G8 | 2 | PARTIAL | In-process bus (L3 durability deferred) |
| G9 | 2 | PARTIAL | PK-DE-M6 narrow notification/AI map |

---

## 4. Area C — Findings evaluation

Applied pre-dispositioned register from readiness review. **No new majors introduced** — evidence did not require additional modernization scope.

### Blocking

| ID | Evaluation verdict | Certificate treatment |
|----|-------------------|----------------------|
| *(none)* | — | **N/A** |

**Blocking count: 0**

### Major — certificate findings (if ratified)

| ID | Title | Evaluation verdict | Certificate treatment |
|----|-------|-------------------|----------------------|
| **PK-ACT-M1** | Legacy Activity table + C-12 write cleanup | **Confirmed** | **OPEN** — W4 retirement |
| **PK-ACT-M4** | Place/workforce direct-Log reads | **Confirmed** | **OPEN** — delegate to query service |
| **PK-DE-M4** | Registry orphan types not CI-enforced | **Confirmed** | **OPEN** — CI audit |
| **PK-K-M1** | Dual Log operations operator confusion | **Confirmed** | **OPEN** — operator guide |

### Advisory — certificate track

| ID | Evaluation verdict | Certificate treatment |
|----|-------------------|----------------------|
| **PK-ACT-M5** | No runtime activity operation matrix | **Confirmed** | **TRACK** |
| **PK-ACT-M8** | No ESLint `prisma.activity` ban | **Confirmed** | **TRACK** |
| **PK-ACT-M9** | Activity feed PE parity gap | **Confirmed** | **TRACK** |
| **PK-DE-M3** | No durability/replay | **Confirmed** | **TRACK** — L3 scope |
| **PK-DE-M6** | Narrow notification/AI fan-out | **Confirmed** | **TRACK** |
| **PK-DE-M7** | DE-3 optional expansion not done | **Confirmed** | **TRACK** |

### Closed (not on certificate)

PK-ACT-M2, M3, M6, M7; PK-DE-M1, M2, M5 — **Confirmed closed** at evaluation.

See [PLATFORM_KERNEL_FINDINGS_REVIEW.md](./PLATFORM_KERNEL_FINDINGS_REVIEW.md).

---

## 5. Area D — Certification recommendation

| Option | Verdict |
|--------|---------|
| **A. Recommend L2 Certified (plain)** | ❌ **Not recommended** — 4 open majors; combined 21 < 23 plain band |
| **B. Recommend L2 Certified With Findings** | ✅ **Recommended** |
| **C. Do Not Recommend Certification** | ❌ **Rejected** — 0 blocking; score in L2 CwF band |

### Rationale for L2 WITH FINDINGS

1. **Combined score 21/27** in Platform Capability **L2 CwF band (20–22)**.
2. **Zero blocking findings** — ACT-R1, subscriber honesty, and HR adoption satisfied.
3. **Four open majors** are appropriate **finding-track** items, not disqualifiers.
4. **Sub-scores** both exceed L2 entry (Activity 22, DE 21).
5. **Option C topology** — joint kernel cert with transparent pillar scores.
6. **In-process bus / no replay** is charter-excluded L3 scope (PK-DE-M3), not evaluated as L2 failure.

**This evaluation recommends L2 WITH FINDINGS eligibility.** Award requires separate **council ratification ACT** and ledger update — **not performed here**.

---

## 6. Area E — Reference review

See [PLATFORM_KERNEL_REFERENCE_REVIEW.md](./PLATFORM_KERNEL_REFERENCE_REVIEW.md).

| Role | Verdict |
|------|---------|
| Reference producer (kernel exemplar) | ❌ **Deferred** |
| Module dual-write facade pattern | ✅ **Affirmed informal exemplar** |
| Activity read federation consumer | ✅ **Affirmed** (`platformActivityQueryService`) |
| DE subscriber honesty pattern | ✅ **Affirmed** |

---

## 7. Evidence reviewed

| Source | Role |
|--------|------|
| Wave 1 discovery suite | Baseline inventory |
| PK-W3-IMP-1/3 implementation + test reports | Activity read contract |
| PK-W3-DE-1/2 implementation + test reports | Subscriber honesty + HR |
| Certification readiness review (6 docs) | Pre-evaluation posture |
| Evaluation authorization review (4 docs) | AUTHORIZE gate |
| Operation matrix reassessment | DE runtime validation |
| G1–G9 reassessment | Gate priors |
| Code verification | `prisma.activity` grep; registry count 192 |

---

## 8. Required questions — answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Final G1–G9 score? | **21/27 (~78%)** combined |
| 2 | Activity sub-score? | **22/27 (~81%)** |
| 3 | Domain Events sub-score? | **21/27 (~78%)** |
| 4 | Blocking findings? | **0** |
| 5 | Major findings? | **4** — PK-ACT-M1, M4; PK-DE-M4; PK-K-M1 |
| 6 | Advisory findings? | **6** — PK-ACT-M5, M8, M9; PK-DE-M3, M6, M7 |
| 7 | Certification recommendation? | **L2 CERTIFIED WITH FINDINGS** |
| 8 | Plain L2 appropriate? | **No** — score + open majors |
| 9 | L2 WITH FINDINGS appropriate? | **Yes** |
| 10 | Reference candidate status? | **Consumer/facade patterns affirmed; producer deferred** |
| 11 | Remaining risks? | Legacy table drift; orphan registry; in-process DE loss; PE gap |
| 12 | Certification readiness? | **Ready for L2 CwF ratification** (not yet awarded) |
| 13 | Recommended next gate? | **Council ratification ACT** |
| 14 | Ledger recommendation? | **On ratification:** add **Platform Kernel** L2 CwF 21/27 (sub-scores 22/21) |
| 15 | Evaluation outcome? | **PASS WITH FINDINGS — Evaluated eligible** |

---

## 9. Evaluation outcome statement

> Platform Kernel (`platform_kernel`) is **evaluated eligible** for **Level 2 Certified With Findings** at **21/27** (Activity **22/27**, Domain Events **21/27**), classified as **Platform Capability** composite infrastructure, **not** a product module, with **four major findings** and **six advisories** to be recorded on certificate upon ratification.
>
> **Formal outcome: PASS WITH FINDINGS.** No certification has been awarded. Ledger unchanged. Council ratification is the next gate.

---

## 10. Related deliverables

- [PLATFORM_KERNEL_CERTIFICATION_SCORECARD.md](./PLATFORM_KERNEL_CERTIFICATION_SCORECARD.md)
- [PLATFORM_KERNEL_FINDINGS_REVIEW.md](./PLATFORM_KERNEL_FINDINGS_REVIEW.md)
- [PLATFORM_KERNEL_REFERENCE_REVIEW.md](./PLATFORM_KERNEL_REFERENCE_REVIEW.md)
- [PLATFORM_KERNEL_CERTIFICATION_EXECUTIVE_SUMMARY.md](./PLATFORM_KERNEL_CERTIFICATION_EXECUTIVE_SUMMARY.md)

---

**Last updated:** 2026-06-23
