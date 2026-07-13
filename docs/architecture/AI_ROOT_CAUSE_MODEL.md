# AI Root Cause Model

**Program:** AI Architecture Phase 3  
**Date:** 2026-07-12  
**Status:** Active  
**Source of Truth for:** Why an execution failed quality — multi-cause taxonomy

---

## Question

Not only “Was the answer wrong?” — **Why?**

Multiple root causes are allowed per evaluation (`AIRootCauseFinding[]`).

---

## Taxonomy (`AIRootCauseCode`)

| Code | Meaning |
|------|---------|
| `PROVIDER` | Provider quality / availability |
| `PROMPT` | Prompt construction / policy |
| `RETRIEVAL` | Wrong or failed retrieval |
| `KNOWLEDGE` | Knowledge content / selection (scoped) |
| `CONTEXT` | Context assembly |
| `GROUNDING` | Grounding / evidence |
| `BUSINESS_DATA` | Incorrect business SoR data |
| `PERSONAL_MEMORY` | Incorrect personal memory |
| `TOOL` | Wrong tool or tool failure |
| `APPROVAL` | Approval gating |
| `AUTHORIZATION` | AuthZ / membership |
| `SOURCE_OF_RECORD` | Wrong module SoR |
| `HALLUCINATION` | Ungrounded invention |
| `MISSING_CONTEXT` | Needed context absent |
| `AMBIGUOUS_PROMPT` | Unclear user intent |
| `USER_ERROR` | User misunderstanding |
| `ROUTING` | Provider/model routing decision |
| `OTHER` | Unclassified |

---

## Classification assist

`classifyRootCauses` / `suggestRootCausesFromLabels` map evaluation labels → suggested codes. Operators may override.

---

## Related

- [`AI_CORRECTION_ROUTING.md`](./AI_CORRECTION_ROUTING.md)
- [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md) — Knowledge vs Intelligence
