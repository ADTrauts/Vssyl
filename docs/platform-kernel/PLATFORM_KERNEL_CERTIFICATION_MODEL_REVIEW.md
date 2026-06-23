# Platform Kernel — Certification Model Review

**Program:** Platform Kernel — L2 Certification Readiness Review  
**Review date:** 2026-06-23  
**Status:** Formal recommendation — **not** ratified

---

## 1. Decision

Evaluate three certification topologies for Platform Kernel at L2.

| Option | Description |
|--------|-------------|
| **A** | Single combined Platform Kernel certification |
| **B** | Separate certifications: Platform Activity · Domain Events |
| **C** | Combined certification **with sub-scores** per pillar |

**Formal recommendation: Option C — Combined certification with sub-scores**

---

## 2. Options analysis

### Option A — Single combined certification

| Pros | Cons |
|------|------|
| Matches Wave 1 joint program charter | Hides pillar-specific regression |
| One ledger row; portfolio simplicity | Activity-only or DE-only fixes could mask weakness |
| Aligns with "kernel" as one runtime concern | Evaluators lose transparency on dual-write |

**Verdict:** Acceptable but **insufficient transparency** for a dual-pillar capability.

---

### Option B — Separate certifications

| Pros | Cons |
|------|------|
| Clear ownership per pillar | **Misleading** — modules dual-write; partial cert implies independence |
| Independent re-cert cycles | Portfolio could show Activity L2 + DE L1 while kernel is unusable cross-cutting |
| Simpler per-surface scoring | Duplicates G2/G9 cross-cutting gates |

**Verdict:** **Reject** — contradicts constitutional model (complementary dual-write, not interchangeable).

---

### Option C — Combined with sub-scores (recommended)

| Pros | Cons |
|------|------|
| One **Platform Kernel** ledger row | Slightly more evaluation paperwork |
| Sub-scores: Activity + Domain Events | Council must agree on weighting rules |
| Matches Analytics precedent (single capability, detailed gates) | — |
| Prevents partial-certification theater | — |
| Supports finding-track per pillar | — |

**Verdict:** **RECOMMENDED**

---

## 3. Proposed certificate structure

```
LEVEL 2 CERTIFIED WITH FINDINGS
Platform Kernel Capability
Combined G1–G9: 21/27
Sub-scores:
  - Platform Activity: 22/27
  - Domain Events: 21/27
Findings: N major, M advisory (TBD at evaluation)
```

**Weighting rule for evaluation:** Combined score is **holistic** (weakest cross-cutting gates), not arithmetic mean. Sub-scores are **informational** and **regression triggers** — either pillar dropping below L2 entry (≤17) should block plain L2 uplift even if combined remains ≥20.

---

## 4. Precedent

| Program | Topology | Outcome |
|---------|----------|---------|
| Analytics Capability | Single platform capability + G1–G9 detail | L2 WITH FINDINGS 21/27 |
| Dashboard | Product module + CwF findings | L3 CwF |
| Wave 1 Platform Kernel charter | Option C joint program | Activity-first sequencing within joint cert |

Platform Kernel is **infrastructure capability**, not a product module — topology should mirror **Analytics**, not Drive/Chat module certs.

---

## 5. Sequencing implications

| Question | Answer |
|----------|--------|
| Must both pillars pass before evaluation? | **Yes** — both at L2 candidate |
| Can one pillar certify later? | **No** under Option C for initial L2 row |
| Post-cert pillar regression | Sub-score monitoring; patch cert if major drift |

---

## 6. Required question

| # | Question | Answer |
|---|----------|--------|
| 9 | Appropriate certification topology? | **Option C** — combined + sub-scores |

---

## 7. Council action requested

1. **Accept Option C** as evaluation topology.
2. Authorize **formal L2 certification evaluation** session (separate package).
3. Do **not** split ledger rows for Activity vs Domain Events at L2.

---

**Last updated:** 2026-06-23
