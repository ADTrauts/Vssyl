# Account Platform — Composite G1–G9 Model

**Program:** Account Platform — Umbrella Certification Planning  
**Date:** 2026-06-20  
**Framework:** G1–G9 platform capability gates (umbrella composite variant)  
**Status:** Authoritative scoring model for umbrella evaluation

**Inputs:** Trilogy ratified scorecards · [ACCOUNT_PLATFORM_COMPOSITE_SCORECARD.md](./ACCOUNT_PLATFORM_COMPOSITE_SCORECARD.md)

---

## Model purpose

Define **how umbrella composite G1–G9 scores are calculated**, how **inherited sub-domain findings** constrain gates, and how **ratified sub-domain certifications** influence — but do not replace — umbrella scoring.

---

## Scoring outputs

| Output | Formula | Planning estimate | Use |
|--------|---------|-------------------|-----|
| **Trilogy mean** | (PP-1 + PP-2 + PP-3) ÷ 3 | **24.33/27 (~89%)** | Informational — sub-domain strength index |
| **Umbrella composite** | Σ gate scores (rules below) | **22/27 (~81%)** | **Authoritative** for certification vote |

---

## Gate scoring rules

Each gate scored **1–3** at **program level** by the umbrella evaluator.

| Score | Label | Meaning |
|------:|-------|---------|
| **3** | PASS | Meets constitutional bar across all in-scope slices |
| **2** | PASS WITH FINDINGS | Functional; documented open findings; no P0 gap |
| **1** | FAIL | Material gap; may still certify at L3 WF if compensated |

### Aggregation rule (per gate)

```
umbrella_gate_score = f(min(sub_scores), mean(sub_scores), cross_cut_findings)
```

| Condition | Rule |
|-----------|------|
| All sub-programs ≥3 on gate | Umbrella gate = **3** |
| All sub-programs ≥2, at least one = 2 | Umbrella gate = **2** (WITH FINDINGS) |
| Any sub-program = 1, others compensate | Apply **G9 compensation rule** (below) or cap at **2** |
| Any sub-program = 1, no compensation | Umbrella gate = **1** (FAIL) |
| Cross-cut finding elevates severity | Cap gate at **2** while major open |

### G9 compensation rule

When one sub-domain scores G9=1 (FAIL) but others score G9≥3:

- Umbrella G9 may score **2** (PARTIAL) if cross-domain UX is **functional** outside the failing slice.
- **Plain L3 blocked** regardless — umbrella G9 must be ≥2 for L3 WF; ≥3 for plain L3.

**Applied:** PP-3 G9=1 (modal billing) compensated to umbrella G9=2 by PP-1/PP-2 UX coherence.

---

## Sub-domain gate inheritance

| Gate | PP-1 | PP-2 | PP-3 | Min | Mean | Umbrella (planning) |
|------|-----:|-----:|-----:|----:|-----:|--------------------:|
| G1 Authorization | 3 | 3 | 2 | 2 | 2.67 | **2** |
| G2 Auditability | 2 | 3 | 3 | 2 | 2.67 | **2** |
| G3 Service boundaries | 3 | 3 | 3 | 3 | 3.00 | **3** |
| G4 API coherence | 3 | 3 | 3 | 3 | 3.00 | **3** |
| G5 Ownership | 3 | 2 | 3 | 2 | 2.67 | **2** |
| G6 Test evidence | 2 | 3 | 2 | 2 | 2.33 | **2** |
| G7 Documentation | 3 | 3 | 3 | 3 | 3.00 | **3** |
| G8 Production safety | 2 | 3 | 2 | 2 | 2.33 | **2** |
| G9 UX consistency | 3 | 3 | 1 | 1 | 2.33 | **2** |
| **Total** | 24 | 26 | 23 | — | 24.33 | **22** |

---

## Inherited findings — handling rules

### Frozen at ratification

| Rule | Description |
|------|-------------|
| **No reopen** | Closed PP1/PP2/PP3 findings cannot be reopened at umbrella eval without regression evidence |
| **Severity preserved** | Open sub-domain majors remain majors at umbrella (AP-UMB-M*) |
| **Disposition inherited** | Waivers (F02 `normalizeTier()`) and exceptions (F14 billing trash) carry forward |
| **New findings capped** | Evaluator may add ≤3 AP-UMB-EVAL-* findings; cannot downgrade inherited majors |

### Finding → gate constraint map

| Finding | Constrains gate | Max gate while open |
|---------|-----------------|---------------------|
| AP-UMB-M01 (MFA) | G1, G8 | 2 |
| AP-UMB-M02 (billing UX) | G9 | 2 |
| AP-UMB-M03 (business dedup) | G5, G9 | 2 |
| AP-UMB-M04 (tier vocab) | G5, G8 | 2 |
| AP-UMB-M05 (invoice activity) | G2 | 2 |
| AP-UMB-M06 (photo controller) | G3 | 2 |
| AP-UMB-M07 (module PE) | G1 | 2 |
| Advisories | None (track-only) | No cap |

### Sub-domain certification influence

| Influence type | Effect |
|----------------|--------|
| **Ratified L3 WF** | Prerequisite for umbrella eval — not automatic umbrella pass |
| **Sub-domain score** | Informs gate aggregation; does not copy verbatim |
| **Sub-domain findings** | Roll up to AP-UMB register |
| **Sub-domain exclusions** | Held at umbrella — BA, AI, Dashboard, Admin Portal |
| **Re-evaluation** | Sub-domains **not** re-evaluated at umbrella unless regression charter |

---

## Certification thresholds

| Level | Requirements |
|-------|--------------|
| **NOT CERTIFIED** | Composite &lt;70% OR any open blocking finding OR G3/G4 &lt;2 |
| **L3 WITH FINDINGS** | All gates ≥2 · 0 blockers · unified matrix ≥90% C+P · ≤7 open majors |
| **Plain L3** | All gates ≥3 · G9≥3 · 0 open majors · MFA implemented |

**Planning projection:** Account Platform meets **L3 WITH FINDINGS** threshold at 22/27 (~81%).

**Plain L3:** Not in horizon — AP-UMB-M01, M02, M03, M04 block.

---

## Evaluator instructions (umbrella)

1. Validate unified operation matrix sample (≥10 rows per slice).
2. Score each G1–G9 gate using aggregation rules above.
3. Confirm AP-UMB findings register — no new blockers without regression evidence.
4. Report dual scores (trilogy mean + umbrella composite).
5. Recommend L3 WITH FINDINGS unless composite &lt;70% or G3/G4 fail.

---

## Evidence binder requirements (composite)

| Gate | Required evidence |
|------|-------------------|
| G1 | PE action inventory across trilogy; MFA disposition doc |
| G2 | Activity + domain event coverage map; invoice gap noted |
| G3 | Service boundary diagram; photo multer noted |
| G4 | API route inventory; payment retirement proof |
| G5 | Ownership model + exclusions; tier SoR doc |
| G6 | Test file inventory (~50+ trilogy tests); integration gap noted |
| G7 | Doc index + this unified matrix |
| G8 | Stripe webhook review; tier safety; MFA disposition |
| G9 | Hub IA map; billing modal scope; F08 disposition |

---

## Score sensitivity analysis

| Scenario | Composite impact |
|----------|------------------|
| Close AP-UMB-M02 (billing UX) | G9 → 3; total **23/27** |
| Close AP-UMB-M01 (MFA) | G1/G8 → 3; total **24/27** |
| Close all majors | Plain L3 path opens (~25–26/27 projected) |
| PP-3 regression (reopen F03) | G4 → 1; **blocks L3 WF** |

---

**Last updated:** 2026-06-20 (Umbrella Certification Planning)
