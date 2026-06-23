# Platform Kernel — Post-Ratification Roadmap

**Program:** Platform Kernel Modernization  
**Ratification:** RD-PK-001 (2026-06-23)  
**Certification level:** **LEVEL 2 CERTIFIED WITH FINDINGS @ 21/27**  
**Topology:** Option C — combined + Activity 22/27 · Domain Events 21/27 sub-scores  
**Classification:** Platform Capability — composite infrastructure  
**Status:** Authoritative post-ratification roadmap — **program NOT archived**

---

## Ratification posture

| Field | Value |
|-------|-------|
| Council decision | **APPROVE — RATIFIED** |
| Ledger | **Executed** 2026-06-23 |
| Certification execution | **Executed** 2026-06-23 |
| Reference producer | **Deferred** |
| Wave 3 (ACT-R1, IMP, DE-1/2) | **Complete** |
| PK-W4 (Activity table retirement) | **Not authorized** — separate gate |
| L3 durability / replay | **Not authorized** — separate program gate |
| DE-3 optional expansion | **Not authorized** — optional future |

---

## Phase map

```
Wave 1          ✅ Discovery & constitutional audit
Wave 2          ✅ Charters (Activity read contract, DE hardening)
Wave 3          ✅ ACT-R1 + IMP-1/3 + DE-1/2 engineering
Readiness       ✅ L2 CwF candidate @ 21/27
Authorization   ✅ AUTHORIZE evaluation
Evaluation      ✅ PASS WITH FINDINGS @ 21/27
Ratification    ✅ RD-PK-001 APPROVE
Execution       ✅ Ledger PR + certificate issuance (2026-06-23)
Finding burn-down ⏳ Per certificate (no new package authorized today)
PK-W4           ❌ Not authorized
L3 durability   ❌ Not authorized — future program gate
Archive         ✅ ARCHIVED (2026-06-23)
```

---

## Immediate next gates (priority order)

| # | Initiative | Type | Priority | Notes |
|---|------------|------|----------|-------|
| 1 | **Certification execution** — ledger PR | Certification ops | **High** | Authorized by RD-PK-001; update `CERTIFICATION_LEDGER.md` |
| 2 | **Certificate issuance** — 10 tracked findings | Certification ops | **High** | 4 major + 6 advisory on certificate |
| 3 | **Platform portfolio refresh** | Documentation | **Medium** | Kernel L1 → L2 CwF in portfolio docs |
| 4 | **Memory Bank refresh** | Documentation | **Medium** | `activeContext.md`, `progress.md` kernel status |
| 5 | **Operator guide (PK-K-M1)** | Documentation | **Medium** | Dual Log operations — finding obligation |
| 6 | **PK-W4 authorization review** | Governance | **Low** | Activity table retirement — when council schedules |

**PK-W4 and L3 engineering are explicitly NOT authorized by this ratification.**

---

## Certificate finding remediation themes (no package charter today)

Remediation may proceed opportunistically or via future authorized packages.

### Theme 1 — Activity hygiene (PK-ACT-M1, M4, M5, M8)

| Finding | Remediation | Target gate |
|---------|-------------|-------------|
| PK-ACT-M1 | Retire `Activity` table; remove C-12 cleanup | G9 → 3 |
| PK-ACT-M4 | Delegate Place/workforce to query service | G4 → 3 |
| PK-ACT-M5 | Runtime activity operation matrix | G3/G6 uplift |
| PK-ACT-M8 | ESLint `prisma.activity` ban | Drift prevention |

**Package candidate:** PK-W4 — Activity Table Retirement & Hygiene

### Theme 2 — Domain Events governance (PK-DE-M4, M6, M7)

| Finding | Remediation | Target gate |
|---------|-------------|-------------|
| PK-DE-M4 | Registry orphan CI audit | G5/G6 uplift |
| PK-DE-M6 | Expand or document notification/AI maps | G9 uplift |
| PK-DE-M7 | Optional DE-3 consumer expansion | Post-cert optional |

**Package candidate:** PK-W4-DE — Registry CI & Consumer Expansion (optional)

### Theme 3 — Authorization & trust (PK-ACT-M9, PK-K-M1)

| Finding | Remediation | Target gate |
|---------|-------------|-------------|
| PK-ACT-M9 | PE on activity feed reads | G1 → 3 |
| PK-K-M1 | Operator runbook for dual Log ops | G9 uplift |

### Theme 4 — L3 horizon (PK-DE-M3)

| Finding | Remediation | Program |
|---------|-------------|---------|
| PK-DE-M3 | Durable bus + replay | **L3 program** — separate council gate |

**Not in L2 finding burn-down path for plain-L2 uplift without council L3 authorization.**

---

## Plain L2 uplift path (informational)

| Current | Plain L2 target | Requires |
|---------|-----------------|----------|
| 21/27 combined | 23+/27 | Close 4 majors + partial gate uplift |
| 4 open majors | 0 | W4, delegate, CI audit, operator guide |
| G1, G4, G8, G9 partial | Mostly 3 | PE, delegation, L3 excluded from G8 |

**Council has not authorized plain-L2 uplift program.** L2 CwF is the ratified target.

---

## Cross-program dependencies

| Program | Relationship | Post-ratification action |
|---------|--------------|--------------------------|
| **Analytics** (L2 CwF) | Consumer of activity reads | No change — ACT-R1 benefits retained |
| **Dashboard** (L3 CwF) | Activity feed consumer | No kernel change required |
| **Account Platform** (L3) | DE emitter | Maintain registry participation |
| **Business Operations** (L3 CwF) | HR dual-write | Maintain HR facade |
| **Platform portfolio** | Status docs | Refresh after ledger execution |

---

## Sub-score monitoring (Option C)

| Pillar | Ratified score | Regression trigger |
|--------|---------------:|--------------------|
| Platform Activity | 22/27 | ≤17 → patch review |
| Domain Events | 21/27 | ≤17 → patch review |
| Combined | 21/27 | Either pillar regression applies |

---

## What this roadmap does not authorize

- Ledger modification
- Certificate physical issuance
- Program archive
- PK-W4 implementation ACT
- L3 durability / replay engineering
- DE-3 consumer expansion ACT
- Reference producer elevation

---

**Last updated:** 2026-06-23
