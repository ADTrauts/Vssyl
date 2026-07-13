# AI Evaluation Architecture

**Program:** AI Architecture Phase 3  
**Date:** 2026-07-12  
**Status:** Active  
**Source of Truth for:** Canonical evaluation model and non-mutation rule

---

## Rule

**Evaluation never directly modifies runtime behavior.**

`AIEvaluation.mutatesRuntime` is always `false`. Corrections are routed for human/operator action; Twin and governed execution are unchanged by an evaluation write.

---

## Evaluator roles

| Role | Who |
|------|-----|
| `USER` | End user feedback |
| `BUSINESS_ADMIN` | Business admin |
| `VSSYL_OPERATOR` | Platform operator |
| `SYSTEM` | Automated heuristics / quality signals |

---

## Labels

`HELPFUL` · `INCORRECT` · `UNSAFE` · `INCOMPLETE` · `WRONG_SOURCE` · `WRONG_RETRIEVAL` · `WRONG_TOOL` · `WRONG_MEMORY` · `WRONG_REASONING` · `WRONG_PERMISSION` · `WRONG_BUSINESS_DATA` · `OTHER`

Labels may suggest root causes (`suggestRootCausesFromLabels`) but do not auto-apply platform changes.

---

## Persistence

- Model: `AIEvaluation` + `AIRootCauseFinding`
- Service: `persistAIEvaluation` in `evaluationService.ts`
- Optional: create `AICorrectionRoute` rows from root causes

---

## Related

- [`AI_ROOT_CAUSE_MODEL.md`](./AI_ROOT_CAUSE_MODEL.md)
- [`AI_CORRECTION_ROUTING.md`](./AI_CORRECTION_ROUTING.md)
