# Teach Vssyl Phase 1 — Implementation Plan

**Program:** Teach Vssyl — Phase 1A Implementation Readiness Validation  
**Date:** 2026-07-05  
**Authority:** [AI_KNOWLEDGE_CONSTITUTION.md v1](./AI_KNOWLEDGE_CONSTITUTION.md), Phase 0B specs  
**Status:** Readiness validation — **no implementation in this sprint**

---

## Executive verdict

**Yes — Teach Vssyl Phase 1 (personal scope) can ship by orchestrating existing architecture**, with **small, localized backend glue** (not new services, not schema changes).

Phase 1 is **primarily UI orchestration** over existing APIs, plus:

1. **~100–200 lines** of route/handler adjustments on `server/src/routes/ai.ts` and/or `userLearningSignalService.ts`
2. **New frontend** modal flow + API client helpers (no new backend service)
3. **New integration tests** (EvalCases G1–G4) — required gate before UI rollout

**No architectural blocker** remains for personal Phase 1. Business-heavy journeys are **Phase 2** (known apply gap).

---

## Canonical Improve Answer trace (validated)

```
Improve Answer (UI — not built)
        ↓
Classification (client rules + chips — not built)
        ↓
Existing API (see matrix)
        ↓
Existing store (UserMemoryFact | UserAIContext | AILearningEvent)
        ↓
Retrieval (MemoryRetrievalService | PreferenceResolver | twin context load)
        ↓
Next-turn influence (AIContextAssembler blocks | responseInfluence)
        ↓
Evaluation (tests — not built for teach loop)
```

### Step-by-step inventory

| Step | Existing | Missing glue |
|------|----------|--------------|
| **Improve Answer UI** | Explain drawer (`AIResponseExplainDrawer`), Memory tab CRUD | Modal, chips, chat actions |
| **Classification** | Rule hints in `memoryFactTypes.inferMemoryFactCategory`, Phase 0B routing spec | Client classifier module |
| **API call** | `POST /api/ai/memory/facts`, `POST /api/ai/user-context`, `POST /api/ai/teach`, `PUT /api/ai/learning/events/:id/review` | Correction **create** for review queue; thumbs → reviewable event |
| **Store** | `UserMemoryFact`, `UserAIContext`, `AILearningEvent` | None (schema sufficient) |
| **Retrieval** | `MemoryRetrievalService.retrieve`, `DigitalLifeTwinService` loads facts, `PreferenceResolver`, twin loads active context | None |
| **Next-turn influence** | `memoryContextInjection`, assembler blocks, `buildResponseInfluence` | None |
| **Evaluation** | `memoryRetrieval.test.ts`, `learningApplicationService.test.ts` | **Teach-loop integration tests (G1–G4)** |

---

## Phase 1 scope (confirmed)

Per Constitution and Phase 0B — **personal chat only**:

| In scope | Out of scope (Phase 2+) |
|----------|-------------------------|
| Teach fact, preference, instruction | Business admin policy editor UX |
| Improve Answer / thumbs-down | Business learning apply parity |
| Correct this in explain drawer | Document full-text memory |
| Module redirect (no store write) | Thread-only temporary context |
| Eval gates before UI | Operator correction metrics |

---

## Implementation phases

### Phase 1A — Engineering gate (before UI)

| # | Work | Files (expected) | Est. size |
|---|------|------------------|-----------|
| 1 | Correction routing unit tests | `server/src/ai/knowledge/__tests__/correctionRouting.test.ts` | New |
| 2 | Teach → retrieval integration test (G1) | `server/src/ai/knowledge/__tests__/teachFactRetrieval.integration.test.ts` | New |
| 3 | Assembly assertion test (G2) | `server/src/ai/knowledge/__tests__/teachAssembly.integration.test.ts` | New |
| 4 | Extend thumbs/feedback → reviewable `correction` event | `server/src/routes/ai.ts` or `userLearningSignalService.ts` | Small |
| 5 | Optional: `POST /api/ai/learning/corrections` on existing router | `server/src/routes/ai.ts` | Small — orchestrates event create, not new service |
| 6 | Return `conversationHistoryId` in twin metadata (feedback API) | `server/src/routes/ai.ts` `saveTwinQueryHistory` + response | Small |

### Phase 1B — Product UI (after gates pass)

| # | Work | Files (expected) |
|---|------|------------------|
| 7 | `TeachVssylModal` + classification chips | `web/src/components/ai/TeachVssylModal.tsx` |
| 8 | Chat message actions (Improve Answer, Teach) | `web/src/components/ai/AIChatWorkspace.tsx` |
| 9 | Explain drawer CTA | `web/src/components/ai/AIResponseExplainDrawer.tsx` |
| 10 | API client: `teachVssyl.ts` orchestrating existing endpoints | `web/src/api/teachVssyl.ts` |
| 11 | Confirmation toast + link to Memory/Learning | Chat + `/ai` |

---

## Journey summary (7 validated)

| # | Journey | Phase 1 | Backend ready? | UI only? |
|---|---------|---------|----------------|----------|
| 1 | Personal fact / preference | ✅ In scope | ✅ Yes | Mostly UI |
| 2 | Business policy | ⏸ Phase 2 | ⚠️ Partial | No — admin UX + apply gap |
| 3 | Vocabulary | ✅ In scope | ✅ Yes | UI + classifier |
| 4 | Hallucination correction | ✅ In scope | ⚠️ Glue needed | UI + correction create API |
| 5 | Document / SOP | ⏸ Redirect | ✅ Live fetch exists | UX copy + redirect; optional summary fact |
| 6 | Module entity (task priority) | ⏸ Redirect | ✅ N/A (constitutional) | UI redirect only |
| 7 | Thumbs-down loop | ✅ In scope | ⚠️ Glue needed | UI + signal/event fix + tests |

Detail: [TEACH_VSSYL_RISK_ASSESSMENT.md](./TEACH_VSSYL_RISK_ASSESSMENT.md), [TEACH_VSSYL_API_REUSE_MATRIX.md](./TEACH_VSSYL_API_REUSE_MATRIX.md).

---

## Challenge to Phase 0B recommendations

| Phase 0B recommendation | Validation result |
|-------------------------|-------------------|
| Reuse existing APIs | ✅ Confirmed — no new stores |
| Personal scope first | ✅ Correct — business has apply gap |
| Thumbs → reviewable event | ⚠️ **Requires glue** — today creates `behavioral_signal` only |
| No new routes required | ⚠️ **Revise slightly** — correction create may need one handler on existing `ai.ts` router |
| Eval before UI | ✅ Still mandatory — tests do not exist yet |
| Business apply parity Phase 3 | ✅ Still correct |

---

## Success gate

Implementation of Phase 1B UI **begins only when**:

- [ ] G1–G4 eval tests pass in CI  
- [ ] Correction routing glue merged  
- [ ] Constitution PR checklist satisfied ([AI_KNOWLEDGE_PRINCIPLES.md](./AI_KNOWLEDGE_PRINCIPLES.md))

---

## Related documents

- [TEACH_VSSYL_API_REUSE_MATRIX.md](./TEACH_VSSYL_API_REUSE_MATRIX.md)
- [TEACH_VSSYL_UI_FLOW.md](./TEACH_VSSYL_UI_FLOW.md)
- [TEACH_VSSYL_RISK_ASSESSMENT.md](./TEACH_VSSYL_RISK_ASSESSMENT.md)
- [TEACH_VSSYL_PHASE_1_CHECKLIST.md](./TEACH_VSSYL_PHASE_1_CHECKLIST.md)
