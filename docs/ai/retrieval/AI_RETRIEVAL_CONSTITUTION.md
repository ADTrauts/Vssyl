# AI Retrieval Constitution

**Program:** AI Retrieval Adapter — Phase 2A  
**Version:** 1.0.0  
**Ratified:** 2026-06-23  
**Status:** **Constitutional** — permanent platform law for AI discovery infrastructure  
**Authority:** Peer to [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md), [SEARCH_CONSTITUTION.md](../../search/SEARCH_CONSTITUTION.md), [AI_PLATFORM_CONSTITUTION.md](../../architecture/AI_PLATFORM_CONSTITUTION.md)

**Capability id:** `ai_retrieval`

---

## 1. Purpose

AI Retrieval is **platform discovery orchestration for AI**. It answers:

> *How does AI find platform information the user is authorized to see, in a normalized and auditable way?*

It is **not** a product module, not a RAG system, not a vector store, and not a substitute for module context providers or user memory.

---

## 2. Architectural law

### 2.1 Hybrid model (Option B)

1. **Query-driven discovery** flows through the Retrieval Adapter → Unified Search.
2. **Curated summaries** remain module context providers (`upcoming_tasks`, `recent_files`, …).
3. **Memory and preferences** remain independent — never routed through Search.
4. **Specialized signals** (V_Link pipeline, graph bundle, location) compose with adapter evidence — do not replace it for entity discovery.

### 2.2 Capability boundary

| Layer | Owner | May |
|-------|-------|-----|
| **Retrieval Adapter** | `aiRetrievalCapabilityService` | Orchestrate discovery, map evidence, emit diagnostics |
| **Unified Search** | `searchCapabilityService` | PE gate, provider fan-out, `SearchResult` |
| **AI consumers** | Pipeline, twin, tools (when wired) | Call `discover()` or pipeline hook |
| **Context providers** | Modules | Summaries, rollups, time-window lists |
| **Twin / assembler** | AI Platform | Consume evidence; never bypass adapter for query-discovery |

AI controllers and twin paths **must not** implement parallel Prisma search for query-shaped discovery when adapter is wired for that intent class.

---

## 3. Retrieval guarantees

Every retrieval consumer **must**:

| # | Guarantee |
|---|-----------|
| **G-R1** | **Respect permissions** — discovery via Unified Search only; inherit `search:read` and entity read policy |
| **G-R2** | **Respect tenant boundaries** — pass `dashboardId`, `businessId`, `householdId` when in scoped context |
| **G-R3** | **Use approved retrieval paths** — `discover()` or `runPipelineRetrievalDiscovery`; no shadow search |
| **G-R4** | **Produce evidence** — `AIRetrievalEvidence[]` for every successful or denied discovery attempt |
| **G-R5** | **Emit diagnostics** — `AIRetrievalDiagnostics` with pathway, timing, provider participation |
| **G-R6** | **Fail closed on deny** — empty evidence + `permissionEnforcementStatus: denied`; never partial unauthorized hits |
| **G-R7** | **Preserve additive behavior** — adapter supplements existing providers; does not replace on wire without migration plan |
| **G-R8** | **Declare consumer intent** — `intent` field set for wired paths |
| **G-R9** | **Honor feature flags** — respect `AI_RETRIEVAL_*` opt-outs without silent fallback to shadow paths |

---

## 4. Retrieval prohibitions

Consumers and platform code **must not**:

| # | Prohibition |
|---|-------------|
| **P-R1** | **Bypass permissions** — no direct visibility calls for query-discovery when adapter is mandated |
| **P-R2** | **Bypass retrieval capability** — no duplicate `executeGlobalSearch` orchestration in AI layer |
| **P-R3** | **Fabricate evidence** — evidence must derive from `SearchResult` mapping only |
| **P-R4** | **Create shadow retrieval systems** — parallel Prisma search in twin for entity discovery |
| **P-R5** | **Conflate discovery with memory** — user memory facts are not Search evidence |
| **P-R6** | **Conflate discovery with activity** — activity feed is not retrieval evidence |
| **P-R7** | **Expose `discover()` publicly** — internal capability; no unauthenticated HTTP |
| **P-R8** | **Claim retrieval compliance without tests** — consumer wiring requires adapter test coverage |
| **P-R9** | **Replace context providers with Search** — summaries and rollups stay provider-owned |

---

## 5. Evidence law

Evidence objects **must** conform to `AIRetrievalEvidence`:

- `sourceType: 'search'`
- `permissionsVerified` reflects entity permission state
- `route` is a non-empty deep link
- `confidence` is normalized 0–1 when score present
- `retrievedAt` is ISO-8601

Evidence is **AI-consumable fact**, not prompt text. Prompt assembly is downstream.

---

## 6. Relationship to Search Constitution

| Search rule | Retrieval obligation |
|-------------|---------------------|
| G-S1 Permissions | Inherited — adapter never weakens |
| G-S2 Tenant boundaries | Passed via `filters.context` |
| G-S4 Policy Engine | `search:read` at Search orchestrator |
| P-S2 Bypass PE | Prohibited in adapter and consumers |
| P-S8 Search ≠ activity | Retrieval diagnostics ≠ activity records |

Closing **SC-M4** (Search) requires documented adapter adoption — not adapter redesign.

---

## 7. Amendment process

1. Architecture council proposes amendment with impact on Search and AI Platform constitutions.
2. Update [AI_RETRIEVAL_PLATFORM_STANDARD.md](./AI_RETRIEVAL_PLATFORM_STANDARD.md) and consumer compliance docs.
3. Record in [CERTIFICATION_LEDGER.md](../../architecture/CERTIFICATION_LEDGER.md).

---

**Last updated:** 2026-06-23
