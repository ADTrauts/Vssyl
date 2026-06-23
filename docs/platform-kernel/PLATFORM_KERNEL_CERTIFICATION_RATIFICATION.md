# Platform Kernel — Certification Ratification

**Program:** Platform Kernel — Certification Ratification Council  
**Capability id:** `platform_kernel` (Platform Kernel — Activity + Domain Events)  
**Ratification date:** 2026-06-23  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — governance record only; **ledger PR authorized separately**; **certification execution not performed in this session**

**Scope:** **LEVEL 2 CERTIFIED WITH FINDINGS** only — plain L2, L3 infrastructure, reference producer designation, and L3 durability/replay authorization **out of scope**

**Classification:** Platform Capability — composite infrastructure — **not** Product Module

**Topology:** **Option C** — combined Platform Kernel certification with Activity and Domain Events sub-scores

**Authoritative inputs:**

- [PLATFORM_KERNEL_CERTIFICATION_EVALUATION.md](./PLATFORM_KERNEL_CERTIFICATION_EVALUATION.md)
- [PLATFORM_KERNEL_CERTIFICATION_SCORECARD.md](./PLATFORM_KERNEL_CERTIFICATION_SCORECARD.md)
- [PLATFORM_KERNEL_FINDINGS_REVIEW.md](./PLATFORM_KERNEL_FINDINGS_REVIEW.md)
- [PLATFORM_KERNEL_REFERENCE_REVIEW.md](./PLATFORM_KERNEL_REFERENCE_REVIEW.md)
- [PLATFORM_KERNEL_CERTIFICATION_EXECUTIVE_SUMMARY.md](./PLATFORM_KERNEL_CERTIFICATION_EXECUTIVE_SUMMARY.md)

**Precedent:**

- [ANALYTICS_CERTIFICATION_RATIFICATION.md](../analytics/ANALYTICS_CERTIFICATION_RATIFICATION.md) — L2 CwF @ 21/27; Platform Capability class
- [ANALYTICS_COUNCIL_DECISION.md](../analytics/ANALYTICS_COUNCIL_DECISION.md) — RD-AN-001 open majors + advisories model
- [DASHBOARD_CERTIFICATION_RATIFICATION.md](../dashboard/DASHBOARD_CERTIFICATION_RATIFICATION.md) — L3 CwF finding-track precedent

**Constraint:** No runtime changes. No `CERTIFICATION_LEDGER.md` modification in this session. No certification promotion execution. No program archive. No PK-W4 / L3 engineering authorization.

---

## Council quorum and record

| Field | Value |
|-------|-------|
| Session | Platform Kernel — Certification Ratification Council |
| Surface under vote | Platform Kernel (`platform_kernel`) |
| Framework | G1–G9 Platform Capability certification gates |
| Validated combined score | **21/27 (~78%)** |
| Activity sub-score | **22/27 (~81%)** |
| Domain Events sub-score | **21/27 (~78%)** |
| Blocking findings | **0** |
| Open major findings | **4** — PK-ACT-M1, M4; PK-DE-M4; PK-K-M1 |
| Open advisory findings | **6** — PK-ACT-M5, M8, M9; PK-DE-M3, M6, M7 |
| Evaluator recommendation | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| Evaluation outcome | **PASS WITH FINDINGS** |
| Wave 3 modernization (ACT-R1, DE-1/2) | **Complete** |
| PK-W4 / L3 durability | **Not authorized** — separate program gates |

---

## A. Evaluation validation

### Artifacts reviewed

| Artifact | Council assessment |
|----------|-------------------|
| [PLATFORM_KERNEL_CERTIFICATION_EVALUATION.md](./PLATFORM_KERNEL_CERTIFICATION_EVALUATION.md) | ✅ Complete — formal G1–G9 evaluation |
| [PLATFORM_KERNEL_CERTIFICATION_SCORECARD.md](./PLATFORM_KERNEL_CERTIFICATION_SCORECARD.md) | ✅ Combined **21/27** + sub-scores confirmed |
| [PLATFORM_KERNEL_FINDINGS_REVIEW.md](./PLATFORM_KERNEL_FINDINGS_REVIEW.md) | ✅ Finding taxonomy consistent |
| Readiness + authorization + IMP/DE implementation reports | ✅ Evidence chain credible |
| Operation matrix reassessment | ✅ DE runtime validation; Activity adoption documented |

### Score confirmation (combined)

| Gate | Score | Council validation |
|------|------:|-------------------|
| G1 Authorization | 2 | ✅ Confirmed — PK-ACT-M9 partial |
| G2 Auditability | 3 | ✅ Confirmed — ACT-R1 closed |
| G3 Service boundaries | 3 | ✅ Confirmed |
| G4 API / contract coherence | 2 | ✅ Confirmed — PK-ACT-M4 partial |
| G5 Ownership | 3 | ✅ Confirmed |
| G6 Testing | 3 | ✅ Confirmed |
| G7 Documentation | 3 | ✅ Confirmed |
| G8 Production safety | 2 | ✅ Confirmed — PK-DE-M3 L3 excluded |
| G9 Platform trust | 2 | ✅ Confirmed — PK-ACT-M1, PK-DE-M6 partial |
| **Total** | **21/27** | ✅ **Within L2 CwF band (20–22)** |

### Sub-score confirmation

| Pillar | Score | Council validation |
|--------|------:|-------------------|
| Platform Activity | **22/27** | ✅ Confirmed |
| Domain Events | **21/27** | ✅ Confirmed |

### Topology validation (Option C)

| Element | Council validation |
|---------|-------------------|
| Combined Platform Kernel certificate | ✅ **Affirmed** |
| Activity sub-score on certificate | ✅ **Affirmed** |
| Domain Events sub-score on certificate | ✅ **Affirmed** |
| Split ledger rows (Activity vs DE) | ❌ **Rejected** — misleading for dual-write kernel |
| Sub-score regression rule (pillar ≤17) | ✅ **Affirmed** |

### Recommendation confirmation

| Evaluator recommendation | Council validation |
|--------------------------|-------------------|
| **L2 WITH FINDINGS** | ✅ **Accepted** — score, findings, and evidence support ratification |
| Plain L2 | ❌ Not considered — 4 open majors; score below plain band |
| NOT CERTIFIABLE | ❌ Rejected — 0 blockers |
| L3 infrastructure | ❌ Not on ballot — durability/replay required |

**Council finding:** Evaluation packet is **complete and credible**. Score aligns with readiness review, authorization review, and Wave 3 engineering evidence.

---

## B. Findings disposition

### Blocking (confirmed closed)

| ID | Status | On certificate |
|----|--------|----------------|
| ACT-R1 read violations | ✅ Closed IMP-1/3 | **Not listed** |
| Dishonest DE stubs | ✅ Closed DE-1 | **Not listed** |
| HR domain event gap | ✅ Closed DE-2 | **Not listed** |

### Major — ratified certificate treatment

| ID | Finding | Blocks L2 CwF? | Ratified disposition |
|----|---------|:--------------:|---------------------|
| **PK-ACT-M1** | Legacy Activity table + C-12 cleanup | No | **OPEN ON CERTIFICATE** — PK-W4 retirement |
| **PK-ACT-M4** | Place/workforce direct-Log reads | No | **OPEN ON CERTIFICATE** — delegate to query service |
| **PK-DE-M4** | Registry orphan types not CI-enforced | No | **OPEN ON CERTIFICATE** — CI audit |
| **PK-K-M1** | Dual Log operations operator confusion | No | **OPEN ON CERTIFICATE** — operator guide |

### Advisory — ratified certificate treatment

| ID | Finding | Ratified disposition |
|----|---------|---------------------|
| **PK-ACT-M5** | No runtime activity operation matrix | **TRACK ON CERTIFICATE** |
| **PK-ACT-M8** | No ESLint `prisma.activity` ban | **TRACK ON CERTIFICATE** |
| **PK-ACT-M9** | Activity feed PE parity gap | **TRACK ON CERTIFICATE** |
| **PK-DE-M3** | No durability/replay | **TRACK ON CERTIFICATE** — L3 scope |
| **PK-DE-M6** | Narrow notification/AI fan-out | **TRACK ON CERTIFICATE** |
| **PK-DE-M7** | DE-3 optional expansion | **TRACK ON CERTIFICATE** |

### Deferred by design (not certificate defects)

| Item | Ratified treatment |
|------|-------------------|
| Domain event durability / replay | **Charter-excluded** — L3 program |
| DE-3 consumer expansion | **Optional** — not required for L2 CwF |

---

## C. Portfolio alignment

| Program | Score | Class | Outcome | Platform Kernel alignment |
|---------|------:|-------|---------|---------------------------|
| **Analytics Capability** | 21/27 | Platform Capability | L2 CwF | **Peer precedent** — same score band, capability class, finding model |
| **Dashboard** | 24/27 | Product module L3 | L3 CwF | **Consumer** — activity feed + analytics depend on kernel reads |
| **Reference Workspace** | 23/27 | Platform shell | L3 CwF | **Finding-track model** — open items on certificate at ratification |
| **Account Platform** | L3 | Platform domain | L3 | **Emitter** — account settings domain events; kernel registry participant |
| **Business Operations** | 24/27 | Product module | L3 CwF | **Consumer/emitter** — HR dual-write adopted; BO modules use kernel contract |

**Council finding:** Platform Kernel ratification is **consistent with platform precedent** for Certified With Findings at partial gates with tracked majors — at the **Platform Capability L2** tier appropriate to infrastructure classification. First **kernel infrastructure** L2 row in portfolio.

---

## D. Reference posture (ratified)

| Role | Ratified status |
|------|-----------------|
| Reference producer | **Deferred** — PK-ACT-M1, PK-DE-M4 |
| Module dual-write facade pattern | **Affirmed** |
| Activity query consumer contract | **Affirmed** |
| DE subscriber honesty pattern | **Affirmed** |

See [PLATFORM_KERNEL_REFERENCE_REVIEW.md](./PLATFORM_KERNEL_REFERENCE_REVIEW.md).

---

## E. Council vote

| Option | Verdict |
|--------|---------|
| **A. APPROVE** | ✅ **Selected** |
| **B. REJECT** | ❌ Not warranted |
| **DEFER** | ❌ Not warranted — 0 blockers; evaluation complete |

**Ratification outcome: RATIFIED**

---

## F. Required questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Certification vote? | **APPROVE** |
| 2 | Certification level? | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| 3 | Blocking findings? | **0** |
| 4 | Major findings? | **4** — PK-ACT-M1, M4; PK-DE-M4; PK-K-M1 |
| 5 | Advisory findings? | **6** |
| 6 | Findings treatment? | **OPEN / TRACK on certificate** |
| 7 | Certification topology affirmed? | **Yes — Option C** |
| 8 | Reference posture? | **Consumer/facade affirmed; producer deferred** |
| 9 | Ledger recommendation? | **Platform Kernel L2 CwF @ 21/27** (sub-scores 22/21) — execution authorized |
| 10 | Consistent with precedent? | **Yes** — Analytics L2 CwF model |
| 11 | Remaining risks? | Legacy table drift; orphan registry; in-process DE; PE gap |
| 12 | Modernization complete? | **Wave 3 yes**; full program **no** (W4, L3) |
| 13 | Next initiative? | **Certification execution + ledger PR** |
| 14 | Ratification outcome? | **RATIFIED** |
| 15 | Certification execution authorized? | **YES — not performed here** |

---

## G. Residual risk acceptance

| Risk | Level | Accepted for L2 CwF? |
|------|-------|:--------------------:|
| Legacy Activity table | Medium | ✅ Finding-track (PK-ACT-M1) |
| In-process domain event bus | Medium | ✅ L3 advisory (PK-DE-M3) |
| Partial notification/AI fan-out | Low | ✅ Documented partial |
| Sub-score regression | Low | ✅ Regression rule on certificate |

**Residual risk:** **MEDIUM** — acceptable for L2 WITH FINDINGS; not acceptable for plain L2 or L3.

---

## H. Related deliverables

- [PLATFORM_KERNEL_COUNCIL_DECISION.md](./PLATFORM_KERNEL_COUNCIL_DECISION.md)
- [PLATFORM_KERNEL_POST_RATIFICATION_ROADMAP.md](./PLATFORM_KERNEL_POST_RATIFICATION_ROADMAP.md)
- [PLATFORM_KERNEL_COUNCIL_EXECUTIVE_SUMMARY.md](./PLATFORM_KERNEL_COUNCIL_EXECUTIVE_SUMMARY.md)

---

**Last updated:** 2026-06-23
