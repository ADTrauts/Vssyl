# AI System Mental Model

**Program:** AI Architecture Phase 0 (reconciled to shipped Digital Life Twin routing)
**Date:** 2026-08-25
**Status:** Active — constitutional explanation for product owners and new developers
**Owner:** AI Platform / Architecture council
**Source of Truth for:** Plain-English AI mental model (what Vssyl AI *is*)
**Supporting:** [`AI_PLATFORM_CONSTITUTION.md`](./AI_PLATFORM_CONSTITUTION.md) · [`AI_CANONICAL_ROUTE_MAP.md`](./AI_CANONICAL_ROUTE_MAP.md) · [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md)
**Reading order:** [`AI_READING_GUIDE.md`](./AI_READING_GUIDE.md)
**Implementation authority:** GitHub `main` — `DigitalLifeTwinService` / `DigitalLifeTwinCore`

---

## One sentence

Vssyl AI is a **governed Digital Life Twin**: a shared runtime that makes small independent decisions about outcome, source need, capability, response shape, coaching, and context budget — then answers using authorized identity, memory, module/platform truth, tools, and provenance, while applications remain systems of record and model providers remain replaceable adapters.

---

## Foundational boundary (non-negotiable)

| Layer | Provides |
|-------|----------|
| **The LLM** | General intelligence, reasoning, language, explanation, and synthesis |
| **Vssyl** | Identity, authoritative/private truth, relevant context, memory, tools, permissions, policy, actions, provenance, and accountability |

Vssyl does **not** attempt to encode general world intelligence.
Learning is **not** the source of baseline intelligence — Learning is governed personalization and system improvement (observation, classification, review, durable preferences/knowledge where appropriate). General intelligence remains model capability. Current-turn routing and source requirements occur **before** post-turn learning.

---

## Six independent decisions (mental model)

The Twin does **not** classify the user into one giant domain. Each turn resolves small orthogonal axes (implementation: `inferStructuredResponseMode` / related utils — **not** a single new enum called “six decisions”).

| # | Decision | Question | Typical code signals |
|---|----------|----------|----------------------|
| 1 | **Requested outcome** | What is the user trying to accomplish? | `inferQueryIntent`, conversation objective |
| 2 | **Non-model truth / source need** | Does the answer materially depend on information outside base-model knowledge that Vssyl treats as authoritative/platform truth? | `requiresAuthoritativeContext` (coarse boolean — strongest for module/file/platform; see §Personal recall) |
| 3 | **Capability / action requirement** | Is retrieval, a tool, mutation, permission, or approval required? | `isActionMutationRequest` / `isActionRequest`, tools, grounding |
| 4 | **Response contract** | What *form* should the answer take? | `responseContract`: `conversation` \| `grounded_answer` \| `enterprise` |
| 5 | **Behavioral coaching** | Informational, recommendation/decision support, continuity, etc. | Coaching profiles; R1 keeps ordinary recommend as conversation |
| 6 | **Context scope / budget** | How much relevant context should enter the prompt? | `contextProfile`, `AIContextAssembler`, C3 module skip |

**Orthogonal (not the six):** provider/model selection · permissions/approvals · provenance/evidence · learning/post-turn observation.

---

## What happens when a user talks to Vssyl? (shipped order)

1. Authenticate, scope (personal and/or `businessId`), usage limits.
2. **`DigitalLifeTwinService`**: load current-thread history; **resolve canonical routing once** (`resolveCanonicalTwinRouting` → `inferStructuredResponseMode`).
3. Load recent conversation memory; run **personal recall** when recall intent fires; retrieve `UserMemoryFact`; optional “remember that” persist.
4. **`DigitalLifeTwinCore`**: **C3** — conditionally run module ContextProvider orchestration (`shouldRetrieveModuleContext`); always attempt V_Link path; handle attached files; preferences / business policy overlay.
5. Optional **pipeline grounding / source / tool prepass** (`runPipelineGroundingRetrieval`) — independent of C3.
6. **`AIContextAssembler`** builds the bounded prompt; coaching / structured format as needed.
7. Provider/model generates; tools mutate only through governed module services.
8. Post-turn learning/observation (unless opted out).

Full route map: [`AI_CANONICAL_ROUTE_MAP.md`](./AI_CANONICAL_ROUTE_MAP.md).

The model is a reasoning and language component. It is **not** the database, **not** the permission system, and **not** durable memory by itself.

---

## Personal vs Business — scopes, not engines

**PERSONAL** and **BUSINESS** are primarily **scopes of authorized reality/context**, not two separate intelligence engines.

| Scope may add | Examples |
|---------------|----------|
| **Business** | Tenant truth, module context, business policy, permissions, organizational state |
| **Personal** | Conversation history, durable personal memory, user preferences, personal platform state |

**Shared:** reasoning intelligence (one Digital Life Twin runtime).

- `businessId` identifies **which** tenant/business scope — **not** whether the question is about business state (B1 / B1-R).
- Business advice may stay conversational; a personal topic may request an enterprise-style deliverable.
- Canonical conversational path with business scope: **`POST /api/ai/twin` + `context.businessId`**.
- `BusinessAIDigitalTwinService` + `POST /api/business-ai/:businessId/interact` is a **legacy / mock / noncanonical** conversational path (config APIs remain). See [`AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md`](./AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md).

---

## Response contracts

Implementation: `responseContract.ts`. Format/deliverable shape — **not** a grounding flag and **not** a context budget.

| Contract | Means | Does **not** mean |
|----------|-------|-------------------|
| **`conversation`** | Natural conversational answer shape | Ungrounded · generic · no personalization |
| **`grounded_answer`** | Response materially depends on authoritative/private/source-backed truth (thin natural + evidence) | Full enterprise report |
| **`enterprise`** | Structured analytical/deliverable response shape | “Anything about a business” |

**R1 — Recommendation:** Recommendation/decision support is an **outcome / coaching behavior**. It does **not** inherently imply `enterprise`. Ordinary “what should I buy?”-style advice → `conversation` + recommendation coaching. Explicit detailed decision-matrix style deliverables → structured/`enterprise`.

---

## Personal factual recall (P-TRUTH)

Natural personal recall (“What did I say I liked?”, “What budget did I tell you?”, “What did we decide?”) uses existing systems:

- Current conversation history
- Recent conversation memory
- Cross-conversation message recall (`recallIntent` / `recallRelevantMessages`)
- `UserMemoryFact` via `MemoryRetrievalService`

**Current implementation nuance:** Pure memory/history recall often remains `requiresAuthoritativeContext = false` + `conversation`, because `groundingSatisfied` / authoritative semantics are still primarily **module/file/platform** oriented. That is **CURRENT IMPLEMENTATION**, not eternal philosophy.

Conceptually, personal recall is **non-model personal truth**. Do not pretend memory is model knowledge. Do not equate `reqAuth=false` with “all Vssyl context is useless.”

---

## Module ContextProviders

**ContextProviders** are Vssyl/module **senses** for retrieving curated module/platform context.

They are **not:** the entire Twin context system · personal memory · conversation history · generic web retrieval · general intelligence.

| Component | Role |
|-----------|------|
| **`ContextProviderOrchestrator`** | What module/platform information **can** be retrieved |
| **`AIContextAssembler`** | What bounded context **actually** enters the provider/model prompt |

---

## C3 — conditional module ContextProvider skip

Safe conversational turns may **bypass MODULE ContextProvider orchestration** when resolved routing indicates:

- `responseContract === 'conversation'`
- `requiresAuthoritativeContext !== true`
- not an action request
- no attached files
- not a follow-up (`isFollowUp`)
- not broad discovery (`isBroadDiscovery`)

Implementation: `shouldRetrieveModuleContext`. This is an **execution optimization**. It does **not** create “LLM-only mode.” Independently available where applicable: conversation history, recalled messages, UserMemoryFact, preferences, identity, V_Link, grounding/source pipeline, tools, future live external retrieval.

**Broad discovery (`isBroadDiscovery`):** phrases like “What needs my attention?”, “Anything important?”, “What changed?” block C3 skip because scope is ambiguous. This is a **safety signal only** — not a completed cross-module attention product.

**F-GUARD:** Follow-up turns (`conversationHistory.length > 0`) remain protected from C3 module skipping. Intentionally conservative; full semantic source inheritance for all follow-ups is **not** claimed.

---

## Active module & business scope (W1 / B1)

| Signal | Means | Does **not** mean |
|--------|-------|-------------------|
| **`currentModule`** | Contextual hint for bounded module-relative shorthand | Global semantic override / query domain |
| **`businessId`** | Which tenant/business scope | Whether the question is about business state |

Calendar + “What’s next?” → Calendar context may be required.
Calendar + “Help me with my school paper.” → should **not** become Calendar truth.

---

## Actions (A2)

Action detection distinguishes **imperative mutation/capability** requests from **historical/read** questions.

| Example | Classification |
|---------|----------------|
| “Tell Sarah I’ll be late.” | Action |
| “What did I tell Sarah?” | Read / recall |
| “What did I tell you my budget was?” | Personal recall — not communication action |

Do not claim unsupported purchase/booking/external action capabilities.

---

## Truth / source families (conceptual only)

Useful architecture vocabulary — **NOT** a formal runtime `SourceRequirement[]` enum:

GENERAL MODEL KNOWLEDGE · TURN ASSERTION · CONVERSATION HISTORY · DURABLE PERSONAL MEMORY · PERSONAL PLATFORM STATE · BUSINESS PLATFORM STATE · PROVIDED SOURCE / ATTACHMENT · CONNECTED PRIVATE SOURCE · LIVE EXTERNAL SOURCE · TOOL/ACTION RESULT

Distinguish **CURRENT CONCEPTUAL MODEL** from **CURRENT IMPLEMENTATION REPRESENTATION** (coarse booleans + recall signal + pipeline catalog sources).

**`requiresAuthoritativeContext`:** coarse boolean — “does answering materially depend on non–base-model information Vssyl currently treats as authoritative/platform truth?” Strongest for module/file/platform; personal recall uses a separate signal; live external truth is not implemented. Not a complete source planner. Do not rename in docs-only work.

---

## Pipeline role

Pipeline owns **source/retrieval policy, grounding, evidence, enforcement, diagnostics, capability/tool planning**. It is **not** the primary owner of user-outcome classification; Twin routing (`inferStructuredResponseMode` and related) owns turn outcome / contract axes.

---

## V_Link / Context Graph / Connected Knowledge

| System | Role |
|--------|------|
| **V_Link** | Persisted / cross-module relationship layer |
| **Context Graph** | Federated relationship / context capability |
| **Connected Knowledge** | Authorized provenance-bearing composition of connected knowledge |

These are **not** replacements for memory, module ContextProviders, outcome routing, or source-need decisions. They operate alongside / downstream of source and context discovery as appropriate. See [`AI_GRAPH_INTERACTION_MODEL.md`](./AI_GRAPH_INTERACTION_MODEL.md), [`V_LINK.md`](./V_LINK.md), Connected Knowledge constitution.

---

## Live External Truth — NOT SHIPPED

`web_search` exists only as a pipeline catalog / source / tool **concept**, disabled/unwired stub, and failed-attempt/trace capability. There is **no** real executor, no successful Twin web retrieval, no complete web grounding, no reliable citation/freshness path.

**LIVE EXTERNAL TRUTH = FUTURE PRODUCT CAPABILITY** (should eventually fit existing tool/source architecture). Canonical docs must not imply live web access today.

**External capability design (Places, Routes, web):** [`AI_EXTERNAL_CAPABILITY_MODEL.md`](./AI_EXTERNAL_CAPABILITY_MODEL.md) — canonical contract; **not shipped**. Do not conflate `place_search` / Vssyl Place with Google Places.

---

## The pieces (plain English)

### Shared Digital Life Twin

One conversational runtime (`DigitalLifeTwinService` → `DigitalLifeTwinCore`). Personal and Business are **scopes**, not separate products.

### Knowledge

Information that may legitimately influence answers: taught facts, approved learning, live application data, business policies — with ownership, review, and deletion. Knowledge Decision Model ≠ Knowledge Engine (composition runtime).

### Intelligence

Ability to reason well over knowledge and context — routing, grounding quality, coaching, evaluations, safety. Not a pile of private customer facts. See [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md).

### Context

What is true *for this turn*: identity, workspace, conversation, permissions, and relevant records fetched when needed. Mostly temporary. Not automatically “learning.”

### Learning

Governed process of turning observations or teaching into prompt-eligible knowledge — usually with review for inferred items. Not model fine-tuning; not how Vssyl acquires general intelligence.

### Systems of Record

Applications own entities. AI **reads** through authorized ContextProviders and **writes** only through domain services.

### Model providers

External (or local) LLM adapters. Product logic must not depend on a single vendor’s marketing names.

---

## Architectural anti-patterns (guardrails)

DO NOT:

- Create domain-specific AI brains for ordinary subject matter
- Equate `businessId` with business intent
- Equate `currentModule` with query domain
- Equate recommendation with `enterprise` contract
- Equate `conversation` with ungrounded
- Equate `requiresAuthoritativeContext=false` with “all Vssyl context is useless”
- Equate C3 with LLM-only mode
- Use Learning to recreate general model intelligence
- Add a new routing authority when an existing owner should be refined
- Use ContextProviders as a universal context system
- Silently claim live/current facts without a live source
- Imply `web_search` / Live External Truth is shipped

---

## Future capability boundaries (not current central routing)

Documented as **out of current shipped central routing** — no implementation plans here:

- Live External Truth / real `web_search`
- Memory sensitivity governance; project/episode/class/trip memory scopes
- Natural-language correction/forget improvements
- Vague Scheduling / workforce_comms shorthand
- Broad cross-module “attention” product
- Formal 0..N source-kind runtime representation
- Purchase/booking action capabilities
- Further follow-up optimization beyond F-GUARD

---

## What is implemented today (honest summary)

| Capability | Today |
|------------|--------|
| Shared Digital Life Twin (`POST /api/ai/twin`) | **Shipped — canonical** |
| Business-scoped Twin via `businessId` + policy overlay | **Shipped** |
| Six-axis style routing + response contracts | **Shipped** |
| C3 conditional module ContextProvider skip | **Shipped** |
| Personal memory / recall | **Shipped** |
| Module ContextProviders | **Shipped** (conditional on C3) |
| Pipeline grounding & diagnostics | **Shipped** |
| Governed learning review | **Shipped** (surfaces still evolving) |
| Live External Truth / `web_search` | **NOT SHIPPED** (stub) |
| `BusinessAIDigitalTwinService` `/interact` chat | **Noncanonical / mock** |
| Task-tier model routing (FAST/BALANCED/DEEP) | **Future design** |
| Industry knowledge packs | **Future** |

---

## What this document is not

- Not a replacement for the AI Platform Constitution (principles and boundaries).
- Not an inventory of every class and route (see System Audit / subsystem inventory).
- Not a license to redesign runtime in documentation-only phases.

---

## Related documents

| Need | Document |
|------|----------|
| Reading order | [`AI_READING_GUIDE.md`](./AI_READING_GUIDE.md) |
| Canonical Twin flow | [`AI_CANONICAL_ROUTE_MAP.md`](./AI_CANONICAL_ROUTE_MAP.md) |
| Context assembly | [`AI_CONTEXT_ASSEMBLY.md`](./AI_CONTEXT_ASSEMBLY.md) |
| Topology diagram | [`AI_PLATFORM_CANONICAL_DIAGRAM.md`](./AI_PLATFORM_CANONICAL_DIAGRAM.md) |
| Knowledge vs Intelligence | [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md) |
| Platform law | [`AI_PLATFORM_CONSTITUTION.md`](./AI_PLATFORM_CONSTITUTION.md) |
| Personal vs business | [`AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md`](./AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md) |
| Subsystem status | [`AI_PLATFORM_SUBSYSTEM_INVENTORY.md`](./AI_PLATFORM_SUBSYSTEM_INVENTORY.md) |
