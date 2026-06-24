# Context Graph — Staging Soak Plan

**Program:** L4-F01 Staging Soak & Production Pilot Readiness  
**Finding:** L4-F01 (RD-CG-L4-001)  
**Date:** 2026-06-23  
**Status:** Approved soak protocol

---

## Objective

Validate the Project Assistant consumption-unification stack in a **non-production** environment before any production pilot flags are enabled.

---

## Pilot stack (staging only)

```bash
AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED=true
CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED=true
CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED=true
```

**Production defaults remain OFF.**

---

## Duration

| Phase | Duration | Activity |
|-------|----------|----------|
| **Phase 1 — Automated gate** | Day 0 | Full pilot test suite (37 tests); rollback drill |
| **Phase 2 — Staging soak** | 14 days | Live staging queries; daily diagnostics review |
| **Phase 3 — Sign-off** | Day 15 | Soak results + production pilot recommendation |

**Compressed path (dev validation lane):** Phase 1 + scenario documentation may precede live 14-day soak when staging environment is unavailable; production pilot requires Phase 2 completion OR explicit waiver with findings.

---

## Test users (staging)

| Cohort | Count | Scope |
|--------|------:|-------|
| Platform engineering | 2–3 | Full scenario suite |
| Internal dogfood | 5–10 | Project Assistant queries with real V_Link hubs |
| Security review | 1 | Scenario E permission boundary |

**No external users during soak.**

---

## Validation scenarios

| ID | Scenario | Example query | Pass criteria |
|----|----------|---------------|---------------|
| **A** | Project status | "What is the project status for this initiative?" | Retrieval + profile emitted |
| **B** | Cross-module discovery | "Help me understand everything related to this project" | ≥2 modules in evidence |
| **C** | Recent changes | "What is the project status and what changed recently?" | Retrieval runs; no errors |
| **D** | File + task + conversation | "What files, tasks, and messages are for this project?" | Bridge + reconcile; dedup |
| **E** | Permission boundary | V_Link restricted entity + retrieval overlap | `skippedUnsafeMergeCount` > 0; no leakage |

---

## Success metrics

| Metric | Target |
|--------|--------|
| Automated test pass rate | 100% (37/37 pilot-related) |
| Permission leakage incidents | 0 |
| Rollback drill success | < 15 min to safe state |
| `duplicateCount` | > 0 when overlap exists (reconcile working) |
| `skippedUnsafeMergeCount` | Correctly elevated on Scenario E |
| Retrieval errors | 0 unhandled per 100 queries |
| `retrievalDurationMs` p95 | < 500ms (staging observation) |

---

## Failure criteria (rollback trigger)

| Condition | Action |
|-----------|--------|
| Permission leakage confirmed | **Immediate rollback** all three flags |
| Unhandled exception in bridge/reconcile path | Rollback; incident review |
| Evidence from unverified permissions in production context | Rollback |
| `duplicateCount` always 0 with known V_Link overlap | Reconcile regression — hold pilot |
| Operator cannot execute rollback in 15 min | Hold production pilot |

---

## Rollback procedure

1. Unset all three pilot flags
2. Restart staging server
3. Verify no `retrieval_inference_bridge` in pipeline sources
4. Verify no `_grounding_reconcile` in context patches
5. Log soak termination reason

---

## Daily soak checklist (Phase 2)

- [ ] Review `_grounding_reconcile` aggregates
- [ ] Check `skippedUnsafeMergeCount` = 0 unless Scenario E cases
- [ ] Confirm flags still staging-only
- [ ] Sample 5 project_assistant queries manually
- [ ] No new security incidents

---

## References

- [CONTEXT_GRAPH_L4_OPERATIONAL_READINESS.md](./CONTEXT_GRAPH_L4_OPERATIONAL_READINESS.md)
- [CONTEXT_GRAPH_PROJECT_ASSISTANT_PILOT_VALIDATION.md](./CONTEXT_GRAPH_PROJECT_ASSISTANT_PILOT_VALIDATION.md)

**Last updated:** 2026-06-23
