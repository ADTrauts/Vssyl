# Vssyl Knowledge Engine Specification

**Program:** AI Knowledge Reference Program — Phase 0B  
**Date:** 2026-07-05  
**Status:** Canonical specification — **no implementation in this phase**  
**Constraint:** No new memory store. No knowledge graph. No architecture redesign.

---

## 1. What is the Vssyl Knowledge Engine?

The **Vssyl Knowledge Engine** is not a single service or database. It is the **governed composition layer** that turns information from Vssyl Applications into usable organizational intelligence at answer time.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VSSYL KNOWLEDGE ENGINE (conceptual)                   │
│                                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐   ┌────────────┐ │
│  │  OBSERVE    │ → │   GOVERN     │ → │  RETRIEVE   │ → │  REASON    │ │
│  │  (apps +    │   │  (teach +    │   │  (memory +  │   │  (twin +   │ │
│  │   chat)     │   │   policies)  │   │   providers)│   │   LLM)     │ │
│  └─────────────┘   └──────────────┘   └─────────────┘   └────────────┘ │
│         ↑                  ↑                  ↑                  ↓       │
│         └──────────────────┴──────────────────┴──────── FEEDBACK ──────┘
└─────────────────────────────────────────────────────────────────────────┘
```

**Vssyl provides organizational intelligence.** OpenAI and Anthropic provide reasoning models. The Knowledge Engine is how Vssyl **selects, scopes, governs, and proves** what the model sees — across Drive, Chat, Calendar, Tasks, Notes, V_Link, Business, Scheduling, HR, Analytics, Marketplace, and future Applications.

**Model training is out of scope.** Improvement happens via context engineering, governed teaching, pipeline policies, and eval loops.

---

## 2. Does Vssyl already have a Knowledge Engine?

**Yes — as distributed components.** Phase 0B names and specifies the engine; it does **not** require building a new monolith.

### Component inventory

| Component | Role in Knowledge Engine | Engine layer |
|-----------|-------------------------|--------------|
| **Digital Life Twin** (`DigitalLifeTwinService` + `DigitalLifeTwinCore`) | Per-turn orchestration: assemble → reason → answer → trace | Reason + Answer |
| **Business Digital Twin** (`BusinessAIDigitalTwinService`) | Business-scoped voice, restrictions, employee interact | Govern + Reason |
| **Context Provider Orchestrator** | Live Application data fetch across 35 module providers | Retrieve (live) |
| **MemoryRetrievalService** | Scored retrieval of taught facts | Retrieve (taught) |
| **UserAIContext** + **PreferenceResolver** | Instructions, preferences, applied learning | Govern + Retrieve |
| **AILearningEvent** + **learningApplicationService** | Correction proposals → governed application | Govern |
| **V_Link** + **vlinkPipelineContextService** | Relationship intelligence across entities | Retrieve (graph) |
| **Unified search / aiRetrievalCapabilityService** | Query-native discovery across modules | Retrieve (search) |
| **Module context providers** | Authoritative Application SoR snapshots | Retrieve (live) |
| **Pipeline policies** (`AIPipeline*`) | Intent, grounding, tool governance | Govern (platform) |
| **Grounding rules** + **pipelineEnforcement** | Required sources, block/regenerate | Govern + Retrieve |
| **responseInfluence** (`buildResponseInfluence`) | User explainability of what shaped the answer | Feedback (user) |
| **AIPipelineDiagnostic** + **buildPipelineTrace** | Operator explainability and audit | Feedback (operator) |
| **AIMessageRecallIndex** | Semantic recall of past messages | Retrieve (experiential) |
| **AIConversation** summaries/topics | Cross-session continuity | Retrieve (experiential) |
| **factExtractionService** | Post-chat observation → pending context | Observe |
| **GlobalPattern** (consent-gated) | Collective patterns | Retrieve (optional) |

### What is missing (product layer, not engine core)

| Gap | Type |
|-----|------|
| Unified Teach Vssyl UX | Product |
| Correction router in chat | Product |
| Business learning application parity | Backend glue |
| EvalCase → CI regression loop | Evaluation |
| User-facing "Knowledge Health" dashboard | Product |
| Single naming for dual memory SoR | Governance UX |

**Verdict:** Vssyl does **not** need a new Knowledge Engine service. It needs a **canonical specification** binding existing components under one lifecycle and teach model.

---

## 3. Engine responsibilities (canonical)

### 3.1 From Applications to organizational intelligence

Applications are **systems of record (SoR)**. The Knowledge Engine **never forks** module data into AI-only tables for entity attributes.

| Application | Intelligence path | Teach surface? |
|-------------|-------------------|----------------|
| Drive | `drive.*` providers + file analysis on attach | No — edit in Drive |
| Chat | `chat.*` providers | No — edit in Chat |
| Calendar | `calendar.*` providers | No — edit in Calendar |
| Tasks / Todo | `todo.*` providers | No — edit in Tasks |
| Notes / Notebook | `notes.*`, `notebook.*` providers | No — edit in Notes |
| V_Link | `vlink.*` provider + graph pipeline | No — edit in V_Link |
| HR | `hr.*` providers (business-scoped) | No — edit in HR |
| Scheduling | `scheduling.*` providers | No — edit in Scheduling |
| Workforce Comms | `workforce_comms.*` providers | No — edit in module |
| Place | `place.*` providers | No — edit in Place |
| Dashboard / Analytics | `dashboard.*` providers + analytics summary | No — edit in module |
| Business workspace | `BusinessAIDigitalTwin` + `business_context` platform source | Business admin teach |
| Marketplace (future) | Module providers via registry | Per module |

**Organizational intelligence** = taught knowledge (facts, policies, preferences) **plus** authorized live Application snapshots **plus** platform governance rules — assembled per turn.

### 3.2 From user correction to governed knowledge

See [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md) and [AI_CORRECTION_ROUTING_SPEC.md](./AI_CORRECTION_ROUTING_SPEC.md).

Summary:

```
Bad answer → Classify → Route to store → Review (if required) → Apply → Retrievable on next turn
```

### 3.3 From governed knowledge to future answers

Per turn in `DigitalLifeTwinCore`:

1. **PreferenceResolver** — personality, autonomy, active context, applied learning
2. **MemoryRetrievalService** — relevant `UserMemoryFact` rows
3. **Pipeline grounding** — required sources for detected intent
4. **ContextProviderOrchestrator** — live Application providers
5. **AIContextAssembler** — tiered merge into provider context
6. **conversationReasoningLayer** — pre-provider reasoning (conversation mode)
7. **Provider call** — OpenAI/Anthropic/local with assembled context

Taught knowledge influences answers through **retrieval and assembly**, not weight updates.

### 3.4 Proving the AI improved

See [AI_KNOWLEDGE_EVAL_LOOP_SPEC.md](./AI_KNOWLEDGE_EVAL_LOOP_SPEC.md).

Minimum proof before Teach Vssyl ships:

1. Approved correction appears in retrieval report for matching query
2. Assembled context block contains taught content
3. CI regression test fails if retrieval path breaks

Optional later: LLM-graded response quality in admin test lab.

---

## 4. Engine boundaries

### In scope (Knowledge Engine)

- What gets remembered vs fetched live
- Who can teach what scope
- How corrections route to stores
- How retrieval prioritizes taught vs live vs policy
- How explainability surfaces influence
- How evals prove teach loop works

### Out of scope (do not conflate)

| Concern | Owner |
|---------|-------|
| LLM model weights | OpenAI / Anthropic |
| Module business logic | Each Application module |
| Pipeline policy editing | Platform operators |
| Payment / query balance | Commercial layer |
| Autonomous action execution | Action executor + approvals (adjacent) |

---

## 5. Twin roles in the engine

| Twin | Scope | Knowledge responsibility |
|------|-------|-------------------------|
| **Digital Life Twin** | Personal (+ optional business context overlay) | Personal taught knowledge, personal providers, personal preferences |
| **Business Digital Twin** | Business workspace | Business policy, restrictions, admin-approved business learning, business-scoped providers |

**Rule:** Personal memory does not leak across users. Business policy overlays personal preferences when `businessId` is set in chat context — never the reverse.

---

## 6. Relationship to AI Pipeline (Operations Platform)

The AI Pipeline is the **operator control plane** for the Knowledge Engine's governance layer:

| Pipeline section | Engine function |
|------------------|-----------------|
| Intents | Classify queries → drive retrieval plan |
| Grounding | Require Application sources for high-risk intents |
| Sources | Catalog what can be retrieved |
| Tools | Govern write actions |
| Diagnostics | Prove what was retrieved and why |
| Test Lab | Dry-run engine behavior |
| Quality | Detect weak generic answers |

Users and business admins **teach content**. Operators **teach behavior rules** (policies). These must remain separate.

---

## 7. No new stores required

Phase 0A/0B audit confirms:

- **No new `KnowledgeGraph` table** — V_Link + context-graph + composition orchestrator suffice
- **No new `TeachVssylFact` table** — use `UserMemoryFact`
- **No `PromptOverride` table** — pipeline policies + provider prompts
- **No unified knowledge table** — product taxonomy maps to existing stores via [KNOWLEDGE_TYPE_TO_STORE_MATRIX.md](./KNOWLEDGE_TYPE_TO_STORE_MATRIX.md)

Future consolidation of `UserMemoryFact` + `UserAIContext` is a **UX and routing** concern, not a Phase 1 schema change.

---

## 8. Canonical terms (product language)

| Term | Meaning |
|------|---------|
| **Knowledge Engine** | The governed composition system (this spec) |
| **Taught knowledge** | User/business explicitly or approved-implicitly stored intent |
| **Live knowledge** | Application SoR fetched at query time |
| **Platform rules** | Pipeline policies and static prompts |
| **Teach Vssyl** | Product flow to add or correct taught knowledge |
| **Organizational intelligence** | Taught + live + governed assembly for a workspace |

---

## 9. Related documents

| Document | Purpose |
|----------|---------|
| [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md) | End-to-end lifecycle stages |
| [TEACH_VSSYL_PRODUCT_SPEC.md](./TEACH_VSSYL_PRODUCT_SPEC.md) | Product surfaces and flows |
| [KNOWLEDGE_TYPE_TO_STORE_MATRIX.md](./KNOWLEDGE_TYPE_TO_STORE_MATRIX.md) | Type → store mapping |
| [AI_CORRECTION_ROUTING_SPEC.md](./AI_CORRECTION_ROUTING_SPEC.md) | Correction governance |
| [AI_KNOWLEDGE_EVAL_LOOP_SPEC.md](./AI_KNOWLEDGE_EVAL_LOOP_SPEC.md) | Proof of improvement |
| `docs/ai-knowledge/deep-dive/` | Phase 0A audit evidence |
