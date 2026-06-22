# Analytics Capability — Formal Certification Evaluation

**Program:** Analytics Capability — L2 Certification Evaluation  
**Evaluation date:** 2026-06-22  
**Evaluator:** Governance evaluation (Phase 0A–1 + readiness packet evidence review)  
**Status:** **Evaluation complete** — **no certification award, no ratification, no ledger update**

**Scope:** Platform Capability **L2 CERTIFIED WITH FINDINGS** only — plain L2, L3 product module, Platform Capability L3, and reference producer designation **out of scope**

**Capability id:** `analytics` (Platform Analytics Capability — Hybrid Domain primary engine)

**Classification:** Platform Capability — **not** Product Module

---

## 1. Evaluation summary

| Field | Result |
|-------|--------|
| **Final G1–G9 score** | **21/27 (~78%)** |
| **Certification band** | **L2 WITH FINDINGS** |
| **Blocking findings** | **0** |
| **Evaluation outcome** | **L2 WITH FINDINGS — Evaluated eligible** |
| **Certification award** | **Not executed** (separate council ratification ACT) |
| **Ledger** | **Not updated** — recommendation recorded only |

---

## 2. Area A — G1–G9 evaluation

Formal scoring: **3 = PASS** · **2 = PARTIAL** · **1 = FAIL**

| Gate | Score | Status | Evaluation rationale |
|------|------:|--------|----------------------|
| **G1 Authorization** | **3** | PASS | `analytics:read` on AC-01–AC-04; `analyticsPolicyDual`; dashboard summary delegates tenant-scoped dashboard read |
| **G2 Auditability** | **2** | PARTIAL | Capability read events on 4/4 canonical paths; personal DTO still aggregates raw `activity` rows (AN-M2) |
| **G3 Service Boundaries** | **2** | PARTIAL | `analyticsCapabilityService` + Chat/Todo rollup APIs; personal/module paths retain direct Prisma reads; Calendar/Drive contracts informal (AN-M6) |
| **G4 API Coherence** | **3** | PASS | Canonical `/api/analytics/*`; typed dashboard-summary shared contract; thin controllers |
| **G5 Ownership** | **2** | PARTIAL | Hybrid model + ownership registry; ledger still pseudo-module class (AN-M1); satellites documented not unified |
| **G6 Testing** | **2** | PARTIAL | Targeted unit tests (capability, PE, rollups, facade); **no HTTP operation-matrix CI** (AN-M4) |
| **G7 Documentation** | **3** | PASS | Phase 0A/0B, Phase 1, readiness suite, operation matrix |
| **G8 Production Safety** | **3** | PASS | No mock surfaces; placeholder removed; honest degraded enterprise tabs; no false pipeline signal |
| **G9 User Trust** | **2** | PARTIAL | Real data on chartered paths; enterprise journeys/compliance/insights empty but labeled (AN-M5) |

**Total: 21/27**

See [ANALYTICS_CERTIFICATION_SCORECARD.md](./ANALYTICS_CERTIFICATION_SCORECARD.md).

---

## 3. Area B — Findings evaluation

### Blocking (AN-B*)

| ID | Status | Certificate treatment |
|----|--------|----------------------|
| AN-B01–AN-B08 (AN-01–08) | ✅ Closed Phase 1 | **N/A — not on certificate** |

**Blocking count: 0**

### Major — certificate findings (if ratified)

| ID | Title | Class | Evaluation verdict | Certificate treatment |
|----|-------|-------|-------------------|----------------------|
| **AN-M1** | Ledger / classification misalignment | Major (governance) | **Confirmed** | **OPEN** — reclassify on ratification |
| **AN-M2** | Personal analytics Activity-table derivation | Major | **Confirmed** | **OPEN** — Phase 2+ rollup |
| **AN-M3** | Satellite `analytics:admin` enforcement gap | Major | **Confirmed** | **OPEN** — satellite PE audit |
| **AN-M4** | Operation matrix HTTP CI absent | Major | **Confirmed** | **OPEN** — G6 remediation |
| **AN-M5** | Enterprise tabs product-incomplete | Major | **Confirmed** | **OPEN** — Phase 3 historical |
| **AN-M6** | Partial federation contract formalization | Major (partial) | **Confirmed** | **OPEN** — Phase 2 prep |

### Advisory — certificate track

| ID | Evaluation verdict | Certificate treatment |
|----|-------------------|----------------------|
| **AN-A1** | Confirmed | **TRACK** — DTO namespace |
| **AN-A2** | Confirmed | **TRACK** — metric canonical map |
| **AN-A3** | Confirmed | **TRACK** — Memory Bank refresh |
| **AN-A4** | Confirmed | **TRACK** — optional cache |
| **AN-A5** | Confirmed | **TRACK** — AI scaffold |
| **AN-A6** | Confirmed | **TRACK** — Calendar enterprise |
| **AN-A7** | Confirmed | **TRACK** — CI hygiene |
| **AN-A8** | Confirmed | **TRACK** — scale / MVAP |

### Deferred by design (not certificate defects)

| Item | Evaluation treatment |
|------|---------------------|
| No event pipeline (AN-09) | **Excluded** — Phase 2 charter |
| No warehouse (AN-10) | **Excluded** — Phase 3 charter |

See [ANALYTICS_FINDINGS_REVIEW.md](./ANALYTICS_FINDINGS_REVIEW.md).

---

## 4. Area C — Certification recommendation

| Option | Verdict |
|--------|---------|
| **A. Recommend L2 Certified (plain)** | ❌ **Not recommended** — 6 open majors; score below plain-L2 band |
| **B. Recommend L2 Certified With Findings** | ✅ **Recommended** |
| **C. Do Not Recommend Certification** | ❌ **Rejected** — 0 blocking; score exceeds L2 CwF floor |

### Rationale for L2 WITH FINDINGS

1. **Score 21/27** falls in Platform Capability **L2 CwF band (20–22)**.
2. **Zero blocking findings** — Phase 1 trust, PE, activity, and federation requirements satisfied.
3. **Six open majors** are appropriate **finding-track** items for federated L2, not disqualifiers.
4. **Operation matrix** 100% **C** on canonical + consumer + Chat/Todo federation rows.
5. **Correct certification class** — Platform Capability, not product module; L3 tracks correctly excluded.
6. **Event pipeline / warehouse absence** is charter-excluded, not evaluated as failure.

**This evaluation recommends L2 WITH FINDINGS eligibility.** Award requires separate **council ratification ACT** and ledger update — **not performed here**.

---

## 5. Area D — Reference review

| Option | Verdict |
|--------|---------|
| Reference producer | ❌ |
| **Consumer pattern (Dashboard facade)** | ✅ **Affirmed** |
| Reference deferred (producer) | ✅ **Selected** |

See [ANALYTICS_REFERENCE_REVIEW.md](./ANALYTICS_REFERENCE_REVIEW.md).

---

## 6. Evidence reviewed

| Source | Role |
|--------|------|
| Phase 0A discovery suite | Baseline inventory, risks, classification |
| Phase 0B ratification + Phase 1 authorization | Scope lock, kickoff decisions |
| Phase 1 implementation + test reports | Engineering evidence |
| Certification readiness review (6 docs) | Pre-evaluation posture |
| Operation matrix + reassessment | Row-level C/P/N |
| G1–G9 reassessment | Gate priors |
| Targeted test execution record | Phase 1 verification |

---

## 7. Required questions — answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Final G1–G9 score? | **21/27 (~78%)** |
| 2 | Blocking findings? | **0** |
| 3 | Major findings? | **AN-M1–M6** (6 open on certificate) |
| 4 | Advisory findings? | **AN-A1–A8** (8 track on certificate) |
| 5 | Certification recommendation? | **L2 CERTIFIED WITH FINDINGS** |
| 6 | Plain L2 appropriate? | **No** — majors remain; score 21 < 24 plain band |
| 7 | L2 WITH FINDINGS appropriate? | **Yes** |
| 8 | Reference candidate status? | **Consumer only — producer deferred** |
| 9 | Remaining risks? | Scale fan-out; no historical trends; satellite PE; ledger class; M4 test gap |
| 10 | Certification readiness? | **Ready for L2 CwF ratification** (not yet awarded) |
| 11 | Recommended next gate? | **Council ratification ACT** + ledger reclassification proposal |
| 12 | Modernization complete? | **Phase 1 / 2026 federated L2 yes**; full program **no** (Phase 2–3 remain) |
| 13 | Remediation required? | **Finding-track only** — no pre-ratification blockers |
| 14 | Ledger recommendation? | **On ratification:** reclassify `analytics` from pseudo-module L1 → **Platform Capability L2 CwF** |
| 15 | Evaluation outcome? | **L2 WITH FINDINGS — Evaluated eligible** |

---

## 8. Evaluation outcome statement

> Platform Analytics Capability (`analytics`) is **evaluated eligible** for **Level 2 Certified With Findings** at **21/27**, classified as **Platform Capability** (Hybrid Domain primary engine), **not** a product module, with **six major findings** (AN-M1–M6) and **eight advisories** (AN-A1–A8) to be recorded on certificate upon ratification.
>
> **No certification has been awarded.** Ledger unchanged. Council ratification is the next gate.

---

## 9. Related deliverables

- [ANALYTICS_CERTIFICATION_SCORECARD.md](./ANALYTICS_CERTIFICATION_SCORECARD.md)
- [ANALYTICS_FINDINGS_REVIEW.md](./ANALYTICS_FINDINGS_REVIEW.md)
- [ANALYTICS_REFERENCE_REVIEW.md](./ANALYTICS_REFERENCE_REVIEW.md)
- [ANALYTICS_CERTIFICATION_EXECUTIVE_SUMMARY.md](./ANALYTICS_CERTIFICATION_EXECUTIVE_SUMMARY.md)

---

**Last updated:** 2026-06-22
