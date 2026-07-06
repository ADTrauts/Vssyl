# Teach Vssyl Phase 1 — Checklist

**Program:** Teach Vssyl Phase 1A / 1B  
**Date:** 2026-07-05  
**Authority:** [AI_KNOWLEDGE_CONSTITUTION.md v1](./AI_KNOWLEDGE_CONSTITUTION.md)

Use this checklist to gate Phase 1B UI work.

---

## Final questions (answered)

### 1. Can Phase 1 ship without adding backend **services**?

**Yes.** All logic fits in existing `ai.ts` routes, `userLearningSignalService`, and client orchestration. No new service class or microservice.

### 2. Can Phase 1 ship without schema changes?

**Yes.** `UserMemoryFact`, `UserAIContext`, `AILearningEvent`, and related fields are sufficient for personal Phase 1.

### 3. Can it ship using only existing APIs?

**Mostly yes.** Explicit teach (fact/preference/instruction) uses existing POST endpoints today. **Two gaps** need thin handler extensions on existing router (not new APIs domain):

- Create reviewable `correction` `AILearningEvent` from Improve Answer / thumbs + text  
- Optional: return `conversationHistoryId` from twin for `/api/ai/feedback`

### 4. What is the minimum code that must be written?

| Layer | Minimum code |
|-------|--------------|
| **Tests** | `correctionRouting.test.ts`, `teachFactRetrieval.integration.test.ts`, `teachAssembly.integration.test.ts`; extend `learningApplicationService.test.ts` |
| **Backend glue** | ~50–150 lines: correction event create; thumbs → `correction` not `behavioral_signal` when text provided |
| **Frontend client** | `web/src/api/teachVssyl.ts` — orchestrates existing APIs |
| **Frontend UI** | `TeachVssylModal.tsx`; hooks in `AIChatWorkspace`, `AIResponseExplainDrawer` |
| **Docs** | None beyond this sprint |

### 5. What code should absolutely NOT be written?

- New Prisma models or migrations  
- Knowledge Graph / vector store / unified knowledge table  
- New orchestration service or `KnowledgeEngine` class  
- `DigitalLifeTwinCore` rewrite  
- LLM fine-tuning pipeline  
- User-facing pipeline policy editor  
- Auto-copy module entities to memory  
- LLM-based classification service (v1)  

### 6. What order minimizes risk?

```
1. Eval tests (G1–G4) — prove store → retrieval → assembly
2. Backend glue — correction create, thumbs fix
3. API client teachVssyl.ts — no UI yet; manual/contract test
4. TeachVssylModal + chat integration
5. Explain drawer CTA
6. Polish + Knowledge Health indicators (optional Phase 1 tail)
```

**Rationale:** Tests first catch retrieval regressions before UI obscures failures. Glue before UI prevents building on broken thumbs path.

### 7. What order maximizes learning?

```
1. Backend glue + correction create — validate review → apply in staging
2. Eval tests captured from real correction fixtures
3. Internal dogfood modal (feature flag)
4. Expand to explain drawer + thumbs
5. Business paths Phase 2 after apply parity
6. Operator metrics Phase 3
```

**Rationale:** Exercising full review → apply → retrieve loop early informs EvalCase fixtures before broad UI.

---

## Phase 1A — Engineering gate

### Constitution compliance

- [ ] PR reviewed against [AI_KNOWLEDGE_PRINCIPLES.md](./AI_KNOWLEDGE_PRINCIPLES.md) checklist  
- [ ] No new stores (P2, A8)  
- [ ] Module redirect does not write memory (P1, D2)  
- [ ] Inference paths still review-gated (P4)  

### Eval gates (required)

- [ ] **G1** — POST fact → `MemoryRetrievalService` returns fact on probe query  
- [ ] **G2** — Assembled context includes taught content  
- [ ] **G3** — Classification routes: fact → memory, instruction → context, module → no write  
- [ ] **G4** — `learningApplicationService.applyApprovedEvent` on correction  

### Backend glue

- [ ] Thumbs + user text creates `eventType: correction`, `validated: false`  
- [ ] Explicit teach still auto-applies via existing POST endpoints  
- [ ] (Optional) Twin response includes `conversationHistoryId` for feedback API  

### No new services / schema

- [ ] Diff review confirms changes only in `routes/ai.ts`, services, tests, web  
- [ ] No new Prisma migration files  

---

## Phase 1B — UI gate (after 1A complete)

### Components

- [ ] `TeachVssylModal` with classification chips  
- [ ] Improve Answer + Teach Vssyl on assistant messages  
- [ ] Correct this in `AIResponseExplainDrawer`  
- [ ] Thumbs down opens Improve flow with text required  
- [ ] Module redirect dialog (no API write)  
- [ ] Confirmation + link to `/ai?tab=memory`  

### API client

- [ ] `teachVssyl.ts` routes per [TEACH_VSSYL_API_REUSE_MATRIX.md](./TEACH_VSSYL_API_REUSE_MATRIX.md)  
- [ ] Uses Next.js proxy `/api/*` only  
- [ ] Passes `sourceConversationId` when available  

### UX / Constitution

- [ ] No technical jargon in user copy (P13)  
- [ ] Business chip hidden unless admin in business chat  
- [ ] Document/SOP flow explains attach vs summary fact  

### Manual test script

- [ ] Teach preference → new twin turn references conciseness (manual verify + G1)  
- [ ] Teach fact → appears in Memory tab  
- [ ] Improve wrong answer → fact saved → repeat query improved  
- [ ] Module chip → redirect, no new memory row  
- [ ] Thumbs down + text → Learning tab pending → approve → fact in retrieval  

---

## Phase 2 deferrals (explicit)

- [ ] Business policy teach from chat (employee → admin queue with apply)  
- [ ] Business learning apply parity  
- [ ] Employee AI drawer Teach Vssyl  
- [ ] Thread-scoped temporary context  
- [ ] Knowledge Health dashboard  
- [ ] LLM eval harness  

---

## Sign-off

| Role | Phase 1A | Phase 1B |
|------|----------|----------|
| Engineering | Eval + glue merged | UI behind flag |
| Product | — | Copy + flows approved |
| Constitution | Principles checklist pass | P13 plain language |

**Phase 1B starts when all Phase 1A boxes checked.**

---

## Related documents

- [TEACH_VSSYL_PHASE_1_IMPLEMENTATION_PLAN.md](./TEACH_VSSYL_PHASE_1_IMPLEMENTATION_PLAN.md)
- [AI_KNOWLEDGE_EVAL_LOOP_SPEC.md](./AI_KNOWLEDGE_EVAL_LOOP_SPEC.md)
- [TEACH_VSSYL_UI_FLOW.md](./TEACH_VSSYL_UI_FLOW.md)
