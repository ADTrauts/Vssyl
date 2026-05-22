# AI Platform Maturity Plan

**Date:** May 2026  
**Status:** Proposed — awaiting approval before implementation  
**Scope:** Memory → Learning Engine → Cross-Module Intelligence → Platform Extensibility  
**Product constraint:** **Autonomy is de-emphasized.** Do not ship proactive autonomous execution. Treat dormant autonomy infrastructure as future scaffolding only.

**Related (canonical, do not duplicate):**

| Topic | Source |
|-------|--------|
| Twin prompt pipeline | `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md` |
| Context & recall architecture | `memory-bank/AI_CONTEXT_MEMORY_ARCHITECTURE.md` |
| Module AI context contract | `memory-bank/aiContextSystem.md` |
| Admin pipeline diagnostics | `docs/architecture/AI_PIPELINE_ADMIN_TOOLS.md` |
| Attachment & vision | `docs/ai/ARCHITECTURE.md`, `docs/ai/PROVIDERS.md`, `docs/ai/GOLDEN_RULES.md` |
| Domain events | `docs/architecture/DOMAIN_EVENTS.md` |
| Prior AI platform phases (image gen, tools, streaming) | `memory-bank/AI_PLATFORM_PHASED_PLAN.md` — **complete, different scope** |
| **Execution philosophy (how we build)** | [`AI_PLATFORM_EXECUTION_PRINCIPLES.md`](./AI_PLATFORM_EXECUTION_PRINCIPLES.md) — **required reading before implementation** |
| Superseded memories UI plan | `docs/plans/AI_MEMORIES_VIEW_PLAN.md` — **historical only** |

---

## How to use this plan

0. Read **[`AI_PLATFORM_EXECUTION_PRINCIPLES.md`](./AI_PLATFORM_EXECUTION_PRINCIPLES.md)** — governs *how* each subphase is implemented (Visible Intelligence > Hidden Intelligence).
1. Work **one subphase at a time** (1A → 1B → …). Do not start Phase 2 until Phase 1 acceptance criteria pass.
2. Each subphase lists **likely files**, **migrations**, and **acceptance criteria** sized for Cursor execution.
3. Preserve existing architecture: twin path, provider routing, vision, module registry, cookie/session auth, Next.js API proxy.
4. **No proactive autonomous execution** in any phase. Suggestions and approval-required actions only.

---

## 1. Current-state audit

### 1.1 What exists and is wired (LIVE)

| Area | What works end-to-end | Key paths |
|------|----------------------|-----------|
| **Twin chat pipeline** | `POST /api/ai/twin` → Service → Core → provider; structured response v2; streaming | `server/src/routes/ai.ts`, `DigitalLifeTwinService.ts`, `DigitalLifeTwinCore.ts` |
| **Provider routing** | OpenAI / Anthropic / Local; vision model selection; 429 fallback | `server/src/ai/providers/*`, `capabilities.ts` |
| **Attachments & vision** | GCS fetch, summaries, vision parts, fileIssues | `fileAnalysisService.ts`, `DigitalLifeTwinCore.ts` |
| **Preference resolution** | Questionnaire, autonomy *boundaries* (prompt-only), active `UserAIContext`, memory facts → prompt | `PreferenceResolver.ts`, `AIContextAssembler.ts` |
| **Cross-session recall** | Thread summaries, semantic recall index, recall intent/scoring | `aiMessageRecallService.ts`, `recallIntent.ts`, `recallScoring.ts` |
| **UserMemoryFact (partial)** | CRUD API, twin injection, remember-that heuristic, assembler block | `userMemoryFactService.ts`, `AIMemoriesView.tsx` |
| **Learning promote loop (partial)** | Chat fact extraction → pending `UserAIContext` → user promotes → resolver | `factExtractionService.ts`, `userAIContextLearningService.ts`, `AILearningHub` |
| **Smart patterns** | `SmartPatternEngine` + patterns UI | `SmartPatternInsights.tsx`, `server/src/routes/ai-patterns.ts` |
| **Module context providers** | 9 built-in modules registered; Layer 1 query analysis + Layer 2 HTTP fetch | `registerBuiltInModules.ts`, `ModuleAIContextService.ts` |
| **Context assembly** | Tiered blocks, profile gating (conversation vs enterprise), rank + token budget | `AIContextAssembler.ts`, `contextProfile.ts` |
| **Pipeline diagnostics (admin)** | Trace, evidence bundle, enforcement, registry | `buildPipelineTrace.ts`, admin AI Pipeline console |
| **Identity UX** | Influence stack, response explain drawer, memory tab | `web/src/app/ai/page.tsx`, `buildResponseInfluence.ts` |
| **Tool calling (chat)** | Built-in tools in twin loop (drive share, todos, etc.) | `DigitalLifeTwinCore.ts`, `ActionExecutor.ts` |
| **Domain events (foundation)** | Bus, registry, partial adoption (drive, module install, business member) | `server/src/events/*` |

### 1.2 What exists but is thin or stubbed (THIN)

| Area | Gap | Key paths |
|------|-----|-----------|
| **Memory tenancy** | `businessId` not filtered in relevance queries; `dashboardId`/`household` scope unused | `userMemoryFactService.ts`, `PreferenceResolver.ts` |
| **Memory retrieval** | Non-recall chats only get facts via keyword overlap; duplicate loads (Service + Resolver) | `getRelevantUserMemoryFacts`, `PreferenceResolver.ts` |
| **Memory UX** | No edit; no provenance/confidence in cards; effective-prefs preview split to Identity tab | `AIMemoriesView.tsx` |
| **Memory expiry** | `expiresAt` in list API but not in resolver query | `PreferenceResolver.ts` |
| **Learning events** | `AILearningEvent` write-heavy; read path broken (`patternData` vs `newBehavior` mismatch) | `AdvancedLearningEngine.ts` |
| **Learning review UI** | `PersonalLearningEventsReview` validates flags only; does not promote to identity | `PersonalLearningEventsReview.tsx` |
| **Learning dashboard** | Fallback fake metrics on API failure | `LearningDashboard.tsx` |
| **Personality auto-learn** | Writes flat keys resolver does not read | `AdvancedLearningEngine.ts` vs `PreferenceResolver.ts` |
| **Cross-module context** | Only `high` relevance modules fetched; one provider per module; module-level cache overwrite | `CrossModuleContextEngine.ts`, `ModuleAIContextService.ts` |
| **Cross-module synthesis** | Keyword heuristics + synthetic placeholder insights | `CrossModuleContextEngine.ts`, `DigitalLifeTwinCore.identifyCrossModuleConnections` |
| **Context debug route** | Raw Prisma dumps; not aligned with live assembler | `server/src/routes/ai-context-debug.ts` |
| **Collective learning** | Consent off by default; aggregation logic weak; enterprise-only prompt block | `CentralizedLearningEngine.ts` |
| **Action executor registry** | Infrastructure only; test modules | `ActionExecutorRegistry.ts` |
| **Autonomy execution** | Settings affect prompts; execution stack is mock/stub | `AutonomyManager.ts`, `AutonomousActionExecutor.ts`, `ai-autonomy.ts` |

### 1.3 Aspirational — do not market as live

| Capability | Reality | Safe posture |
|------------|---------|--------------|
| **Autonomous agents** | Parallel `/api/ai/autonomous/*`, mock executor, orphaned approval UI | Hide from product; keep backend scaffolding |
| **Proactive autonomous actions** | `AIWidget.proactiveMode` unwired; scheduler never started | Remove or gate UI toggles |
| **Cross-module “insights”** | Hardcoded synthetic blocks in `CrossModuleContextEngine` | Strip from user-facing prompts until data-backed |
| **Global/collective patterns in chat** | Sparse data, privacy-sensitive | Admin/analytics only until opt-in UX matures |
| **Business AI learning events** | Prisma model, no code path | Document as future |
| **PatternAnalysisScheduler** | Never instantiated | Do not start without closed learning loop |
| **Legacy LearningEngine** | TODO storage in `DigitalLifeTwinService` legacy path | Deprecate |

### 1.4 Autonomy-related inventory (de-emphasis targets)

**LIVE (keep — prompt boundaries only):**

- `AIAutonomySettings` model and CRUD (`aiAutonomySettingsService.ts`, `ai-autonomy.ts`)
- `PreferenceResolver` → autonomy boundary lines in assembled context
- `AutonomyControls.tsx` under Behavior tab (relabel, not remove)
- `buildInfluenceStack.ts` / effective-preferences preview

**DORMANT (hide/de-emphasize):**

| Location | Issue |
|----------|-------|
| `web/src/components/ai/AutonomousActions.tsx` | More → Actions; mock execution UX |
| `web/src/components/ai/AIOnboardingFlow.tsx` | “AI can take actions on your behalf” |
| `web/src/components/ai/ApprovalManager.tsx` | Orphaned component |
| `web/src/components/widgets/AIWidget.tsx` | `proactiveMode` toggle (unwired) |
| `web/src/components/ai/PredictiveIntelligenceDashboard.tsx` | “Proactive recommendations” marketing |
| `server/src/routes/ai/autonomous.ts` | Parallel autonomous stack |
| `server/src/ai/actions/AutonomousActionExecutor.ts` | Mostly `console.log` |
| `server/src/ai/autonomy/AutonomyManager.ts` | Not wired to main twin execution |
| `server/src/ai/approval/ApprovalManager.ts` | Marks approved without executing |
| `DigitalLifeTwinCore.determineActions` | Keyword stubs with autonomy thresholds |

**Safe rename vocabulary:** suggestions, recommendations, assisted workflows, approval-required actions, action boundaries.

---

## 2. Phase 1 — Memory

**Goal:** Make Vssyl visibly remember and adapt to the user over time.

**North-star:** A day-30 user receives measurably different, more personalized responses than a day-1 user. Users see which memories influenced a response and can edit or forget memory.

### Phase 1A — Tenancy, schema hardening, and data integrity

**Work:**

- Add `householdId` to `UserMemoryFact` **or** remove `household` from create schema until supported (product decision in 1A).
- Enforce `businessId` filter in `getRelevantUserMemoryFacts`, `listUserMemoryFacts`, and API list when `context.businessId` present.
- Validate `dashboardId` / `businessId` on create against authorized tenant context.
- Apply `expiresAt` filter in all read paths (Service, Resolver, list).
- Add `PATCH /api/ai/memory/facts/:id` for edit (subject, predicate, confidence, expiresAt).
- Optional dedupe: hash `(userId, subject, predicate, scope, businessId)` on create.

**Likely files:**

| Action | Path |
|--------|------|
| Modify | `prisma/modules/ai/user-memory.prisma` |
| Modify | `server/src/services/userMemoryFactService.ts` |
| Modify | `server/src/controllers/userMemoryFactController.ts` |
| Modify | `server/src/routes/userMemoryFacts.ts` |
| Modify | `server/src/ai/preferences/PreferenceResolver.ts` |
| Modify | `web/src/api/aiMemoryFacts.ts` |
| Create | `server/src/services/__tests__/userMemoryFactService.test.ts` |
| Migration | `20260522xxxxxx_user_memory_fact_tenancy` (if schema changes) |

**Acceptance criteria:**

- [ ] Business workspace chat never loads another business’s memory facts.
- [ ] Expired facts never appear in twin or Control Center list.
- [ ] User can edit a fact without delete+recreate.
- [ ] Integration test covers business scoping regression.

### Phase 1B — Memory model: explicit vs inferred, provenance, categories

**Work:**

- Extend fact model (or metadata JSON) with:
  - `sourceType`: `explicit_user` | `remember_that` | `inferred_chat` | `questionnaire` | `import`
  - `category`: e.g. `preference`, `person`, `project`, `constraint`, `location`, `other`
  - `explicit`: boolean (user-authored vs system-inferred)
- Wire `sourceConversationId` / `sourceMessageId` on remember-that and future extraction paths.
- Consolidate duplicate memory concepts: document when to use `UserMemoryFact` vs `UserAIContext` (preference type).
- Default confidence by source type; allow user override on explicit facts.

**Likely files:**

| Action | Path |
|--------|------|
| Modify | `prisma/modules/ai/user-memory.prisma` |
| Modify | `userMemoryFactService.ts`, `factExtractionService.ts` |
| Modify | `server/src/ai/preferences/buildResponseInfluence.ts` |
| Create | `server/src/ai/memory/memoryFactTypes.ts` |
| Migration | `20260522xxxxxx_user_memory_fact_provenance` |

**Acceptance criteria:**

- [ ] Every fact created via API or heuristic has `sourceType` populated.
- [ ] Memory tab shows source badge (explicit / from chat / remember that).
- [ ] Docs updated in `memory-bank/AI_CONTEXT_MEMORY_ARCHITECTURE.md` § fact types.

### Phase 1C — Retrieval layer: relevance, recency, confidence, token budget

**Work:**

- Create **`MemoryRetrievalService`** (single entry for twin + resolver):
  - Score: `confidence * recencyWeight * lexicalRelevance * scopeMatch`
  - Recency: exponential decay on `updatedAt` (configurable half-life)
  - Recall intent: existing recall-biased path from `recallIntent.ts`
  - Non-recall: inject top-N high-confidence recent facts (not keyword-only)
  - Token budget: cap injected predicate chars (align with assembler 600-char truncate)
- Remove duplicate parallel queries (Service pre-load + Resolver top-5).
- Emit retrieval report object for diagnostics (fact ids, scores, reason codes).

**Likely files:**

| Action | Path |
|--------|------|
| Create | `server/src/ai/memory/MemoryRetrievalService.ts` |
| Create | `server/src/ai/memory/memoryScoring.ts` |
| Modify | `DigitalLifeTwinService.ts`, `PreferenceResolver.ts`, `AIContextAssembler.ts` |
| Modify | `server/src/ai/types/pipelineDiagnostics.ts` (memory influence fields) |
| Create | `server/src/ai/memory/__tests__/memoryRetrieval.test.ts` |

**Acceptance criteria:**

- [ ] Single retrieval path used by twin and effective-preferences preview.
- [ ] Day-30 fixture user (seeded facts) gets measurably more fact tokens in assembled context than day-1 user in integration test.
- [ ] `pipelineTrace` includes `memoryFactsLoaded`, `memoryFactsInfluenced`, top fact ids (no raw predicate text in logs).

### Phase 1D — Prompt injection rules and influence UX

**Work:**

- Formalize injection tiers in assembler:
  - Explicit user facts → always in profile tier when retrieved
  - Inferred facts → require confidence ≥ threshold; mark in block metadata
- Extend `buildResponseInfluence` / `metadata.responseInfluence` with memory items (`kind: memory_fact`, id, subject, sourceType, confidence).
- Chat: **`AIResponseExplainDrawer`** shows “Memories that shaped this reply” with links to Memory tab.
- Memory tab: “Why I remembered this” expandable on each fact (source message link when available).

**Likely files:**

| Action | Path |
|--------|------|
| Modify | `buildResponseInfluence.ts`, `buildInfluenceItems.ts` |
| Modify | `web/src/components/ai/AIResponseExplainDrawer.tsx` |
| Modify | `AIMemoriesView.tsx` |
| Modify | `DigitalLifeTwinCore.ts` (attach influence metadata) |

**Acceptance criteria:**

- [ ] User can open explain drawer and see which memory facts influenced the last reply.
- [ ] Influence metadata never includes other users’ or other tenants’ facts.
- [ ] Conversation mode stays lean (memory block still private via `assembledContext`).

### Phase 1E — Memory UX completion and tests

**Work:**

- Memory tab: edit, forget (soft delete), filter by scope/category/source.
- Optional: “Pin” high-priority facts (schema flag or confidence bump).
- Optional expiration UI (date picker on create/edit).
- Unify effective-preferences preview: either embed in Memory tab or cross-link from Identity with “Manage in Memory”.
- Mark `docs/plans/AI_MEMORIES_VIEW_PLAN.md` superseded (errata header only).

**Tests:**

| Test | Path |
|------|------|
| Retrieval scoring unit | `memoryRetrieval.test.ts` |
| Tenancy integration | extend `ai-memory-routes.integration.test.ts` |
| Assembler memory block | extend `recallContextAssembly.test.ts` |
| Influence metadata | extend `buildResponseInfluence.test.ts` |
| Day-1 vs day-30 personalization | new `aiMemoryPersonalization.integration.test.ts` |

**Phase 1 exit criteria (all required):**

- [ ] Day-30 user measurably different responses vs day-1 (fixture or integration assertion).
- [ ] System shows which memories influenced a response (explain drawer + metadata).
- [ ] Users can edit and forget memory.
- [ ] No business/household scope leaks.
- [ ] No regressions to recall, vision, or provider fallback.

---

## 3. Phase 2 — Learning Engine

**Goal:** Move from static memory to adaptive intelligence with transparent, user-controlled learning.

**North-star:** Learning signals flow back into prompt assembly through preferences or memory. The system can explain what changed and why. No hidden creepy personalization.

### Phase 2A — Learning signal model and event contract fix

**Work:**

- Define canonical **`LearningProposal`** type: `{ id, source, signalType, target: preference | memory | pattern, payload, confidence, status }`.
- Fix `AILearningEvent` read/write contract:
  - Dedicated JSON column `artifact` **or** standardize on `newBehavior` parsing
  - Align event types (`pattern` vs `pattern_discovery`)
- Stop synchronous spam: do not create pattern/prediction/insight rows on every interaction; batch or upsert by key.
- Filter `PersonalLearningEventsReview` to human-reviewable types only.

**Likely files:**

| Action | Path |
|--------|------|
| Modify | `prisma/modules/ai/ai-models.prisma` (optional `artifact` column) |
| Modify | `AdvancedLearningEngine.ts` |
| Modify | `personalAILearningEventsService.ts` |
| Create | `server/src/ai/learning/learningProposalTypes.ts` |
| Migration | if schema change |

**Acceptance criteria:**

- [ ] `getUserPatterns` / `getRecentInsights` return valid data or empty (no parse errors).
- [ ] Interaction creates ≤1 primary learning event + async derived events (not 4+ sync rows).

### Phase 2B — Behavioral signal collection

**Work:**

- Instrument explicit signals (server-side, tenant-scoped):
  - Recommendation accepted / ignored / dismissed (structured action buttons, proactive suggestions)
  - Repeated user corrections (same intent, corrected within N turns)
  - Module usage patterns (which modules referenced in queries — from pipeline trace)
  - Interaction outcomes (user thumbs, regenerate, edit-and-resend if available)
- Persist to `AILearningEvent` or new `UserLearningSignal` table (prefer extend existing model first).
- No signal collection without dashboard/user scope.

**Likely files:**

| Action | Path |
|--------|------|
| Modify | `server/src/routes/ai.ts` (feedback endpoints) |
| Modify | `proactiveSuggestionsService.ts` (accept/dismiss → signal) |
| Create | `server/src/services/userLearningSignalService.ts` |
| Modify | `web/src/api/aiResponseInfluence.ts` or new client |

**Acceptance criteria:**

- [ ] Accept/dismiss on suggestions writes a typed learning signal.
- [ ] Signals include `dashboardId` / `businessId` when in workspace context.

### Phase 2C — Analytics-to-memory/preference pipeline

**Work:**

- **`LearningApplicationService`**: promotes high-confidence signals to:
  - `UserAIContext` (preference, pending → user promotes **or** auto-promote above threshold with notice)
  - `UserMemoryFact` (factual corrections)
  - Questionnaire-shaped `AIPersonalityProfile` fields (map trait keys correctly)
- Reinforcement/weakening: bump confidence on confirmation; decay on repeated ignore.
- Preference shift detection: compare rolling window vs baseline; surface in Learning tab (“What changed”).
- Wire validated/applied events into **`PreferenceResolver`** (optional read path for `validated && applied` events above confidence floor).

**Likely files:**

| Action | Path |
|--------|------|
| Create | `server/src/ai/learning/LearningApplicationService.ts` |
| Modify | `PreferenceResolver.ts`, `userAIContextLearningService.ts` |
| Modify | `PersonalLearningEventsReview.tsx`, `AILearningHub` |
| Modify | `AdvancedLearningEngine.ts` (delegate apply step) |

**Acceptance criteria:**

- [ ] Approving a learning event creates or updates identity/memory (not just `validated: true`).
- [ ] Learning tab shows “What changed” with before/after summary for last promotion.
- [ ] Resolver consumes at least one learning-derived preference in integration test.

### Phase 2D — Learning observability and collective learning decision

**Work:**

- Pipeline diagnostics: learning stages (extract → pending → promote → resolver).
- Learning confidence on each applied change; expose in Identity influence stack.
- **Product decision:** collective/global patterns — keep admin-only **or** opt-in UX for `allowCollectiveLearning`; never silent injection.
- Start or delete `PatternAnalysisScheduler` (wire in `index.ts` **or** remove file).

**Likely files:**

| Action | Path |
|--------|------|
| Modify | `pipelineDiagnostics.ts`, `buildPipelineTrace.ts` |
| Modify | `CentralizedLearningEngine.ts` |
| Modify | `LearningDashboard.tsx` (remove fake fallback metrics) |

**Phase 2 exit criteria:**

- [ ] Learning signals flow into prompt assembly (preferences or memory).
- [ ] System explains what changed and why (Learning tab + optional explain drawer).
- [ ] User-visible controls for all personalization (promote/dismiss/forget).
- [ ] No autonomy/auto-execution introduced.

---

## 4. Phase 3 — Cross-Module Intelligence

**Goal:** Make context synthesis real, not concatenation. Diagnostics distinguish “context available” vs “context used.”

**North-star:** AI responses show clear evidence of using multiple modules when relevant. Diagnostics reveal thin or missing context.

### Phase 3A — Context density audit and per-request report

**Work:**

- Extend `pipelineTrace` / twin metadata with **context density report**:
  - Providers attempted / succeeded / failed / cache hit
  - Memory facts loaded vs injected
  - Module contexts loaded vs ranked into final blocks
  - Token budget: allocated vs used per tier
  - Synthetic vs live block flags
- Admin test lab + optional user-facing debug (dev flag): show last request report.
- Align `ai-context-debug` with dry-run `assembleAIContext` (deprecate raw dump-only path).

**Likely files:**

| Action | Path |
|--------|------|
| Create | `server/src/ai/context/contextDensityReport.ts` |
| Modify | `buildPipelineTrace.ts`, `mapPipelineTraceInputs.ts` |
| Modify | `server/src/routes/ai-context-debug.ts` |
| Modify | `web/src/components/admin-portal/ai-pipeline/AITestLabPanel.tsx` |

**Acceptance criteria:**

- [ ] Every twin response metadata includes context density summary (counts, not raw payloads).
- [ ] Admin can see which providers failed and why (timeout, 404, auth).

### Phase 3B — Fetch policy and provider cache fixes

**Work:**

- Fetch **medium** relevance modules when multi-module intent detected (new analyzer or catalog intent).
- **Per-provider cache keys** on `moduleInstallation` (not one blob per module).
- Provider selection by sub-intent (e.g. Drive `recent_files` vs `storage_overview`).
- Complete @mention aliases for todo, notes, place, dashboard.
- Pass `businessId` consistently to all business module providers.

**Likely files:**

| Action | Path |
|--------|------|
| Modify | `ModuleAIContextService.ts`, `CrossModuleContextEngine.ts` |
| Modify | `registerBuiltInModules.ts` |
| Modify | `prisma/modules/business/modules.prisma` (cache structure if needed) |
| Migration | if cache schema changes |

**Acceptance criteria:**

- [ ] Multi-module query (e.g. “meeting tomorrow and files we shared”) loads ≥2 module contexts in trace.
- [ ] Cache hit does not return wrong provider payload for multi-provider modules.

### Phase 3C — Context synthesis layer

**Work:**

- Remove or gate **synthetic** cross-module insights from enterprise/conversation prompts until data-backed.
- Add optional **`ContextSynthesisService`**:
  - Input: ranked module payloads + memory + calendar/chat links
  - Output: single “Cross-module summary” block (deterministic merge first; optional LLM summarize behind flag)
- Implement **entity linking** v1: shared people (chat participants ↔ calendar attendees), file ids from chat attachments ↔ drive.
- Replace `identifyCrossModuleConnections` keyword templates with linked entities when available.

**Likely files:**

| Action | Path |
|--------|------|
| Create | `server/src/ai/context/ContextSynthesisService.ts` |
| Create | `server/src/ai/context/entityLinking.ts` |
| Modify | `CrossModuleContextEngine.ts`, `DigitalLifeTwinCore.ts`, `AIContextAssembler.ts` |

**Acceptance criteria:**

- [ ] Integration test: chat + drive + calendar fixture produces synthesis block with linked entities.
- [ ] No synthetic insight blocks in production prompts unless `AI_SYNTHETIC_CONTEXT_ENABLED=true` (dev only).
- [ ] User-visible replies reference multiple modules when fixture data supports it (assertion in test lab).

### Phase 3D — Context budget manager and “used vs available”

**Work:**

- Refine **`ContextBudgetManager`**: explicit allocation per tier; log dropped blocks with reason.
- Mark blocks in assembled context: `available: true`, `usedInPrompt: true/false`, `relevanceScore`.
- Structured response: optional `contextUsed` section in metadata for explain drawer (module names only).

**Likely files:**

| Action | Path |
|--------|------|
| Modify | `AIContextAssembler.ts`, `contextProfile.ts` |
| Modify | `buildResponseInfluence.ts`, `AIResponseExplainDrawer.tsx` |

**Phase 3 exit criteria:**

- [ ] Evidence of multi-module use when relevant (tests + trace).
- [ ] Diagnostics show missing/thin context explicitly.
- [ ] Clear distinction between available and used context in metadata.

---

## 5. Phase 4 — Platform Extensibility

**Goal:** Internal modular architecture → early platform capability for modules and partners.

**North-star:** A module registers AI context in a standardized way. Typed events emit and consume without rewriting core. Webhook support is pluggable.

### Phase 4A — Domain event standardization and AI consumption

**Work:**

- Audit emit coverage; add high-value events: `CHAT_MESSAGE_SENT`, `CALENDAR_EVENT_CREATED`, module enable/disable.
- **`AIEventConsumer`**: subscribe to domain events → learning signals / memory candidates (no auto-exec).
- Document event payload schemas in `docs/architecture/DOMAIN_EVENTS.md`.
- Ensure activity vs domain event separation per module contract.

**Likely files:**

| Action | Path |
|--------|------|
| Modify | `server/src/events/domainEventRegistry.ts`, module emitters |
| Create | `server/src/ai/consumers/AIEventConsumer.ts` |
| Modify | `server/src/index.ts` (register subscriber) |

**Acceptance criteria:**

- [ ] File upload domain event creates optional proactive suggestion (existing) + learning signal stub.
- [ ] AI consumer does not emit activity for failed/unauthorized paths.

### Phase 4B — Module AI Context API hardening

**Work:**

- Public/internal **`AI Context API`** spec: auth, tenant headers, response shape, cache TTL, max payload size.
- Certification checklist item: every marketplace module must register `contextProviders` + at least one provider endpoint.
- Reference implementation audit against `registerBuiltInModules.ts` pattern.
- Admin validation: provider health check from AI Pipeline console.

**Likely files:**

| Action | Path |
|--------|------|
| Create | `docs/guides/AI_CONTEXT_PROVIDER_API.md` |
| Modify | `memory-bank/aiContextSystem.md`, `moduleSpecs.md` |
| Modify | admin pipeline registry validation |

**Acceptance criteria:**

- [ ] New built-in module can be added by checklist without twin code changes.
- [ ] Provider timeout/failure surfaces in context density report.

### Phase 4C — Webhook and outbound subscriptions (plan + MVP)

**Work:**

- Design webhook system: subscription registry, HMAC signing, retry, dead-letter.
- MVP: internal webhook executor path in `ActionExecutorRegistry` (already has webhook type) with one test target.
- Outbound event subscriptions for business admins (module install, file share) — API stub + admin UI shell.

**Likely files:**

| Action | Path |
|--------|------|
| Create | `docs/architecture/WEBHOOK_SUBSCRIPTIONS.md` |
| Create | `prisma/modules/platform/webhook-subscriptions.prisma` (when approved) |
| Modify | `ActionExecutorRegistry.ts` |
| Migration | when schema approved |

**Acceptance criteria:**

- [ ] Test module registers context + webhook executor; twin tool call hits webhook in integration test.
- [ ] Signed payload verified in test receiver.
- [ ] No partner in-process code (iframe/artifact only).

### Phase 4D — Developer documentation and SDK boundaries

**Work:**

- **`docs/guides/MODULE_AI_SDK_BOUNDARIES.md`**: what partners can/cannot do (context providers, action executors, events, no autonomy).
- Update third-party pipeline docs with AI maturity gates.
- Sample module in `docs/test-modules/` demonstrates full AI contract.

**Phase 4 exit criteria:**

- [ ] Standard module AI context registration documented and cert-tested.
- [ ] Typed domain events consumed by AI layer.
- [ ] Webhook MVP without core rewrites.

---

## 6. Autonomy de-emphasis plan

Execute **in parallel with Phase 1A** (UI/copy only; no backend deletion).

| Step | Action | Files |
|------|--------|-------|
| A1 | Relabel Behavior tab copy: “Action boundaries” not “Autonomous AI” | `AutonomyControls.tsx`, `AIBehaviorHub.tsx`, `buildInfluenceStack.ts` |
| A2 | Hide **More → Actions** (`AutonomousActions`) behind env `NEXT_PUBLIC_AI_ACTIONS_UI=false` or remove from nav | `aiControlCenterTabs.ts`, `ai/page.tsx` |
| A3 | Soften onboarding: boundaries not autonomous execution | `AIOnboardingFlow.tsx` |
| A4 | Remove or hide unwired **Proactive Mode** toggle | `AIWidget.tsx` |
| A5 | Tone down predictive dashboard copy | `PredictiveIntelligenceDashboard.tsx` |
| A6 | Mark `/api/ai/autonomous/*` deprecated in code comments; no new features | `autonomous.ts`, `AutonomyManager.ts` |
| A7 | Do not wire `AutonomyManager` to auto-execute; keep prompt boundaries via `PreferenceResolver` only | — |
| A8 | Admin docs: autonomy settings = suggestion boundaries | `admin-portal/ai-context/page.tsx` |

**Do not delete** `AutonomyManager`, `ActionExecutorRegistry`, or approval models unless they cause user confusion or security risk — prefer hide + deprecate.

---

## 7. Testing strategy

| Layer | Focus | Existing patterns |
|-------|-------|-------------------|
| **Unit** | Memory scoring, retrieval, learning proposal parse, context budget, recall intent | `server/src/ai/**/__tests__/*` |
| **Integration** | Memory CRUD tenancy, twin assembly, learning promote → resolver | `ai-memory-routes.integration.test.ts`, `aiMemoryRecall.integration.test.ts` |
| **Provider mock** | OpenAI/Anthropic request shape, vision parts, tool loop, fallback on 429 | `buildProviderData.test.ts`, extend with mock fetch |
| **Memory retrieval** | Day-1 vs day-30 fixture, recall vs non-recall | new in Phase 1C |
| **Learning signals** | Accept/dismiss → promote → prompt block | extend `userAIContextLearningService.test.ts` |
| **Context density** | Multi-module fetch, synthetic gating, provider failure | new in Phase 3A |
| **Structured response** | Renderer visibility, sections, actions | `aiResponseRendererVisibility.test.ts`, `normalizeAIResponse.test.ts` |
| **Regression** | Provider fallback, conversation mode lean profile, vision pipeline | `digitalLifeTwinPromptPipeline.test.ts`, manual golden rules checklist |

**CI expectation:** `pnpm lint`, `pnpm type-check`, targeted `pnpm --filter vssyl-server test` for touched paths before merge.

---

## 8. Observability strategy

| Signal | Implementation | Storage / access |
|--------|----------------|------------------|
| **Structured logs** | `logger` with `operation`, `requestId`, `userId` (never raw predicates or secrets) | Cloud Run logs |
| **Pipeline trace** | Existing `metadata.pipelineTrace` on twin responses | Admin AI Pipeline, conversation metadata |
| **Context density** | Phase 3A report object | Trace + optional `AIPipelineDiagnostic` sample |
| **Memory influence** | Fact ids, scores, counts (no predicate text) | Trace + `responseInfluence` |
| **Learning signals** | Stage timings, promotion results | Trace + Learning tab API |
| **Provider fallback** | Provider chosen, fallback reason, vision model | Existing provider logs + trace |
| **Metrics (future)** | Counters: retrieval latency, provider errors, facts injected | Optional Prometheus/Datadog — defer until Phase 3A |

**Request ID:** propagate from `POST /api/ai/twin` through Service → Core → providers → trace (verify existing chain).

**Admin vs user visibility:**

- Admin: full trace, evidence bundle, context density, provider errors.
- User: explain drawer (influence only), Memory/Learning tabs — transparent, no raw assembled dump.

---

## 9. Implementation sequencing (Cursor-sized subphases)

| Order | Subphase | Depends on | Est. focus |
|-------|----------|------------|------------|
| 0 | **Autonomy de-emphasis A1–A8** | — | Copy/UI gates |
| 1 | **1A** Tenancy & PATCH | — | Schema + authZ |
| 2 | **1B** Provenance & categories | 1A | Schema + UI badges |
| 3 | **1C** MemoryRetrievalService | 1A | Core retrieval |
| 4 | **1D** Influence UX | 1C | Explain drawer |
| 5 | **1E** Memory UX + tests | 1B–1D | Ship Phase 1 |
| 6 | **2A** Learning event contract | 1E | Stop event spam |
| 7 | **2B** Signal collection | 2A | Instrumentation |
| 8 | **2C** Apply pipeline | 2B | Closed loop |
| 9 | **2D** Learning observability | 2C | Ship Phase 2 |
| 10 | **3A** Context density report | 2D | Diagnostics |
| 11 | **3B** Fetch & cache fixes | 3A | Module reliability |
| 12 | **3C** Synthesis layer | 3B | Real cross-module |
| 13 | **3D** Budget & used vs available | 3C | Ship Phase 3 |
| 14 | **4A** Domain events + AI consumer | 3D | Platform events |
| 15 | **4B** Context API docs + cert | 4A | Module contract |
| 16 | **4C** Webhook MVP | 4B | Outbound |
| 17 | **4D** SDK boundaries doc | 4C | Ship Phase 4 |

**Migration discipline:** All Prisma changes via `prisma/modules/**` → `pnpm prisma:build` → `pnpm prisma migrate dev --create-only` → review SQL → deploy.

**Preserved throughout:** Vision/attachments, provider routing, module registry startup, Next.js proxy auth, business workspace boundaries (`businessWorkspaceBoundaries.ts`).

---

## 10. Success metrics (implementation-level, not marketing)

| Metric | How to measure |
|--------|----------------|
| Personalization delta | Integration test: fact tokens / influence items day-30 > day-1 |
| Memory transparency | Explain drawer shows ≥1 memory item when facts retrieved |
| Learning loop closure | Promoted learning event appears in effective-preferences within 1 request |
| Cross-module usage | Trace shows ≥2 modules loaded on multi-module fixture queries |
| Context honesty | Synthetic blocks = 0 in prod prompts (flag off) |
| Trust | Zero cross-tenant memory leaks in integration suite |
| Autonomy safety | No UI promises autonomous execution; no auto-exec code paths added |

---

## Approval

This plan is **documentation only** until approved. Implementers must follow [`AI_PLATFORM_EXECUTION_PRINCIPLES.md`](./AI_PLATFORM_EXECUTION_PRINCIPLES.md) for every subphase. Reply **`ACT`** with phase scope (e.g. “ACT Phase 1A + Autonomy A1–A4”) to begin implementation.

After each subphase: update `memory-bank/progress.md` and `memory-bank/activeContext.md` with status — do not duplicate full architecture here.
