# Context Graph — Production Pilot Recommendation

**Program:** L4-F01  
**Date:** 2026-06-23  
**Authority:** [CONTEXT_GRAPH_STAGING_SOAK_RESULTS.md](./CONTEXT_GRAPH_STAGING_SOAK_RESULTS.md)

---

## Decision

### **B — Approve With Findings**

The first **Project Assistant** production pilot may proceed under **strict scope controls** after operator sign-off. Broad rollout is **not** approved.

---

## Rationale

### Approve (partial)

1. **37/37 automated pilot tests pass** — full stack validated (retrieval → bridge → reconcile).
2. **Scenarios A–E pass** — including permission boundary and dedup behavior.
3. **Safety controls verified** — rollback, flag gating, unsafe merge skip, no inference persistence.
4. **Diagnostics sufficient** for controlled pilot monitoring.
5. **L4-F01 automated gate closed** — constitutional and operational readiness demonstrated.

### Findings (conditions on approval)

| ID | Condition |
|----|-----------|
| PP-F01 | **Staged cohort only** — internal users / designated pilot group; no global flag enable |
| PP-F02 | **14-day production monitoring** required as continuation of soak (Phase 2) |
| PP-F03 | **Rollback drill** in target production environment before first user |
| PP-F04 | **Controlled diagnostics** — aggregates only; no raw titles to external analytics |
| PP-F05 | **Single consumer** — `project_assistant` only; no consumer expansion |

### Not approved

- Broad production enablement (all users)
- Multi-consumer expansion
- VLinkSuggestion, read API, graph persistence

---

## Approved production pilot scope

| Parameter | Value |
|-----------|-------|
| Consumer | `project_assistant` only |
| Flags | All three `true` (staging/pilot env only initially) |
| Cohort | Internal / designated pilot users |
| Duration | Minimum 14 days monitored |
| Rollback | Ready before day 1 |

---

## Why not full Approve (A)

Live 14-day staging soak with real user traffic not yet completed (SOAK-F01). Automated validation is strong but production needs monitored cohort phase.

## Why not Defer (C) or Reject (D)

No blocking failures. Security and dedup behavior validated. Deferral would delay value without addressing a identified defect.

---

## Operator checklist before production day 1

- [ ] Enable flags in **pilot environment only**
- [ ] Production rollback drill executed
- [ ] On-call aware of [CONTEXT_GRAPH_L4_OPERATIONAL_READINESS.md](./CONTEXT_GRAPH_L4_OPERATIONAL_READINESS.md)
- [ ] Diagnostics collection configured (aggregates)
- [ ] Cohort list defined

---

## Success criteria (production pilot)

| Metric | Target |
|--------|--------|
| Permission incidents | 0 |
| Rollback events | 0 unless incident |
| `skippedUnsafeMergeCount` anomalies | Investigate if sustained > baseline |
| User-reported duplicate context | < 5% of pilot queries |

---

**Last updated:** 2026-06-23
