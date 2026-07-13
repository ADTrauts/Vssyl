# AI Correction Routing

**Program:** AI Architecture Phase 3  
**Date:** 2026-07-12  
**Status:** Active  
**Source of Truth for:** Root cause → `AICorrectionDestination`

---

## Principle

Given a root cause, determine **where correction belongs**. Routing does **not** auto-apply fixes, rewrite prompts in production, or copy knowledge globally.

Engine: `server/src/ai/intelligence/correctionRouting.ts`  
Store: `AICorrectionRoute`

---

## Destination map (examples)

| Root cause | Destinations |
|------------|--------------|
| Wrong calendar (SoR + hint) | `CALENDAR_MODULE` (+ `SOURCE_OF_RECORD_OWNER`) |
| Wrong memory | `MEMORY_REVIEW`, `PERSONAL_MEMORY` |
| Wrong retrieval | `KNOWLEDGE_ENGINE` |
| Wrong prompt | `PROMPT_POLICY` |
| Wrong tool | `TOOL_OWNER` |
| Wrong model / routing | `ROUTING_POLICY` |
| Wrong business data | `BUSINESS_ADMIN`, `SOURCE_OF_RECORD_OWNER` |
| Wrong personal memory | `PERSONAL_MEMORY`, `MEMORY_REVIEW` |
| Hallucination | `GROUNDING_POLICY`, `PROMPT_POLICY`, `OPERATOR_TRIAGE` |

Module overlays (`wrongCalendar`, etc.) add module destinations without replacing taxonomy routes.

---

## Status lifecycle

`OPEN` → `ROUTED` → `IN_PROGRESS` → `RESOLVED` | `DEFERRED` | `WONT_FIX`

---

## Non-goals

- No silent Twin mutation
- No global knowledge promotion from personal memory corrections
- No bypass of `AIActionExecution` for tool fixes
