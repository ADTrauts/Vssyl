# Context Graph — Level 4 Certification Record

**Program:** Context Graph L4 Certification  
**Record id:** **RD-CG-L4-001**  
**Ratification date:** 2026-06-23  
**Authority:** [CONTEXT_GRAPH_L4_CERTIFICATION_REVIEW.md](./CONTEXT_GRAPH_L4_CERTIFICATION_REVIEW.md)

---

## Certification award

| Field | Value |
|-------|-------|
| **Surface** | Context Graph — Consumption Unification Amendment |
| **Prior certification** | LEVEL 3 CERTIFIED (RD-CG-010) |
| **Awarded certification** | **LEVEL 4 CERTIFIED WITH FINDINGS** |
| **Composite posture** | **L4 CwF** (L3 federation + L4 consumption) |
| **Reference Capability** | **#CG-4** Consumption Unification |
| **G1–G9** | **26/27 (~96%)** |
| **Blocking findings** | **0** |
| **Major on certificate** | **1** (L4-F01) |
| **Advisories** | **7** |

---

## Certified capabilities (composite)

| # | Capability | Level | Band |
|---|------------|-------|------|
| CG-1 | Federated Context Graph Read Model | 3 | Reference Capability |
| CG-2 | V_Link Cross-Module Association Substrate | 3 | Reference Capability |
| CG-3 | Context Bundle Descriptor / AI Grounding | 3 | Reference Capability With Findings |
| **CG-4** | **Consumption Unification (Bridge + Reconcile)** | **4** | **Reference Capability With Findings** |

---

## Certified behavior (#CG-4)

1. **Retrieval inference bridge** — additive bundle enrichment; inference provenance; no persistence.
2. **Grounding reconciliation** — source priority (V_Link > federation > inference > evidence); unsafe merge skip.
3. **Pilot consumer** — `project_assistant` only (L4-F02 ratified scope).
4. **Feature flags** — all default **off**; explicit opt-in required.

---

## Production gate (L4-F01)

**L4-F01 CLOSED (2026-06-23)** — Controlled production pilot **Approved With Findings**. See [CONTEXT_GRAPH_PRODUCTION_PILOT_RECOMMENDATION.md](./CONTEXT_GRAPH_PRODUCTION_PILOT_RECOMMENDATION.md).

Production pilot requires:

1. Staged cohort only (not broad rollout)
2. Production rollback drill before day 1
3. 14-day monitored pilot period
4. Operator sign-off

---

## Findings on certificate

| ID | Class | Summary | Due |
|----|-------|---------|-----|
| L4-F01 | Major | Staging soak before production pilot | **Closed** — [CONTEXT_GRAPH_L4_F01_CLOSEOUT.md](./CONTEXT_GRAPH_L4_F01_CLOSEOUT.md) |
| L4-F02 | Advisory | Single consumer scope ratified | L5 or expansion phase |
| L4-F03 | Advisory | Bounded read API deferred | Separate program |
| L4-F04 | Advisory | NOTE V_Link gap | Notes module |
| L4-F05 | Advisory | HR/scheduling adapters | Module teams |
| L4-F06 | Advisory | Operator runbook maintenance | Ongoing |
| L4-F07 | Advisory | Domain event bundle refresh | Future phase |
| L4-F08 | Advisory | L3 advisories (8) carry forward | CG-6 plan |

---

## Ledger entry (executed)

```
LEVEL 4 CERTIFIED WITH FINDINGS · Consumption amendment ratified 2026-06-23 (RD-CG-L4-001) ·
L3 federation (RD-CG-010) reaffirmed · Reference Capability #CG-4 ·
G1–G9 26/27 (~96%) · 0 blocking · 1 major (production gate) · 7 advisories
```

---

## Explicit non-authorization

- Graph persistence / database
- VLinkSuggestion auto-persist
- Bounded graph read API
- Multi-consumer production rollout
- Production flag enablement without L4-F01 closure

**Last updated:** 2026-06-23
