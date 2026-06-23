# Platform Kernel — Council Decision

**Program:** Platform Kernel — Certification Ratification Council  
**Decision date:** 2026-06-23  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — governance record only

**Classification:** Platform Capability — **not** Product Module

**Topology:** Option C — combined + sub-scores

---

## Decision record

| Field | Value |
|-------|-------|
| **Decision ID** | **RD-PK-001** |
| **Capability** | `platform_kernel` (Platform Kernel) |
| **Council vote** | **APPROVE** |
| **Certification level** | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| **Combined G1–G9** | **21/27 (~78%)** |
| **Activity sub-score** | **22/27 (~81%)** |
| **Domain Events sub-score** | **21/27 (~78%)** |
| **Ratification outcome** | **RATIFIED** |

---

## RD-PK-001 — Platform Kernel L2 certification

| Field | Decision |
|-------|----------|
| **Ratified?** | **YES** |
| **Level** | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| **Class** | **Platform Capability** (composite Activity + Domain Events) |
| **Topology** | **Option C** — combined award + sub-scores |
| **Evaluation basis** | [PLATFORM_KERNEL_CERTIFICATION_EVALUATION.md](./PLATFORM_KERNEL_CERTIFICATION_EVALUATION.md) |
| **Blocking findings** | **0** |
| **Certificate majors** | PK-ACT-M1, PK-ACT-M4, PK-DE-M4, PK-K-M1 |
| **Certificate advisories** | PK-ACT-M5, M8, M9; PK-DE-M3, M6, M7 |

### Rationale

1. **21/27** within Platform Capability **L2 CwF band (20–22)**.
2. **Zero blocking findings** — ACT-R1, subscriber honesty, and HR adoption closed in Wave 3.
3. **Trust model** — canonical activity reads; honest DE registration; dual-write on certified modules.
4. **Correct certification class** — Platform Capability infrastructure; product module L3 correctly excluded.
5. **Four open majors** are standard finding-track items — consistent with Analytics L2 CwF and Dashboard L3 CwF precedent at appropriate tier.
6. **Option C topology** — joint kernel cert prevents partial-certification theater for dual-write platform.
7. **Evaluation packet** complete; no new blocking evidence at council.

### Not ratified

| Option | Reason |
|--------|--------|
| NOT CERTIFIED | 0 blockers; score exceeds L2 CwF floor |
| Plain LEVEL 2 CERTIFIED | 4 open majors; score 21 < 23 plain band |
| L3 infrastructure | Out of scope; durability/replay required |
| Reference producer | Out of scope; deferred per evaluation |
| PK-W4 / L3 authorization | Out of scope; separate program gates |

---

## RD-PK-002 — Findings treatment

| Field | Decision |
|-------|----------|
| **Blocks certification?** | **No** |
| **Major disposition** | **OPEN ON CERTIFICATE** — PK-ACT-M1, M4; PK-DE-M4; PK-K-M1 |
| **Advisory disposition** | **TRACK ON CERTIFICATE** — PK-ACT-M5, M8, M9; PK-DE-M3, M6, M7 |
| **Individual waivers** | **None** — all tracked |
| **Charter exclusions** | L3 durability/replay — not certificate defects |

### Major finding charter

| ID | Certificate obligation | Owner |
|----|------------------------|-------|
| **PK-ACT-M1** | Retire legacy `Activity` table; remove C-12 `deleteMany` path | Platform Engineering |
| **PK-ACT-M4** | Delegate Place + workforce_comms to `platformActivityQueryService` | Platform + module owners |
| **PK-DE-M4** | CI enforcement for registry orphan types | Platform Engineering |
| **PK-K-M1** | Operator guide for `module_activity_event` vs `domain_event_recorded` | Platform Engineering |

### Advisory finding charter

| ID | Track obligation |
|----|------------------|
| **PK-ACT-M5** | Runtime-validated activity operation matrix (parity with DE) |
| **PK-ACT-M8** | ESLint ban on `prisma.activity` in production paths |
| **PK-ACT-M9** | PE parity on activity feed reads |
| **PK-DE-M3** | L3 durability/replay program — not L2 blocker |
| **PK-DE-M6** | Document or expand notification/AI type maps |
| **PK-DE-M7** | Optional DE-3 consumer expansion |

### Sub-score regression rule (ratified)

If either **Activity** or **Domain Events** sub-score falls to **≤17** post-certification, council **patch review** required before plain-L2 uplift consideration.

---

## RD-PK-003 — Topology affirmation (Option C)

| Field | Decision |
|-------|----------|
| **Combined certificate** | **Affirmed** |
| **Activity sub-score on certificate** | **22/27 — Affirmed** |
| **Domain Events sub-score on certificate** | **21/27 — Affirmed** |
| **Split ledger rows** | **Rejected** |

---

## RD-PK-004 — Execution authorization (not performed)

| Field | Decision |
|-------|----------|
| **Certification execution authorized?** | **YES** — separate ACT |
| **Ledger PR authorized?** | **YES** — separate ACT |
| **Ledger updated this session?** | **NO** |
| **Certification execution performed?** | **NO** |
| **Program archived?** | **NO** |
| **PK-W4 authorized?** | **NO** |
| **L3 durability authorized?** | **NO** |

### Proposed ledger notation

```
LEVEL 2 CERTIFIED WITH FINDINGS · Platform Kernel · G1–G9 21/27 · Sub-scores: Activity 22/27, Domain Events 21/27 · 10 tracked findings (4 major, 6 advisory) · Topology Option C
```

### Proposed ledger row

| Field | Current (informal) | Proposed |
|-------|-------------------|----------|
| Row id | *(none)* | `platform_kernel` |
| Class | Uncertified L1 infrastructure | **Platform Capability** |
| Level | L1 | **L2 Certified With Findings** |
| Sub-scores | N/A | Activity 22/27; Domain Events 21/27 |
| Notes | ACT-R1 debt; stub subscribers | Wave 3 complete; 10 tracked findings |

---

## RD-PK-005 — Reference status (affirmed)

| Field | Decision |
|-------|----------|
| **Reference producer vote** | **Not on ballot** |
| **Status** | **Deferred** — per evaluation |
| **Module facade pattern** | **Affirmed** — dual-write lifecycle |
| **Activity query consumer** | **Affirmed** — `platformActivityQueryService` |
| **DE honesty pattern** | **Affirmed** — matrix-driven registration |
| **Revisit** | Post-W4 + registry CI (separate authorization) |

---

## Precedent alignment

| Program | Score | Class | Outcome | Platform Kernel alignment |
|---------|------:|-------|---------|---------------------------|
| Analytics Capability | 21/27 | Platform Capability | L2 CwF | **Direct peer** — same band, class, finding count model |
| Dashboard | 24/27 | Product module L3 | L3 CwF | **Consumer** — kernel read dependency |
| Reference Workspace | 23/27 | Platform shell | L3 CwF | **Finding-track at ratification** |
| Account Platform | L3 | Platform domain | L3 | **Registry participant** |
| Business Operations | 24/27 | Product module | L3 CwF | **HR emitter adopted** |

**Council finding:** Ratification is **consistent with precedent**.

---

## Council vote disposition

| Option | Verdict |
|--------|---------|
| **A. APPROVE** | ✅ **Selected** |
| **B. REJECT** | ❌ Not warranted |
| **DEFER** | ❌ Not warranted |

---

## Required questions

| # | Answer |
|---|--------|
| 1 | Certification vote? **APPROVE** |
| 2 | Certification level? **LEVEL 2 CERTIFIED WITH FINDINGS** |
| 3 | Blocking findings? **0** |
| 4 | Major findings? **PK-ACT-M1, M4; PK-DE-M4; PK-K-M1** |
| 5 | Advisory findings? **PK-ACT-M5, M8, M9; PK-DE-M3, M6, M7** |
| 6 | Findings treatment? **OPEN / TRACK on certificate** |
| 7 | Certification topology affirmed? **Yes — Option C** |
| 8 | Reference posture? **Facade/consumer affirmed; producer deferred** |
| 9 | Ledger recommendation? **Platform Kernel L2 CwF @ 21/27** — execution authorized |
| 10 | Consistent with precedent? **Yes** |
| 11 | Remaining risks? Legacy table; orphan registry; in-process DE; PE gap |
| 12 | Modernization complete? **Wave 3 yes**; full program **no** |
| 13 | Next initiative? **Certification execution + ledger PR** |
| 14 | Ratification outcome? **RATIFIED** |
| 15 | Certification execution authorized? **YES — not performed here** |

---

**Last updated:** 2026-06-23
