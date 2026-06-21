# BO-1A Readiness Reassessment

**Program:** Business Operations — Council Checkpoint  
**Date:** 2026-06-19  
**Scope:** Post BO-1A domain readiness; certification path options  
**Constraint:** Governance only — no code, certification, or ledger changes

---

## 1. Findings reassessment

**Source:** [BUSINESS_OPERATIONS_FINDINGS_REGISTER.md](./BUSINESS_OPERATIONS_FINDINGS_REGISTER.md) (updated post BO-1A)

### Counts

| Severity | Open | Closed (BO-1A + prior) |
|----------|------|------------------------|
| **Blocking** | **0** | All module blocking closed pre-BO-1A |
| **Major** | **0** | **10** closed in BO-1A |
| **Advisory** | **18** | 1 closed in BO-1A (F-WC-009) + prior module closures |
| **Total open** | **18** | |

*Note: Register summary table still shows 19 advisory (pre–F-WC-009 closure adjustment); authoritative open count is **18**.*

### Open advisory by module

| Module | Count | IDs |
|--------|-------|-----|
| Domain | 4 | BO-F-D04..D07 |
| Scheduling | 5 | F-SCH-008..012 |
| HR | 6 | F-HR-004..009 |
| Workforce Comms | 3 | F-WC-006..008 |

### BO-1A closures (confirmed)

BO-F-D01, BO-F-D02, BO-F-D03 · F-SCH-004..007 · F-HR-001..003 · F-WC-009

---

## 2. G1–G9 summary

| Metric | Phase 0B | Post BO-1A |
|--------|----------|------------|
| Total score | 17 / 27 | **22 / 27** |
| Percentage | **~63%** | **~81%** |
| Delta | — | **+5 points (+18 pp)** |
| Gates FAIL | G8, G9 | **G9 only** |
| Gates PASS (3) | G5 | **G2, G3, G4, G5, G7** |
| Gates PARTIAL (2) | G1, G2, G3, G4, G6, G7 | **G1, G6, G8** |

Full detail: [BO_1A_G1_G9_SCORECARD.md](./BO_1A_G1_G9_SCORECARD.md)

---

## 3. Domain readiness determination

### Classification: **CONDITIONALLY READY** (not READY FOR DOMAIN REVIEW)

| Criterion | Status |
|-----------|--------|
| Blocking findings | ✓ Zero |
| Domain majors | ✓ Zero (all closed BO-1A) |
| Score ≥70% | ✓ ~81% |
| Score ≥85% for domain review | ✗ ~81% |
| G9 ≥2 | ✗ G9 = 1 (FAIL) |

### Domain certification labels

| Label | Applies? |
|-------|----------|
| NOT READY | **No** — exceeds 70%; zero blocking/majors |
| CONDITIONALLY READY | **Yes** |
| READY FOR REVIEW | **Partial** — modules yes; **domain bar no** (G9) |
| L3 WITH FINDINGS candidate | **Yes** — domain + modules |
| Plain L3 candidate | **No** — G9 FAIL; scheduling UX FAIL |

---

## 4. BO-1B necessity analysis

### Is BO-1B required before certification review?

# **Yes — for domain-level review. Partially optional for per-module server review.**

| Factor | Assessment |
|--------|------------|
| **G9 FAIL** | BO-1A did not touch UX. Framework requires G9 ≥2 for domain review. |
| **BO-F-D05** | Explicit advisory: no domain UX shell standard; three layout naming patterns. |
| **Native dialogs** | **9+ sites** in scheduling (`SchedulingAdminContent`, `ScheduleBuilderVisual`, `AvailabilityManagement`, etc.) |
| **Token drift** | Scheduling builder hardcoded colors (Phase 0B evidence); not remediated |
| **ConfirmModal** | WC: partial adoption. HR: no native dialogs but inconsistent destructive-action patterns. Scheduling: **none** on delete flows. |
| **EmptyState** | Inconsistent across modules; WC uses widget patterns on some surfaces |

### What BO-1B would close

- G9 uplift (target ≥2, stretch 3)
- BO-F-D05 (domain UX shell standard)
- Scheduling UX-L1 bar (native dialog elimination)
- Domain score path to ≥85% + G9 ≥2 → **READY FOR DOMAIN REVIEW**

### What certification review could proceed without BO-1B

- **Module-only** BO-2 server constitutional review for **HR** and **Workforce Communications** (advisory-only findings)
- **Not recommended** for **Scheduling** until UX shell work complete (UX FAIL is review finding certainty)
- **Not recommended** for **domain-level** certificate until G9 addressed

---

## 5. Option evaluation

### Option A — Proceed to BO-1B UX Shell Alignment

| Pros | Cons |
|------|------|
| Closes only remaining FAIL gate (G9) | Defers certification review ~1 package |
| Addresses highest user-visible debt (scheduling confirm/prompt) | No constitutional backend gain |
| Unblocks domain READY FOR REVIEW path | — |
| Aligns with Phase 0B remediation sequence item 7 | — |

**Council weight:** **Recommended**

### Option B — Begin certification planning/review now

| Pros | Cons |
|------|------|
| HR and WC constitutionally strong | Domain review fails G9 bar |
| All majors closed | Scheduling UX findings guaranteed |
| Momentum from BO-1A | Split domain/module posture creates confusion |
| | Premature domain reference candidacy |

**Council weight:** **Acceptable for BO-2 planning charter only** — not for domain review execution

---

## 6. Recommended next package

# **A — BO-1B UX Shell Alignment**

**Sequence:**

1. **BO-1B** — UX shell (G9, BO-F-D05, scheduling native dialog migration)
2. **BO-2** — Certification planning + module/domain review (no ledger until council)
3. Optional parallel: BO-2 **planning documents only** during BO-1B (test matrices, review checklists)

**Do not skip BO-1B** if the goal is **domain-level** L3 WITH FINDINGS or domain reference candidacy.

---

## 7. Earliest realistic certification outcome

| Milestone | Earliest realistic timing |
|-----------|---------------------------|
| BO-1B complete | ~2–3 weeks engineering (estimate) |
| BO-2 module review (WC, HR) | Immediately after BO-1B or parallel planning |
| BO-2 domain review | After BO-1B (G9 ≥2 required) |
| **L3 WITH FINDINGS (domain)** | **~4–6 weeks post checkpoint** (BO-1B + BO-2 review cycle) |
| Plain L3 (domain) | After advisory remediation plan + UX PASS |
| Reference Candidate ratification | Post L3 WITH FINDINGS; separate council vote |

---

## 8. Reference potential (post BO-1A)

| Module | Pre BO-1A blockers | Post BO-1A | Reference status |
|--------|-------------------|------------|------------------|
| **HR** | F-HR-001..003 | **Unblocked** | **Reference Candidate #1** — ready for candidacy vote after BO-2 |
| **Scheduling** | F-SCH-004..007 | **Unblocked** (backend) | **Reference Candidate #6** — **conditional on BO-1B UX** |
| **Workforce Comms** | Phase G certified | **Strongest** | **Reference Candidate #7** — ready; advisory plan acceptable |

**Reference Module** (not candidate): Requires L3 certification + council promotion — **not ready today**.

**Reference Capability:** HR org-chart symmetry, scheduling domain events, WC broadcast lifecycle — each **capability reference** eligible post-certification.

**Not ready:** Domain-as-Reference-Implementation (File Hub remains sole L4).

---

## Required questions (answers)

| # | Question | Answer |
|---|----------|--------|
| 1 | Current open findings count? | **18** (all advisory) |
| 2 | Blocking findings count? | **0** |
| 3 | Major findings count? | **0** |
| 4 | Advisory findings count? | **18** |
| 5 | Previous readiness score? | **~63%** (17/27) |
| 6 | Current readiness score? | **~81%** (22/27) |
| 7 | Scheduling readiness? | **~75%** — L3 WITH FINDINGS candidate; UX blocks plain L3 |
| 8 | HR readiness? | **~85%** — L3 WITH FINDINGS candidate (strongest backend) |
| 9 | Workforce Communications readiness? | **~90%** — L3 candidate |
| 10 | Business Operations domain readiness? | **CONDITIONALLY READY** — not READY FOR DOMAIN REVIEW (G9 FAIL) |
| 11 | Is BO-1B still required? | **Yes** — before domain certification review |
| 12 | Recommended next package? | **BO-1B UX Shell Alignment** |
| 13 | Earliest realistic certification outcome? | **L3 WITH FINDINGS ~4–6 weeks** after BO-1B + BO-2 |
| 14 | Reference candidate status? | HR #1 ✓ · Scheduling #6 (conditional UX) · WC #7 ✓ |
