# Platform Kernel — Evaluation Authorization Decision

**Program:** Platform Kernel Modernization — L2 Certification  
**Decision date:** 2026-06-23  
**Authority:** Architecture council governance review (evaluation authorization gate)  
**Status:** **Decision recorded** — governance only; **not** evaluation, **not** ratification

**Prerequisite:** [PLATFORM_KERNEL_CERTIFICATION_READINESS_REVIEW.md](./PLATFORM_KERNEL_CERTIFICATION_READINESS_REVIEW.md) — **COMPLETE**

---

## Decision

### **AUTHORIZE — Formal L2 Certification Evaluation**

The Platform Kernel capability (**Platform Activity + Domain Events**) is **authorized to enter formal L2 certification evaluation**.

**Projected certification target:** **LEVEL 2 CERTIFIED WITH FINDINGS**  
**Certification topology:** **Option C** — combined Platform Kernel certificate with Activity and Domain Events sub-scores

---

## Options considered

| Option | Verdict | Reason |
|--------|---------|--------|
| **AUTHORIZE** | ✅ **Selected** | 0 blocking findings; 21/27 combined; modernization complete; readiness review passed |
| **DEFER** | ❌ Rejected | No hard blockers; deferral would delay honest L2 row without engineering prerequisite |
| **REJECT** | ❌ Not applicable | No constitutional conflict or trust-boundary collapse |

---

## Rationale

### Why AUTHORIZE (not DEFER)

| Factor | Assessment |
|--------|------------|
| Blocking findings | **0** |
| ACT-R1 | **Closed** (reads) |
| Subscriber honesty | **Restored** |
| HR domain events | **Adopted** |
| G1–G9 combined | **21/27** — L2 WITH FINDINGS band |
| Test + documentation evidence | **Sufficient** for evaluation |
| Readiness review conclusion | **Eligible** |
| DEFER trigger present? | **No** |

### Why DEFER was rejected

Deferral would require at least one of:

- Unresolved trust-boundary violation → **none**
- Missing evaluation evidence → **none**
- Constitutional conflict → **none**
- Score below L2 entry (≤17) → **no** (21/27)
- Council-mandated pre-evaluation engineering gate → **not specified**

Remaining work (W4 table retirement, Place/workforce delegate, CI orphan audit) is **finding-track**, appropriate for **L2 WITH FINDINGS**, not evaluation deferral.

### Why plain L2 is not the authorization target

| Plain L2 requirement | Status |
|---------------------|--------|
| Combined score ≥ 23 | **Not met** (21/27) |
| Major findings resolved | **4 open** |
| Council plain-L2 mandate | **None** |

Authorization targets **evaluation toward L2 WITH FINDINGS** only.

---

## Authorization conditions (evaluation kickoff)

| ID | Condition | Owner | Required before |
|----|-----------|-------|-----------------|
| **PK-EV-01** | Confirm **Option C** topology (combined + sub-scores) | Council | Evaluation session open |
| **PK-EV-02** | Import findings register PK-ACT-M1/M4, PK-DE-M4, PK-K-M1 + advisories | Evaluation lead | Scoring session |
| **PK-EV-03** | Explicit L3 exclusion: durability/replay out of L2 fail criteria | Evaluation lead | G8 scoring |
| **PK-EV-04** | Reconcile registry count in docs (192 types) | Platform Kernel | Evaluation kickoff |
| **PK-EV-05** | No ledger update until separate ratification gate | Council | Post-evaluation only |

**Failure to confirm PK-EV-01:** Evaluation proceeds but ledger notation may not match readiness recommendation.

---

## Authorization boundaries

### Permitted after this decision

- Schedule and execute **formal L2 certification evaluation** (G1–G9 scoring session)
- Produce evaluation artifacts: scorecard, evaluation report, findings ratification proposal
- Council review of evaluation outcome

### Not permitted under this authorization

- Award certification or update certification ledger
- Ratify or archive program
- Implement replay, Activity table retirement, or DE-3 (separate ACT packages)
- Re-open ACT-R1 implementation without new charter

---

## Expected evaluation outcome

| Metric | Projection |
|--------|------------|
| Combined G1–G9 | **20–22/27** (baseline **21/27**) |
| Activity sub-score | **21–22/27** |
| Domain Events sub-score | **20–21/27** |
| Certification level | **L2 WITH FINDINGS** |
| Tracked findings | **~10** (4 major + 6 advisory) |

Evaluators may adjust ±1 gate per pillar; outcome band should remain **L2 WITH FINDINGS** unless a blocking defect is discovered during evaluation (not projected).

---

## Required questions (decision record)

| # | Question | Answer |
|---|----------|--------|
| 1 | Ready for evaluation? | **Yes** |
| 2 | Blocking findings? | **0** |
| 3 | Major findings? | **4** |
| 4 | Advisory findings? | **6** |
| 5 | Evaluation risks? | **Medium** — acceptable |
| 6 | Certification risks? | **Medium-Low** — acceptable |
| 7 | Plain L2 blockers? | **Yes** — not authorization blockers |
| 8 | WITH FINDINGS blockers? | **None** |
| 9 | Authorization recommendation? | **AUTHORIZE** |
| 10 | Expected score? | **21/27** |
| 11 | Expected certification outcome? | **L2 WITH FINDINGS** |
| 12 | Remaining modernization? | W4; delegate; DE-3 optional; L3 |
| 13 | Remaining governance? | Evaluation → ratification → ledger |
| 14 | Recommended next gate? | **Formal L2 certification evaluation** |
| 15 | Authorization outcome? | **AUTHORIZE** |

---

## Next gate

**Formal L2 Certification Evaluation** — separate governance package producing scorecard, evaluation report, and ratification proposal.

---

**Last updated:** 2026-06-23
