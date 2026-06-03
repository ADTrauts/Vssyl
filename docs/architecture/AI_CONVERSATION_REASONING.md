# AI Conversation Reasoning Layer

**Status:** Implemented (June 2026)  
**Runtime path:** `server/src/ai/conversation/`  
**Wired in:** `DigitalLifeTwinCore` — immediately after query analysis and continuity update, before `generateLifeTwinResponse`.

## Purpose

Prevent premature generic answers when the user is still exploring or diagnosing a problem. The layer assesses conversation objective and understanding confidence **before** the provider call, then steers prompts (coaching mode) without adding a new model invocation.

## Objectives

| Objective | Typical signals |
|-----------|-----------------|
| `explore` | Uncertainty, emotional ambiguity, "can't tell", figuring out source |
| `diagnose` | "What if", work/boundary tension, root-cause framing |
| `decide` | "Should I", "which one", explicit choice between options |
| `plan` | Roadmap, step-by-step, implementation plan |
| `execute` | Create, schedule, send, imperative actions |
| `learn` | "What are strategies", how-to, explain, best practices |

## Output shape

```typescript
{
  conversationObjective: ConversationObjective;
  understandingConfidence: number; // 0–100
  missingInformation: string[];
  criticalUnknowns: string[];
  prematureSolutionRisk: 'low' | 'medium' | 'high';
  recommendedResponseAction:
    | 'ask_clarifying_question'
    | 'reflect_and_probe'
    | 'offer_framework'
    | 'provide_answer'
    | 'provide_plan';
  responseGuidance: string[];
}
```

## Coaching policy

When objective is `explore` or `diagnose` and confidence is low (or premature-solution risk is elevated):

- Do **not** inject recommendation richness / travel framing blocks.
- Inject `CONVERSATION REASONING (coaching mode)` instructions via `buildProviderUserPrompt`.
- Prefer 1–2 clarifying questions and a short reflection over advice lists.

Explicit strategy asks (`learn` / `plan` with high confidence) keep normal answer/framework behavior.

## Diagnostics

- Returned on twin response metadata: `metadata.conversationReasoning`
- Logged at `[AI_CONTEXT_ASSEMBLY]` with objective, confidence, risk, and action
- Stored on `query.context.conversationReasoning` for pipeline/debug replay
- Admin portal may display/tune later; **runtime logic stays in** `server/src/ai/conversation/`

## Modules

| File | Role |
|------|------|
| `conversationTypes.ts` | Types |
| `conversationObjective.ts` | Objective heuristics |
| `understandingConfidence.ts` | 0–100 score |
| `prematureSolutionGuard.ts` | Risk level |
| `coachingModePolicy.ts` | Action, guidance, prompt block |
| `conversationReasoningLayer.ts` | `runConversationReasoning()` entry |

## Tests

`server/src/ai/conversation/__tests__/conversationReasoningLayer.test.ts` — burnout exploration, task strategies, job boundary diagnosis.

## Related

- `server/src/ai/utils/queryIntent.ts` — shared conversation uncertainty/emotional patterns
- `server/src/ai/prompts/providerUserPrompt.ts` — coaching block + richness suppression
- `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md` — overall prompt assembly
