# AI Conversational Continuity and Rendering Source of Truth

## Purpose

This document is the canonical implementation and decision record for improving Vssyl AI chat quality from a structured diagnostic style to a conversational, continuity-aware assistant experience.

It defines:
- What must change
- What must not change
- How to implement changes in phases
- How to validate behavior and quality

If implementation details conflict with older AI planning docs, this file is authoritative for this initiative.

## Problem Statement

Current AI chat responses can expose internal orchestration metadata in normal user chat, including sections such as:
- Key insights
- Based on / context sources
- Assumptions
- Risks
- Recommended actions
- Confidence labels
- Internal routing hints

This creates a report-like experience instead of a natural, continuous conversation. The assistant can appear to "restart" each turn instead of carrying topic, intent, and tone forward.

## Target Outcome

Normal chat should feel like one ongoing conversation:
- Natural language answer first
- Prior context used implicitly, not announced
- Internal orchestration metadata hidden by default
- Attachment/file issues still visible when actionable for users
- Continuity state persisted and reused per thread
- Memory/context ranked by conversational relevance

## Non-Negotiables

1. Do not remove structured response generation.
2. Do not remove internal evidence/risk/action/confidence metadata.
3. Do not expose internal metadata in normal mode by default.
4. Preserve user-facing file attachment issues (`fileIssues`) in normal chat.
5. Keep module context providers and existing AI capability surfaces intact.

## Scope

### In Scope
- Backend AI response pipeline and prompt assembly
- Conversation continuity state lifecycle
- Context tiering and retrieval aggressiveness controls
- Response mode selection and behavior
- Frontend rendering defaults across all AI chat surfaces
- Tests for deterministic continuity/mode/topic/polishing logic

### Out of Scope
- Replacing provider stack
- Rewriting module AI context provider APIs
- Removing structured contracts used by admin/debug tooling
- Large UI redesign unrelated to response readability

## Canonical Design Decisions

### 1) Dual-layer response contract

The AI response contract is logically split into:
- `display`: conversational user-facing response text (primary)
- `orchestration`: internal metadata (structured fields, evidence, assumptions, risks, recommended actions, confidence, routing, context diagnostics)

Normal chat surfaces render only `display` + allowed user-facing items (`fileIssues`).
Debug/admin/developer surfaces may access `orchestration`.

### 2) Continuity state per conversation

Persist/update lightweight continuity metadata per thread:

```ts
ConversationContinuityState {
  currentTopic?: string;
  activeEntities?: string[];
  userGoal?: string;
  emotionalTone?: string;
  unresolvedQuestions?: string[];
  conversationMomentum?: string;
  lastUpdatedAt: string;
}
```

Rules:
- Bounded size and deterministic updates
- Updated each AI turn from latest user message + recent history
- Injected as private prompt context
- Never rendered directly in normal chat

### 3) Context/memory tiers

Prompt assembly prioritizes context tiers:
- Tier 1: active conversation recent messages
- Tier 2: continuity/topic session state
- Tier 3: persistent user profile/preferences/memories
- Tier 4: cross-module broad/archive context

Tier ordering must influence inclusion and budget decisions. Broad context must not drown conversational continuity.

### 4) Topic persistence

Maintain `activeTopic` metadata per conversation:
- topic label
- entities
- user goal
- confidence
- updatedAt

Detect whether a message continues current topic, shifts topic, or is ambiguous.
On shift: archive/replace active topic cleanly.

### 5) Post-generation natural-language polish

After provider output normalization, run a reusable polishing step that:
- removes internal scaffolding phrases
- preserves meaning and practical guidance
- keeps tone conversational and continuous
- avoids over-structuring unless user asks

### 6) Response modes

Supported response modes:
- conversational (default)
- analytical
- planning
- emotional_support
- debug
- executive_summary

Mode is inferred when not explicitly provided. Debug mode is the only mode that should expose internal metadata broadly to users.

### 7) Retrieval aggressiveness controls

Cross-module retrieval must use thresholds and reasons for inclusion. Internal logs must capture:
- context items considered
- context items injected
- top relevance scores
- inclusion rationale

High-stakes/module-specific/file-centric queries may bypass conservative thresholds where needed.

## Implementation Plan (Phased)

### Phase A: UI containment and rendering separation

Goals:
- Render natural response text in normal chat UI
- Hide structured metadata by default
- Keep `fileIssues` visible
- Add debug/collapsible details only where appropriate

Primary targets:
- `web/src/components/ai/AIResponseRenderer.tsx`
- `web/src/app/ai-chat/page.tsx`
- `web/src/components/header/AIChatDropdown.tsx`
- `web/src/components/ai/AIChatModule.tsx`
- shared chat message renderers/handlers as needed

Acceptance:
- No inline "Key insights / Based on / Assumptions / Risks / Recommended actions / confidence" in normal mode.
- `fileIssues` still visible.

### Phase B: Continuity state + topic persistence

Goals:
- Add/update continuity state each turn
- Add active topic detection and persistence
- Inject both as private prompt context

Primary targets:
- `server/src/ai/core/DigitalLifeTwinCore.ts`
- conversation models/controllers/services where metadata persists
- utility module(s) for continuity/topic update logic
- tests for continuity/topic transitions

Acceptance:
- Follow-up turns leverage prior topic/goal/entities without explicit user restatement.
- No continuity internals shown in normal chat output.

### Phase C: Tiered context assembly + retrieval aggressiveness

Goals:
- Enforce tier-aware ranking
- Prioritize Tier 1/2 over Tier 4 unless relevance warrants expansion
- Record internal tier metadata and inclusion reasons

Primary targets:
- `server/src/ai/context/AIContextAssembler.ts`
- `server/src/ai/context/CrossModuleContextEngine.ts`
- related retrieval/ranking utilities

Acceptance:
- Broad module context is no longer over-injected for simple conversational follow-ups.
- Internal logs report considered/injected counts and reasons.

### Phase D: Natural-language polish + response modes

Goals:
- Add reusable response polishing function/service
- Add/infer response modes through request pipeline
- Restrict metadata visibility to debug mode

Primary targets:
- `server/src/ai/utils/normalizeAIResponse.ts`
- `server/src/ai/utils/validateAIResponseQuality.ts` (if needed for mode-aware checks)
- `server/src/ai/core/DigitalLifeTwinCore.ts`
- provider handling/request typing files
- frontend callers passing mode context where needed

Acceptance:
- Conversational mode responses are natural and direct.
- Analytical/planning modes are available when asked.
- Debug mode can show internals without affecting default UX.

## Data Model Guidance

Before schema additions:
1. Reuse existing conversation/message metadata JSON fields if sufficient.
2. Only add smallest Prisma change if existing storage cannot safely persist continuity/topic state.
3. Keep payload bounded and prune stale arrays.

If schema addition is needed:
- add one small JSON field on conversation-level record preferred over message-level duplication.
- include migration and backward-safe defaults.

## Validation and Quality Gates

Required checks after implementation batches:
- `pnpm lint`
- `pnpm type-check`
- targeted tests for new continuity/topic/mode/polish utilities

Recommended deterministic tests:
- continuity state update from recent messages
- topic continues vs shifts vs ambiguous
- mode inference:
  - "which one feels more relaxing?" => conversational
  - "break this down" => analytical
  - "give me next steps" => planning
  - "why did the AI answer this way?" => debug
- polish transforms internal phrasing into conversational output

## Behavior Examples (Expected)

### Travel continuity example

Turn 1:
- User: "I like Charleston but I'm also intrigued by Cancun."

Turn 2:
- User: "Which one feels more relaxing?"

Expected conversational response pattern:
- AI continues comparison without re-explaining retrieval mechanics.
- AI references prior context naturally ("Given what you've said about wanting to decompress...").
- No inline diagnostics like assumptions/risks/evidence labels in normal mode.

### Debug mode behavior

When debug mode is explicitly enabled:
- conversational answer still present
- internal details available in collapsed or separate debug details surface

## Rollout and Safety

1. Ship rendering changes first behind safe defaults (normal users see cleaner output immediately).
2. Introduce continuity/topic/tiering as additive backend changes.
3. Enable mode-aware/debug metadata exposure only for privileged/admin/debug contexts.
4. Monitor response quality and retrieval metrics before widening behavior changes.

## Definition of Done

This initiative is complete when:
1. Normal chat across AI surfaces defaults to conversational output without internal scaffolding.
2. `fileIssues` remains visible and clear in normal chat.
3. Continuity/topic state is persisted and reused per conversation.
4. Context assembly is tiered and relevance-thresholded with internal observability.
5. Post-generation polishing reduces robotic/system-language leakage.
6. Response modes are implemented and correctly inferred by intent.
7. Lint/type checks pass and deterministic tests for core logic are added.

## Ownership

- Primary area: AI Platform (backend + frontend AI UX)
- Canonical reference for execution: this file
- Related references:
  - `memory-bank/aiContextSystem.md`
  - `memory-bank/activeContext.md`
  - `memory-bank/progress.md`
