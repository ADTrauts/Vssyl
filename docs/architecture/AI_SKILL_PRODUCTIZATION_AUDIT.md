# AI Skill Productization Audit (Phase 8B)

**Program:** AI Architecture Phase 8B  
**Date:** 2026-07-14  
**Status:** Active — legacy entry-point inventory and cutover disposition  
**Owner:** AI Platform / Architecture council  
**Source of Truth for:** Which product paths are Skill-canonical vs compatibility vs deferred  
**Companion:** [`AI_SKILL_PRODUCTIZATION.md`](./AI_SKILL_PRODUCTIZATION.md) · [`AI_SKILL_CANONICAL_EXECUTION_MODEL.md`](./AI_SKILL_CANONICAL_EXECUTION_MODEL.md) · [`AI_SKILL_CANDIDATE_AUDIT.md`](./AI_SKILL_CANDIDATE_AUDIT.md)

---

## Disposition key

| Disposition | Meaning |
|-------------|---------|
| **CANONICALIZED** | Product path calls `skillCanonicalEntry.ts` helpers → `executeSkill` → domain `*Implementation` |
| **COMPATIBILITY** | Thin wrapper retained; forwards to canonical Skill entry (no direct domain bypass in production) |
| **DEFERRED** | Remains a non-Skill domain path; not promoted in Phase 8B |
| **PARALLEL_API** | Governed Skill API (`/api/ai/skills`) — Phase 8 path; not a legacy module route |

Phase 8B scope: **three pilots only** — `notebook_page_summary`, `notebook_action_extraction`, `structured_document_extraction`. No new Skills, no AI Studio, no Model Router live cutover, no Twin rewrite.

---

## Canonical entry (single productization hub)

All three pilots converge on:

| File | Role |
|------|------|
| `server/src/ai/skills/skillCanonicalEntry.ts` | Product-facing helpers: `runNotebookPageSummarySkill`, `runNotebookActionExtractionSkill`, `runStructuredDocumentExtractionSkill` |
| `server/src/ai/skills/skillRunner.ts` | `executeSkill` — selection, plan, policy, observation, execution record, shadow routing |
| `server/src/ai/skills/skillImplementations.ts` | `impl.*.v1` adapters → domain `*Implementation` functions |

---

## Pilot 1: `notebook_page_summary`

| Entry point | Location | Disposition | Notes |
|-------------|----------|-------------|-------|
| `POST /api/notebook/pages/:pageId/ai/summary` | `server/src/routes/notebook.ts` → `notebookAIController.postPageSummary` | **CANONICALIZED** | Calls `runNotebookPageSummarySkill` |
| Notebook UI summarize | `web/src/components/notebook/NotebookAIPanel.tsx` → `web/src/api/notebookAI.ts` → module route above | **CANONICALIZED** (server-side) | Client unchanged; server owns Skill path |
| Twin notebook action `summarize_page` | `server/src/ai/core/ActionExecutor.ts` (`executeNotebookAction`) | **CANONICALIZED** | `runNotebookPageSummarySkill` with `businessId` from dashboard context |
| Twin tool `summarize_notebook_page` | `server/src/ai/tools/toolExecutor.ts` | **CANONICALIZED** | Same canonical helper |
| Service compat `summarizePage` | `server/src/services/notebook/notebookAIActionService.ts` | **COMPATIBILITY** | `@deprecated`; forwards to `runNotebookPageSummarySkill` |
| Domain impl `summarizePageImplementation` | `notebookAIActionService.ts` | **Domain layer** | Called only from `impl.notebook_page_summary.v1`; uses `skipShadowRouting: true` |
| Skill API execute | `POST /api/ai/skills/notebook_page_summary/execute` | **PARALLEL_API** | `routes/aiSkills.ts` → `executeSkill` |
| Operator overview | `GET /api/admin/ai/operations/skills/overview` | **Observe** | Durable quality + fingerprints |

---

## Pilot 2: `notebook_action_extraction`

| Entry point | Location | Disposition | Notes |
|-------------|----------|-------------|-------|
| `POST /api/notebook/pages/:pageId/ai/action-items` | `notebook.ts` → `postExtractActionItems` | **CANONICALIZED** | `runNotebookActionExtractionSkill`; optional `selectedText` |
| Notebook UI extract | `NotebookAIPanel.tsx` → `notebookAI.extractActionItems` | **CANONICALIZED** (server-side) | Propose-only; confirm is separate |
| Twin action `extract_action_items` | `ActionExecutor.ts` | **CANONICALIZED** | Canonical Skill helper |
| Twin tool `extract_notebook_action_items` | `toolExecutor.ts` | **CANONICALIZED** | Proposals returned; no task creation |
| Service compat `extractActionItems` | `notebookAIActionService.ts` | **COMPATIBILITY** | `@deprecated`; forwards to Skill entry |
| Domain impl `extractActionItemsImplementation` | `notebookAIActionService.ts` | **Domain layer** | `skipShadowRouting: true`; Skill runner owns shadow |
| Skill API execute | `POST /api/ai/skills/notebook_action_extraction/execute` | **PARALLEL_API** | Governed path |
| **Confirm proposals (write path)** | `POST .../action-items/confirm` → `confirmExtractedActionItems` | **DEFERRED** | Explicit user confirmation + `aiCreateTask`; never a Skill |
| Twin / tools for confirm | Not exposed as Skill or auto-tool | **DEFERRED** | By design — mutations require HTTP confirm |

---

## Pilot 3: `structured_document_extraction`

| Entry point | Location | Disposition | Notes |
|-------------|----------|-------------|-------|
| `POST /api/ai/extract-document` | `server/src/routes/ai.ts` | **CANONICALIZED** | File fetch + text assembly → `runStructuredDocumentExtractionSkill` |
| Service compat `extractInvoiceOrReceipt` | `server/src/services/documentExtractionService.ts` | **COMPATIBILITY** | When `userId` present and `preferSkill !== false`, forwards to Skill entry |
| Domain impl `extractInvoiceOrReceiptImplementation` | `documentExtractionService.ts` | **Domain layer** | Skill impl calls with `skipShadowRouting: true` |
| Skill API execute | `POST /api/ai/skills/structured_document_extraction/execute` | **PARALLEL_API** | Direct JSON input |
| Expense workflow follow-on | `POST /api/ai/create-expense-from-extraction` | **DEFERRED** | Uses extraction **result**; not a Skill execution path |

---

## Notebook paths explicitly deferred (non-Skill)

| Behavior | Entry | Location | Disposition | Rationale |
|----------|-------|----------|-------------|-----------|
| Meeting recap | `POST .../ai/meeting-recap` | `notebookAIController.postMeetingRecap` → `generateMeetingRecap` | **DEFERRED** | Overlaps summary intent; distinct contract not certified in 8B |
| Suggest links | `POST .../ai/suggest-links` | `postSuggestLinks` → `suggestLinks` | **DEFERRED** | Graph/link semantics; specialized adapter |
| Confirm action items | `POST .../action-items/confirm` | `confirmExtractedActionItems` | **DEFERRED** | Governed write + todo creation; approval boundary |
| Page AI context (read) | Twin `get_page_ai_context` | `ActionExecutor` → `loadGroundedAIContext` | **DEFERRED** | Context provider, not executable Skill |
| Notebook UI recap / links | `NotebookAIPanel.tsx` | `meetingRecap`, `suggestLinks` API clients | **DEFERRED** | Same as HTTP routes |

Instruction assets for `notebook_action_extraction` explicitly document: **never** call `confirmExtractedActionItems` from the Skill (`skillInstructionAssets.ts`).

---

## Other Skill-like behaviors (unchanged from Phase 8 candidate audit)

| Behavior | Location | Disposition | Notes |
|----------|----------|-------------|-------|
| Todo prioritization | `todoAIPrioritizationService` | **DEFERRED** | Not a Phase 8B pilot |
| Drive Ask AI | Drive UI → Twin | **DEFERRED** | Conversational workflow |
| Drive AI actions | `driveAIActionService` | **DEFERRED** | Twin tools |
| Module `/ai/context/*` | Various modules | **DEFERRED** | Context providers |
| Model Router live cutover | `selectLlmProvider` production path | **DEFERRED** | Shadow-only on Skill completion |
| AI Studio / customer Skills | — | **DEFERRED** | Not implemented |
| Industry Packs | `INDUSTRY_FUTURE` scope | **DEFERRED** | Inactive |

---

## Shadow routing and observation ownership

| Layer | Shadow routing | Observation / execution record |
|-------|----------------|----------------------------------|
| Skill runner (`executeSkill`) | **Yes** — `shadowRouteForSpecializedPath` on completion | **Yes** — `surface: 'SKILL'`, `emitSkillObservation`, `createAIExecutionRecord` |
| Domain `*Implementation` when called from Skill impl | **No** — `skipShadowRouting: true` | **No** — Skill owns durable trail |
| Domain paths (meeting recap, suggest links, confirm) | Per `runNotebookAICompletion` default | Module/domain observation only |
| Compat `extractInvoiceOrReceipt` without `userId` | Domain default (`skipShadowRouting: false`) | Test / legacy fallback only |

---

## Regression and integrity artifacts (Phase 8B)

| Artifact | Path |
|----------|------|
| Regression fixtures | `server/src/ai/skills/__fixtures__/*.regression.json` |
| Regression tests | `server/src/ai/skills/__tests__/skillsPhase8b.regression.test.ts` |
| Bundle fingerprints | `server/src/ai/skills/skillFingerprints.ts` — sealed at `registerBuiltInSkills` |
| Durable quality | `server/src/ai/skills/skillDurableQuality.ts` |

---

## Summary counts

| Disposition | Pilot-related entry points |
|-------------|---------------------------|
| **CANONICALIZED** | 7 (3 HTTP product routes + 2 Twin actions + 2 Twin tools + 1 `/api/ai/extract-document`) |
| **COMPATIBILITY** | 3 service wrappers (`summarizePage`, `extractActionItems`, `extractInvoiceOrReceipt`) |
| **PARALLEL_API** | 3 Skill execute endpoints |
| **DEFERRED** | 5+ notebook non-pilot behaviors + platform items above |

---

## Related documents

- Phase 8 framework: [`AI_SKILLS_ARCHITECTURE.md`](./AI_SKILLS_ARCHITECTURE.md) · [`AI_PHASE8_CLOSEOUT.md`](./AI_PHASE8_CLOSEOUT.md)  
- Phase 8B productization: [`AI_SKILL_PRODUCTIZATION.md`](./AI_SKILL_PRODUCTIZATION.md) · [`AI_SKILL_CANONICAL_EXECUTION_MODEL.md`](./AI_SKILL_CANONICAL_EXECUTION_MODEL.md) · [`AI_SKILL_QUALITY_MODEL.md`](./AI_SKILL_QUALITY_MODEL.md) · [`AI_PHASE8B_CLOSEOUT.md`](./AI_PHASE8B_CLOSEOUT.md)
