# AI Skill Productization (Phase 8B)

**Program:** AI Architecture Phase 8B  
**Date:** 2026-07-14  
**Status:** Active  
**Owner:** AI Platform / Architecture council  
**Source of Truth for:** How three pilot Skills became canonical product paths  
**Companion:** [`AI_SKILL_PRODUCTIZATION_AUDIT.md`](./AI_SKILL_PRODUCTIZATION_AUDIT.md) · [`AI_SKILL_CANONICAL_EXECUTION_MODEL.md`](./AI_SKILL_CANONICAL_EXECUTION_MODEL.md) · [`AI_PHASE8B_CLOSEOUT.md`](./AI_PHASE8B_CLOSEOUT.md)

---

## What Phase 8B delivered

Phase 8 introduced the Skills **framework** (registry, runner, contract, parallel `/api/ai/skills` API). Phase 8B **productizes** three pilots so existing product surfaces route through governed Skill execution instead of calling domain LLM helpers directly.

| Pilot Skill | Version | Product meaning |
|-------------|---------|-----------------|
| `notebook_page_summary` | 1.0.0 | Grounded page summary (decisions, tasks, risks) |
| `notebook_action_extraction` | 1.0.0 | Propose-only action items from page content |
| `structured_document_extraction` | 1.0.0 | Invoice/receipt JSON extraction from document text |

All three remain **ACTIVE**, code-first, and registered at startup via `server/src/ai/skills/registerBuiltInSkills.ts`.

---

## Productization pattern

```text
Product surface (HTTP / Twin / tool)
        │
        ▼
skillCanonicalEntry.ts   ← Phase 8B canonical hub
        │
        ▼
executeSkill (skillRunner.ts)
        │
        ▼
skillImplementations.ts  (impl.*.v1)
        │
        ▼
Domain *Implementation    ← LLM + grounding; skipShadowRouting when Skill owns observation
```

**Key rule:** Product code calls **canonical entry helpers** or **compatibility wrappers** that forward to them. Domain `*Implementation` functions are for the Skill adapter layer only — not for new product call sites.

---

## Canonical entry helpers

File: `server/src/ai/skills/skillCanonicalEntry.ts`

| Helper | Skill key | Typical callers |
|--------|-----------|-----------------|
| `runNotebookPageSummarySkill` | `notebook_page_summary` | Notebook controller, ActionExecutor, toolExecutor |
| `runNotebookActionExtractionSkill` | `notebook_action_extraction` | Notebook controller, ActionExecutor, toolExecutor |
| `runStructuredDocumentExtractionSkill` | `structured_document_extraction` | `/api/ai/extract-document`, `extractInvoiceOrReceipt` compat |

Each helper maps Skill output to existing DTO shapes (`NotebookPageSummaryResult`, `NotebookExtractActionItemsResult`, `InvoiceExtraction`) so **clients did not require URL or schema changes**.

---

## Domain implementations (Skill-owned)

| Implementation key | Domain function | File |
|--------------------|-----------------|------|
| `impl.notebook_page_summary.v1` | `summarizePageImplementation` | `server/src/services/notebook/notebookAIActionService.ts` |
| `impl.notebook_action_extraction.v1` | `extractActionItemsImplementation` | same |
| `impl.structured_document_extraction.v1` | `extractInvoiceOrReceiptImplementation` | `server/src/services/documentExtractionService.ts` |

Domain completions use `skipShadowRouting: true` when invoked from Skill implementations so **observation, execution records, and Model Router shadow** are emitted once at the Skill runner boundary.

---

## Compatibility wrappers (deprecated, retained)

| Wrapper | Forwards to | Purpose |
|---------|-------------|---------|
| `summarizePage` | `runNotebookPageSummarySkill` | Legacy service imports / gradual migration |
| `extractActionItems` | `runNotebookActionExtractionSkill` | Same |
| `extractInvoiceOrReceipt` | `runStructuredDocumentExtractionSkill` when `userId` set | Callers that predate Skill entry |

New code should import from `skillCanonicalEntry.ts` directly.

---

## What stayed non-Skill

Phase 8B intentionally **did not** promote:

- `confirmExtractedActionItems` — governed write path (todo creation)
- `generateMeetingRecap` — separate product behavior
- `suggestLinks` — link-graph specialized adapter
- Twin conversational runtime — no rewrite
- Model Router **live** cutover — shadow remains observe-only
- AI Studio, customer-created Skills, Industry Packs

See [`AI_SKILL_PRODUCTIZATION_AUDIT.md`](./AI_SKILL_PRODUCTIZATION_AUDIT.md) for the full entry-point matrix.

---

## Operator and quality surfaces

| Surface | Path | Phase 8B addition |
|---------|------|-------------------|
| Pipeline Skills page | `web/src/app/admin-portal/ai-pipeline/skills/page.tsx` | Durable quality columns, `canonicalProductization: true` |
| Admin skills overview | `GET /api/admin/ai/operations/skills/overview` | `durableQuality`, `fingerprints` |
| Admin skill detail | `GET /api/admin/ai/operations/skills/:key` | Per-skill durable quality + fingerprint integrity |
| Customer Skill API | `/api/ai/skills/*` | Unchanged from Phase 8; parallel product path |

Durable quality reads Phase 3 intelligence stores — see [`AI_SKILL_QUALITY_MODEL.md`](./AI_SKILL_QUALITY_MODEL.md).

---

## Certification and regression

| Mechanism | Location |
|-----------|----------|
| Pilot definitions | `server/src/ai/skills/pilotSkillDefinitions.ts` |
| Instruction assets | `server/src/ai/skills/skillInstructionAssets.ts` |
| Bundle fingerprints | `server/src/ai/skills/skillFingerprints.ts` — sealed on startup |
| Regression fixtures | `server/src/ai/skills/__fixtures__/*.regression.json` |
| Tests | `skillsPhase8.test.ts` (framework) · `skillsPhase8b.regression.test.ts` (productization) |

Fingerprints detect certified Skill bundle changes without a version bump. Startup fails if integrity check fails (`registerBuiltInSkills`).

---

## Relationship to Phase 8

| Phase 8 | Phase 8B |
|---------|----------|
| Skills framework + parallel API | Product routes wired to Skill runner |
| Dual-path (legacy + Skill API) | Legacy **server** paths now Skill-canonical; URLs unchanged |
| In-process metrics ring buffer | + durable quality from DB intelligence |
| Candidate audit | Productization audit with disposition per entry point |

---

## Related documents

- Execution flow: [`AI_SKILL_CANONICAL_EXECUTION_MODEL.md`](./AI_SKILL_CANONICAL_EXECUTION_MODEL.md)  
- Quality model: [`AI_SKILL_QUALITY_MODEL.md`](./AI_SKILL_QUALITY_MODEL.md)  
- Closeout: [`AI_PHASE8B_CLOSEOUT.md`](./AI_PHASE8B_CLOSEOUT.md)  
- Phase 8 baseline: [`AI_SKILLS_ARCHITECTURE.md`](./AI_SKILLS_ARCHITECTURE.md) · [`AI_PHASE8_CLOSEOUT.md`](./AI_PHASE8_CLOSEOUT.md)
