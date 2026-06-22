# Analytics Capability — Council Decision

**Program:** Analytics Capability — Certification Ratification Council  
**Decision date:** 2026-06-22  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — governance record only

**Classification:** Platform Capability — **not** Product Module

---

## Decision record

| Field | Value |
|-------|-------|
| **Decision ID** | **RD-AN-001** |
| **Capability** | `analytics` (Platform Analytics Capability) |
| **Council vote** | **APPROVE** |
| **Certification level** | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| **G1–G9 score** | **21/27 (~78%)** |
| **Ratification outcome** | **RATIFIED** |

---

## RD-AN-001 — Analytics L2 certification

| Field | Decision |
|-------|----------|
| **Ratified?** | **YES** |
| **Level** | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| **Class** | **Platform Capability** (Hybrid Domain primary engine) |
| **Evaluation basis** | [ANALYTICS_CERTIFICATION_EVALUATION.md](./ANALYTICS_CERTIFICATION_EVALUATION.md) |
| **Blocking findings** | **0** |
| **Certificate majors** | AN-M1, AN-M2, AN-M3, AN-M4, AN-M5, AN-M6 |
| **Certificate advisories** | AN-A1, AN-A2, AN-A3, AN-A4, AN-A5, AN-A6, AN-A7, AN-A8 |

### Rationale

1. **21/27** within Platform Capability **L2 CwF band (20–22)**.
2. **Zero blocking findings** — AN-01 through AN-08 closed in Phase 1.
3. **Trust model** — PE 4/4, activity 4/4, federated Chat/Todo rollups, no mock surfaces.
4. **Correct certification class** — Platform Capability; L3 product module correctly excluded.
5. **Open majors** are standard finding-track items — consistent with Dashboard L3 CwF precedent at appropriate tier.
6. **Evaluation packet** complete; no new blocking evidence at council.

### Not ratified

| Option | Reason |
|--------|--------|
| NOT CERTIFIED | 0 blockers; score exceeds L2 CwF floor |
| Plain LEVEL 2 CERTIFIED | 6 open majors; score 21 < 24 plain band |
| L3 (product or Platform Capability) | Out of scope; architectural / maturity mismatch |
| Reference producer | Out of scope; deferred |
| Phase 2 authorization | Out of scope; separate program gate |

---

## RD-AN-002 — Findings treatment

| Field | Decision |
|-------|----------|
| **Blocks certification?** | **No** |
| **Major disposition** | **OPEN ON CERTIFICATE** — AN-M1 through AN-M6 |
| **Advisory disposition** | **TRACK ON CERTIFICATE** — AN-A1 through AN-A8 |
| **Individual waivers** | **None** — all tracked |
| **Charter exclusions** | AN-09 (pipeline), AN-10 (warehouse) — not certificate defects |

### Major finding charter

| ID | Certificate obligation |
|----|------------------------|
| **AN-M1** | Ledger reclassification to Platform Capability L2 CwF on execution |
| **AN-M2** | Abstract personal metrics from raw Activity reads; rollup or aggregate store |
| **AN-M3** | Enforce or document `analytics:admin` on satellite operator paths |
| **AN-M4** | Deliver operation matrix HTTP integration CI suite |
| **AN-M5** | Enterprise tab data (Phase 3) or permanent feature gates with product sign-off |
| **AN-M6** | Formalize Calendar/Drive/Notification rollup contracts |

---

## RD-AN-003 — Execution authorization (not performed)

| Field | Decision |
|-------|----------|
| **Certification execution authorized?** | **YES** — separate ACT |
| **Ledger PR authorized?** | **YES** — separate ACT |
| **Ledger updated this session?** | **NO** |
| **Certification execution performed?** | **NO** |
| **Program archived?** | **NO** |
| **Phase 2 authorized?** | **NO** |

### Proposed ledger notation

```
LEVEL 2 CERTIFIED WITH FINDINGS · Platform Analytics Capability · G1–G9 21/27 · 14 tracked findings (6 major, 8 advisory)
```

### Proposed ledger reclassification (AN-M1)

| Field | Current (informal) | Proposed |
|-------|-------------------|----------|
| Row id | `analytics` | `analytics` |
| Class | Pseudo-module / product-adjacent L1 | **Platform Capability** |
| Level | L1 Stabilizing | **L2 Certified With Findings** |
| Notes | Subscriber stubs (removed) | Federated L2; 14 tracked findings |

---

## RD-AN-004 — Reference status (affirmed)

| Field | Decision |
|-------|----------|
| **Reference producer vote** | **Not on ballot** |
| **Status** | **Deferred** — per evaluation |
| **Consumer pattern** | **Affirmed** — Dashboard → `dashboardAnalyticsFacade` |
| **Revisit** | Post-ledger + Phase 2 pipeline (separate authorization) |

---

## RD-AN-005 — Hybrid Domain posture (affirmed)

| Layer | Ratified posture |
|-------|------------------|
| Platform Analytics Capability | **L2 CwF** — primary engine under vote |
| Operator Analytics | Admin Portal satellite — separate L3 CwF |
| Module Domain Analytics | Distributed — module programs |
| Product Surfaces | Consumers — not certifiable as module |
| AI Satellites | AI Platform — unwired scaffold (AN-A5 track) |

---

## Precedent alignment

| Program | Score | Class | Outcome | Analytics alignment |
|---------|------:|-------|---------|---------------------|
| Dashboard module | 24/27 | Product module L3 | L3 CwF | **Consumer relationship** — facade pattern affirmed |
| Workspace shell | 23/27 | Platform shell | L3 CwF | **Finding-track model** — open items on certificate |
| Business Operations | 24/27 | Product module | L3 CwF | **Score + finding model** — majors not blockers |
| Analytics (this vote) | 21/27 | **Platform Capability** | **L2 CwF** | **Correct tier** — capability not module |

**Council finding:** Analytics ratification is **consistent with platform precedent** for Certified With Findings at partial gates with tracked majors — at the **Platform Capability L2** tier appropriate to Hybrid Domain classification.

---

## Council vote disposition

| Option | Verdict |
|--------|---------|
| **A. APPROVE** | ✅ **Selected** |
| **B. DEFER** | ❌ Not warranted |
| **C. REJECT** | ❌ Not warranted |

---

## Required questions

| # | Answer |
|---|--------|
| 1 | Certification vote? **APPROVE** |
| 2 | Certification level? **LEVEL 2 CERTIFIED WITH FINDINGS** |
| 3 | Blocking findings? **0** |
| 4 | Major findings? **AN-M1–M6** |
| 5 | Advisory findings? **AN-A1–A8** |
| 6 | Findings treatment? **OPEN / TRACK on certificate** |
| 7 | Reference status? **Consumer affirmed; producer deferred** |
| 8 | Ledger recommendation? **Platform Capability L2 CwF @ 21/27** — execution authorized |
| 9 | Consistent with precedent? **Yes** |
| 10 | Remaining risks? M4 CI; M1 ledger; M2/M5 product; scale |
| 11 | Modernization complete? **Phase 1 yes**; full program **no** |
| 12 | Next initiative? **Certification execution + ledger PR** |
| 13 | Program status? **RATIFIED — execution pending** |
| 14 | Ratification outcome? **RATIFIED** |
| 15 | Certification execution authorized? **YES — not performed here** |

---

**Last updated:** 2026-06-22
