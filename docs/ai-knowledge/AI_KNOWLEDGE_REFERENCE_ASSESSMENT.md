# AI Knowledge Reference Assessment

**Program:** AI Knowledge Reference Program — Phase 0A  
**Date:** 2026-07-05  
**Method:** Codebase inventory (Prisma, `server/src/ai`, `/ai`, `/admin-portal/ai-pipeline`, Memory Bank)

---

## 1. Inventory summary

Vssyl AI knowledge is **not one database table**. It is a **stack of stores + live fetches + assembly + governance**, centered on `POST /api/ai/twin`.

| Layer | Count | Role |
|-------|------:|------|
| Persistent user/business stores | 12+ models | What Vssyl "knows" over time |
| Platform policy stores | 6 pipeline models | What operators require/forbid |
| Module registry + cache | 2 models | What modules declare and cache |
| Live context providers | 30+ endpoints | What modules expose at query time |
| Ephemeral assembly | 5+ services | What merges into each turn |
| Operator surfaces | 11 routes | How platform inspects/configures |

---

## 2. Master inventory

Legend: **U** = user-facing, **O** = operator-facing, **E** = editable by intended owner

| Source | Model / path | Purpose | Owner | E | U path | O path | Scope | Persistence | AI influence | Discoverability | Problems |
|--------|--------------|---------|-------|---|--------|--------|-------|-------------|---------------|-----------------|----------|
| **User AI context** | `UserAIContext` | Freeform instructions, facts, preferences, workflows; chat-inferred with `learningStatus` | User | ✓ | `/ai?tab=memory` | — | personal/business/module/folder/project | Postgres | High — prompt block "USER-DEFINED CONTEXT" | Memory tab | Overlaps memory facts; pending vs active confusing |
| **User memory facts** | `UserMemoryFact` | Structured subject/predicate ("remember that…") | User | ✓ | `/ai?tab=memory` | — | personal/business/household | Postgres | High — `MemoryRetrievalService` | Memory tab, chat phrase | Overlaps `UserAIContext`; user sees both |
| **Personal learning events** | `AILearningEvent` | Corrections, reinforcements, patterns from modules/chat | User + platform write | Review | `/ai?tab=learning` | Diagnostics link | Per user, `sourceModule` | Postgres | Medium — applied events via `PreferenceResolver` | Learning tab | Not same as Memory; overlap with inferred context |
| **Global learning** | `GlobalLearningEvent`, `GlobalPattern`, `CollectiveInsight` | Cross-user anonymized patterns (consent) | Platform | — | `/ai` Insights (optional) | Pipeline quality | Hashed userId | Postgres | Low–medium — collective block in twin | Buried in More → Insights | Users unclear on opt-in |
| **Personality profile** | `AIPersonalityProfile` | Questionnaire, soft communication prefs | User | ✓ | `/ai?tab=behavior` | — | Per user | Postgres | High — system prompt section | Behavior tab | Overlaps preference context entries |
| **Autonomy settings** | `AIAutonomySettings` | Module autonomy, approval thresholds | User | ✓ | `/ai?tab=behavior` | — | Per user | Postgres | High — action boundaries | Behavior tab | Technical framing for end users |
| **User preferences** | `UserPreference` (`ai_preferred_*`) | Provider/model selection | User | ✓ | `/ai` → Provider | — | Per user | Postgres | Medium — provider routing | More → Provider | Not "knowledge" but affects answers |
| **Session soft prefs** | `ai-session-preferences.ts` | Ephemeral tone/verbosity | User | ✓ session | Chat session | — | Session | Ephemeral | Medium | None | Can promote to profile — invisible path |
| **AI conversations** | `AIConversation`, `AIMessage` | Chat threads, attachments, `threadSummary`, `topics` | User | ✓ | `/ai-chat` | — | Optional dashboard/business | Postgres | High — same-thread history | Chat nav | Dual history with `AIConversationHistory` |
| **Message recall index** | `AIMessageRecallIndex` | Lexical embedding for recall-intent queries | Platform auto | — | Recall phrasing in chat | — | Per user | Postgres JSON | Medium — gated by recall intent | None — magic phrases | Users don't know recall exists |
| **Conversation history (analytics)** | `AIConversationHistory` | Full turn log for diagnostics | Platform | Feedback | — | Diagnostics trace | Per user/session | Postgres | Indirect | — | Duplicates chat persistence |
| **Module AI registry** | `ModuleAIContextRegistry` | Keywords, patterns, provider URLs | Platform / module author | Admin | — | `/admin-portal/modules` | Global per module | Postgres | High — routing + provider list | Admin modules | Drift vs live wiring |
| **User context cache** | `UserAIContextCache` | 15-min assembled context cache | Platform | — | — | — | Per user | Postgres TTL | Medium | — | Hidden from users |
| **Module context providers** | `/api/{module}/ai/context/*` | Live SoR snapshots | Module data owners | Via modules | Indirect (`@mentions`, chat) | Test Lab health | Tenant-scoped | Live | High | @module mentions | 11+ modules — no user catalog |
| **Drive files** | `File` + `fileAnalysisService` | Attachments, summaries, OCR, vision | User | ✓ Drive | `/ai-chat` attach; Drive "Ask AI" | Sources registry | dashboard/business | Postgres + ephemeral extract | High when attached | Drive, chat | Size limits not obvious to users |
| **V_Links** | `vlink.prisma` + `vlinkPipelineContextService` | Relationship containers | User/business | ✓ V_Link UI | Chat (relationship queries) | Sources registry | Tenant | Live + Postgres | High for relationship intents | Place module | Overlaps graph bundles |
| **Context graph** | `server/src/context-graph/*` | Traverse links → bundles | Platform | Via entity edits | Indirect | Sources + diagnostics | Tenant | Per request | High | None | No user-facing "graph" |
| **Knowledge composition** | `server/src/knowledge/*` | Neighborhoods, convergence bundles | Platform | — | — | Diagnostics | Tenant | Ephemeral | Medium | — | Phase 1A/1B — operator-only |
| **Unified search retrieval** | `aiRetrievalCapabilityService` | Query-native discovery | Platform | — | Indirect in twin | Platform programs | Tenant filters | Live | High on search intents | Search UI separate from teach | Users don't connect search to AI |
| **Calendar / Chat / HR / …** | Module providers | Domain snapshots | Workspace members | Via modules | `@calendar` etc. | Provider health | Tenant | Live | High when intent matches | @mentions docs | Teach flow doesn't mention modules |
| **Business profile AI** | `Business.aiSettings` Json | Business-wide AI JSON settings | Business admin | ✓ | `/business/[id]/ai` | Businesses ops | Per business | Postgres | High in business context | Business AI CC | Overlaps `BusinessAIDigitalTwin` |
| **Business digital twin** | `BusinessAIDigitalTwin` | Enterprise twin config, personality, restrictions | Business admin | ✓ | `/business/[id]/ai` | Admin business detail | Per business | Postgres | High | Business AI CC | Duplicate config surface |
| **Business AI interactions** | `BusinessAIInteraction` | Enterprise query/response audit | Business | — | Employee AI drawer | Business analytics API | Per business | Postgres | Audit only | — | Not user "knowledge" |
| **Business AI learning** | `BusinessAILearningEvent` | Admin-approved business learning | Business admin | Approve | Business AI learning tab | — | Per businessAI | Postgres | Medium | Business AI | Parallel to personal learning |
| **Pipeline intent policies** | `AIPipelineIntentPolicy` | Intent catalog, grounding flags | Platform admin | ✓ | — | `/admin-portal/ai-pipeline/intents` | Global | Postgres | High — intent routing | Pipeline hub | Operator-only |
| **Grounding rules** | `AIPipelineGroundingRulePolicy` | Required sources per intent | Platform admin | ✓ | — | `/admin-portal/ai-pipeline/grounding` | Global | Postgres | High | Pipeline hub | Users never see grounding |
| **Context source policies** | `AIPipelineContextSourcePolicy` | Source catalog, `wiredInTwin` | Platform admin | ✓ | — | `/admin-portal/ai-pipeline/sources` | Global | Postgres | High | Pipeline hub | Drift vs registry |
| **Tool policies** | `AIPipelineToolPolicyRow` | Tool availability, risk | Platform admin | ✓ | — | `/admin-portal/ai-pipeline/tools` | Global | Postgres | High — actions | Pipeline hub | — |
| **Pipeline settings** | `AIPipelineSettings` | Weak phrases, enforcement, retention | Platform admin | ✓ | — | `/admin-portal/ai-pipeline/quality` | Global singleton | Postgres | Medium | Pipeline hub | — |
| **Pipeline diagnostics** | `AIPipelineDiagnostic` | Per-turn trace, evidence, issues | Platform | — | — | `/admin-portal/ai-pipeline/diagnostics` | Per turn | Postgres | Diagnostic | Diagnostics nav | Best explainability surface — operator only |
| **Policy audit** | `AIPipelinePolicyAuditLog` | Admin policy edit trail | Platform | — | — | `/admin-portal/ai-pipeline/audit` | Global | Postgres | Governance | Audit page | — |
| **Static prompt modules** | `server/src/ai/prompts/*` | Platform prompt blocks | Platform | Code only | — | — | Global | Code | High | — | Invisible — correct for users |
| **Provider system prompts** | `OpenAIProvider.buildSystemPrompt` | Provider-specific assembly | Platform | — | — | Test Lab | Global | Code | High | — | — |
| **AI suggestions** | `AISuggestion`, signals, feedback | Ambient suggestions | User | Dismiss/act | `/ai?tab=suggestions` | — | Per user | Postgres | Low–medium | Suggestions tab | Separate from teach |
| **AI extracted expenses** | `AIExtractedExpense` | Document-derived facts from Drive | User | ✓ | Drive AI extraction | — | Per user/business | Postgres | Medium | Drive | Hidden as "knowledge" |
| **AI Control Center** | `/ai` tabs | Identity, Memory, Learning, Suggestions, Behavior | User | ✓ | `/ai` | — | Personal | Mixed | Orchestrates above | Nav + onboarding | **Canonical user teach surface** — naming fragmented |
| **AI Pipeline hub** | `PipelineOperationsHub` | Operator console | Platform admin | ✓ policies | — | `/admin-portal/ai-pipeline` | Global | Mixed | Governance + observe | Sidebar | Already multi-page — not overloaded |
| **AI Test Lab** | `AITestLabPanel` | Dry-run twin | Platform admin | — | — | `.../test-lab` | Global | Ephemeral | Test only | Hub card | — |
| **Provider governance** | `ProviderGovernancePanel` | OpenAI/Anthropic usage | Platform admin | — | — | Hub anchor + nav | Global | API | Cost/routing | Providers nav | Not knowledge — related |

---

## 3. Module context providers (built-in)

Registered in `server/src/startup/registerBuiltInModules.ts`:

| Module | Endpoints | Knowledge type |
|--------|-----------|----------------|
| drive | recent, storage | Documents, file metadata |
| chat | recent, unread | Conversation state |
| calendar | upcoming, today | Schedule facts |
| hr | overview, headcount, time-off | Workforce facts |
| scheduling | overview, coverage, conflicts | Shift facts |
| workforce-comms | overview, reach | Comms state |
| todo | overview, upcoming, overdue, priority | Task facts |
| notes | recent, pinned | Note content refs |
| vlinks | recent | Relationship containers |
| place | 5 providers | Location/social graph |
| dashboard | overview, quick-stats, widgets | Workspace stats |

**Certification:** `moduleContextProviderCertification.ts`, health in Test Lab.

---

## 4. Twin assembly order (canonical)

```
POST /api/ai/twin
  → DigitalLifeTwinService (history, cross-thread memory, recall, memory facts)
  → DigitalLifeTwinCore (PreferenceResolver, CrossModuleContextEngine, attachments, business policy)
  → assembleAIContext → provider prompts
```

Evidence: `memory-bank/AI_CONTEXT_MEMORY_ARCHITECTURE.md`, `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md`.

---

## 5. Major overlaps (detail)

### 5.1 Triple personal memory

| Store | When written | Prompt gate | User label |
|-------|--------------|-------------|------------|
| `UserAIContext` | Manual + chat inference | `learningStatus: active` | "Custom context" / Memories |
| `UserMemoryFact` | "remember that", manual | Always (non-trashed) | "Structured memories" |
| `AILearningEvent` | Module signals, corrections | `validated` + applied | "Learning events" |

**Problem:** User teaching one fact may create 0–2 records depending on path. No deduplication UX.

### 5.2 Conversation dual persistence

- **UI:** `AIConversation` / `AIMessage` — what users see in `/ai-chat`
- **Analytics:** `AIConversationHistory` — what diagnostics reference

### 5.3 Registry vs policy vs wiring

- `ModuleAIContextRegistry` — declared at startup
- `AIPipelineContextSourcePolicy` — operator catalog with `wiredInTwin`
- `ContextProviderOrchestrator` — actual fetch set per intent

**Risk:** Admin UI shows sources not fetched on a given turn.

### 5.4 Business config duplication

- `Business.aiSettings` (Json on Business row)
- `BusinessAIDigitalTwin` (dedicated model with personality, capabilities, restrictions)

---

## 6. Discoverability gaps

| User intent | Expected action | Actual path | Gap |
|-------------|-----------------|-------------|-----|
| Teach a fact | One "Teach" flow | Memory tab OR "remember that" | Two mental models |
| Fix wrong answer | "Correct this" | Learning tab (if event created) OR re-teach manually | No correction router |
| See what AI knows | One knowledge view | Memory tab (partial) | No documents/module data |
| Business policy | Business settings | Business AI CC | Separate from personal |
| Why this answer? | Explain | — | Operator diagnostics only |

---

## 7. Maturity by source class

| Class | Implementation | Product clarity |
|-------|---------------:|----------------:|
| Module live data | 90% | 40% |
| Personal memory | 85% | 50% |
| Personal learning | 75% | 45% |
| Business AI | 80% | 55% |
| Pipeline governance | 88% | 70% (operator) |
| Graph / V_Link | 75% | 25% |
| Explainability | 70% (tech) | 15% (user) |

---

## 8. References

- `memory-bank/aiContextSystem.md`
- `docs/ai/retrieval/AI_RETRIEVAL_CONTEXT_SOURCE_MAP.md`
- `docs/context-graph/CONTEXT_GRAPH_CURRENT_STATE_INVENTORY.md`
- `docs/guides/AI_CONTEXT_PROVIDER_API.md`
