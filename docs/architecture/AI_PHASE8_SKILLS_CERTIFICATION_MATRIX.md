# AI Phase 8 Skills Certification Matrix

**Program:** AI Architecture Phase 8  
**Date:** 2026-07-13  
**Status:** Active  
**Source of Truth for:** Skills Framework requirement certification statuses  
**Companion:** [`AI_SKILL_CERTIFICATION_STANDARD.md`](./AI_SKILL_CERTIFICATION_STANDARD.md) · [`AI_PHASE8_CLOSEOUT.md`](./AI_PHASE8_CLOSEOUT.md)

Status key: **CERTIFIED** · **CERTIFIED_WITH_LIMITATION** · **NOT_CERTIFIED** · **DEFERRED_NONCRITICAL**

---

## Framework requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| F1 | `AISkillDefinition` contract in shared types | **CERTIFIED** | `shared/src/types/ai-skills.ts` |
| F2 | Code-first registry (no DB executables) | **CERTIFIED** | `skillRegistry.ts` |
| F3 | Lifecycle status machine | **CERTIFIED** | `skillLifecycle.ts` + tests |
| F4 | Conservative skill selection | **CERTIFIED** | Explicit key authoritative |
| F5 | Pure execution planner | **CERTIFIED** | Input validation + size bound |
| F6 | Governed runner boundary | **CERTIFIED** | Not Twin; dedicated path |
| F7 | Implementation registry | **CERTIFIED** | `skillImplementations.ts` |
| F8 | Instruction assets (operator) | **CERTIFIED** | `skillInstructionAssets.ts` |
| F9 | Skill observation events | **CERTIFIED** | `surface: SKILL` |
| F10 | Execution records `surface: SKILL` | **CERTIFIED** | Non-blocking persist |
| F11 | Output schema validation | **CERTIFIED** | `skillOutputValidation.ts` |
| F12 | Secret leak detection | **CERTIFIED** | `detectSecretLeak` |
| F13 | In-process metrics ring | **CERTIFIED_WITH_LIMITATION** | 500-sample ring; not durable warehouse |
| F14 | Customer API `/api/ai/skills` | **CERTIFIED** | JWT + visibility gates |
| F15 | Operator API skills endpoints | **CERTIFIED** | Observe-only |
| F16 | Pipeline UI Skills page | **CERTIFIED** | `/admin-portal/ai-pipeline/skills` |
| F17 | Phase 8 automated tests | **CERTIFIED** | `skillsPhase8.test.ts` |
| F18 | Shadow Model Router on Skills | **CERTIFIED_WITH_LIMITATION** | Observe-only; production unchanged |
| F19 | Intent-only public execute API | **NOT_CERTIFIED** | By design — requires `:key` |
| F20 | Customer-created Skills | **NOT_CERTIFIED** | By design — disabled |
| F21 | Industry Packs scope | **NOT_CERTIFIED** | `INDUSTRY_FUTURE` inactive |
| F22 | AI Studio | **NOT_CERTIFIED** | Not implemented |
| F23 | Prisma skill executable tables | **NOT_CERTIFIED** | Not implemented |
| F24 | Operator lifecycle mutation API | **DEFERRED_NONCRITICAL** | Status changes via code deploy |
| F25 | Durable skill metrics warehouse | **DEFERRED_NONCRITICAL** | Ring buffer only |
| F26 | Auto-migration from legacy routes | **NOT_CERTIFIED** | Explicitly excluded |
| F27 | Tool mutation rounds in framework | **DEFERRED_NONCRITICAL** | Reserved; pilots mutate-off |
| F28 | Intent auto-select without clarification | **NOT_CERTIFIED** | Ambiguous intent fails closed |

---

## Pilot Skill requirements

### `notebook_page_summary@1.0.0`

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| P1-1 | Definition complete + ACTIVE | **CERTIFIED** | |
| P1-2 | Wraps `summarizePage` with auth | **CERTIFIED** | |
| P1-3 | Read-only / no tools | **CERTIFIED** | `maxToolRounds: 0` |
| P1-4 | Input/output schema enforced | **CERTIFIED** | |
| P1-5 | Grounding + citations | **CERTIFIED** | `refuseWhenUngrounded` |
| P1-6 | Customer visible + API execute | **CERTIFIED** | |
| P1-7 | Legacy route retirement | **DEFERRED_NONCRITICAL** | Dual-path intentional |
| P1-8 | Module UI wired to Skill API | **DEFERRED_NONCRITICAL** | Legacy route still default |

### `notebook_action_extraction@1.0.0`

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| P2-1 | Definition complete + ACTIVE | **CERTIFIED** | |
| P2-2 | Wraps `extractActionItems` only | **CERTIFIED** | Confirm path excluded |
| P2-3 | Prohibited mutating tools declared | **CERTIFIED** | `todo.create`, confirm tool |
| P2-4 | Propose-only output schema | **CERTIFIED** | |
| P2-5 | Customer visible + API execute | **CERTIFIED** | |
| P2-6 | Todo create via Skill | **NOT_CERTIFIED** | By design |

### `structured_document_extraction@1.0.0`

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| P3-1 | Definition complete + ACTIVE | **CERTIFIED** | |
| P3-2 | Wraps `extractInvoiceOrReceipt` | **CERTIFIED** | |
| P3-3 | invoice/receipt enum enforced | **CERTIFIED** | Input schema |
| P3-4 | No Drive file resolution in Skill | **CERTIFIED_WITH_LIMITATION** | Text-in only; file path deferred |
| P3-5 | Customer visible + API execute | **CERTIFIED** | |
| P3-6 | Additional document types | **DEFERRED_NONCRITICAL** | Future versions |

---

## Cross-cutting security requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| S1 | JWT on customer API | **CERTIFIED** | |
| S2 | Operator RBAC | **CERTIFIED** | `operations:read` |
| S3 | Tenant scope via module adapters | **CERTIFIED** | Inherited from services |
| S4 | Input size bound | **CERTIFIED** | 200k chars |
| S5 | `minNecessary` context enforcement | **CERTIFIED** | Runner assert |
| S6 | Customer API hides internal fields | **CERTIFIED** | Subset response |
| S7 | Rate limiting on Skill execute | **DEFERRED_NONCRITICAL** | Use platform limits if present |

---

## Observation & intelligence requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| O1 | Full Skill event timeline | **CERTIFIED** | Selection through completion |
| O2 | Execution record diagnostics | **CERTIFIED** | skillKey, version, profile id |
| O3 | Operator evaluation workflow for Skills | **CERTIFIED_WITH_LIMITATION** | Uses existing execution record search |
| O4 | Skill-specific regression library | **DEFERRED_NONCRITICAL** | Generic regression cases apply |

---

## Summary counts

| Status | Framework | Pilots (combined) |
|--------|-----------|-------------------|
| CERTIFIED | 17 | 15 |
| CERTIFIED_WITH_LIMITATION | 2 | 1 |
| NOT_CERTIFIED | 6 | 1 |
| DEFERRED_NONCRITICAL | 3 | 4 |

---

## Related

- [`AI_SKILL_PILOT_CATALOG.md`](./AI_SKILL_PILOT_CATALOG.md)  
- [`AI_SKILL_CANDIDATE_AUDIT.md`](./AI_SKILL_CANDIDATE_AUDIT.md)  
- [`AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md`](./AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md)
